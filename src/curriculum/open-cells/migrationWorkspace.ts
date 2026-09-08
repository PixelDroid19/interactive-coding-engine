import { writeCellsFile, type VersionedCellsWorkspace } from '../../engine/cells/cellsVirtualFileSystem';
import { connectMigrationPanel } from './migrationPanel';

const adapterSource = `import { normalizeCatalogItem } from './catalog-contract.js';

export function adaptCatalog(records, { allowLegacy = true } = {}) {
  if (!Array.isArray(records)) throw new TypeError('Catalog must be an array');
  const result = { items: [], legacyCount: 0, rejectedCount: 0, warnings: [] };
  for (const record of records) {
    const legacy = record && typeof record === 'object' && !Object.hasOwn(record, 'title') && Object.hasOwn(record, 'name');
    if (legacy) result.legacyCount++;
    if (legacy && !allowLegacy) { result.rejectedCount++; continue; }
    const item = normalizeCatalogItem(record, (warning) => result.warnings.push(warning));
    if (item) result.items.push(item);
    else result.rejectedCount++;
  }
  return result;
}
`;

export function connectMigrationWorkspace(base: VersionedCellsWorkspace): VersionedCellsWorkspace {
  let workspace = writeCellsFile(base, 'app/migrations/adapt-catalog.js', adapterSource);
  workspace = writeCellsFile(workspace, 'test/unit/migration.test.js', `import { describe, expect, it } from 'vitest';
import { normalizeCatalogItem } from '../../app/migrations/catalog-contract.js';
import { adaptCatalog } from '../../app/migrations/adapt-catalog.js';
import { legacyCatalog } from '../../app/consumers/legacy-catalog.js';
import { currentCatalog } from '../../app/consumers/current-catalog.js';

describe('consumer contract migration', () => {
  it('normalizes both consumers to the same internal model', () => {
    const legacy = adaptCatalog(legacyCatalog);
    const current = adaptCatalog(currentCatalog);
    expect(legacy.items).toEqual(current.items);
    expect(legacy.warnings).toHaveLength(2);
    expect(current.warnings).toEqual([]);
  });
  it('retires legacy input without breaking the new consumer', () => {
    expect(adaptCatalog(legacyCatalog, { allowLegacy: false }).rejectedCount).toBe(2);
    expect(adaptCatalog(currentCatalog, { allowLegacy: false }).items).toHaveLength(2);
  });
  it('rejects malformed new input instead of falling back silently', () => {
    expect(normalizeCatalogItem(null)).toBeUndefined();
    expect(normalizeCatalogItem({ id: 'first', title: {}, name: 'Old title' })).toBeUndefined();
    expect(normalizeCatalogItem({ id: 'first', title: 'Current', name: 'Old' })).toEqual({ id: 'first', name: 'Current' });
  });
});
`);
  workspace = writeCellsFile(workspace, 'docs/migration.md', `# Retirar compatibilidad sin duplicar el producto

El contrato público antiguo usa name y el nuevo usa title. catalog-contract.js valida la entrada y la normaliza al modelo interno de las tarjetas, que sigue usando name. No hay dos componentes visuales ni dos flujos de navegación.

## Consumidores y frontera

app/consumers/legacy-catalog.js y current-catalog.js alimentan la misma página a través de adapt-catalog.js. El adaptador cuenta registros con forma antigua, registros rechazados y avisos de compatibilidad de esa carga. Son conteos del lote mostrado, no una estimación de todos los consumidores en producción ni una métrica persistente.

Si title está presente pero es inválido, se rechaza el registro: no se oculta el error recurriendo a name. Si ambos campos son válidos prevalece title. Usar únicamente name emite un aviso verificable mientras la compatibilidad siga habilitada.

## Plan de práctica

app/migrations/plan.js declara una retirada de ejemplo para la versión 2.0.0, con fecha 2026-12-01. No es un compromiso de publicación del curso y la fecha no modifica el comportamiento automáticamente. La casilla simula el cambio de versión: bloquea entradas antiguas y mantiene las nuevas.

Antes de una retirada real, el equipo propietario del catálogo debe inventariar consumidores, comunicar la fecha, migrarlos, medir los usos antiguos restantes y repetir las pruebas con la compatibilidad deshabilitada. Que este lote marque cero no demuestra que todos los consumidores hayan migrado.

## Comprueba el recorrido

Carga el consumidor antiguo: aparecen dos tarjetas y dos usos antiguos. Activa la retirada: no quedan registros aceptados. Cambia al consumidor nuevo: regresan las mismas tarjetas, con cero rechazos y sin avisos antiguos. Abre una tarjeta y vuelve; la navegación usa el identificador normalizado.

En el exportado, ejecuta cells app:test y cells app:build -c prod.js. Las pruebas usan los mismos módulos de los consumidores y comprueban compatibilidad, retirada y entradas inválidas.
`);
  return connectMigrationPanel(workspace);
}
