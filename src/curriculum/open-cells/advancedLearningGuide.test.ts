import { posix } from 'node:path';
import { describe, expect, it } from 'vitest';
import { OPEN_CELLS_SCRIMS } from './course';

describe('advanced project guide delivery', () => {
  it.each(Array.from({ length: 10 }, (_, index) => index + 75))('delivers a reachable guide with resolvable owner links for lesson %i', (number) => {
    const files = OPEN_CELLS_SCRIMS[`open-cells-${number}`].initialWorkspace.files;
    const guide = files['docs/recorrido.md'];
    expect(guide).toBeDefined();
    const readmeTargets = [...files['README.md'].content.matchAll(/\]\(([^)]+)\)/g)].map((match) => match[1]);
    expect(readmeTargets).toContain('docs/recorrido.md');
    const links = [...guide.content.matchAll(/\]\(([^)]+)\)/g)].map((match) => match[1]);
    expect(links.length).toBeGreaterThanOrEqual(3);
    for (const target of links) expect(files[posix.normalize(posix.join('docs', target))], target).toBeDefined();
  });
});
