// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../themes/ThemeProvider';
import { ImprovementCenter } from './ImprovementCenter';

const api = vi.hoisted(() => ({ list: vi.fn(), listAdmin: vi.fn(), create: vi.fn(), vote: vi.fn(), queue: vi.fn(), syncReview: vi.fn() }));
vi.mock('../services/improvementApi', async () => ({
  ...(await vi.importActual('../services/improvementApi')),
  improvementApi: api,
}));

beforeEach(() => {
  vi.clearAllMocks();
  api.list.mockResolvedValue([]);
  api.create.mockResolvedValue({ id: 'proposal-1' });
});
afterEach(() => cleanup());

describe('centro de mejoras', () => {
  it('explica el flujo y permite enviar una propuesta concreta', async () => {
    render(<ThemeProvider><ImprovementCenter canAdmin={false} onClose={vi.fn()} /></ThemeProvider>);
    expect(await screen.findByText('Propón una mejora')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Título corto'), { target: { value: 'Aclarar la práctica inicial' } });
    fireEvent.change(screen.getByLabelText('Qué debería mejorar'), { target: { value: 'La instrucción debería decir con claridad qué resultado debe obtener la persona.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar propuesta' }));
    await waitFor(() => expect(api.create).toHaveBeenCalledWith(expect.objectContaining({ targetArea: 'practice' })));
  });

  it('solo un administrador puede solicitar que Muse implemente de forma autónoma', async () => {
    api.listAdmin.mockResolvedValue([{
      id: 'proposal-1', title: 'Aclarar la práctica', description: 'Una descripción extensa para la mejora.',
      targetArea: 'practice', status: 'open', votes: 2, runs: [],
    }]);
    api.queue.mockResolvedValue({ id: 'run-1', status: 'queued' });
    render(<ThemeProvider><ImprovementCenter canAdmin onClose={vi.fn()} /></ThemeProvider>);
    fireEvent.click(await screen.findByRole('button', { name: 'Implementar con Muse' }));
    await waitFor(() => expect(api.queue).toHaveBeenCalledWith('proposal-1'));
  });

  it('explica el flujo autónomo: implementa, valida, despliega y revierte si falla', async () => {
    render(<ThemeProvider><ImprovementCenter canAdmin={false} onClose={vi.fn()} /></ThemeProvider>);
    expect(await screen.findByText(/Muse lo implementa, valida y despliega automáticamente/)).toBeTruthy();
    expect(screen.getByText(/si falla, revierte/)).toBeTruthy();
    expect(screen.queryByText(/borrador revisable/)).toBeNull();
    expect(screen.queryByText(/borrador listo/)).toBeNull();
  });

  it('muestra el contador con texto accesible "propuestas visibles" y singular correcto', async () => {
    api.list.mockResolvedValue([]);
    const { unmount } = render(<ThemeProvider><ImprovementCenter canAdmin={false} onClose={vi.fn()} /></ThemeProvider>);
    expect(await screen.findByText('0 propuestas visibles')).toBeTruthy();
    unmount();

    api.list.mockResolvedValue([{
      id: 'proposal-1', title: 'Aclarar la práctica', description: 'Una descripción extensa para la mejora.',
      targetArea: 'practice', status: 'open', votes: 1, votesByMe: false, votedByMe: false, runs: [],
    }]);
    render(<ThemeProvider><ImprovementCenter canAdmin={false} onClose={vi.fn()} /></ThemeProvider>);
    expect(await screen.findByText('1 propuesta visible')).toBeTruthy();
    expect(screen.queryByText('1 propuestas visibles')).toBeNull();
  });

  it('enlaza el PR real y muestra el resultado de CI al administrador', async () => {
    api.listAdmin.mockResolvedValue([{
      id: 'proposal-1', title: 'Corregir el playground', description: 'Una descripción extensa para la mejora.',
      targetArea: 'playground', status: 'preview', votes: 4, runs: [{
        id: 'run-1', status: 'succeeded', model: 'opencode/muse-spark-1.2-contributor-free',
        changedFiles: [{ path: 'src/components/playground/PlaygroundView.tsx', added: 3, deleted: 1 }],
        validation: { policy: 'passed', ci: 'passed' },
        branchName: 'community/4da358c1-corregir-el-playground', commitSha: 'a'.repeat(40),
        pullRequestNumber: 73,
        pullRequestUrl: 'https://github.com/PixelDroid19/interactive-coding-engine/pull/73',
      }],
    }]);

    render(<ThemeProvider><ImprovementCenter canAdmin onClose={vi.fn()} /></ThemeProvider>);

    const link = await screen.findByRole('link', { name: 'Ver PR #73' });
    expect(link.getAttribute('href')).toBe('https://github.com/PixelDroid19/interactive-coding-engine/pull/73');
    expect(link.getAttribute('rel')).toContain('noreferrer');
    expect(screen.getByText('CI aprobada')).toBeTruthy();
    expect(screen.getByText('Desplegado')).toBeTruthy();
    expect(screen.getByText('Validado y desplegado')).toBeTruthy();
    api.syncReview.mockResolvedValue({ status: 'published' });
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar estado desde GitHub' }));
    await waitFor(() => expect(api.syncReview).toHaveBeenCalledWith('proposal-1'));
  });
});
