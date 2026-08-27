import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Timeline } from './Timeline';
import type { ScrimChallenge } from '../../types/scrim';

const makeChallenge = (id: string, timestamp: number): ScrimChallenge => ({
  id,
  title: id,
  timestamp,
  instructions: '',
  tests: [],
  hints: [],
});

const renderTimeline = () =>
  renderToStaticMarkup(
    <Timeline
      currentTimeMs={5000}
      durationMs={120000}
      isPlaying={false}
      playbackRate={1}
      chapters={[{ timestamp: 2500, title: 'Variables' }]}
      challenges={[makeChallenge('reto-uno', 5000)]}
      onPlay={() => undefined}
      onPause={() => undefined}
      onSeek={() => undefined}
      onRateChange={() => undefined}
      onToggleCaptions={() => undefined}
    />
  );

describe('Timeline', () => {
  it('expone el seek como un control accesible', () => {
    const markup = renderTimeline();

    expect(markup).toContain('role="slider"');
    expect(markup).toContain('aria-label="Progreso de la clase"');
    expect(markup).toContain('tabindex="0"');
    expect(markup).toContain('aria-valuenow="5000"');
  });

  it('mantiene los textos visibles y tooltips en español', () => {
    const markup = renderTimeline();

    expect(markup).toContain('Capítulo: Variables');
    expect(markup).toContain('Reto: reto-uno');
    expect(markup).toContain('Activar o desactivar subtítulos');
    expect(markup).toContain('Retroceder 5 s');
    expect(markup).toContain('Avanzar 5 s');
    expect(markup).toContain('-5 s');
    expect(markup).toContain('+5 s');
    expect(markup).toContain('Repetir desde el principio');
    expect(markup).not.toContain('Challenge');
    expect(markup).not.toContain('Chapter');
  });

  it('mantiene la máscara cyber separada de los controles que abren menús', () => {
    const markup = renderTimeline();

    expect(markup).toContain('class="player-bar-hud-surface"');
    expect(markup).toContain('aria-hidden="true"');
  });

  it('elige el reto más cercano al tiempo del cursor', async () => {
    const timelineModule = (await import('./Timeline')) as unknown as {
      getClosestChallenge: (
        challenges: ScrimChallenge[],
        hoveredTimeMs: number,
        durationMs: number
      ) => ScrimChallenge | null;
    };
    const challenges = [makeChallenge('lejano', 30000), makeChallenge('cercano', 35000)];

    expect(timelineModule.getClosestChallenge(challenges, 35000, 120000)?.id).toBe('cercano');
  });
});
