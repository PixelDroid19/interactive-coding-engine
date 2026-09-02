// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../themes/ThemeProvider';
import { ImprovementCenter } from './ImprovementCenter';

const api = vi.hoisted(() => ({ list: vi.fn(), listAdmin: vi.fn(), create: vi.fn(), vote: vi.fn(), queue: vi.fn() }));
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

  it('solo un administrador puede solicitar que Muse construya un borrador', async () => {
    api.listAdmin.mockResolvedValue([{
      id: 'proposal-1', title: 'Aclarar la práctica', description: 'Una descripción extensa para la mejora.',
      targetArea: 'practice', status: 'open', votes: 2, runs: [],
    }]);
    api.queue.mockResolvedValue({ id: 'run-1', status: 'queued' });
    render(<ThemeProvider><ImprovementCenter canAdmin onClose={vi.fn()} /></ThemeProvider>);
    fireEvent.click(await screen.findByRole('button', { name: 'Construir borrador con Muse' }));
    await waitFor(() => expect(api.queue).toHaveBeenCalledWith('proposal-1'));
  });
});
