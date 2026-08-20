import React, { useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, CheckCircle2, Bookmark } from 'lucide-react';
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
    <footer className="h-12 bg-[#121214] border-t border-zinc-800/80 flex items-center px-4 gap-4 select-none z-40 text-zinc-200 shrink-0">
      {/* Clean Play/Pause */}
      <button
        onClick={isPlaying ? onPause : onPlay}
        className="w-7 h-7 rounded-full bg-zinc-100 hover:bg-white flex items-center justify-center text-zinc-950 shrink-0 transition-transform active:scale-95 shadow-sm"
        title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
      >
        {isPlaying ? (
          <Pause className="h-3 w-3 fill-zinc-950 text-zinc-950" />
        ) : (
          <Play className="h-3 w-3 fill-zinc-950 text-zinc-950 ml-0.5" />
        )}
      </button>

      {/* Center Scrubber & Timers */}
      <div className="flex flex-col flex-1 gap-1 min-w-0">
        {/* Info row above track */}
        <div className="flex justify-between items-center text-[10px] font-mono leading-none">
          <div className="flex items-center gap-2 text-zinc-400 truncate">
            <span className="text-zinc-100 font-semibold">{formatTime(currentTimeMs)}</span>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-500">{formatTime(durationMs)}</span>

            {/* Current Chapter pill */}
            {currentChapter && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-sans font-medium text-cyan-300 bg-cyan-950/50 border border-cyan-800/40 px-1.5 py-0.5 rounded truncate max-w-[200px]">
                <Bookmark className="h-2.5 w-2.5 shrink-0 text-cyan-400" />
                <span className="truncate">{currentChapter.title}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-mono">
            {chapters.length > 0 && (
              <span className="hidden md:inline text-zinc-400">
                {chapters.length} chapters
              </span>
            )}
            {challenges.length > 0 && (
              <span className="flex items-center gap-1 text-amber-400/90 font-medium">
                <span className="inline-block w-1.5 h-1.5 rotate-45 bg-amber-400" />
                <span>{challenges.length} challenge{challenges.length > 1 ? 's' : ''}</span>
              </span>
            )}
          </div>
        </div>

        {/* Interactive Scrubber Track with Chapter Breaks & Challenge Markers */}
        <div
          ref={scrubberRef}
          onMouseDown={handleScrubberMouseDown}
          onMouseMove={handleScrubberMouseMove}
          onMouseLeave={() => setHoveredTimeMs(null)}
          className="relative h-2 w-full bg-zinc-800/90 hover:bg-zinc-800 rounded-full group cursor-pointer transition-colors"
        >
          {/* Progress filled bar */}
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-amber-400 rounded-full transition-all duration-75"
            style={{ width: `${progressPercent}%` }}
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
                className="absolute inset-y-0 w-0.5 bg-zinc-950/80 hover:bg-cyan-300 transition-colors z-10 cursor-pointer"
                style={{ left: `${posPercent}%` }}
                title={`Chapter: ${chap.title} (${formatTime(chap.timestamp)})`}
              />
            );
          })}

          {/* Current playhead knob */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border border-zinc-900 shadow-md transition-transform group-hover:scale-125 z-30"
            style={{ left: `calc(${progressPercent}% - 6px)` }}
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
                title={`🎯 Challenge Checkpoint: ${ch.title} (${formatTime(ch.timestamp)})`}
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
              className="pointer-events-none absolute -top-9 -translate-x-1/2 rounded-md bg-zinc-950/95 border border-zinc-700/90 px-2 py-1 text-[10px] font-sans text-zinc-100 shadow-2xl z-40 whitespace-nowrap flex items-center gap-1.5 backdrop-blur-md"
              style={{
                left: `${Math.min(92, Math.max(8, (hoveredTimeMs / durationMs) * 100))}%`,
              }}
            >
              <span className="font-mono font-bold text-zinc-300">{formatTime(hoveredTimeMs)}</span>
              {hoveredChapter && (
                <>
                  <span className="text-zinc-600">•</span>
                  <span className="text-cyan-300 font-medium">{hoveredChapter.title}</span>
                </>
              )}
              {hoveredChallenge && (
                <>
                  <span className="text-zinc-600">•</span>
                  <span className="text-amber-400 font-bold flex items-center gap-0.5">
                    <Sparkles className="h-2.5 w-2.5 inline" /> Challenge
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Controls: Voice Toggle, Subtitles, Speed, Step */}
      <div className="flex items-center gap-2.5 shrink-0 text-xs">
        {/* Voice Audio Mute Toggle */}
        {(onToggleMute || onVolumeChange) && (
          <div className="flex items-center gap-1.5">
            {onToggleMute && (
              <button
                onClick={onToggleMute}
                className={`p-1 rounded transition-colors ${
                  isMuted || volume <= 0
                    ? 'text-zinc-500 hover:text-zinc-300'
                    : 'text-zinc-200 hover:bg-zinc-800'
                }`}
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
                className="h-1 w-16 sm:w-20 cursor-pointer appearance-none rounded-full bg-zinc-700 accent-cyan-400"
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
            className={`px-1.5 py-0.5 rounded transition-colors text-[9px] font-mono font-bold ${
              showCaptions
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/60'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Toggle Live Subtitles / Voice Transcript"
          >
            CC
          </button>
        )}

        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onSeek(Math.max(0, currentTimeMs - 5000))}
            className="text-zinc-400 hover:text-zinc-200 transition-colors text-[10px] font-mono px-1 py-0.5 rounded hover:bg-zinc-800"
            title="Step Back 5s"
          >
            -5s
          </button>
          <button
            onClick={() => onSeek(Math.min(durationMs, currentTimeMs + 5000))}
            className="text-zinc-400 hover:text-zinc-200 transition-colors text-[10px] font-mono px-1 py-0.5 rounded hover:bg-zinc-800"
            title="Step Forward 5s"
          >
            +5s
          </button>
        </div>

        <div className="h-3.5 w-px bg-zinc-800" />

        {/* Speed Selector */}
        <div className="flex rounded bg-zinc-900 border border-zinc-800 p-0.5 text-xs font-mono">
          {availableSpeeds.map((rate) => (
            <button
              key={rate}
              onClick={() => onRateChange(rate)}
              className={`px-1 py-0.5 rounded text-[9px] font-medium transition-colors ${
                playbackRate === rate
                  ? 'bg-zinc-700 text-white font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>

        {/* Restart */}
        <button
          onClick={() => onSeek(0)}
          className="text-zinc-400 hover:text-zinc-200 transition-colors p-1 rounded hover:bg-zinc-800"
          title="Replay from beginning"
        >
          <RotateCcw className="h-3 w-3" />
        </button>
      </div>
    </footer>
  );
};
