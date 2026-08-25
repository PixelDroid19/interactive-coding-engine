import { describe, expect, it } from 'vitest';
import { validateSpanishGeneration } from './localOutputQuality';

describe('validateSpanishGeneration', () => {
  it('acepta explicaciones breves y listas comprensibles en español', () => {
    expect(validateSpanishGeneration('Una función agrupa instrucciones para reutilizarlas. Puede recibir datos y devolver un resultado.')).toBeNull();
    expect(validateSpanishGeneration('- Problema: carga repetida\n- Decisión: usar caché\n- Paso: medir otra vez')).toBeNull();
  });

  it('rechaza salidas truncadas o con señales de corrupción numérica', () => {
    expect(validateSpanishGeneration('Una')).toMatch(/incompleta/i);
    expect(validateSpanishGeneration('Una funciónTable-fieldo Codřejáss Cyclcomed ect athletes Ripascoascoasco œaukoths Lymeoby')).toMatch(/inestable/i);
    expect(validateSpanishGeneration('texto !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! final')).toMatch(/inestable/i);
    expect(validateSpanishGeneration('respuesta � rota')).toMatch(/inestable/i);
  });
});
