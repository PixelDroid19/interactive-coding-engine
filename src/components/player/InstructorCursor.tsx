import React, { useEffect, useRef } from 'react';
import {
  InstructorPointer,
  subscribeInstructorPointer,
} from '../../engine/instructorPointer';

interface InstructorCursorProps {
  containerType?: 'editor' | 'preview' | 'files' | 'global';
  mapPosition?: (x: number, y: number, pointer: InstructorPointer) => { x: number; y: number };
}

type PointerArea = NonNullable<InstructorCursorProps['containerType']>;

function matchesContainer(
  pointer: InstructorPointer | undefined,
  containerType: PointerArea
): pointer is InstructorPointer {
  if (!pointer) return false;
  if (containerType === 'global' || pointer.targetArea === 'global') return true;
  return pointer.targetArea === containerType;
}

export const InstructorCursor: React.FC<InstructorCursorProps> = ({
  containerType = 'global' as PointerArea,
  mapPosition,
}) => {
  const layerRef = useRef<HTMLDivElement>(null);
  const hitRef = useRef<HTMLSpanElement>(null);
  const mapRef = useRef(mapPosition);
  mapRef.current = mapPosition;

  useEffect(() => {
    return subscribeInstructorPointer((pointer) => {
      const layer = layerRef.current;
      if (!layer) return;

      if (!matchesContainer(pointer, containerType)) {
        layer.style.opacity = '0';
        if (hitRef.current) hitRef.current.style.opacity = '0';
        return;
      }

      const mapped = mapRef.current
        ? mapRef.current(pointer.x, pointer.y, pointer)
        : { x: pointer.x, y: pointer.y };

      layer.style.opacity = '1';
      layer.style.transform = `translate3d(${mapped.x}%, ${mapped.y}%, 0)`;
      if (hitRef.current) {
        hitRef.current.style.opacity = pointer.clicked ? '1' : '0';
        hitRef.current.style.transform = pointer.clicked ? 'scale(1)' : 'scale(0.4)';
      }
    });
  }, [containerType]);

  const onEditor = containerType === 'editor';

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-40 ${
        containerType === 'files' ? 'overflow-visible' : 'overflow-hidden'
      }`}
      aria-hidden="true"
    >
      <div
        ref={layerRef}
        className="absolute top-0 left-0 h-full w-full"
        style={{ opacity: 0, willChange: 'transform' }}
      >
        <div
          className="absolute top-0 left-0 flex items-start gap-1.5"
          style={{ transform: 'translate(-3px, -1px)' }}
        >
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
            fill={onEditor ? '#f5f2eb' : '#232733'}
            stroke={onEditor ? '#12151e' : '#ffffff'}
            strokeWidth="1.15"
            style={{
              filter: onEditor
                ? 'drop-shadow(1px 2px 0 rgba(0,0,0,0.65))'
                : 'drop-shadow(1px 2px 0 #1e222d)',
              flexShrink: 0,
            }}
          >
            <path d="M4 0l16 12.279-6.951 1.17 4.325 8.817-3.596 1.734-4.35-8.879-5.428 5.102z" />
          </svg>
          <span
            className="mt-3 whitespace-nowrap px-1.5 font-bold leading-tight"
            style={{
              fontFamily: "'Patrick Hand', cursive",
              fontSize: 13,
              color: '#1e2433',
              background: '#ffffff',
              border: '1.5px solid #232733',
              boxShadow: '2px 2px 0 #232733',
              borderRadius: 8,
            }}
          >
            Instructor
          </span>
        </div>
      </div>
    </div>
  );
};
