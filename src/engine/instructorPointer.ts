export type InstructorPointerArea = 'editor' | 'preview' | 'files' | 'global';

export type InstructorPointerPoint = {
  x: number;
  y: number;
  targetArea: Exclude<InstructorPointerArea, 'global'>;
};

export type InstructorPointer = InstructorPointerPoint & {
  clicked?: boolean;
  transition?: {
    from: InstructorPointerPoint;
    to: InstructorPointerPoint;
    progress: number;
  };
};

export type InstructorSurfaceMapper = (
  x: number,
  y: number,
  pointer: InstructorPointer,
) => { x: number; y: number };

type InstructorSurface = {
  element: HTMLElement;
  mapPosition?: InstructorSurfaceMapper;
};

type PointerListener = (pointer: InstructorPointer | undefined) => void;

let latestPointer: InstructorPointer | undefined;
const listeners = new Set<PointerListener>();
const surfaces = new Map<InstructorPointerPoint['targetArea'], InstructorSurface>();

function samePointer(a?: InstructorPointer, b?: InstructorPointer): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    Math.abs(a.x - b.x) < 1e-4 &&
    Math.abs(a.y - b.y) < 1e-4 &&
    a.targetArea === b.targetArea &&
    !!a.clicked === !!b.clicked &&
    Math.abs((a.transition?.progress ?? -1) - (b.transition?.progress ?? -1)) < 1e-4
  );
}

export function publishInstructorPointer(pointer?: InstructorPointer): void {
  if (samePointer(latestPointer, pointer)) return;
  latestPointer = pointer;
  for (const listener of listeners) listener(latestPointer);
}

export function getInstructorPointer(): InstructorPointer | undefined {
  return latestPointer;
}

export function subscribeInstructorPointer(listener: PointerListener): () => void {
  listeners.add(listener);
  listener(latestPointer);
  return () => {
    listeners.delete(listener);
  };
}

export function registerInstructorSurface(
  area: InstructorPointerPoint['targetArea'],
  element: HTMLElement,
  mapPosition?: InstructorSurfaceMapper,
): () => void {
  const surface = { element, mapPosition };
  surfaces.set(area, surface);
  return () => {
    if (surfaces.get(area) === surface) surfaces.delete(area);
  };
}

export function getInstructorSurface(
  area: InstructorPointerPoint['targetArea'],
): InstructorSurface | undefined {
  return surfaces.get(area);
}
