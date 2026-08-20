export type InstructorPointer = {
  x: number;
  y: number;
  targetArea: 'editor' | 'preview' | 'files' | 'global';
  clicked?: boolean;
};

type PointerListener = (pointer: InstructorPointer | undefined) => void;

let latestPointer: InstructorPointer | undefined;
const listeners = new Set<PointerListener>();

function samePointer(a?: InstructorPointer, b?: InstructorPointer): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    Math.abs(a.x - b.x) < 1e-4 &&
    Math.abs(a.y - b.y) < 1e-4 &&
    a.targetArea === b.targetArea &&
    !!a.clicked === !!b.clicked
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
