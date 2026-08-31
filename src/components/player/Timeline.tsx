import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, ChevronDown } from 'lucide-react';
import { ScrimChallenge } from '../../types/scrim';
import { useTheme } from '../../themes/ThemeProvider';

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
  onChallengeSeek?: (challenge: ScrimChallenge) => void;
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
  onChallengeSeek,
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
  const [speedOpen, setSpeedOpen] = useState(false);
  const speedMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mql = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (mql) {
      setPrefersReducedMotion(mql.matches);
      const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    }
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (speedMenuRef.current && !speedMenuRef.current.contains(e.target as Node)) setSpeedOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercent = durationMs > 0 ? Math.min(100, Math.max(0, (currentTimeMs / durationMs) * 100)) : 0;
  const clampedCurrentTimeMs = durationMs > 0 ? Math.min(durationMs, Math.max(0, currentTimeMs)) : 0;

  const currentChapter = [...chapters]
    .sort((a, b) => a.timestamp - b.timestamp)
    .filter((ch) => currentTimeMs >= ch.timestamp)
    .pop();

  const hoveredChapter = hoveredTimeMs !== null
    ? [...chapters]
        .sort((a, b) => a.timestamp - b.timestamp)
        .filter((ch) => hoveredTimeMs >= ch.timestamp)
        .pop()
    : null;

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

  const availableSpeeds = [0.75, 1, 1.25, 1.5] as const;
  const { themeId } = useTheme();
  const isCyber = themeId === 'cyber';

  return (
    <footer
      className={`player-bar${speedOpen ? ' is-speed-menu-open' : ''}`}
      data-augmented-ui={isCyber ? "hud-player tl-clip tr-clip border inlay" : undefined}
    >
      <div className="player-bar-hud-surface" aria-hidden="true" />
      {/* LEFT: play + time + chapter (reservado para no saltar) */}
      <div className="player-left">
        <button
          type="button"
          onClick={isPlaying ? onPause : onPlay}
          className="play-main-btn"
          aria-label={isPlaying ? 'Pausar la clase' : 'Reproducir la clase'}
          title={isPlaying ? 'Pausa (Espacio)' : 'Reproducir (Espacio)'}
        >
          {isPlaying ? <Pause className="h-[14px] w-[14px]" fill="currentColor" /> : <Play className="h-[14px] w-[14px] ml-px" fill="currentColor" />}
        </button>
        <div className="timestamp-text" style={{ fontVariantNumeric: 'tabular-nums', minWidth: 88, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: 'var(--color-text-main)', fontWeight: 700 }}>{formatTime(currentTimeMs)}</span>
          <span style={{ opacity: 0.5 }}>/</span>
          <span style={{ opacity: 0.85 }}>{formatTime(durationMs)}</span>
        </div>
        <div className="hidden md:flex" style={{ width: 168, flexShrink: 0, alignItems: 'center' }}>
          <span
            className="category-tag"
            style={{
              maxWidth: 168,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              opacity: currentChapter ? 1 : 0,
              pointerEvents: currentChapter ? 'auto' : 'none',
              display: 'inline-flex',
              fontSize: 11,
              padding: '3px 8px',
              transition: 'opacity 0.15s ease',
            }}
            title={currentChapter?.title ?? ''}
          >
            {currentChapter?.title ?? '—'}
          </span>
        </div>
      </div>

      {/* CENTER: timeline estable, altura fija */}
      <div className="player-center">
        <div className="timeline-scrubber relative w-full" style={{ height: 24, minWidth: 0 }}>
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
            className={`relative h-full w-full rounded-full group ${isScrubbing ? 'cursor-grabbing' : 'cursor-pointer'}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'transparent',
              flexShrink: 0,
            }}
          >
            {/* track - CodeSilk papel + lápiz */}
            <div
              className="absolute left-0 right-0 overflow-hidden"
              style={{
                height: 8,
                background: 'var(--bg-surface)',
                border: '2px solid var(--color-pencil)',
                top: '50%',
                transform: 'translateY(-50%)',
                borderRadius: 'var(--radius-doodle-sm)',
                boxShadow: '1px 1px 0 var(--color-sketch-shadow)',
              }}
            >
              <div className="absolute inset-y-0 left-0" style={{ background: 'var(--color-primary)', width: `${progressPercent}%`, borderRadius: 'inherit' }} />
            </div>

            {/* thumb - sello lápiz */}
            <div
              className="absolute top-1/2 -translate-y-1/2 z-20"
              style={{
                left: `calc(${progressPercent}% - 8px)`,
                width: 16,
                height: 16,
                background: 'var(--color-primary)',
                border: '2px solid var(--color-pencil)',
                boxShadow: '1.5px 1.5px 0 var(--color-sketch-shadow)',
                borderRadius: 'var(--radius-doodle-sm)',
                transition: isScrubbing ? 'none' : 'left 0.08s linear',
              }}
            />
          </div>

          <div className="timeline-marker-layer absolute inset-0" style={{ pointerEvents: 'none', zIndex: 30 }}>
            {chapters.map((chap, idx) => {
              if (chap.timestamp <= 0) return null;
              const posPercent = durationMs > 0 ? (chap.timestamp / durationMs) * 100 : 0;
              if (posPercent >= 99.5 || posPercent <= 0.5) return null;
              return (
                <button
                  type="button"
                  key={`chap-${idx}`}
                  aria-label={`Ir al capítulo ${chap.title}`}
                  onClick={() => onSeek(chap.timestamp)}
                  className="timeline-marker timeline-chapter-marker"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: `${posPercent}%`,
                    width: 24,
                    height: 24,
                    transform: 'translate(-50%, -50%)',
                    padding: 0,
                    border: 0,
                    background: 'transparent',
                    cursor: 'pointer',
                    pointerEvents: 'auto',
                  }}
                  title={`Capítulo: ${chap.title} (${formatTime(chap.timestamp)})`}
                >
                  <span aria-hidden="true" style={{ display: 'block', width: 4, height: 12, margin: '0 auto', background: 'var(--color-pencil)', opacity: 0.95 }} />
                </button>
              );
            })}

            {challenges.map((ch) => {
              const markerPercent = durationMs > 0 ? (ch.timestamp / durationMs) * 100 : 0;
              const isPassed = currentTimeMs >= ch.timestamp;
              return (
                <button
                  type="button"
                  key={ch.id}
                  aria-label={`Ir al reto ${ch.title}`}
                  onClick={() => {
                    if (onChallengeSeek) onChallengeSeek(ch);
                    else onSeek(ch.timestamp);
                  }}
                  className="timeline-marker timeline-challenge-marker"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: `${markerPercent}%`,
                    width: 24,
                    height: 24,
                    transform: 'translate(-50%, -50%)',
                    padding: 0,
                    border: 0,
                    background: 'transparent',
                    cursor: 'pointer',
                    pointerEvents: 'auto',
                  }}
                  title={`Reto: ${ch.title} (${formatTime(ch.timestamp)})`}
                >
                  <span
                    aria-hidden="true"
                    className="timeline-challenge-marker__diamond"
                    style={{
                      display: 'block',
                      width: 12,
                      height: 12,
                      margin: '0 auto',
                      transform: 'rotate(45deg)',
                      background: isPassed ? 'var(--color-brand)' : '#f59e0b',
                      border: '1.5px solid var(--color-black)',
                      boxShadow: '1px 1px 0 var(--color-sketch-shadow)',
                      borderRadius: 2,
                    }}
                  >
                    {Math.abs(currentTimeMs - ch.timestamp) < 1200 && !prefersReducedMotion && (
                      <span className="absolute inset-0 bg-[var(--color-brand)] animate-ping opacity-60" style={{ borderRadius: 2 }} />
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* hover tooltip */}
          {hoveredTimeMs !== null && (
            <div
              className="pointer-events-none absolute -top-9 -translate-x-1/2 px-2 py-1 text-[11px] z-40 whitespace-nowrap hidden sm:flex items-center gap-1.5"
              style={{
                left: `${Math.min(92, Math.max(8, (hoveredTimeMs / durationMs) * 100))}%`,
                background: 'var(--bg-surface-light)',
                border: '1.5px solid var(--color-pencil)',
                boxShadow: '2px 2px 0 var(--color-sketch-shadow)',
                color: 'var(--color-text-main)',
                borderRadius: 8,
                fontWeight: 600,
              }}
            >
              <span className="font-mono">{formatTime(hoveredTimeMs)}</span>
              {hoveredChapter && (
                <>
                  <span style={{ opacity: 0.4 }}>•</span>
                  <span className="max-w-[140px] truncate">{hoveredChapter.title}</span>
                </>
              )}
              {hoveredChallenge && (
                <>
                  <span style={{ opacity: 0.4 }}>•</span>
                  <span className="flex items-center gap-1" style={{ color: '#92400e', fontWeight: 800 }}>
                    <Sparkles className="h-3 w-3" /> Reto
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: controles compactos, sin wrap */}
      <div className="player-right">
        {/* volumen: icono + slider compacto, slider oculto en mobile */}
        {(onToggleMute || onVolumeChange) && (
          <div className="hidden sm:flex items-center gap-1" style={{ flexShrink: 0 }}>
            {onToggleMute && (
              <button
                type="button"
                onClick={onToggleMute}
                aria-label={isMuted || volume <= 0 ? 'Activar sonido' : 'Silenciar explicación'}
                className="grid place-items-center rounded-md"
                style={{
                  width: 30,
                  height: 28,
                  color: isMuted || volume <= 0 ? 'var(--color-text-subtle)' : 'var(--color-text-main)',
                  border: '1px solid transparent',
                }}
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
                className="cursor-pointer appearance-none rounded-full hidden lg:block"
                style={{ width: 72, height: 4, background: 'var(--bg-surface)', accentColor: 'var(--color-primary)', border: '1px solid var(--color-pencil-light)' }}
                title={`Volumen ${Math.round((isMuted ? 0 : volume) * 100)}%`}
                aria-label="Volumen de la explicación"
              />
            )}
          </div>
        )}

        {/* CC */}
        {onToggleCaptions && (
          <button
            type="button"
            onClick={onToggleCaptions}
            aria-label="Activar o desactivar subtítulos"
            aria-pressed={showCaptions}
            className="grid place-items-center text-[11px] font-extrabold"
            style={
              showCaptions
                ? { background: 'var(--color-brand)', color: 'var(--color-brand-contrast)', border: '1.5px solid var(--color-black)', borderRadius: 6, width: 30, height: 24 }
                : { color: 'var(--color-text-muted)', border: '1px solid transparent', width: 30, height: 24, borderRadius: 6 }
            }
            title="Subtítulos"
          >
            CC
          </button>
        )}

        {/* -5s / +5s compactos */}
        <div className="hidden sm:flex items-center" style={{ gap: 2, flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => onSeek(Math.max(0, currentTimeMs - 5000))}
            aria-label="Retroceder 5 segundos"
            className="grid place-items-center rounded-md text-[11px] font-mono font-bold"
            style={{ color: 'var(--color-text-muted)', width: 38, height: 28, border: '1px solid transparent' }}
            title="Retroceder 5 s"
          >
            -5 s
          </button>
          <button
            type="button"
            onClick={() => onSeek(Math.min(durationMs, currentTimeMs + 5000))}
            aria-label="Avanzar 5 segundos"
            className="grid place-items-center rounded-md text-[11px] font-mono font-bold"
            style={{ color: 'var(--color-text-muted)', width: 38, height: 28, border: '1px solid transparent' }}
            title="Avanzar 5 s"
          >
            +5 s
          </button>
        </div>

        <div className="hidden sm:block" style={{ width: 1, height: 18, background: 'var(--color-pencil)', opacity: 0.25 }} />

        {/* Velocidad: un solo botón + menú */}
        <div ref={speedMenuRef} className="relative hidden sm:block" style={{ flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setSpeedOpen((v) => !v)}
            aria-label={`Velocidad actual ${playbackRate}x, cambiar velocidad`}
            aria-expanded={speedOpen}
            className="flex items-center justify-center gap-1 rounded-md text-xs font-bold"
            style={{
              minWidth: 52,
              height: 28,
              padding: '0 8px',
              background: speedOpen ? 'var(--color-highlighter-cyan)' : 'var(--bg-surface)',
              color: speedOpen ? 'var(--color-brand-contrast)' : 'var(--color-text-muted)',
              border: '1.5px solid var(--color-pencil)',
              borderRadius: 8,
              boxShadow: '1px 1px 0 var(--color-sketch-shadow)',
            }}
          >
            {playbackRate}x <ChevronDown className="h-3 w-3 opacity-70" />
          </button>
          {speedOpen && (
            <div
              className="absolute right-0 bottom-[calc(100%+8px)] z-30 rounded-lg p-1 flex flex-col gap-1"
              style={{ background: 'var(--bg-surface-light)', border: '1.5px solid var(--color-pencil)', boxShadow: '3px 3px 0 var(--color-sketch-shadow)', minWidth: 84 }}
            >
              {availableSpeeds.map((rate) => (
                <button
                  type="button"
                  key={rate}
                  onClick={() => {
                    onRateChange(rate);
                    setSpeedOpen(false);
                  }}
                  aria-label={`Velocidad ${rate} por`}
                  aria-pressed={playbackRate === rate}
                  className="px-2 py-1.5 text-xs font-bold rounded-md text-left"
                  style={
                    playbackRate === rate
                      ? { background: 'var(--color-brand)', color: 'var(--color-brand-contrast)', border: '1px solid var(--color-black)' }
                      : { color: 'var(--color-text-main)', border: '1px solid transparent' }
                  }
                >
                  {rate}x
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reiniciar */}
        <button
          type="button"
          onClick={() => onSeek(0)}
          aria-label="Repetir desde el principio"
          className="grid place-items-center rounded-md hidden sm:grid"
          style={{ width: 30, height: 28, color: 'var(--color-text-muted)', border: '1px solid transparent' }}
          title="Repetir desde el principio"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </footer>
  );
};
