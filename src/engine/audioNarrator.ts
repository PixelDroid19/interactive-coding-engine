import { AudioTrackInfo, type NarrationMode } from '../types/scrim';

const CAPTION_MAX_CHARACTERS = 150;

export function splitCaptionText(text: string, maxCharacters = CAPTION_MAX_CHARACTERS): string[] {
  const normalized = text.trim().replace(/\s+/g, ' ');
  if (!normalized) return [];

  const sentences = normalized.split(/(?<=[.!?…])\s+/u);
  const chunks: string[] = [];

  for (const sentence of sentences) {
    if (sentence.length <= maxCharacters) {
      chunks.push(sentence);
      continue;
    }

    const words = sentence.split(' ');
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length <= maxCharacters || !current) {
        current = candidate;
      } else {
        chunks.push(current);
        current = word;
      }
    }
    if (current) chunks.push(current);
  }

  return chunks;
}

export interface PreciseAudioClockState {
  timeMs: number;
  isPlaying: boolean;
  isStalled: boolean;
  source: 'hardware-audio' | 'speech-synthesis' | 'synthetic-timeline';
}

export class AudioNarrator {
  private audioElement: HTMLAudioElement | null = null;
  private narrationScript: { timestamp: number; text: string; voiceRate?: number }[] = [];
  private lastSpokenIndex = -1;
  private isPlaying = false;
  private isMuted = false;
  private volume = 0.5;
  private playbackRate = 1.0;
  private onSubtitleChangeCallback?: (text: string | null) => void;
  private onEndedCallback?: () => void;
  private currentBlobUrl?: string;
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private subtitleClearTimeout: any = null;
  private displayedSubtitle: string | null = null;
  private narrationMode: NarrationMode = 'audio';

  // High-precision clock tracking
  private audioBaseTimeMs = 0;
  private audioBaseWallTime = 0;
  private isAudioStalled = false;
  private isAudioSeeking = false;
  private fallbackClockMs = 0;
  private fallbackClockWallTime = 0;

  constructor(onSubtitleChange?: (text: string | null) => void) {
    this.onSubtitleChangeCallback = onSubtitleChange;
  }

  public setSubtitleCallback(cb: (text: string | null) => void): void {
    this.onSubtitleChangeCallback = cb;
  }

  private trackLanguage = 'es';

  public loadTrack(trackInfo?: AudioTrackInfo, narrationMode: NarrationMode = 'audio'): void {
    this.stop();
    this.narrationMode = narrationMode;
    this.lastSpokenIndex = -1;
    this.audioBaseTimeMs = 0;
    this.audioBaseWallTime = performance.now();
    this.fallbackClockMs = 0;
    this.fallbackClockWallTime = performance.now();

    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = undefined;
    }

    if (narrationMode === 'audio' && trackInfo?.audioBlob) {
      this.currentBlobUrl = URL.createObjectURL(trackInfo.audioBlob);
      this.initAudioElement(this.currentBlobUrl);
    } else if (narrationMode === 'audio' && trackInfo?.url) {
      this.initAudioElement(trackInfo.url);
    } else {
      this.destroyAudioElement();
    }

    this.trackLanguage = trackInfo?.language || 'es';

