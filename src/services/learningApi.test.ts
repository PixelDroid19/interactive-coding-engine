import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchPublishedLesson } from './learningApi';

afterEach(() => vi.restoreAllMocks());

describe('learning API', () => {
  it('hidrata snapshots y reemplaza el audio con la URL R2 publicada', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      key: 'open-cells-01',
      contentHash: 'a'.repeat(64),
      snapshotIntervalMs: 4000,
      scrim: {
        id: 'open-cells-01', title: 'Lección', description: 'Remota', templateId: 'cells-component', durationMs: 1000,
        initialWorkspace: { files: { 'app.js': { name: 'app.js', path: 'app.js', content: '', language: 'javascript' } }, activeFilePath: 'app.js' },
        events: [], challenges: [], skillsIntroduced: [], skillsRequired: [], learningObjectives: [], commonMistakes: [],
        createdAt: 1, updatedAt: 1, audioTrack: { url: '/audio/local.mp3', durationMs: 1000, narrationScript: [] },
      },
      audio: { url: `https://media.example/audio/${'b'.repeat(64)}.mp3`, durationMs: 2500 },
    }), { status: 200, headers: { 'content-type': 'application/json' } }));

    const lesson = await fetchPublishedLesson('open-cells-01');
    expect(lesson.durationMs).toBe(2500);
    expect(lesson.audioTrack?.url).toMatch(/^https:\/\/media\.example/);
    expect(lesson.snapshots).toEqual([]);
  });

  it('rechaza una respuesta que intenta sustituir otra lección', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ key: 'open-cells-99' }), { status: 200 }));
    await expect(fetchPublishedLesson('open-cells-01')).rejects.toThrow('otra lección');
  });
});
