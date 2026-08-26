import { describe, expect, it } from 'vitest';
import type { WorkspaceFile } from '../../types/scrim';
import { buildWorkspaceTree, filterWorkspaceTree, visibleWorkspaceFilePaths, workspaceFolderAncestors } from './workspaceTreeModel';

function file(path: string): WorkspaceFile {
  return { name: path.split('/').at(-1)!, path, content: '', language: path.endsWith('.json') ? 'json' : 'javascript' };
}

describe('workspaceTreeModel', () => {
  const files = {
    'package.json': file('package.json'),
    'demo/demo.js': file('demo/demo.js'),
    'demo/index.html': { ...file('demo/index.html'), language: 'html' as const },
    'app/pages/home/locales/locales.json': file('app/pages/home/locales/locales.json'),
    'app/pages/home/home.js': file('app/pages/home/home.js'),
  };

  it('construye carpetas antes de archivos y conserva la ruta completa', () => {
    const tree = buildWorkspaceTree(files);
    expect(tree.map((node) => `${node.kind}:${node.name}`)).toEqual(['folder:app', 'folder:demo', 'file:package.json']);
    const app = tree[0];
    expect(app.kind === 'folder' && app.children[0].path).toBe('app/pages');
  });

  it('calcula todos los ancestros que deben abrirse para revelar el archivo activo', () => {
    expect(workspaceFolderAncestors('app/pages/home/locales/locales.json')).toEqual([
      'app', 'app/pages', 'app/pages/home', 'app/pages/home/locales',
    ]);
  });

  it('filtra archivos sin perder sus carpetas de contexto', () => {
    const result = filterWorkspaceTree(buildWorkspaceTree(files), 'locales.json');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ kind: 'folder', path: 'app' });
    const allOpen = new Set(workspaceFolderAncestors('app/pages/home/locales/locales.json'));
    expect(visibleWorkspaceFilePaths(result, allOpen)).toEqual(['app/pages/home/locales/locales.json']);
  });
});
