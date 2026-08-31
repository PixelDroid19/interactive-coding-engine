import React, { useEffect, useRef } from 'react';
import { Headphones } from 'lucide-react';
import type { WorkspaceSnapshot } from '../types/scrim';
import { useTheme } from '../themes/ThemeProvider';
import { liveHelpContextKey, type LiveHelpContext, type LiveHelpProposalEvent, type LiveHelpSnapshotPayload } from './protocol';
import type { LiveHelpWorkspaceAdapter } from './LiveHelpProvider';
import { useOptionalLiveHelp } from './LiveHelpProvider';
import { applyPatchProposal, type PatchProposalOutcome } from './workspace';

export interface LiveHelpWorkspaceBridgeProps {
  context: LiveHelpContext;
  workspace: WorkspaceSnapshot;
  onWorkspaceChange(next: WorkspaceSnapshot): void;
  onProposalApplied?(next: WorkspaceSnapshot): void;
  pause?(): void;
}

function snapshotFromWorkspace(workspace: WorkspaceSnapshot, revision: number): LiveHelpSnapshotPayload {
  return {
    revision,
    activeFile: workspace.activeFilePath,
    files: Object.values(workspace.files).map((file) => ({ path: file.path, content: file.content })),
  };
}

export function LiveHelpWorkspaceBridge({ context, workspace, onWorkspaceChange, onProposalApplied, pause }: LiveHelpWorkspaceBridgeProps) {
  const liveHelp = useOptionalLiveHelp();
  const { themeId } = useTheme();
  const contextKey = liveHelpContextKey(context);
  const workspaceRef = useRef(workspace);
  const contextRef = useRef(context);
  const changeRef = useRef(onWorkspaceChange);
  const proposalChangeRef = useRef(onProposalApplied);
  const pauseRef = useRef(pause);
  const revisionRef = useRef(0);
  const previousWorkspaceRef = useRef(workspace);
  const appliedWorkspaceRef = useRef<WorkspaceSnapshot | null>(null);
  const adapterRef = useRef<LiveHelpWorkspaceAdapter | null>(null);

  workspaceRef.current = workspace;
  contextRef.current = context;
  changeRef.current = onWorkspaceChange;
  proposalChangeRef.current = onProposalApplied;
  pauseRef.current = pause;

  useEffect(() => {
    revisionRef.current = 0;
    previousWorkspaceRef.current = workspace;
    appliedWorkspaceRef.current = null;
  }, [contextKey]);

  useEffect(() => {
    if (previousWorkspaceRef.current === workspace) return;
    previousWorkspaceRef.current = workspace;
    if (appliedWorkspaceRef.current === workspace) {
      appliedWorkspaceRef.current = null;
      return;
    }
    revisionRef.current += 1;
  }, [workspace]);

  if (!adapterRef.current) {
    adapterRef.current = {
      getContext: () => contextRef.current,
      captureSnapshot: () => snapshotFromWorkspace(workspaceRef.current, revisionRef.current),
      applyProposal: (event: LiveHelpProposalEvent): PatchProposalOutcome => {
        const result = applyPatchProposal({
          workspace: workspaceRef.current,
          revision: revisionRef.current,
          patch: event.payload.patch,
          pause: pauseRef.current,
          commit: (next) => {
            appliedWorkspaceRef.current = next;
            (proposalChangeRef.current ?? changeRef.current)(next);
          },
        });
        if (result.outcome === 'applied') revisionRef.current = result.revision;
        return result;
      },
    };
  }

  const registerWorkspace = liveHelp?.registerWorkspace;
  useEffect(() => registerWorkspace ? registerWorkspace(adapterRef.current!) : undefined, [contextKey, registerWorkspace]);
  if (!liveHelp?.canUseLiveHelp) return null;

  const status = liveHelp.session?.status === 'active' ? 'Sesión activa' : liveHelp.session?.status === 'accepted' ? 'Conectando' : liveHelp.session?.status === 'claimed' ? 'Consentimiento' : liveHelp.session?.status === 'requested' ? 'Esperando' : 'Ayuda en vivo';
  return <button type="button" className={`live-help-launcher${themeId === 'cyber' ? ' live-help-launcher--cyber' : ''}`} aria-label="Abrir ayuda en vivo" onClick={liveHelp.openPanel}><Headphones size={16} aria-hidden="true" /><span>{status}</span></button>;
}
