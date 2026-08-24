import React, { useEffect, useRef } from 'react';
import {
  getInstructorSurface,
  InstructorPointer,
  InstructorPointerPoint,
  registerInstructorSurface,
  subscribeInstructorPointer,
} from '../../engine/instructorPointer';

interface InstructorCursorProps {
  containerType?: 'editor' | 'preview' | 'files' | 'global';
  mapPosition?: (x: number, y: number, pointer: InstructorPointer) => { x: number; y: number };
}

type LocalPointerArea = InstructorPointerPoint['targetArea'];

function clampPct(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function pointInGlobalLayer(
  point: InstructorPointerPoint,
  pointer: InstructorPointer,
  root: HTMLElement,
): { x: number; y: number } {
  const rootRect = root.getBoundingClientRect();
  const surface = getInstructorSurface(point.targetArea);
  if (!surface || rootRect.width <= 0 || rootRect.height <= 0) {
    return { x: clampPct(point.x), y: clampPct(point.y) };
  }

  const surfaceRect = surface.element.getBoundingClientRect();
  const mapped = surface.mapPosition
    ? surface.mapPosition(point.x, point.y, pointer)
    : { x: point.x, y: point.y };

  return {
    x: clampPct(
      ((surfaceRect.left - rootRect.left + (clampPct(mapped.x) / 100) * surfaceRect.width) /
        rootRect.width) * 100,
    ),
    y: clampPct(
      ((surfaceRect.top - rootRect.top + (clampPct(mapped.y) / 100) * surfaceRect.height) /
        rootRect.height) * 100,
    ),
  };
}

function globalPosition(pointer: InstructorPointer, root: HTMLElement): { x: number; y: number } {
  if (!pointer.transition) return pointInGlobalLayer(pointer, pointer, root);

  const from = pointInGlobalLayer(pointer.transition.from, pointer, root);
  const to = pointInGlobalLayer(pointer.transition.to, pointer, root);
  const progress = clampPct(pointer.transition.progress * 100) / 100;
  return {
    x: from.x + (to.x - from.x) * progress,
    y: from.y + (to.y - from.y) * progress,
  };
}

function InstructorSurface({
  area,
  mapPosition,
}: {
  area: LocalPointerArea;
  mapPosition?: InstructorCursorProps['mapPosition'];
}) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef(mapPosition);
  mapRef.current = mapPosition;

  useEffect(() => {
    const element = surfaceRef.current;
    if (!element) return;
    return registerInstructorSurface(
      area,
      element,
      (x, y, pointer) => mapRef.current?.(x, y, pointer) ?? { x, y },
    );
  }, [area]);

  return (
    <div
      ref={surfaceRef}
      data-instructor-area={area}
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
    />
  );
}

function GlobalInstructorCursor() {
  const rootRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const hitRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    return subscribeInstructorPointer((pointer) => {
      const root = rootRef.current;
      const layer = layerRef.current;
      if (!root || !layer) return;

      if (!pointer) {
        layer.style.opacity = '0';
        if (hitRef.current) hitRef.current.style.opacity = '0';
        return;
      }

      const mapped = globalPosition(pointer, root);
      layer.style.opacity = '1';
      layer.style.transform = `translate3d(${mapped.x}%, ${mapped.y}%, 0)`;
      layer.dataset.area = pointer.transition?.to.targetArea ?? pointer.targetArea;
      if (hitRef.current) {
        hitRef.current.style.opacity = pointer.clicked ? '1' : '0';
        hitRef.current.style.transform = pointer.clicked ? 'scale(1)' : 'scale(0.4)';
      }
    });
  }, []);

  return (
    <div
      ref={rootRef}
      data-instructor-pointer-root
      className="pointer-events-none fixed inset-0 z-[80] overflow-hidden"
      aria-hidden="true"
    >
      <div
        ref={layerRef}
        data-instructor-pointer-layer
        className="absolute top-0 left-0 h-full w-full"
        style={{ opacity: 0, willChange: 'transform' }}
      >
        <div className="absolute top-0 left-0 flex items-start gap-1.5" style={{ transform: 'translate(-3px, -1px)' }}>
          <span
            ref={hitRef}
            className="absolute -top-2.5 -left-2.5 h-7 w-7 rounded-full"
            style={{
              opacity: 0,
              border: '1.5px solid #232733',
              background: 'rgba(186, 230, 253, 0.45)',
              transform: 'scale(0.4)',
              transition: 'opacity 160ms ease-out, transform 220ms ease-out',
            }}
          />
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="#f5f2eb"
            stroke="#12151e"
            strokeWidth="1.15"
            style={{ filter: 'drop-shadow(1px 2px 0 rgba(0,0,0,0.75))', flexShrink: 0 }}
          >
            <path d="M4 0l16 12.279-6.951 1.17 4.325 8.817-3.596 1.734-4.35-8.879-5.428 5.102z" />
          </svg>
          <span className="instructor-pointer-tag mt-3 whitespace-nowrap px-1.5 font-bold leading-tight">
            Instructor
          </span>
        </div>
      </div>
    </div>
  );
}

export const InstructorCursor: React.FC<InstructorCursorProps> = ({
  containerType = 'global',
  mapPosition,
}) => {
  if (containerType === 'global') return <GlobalInstructorCursor />;
  return <InstructorSurface area={containerType} mapPosition={mapPosition} />;
};
