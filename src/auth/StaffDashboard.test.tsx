// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../themes/ThemeProvider';
import { StaffDashboard } from './StaffDashboard';

const api = vi.hoisted(() => ({
  overview: vi.fn(), learners: vi.fn(), learner: vi.fn(), threads: vi.fn(), users: vi.fn(),
  accessRules: vi.fn(), courses: vi.fn(), leaveFeedback: vi.fn(), reply: vi.fn(),
  grantRole: vi.fn(), revokeRole: vi.fn(), setUserStatus: vi.fn(), upsertAccessRule: vi.fn(),
  deleteAccessRule: vi.fn(), setCourseAvailability: vi.fn(), courseAccess: vi.fn(),
  lockCourseForUser: vi.fn(), unlockCourseForUser: vi.fn(), updateCourseContent: vi.fn(),
}));

vi.mock('../services/staffDashboardApi', async () => {
  const actual = await vi.importActual('../services/staffDashboardApi');
  return { ...actual, staffDashboardApi: api };
});

const learner = {
  id: 'learner-1', email: 'persona@example.com', displayName: 'Persona Ejemplo', status: 'active',
  emailVerifiedAt: '2026-08-30T12:00:00.000Z', lastSeenAt: '2026-08-30T12:00:00.000Z',
  progressItems: 3, completed: 1, lowestSkillScore: 0.4, skillsAtRisk: 2,
};

beforeEach(() => {
  vi.clearAllMocks();
  api.overview.mockResolvedValue({
    learners: 1, anonymousLearners: 2, active30d: 3, active7d: 2, completedItems: 4,
    anonymousCompletedItems: 5, needsSupport: 1, openThreads: 0, verifiedLearners: 1,
    verificationPending: 0, attempts30d: 3, failedAttempts30d: 1, pendingFeedback: 0,
    latestActivityAt: '2026-08-30T12:00:00.000Z',
    activity7d: [{ day: '2026-08-30', events: 4, activeActors: 2, completions: 1 }],
    courses: [{ courseSlug: 'fundamentos', title: 'Fundamentos', learners: 1, progressItems: 3, completedItems: 1, averageScore: 0.8, attempts: 3, attemptsToReview: 1 }],
  });
  api.learners.mockResolvedValue([learner]);
  api.threads.mockResolvedValue([]);
  api.users.mockResolvedValue([{ id: 'admin-1', email: 'admin@example.com', displayName: 'Admin', status: 'active', roles: ['admin'] }]);
  api.accessRules.mockResolvedValue([]);
  api.courses.mockResolvedValue([{
    slug: 'fundamentos', title: 'Fundamentos', description: 'Aprende desde cero.',
    metadata: { tagline: 'Programa desde el inicio', level: 'Beginner', tags: ['JavaScript'] },
    availability: 'available', availabilityReason: null,
  }]);
  api.courseAccess.mockResolvedValue([]);
  api.lockCourseForUser.mockResolvedValue({
    userId: 'learner-1', courseSlug: 'fundamentos', title: 'Fundamentos', availability: 'locked',
    reason: 'Acompañamiento pendiente.', updatedAt: '2026-08-30T12:00:00.000Z',
  });
  api.unlockCourseForUser.mockResolvedValue(undefined);
  api.updateCourseContent.mockResolvedValue({ slug: 'fundamentos', version: 2 });
  api.learner.mockResolvedValue({
    user: { ...learner, roles: ['student'], actorId: 'actor-1' },
    progress: [{ courseSlug: 'fundamentos', lessonKey: 'fundamentos-01', status: 'in_progress', playbackMs: 6000, score: 40, updatedAt: '2026-08-30T12:00:00.000Z' }],
    attempts: [{ id: 'attempt-1', courseSlug: 'fundamentos', itemKey: 'fundamentos-01-debug', kind: 'debugging', result: 'failure', score: 40, response: {}, diagnostics: {}, occurredAt: '2026-08-30T12:00:00.000Z' }],
    skills: [{ courseSlug: 'fundamentos', skillKey: 'funciones', capability: 'aplicar', attempts: 3, successes: 1, score: 0.4, lastResult: 'failure', lastPracticedAt: '2026-08-30T12:00:00.000Z' }], feedback: [],
  });
  api.leaveFeedback.mockResolvedValue({ id: 'feedback-1' });
});

