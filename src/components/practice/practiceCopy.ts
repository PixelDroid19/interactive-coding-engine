export type PracticeCopyPriority = 'first' | 'last';

export interface SplitPracticeCopy {
  action: string;
  context?: string;
}

function words(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function splitPracticeCopy(text: string, priority: PracticeCopyPriority = 'first'): SplitPracticeCopy {
  const normalized = text.trim().replace(/[ \t]+/g, ' ');
  if (!normalized || (priority === 'first' && words(normalized) <= 28)) return { action: normalized };

  const sentences = normalized
    .replace(/\n+/g, ' ')
    .match(/[^.!?]+(?:[.!?]+|$)/g)
    ?.map((sentence) => sentence.trim())
    .filter(Boolean) ?? [normalized];

  if (sentences.length < 2) return { action: normalized };

  const actionIndex = priority === 'last' ? sentences.length - 1 : 0;
  const action = sentences[actionIndex];
  const context = sentences.filter((_, index) => index !== actionIndex).join(' ');
  return { action, context: context || undefined };
}
