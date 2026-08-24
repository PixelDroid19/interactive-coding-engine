export interface LegacyLitMigrationEntry {
  legacyId: string;
  legacyTitle: string;
  migratedTo: number[];
  improvement: string;
}

/**
 * Traceability from the previous `/Notas` course. This is deliberately kept
 * executable so removing a migrated topic or renumbering its destination
 * fails the curriculum integration suite instead of silently losing coverage.
 */
export const LEGACY_LIT_MIGRATION: LegacyLitMigrationEntry[] = [
  { legacyId: '01-introduccion', legacyTitle: 'Introducción a Lit', migratedTo: [1, 14, 15], improvement: 'Primero enseña la plataforma nativa y después delimita qué automatiza Lit.' },
  { legacyId: '02-tu-primer-componente', legacyTitle: 'Tu primer componente', migratedTo: [1, 2, 15], improvement: 'Explica contrato, HTMLElement, super y registro antes del primer LitElement.' },
  { legacyId: '03-templates-html', legacyTitle: 'Templates HTML', migratedTo: [15, 16, 17], improvement: 'Distingue posiciones de binding, seguridad, ramas, listas y ausencia.' },
  { legacyId: '04-propiedades', legacyTitle: 'Propiedades', migratedTo: [5, 6, 18], improvement: 'Compara atributos y propiedades nativas antes de la reactividad de Lit.' },
  { legacyId: '05-estado-reactivo', legacyTitle: 'Estado reactivo', migratedTo: [9, 18, 19], improvement: 'Parte de una fuente de verdad y separa API pública de estado interno.' },
  { legacyId: '06-propiedades-computadas', legacyTitle: 'Propiedades computadas', migratedTo: [19, 20, 23], improvement: 'Evita estado derivado duplicado y calcula según dependencias observables.' },
  { legacyId: '07-observando-cambios', legacyTitle: 'Observando cambios', migratedTo: [20, 23], improvement: 'Enseña referencias, changedProperties y actualización idempotente.' },
  { legacyId: '08-constructor-connected', legacyTitle: 'Constructor y conexión', migratedTo: [2, 3, 22], improvement: 'Explica causalmente super, conexión, reconexión y limpieza.' },
  { legacyId: '09-first-updated', legacyTitle: 'firstUpdated', migratedTo: [24], improvement: 'Limita acceso DOM al momento correcto y contrasta refs y updateComplete.' },
  { legacyId: '10-updated-disconnected', legacyTitle: 'updated y desconexión', migratedTo: [3, 22, 23, 24], improvement: 'Separa ciclo nativo, ciclo reactivo, DOM actualizado y recursos vivos.' },
  { legacyId: '11-eventos-dom', legacyTitle: 'Eventos DOM', migratedTo: [7, 21], improvement: 'Usa controles semánticos, bindings de eventos y formularios.' },
  { legacyId: '12-eventos-personalizados', legacyTitle: 'Eventos personalizados', migratedTo: [7, 21, 44], improvement: 'Prueba detail, bubbles, composed y eventos de intención en Shadow DOM.' },
  { legacyId: '13-comunicacion-componentes', legacyTitle: 'Comunicación', migratedTo: [8, 10, 21, 30, 44], improvement: 'Compara propiedades, eventos, slots, contexto y controllers por frontera.' },
  { legacyId: '14-css-encapsulado', legacyTitle: 'CSS encapsulado', migratedTo: [4, 25], improvement: 'Explica Shadow DOM, :host, herencia y límites de encapsulación.' },
  { legacyId: '15-estilos-dinamicos', legacyTitle: 'Estilos dinámicos', migratedTo: [25, 28], improvement: 'Distingue estado, clases, estilos y propiedades CSS declarativas.' },
  { legacyId: '16-css-parts-variables', legacyTitle: 'CSS parts y variables', migratedTo: [25, 26], improvement: 'Trata variables y parts como contratos públicos documentados.' },
  { legacyId: '17-slots-composicion', legacyTitle: 'Slots y composición', migratedTo: [8, 26], improvement: 'Primero usa slots nativos y después contratos de composición Lit.' },
  { legacyId: '18-directivas', legacyTitle: 'Directivas', migratedTo: [27, 28, 33], improvement: 'Selecciona directivas por problema y termina creando una directiva propia.' },
  { legacyId: '19-mixins', legacyTitle: 'Mixins', migratedTo: [30, 41, 44], improvement: 'Enseña mixins reales de clase, cadena de super y alternativas modernas.' },
  { legacyId: '20-animaciones', legacyTitle: 'Animaciones', migratedTo: [24, 34], improvement: 'Coordina DOM actualizado, Web Animations y reduced motion.' },
  { legacyId: '21-proyecto-final', legacyTitle: 'Proyecto final', migratedTo: [32, 40], improvement: 'Construye por cortes verticales con contratos, persistencia y evidencia.' },
  { legacyId: '22-testing', legacyTitle: 'Testing', migratedTo: [14, 31, 40], improvement: 'Ejecuta componentes en navegador y prueba API pública, a11y y empaquetado.' },
  { legacyId: '23-patron-observer', legacyTitle: 'Observer', migratedTo: [30, 35], improvement: 'Asigna dueño a cada suscripción, devuelve unsubscribe y limpia por ciclo.' },
  { legacyId: '24-patron-bridge', legacyTitle: 'Bridge', migratedTo: [36, 43], improvement: 'Aplica adapters a servicios y Bridge a evaluadores intercambiables.' },
  { legacyId: '25-proyecto-mi-museo', legacyTitle: 'Proyecto Museo', migratedTo: [37], improvement: 'Añade estados remotos, normalización, curaduría, favoritos y fallbacks.' },
  { legacyId: '26-proyecto-climavivo', legacyTitle: 'Proyecto Clima', migratedTo: [38], improvement: 'Añade concurrencia, identidad y fallos parciales por ciudad.' },
  { legacyId: '27-proyecto-rele', legacyTitle: 'Proyecto Relé', migratedTo: [41, 42, 43, 44, 45], improvement: 'Divide el reto en mixins, grafo, ciclos, orden, Bridge, eventos, reloj e historial.' },
];
