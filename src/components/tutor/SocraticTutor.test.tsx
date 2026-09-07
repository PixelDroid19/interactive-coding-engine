// @vitest-environment happy-dom

import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LocalModelOption } from '../../engine/ai/localGenerationProtocol';
import type { LocalGenerationService } from '../../engine/ai/localGenerationService';
import { createEmptyLearningProfile } from '../../learning/mastery';
import { LEARNING_PROFILE_STORAGE_KEY } from '../../learning/localLearningRepository';
import { clearTutorWorkspace, publishTutorWorkspace } from '../../learning/tutor/tutorContext';
import { SocraticTutor } from './SocraticTutor';

const model: LocalModelOption = {
  id: 'Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC',
  model: 'Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC',
  label: 'Qwen 2.5 Coder · 1.5B',
  specialty: 'Código y explicaciones',
  profile: 'recommended',
  engine: 'WebLLM',
  device: 'webgpu',
  cached: false,
  estimatedVramMB: 1630,
  contextWindowSize: 4096,
};

function serviceHarness() {
  let generation = 0;
  const service = {
    listModels: vi.fn(async () => [model]),
    prepareModel: vi.fn(async (_model, options) => {
      options?.onProgress?.({ status: 'download', label: 'Descargando 50%', progress: 0.5 });
      return { ...model, cached: true };
    }),
    generate: vi.fn(async (_request, options) => {
      generation += 1;
      if (generation % 2 === 1) {
        return { text: JSON.stringify({ calls: [{ tool: 'read_lesson', args: {} }], replyStrategy: 'Explica con una pregunta breve.' }), model: model.id, engine: 'WebLLM', device: 'webgpu', elapsedMs: 5 };
      }
      options?.onChunk?.('¿Qué valor esperabas ');
      options?.onChunk?.('que devolviera la función?');
      return { text: '¿Qué valor esperabas que devolviera la función?', model: model.id, engine: 'WebLLM', device: 'webgpu', elapsedMs: 10 };
    }),
  } as unknown as LocalGenerationService;
  return service;
}

const activity = {
  courseId: 'course-javascript',
  courseTitle: 'JavaScript',
  itemId: 'javascript-05',
  itemTitle: 'Funciones',
  itemType: 'scrim' as const,
  mentalModel: 'Una función transforma una entrada en una salida.',
};

afterEach(() => { cleanup(); clearTutorWorkspace('test'); localStorage.clear(); });

