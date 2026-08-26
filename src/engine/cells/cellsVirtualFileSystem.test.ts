import { describe, expect, it } from 'vitest';
import type { WorkspaceSnapshot } from '../../types/scrim';
import {
  createVersionedCellsWorkspace,
  normalizeCellsPath,
  writeCellsFile,
} from './cellsVirtualFileSystem';

const base: WorkspaceSnapshot = {
  activeFilePath: 'src/academy-card.js',
  files: {
    'src/academy-card.js': {
      name: 'academy-card.js',
      path: 'src/academy-card.js',
      language: 'javascript',
      content: 'export class AcademyCard {}',
    },
  },
};

describe('filesystem virtual Cells', () => {
  it('normaliza rutas POSIX relativas sin depender del sistema anfitrión', () => {
    expect(normalizeCellsPath('./src//components/./card.js')).toBe('src/components/card.js');
    expect(normalizeCellsPath('demo\\basic.html')).toBe('demo/basic.html');
  });

  it.each(['/etc/passwd', '../secret.js', 'src/../../secret.js', '', '.', 'src/']) (
    'rechaza la ruta fuera del contrato virtual: %s',
    (path) => expect(() => normalizeCellsPath(path)).toThrow(),
  );

  it('escribe de forma inmutable e incrementa la generación', () => {
    const current = createVersionedCellsWorkspace(base, 4);
    const next = writeCellsFile(current, 'locales/es.json', '{"academy-card.heading":"Hola"}');

    expect(next.generation).toBe(5);
    expect(next.snapshot.files['locales/es.json']).toMatchObject({
      path: 'locales/es.json',
      name: 'es.json',
      language: 'json',
    });
    expect(current.snapshot.files['locales/es.json']).toBeUndefined();
    expect(next.snapshot.files['src/academy-card.js']).toBe(current.snapshot.files['src/academy-card.js']);
  });

  it('rechaza colisiones entre archivo y directorio implícito', () => {
    const current = createVersionedCellsWorkspace(base);
    const withFileAtDirectory = writeCellsFile(current, 'demo', 'archivo');

    expect(() => writeCellsFile(withFileAtDirectory, 'demo/basic.html', '<p>demo</p>')).toThrow(/colisi/i);
    expect(() => writeCellsFile(current, 'src', 'archivo')).toThrow(/colisi/i);
  });

  it('aplica límites de tamaño y cantidad antes de aceptar un parche', () => {
    const tiny: WorkspaceSnapshot = {
      activeFilePath: 'a.js',
      files: {
        'a.js': { name: 'a.js', path: 'a.js', language: 'javascript', content: '1234' },
      },
    };
    const current = createVersionedCellsWorkspace(tiny, 0, {
      maxFiles: 1,
      maxFileBytes: 8,
      maxWorkspaceBytes: 32,
    });

    expect(() => writeCellsFile(current, 'README.md', 'nuevo')).toThrow(/cantidad/i);
    expect(() => writeCellsFile(current, 'a.js', '123456789')).toThrow(/tamaño|8 bytes/i);
  });
});
