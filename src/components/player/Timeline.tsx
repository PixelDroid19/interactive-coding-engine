import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { ScrimChallenge } from '../../types/scrim';

export interface Chapter {
  timestamp: number;
  title: string;
}

export function getClosestChallenge(
  challenges: ScrimChallenge[],
  hoveredTimeMs: number,
  durationMs: number
): ScrimChallenge | null {
  const thresholdMs = Math.max(1200, durationMs * 0.05);

  return challenges.reduce<{ challenge: ScrimChallenge; distanceMs: number } | null>((closest, challenge) => {
    const distanceMs = Math.abs(challenge.timestamp - hoveredTimeMs);
    if (distanceMs >= thresholdMs) return closest;
    if (!closest || distanceMs < closest.distanceMs) {
      return { challenge, distanceMs };
    }
    return closest;
  }, null)?.challenge ?? null;
}

export function getSeekTarget(
  clientX: number,
  rect: Pick<DOMRect, 'left' | 'width'>,
  durationMs: number
): number {
  if (durationMs <= 0 || rect.width <= 0) return 0;
  const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  return ratio * durationMs;
}

interface TimelineProps {
  currentTimeMs: number;
  durationMs: number;
  isPlaying: boolean;
  playbackRate: number;
  challenges?: ScrimChallenge[];
  chapters?: Chapter[];
  isMuted?: boolean;
  volume?: number;
  showCaptions?: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (targetMs: number) => void;
  onRateChange: (newRate: number) => void;
  onToggleMute?: () => void;
  onVolumeChange?: (volume: number) => void;
  onToggleCaptions?: () => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  currentTimeMs,
  durationMs,
  isPlaying,
  playbackRate,
  challenges = [],
  chapters = [],
  isMuted = false,
  volume = 0.5,
  showCaptions = true,
  onPlay,
  onPause,
  onSeek,
  onRateChange,
  onToggleMute,
  onVolumeChange,
  onToggleCaptions,
}) => {
  const scrubberRef = useRef<HTMLDivElement>(null);
  const isScrubbingRef = useRef(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [hoveredTimeMs, setHoveredTimeMs] = useState<number | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (mql) {
      setPrefersReducedMotion(mql.matches);
      const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    }
  }, []);

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercent = durationMs > 0 ? Math.min(100, Math.max(0, (currentTimeMs / durationMs) * 100)) : 0;
  const clampedCurrentTimeMs = durationMs > 0 ? Math.min(durationMs, Math.max(0, currentTimeMs)) : 0;

  // Find active chapter
  const currentChapter = [...chapters]
    .sort((a, b) => a.timestamp - b.timestamp)
    .filter((ch) => currentTimeMs >= ch.timestamp)
    .pop();

  // Find hovered chapter
  const hoveredChapter = hoveredTimeMs !== null
    ? [...chapters]
        .sort((a, b) => a.timestamp - b.timestamp)
        .filter((ch) => hoveredTimeMs >= ch.timestamp)
        .pop()
    : null;

  // Find hovered challenge
  const hoveredChallenge = hoveredTimeMs !== null
    ? getClosestChallenge(challenges, hoveredTimeMs, durationMs)
    : null;

  const seekFromClientX = (clientX: number) => {
    if (!scrubberRef.current || durationMs <= 0) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const targetMs = getSeekTarget(clientX, rect, durationMs);
    setHoveredTimeMs(targetMs);
    onSeek(targetMs);
  };

  const handleScrubberPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!scrubberRef.current || durationMs <= 0) return;
    event.preventDefault();
    isScrubbingRef.current = true;
    setIsScrubbing(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    seekFromClientX(event.clientX);
  };

  const handleScrubberPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!scrubberRef.current || durationMs <= 0) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const targetMs = getSeekTarget(event.clientX, rect, durationMs);
    setHoveredTimeMs(targetMs);
    if (isScrubbingRef.current) onSeek(targetMs);
  };

  const handleScrubberPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbingRef.current) return;
    isScrubbingRef.current = false;
    setIsScrubbing(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleScrubberKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (durationMs <= 0) return;

    let targetMs: number | null = null;
    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        targetMs = Math.max(0, clampedCurrentTimeMs - 5000);
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        targetMs = Math.min(durationMs, clampedCurrentTimeMs + 5000);
        break;
      case 'Home':
        targetMs = 0;
        break;
      case 'End':
        targetMs = durationMs;
        break;
      default:
        return;
    }

    event.preventDefault();
    onSeek(targetMs);
  };

  const availableSpeeds = [0.75, 1, 1.25, 1.5];

  return (
    <footer className="player-bar">
      <div className="player-left">
        <button
          type="button"
          onClick={isPlaying ? onPause : onPlay}
          className="play-main-btn"
          aria-label={isPlaying ? 'Pausar la clase' : 'Reproducir la clase'}
          title={isPlaying ? 'Pausa (Espacio)' : 'Reproducir (Espacio)'}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" fill="currentColor" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
          )}
        </button>
        <div className="timestamp-text" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--color-text-main)', fontWeight: 700 }}>{formatTime(currentTimeMs)}</span>
          <span>/</span>
          <span>{formatTime(durationMs)}</span>
        </div>
        {currentChapter && (
          <span className="category-tag hidden sm:inline-flex" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentChapter.title}
          </span>
        )}
      </div>

      <div className="player-center">
        <div
          ref={scrubberRef}
          role="slider"
          tabIndex={durationMs > 0 ? 0 : -1}
          aria-label="Progreso de la clase"
          aria-valuemin={0}
          aria-valuemax={Math.max(0, durationMs)}
          aria-valuenow={clampedCurrentTimeMs}
          aria-valuetext={formatTime(clampedCurrentTimeMs)}
          aria-orientation="horizontal"
          onKeyDown={handleScrubberKeyDown}
          onPointerDown={handleScrubberPointerDown}
          onPointerMove={handleScrubberPointerMove}
          onPointerUp={handleScrubberPointerUp}
          onPointerCancel={handleScrubberPointerUp}
          onPointerLeave={() => {
            if (!isScrubbingRef.current) setHoveredTimeMs(null);
          }}
          className={`relative h-3 w-full rounded-full group transition-colors ${isScrubbing ? 'cursor-grabbing' : 'cursor-pointer'}`}
          style={{ background: '#cbd5e1', border: '1.5px solid #232733', minHeight: 12 }}
        >
          {/* Progress filled bar */}
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ background: '#0284c7', width: `${progressPercent}%` }}
          />

          {/* Chapter Break Dividers / Notches */}
          {chapters.map((chap, idx) => {
            if (chap.timestamp <= 0) return null;
            const posPercent = durationMs > 0 ? (chap.timestamp / durationMs) * 100 : 0;
            if (posPercent > 99) return null;

            return (
              <button
                type="button"
                key={`chap-${idx}`}
                aria-label={`Ir al capítulo ${chap.title}`}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onSeek(chap.timestamp);
                }}
                className="absolute inset-y-0 z-10 w-1 cursor-pointer appearance-none border-0 p-0"
                style={{ background: '#1e2433', left: `${posPercent}%`, minWidth: 4, minHeight: 16 }}
                title={`Capítulo: ${chap.title} (${formatTime(chap.timestamp)})`}
              />
            );
          })}

          {/* Current playhead knob - larger for touch */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-5 h-5 z-30"
            style={{ background: '#0284c7', border: '2px solid #1e2433', boxShadow: '2px 2px 0 #232733', borderRadius: 6, left: `calc(${progressPercent}% - 8px)` }}
          />

          {/* Challenge Markers (Interactive Diamond Badges ◆) - larger hit area */}
          {challenges.map((ch) => {
            const markerPercent = durationMs > 0 ? (ch.timestamp / durationMs) * 100 : 0;
            const isPassed = currentTimeMs >= ch.timestamp;

            return (
              <button
                type="button"
                key={ch.id}
                aria-label={`Ir al reto ${ch.title}`}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onSeek(ch.timestamp);
                }}
                className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rotate-45 cursor-pointer transition-all duration-150 hover:scale-125 z-20 shadow-md ${
                  isPassed
                    ? 'bg-amber-400 border-2 border-zinc-950'
                    : 'bg-amber-500/80 border border-amber-300 ring-2 ring-amber-500/30'
                }`}
                style={{ left: `${markerPercent}%`, minWidth: 16, minHeight: 16 }}
                title={`Reto: ${ch.title} (${formatTime(ch.timestamp)})`}
              >
                {/* Subtle beacon pulse on active challenge - respects reduced motion */}
                {Math.abs(currentTimeMs - ch.timestamp) < 1500 && !prefersReducedMotion && (
                  <span className="absolute inset-0 rounded-sm bg-amber-300 animate-ping opacity-75" />
                )}
              </button>
            );
          })}

          {/* Rich Hover Tooltip (Showing timestamp + Chapter + Challenge) */}
          {hoveredTimeMs !== null && (
            <div
              className="pointer-events-none absolute -top-9 -translate-x-1/2 px-2 py-1 text-[10px] z-40 whitespace-nowrap flex items-center gap-1.5"
              style={{
                left: `${Math.min(92, Math.max(8, (hoveredTimeMs / durationMs) * 100))}%`,
                background: 'var(--bg-surface-light)',
                border: '1.5px solid #232733',
                boxShadow: '2px 2px 0 #232733',
                color: 'var(--color-text-main)',
                borderRadius: 8,
              }}
            >
              <span className="font-mono font-bold">{formatTime(hoveredTimeMs)}</span>
              {hoveredChapter && (
                <>
                  <span>•</span>
                  <span className="font-medium">{hoveredChapter.title}</span>
                </>
              )}
              {hoveredChallenge && (
                <>
                  <span>•</span>
                  <span className="font-bold flex items-center gap-0.5" style={{ color: '#b45309' }}>
                    <Sparkles className="h-2.5 w-2.5 inline" /> Reto
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="player-right flex-wrap sm:flex-nowrap gap-1 sm:gap-2">
        {/* Voice Audio Mute Toggle */}
        {(onToggleMute || onVolumeChange) && (
          <div className="hidden sm:flex items-center gap-1.5">
            {onToggleMute && (
              <button
                type="button"
                onClick={onToggleMute}
                aria-label={isMuted || volume <= 0 ? 'Activar sonido' : 'Silenciar explicación'}
                className="p-2 rounded transition-colors"
                style={{ color: isMuted || volume <= 0 ? 'var(--color-text-subtle)' : 'var(--color-text-main)', minWidth: 36, minHeight: 36 }}
                title={isMuted || volume <= 0 ? 'Activar sonido' : 'Silenciar'}
              >
                {isMuted || volume <= 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
            )}
            {onVolumeChange && (
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={(event) => onVolumeChange(Number(event.target.value))}
                onMouseDown={(event) => event.stopPropagation()}
                className="h-2 w-16 sm:w-20 cursor-pointer appearance-none rounded-full"
                style={{ background: '#d6d0c2', accentColor: '#0284c7' }}
                title={`Volumen ${Math.round((isMuted ? 0 : volume) * 100)}%`}
                aria-label="Volumen de la explicación"
              />
            )}
          </div>
        )}

        {/* Captions Toggle */}
        {onToggleCaptions && (
          <button
            type="button"
            onClick={onToggleCaptions}
            aria-label="Activar o desactivar subtítulos"
            aria-pressed={showCaptions}
            className="px-2 py-1 text-xs font-mono font-bold"
            style={
              showCaptions
                ? { background: 'var(--color-highlighter-yellow)', color: '#0f172a', border: '1.5px solid #232733', borderRadius: 6 }
                : { color: 'var(--color-text-muted)', minWidth: 36, minHeight: 32 }
            }
            title="Activar o desactivar subtítulos"
          >
            CC
          </button>
        )}

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onSeek(Math.max(0, currentTimeMs - 5000))}
            aria-label="Retroceder 5 segundos"
            className="text-xs font-mono px-2 py-1 rounded"
            style={{ color: 'var(--color-text-muted)', minWidth: 44, minHeight: 32 }}
            title="Retroceder 5 s"
          >
            -5 s
          </button>
          <button
            type="button"
            onClick={() => onSeek(Math.min(durationMs, currentTimeMs + 5000))}
            aria-label="Avanzar 5 segundos"
            className="text-xs font-mono px-2 py-1 rounded"
            style={{ color: 'var(--color-text-muted)', minWidth: 44, minHeight: 32 }}
            title="Avanzar 5 s"
          >
            +5 s
          </button>
        </div>

        <div className="h-6 w-px hidden sm:block" style={{ background: '#232733' }} />

        <div className="hidden sm:flex p-0.5 text-xs font-mono" style={{ border: '1.5px solid #232733', borderRadius: 8, background: 'var(--bg-surface)' }}>
          {availableSpeeds.map((rate) => (
            <button
              type="button"
              key={rate}
              onClick={() => onRateChange(rate)}
              aria-label={`Velocidad ${rate} por`}
              aria-pressed={playbackRate === rate}
              className="px-2 py-1 text-xs font-medium"
              style={
                playbackRate === rate
                  ? { background: 'var(--color-highlighter-cyan)', color: '#0f172a', fontWeight: 700, borderRadius: 6 }
                  : { color: 'var(--color-text-muted)', minWidth: 36 }
              }
            >
              {rate}x
            </button>
          ))}
        </div>

        {/* Restart */}
        <button
          type="button"
          onClick={() => onSeek(0)}
          aria-label="Repetir desde el principio"
          className="p-2 rounded"
          style={{ color: 'var(--color-text-muted)', minWidth: 36, minHeight: 36 }}
          title="Repetir desde el principio"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </footer>
  );
};