describe('SocraticTutor', () => {
  it.each(['success', 'error'] as const)('permite abrir de nuevo la ayuda e ignora el %s del catálogo anterior', async (outcome) => {
    const service = serviceHarness();
    let finishOld!: (models: LocalModelOption[]) => void;
    let failOld!: (reason: Error) => void;
    vi.mocked(service.listModels)
      .mockImplementationOnce(() => new Promise((resolve, reject) => { finishOld = resolve; failOld = reject; }))
      .mockResolvedValueOnce([model]);
    render(<SocraticTutor enabled activity={activity} service={service} />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir ayuda de IA' }));
    expect((screen.getByRole('button', { name: 'Preparar modelo' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar ayuda' }));
    fireEvent.click(screen.getByRole('button', { name: 'Abrir ayuda de IA' }));
    await screen.findByRole('option', { name: /Qwen 2\.5 Coder/ });
    await act(async () => {
      if (outcome === 'success') finishOld([{ ...model, id: 'obsolete', label: 'Catálogo obsoleto' }]);
      else failOld(new Error('Fallo del catálogo obsoleto'));
    });
    expect(screen.queryByRole('option', { name: /Catálogo obsoleto/ })).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    expect((screen.getByRole('button', { name: 'Preparar modelo' }) as HTMLButtonElement).disabled).toBe(false);
    expect(service.prepareModel).not.toHaveBeenCalled();
    expect(service.generate).not.toHaveBeenCalled();
  });

  it('no inicia otra consulta ni una descarga al cambiar de curso con el catálogo pendiente', async () => {
    const service = serviceHarness();
    let finish!: (models: LocalModelOption[]) => void;
    vi.mocked(service.listModels).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const view = render(<SocraticTutor enabled activity={activity} service={service} />);
    expect(service.listModels).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Abrir ayuda de IA' }));
    view.rerender(<SocraticTutor enabled activity={{ ...activity, courseId: 'lit', courseTitle: 'Lit', itemTitle: 'Componentes' }} service={service} />);
    await act(async () => { finish([model]); });
    expect(screen.getByRole('heading', { name: 'Componentes' })).toBeTruthy();
    expect(screen.getByText('Lit')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Funciones' })).toBeNull();
    expect((screen.getByRole('button', { name: 'Preparar modelo' }) as HTMLButtonElement).disabled).toBe(false);
    expect(service.listModels).toHaveBeenCalledTimes(1);
    expect(service.prepareModel).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Preparar modelo' }));
    await waitFor(() => expect(service.prepareModel).toHaveBeenCalledWith(model.id, expect.any(Object)));
  });

  it('conserva un modelo disponible al cambiar de curso después de consultar el catálogo', async () => {
    const profile = createEmptyLearningProfile();
    profile.tutor.selectedModel = 'modelo-que-ya-no-esta-en-el-catalogo';
    localStorage.setItem(LEARNING_PROFILE_STORAGE_KEY, JSON.stringify(profile));
    const service = serviceHarness();
    const view = render(<SocraticTutor enabled activity={activity} service={service} />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir ayuda de IA' }));
    await screen.findByRole('option', { name: /Qwen 2\.5 Coder/ });
    await act(async () => {
      view.rerender(<SocraticTutor enabled activity={{ ...activity, courseId: 'lit', courseTitle: 'Lit' }} service={service} />);
    });
    expect((screen.getByRole('combobox', { name: 'Modelo local' }) as HTMLSelectElement).value).toBe(model.id);
    expect(screen.getByText(/Memoria gráfica estimada/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Preparar modelo' }));
    await waitFor(() => expect(service.prepareModel).toHaveBeenCalledWith(model.id, expect.any(Object)));
  });

  it('retira el error anterior cuando la siguiente consulta del catálogo funciona', async () => {
    const service = serviceHarness();
    vi.mocked(service.listModels).mockRejectedValueOnce(new Error('Catálogo temporalmente no disponible')).mockResolvedValueOnce([model]);
    render(<SocraticTutor enabled activity={activity} service={service} />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir ayuda de IA' }));
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(service.listModels).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar ayuda' }));
    fireEvent.click(screen.getByRole('button', { name: 'Abrir ayuda de IA' }));
    await screen.findByRole('option', { name: /Qwen 2\.5 Coder/ });
    expect(screen.queryByRole('alert')).toBeNull();
    expect((screen.getByRole('button', { name: 'Preparar modelo' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('cambiar de modelo elimina el estado listo y el progreso del modelo anterior', async () => {
    const service = serviceHarness();
    vi.mocked(service.listModels).mockResolvedValue([model, { ...model, id: 'second-model', label: 'Otro modelo' }]);
    render(<SocraticTutor enabled activity={activity} service={service} />);
    fireEvent.click(screen.getByRole('button', { name: /abrir ayuda/i }));
    await screen.findByRole('option', { name: /Otro modelo/ });
    fireEvent.click(screen.getByRole('button', { name: 'Preparar modelo' }));
    await screen.findByText(/Modelo listo/);
    fireEvent.change(screen.getByRole('combobox', { name: 'Modelo local' }), { target: { value: 'second-model' } });
    expect(screen.queryByText(/Modelo listo/)).toBeNull();
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.getByRole('button', { name: 'Preparar modelo' })).toBeTruthy();
  });

  it.each(['cancel', 'close', 'course'] as const)('ignora una preparación obsoleta después de %s', async (action) => {
    const service = serviceHarness();
    let finish!: (value: LocalModelOption) => void;
    let report!: NonNullable<Parameters<LocalGenerationService['prepareModel']>[1]>['onProgress'];
    vi.mocked(service.prepareModel).mockImplementation((_id, options) => {
      report = options?.onProgress;
      return new Promise(resolve => { finish = resolve; });
    });
    const view = render(<SocraticTutor enabled activity={activity} service={service} />);
    fireEvent.click(screen.getByRole('button', { name: /abrir ayuda/i }));
    await screen.findByRole('option', { name: /Qwen 2\.5 Coder/ });
    fireEvent.click(screen.getByRole('button', { name: 'Preparar modelo' }));
    if (action === 'cancel') fireEvent.click(screen.getByRole('button', { name: 'Cancelar preparación' }));
    if (action === 'close') {
      fireEvent.click(screen.getByRole('button', { name: 'Cerrar ayuda' }));
      fireEvent.click(screen.getByRole('button', { name: /abrir ayuda/i }));
    }
    if (action === 'course') view.rerender(<SocraticTutor enabled activity={{ ...activity, courseId: 'course-lit' }} service={service} />);
    await act(async () => {
      report?.({ status: 'download', label: 'Progreso de una operación cancelada', progress: 0.9 });
      finish({ ...model, cached: true });
    });
    expect(screen.queryByText('Progreso de una operación cancelada')).toBeNull();
    expect(screen.queryByText(/Modelo listo/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Preparar modelo' })).toBeTruthy();
  });

  it('cambiar de curso cancela la edición pendiente y no arrastra conversación aunque el itemId coincida', async () => {
    const replaceFile = vi.fn();
    publishTutorWorkspace({ snapshot: { activeFilePath: 'app.js', files: { 'app.js': 'const valor = 1;' } }, actions: { replaceFile, undoLastChange: vi.fn() } }, 'test');
    const service = serviceHarness();
    let finishEdit: ((value: Awaited<ReturnType<LocalGenerationService['generate']>>) => void) | undefined;
    vi.mocked(service.generate)
      .mockResolvedValueOnce({ text: JSON.stringify({ calls: [{ tool: 'write_file', args: { path: 'app.js' } }], replyStrategy: 'Edita.' }), model: model.id, engine: 'WebLLM', device: 'webgpu', elapsedMs: 1 })
      .mockImplementationOnce(() => new Promise(resolve => { finishEdit = resolve; }));
    const { rerender } = render(<SocraticTutor enabled activity={activity} service={service} initialModelReady />);
    fireEvent.click(screen.getByRole('button', { name: /abrir ayuda/i }));
    fireEvent.change(screen.getByRole('textbox', { name: /pregunta para la ayuda/i }), { target: { value: 'Cambia el valor a dos' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar pregunta/i }));
    await waitFor(() => expect(finishEdit).toBeTypeOf('function'));
    rerender(<SocraticTutor enabled activity={{ ...activity, courseId: 'course-lit', courseTitle: 'Lit' }} service={service} initialModelReady />);
    await act(async () => { finishEdit!({ text: 'const valor = 2;', model: model.id, engine: 'WebLLM', device: 'webgpu', elapsedMs: 1 }); });
    expect(replaceFile).not.toHaveBeenCalled();
    expect(screen.queryByText('Cambia el valor a dos')).toBeNull();
    expect(screen.queryByText('Modificó app.js')).toBeNull();
    expect(screen.getByRole('button', { name: /enviar pregunta/i })).toBeTruthy();
  });

  it('cerrar la ayuda cancela una generación pendiente sin aplicar sus cambios', async () => {
    const replaceFile = vi.fn();
    publishTutorWorkspace({ snapshot: { activeFilePath: 'app.js', files: { 'app.js': 'const valor = 1;' } }, actions: { replaceFile, undoLastChange: vi.fn() } }, 'test');
    const service = serviceHarness();
    let finishEdit: ((value: Awaited<ReturnType<LocalGenerationService['generate']>>) => void) | undefined;
    vi.mocked(service.generate)
      .mockResolvedValueOnce({ text: JSON.stringify({ calls: [{ tool: 'write_file', args: { path: 'app.js' } }], replyStrategy: 'Edita.' }), model: model.id, engine: 'WebLLM', device: 'webgpu', elapsedMs: 1 })
      .mockImplementationOnce(() => new Promise(resolve => { finishEdit = resolve; }));
    render(<SocraticTutor enabled activity={activity} service={service} initialModelReady />);
    fireEvent.click(screen.getByRole('button', { name: /abrir ayuda/i }));
    fireEvent.change(screen.getByRole('textbox', { name: /pregunta para la ayuda/i }), { target: { value: 'Cambia el valor a dos' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar pregunta/i }));
    await waitFor(() => expect(finishEdit).toBeTypeOf('function'));
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar ayuda' }));
    await act(async () => { finishEdit!({ text: 'const valor = 2;', model: model.id, engine: 'WebLLM', device: 'webgpu', elapsedMs: 1 }); });
    expect(replaceFile).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /abrir ayuda/i })).toBeTruthy();
  });
  it('no monta ninguna superficie cuando el curso lo desactiva', () => {
    render(<SocraticTutor enabled={false} activity={activity} service={serviceHarness()} />);
    expect(screen.queryByRole('button', { name: /abrir ayuda/i })).toBeNull();
  });

  it('inspecciona modelos sin descargarlos y exige un gesto para preparar WebLLM', async () => {
    const service = serviceHarness();
    render(<SocraticTutor enabled activity={activity} service={service} />);

    fireEvent.click(screen.getByRole('button', { name: /abrir ayuda/i }));
    expect(await screen.findByRole('option', { name: /Qwen 2\.5 Coder · 1\.5B/ })).toBeTruthy();
    expect(service.listModels).toHaveBeenCalledTimes(1);
    expect(service.prepareModel).not.toHaveBeenCalled();
    expect(screen.getByText(/memoria gráfica estimada/i)).toBeTruthy();
    expect(screen.queryByText('Elige cuánto quieres descargar')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /preparar modelo/i }));
    await waitFor(() => expect(service.prepareModel).toHaveBeenCalledWith(model.id, expect.any(Object)));
    expect(await screen.findByText(/Modelo listo/)).toBeTruthy();
  });

  it('genera una respuesta, permite cancelar y mantiene la interfaz en español', async () => {
    const service = serviceHarness();
    render(<SocraticTutor enabled activity={activity} service={service} initialModelReady />);

    fireEvent.click(screen.getByRole('button', { name: /abrir ayuda/i }));
    expect(screen.getByRole('dialog', { name: 'Ayuda de la lección' })).toBeTruthy();
    expect(screen.queryByText('Tutor socrático')).toBeNull();
    expect((screen.getByRole('combobox', { name: 'Tipo de ayuda' }) as HTMLSelectElement).value).toBe('auto');
    expect(screen.getByRole('combobox', { name: 'Modelo local' })).toBeTruthy();
    fireEvent.change(screen.getByRole('textbox', { name: /pregunta para la ayuda de IA/i }), { target: { value: 'No entiendo el return.' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar pregunta/i }));

    expect(await screen.findByText(/¿Qué valor esperabas/)).toBeTruthy();
    expect(screen.getByText('Leyó la lección')).toBeTruthy();
    expect(service.generate).toHaveBeenCalledTimes(2);
  });

  it('muestra los cambios del agente y permite deshacerlos', async () => {
    const replaceFile = vi.fn();
    const undoLastChange = vi.fn();
    publishTutorWorkspace({
      snapshot: { activeFilePath: 'app.js', files: { 'app.js': 'const valor = 1;' } },
      actions: { replaceFile, undoLastChange },
    }, 'test');
    let generation = 0;
    const service = serviceHarness();
    vi.mocked(service.generate).mockImplementation(async (_request, options) => {
      generation += 1;
      if (generation === 1) return { text: JSON.stringify({ calls: [{ tool: 'write_file', args: { path: 'app.js' } }], replyStrategy: 'Explica el cambio.' }), model: model.id, engine: 'WebLLM', device: 'webgpu', elapsedMs: 1 };
      if (generation === 2) return { text: 'const valor = 2;', model: model.id, engine: 'WebLLM', device: 'webgpu', elapsedMs: 1 };
      options?.onChunk?.('Actualicé el valor para trabajar contigo.');
      return { text: 'Actualicé el valor para trabajar contigo.', model: model.id, engine: 'WebLLM', device: 'webgpu', elapsedMs: 1 };
    });

    render(<SocraticTutor enabled activity={activity} service={service} initialModelReady />);
    fireEvent.click(screen.getByRole('button', { name: /abrir ayuda/i }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Tipo de ayuda' }), { target: { value: 'collaborate' } });
    fireEvent.change(screen.getByRole('textbox', { name: /pregunta para la ayuda de IA/i }), { target: { value: 'Cambia el valor y explícame.' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar pregunta/i }));

    expect(await screen.findByText('Modificó app.js')).toBeTruthy();
    expect(replaceFile).toHaveBeenCalledWith('app.js', 'const valor = 2;');
    fireEvent.click(screen.getByRole('button', { name: 'Deshacer cambios del agente' }));
    expect(undoLastChange).toHaveBeenCalledTimes(1);
  });

  it('integra una acción compacta dentro del campo de texto', () => {
    render(<SocraticTutor enabled activity={activity} service={serviceHarness()} initialModelReady />);
    fireEvent.click(screen.getByRole('button', { name: /abrir ayuda/i }));

    const input = screen.getByRole('textbox', { name: /pregunta para la ayuda de IA/i });
    const send = screen.getByRole('button', { name: /enviar pregunta/i });
    expect(input.parentElement?.contains(send)).toBe(true);
    expect(send.textContent?.trim()).toBe('');
    expect(send.getAttribute('title')).toBe('Enviar pregunta');
  });

  it('presenta los bloques de código sin mostrar las cercas Markdown', async () => {
    const service = serviceHarness();
    vi.mocked(service.generate)
      .mockResolvedValueOnce({ text: JSON.stringify({ calls: [{ tool: 'read_lesson', args: {} }], replyStrategy: 'Explica.' }), model: model.id, engine: 'WebLLM', device: 'webgpu', elapsedMs: 1 })
      .mockResolvedValueOnce({ text: 'Aquí tienes:\n```javascript\nfunction fibonacci(n) {\n  return n;\n}\n```', model: model.id, engine: 'WebLLM', device: 'webgpu', elapsedMs: 1 });

    const { container } = render(<SocraticTutor enabled activity={activity} service={service} initialModelReady />);
    fireEvent.click(screen.getByRole('button', { name: /abrir ayuda/i }));
    fireEvent.change(screen.getByRole('textbox', { name: /pregunta para la ayuda de IA/i }), { target: { value: 'Explícame fibonacci.' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar pregunta/i }));

    await waitFor(() => expect(container.querySelector('.socratic-tutor__message pre code')?.textContent).toContain('function fibonacci'));
    expect(container.textContent).not.toContain('```javascript');
    expect(container.querySelector('.socratic-tutor__message pre code')?.textContent).toContain('function fibonacci');
  });

  it('elimina del historial las respuestas locales degeneradas', async () => {
    const profile = createEmptyLearningProfile();
    profile.tutor.conversations['course-javascript:javascript-05'] = [
      { id: 'user-old', role: 'user', content: 'Crea fibonacci.', createdAt: 1 },
      { id: 'assistant-bad', role: 'assistant', content: 'iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii', createdAt: 2 },
      { id: 'assistant-bad-hidden', role: 'assistant', content: Array.from({ length: 40 }, () => 'i').join('\u200b'), createdAt: 2.5 },
      { id: 'assistant-good', role: 'assistant', content: 'Actualicé app.js correctamente.', createdAt: 3 },
    ];
    localStorage.setItem(LEARNING_PROFILE_STORAGE_KEY, JSON.stringify(profile));

    render(<SocraticTutor enabled activity={activity} service={serviceHarness()} initialModelReady />);
    fireEvent.click(screen.getByRole('button', { name: /abrir ayuda/i }));

    expect(await screen.findByText('Actualicé app.js correctamente.')).toBeTruthy();
    expect(screen.queryByText(/iiiiiiiiiiiiiiii/)).toBeNull();
    expect(screen.queryByText(/i\u200bi\u200bi/)).toBeNull();
  });

  it('mantiene Pensando mientras valida la respuesta y no muestra fragmentos degenerados', async () => {
    let finishResponse: ((value: { text: string; model: string; engine: 'WebLLM'; device: 'webgpu'; elapsedMs: number }) => void) | undefined;
    const service = serviceHarness();
    vi.mocked(service.generate)
      .mockResolvedValueOnce({ text: JSON.stringify({ calls: [{ tool: 'read_lesson', args: {} }], replyStrategy: 'Explica.' }), model: model.id, engine: 'WebLLM', device: 'webgpu', elapsedMs: 1 })
      .mockImplementationOnce(async (_request, options) => {
        options?.onChunk?.('iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii');
        return new Promise((resolve) => { finishResponse = resolve; });
      });

    render(<SocraticTutor enabled activity={activity} service={service} initialModelReady />);
    fireEvent.click(screen.getByRole('button', { name: /abrir ayuda/i }));
    fireEvent.change(screen.getByRole('textbox', { name: /pregunta para la ayuda de IA/i }), { target: { value: 'Explícame fibonacci.' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar pregunta/i }));

    expect(await screen.findByText('Pensando…')).toBeTruthy();
    expect(screen.queryByText(/iiiiiiiiiiiiiiii/)).toBeNull();
    finishResponse?.({ text: 'Revisé la actividad.', model: model.id, engine: 'WebLLM', device: 'webgpu', elapsedMs: 2 });
    expect(await screen.findByText('Revisé la actividad.')).toBeTruthy();
  });
});
