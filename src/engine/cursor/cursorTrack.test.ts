import { describe, expect, it } from 'vitest';
import { PointerMoveEvent, ScrimEvent } from '../../types/scrim';
import { CursorSampler } from './cursorSampler';
import { CursorTrack, easeInOutCubic } from './cursorTrack';

function move(
  time: number,
  x: number,
  y: number,
  targetArea: PointerMoveEvent['targetArea'] = 'editor',
  clicked = false
): PointerMoveEvent {
  return {
    id: `p-${time}`,
    timestamp: time,
    type: 'pointer-move',
    x,
    y,
    targetArea,
    clicked,
  };
}

describe('easeInOutCubic', () => {
  it('maps 0 and 1 to endpoints', () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
  });

  it('is 0.5 at the midpoint', () => {
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 8);
  });
});

describe('CursorTrack.getPositionAt', () => {
  it('returns the midpoint of a two-point segment', () => {
    const track = new CursorTrack([
      { time: 0, x: 0, y: 0, targetArea: 'editor', clicked: false },
      { time: 100, x: 100, y: 50, targetArea: 'editor', clicked: false },
    ]);
    const mid = track.getPositionAt(50);
    expect(mid?.visible).toBe(true);
    expect(mid?.x).toBeCloseTo(50, 0);
    expect(mid?.y).toBeCloseTo(25, 0);
  });

  it('hits exact keyframes at the segment bounds', () => {
    const track = new CursorTrack([
      { time: 0, x: 0, y: 0, targetArea: 'editor', clicked: false },
      { time: 100, x: 100, y: 50, targetArea: 'editor', clicked: false },
    ]);
    expect(track.getPositionAt(0)).toMatchObject({ x: 0, y: 0, visible: true });
    expect(track.getPositionAt(100)).toMatchObject({ x: 100, y: 50, visible: true });
  });

  it('does not teleport across a 150ms hole', () => {
    const track = new CursorTrack([
      { time: 1000, x: 10, y: 10, targetArea: 'preview', clicked: false },
      { time: 1150, x: 80, y: 70, targetArea: 'preview', clicked: false },
    ]);
    const a = track.getPositionAt(1000);
    const b = track.getPositionAt(1075);
    const c = track.getPositionAt(1150);
    expect(a).toMatchObject({ x: 10, y: 10 });
    expect(c).toMatchObject({ x: 80, y: 70 });
    expect(b?.x).toBeGreaterThan(10);
    expect(b?.x).toBeLessThan(80);
    expect(b?.y).toBeGreaterThan(10);
    expect(b?.y).toBeLessThan(70);
  });

  it('keeps travelling during a long explanation instead of freezing until the end', () => {
    const track = new CursorTrack([
      { time: 0, x: 10, y: 10, targetArea: 'editor', clicked: false },
      { time: 8000, x: 90, y: 80, targetArea: 'editor', clicked: false },
    ]);
    const middle = track.getPositionAt(4000);
    const late = track.getPositionAt(7900);
    const end = track.getPositionAt(8000);
    expect(middle?.x).toBeGreaterThan(10);
    expect(middle?.x).toBeLessThan(90);
    expect(middle?.y).toBeGreaterThan(10);
    expect(middle?.y).toBeLessThan(80);
    expect(late?.x).toBeGreaterThan(10);
    expect(late?.x).toBeLessThan(90);
    expect(end).toMatchObject({ x: 90, y: 80 });
  });

  it('keeps the cursor on the click sample at the click timestamp', () => {
    const track = new CursorTrack([
      { time: 5000, x: 20, y: 20, targetArea: 'preview', clicked: false },
      { time: 5270, x: 64, y: 71, targetArea: 'preview', clicked: true },
      { time: 5400, x: 66, y: 73, targetArea: 'preview', clicked: false },
    ]);
    const atClick = track.getPositionAt(5270);
    expect(atClick).toMatchObject({ x: 64, y: 71, clicked: true, targetArea: 'preview' });
  });

  it('does not invent NaN when two samples share a timestamp', () => {
    const track = new CursorTrack([
      { time: 40, x: 10, y: 10, targetArea: 'editor', clicked: false },
      { time: 40, x: 12, y: 18, targetArea: 'editor', clicked: true },
    ]);
    const pose = track.getPositionAt(40);
    expect(pose?.x).toBe(12);
    expect(pose?.y).toBe(18);
    expect(pose?.clicked).toBe(true);
    expect(Number.isFinite(pose?.x)).toBe(true);
  });

  it('hides the cursor before the first sample', () => {
    const track = new CursorTrack([{ time: 250, x: 40, y: 40, targetArea: 'files', clicked: false }]);
    expect(track.getPositionAt(0)?.visible).toBe(false);
    expect(track.getPositionAt(250)?.visible).toBe(true);
  });

  it('holds the last sample after the track ends', () => {
    const track = new CursorTrack([{ time: 10, x: 7, y: 9, targetArea: 'files', clicked: false }]);
    expect(track.getPositionAt(5000)).toMatchObject({ x: 7, y: 9, visible: true });
  });

  it('describes a continuous transition when travelling across target areas', () => {
    const track = new CursorTrack([
      { time: 0, x: 50, y: 20, targetArea: 'files', clicked: true },
      { time: 400, x: 30, y: 40, targetArea: 'editor', clicked: false },
    ]);
    expect(track.getPositionAt(200)?.transition).toMatchObject({
      from: { x: 50, y: 20, targetArea: 'files' },
      to: { x: 30, y: 40, targetArea: 'editor' },
      progress: 0.5,
    });
    expect(track.getPositionAt(400)?.targetArea).toBe('editor');
    expect(track.getPositionAt(400)?.x).toBe(30);
  });

  it('clamps invalid coordinates', () => {
    const track = new CursorTrack([
      { time: 0, x: -20, y: 140, targetArea: 'editor', clicked: false },
      { time: 50, x: Number.NaN, y: 10, targetArea: 'editor', clicked: false },
    ]);
    expect(track.getPositionAt(0)).toMatchObject({ x: 0, y: 100 });
  });
});

