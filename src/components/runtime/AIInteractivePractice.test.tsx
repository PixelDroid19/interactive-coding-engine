// @vitest-environment happy-dom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { InteractiveAILab } from '../../types/curriculum';
import type { LocalGenerationRequest, LocalGenerationResult } from '../../engine/ai/localGenerationProtocol';
import { AIInteractivePractice, type LocalGenerationClient } from './AIInteractivePractice';

const lab: InteractiveAILab = {
  title: 'Compara dos instrucciones',
  description: 'Cambia una variable y observa el resultado.',
  defaultMode: 'prompt',
  allowedModes: ['prompt', 'summarize', 'write'],
  systemPrompt: 'Responde en español.',
  promptA: 'Resume la entrada.',
  promptB: 'Devuelve JSON con tres puntos y no inventes datos.',
  input: 'La aplicación procesa el texto en el dispositivo.',
  observationPrompt: '¿Qué cambió y qué evidencia lo muestra?',
  expectedJsonKeys: ['problema', 'prioridad', 'equipo'],
};

class FakeGenerationClient implements LocalGenerationClient {
  inspectModel = vi.fn(async () => ({
    model: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
    engine: 'WebLLM' as const,
    device: 'webgpu' as const,
    cached: false,
    estimatedVramMB: 944.62,
    contextWindowSize: 4096,
  }));

  generate = vi.fn(async (request: LocalGenerationRequest, _options?: Parameters<LocalGenerationClient['generate']>[1]): Promise<LocalGenerationResult> => ({
    text: request.expectedFormat === 'json_object' ? '{"puntos":["Uno","Dos","Tres"]}' : 'Resumen breve en español.',
    model: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
    engine: 'WebLLM',
    device: 'webgpu',
    elapsedMs: 320,
  }));

  dispose = vi.fn();
}

async function inspect(client: FakeGenerationClient) {
  fireEvent.click(screen.getByRole('button', { name: 'Revisar modelo local' }));
  await screen.findByText(/945 MB/);
  expect(client.generate).not.toHaveBeenCalled();
}

describe('AIInteractivePractice', () => {
  afterEach(cleanup);

  it('no carga el modelo hasta el gesto del estudiante y muestra datos reales de WebLLM', async () => {
    const client = new FakeGenerationClient();
    render(<AIInteractivePractice lab={lab} createLocalClient={() => client} webGpuAvailable />);

    expect(client.inspectModel).not.toHaveBeenCalled();
    expect(client.generate).not.toHaveBeenCalled();
    await inspect(client);

    expect(screen.getByText(/WebLLM · WEBGPU/)).toBeTruthy();
    expect(screen.getByText(/Contexto: 4096 tokens/)).toBeTruthy();
    expect(screen.getByText(/No hay una respuesta simulada ni una ruta CPU escondida/i)).toBeTruthy();
    expect(screen.queryByLabelText(/Precisión WebGPU/i)).toBeNull();
  });

  it('ejecuta ambos prompts, activa JSON mode donde corresponde y muestra resultados', async () => {
    const client = new FakeGenerationClient();
    render(<AIInteractivePractice lab={lab} createLocalClient={() => client} webGpuAvailable />);
    await inspect(client);
    fireEvent.change(screen.getByRole('slider', { name: 'Temperatura B' }), { target: { value: '0.8' } });
    fireEvent.click(screen.getByRole('button', { name: /Descargar y comparar prompts/ }));

    await waitFor(() => expect(client.generate).toHaveBeenCalledTimes(2));
    expect(client.generate.mock.calls[0][0]).toMatchObject({ temperature: 0, expectedFormat: 'text' });
    expect(client.generate.mock.calls[1][0]).toMatchObject({ temperature: 0.8, expectedFormat: 'json_object' });
    expect(client.generate.mock.calls[1][0].expectedJsonKeys).toEqual(['problema', 'prioridad', 'equipo']);
    expect(await screen.findByText('Resumen breve en español.')).toBeTruthy();
    expect(screen.getByText('{"puntos":["Uno","Dos","Tres"]}')).toBeTruthy();
    expect(screen.getAllByText(/WebGPU · 320 ms/)).toHaveLength(2);
  });

  it('ofrece prácticas de resumen y escritura sin obligar a escribir código', async () => {
    const client = new FakeGenerationClient();
    render(<AIInteractivePractice lab={lab} createLocalClient={() => client} webGpuAvailable />);
    fireEvent.click(screen.getByRole('tab', { name: 'Resume' }));
    await inspect(client);
    fireEvent.click(screen.getByRole('button', { name: /Descargar y resumir/ }));

    await waitFor(() => expect(client.generate).toHaveBeenCalledTimes(1));
    expect(client.generate.mock.calls[0][0].messages.at(-1)?.content).toMatch(/puntos clave/i);
    expect(screen.getByLabelText('Conclusión del experimento')).toBeTruthy();
  });

  it('bloquea la ejecución cuando WebGPU no existe sin ofrecer un fallback', async () => {
    const client = new FakeGenerationClient();
    render(<AIInteractivePractice lab={lab} createLocalClient={() => client} webGpuAvailable={false} />);

    expect(screen.getByRole('alert').textContent).toMatch(/WebGPU no está disponible/i);
    await inspect(client);
    expect((screen.getByRole('button', { name: /Descargar y comparar prompts/ }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByRole('button', { name: /WASM|CPU|alternativa/i })).toBeNull();
  });

  it('cancela una generación local sin presentarla como una respuesta válida', async () => {
    const client = new FakeGenerationClient();
    client.generate = vi.fn((_request, options) => new Promise<LocalGenerationResult>((_resolve, reject) => {
      options?.signal?.addEventListener('abort', () => reject(new DOMException('cancelada', 'AbortError')), { once: true });
    }));
    render(<AIInteractivePractice lab={lab} createLocalClient={() => client} webGpuAvailable />);
    await inspect(client);
    fireEvent.click(screen.getByRole('button', { name: /Descargar y comparar prompts/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));

    expect(await screen.findByText(/Generación cancelada/i)).toBeTruthy();
    expect(screen.queryByLabelText('Conclusión del experimento')).toBeNull();
  });

  it('muestra una salida revisable con su advertencia sin fingir que es correcta', async () => {
    const client = new FakeGenerationClient();
    client.generate = vi.fn(async (): Promise<LocalGenerationResult> => ({
      text: 'This answer ignored the requested Spanish format.',
      warning: 'El modelo no respetó el idioma o el formato solicitado.',
      model: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
      engine: 'WebLLM',
      device: 'webgpu',
      elapsedMs: 370,
    }));
    render(<AIInteractivePractice lab={lab} createLocalClient={() => client} webGpuAvailable />);
    await inspect(client);
    fireEvent.click(screen.getByRole('button', { name: /Descargar y comparar prompts/ }));

    expect(await screen.findAllByText('This answer ignored the requested Spanish format.')).toHaveLength(2);
    expect(screen.getAllByText(/El modelo no respetó el idioma o el formato solicitado/)).toHaveLength(2);
    expect(screen.getByLabelText('Conclusión del experimento')).toBeTruthy();
  });
});
