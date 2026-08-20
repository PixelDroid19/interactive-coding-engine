import { CursorArea } from './cursorTrack';

export interface PointerSample {
  x: number;
  y: number;
  targetArea: CursorArea;
  clicked: boolean;
  time: number;
}

const MIN_INTERVAL_MS = 16;
const MIN_DISTANCE = 0.18;

/**
 * Drops redundant mousemove samples while keeping clicks, area changes,
 * and meaningful direction/position changes.
 */
export class CursorSampler {
  private last: PointerSample | null = null;

  reset(): void {
    this.last = null;
  }

  shouldRecord(sample: PointerSample): boolean {
    const previous = this.last;
    if (!previous) {
      this.last = sample;
      return true;
    }

    if (sample.clicked || previous.targetArea !== sample.targetArea) {
      this.last = sample;
      return true;
    }

    const dt = sample.time - previous.time;
    if (dt < MIN_INTERVAL_MS) return false;

    const dx = sample.x - previous.x;
    const dy = sample.y - previous.y;
    if (dx * dx + dy * dy < MIN_DISTANCE * MIN_DISTANCE && dt < 48) return false;

    this.last = sample;
    return true;
  }
}