afterEach(() => cleanup());

function renderDashboard(canAdmin: boolean) {
  return render(<ThemeProvider><StaffDashboard canAdmin={canAdmin} onClose={vi.fn()} /></ThemeProvider>);
}

describe('panel de seguimiento', () => {
  it('carga métricas y herramientas administrativas desde el backend', async () => {
    renderDashboard(true);

    expect(await screen.findByText('Personas registradas')).toBeTruthy();
    expect(screen.getByText('Necesitan refuerzo')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Cursos' }));
    expect((await screen.findByLabelText('Título de fundamentos') as HTMLInputElement).value).toBe('Fundamentos');
    expect(api.users).toHaveBeenCalledOnce();
    expect(api.accessRules).toHaveBeenCalledOnce();
    expect(api.courses).toHaveBeenCalledOnce();
  });

  it('un formador no consulta ni muestra controles exclusivos de administración', async () => {
    renderDashboard(false);

    expect(await screen.findByText('Personas registradas')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Permisos' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Cursos' })).toBeNull();
    expect(api.users).not.toHaveBeenCalled();
    expect(api.accessRules).not.toHaveBeenCalled();
    expect(api.courses).not.toHaveBeenCalled();
  });

  it('mantiene disponible el seguimiento si falla una sección administrativa secundaria', async () => {
    api.courses.mockRejectedValueOnce(new Error('Catálogo temporalmente no disponible'));
    renderDashboard(true);

    expect(await screen.findByText('Personas registradas')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('Una sección no respondió');
    expect(screen.getByText('Persona Ejemplo')).toBeTruthy();
  });

  it('permite revisar el recorrido y dejar feedback concreto', async () => {
    renderDashboard(false);
    await screen.findByText('Personas registradas');
    fireEvent.click(screen.getByRole('button', { name: 'Personas' }));
    fireEvent.click(await screen.findByRole('button', { name: /Persona Ejemplo/ }));

    expect(await screen.findByText('Conceptos a reforzar')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Curso'), { target: { value: 'fundamentos' } });
    fireEvent.change(screen.getByLabelText('Actividad'), { target: { value: 'fundamentos-01-debug' } });
    fireEvent.change(screen.getByPlaceholderText(/Explica qué hizo bien/), { target: { value: 'Repasa el caso base y vuelve a comprobarlo.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar feedback' }));

    await waitFor(() => expect(api.leaveFeedback).toHaveBeenCalledWith({
      learnerUserId: 'learner-1', courseSlug: 'fundamentos', itemKey: 'fundamentos-01-debug',
      message: 'Repasa el caso base y vuelve a comprobarlo.',
    }));
    expect(api.learner).toHaveBeenCalledTimes(2);
  });

  it('permite volver a la lista después de abrir un expediente en móvil', async () => {
    const { container } = renderDashboard(false);
    await screen.findByText('Personas registradas');
    fireEvent.click(screen.getByRole('button', { name: 'Personas' }));
    expect(container.querySelector('.staff-learners__detail')?.classList.contains('is-open')).toBe(false);
    fireEvent.click(await screen.findByRole('button', { name: /Persona Ejemplo/ }));

    expect(await screen.findByText('Conceptos a reforzar')).toBeTruthy();
    expect(container.querySelector('.staff-learners__detail')?.classList.contains('is-open')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Volver a personas' }));

    expect(screen.getByText('Selecciona una persona para revisar su recorrido.')).toBeTruthy();
    expect(screen.queryByText('Conceptos a reforzar')).toBeNull();
    expect(container.querySelector('.staff-learners__detail')?.classList.contains('is-open')).toBe(false);
  });

  it('solo abre la conversación móvil después de elegir un mensaje', async () => {
    api.threads.mockResolvedValueOnce([{
      id: 'thread-1', subject: 'Ayuda con funciones', status: 'open', updatedAt: '2026-08-30T12:00:00.000Z',
      learnerId: 'learner-1', email: 'persona@example.com', displayName: 'Persona Ejemplo', messages: [],
    }]);
    const { container } = renderDashboard(false);
    await screen.findByText('Personas registradas');
    fireEvent.click(screen.getByRole('button', { name: 'Mensajes' }));
    expect(container.querySelector('.staff-inbox__conversation')?.classList.contains('is-open')).toBe(false);
    fireEvent.click(await screen.findByRole('button', { name: /Ayuda con funciones/ }));

    expect(await screen.findByText('Responder con orientación concreta')).toBeTruthy();
    expect(container.querySelector('.staff-inbox__conversation')?.classList.contains('is-open')).toBe(true);
  });

  it('no presenta como refuerzo un concepto que la persona ya domina', async () => {
    api.learner.mockResolvedValueOnce({
      user: { ...learner, roles: ['student'], actorId: 'actor-1' },
      progress: [], attempts: [], feedback: [],
      skills: [{ courseSlug: 'fundamentos', skillKey: 'funciones-dominadas', capability: 'aplicar', attempts: 4, successes: 4, score: 1, lastResult: 'success', lastPracticedAt: '2026-08-30T12:00:00.000Z' }],
    });
    renderDashboard(false);
    await screen.findByText('Personas registradas');
    fireEvent.click(screen.getByRole('button', { name: 'Personas' }));
    fireEvent.click(await screen.findByRole('button', { name: /Persona Ejemplo/ }));

    expect(await screen.findByText('No hay conceptos por debajo del umbral de refuerzo.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /funciones-dominadas/ })).toBeNull();
  });

  it('permite bloquear y restaurar un curso para una sola persona', async () => {
    api.courseAccess
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{
        userId: 'learner-1', courseSlug: 'fundamentos', title: 'Fundamentos', availability: 'locked',
        reason: 'Necesita una revisión acompañada.', updatedAt: '2026-08-30T12:00:00.000Z',
      }])
      .mockResolvedValueOnce([]);
    renderDashboard(true);
    await screen.findByText('Personas registradas');
    fireEvent.click(screen.getByRole('button', { name: 'Personas' }));
    fireEvent.click(await screen.findByRole('button', { name: /Persona Ejemplo/ }));

    expect(await screen.findByText('Acceso individual a cursos')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Curso a restringir'), { target: { value: 'fundamentos' } });
    fireEvent.change(screen.getByLabelText('Motivo para esta persona'), { target: { value: 'Necesita una revisión acompañada.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Bloquear solo para esta persona' }));

    await waitFor(() => expect(api.lockCourseForUser).toHaveBeenCalledWith(
      'learner-1', 'fundamentos', 'Necesita una revisión acompañada.',
    ));
    expect(await screen.findByText('Necesita una revisión acompañada.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Restaurar acceso a Fundamentos' }));
    await waitFor(() => expect(api.unlockCourseForUser).toHaveBeenCalledWith('learner-1', 'fundamentos'));
  });

  it('edita la ficha pública del curso sin exponer un editor JSON', async () => {
    renderDashboard(true);
    await screen.findByText('Personas registradas');
    fireEvent.click(screen.getByRole('button', { name: 'Cursos' }));

    fireEvent.change(await screen.findByLabelText('Título de fundamentos'), { target: { value: 'Fundamentos profesionales' } });
    fireEvent.change(screen.getByLabelText('Descripción de fundamentos'), { target: { value: 'Aprende programación con práctica guiada.' } });
    fireEvent.change(screen.getByLabelText('Frase corta de fundamentos'), { target: { value: 'Piensa, prueba y depura' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar contenido de fundamentos' }));

    await waitFor(() => expect(api.updateCourseContent).toHaveBeenCalledWith('fundamentos', {
      title: 'Fundamentos profesionales',
      description: 'Aprende programación con práctica guiada.',
      metadata: { tagline: 'Piensa, prueba y depura', level: 'Beginner', tags: ['JavaScript'] },
    }));
    expect(screen.queryByRole('textbox', { name: /JSON/i })).toBeNull();
  });
});
