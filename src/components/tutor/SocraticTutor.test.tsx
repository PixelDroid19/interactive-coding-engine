// @vitest-environment happy-dom

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LocalModelOption } from '../../engine/ai/localGenerationProtocol';
import type { LocalGenerationService } from '../../engine/ai/localGenerationService';
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

afterEach(() => { cleanup(); clearTutorWorkspace('test'); });

describe('SocraticTutor', () => {
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

    fireEvent.click(screen.getByRole('button', { name: /preparar modelo/i }));
    await waitFor(() => expect(service.prepareModel).toHaveBeenCalledWith(model.id, expect.any(Object)));
    expect(await screen.findByText(/Modelo listo/)).toBeTruthy();
  });

  it('genera por streaming, permite cancelar y mantiene la interfaz en español', async () => {
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
      if (generation === 1) return { text: JSON.stringify({ calls: [{ tool: 'write_file', args: { path: 'app.js', content: 'const valor = 2;' } }], replyStrategy: 'Explica el cambio.' }), model: model.id, engine: 'WebLLM', device: 'webgpu', elapsedMs: 1 };
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
});