describe('CursorTrack seek and playback independence', () => {
  function denseTrack(): CursorTrack {
    const events: ScrimEvent[] = [];
    for (let i = 0; i <= 4000; i++) {
      events.push(move(i * 8, (i * 0.02) % 100, (i * 0.013) % 100));
    }
    return CursorTrack.fromEvents(events);
  }

  it('binary-searches an arbitrary time among thousands of events', () => {
    const track = denseTrack();
    const pose = track.getPositionAt(12_345);
    expect(pose?.visible).toBe(true);
    expect(pose?.x).toBeGreaterThanOrEqual(0);
    expect(pose?.x).toBeLessThanOrEqual(100);
  });

  it('returns the same pose whether time jumped 16ms or 170ms', () => {
    const track = new CursorTrack([
      { time: 0, x: 0, y: 0, targetArea: 'editor', clicked: false },
      { time: 200, x: 80, y: 40, targetArea: 'editor', clicked: false },
    ]);
    const times = [16, 32, 48, 170, 186];
    for (const time of times) {
      const stepped = track.getPositionAt(time);
      const fresh = new CursorTrack(track.keys).getPositionAt(time);
      expect(stepped?.x).toBeCloseTo(fresh!.x, 6);
      expect(stepped?.y).toBeCloseTo(fresh!.y, 6);
    }
  });

  it('depends on playback time, not frame rate or playbackRate', () => {
    const track = new CursorTrack([
      { time: 0, x: 0, y: 0, targetArea: 'preview', clicked: false },
      { time: 1000, x: 100, y: 0, targetArea: 'preview', clicked: false },
    ]);
    const at500 = track.getPositionAt(500);
    const afterHalfSpeedClock = track.getPositionAt(500);
    const afterDoubleSpeedClock = track.getPositionAt(500);
    expect(at500?.x).toBeCloseTo(afterHalfSpeedClock!.x, 8);
    expect(at500?.x).toBeCloseTo(afterDoubleSpeedClock!.x, 8);
  });
});

describe('visual path sampling', () => {
  it('never teleports during a multi-area lesson path at 0.5x/1x/2x clocks', () => {
    const track = new CursorTrack([
      { time: 0, x: 4, y: 4, targetArea: 'editor', clicked: false },
      { time: 400, x: 50, y: 50, targetArea: 'editor', clicked: false },
      { time: 700, x: 88, y: 22, targetArea: 'editor', clicked: true },
      { time: 1100, x: 40, y: 60, targetArea: 'preview', clicked: false },
      { time: 1500, x: 55, y: 70, targetArea: 'preview', clicked: true },
    ]);

    const dtMs = [8, 16, 16, 32, 48, 16, 170, 16];
    for (const _rate of [0.5, 1, 2]) {
      let time = 0;
      let prev = track.getPositionAt(0);
      for (const dt of dtMs) {
        time += dt;
        const pose = track.getPositionAt(time);
        if (prev?.visible && pose?.visible && prev.targetArea === pose.targetArea) {
          const jump = Math.hypot(pose.x - prev.x, pose.y - prev.y);
          const maxJump = (dt / 400) * 160 + 8;
          expect(jump).toBeLessThan(maxJump);
        }
        prev = pose;
      }
    }
  });
});

describe('CursorSampler', () => {
  it('keeps the first sample, clicks, and area changes', () => {
    const sampler = new CursorSampler();
    expect(sampler.shouldRecord({ time: 0, x: 10, y: 10, targetArea: 'editor', clicked: false })).toBe(true);
    expect(sampler.shouldRecord({ time: 4, x: 10.01, y: 10, targetArea: 'editor', clicked: false })).toBe(false);
    expect(sampler.shouldRecord({ time: 20, x: 40, y: 40, targetArea: 'preview', clicked: false })).toBe(true);
    expect(sampler.shouldRecord({ time: 24, x: 40, y: 40, targetArea: 'preview', clicked: true })).toBe(true);
  });
});
