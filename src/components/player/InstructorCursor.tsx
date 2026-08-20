import React from 'react';

interface InstructorCursorProps {
  pointer?: {
    x: number;
    y: number;
    targetArea: 'editor' | 'preview' | 'files' | 'global';
    clicked?: boolean;
  };
  containerType?: 'editor' | 'preview' | 'files' | 'global';
}

export const InstructorCursor: React.FC<InstructorCursorProps> = ({
  pointer,
  containerType = 'global',
}) => {
  if (!pointer) return null;

  // Only render if target matches container or if global
  if (containerType !== 'global' && pointer.targetArea !== containerType && pointer.targetArea !== 'global') {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute z-50 will-change-transform"
      style={{
        left: 0,
        top: 0,
        transform: `translate3d(${pointer.x}%, ${pointer.y}%, 0)`,
      }}
    >
      <div className="relative -top-1 -left-1 flex items-center gap-1.5 select-none">
        {/* Click ripple effect */}
        {pointer.clicked && (
          <span className="absolute -top-2 -left-2 h-9 w-9 rounded-full bg-cyan-400/40 animate-ping" />
        )}

        {/* Realistic SVG Cursor */}
        <div className="relative">
          <svg
            className={`h-5 w-5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] transition-transform duration-75 ${
              pointer.clicked ? 'scale-90 text-amber-400' : 'text-cyan-400'
            }`}
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="#090d16"
            strokeWidth="1.2"
          >
            <path d="M4 0l16 12.279-6.951 1.17 4.325 8.817-3.596 1.734-4.35-8.879-5.428 5.102z" />
          </svg>
        </div>

        {/* Instructor Name Tag Badge */}
        <div className="flex items-center gap-1 rounded bg-zinc-950/95 border border-cyan-500/50 px-1.5 py-0.5 shadow-lg backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[10px] font-mono font-medium text-cyan-200">
            Instructor
          </span>
        </div>
      </div>
    </div>
  );
};
