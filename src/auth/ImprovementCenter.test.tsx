// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../themes/ThemeProvider';
import { ImprovementCenter } from './ImprovementCenter';

const api = vi.hoisted(() => ({ list: vi.fn(), listCycles: vi.fn(), listAdmin: vi.fn(), create: vi.fn(), vote: vi.fn() }));
vi.mock('../services/improvementApi', async () => ({
  ...(await vi.importActual('../services/improvementApi')),
  improvementApi: api,
}));

beforeEach(() => {
  vi.clearAllMocks();
  api.list.mockResolvedValue([]);
  api.listCycles.mockResolvedValue([]);
  api.create.mockResolvedValue({ id: 'proposal-1' });
});
afterEach(() => cleanup());

describe('centro de mejoras', () => {
  it('muestra el rótulo accesible “Mejoras de la comunidad”', async () => {
    render(<ThemeProvider><ImprovementCenter canAdmin={false} onClose={vi.fn()} /></ThemeProvider>);
    expect(await screen.findByText('Mejoras de la comunidad')).toBeTruthy();
    expect(screen.queryByText('Mejoras abiertas')).toBeNull();
  });

  it('explica el flujo y permite enviar una propuesta concreta', async () => {
    render(<ThemeProvider><ImprovementCenter canAdmin={false} onClose={vi.fn()} /></ThemeProvider>);
    expect(await screen.findByText('Propón una mejora')).toBeTruthy();
    expect(screen.getByText(/Cada 30 minutos, agrupamos ideas parecidas/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Título corto'), { target: { value: 'Aclarar la práctica inicial' } });
    fireEvent.change(screen.getByLabelText('Qué debería mejorar'), { target: { value: 'La instrucción debería decir con claridad qué resultado debe obtener la persona.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar propuesta' }));
    await waitFor(() => expect(api.create).toHaveBeenCalledWith(expect.objectContaining({ targetArea: 'practice' })));
  });

  it('no exige que un administrador apruebe o inicie la propuesta ganadora', async () => {
    api.listAdmin.mockResolvedValue([{
      id: 'proposal-1', title: 'Aclarar la práctica', description: 'Una descripción extensa para la mejora.',
      targetArea: 'practice', status: 'open', votes: 2, runs: [],
    }]);
    render(<ThemeProvider><ImprovementCenter canAdmin onClose={vi.fn()} /></ThemeProvider>);
    expect(await screen.findByText(/Cada 30 minutos, agrupamos ideas parecidas/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Muse/ })).toBeNull();
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
      targetArea: 'playground', status: 'published', votes: 4, runs: [{
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
    expect(screen.getByText('Desplegado y verificado')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Actualizar estado/ })).toBeNull();
  });

  it('distingue validación previa de despliegue: published es Desplegado y fallido/rechazado no afirman reversión', async () => {
    api.list.mockResolvedValue([
      { id: 'proposal-published', title: 'Mejora publicada', description: 'Descripción extensa publicada.', targetArea: 'interface', status: 'published', votes: 5, votedByMe: false, runs: [] },
      { id: 'proposal-failed', title: 'Mejora fallida', description: 'Descripción extensa fallida.', targetArea: 'interface', status: 'failed', votes: 1, votedByMe: false, runs: [] },
      { id: 'proposal-rejected', title: 'Mejora rechazada', description: 'Descripción extensa rechazada.', targetArea: 'interface', status: 'rejected', votes: 1, votedByMe: false, runs: [] },
    ]);
    render(<ThemeProvider><ImprovementCenter canAdmin={false} onClose={vi.fn()} /></ThemeProvider>);
    expect(await screen.findByText('Desplegado')).toBeTruthy();
    expect(screen.getByText('Falló')).toBeTruthy();
    expect(screen.getByText('Rechazada')).toBeTruthy();
    expect(screen.queryByText(/revert/i)).toBeNull();
    expect(screen.queryByText(/revers/i)).toBeNull();
  });

  it('muestra la evidencia del último ciclo sin exponer identificadores agrupados', async () => {
    api.listCycles.mockResolvedValue([{
      id: 'cycle-1', closedAt: '2026-09-02T13:30:00.000Z', candidateCount: 4, clusterCount: 2,
      winningScore: 3, rationale: 'Gana el grupo con 3 personas únicas y 2 propuestas equivalentes.',
      winner: { id: 'proposal-1', title: 'Instrucciones más claras', status: 'published' },
      clusters: [{ targetArea: 'practice', score: 3 }, { targetArea: 'interface', score: 1 }],
    }]);
    render(<ThemeProvider><ImprovementCenter canAdmin={false} onClose={vi.fn()} /></ThemeProvider>);

    expect(await screen.findByText('Último ciclo')).toBeTruthy();
    expect(screen.getByText('4 propuestas · 2 grupos · 3 personas apoyaron al ganador')).toBeTruthy();
    expect(screen.getByText('Instrucciones más claras')).toBeTruthy();
  });

  it('identifica una propuesta agrupada y no permite votarla', async () => {
    api.listAdmin.mockResolvedValue([{
      id: 'proposal-2', title: 'Otra instrucción clara', description: 'Se agrupó con una propuesta equivalente.',
      targetArea: 'practice', status: 'grouped', votes: 2, votedByMe: false,
      mergedIntoProposalId: 'proposal-1', runs: [],
    }]);
    render(<ThemeProvider><ImprovementCenter canAdmin onClose={vi.fn()} /></ThemeProvider>);

    expect(await screen.findByText('Agrupada con otra idea')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Votar por Otra instrucción clara' }).hasAttribute('disabled')).toBe(true);
  });

  it('muestra el estado vacío “Aún no hay ciclos cerrados” cuando no hay ciclos y conserva la lista', async () => {
    api.list.mockResolvedValue([{
      id: 'proposal-1', title: 'Aclarar la práctica', description: 'Una descripción extensa para la mejora.',
      targetArea: 'practice', status: 'open', votes: 1, votedByMe: false, runs: [],
    }]);
    api.listCycles.mockResolvedValue([]);
    render(<ThemeProvider><ImprovementCenter canAdmin={false} onClose={vi.fn()} /></ThemeProvider>);

    const empty = await screen.findByText('Aún no hay ciclos cerrados');
    expect(empty.getAttribute('role')).toBe('status');
    expect(screen.getByText('Aclarar la práctica')).toBeTruthy();
    expect(screen.queryByText('Último ciclo')).toBeNull();
  });

  it('no muestra el estado vacío cuando hay un ciclo cerrado', async () => {
    api.listCycles.mockResolvedValue([{
      id: 'cycle-1', closedAt: '2026-09-02T13:30:00.000Z', candidateCount: 2, clusterCount: 1,
      winningScore: 2, rationale: 'Gana el grupo con 2 personas únicas.',
      winner: { id: 'proposal-1', title: 'Instrucciones más claras', status: 'published' },
      clusters: [{ targetArea: 'practice', score: 2 }],
    }]);
    render(<ThemeProvider><ImprovementCenter canAdmin={false} onClose={vi.fn()} /></ThemeProvider>);

    expect(await screen.findByText('Último ciclo')).toBeTruthy();
    expect(screen.queryByText('Aún no hay ciclos cerrados')).toBeNull();
  });
});
