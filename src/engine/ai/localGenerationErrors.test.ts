import { describe, expect, it } from 'vitest';
import { explainLocalGenerationError } from './localGenerationErrors';

describe('explainLocalGenerationError', () => {
  it('traduce la ausencia de adaptador WebGPU a una acción comprensible', () => {
    const message = explainLocalGenerationError(new Error('no available backend found. [webgpu] Failed to get GPU adapter'));
    expect(message).toMatch(/adaptador WebGPU/i);
    expect(message).toMatch(/aceleración gráfica|controlador/i);
    expect(message).not.toMatch(/no available backend/i);
  });

  it('distingue memoria insuficiente y errores de red', () => {
    expect(explainLocalGenerationError(new Error('out of memory while allocating tensor'))).toMatch(/memoria/i);
    expect(explainLocalGenerationError(new Error('Failed to fetch model file'))).toMatch(/conexión|descarga/i);
  });

  it('conserva un mensaje desconocido sin exponer una traza', () => {
    expect(explainLocalGenerationError(new Error('Fallo específico.\nstack interno'))).toBe('Fallo específico.');
  });
});