    if (trackInfo?.narrationScript) {
      this.narrationScript = [...trackInfo.narrationScript].sort((a, b) => a.timestamp - b.timestamp);
    } else {
      this.narrationScript = [];
    }
  }

  private initAudioElement(src: string): void {
    this.destroyAudioElement();

    const audio = new Audio();
    audio.src = src;
    audio.playbackRate = this.playbackRate;
    audio.volume = this.volume;
    audio.muted = this.isMuted || this.volume <= 0;
    audio.preload = 'auto';

    // High-precision time sync listeners
    audio.ontimeupdate = () => {
      this.audioBaseTimeMs = audio.currentTime * 1000;
      this.audioBaseWallTime = performance.now();
    };

    audio.onplaying = () => {
      this.isAudioStalled = false;
      this.isAudioSeeking = false;
      this.audioBaseTimeMs = audio.currentTime * 1000;
      this.audioBaseWallTime = performance.now();
    };

    audio.onpause = () => {
      this.audioBaseTimeMs = audio.currentTime * 1000;
      this.audioBaseWallTime = performance.now();
    };

    audio.onwaiting = () => {
      this.isAudioStalled = true;
    };

    audio.onseeking = () => {
      this.isAudioSeeking = true;
      this.audioBaseTimeMs = audio.currentTime * 1000;
      this.audioBaseWallTime = performance.now();
    };

    audio.onseeked = () => {
      this.isAudioSeeking = false;
      this.audioBaseTimeMs = audio.currentTime * 1000;
      this.audioBaseWallTime = performance.now();
    };

    audio.onended = () => {
      this.isPlaying = false;
      this.onEndedCallback?.();
    };

    audio.onerror = (e) => {
      console.warn('Audio element playback error, falling back to speech/timeline clock:', e);
      this.isAudioStalled = false;
      this.destroyAudioElement();
    };

    this.audioElement = audio;
  }

  private destroyAudioElement(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
      this.audioElement.ontimeupdate = null;
      this.audioElement.onplaying = null;
      this.audioElement.onpause = null;
      this.audioElement.onwaiting = null;
      this.audioElement.onseeking = null;
      this.audioElement.onseeked = null;
      this.audioElement.onended = null;
      this.audioElement.onerror = null;
      this.audioElement = null;
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    this.applyOutputLevel();
    if (muted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.activeUtterance = null;
    }
  }

  public setVolume(volume: number): void {
    this.volume = Math.min(1, Math.max(0, volume));
    this.applyOutputLevel();
  }

  public getVolume(): number {
    return this.volume;
  }

  public getIsMuted(): boolean {
    return this.isMuted || this.volume <= 0;
  }

  private applyOutputLevel(): void {
    if (!this.audioElement) return;
    this.audioElement.volume = this.volume;
    this.audioElement.muted = this.isMuted || this.volume <= 0;
  }

  public play(fromMs: number): void {
    this.isPlaying = true;
    this.fallbackClockMs = fromMs;
    this.fallbackClockWallTime = performance.now();

    if (this.audioElement && this.audioElement.src) {
      this.audioElement.currentTime = fromMs / 1000;
      this.audioElement.playbackRate = this.playbackRate;
      this.applyOutputLevel();
      this.audioBaseTimeMs = fromMs;
      this.audioBaseWallTime = performance.now();

      this.audioElement.play().catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.warn('Audio playback waiting for user activation or permission:', err);
      });
    } else {
      this.lastSpokenIndex = this.findLastSpokenIndexAt(fromMs);
      this.speakCurrentMarker(fromMs);
    }
  }

  public pause(): void {
    this.isPlaying = false;
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioBaseTimeMs = this.audioElement.currentTime * 1000;
      this.audioBaseWallTime = performance.now();
    }
    this.cancelSpeech();
  }

  public stop(): void {
    this.pause();
    this.lastSpokenIndex = -1;
    this.clearSubtitle();
  }

  public seek(toMs: number): void {
    this.cancelSpeech();
    this.fallbackClockMs = toMs;
    this.fallbackClockWallTime = performance.now();

    if (this.audioElement && this.audioElement.src) {
      this.audioElement.currentTime = toMs / 1000;
      this.audioBaseTimeMs = toMs;
      this.audioBaseWallTime = performance.now();
    }

    this.lastSpokenIndex = this.findLastSpokenIndexAt(toMs);

    if (this.isPlaying) {
      this.speakCurrentMarker(toMs);
    } else {
      // Update subtitle if paused at a cue
      const idx = this.findLastSpokenIndexAt(toMs);
      if (idx >= 0 && idx < this.narrationScript.length) {
        const item = this.narrationScript[idx];
        const nextTime = idx + 1 < this.narrationScript.length ? this.narrationScript[idx + 1].timestamp : item.timestamp + 4000;
        if (toMs >= item.timestamp && toMs < nextTime) {
          this.emitSubtitle(this.captionAt(idx, toMs));
        } else {
          this.clearSubtitle();
        }
      } else {
        this.clearSubtitle();
      }
    }
  }

  public setPlaybackRate(rate: number): void {
    this.playbackRate = rate;
    if (this.audioElement) {
      this.audioElement.playbackRate = rate;
    }
  }

  /**
   * Retrieves high-precision master audio presentation time in milliseconds.
   * Interpolates between browser discrete audio updates to provide frame-perfect sub-millisecond timestamps.
   */
  public getPreciseAudioTimeMs(): PreciseAudioClockState {
    if (this.audioElement && this.audioElement.src) {
      if (this.isPlaying && !this.isAudioStalled && !this.isAudioSeeking) {
        const elapsedWallMs = Math.max(0, performance.now() - this.audioBaseWallTime);
        const interpolatedMs = this.audioBaseTimeMs + elapsedWallMs * this.playbackRate;
        return {
          timeMs: interpolatedMs,
          isPlaying: this.isPlaying,
          isStalled: this.isAudioStalled,
          source: 'hardware-audio',
        };
      }

      return {
        timeMs: (this.audioElement.currentTime || 0) * 1000,
        isPlaying: this.isPlaying,
        isStalled: this.isAudioStalled,
        source: 'hardware-audio',
      };
    }

    // Fallback: Synchronized Speech or Timeline Clock
    if (this.isPlaying) {
      const elapsedWallMs = Math.max(0, performance.now() - this.fallbackClockWallTime);
      const computedMs = this.fallbackClockMs + elapsedWallMs * this.playbackRate;
      return {
        timeMs: computedMs,
        isPlaying: this.isPlaying,
        isStalled: false,
          source: this.narrationMode === 'silent' || this.narrationScript.length === 0
            ? 'synthetic-timeline'
            : 'speech-synthesis',
      };
    }

    return {
      timeMs: this.fallbackClockMs,
      isPlaying: false,
      isStalled: false,
      source: this.narrationMode === 'silent' || this.narrationScript.length === 0
        ? 'synthetic-timeline'
        : 'speech-synthesis',
    };
  }

  private hasHardwareAudio(): boolean {
    return Boolean(this.audioElement && this.audioElement.src);
  }

  public onTimeTick(currentMs: number): void {
    if (!this.isPlaying) return;

    this.fallbackClockMs = currentMs;
    this.fallbackClockWallTime = performance.now();

    if (this.narrationScript.length > 0) {
      for (let i = this.lastSpokenIndex + 1; i < this.narrationScript.length; i++) {
        const item = this.narrationScript[i];
        if (currentMs >= item.timestamp) {
          this.lastSpokenIndex = i;
          this.speakText(item.text, item.voiceRate, this.captionAt(i, currentMs) ?? undefined);
        } else {
          break;
        }
      }

      // Check if current subtitle should be cleared
      const activeIdx = this.findLastSpokenIndexAt(currentMs);
      if (activeIdx >= 0 && activeIdx < this.narrationScript.length) {
        const item = this.narrationScript[activeIdx];
        const nextTime = activeIdx + 1 < this.narrationScript.length ? this.narrationScript[activeIdx + 1].timestamp : item.timestamp + 5000;
        if (currentMs >= nextTime) {
          this.clearSubtitle();
        } else {
          this.emitSubtitle(this.captionAt(activeIdx, currentMs));
        }
      }
    }
  }

  private findLastSpokenIndexAt(timeMs: number): number {
    let idx = -1;
    for (let i = 0; i < this.narrationScript.length; i++) {
      if (this.narrationScript[i].timestamp <= timeMs) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }

  private speakCurrentMarker(timeMs: number): void {
    const idx = this.findLastSpokenIndexAt(timeMs);
    if (idx >= 0 && idx < this.narrationScript.length) {
      const item = this.narrationScript[idx];
      const nextTime = idx + 1 < this.narrationScript.length ? this.narrationScript[idx + 1].timestamp : item.timestamp + 4000;
      if (timeMs >= item.timestamp && timeMs < nextTime) {
        this.speakText(item.text, item.voiceRate, this.captionAt(idx, timeMs) ?? undefined);
      }
    }
  }

  private captionAt(index: number, timeMs: number): string | null {
    const cue = this.narrationScript[index];
    if (!cue) return null;
    const chunks = splitCaptionText(cue.text);
    if (chunks.length === 0) return null;
    if (chunks.length === 1) return chunks[0];

    const nextCue = this.narrationScript[index + 1];
    const estimatedDuration = Math.max(5000, cue.text.split(/\s+/).length * 330);
    const end = nextCue?.timestamp ?? cue.timestamp + estimatedDuration;
    const duration = Math.max(1, end - cue.timestamp);
    const elapsed = Math.max(0, Math.min(duration - 1, timeMs - cue.timestamp));
    const totalWeight = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const target = (elapsed / duration) * totalWeight;
    let accumulated = 0;

    for (const chunk of chunks) {
      accumulated += chunk.length;
      if (target < accumulated) return chunk;
    }
    return chunks[chunks.length - 1];
  }

  private cancelSpeech(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // ignore
      }
    }
    this.activeUtterance = null;
  }

  private clearSubtitle(): void {
    if (this.subtitleClearTimeout) {
      clearTimeout(this.subtitleClearTimeout);
      this.subtitleClearTimeout = null;
    }
    this.emitSubtitle(null);
  }

  private emitSubtitle(text: string | null): void {
    if (this.displayedSubtitle === text) return;
    this.displayedSubtitle = text;
    this.onSubtitleChangeCallback?.(text);
  }

  private speakText(text: string, voiceRate = 1.0, subtitleText = text): void {
    this.emitSubtitle(subtitleText);

    // Hardware audio is the master voice. Do not double-speak over it.
    if (this.hasHardwareAudio()) return;
    if (this.narrationMode === 'silent') return;
    if (this.isMuted || this.volume <= 0) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      this.cancelSpeech();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.trackLanguage.startsWith('es') ? 'es-ES' : this.trackLanguage;
      utterance.rate = Math.min(1.6, Math.max(0.7, this.playbackRate * (voiceRate || 1.0)));
      utterance.pitch = 1.0;
      utterance.volume = this.isMuted ? 0 : this.volume;

      const voices = window.speechSynthesis.getVoices();
      const langPrefix = this.trackLanguage.slice(0, 2);
      const preferredVoice =
        voices.find(
          (v) =>
            v.lang.toLowerCase().startsWith(langPrefix) &&
            (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Monica') || v.name.includes('Paloma') || v.name.includes('Juan'))
        ) || voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => {
        this.activeUtterance = null;
      };

      utterance.onerror = () => {
        this.activeUtterance = null;
      };

      this.activeUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis playback error:', e);
    }
  }

  public destroy(): void {
    this.stop();
    this.clearSubtitle();
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
    }
    this.destroyAudioElement();
  }
}
