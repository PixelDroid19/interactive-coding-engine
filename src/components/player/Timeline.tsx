import React, { useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { ScrimChallenge } from '../../types/scrim';

export interface Chapter {
  timestamp: number;
  title: string;
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
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [hoveredTimeMs, setHoveredTimeMs] = useState<number | null>(null);

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercent = durationMs > 0 ? Math.min(100, Math.max(0, (currentTimeMs / durationMs) * 100)) : 0;

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
    ? challenges.find((ch) => Math.abs(ch.timestamp - hoveredTimeMs) < Math.max(1200, durationMs * 0.05))
    : null;

  const handleScrubberMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrubberRef.current || durationMs <= 0) return;
    setIsScrubbing(true);
    const rect = scrubberRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(ratio * durationMs);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const currentRect = scrubberRef.current?.getBoundingClientRect();
      if (!currentRect) return;
      const x = moveEvent.clientX - currentRect.left;
      const r = Math.max(0, Math.min(1, x / currentRect.width));
      onSeek(r * durationMs);
    };

    const onMouseUp = () => {
      setIsScrubbing(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleScrubberMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrubberRef.current || durationMs <= 0) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    setHoveredTimeMs(ratio * durationMs);
  };

  const availableSpeeds = [0.75, 1, 1.25, 1.5];

  return (
    <footer className="player-bar">
      <div className="player-left">
        <button
          onClick={isPlaying ? onPause : onPlay}
          className="play-main-btn"
          title={isPlaying ? 'Pausa (Espacio)' : 'Reproducir (Espacio)'}
        >
          {isPlaying ? (
            <Pause className="h-3.5 w-3.5" fill="currentColor" />
          ) : (
            <Play className="h-3.5 w-3.5 ml-0.5" fill="currentColor" />
          )}
        </button>
        <div className="timestamp-text" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--color-text-main)', fontWeight: 700 }}>{formatTime(currentTimeMs)}</span>
          <span>/</span>
          <span>{formatTime(durationMs)}</span>
        </div>
        {currentChapter && (
          <span className="category-tag" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentChapter.title}
          </span>
        )}
      </div>

      <div className="player-center">
        <div
          ref={scrubberRef}
          onMouseDown={handleScrubberMouseDown}
          onMouseMove={handleScrubberMouseMove}
          onMouseLeave={() => setHoveredTimeMs(null)}
          className="relative h-2 w-full rounded-full group cursor-pointer transition-colors"
          style={{ background: '#cbd5e1', border: '1.5px solid #232733' }}
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
              <div
                key={`chap-${idx}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSeek(chap.timestamp);
                }}
                className="absolute inset-y-0 w-0.5 z-10 cursor-pointer"
                style={{ background: '#1e2433', left: `${posPercent}%` }}
                title={`Chapter: ${chap.title} (${formatTime(chap.timestamp)})`}
              />
            );
          })}

          {/* Current playhead knob */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 z-30"
            style={{ background: '#0284c7', border: '2px solid #1e2433', boxShadow: '2px 2px 0 #232733', borderRadius: 6, left: `calc(${progressPercent}% - 6px)` }}
          />

          {/* Challenge Markers (Interactive Diamond Badges ◆) */}
          {challenges.map((ch) => {
            const markerPercent = durationMs > 0 ? (ch.timestamp / durationMs) * 100 : 0;
            const isPassed = currentTimeMs >= ch.timestamp;

            return (
              <div
                key={ch.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSeek(ch.timestamp);
                }}
                className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rotate-45 cursor-pointer transition-all duration-150 hover:scale-150 z-20 shadow-md ${
                  isPassed
                    ? 'bg-amber-400 border-2 border-zinc-950'
                    : 'bg-amber-500/80 border border-amber-300 ring-2 ring-amber-500/30'
                }`}
                style={{ left: `${markerPercent}%` }}
                title={`Challenge: ${ch.title} (${formatTime(ch.timestamp)})`}
              >
                {/* Subtle beacon pulse on active challenge */}
                {Math.abs(currentTimeMs - ch.timestamp) < 1500 && (
                  <span className="absolute inset-0 rounded-sm bg-amber-300 animate-ping opacity-75" />
                )}
              </div>
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
                    <Sparkles className="h-2.5 w-2.5 inline" /> Challenge
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="player-right">
        {/* Voice Audio Mute Toggle */}
        {(onToggleMute || onVolumeChange) && (
          <div className="flex items-center gap-1.5">
            {onToggleMute && (
              <button
                onClick={onToggleMute}
                className="p-1 rounded transition-colors"
                style={{ color: isMuted || volume <= 0 ? 'var(--color-text-subtle)' : 'var(--color-text-main)' }}
                title={isMuted || volume <= 0 ? 'Activar sonido' : 'Silenciar'}
              >
                {isMuted || volume <= 0 ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
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
                className="h-1 w-16 sm:w-20 cursor-pointer appearance-none rounded-full"
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
            onClick={onToggleCaptions}
            className="px-1.5 py-0.5 text-[9px] font-mono font-bold"
            style={
              showCaptions
                ? { background: 'var(--color-highlighter-yellow)', color: '#0f172a', border: '1.5px solid #232733', borderRadius: 6 }
                : { color: 'var(--color-text-muted)' }
            }
            title="Toggle Live Subtitles / Voice Transcript"
          >
            CC
          </button>
        )}

        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onSeek(Math.max(0, currentTimeMs - 5000))}
            className="text-[10px] font-mono px-1 py-0.5 rounded"
            style={{ color: 'var(--color-text-muted)' }}
            title="Step Back 5s"
          >
            -5s
          </button>
          <button
            onClick={() => onSeek(Math.min(durationMs, currentTimeMs + 5000))}
            className="text-[10px] font-mono px-1 py-0.5 rounded"
            style={{ color: 'var(--color-text-muted)' }}
            title="Step Forward 5s"
          >
            +5s
          </button>
        </div>

        <div className="h-3.5 w-px" style={{ background: '#232733' }} />

        <div className="flex p-0.5 text-xs font-mono" style={{ border: '1.5px solid #232733', borderRadius: 8, background: 'var(--bg-surface)' }}>
          {availableSpeeds.map((rate) => (
            <button
              key={rate}
              onClick={() => onRateChange(rate)}
              className="px-1 py-0.5 text-[9px] font-medium"
              style={
                playbackRate === rate
                  ? { background: 'var(--color-highlighter-cyan)', color: '#0f172a', fontWeight: 700, borderRadius: 6 }
                  : { color: 'var(--color-text-muted)' }
              }
            >
              {rate}x
            </button>
          ))}
        </div>

        {/* Restart */}
        <button
          onClick={() => onSeek(0)}
          className="p-1 rounded"
          style={{ color: 'var(--color-text-muted)' }}
          title="Replay from beginning"
        >
          <RotateCcw className="h-3 w-3" />
        </button>
      </div>
    </footer>
  );
};
