import { describe, expect, it } from 'vitest';
import { assessSpanishGeneration, validateSpanishGeneration } from './localOutputQuality';

describe('validateSpanishGeneration', () => {
  it('acepta explicaciones breves y listas comprensibles en español', () => {
    expect(validateSpanishGeneration('Una función agrupa instrucciones para reutilizarlas. Puede recibir datos y devolver un resultado.')).toBeNull();
    expect(validateSpanishGeneration('- Problema: carga repetida\n- Decisión: usar caché\n- Paso: medir otra vez')).toBeNull();
  });

  it('acepta JSON válido aunque use pocos conectores del lenguaje natural', () => {
    expect(validateSpanishGeneration('{"problema":"pantalla de pagos en blanco","prioridad":"alta","equipo":"web"}')).toBeNull();
    expect(validateSpanishGeneration('```json\n{"problema":"sesión cerrada","prioridad":null,"equipo":"cuentas"}\n```')).toBeNull();
  });

  it('rechaza salidas truncadas o con señales de corrupción numérica', () => {
    expect(validateSpanishGeneration('Una')).toMatch(/incompleta/i);
    expect(validateSpanishGeneration('Una funciónTable-fieldo Codřejáss Cyclcomed ect athletes Ripascoascoasco œaukoths Lymeoby')).toMatch(/inestable/i);
    expect(validateSpanishGeneration('texto !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! final')).toMatch(/inestable/i);
    expect(validateSpanishGeneration('respuesta � rota')).toMatch(/inestable/i);
    expect(validateSpanishGeneration(Array.from({ length: 48 }, () => 'i').join('\u200b'))).toMatch(/inestable/i);
    expect(validateSpanishGeneration('i i i i i i i i i i i i i i i i i i i i i i i i')).toMatch(/inestable/i);
  });

  it('distingue una respuesta en otro idioma de una salida numéricamente corrupta', () => {
    const error = validateSpanishGeneration('This response ignored the requested language and returned a long explanation without the required format.');
    expect(error).toMatch(/idioma|formato/i);
    expect(error).not.toMatch(/numéricamente inestable/i);
  });

  it('clasifica como advertencia los incumplimientos revisables y bloquea solo la corrupción', () => {
    expect(assessSpanishGeneration('This response ignored the requested language and returned a long explanation without the required format.')).toMatchObject({
      severity: 'warning',
    });
    expect(assessSpanishGeneration('Una')).toMatchObject({ severity: 'warning' });
    expect(assessSpanishGeneration('respuesta � rota')).toMatchObject({ severity: 'unsafe' });
  });
});
