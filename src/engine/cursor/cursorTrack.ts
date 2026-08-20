import { PointerMoveEvent, ScrimEvent } from '../../types/scrim';

export type CursorArea = 'editor' | 'preview' | 'files';

export interface CursorKeyframe {
  time: number;
  x: number;
  y: number;
  targetArea: CursorArea;
  clicked: boolean;
}

export interface CursorPose {
  x: number;
  y: number;
  targetArea: CursorArea;
  clicked: boolean;
  visible: boolean;
}

const CLICK_HOLD_MS = 180;
/** Gaps this short are treated as continuous motion (full-interval lerp). */
const CONTINUOUS_GAP_MS = 3200;
/** After a rest, travel into the next keyframe over this window so we arrive on time. */
const APPROACH_MS = 380;
const DUPLICATE_EPS = 1e-6;

function clamp01(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t;
}

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

export function easeInOutCubic(t: number): number {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

function isClickedAt(keys: CursorKeyframe[], time: number): boolean {
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (!key.clicked) continue;
    if (time + 0.0001 >= key.time && time <= key.time + CLICK_HOLD_MS) return true;
  }
  return false;
}

/**
 * Sorted pointer keyframes plus O(log n) / incremental lookup.
 * Position is a pure function of playback time.
 */
export class CursorTrack {
  readonly keys: CursorKeyframe[];
  private index = 0;

  constructor(keys: CursorKeyframe[]) {
    this.keys = CursorTrack.normalize(keys);
  }

  static fromEvents(events: ScrimEvent[]): CursorTrack {
    const keys: CursorKeyframe[] = [];
    for (const event of events) {
      if (event.type !== 'pointer-move') continue;
      keys.push(CursorTrack.fromPointerEvent(event));
    }
    return new CursorTrack(keys);
  }

  static fromPointerEvent(event: PointerMoveEvent): CursorKeyframe {
    return {
      time: event.timestamp,
      x: clampPct(event.x),
      y: clampPct(event.y),
      targetArea: event.targetArea,
      clicked: Boolean(event.clicked),
    };
  }

  static normalize(input: CursorKeyframe[]): CursorKeyframe[] {
    const sorted = input
      .filter((key) => Number.isFinite(key.time) && Number.isFinite(key.x) && Number.isFinite(key.y))
      .map((key) => ({
        time: key.time,
        x: clampPct(key.x),
        y: clampPct(key.y),
        targetArea: key.targetArea,
        clicked: Boolean(key.clicked),
      }))
      .sort((a, b) => a.time - b.time);

    const merged: CursorKeyframe[] = [];
    for (const key of sorted) {
      const prev = merged[merged.length - 1];
      if (prev && Math.abs(prev.time - key.time) <= DUPLICATE_EPS) {
        prev.x = key.x;
        prev.y = key.y;
        prev.targetArea = key.targetArea;
        prev.clicked = prev.clicked || key.clicked;
        continue;
      }
      merged.push({ ...key });
    }
    return merged;
  }

  get length(): number {
    return this.keys.length;
  }

  seekIndex(time: number): number {
    this.index = this.binarySearchLastAtOrBefore(time);
    return this.index;
  }

  getPositionAt(time: number): CursorPose | undefined {
    const keys = this.keys;
    if (keys.length === 0 || !Number.isFinite(time)) return undefined;

    const i = this.advanceIndex(time);
    if (i < 0) {
      return { ...keys[0], clicked: false, visible: false };
    }

    const last = keys[i];
    const next = keys[i + 1];
    const clicked = isClickedAt(keys, time);

    if (!next) {
      return { x: last.x, y: last.y, targetArea: last.targetArea, clicked, visible: true };
    }

    const gap = next.time - last.time;
    if (gap <= DUPLICATE_EPS) {
      return { x: next.x, y: next.y, targetArea: next.targetArea, clicked, visible: true };
    }

    if (last.targetArea !== next.targetArea) {
      if (time < next.time) {
        return { x: last.x, y: last.y, targetArea: last.targetArea, clicked, visible: true };
      }
      return { x: next.x, y: next.y, targetArea: next.targetArea, clicked, visible: true };
    }

    const { originTime, destTime } = this.travelWindow(last.time, next.time);
    if (time <= originTime) {
      return { x: last.x, y: last.y, targetArea: last.targetArea, clicked, visible: true };
    }

    const span = destTime - originTime;
    const raw = span <= DUPLICATE_EPS ? 1 : (time - originTime) / span;
    const t = easeInOutCubic(raw);
    const { x, y } = this.interpolateSegment(i, t);

    return {
      x: clampPct(x),
      y: clampPct(y),
      targetArea: last.targetArea,
      clicked,
      visible: true,
    };
  }

  private travelWindow(fromTime: number, toTime: number): { originTime: number; destTime: number } {
    const gap = toTime - fromTime;
    if (gap <= CONTINUOUS_GAP_MS) {
      return { originTime: fromTime, destTime: toTime };
    }
    const travel = Math.min(APPROACH_MS, gap * 0.4);
    return { originTime: toTime - travel, destTime: toTime };
  }

  private interpolateSegment(i: number, t: number): { x: number; y: number } {
    const keys = this.keys;
    const a = keys[i];
    const b = keys[i + 1];
    const prev = keys[i - 1];
    const after = keys[i + 2];
    const useSpline =
      Boolean(prev && after && prev.targetArea === a.targetArea && after.targetArea === b.targetArea);

    if (!useSpline) {
      return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
      };
    }

    return {
      x: catmullRom(prev.x, a.x, b.x, after.x, t),
      y: catmullRom(prev.y, a.y, b.y, after.y, t),
    };
  }

  private advanceIndex(time: number): number {
    const keys = this.keys;
    let i = this.index;
    if (i < 0 || i >= keys.length) i = 0;

    if (keys[i] && keys[i].time <= time && (i + 1 >= keys.length || keys[i + 1].time > time)) {
      this.index = i;
      return i;
    }

    if (i + 1 < keys.length && keys[i].time <= time && keys[i + 1].time <= time) {
      while (i + 1 < keys.length && keys[i + 1].time <= time) i++;
      this.index = i;
      return i;
    }

    if (i > 0 && keys[i].time > time) {
      while (i > 0 && keys[i].time > time) i--;
      if (keys[i].time > time) {
        this.index = 0;
        return -1;
      }
      this.index = i;
      return i;
    }

    this.index = this.binarySearchLastAtOrBefore(time);
    return this.index;
  }

  private binarySearchLastAtOrBefore(time: number): number {
    const keys = this.keys;
    let lo = 0;
    let hi = keys.length - 1;
    let ans = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (keys[mid].time <= time) {
        ans = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return ans;
  }
}

export function poseFromTrack(
  track: CursorTrack,
  time: number
): { x: number; y: number; targetArea: CursorArea; clicked?: boolean } | undefined {
  const pose = track.getPositionAt(time);
  if (!pose || !pose.visible) return undefined;
  return {
    x: pose.x,
    y: pose.y,
    targetArea: pose.targetArea,
    clicked: pose.clicked || undefined,
  };
}
