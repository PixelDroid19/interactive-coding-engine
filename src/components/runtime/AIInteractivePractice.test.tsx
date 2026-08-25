// @vitest-environment happy-dom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { InteractiveAILab } from '../../types/curriculum';
import type { LocalGenerationRequest } from '../../engine/ai/localGenerationProtocol';
import { AIInteractivePractice, type LocalGenerationClient } from './AIInteractivePractice';

const lab: InteractiveAILab = {
  title: 'Compara dos instrucciones',
  description: 'Cambia una variable y observa el resultado.',
  defaultMode: 'prompt',
  allowedModes: ['prompt', 'summarize', 'write'],
  systemPrompt: 'Responde en español.',
  promptA: 'Resume la entrada.',
  promptB: 'Resume la entrada en tres puntos y no inventes datos.',
  input: 'La aplicación procesa el texto en el dispositivo.',
  observationPrompt: '¿Qué cambió y qué evidencia lo muestra?',
};

class FakeGenerationClient implements LocalGenerationClient {
  inspectModel = vi.fn(async () => ({
    model: 'onnx-community/LFM2.5-350M-ONNX',
    cached: false,
    downloadBytes: 238_000_000,
    dtypes: ['q4'],
  }));

  generate = vi.fn(async (request: LocalGenerationRequest) => ({
    text: request.messages.at(-1)?.content.includes('tres puntos') ? 'Uno\nDos\nTres' : 'Resumen breve',
    model: 'onnx-community/LFM2.5-350M-ONNX',
    device: 'webgpu' as const,
    elapsedMs: 320,
  }));

  dispose = vi.fn();
}

describe('AIInteractivePractice', () => {
  afterEach(cleanup);

  it('no inspecciona ni descarga el modelo hasta que el estudiante lo solicita', async () => {
    const client = new FakeGenerationClient();
    render(<AIInteractivePractice lab={lab} createLocalClient={() => client} webGpuAvailable />);

    expect(client.inspectModel).not.toHaveBeenCalled();
    expect(client.generate).not.toHaveBeenCalled();
    expect(screen.getByText(/todo ocurre en este dispositivo/i)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Revisar modelo local' }));

    expect(await screen.findByText(/238 MB/)).toBeTruthy();
    expect(screen.getByText(/todavía no está en caché/i)).toBeTruthy();
    expect(client.generate).not.toHaveBeenCalled();
  });

  it('ejecuta dos prompts con la misma entrada y muestra motor, tiempo y respuestas', async () => {
    const client = new FakeGenerationClient();
    render(<AIInteractivePractice lab={lab} createLocalClient={() => client} webGpuAvailable />);
    fireEvent.click(screen.getByRole('button', { name: 'Revisar modelo local' }));
    await screen.findByText(/238 MB/);

    fireEvent.change(screen.getByRole('slider', { name: 'Temperatura B' }), { target: { value: '0.8' } });
    fireEvent.click(screen.getByRole('button', { name: /Descargar y comparar prompts/ }));

    await waitFor(() => expect(client.generate).toHaveBeenCalledTimes(2));
    expect(client.generate.mock.calls[0][0]).toMatchObject({ temperature: 0 });
    expect(client.generate.mock.calls[1][0]).toMatchObject({ temperature: 0.8 });
    expect(await screen.findByText('Resumen breve')).toBeTruthy();
    expect(screen.getByText(/Uno\s*Dos\s*Tres/)).toBeTruthy();
    expect(screen.getAllByText(/WebGPU · 320 ms/)).toHaveLength(2);
  });

  it('construye una práctica de resumen sin obligar al estudiante a escribir código', async () => {
    const client = new FakeGenerationClient();
    render(<AIInteractivePractice lab={lab} createLocalClient={() => client} webGpuAvailable />);
    fireEvent.click(screen.getByRole('tab', { name: 'Resume' }));
    fireEvent.click(screen.getByRole('button', { name: 'Revisar modelo local' }));
    await screen.findByText(/238 MB/);

    fireEvent.change(screen.getByLabelText('Tipo de resumen'), { target: { value: 'key-points' } });
    fireEvent.click(screen.getByRole('button', { name: /Descargar y resumir/ }));

    await waitFor(() => expect(client.generate).toHaveBeenCalledTimes(1));
    expect(client.generate.mock.calls[0][0].messages.at(-1)?.content).toMatch(/puntos clave/i);
  });
});
