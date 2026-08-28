import { LocalGenerationService } from './localGenerationService';

let session: LocalGenerationService | null = null;

export function getLocalGenerationSession(): LocalGenerationService {
  session ??= new LocalGenerationService();
  return session;
}

export function disposeLocalGenerationSession(): void {
  session?.dispose();
  session = null;
}
