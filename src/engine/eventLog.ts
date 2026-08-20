import { ScrimEvent, SnapshotPoint, WorkspaceSnapshot, WorkspaceFile } from '../types/scrim';

/**
 * Deep clones a workspace snapshot so mutations never leak
 */
export function cloneWorkspace(ws: WorkspaceSnapshot): WorkspaceSnapshot {
  const clonedFiles: Record<string, WorkspaceFile> = {};
  for (const [key, file] of Object.entries(ws.files)) {
    clonedFiles[key] = { ...file };
  }
  return {
    files: clonedFiles,
    activeFilePath: ws.activeFilePath,
    cursorPosition: ws.cursorPosition ? { ...ws.cursorPosition } : undefined,
    selection: ws.selection ? { ...ws.selection } : undefined,
    layout: ws.layout ? { ...ws.layout } : undefined,
  };
}

/**
 * Applies a single event to a workspace state in-place or returning modified clone
 */
export function applyEventToWorkspace(ws: WorkspaceSnapshot, event: ScrimEvent): void {
  switch (event.type) {
    case 'file-switch': {
      if (ws.files[event.filePath]) {
        ws.activeFilePath = event.filePath;
      }
      break;
    }
    case 'file-create': {
      ws.files[event.file.path] = { ...event.file };
      ws.activeFilePath = event.file.path;
      break;
    }
    case 'file-delete': {
      delete ws.files[event.filePath];
      if (ws.activeFilePath === event.filePath) {
        const remaining = Object.keys(ws.files);
        ws.activeFilePath = remaining.length > 0 ? remaining[0] : '';
      }
      break;
    }
    case 'file-rename': {
      if (ws.files[event.oldPath]) {
        const file = ws.files[event.oldPath];
        delete ws.files[event.oldPath];
        file.path = event.newPath;
        file.name = event.newPath.split('/').pop() || event.newPath;
        ws.files[event.newPath] = file;
        if (ws.activeFilePath === event.oldPath) {
          ws.activeFilePath = event.newPath;
        }
      }
      break;
    }
    case 'code-change': {
      const file = ws.files[event.filePath];
      if (file) {
        if (event.fullContent !== undefined) {
          // If full content is provided, use it directly
          file.content = event.fullContent;
        } else if (event.changes && event.changes.length > 0) {
          // Apply changes in reverse order of position if needed, or sequential
          let currentContent = file.content;
          for (const change of event.changes) {
            const before = currentContent.slice(0, change.from);
            const after = currentContent.slice(change.to);
            currentContent = before + change.text + after;
          }
          file.content = currentContent;
        }
      }
      break;
    }
    case 'cursor-move': {
      if (event.filePath === ws.activeFilePath) {
        ws.cursorPosition = { ...event.position };
      }
      break;
    }
    case 'selection-change': {
      if (event.filePath === ws.activeFilePath) {
        ws.selection = { from: event.from, to: event.to };
      }
      break;
    }
    case 'run-code':
    case 'pointer-move':
    case 'preview-interaction':
    case 'challenge-marker':
    case 'chapter-marker':
      // These events affect runtime or player visual state, not workspace files
      break;
  }
}

/**
 * Reconstructs the workspace state at any target timestamp 'timeMs'
 * using nearest snapshot + replay of remaining events
 */
export function reconstructWorkspaceAt(
  initialWorkspace: WorkspaceSnapshot,
  events: ScrimEvent[],
  snapshots: SnapshotPoint[],
  timeMs: number
): {
  workspace: WorkspaceSnapshot;
  lastEventIndex: number;
  activePointer?: { x: number; y: number; targetArea: 'editor' | 'preview' | 'files'; clicked?: boolean };
  lastRunTimestamp?: number;
} {
  // 1. Find nearest preceding snapshot
  let baseWorkspace = cloneWorkspace(initialWorkspace);
  let startIndex = 0;

  if (snapshots && snapshots.length > 0) {
    let nearestSnapshot: SnapshotPoint | null = null;
    for (const snap of snapshots) {
      if (snap.timestamp <= timeMs) {
        if (!nearestSnapshot || snap.timestamp > nearestSnapshot.timestamp) {
          nearestSnapshot = snap;
        }
      }
    }

    if (nearestSnapshot) {
      baseWorkspace = cloneWorkspace(nearestSnapshot.workspace);
      startIndex = nearestSnapshot.eventIndex;
    }
  }

  // 2. Replay remaining events up to timeMs
  let lastEventIndex = startIndex - 1;
  let activePointer: { x: number; y: number; targetArea: 'editor' | 'preview' | 'files'; clicked?: boolean } | undefined;
  let lastRunTimestamp: number | undefined;

  for (let i = startIndex; i < events.length; i++) {
    const ev = events[i];
    if (ev.timestamp > timeMs) {
      break;
    }
    applyEventToWorkspace(baseWorkspace, ev);
    lastEventIndex = i;

    if (ev.type === 'pointer-move') {
      activePointer = {
        x: ev.x,
        y: ev.y,
        targetArea: ev.targetArea,
        clicked: ev.clicked,
      };
    } else if (ev.type === 'run-code') {
      lastRunTimestamp = ev.timestamp;
    }
  }

  return {
    workspace: baseWorkspace,
    lastEventIndex,
    activePointer,
    lastRunTimestamp,
  };
}

/**
 * Helper to generate pre-computed snapshot points every interval (e.g. every 5 seconds)
 */
export function generateSnapshots(
  initialWorkspace: WorkspaceSnapshot,
  events: ScrimEvent[],
  intervalMs = 5000
): SnapshotPoint[] {
  const snapshots: SnapshotPoint[] = [];
  const currentWs = cloneWorkspace(initialWorkspace);
  let nextSnapshotTime = intervalMs;

  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    applyEventToWorkspace(currentWs, ev);

    if (ev.timestamp >= nextSnapshotTime) {
      snapshots.push({
        timestamp: ev.timestamp,
        eventIndex: i + 1,
        workspace: cloneWorkspace(currentWs),
      });
      nextSnapshotTime = ev.timestamp + intervalMs;
    }
  }

  return snapshots;
}
