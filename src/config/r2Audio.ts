import { R2_AUDIO_BY_LESSON } from './r2AudioManifest.generated';

export function resolvePublishedAudioUrl(lessonId: string, declaredUrl?: string): string | undefined {
  return R2_AUDIO_BY_LESSON[lessonId]?.url ?? declaredUrl;
}

export { R2_AUDIO_BY_LESSON };
