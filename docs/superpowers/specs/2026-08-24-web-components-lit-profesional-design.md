# Curso profesional de Web Components y Lit

## Propósito

Crear un tercer curso independiente para quien ya terminó JavaScript y necesita pasar de conocer sintaxis a construir, depurar y mantener interfaces basadas en Web Components y Lit. El curso usa JavaScript, no TypeScript ni decoradores, y mantiene cada concepto nuevo detrás de un requisito previamente enseñado.

## Decisiones pedagógicas

- El curso tiene actualmente 45 unidades: 14 de Web Components nativos y 31 de Lit y arquitectura aplicada. No existe un límite pedagógico de 24, 32, 40 o 45; la ruta crece cuando aparece una frontera conceptual que necesita explicación, aplicación y depuración propias.
- Lit no aparece hasta que el estudiante domina `HTMLElement`, registro, ciclo de vida, Shadow DOM, propiedades, eventos y slots.
- Cada unidad sigue: modelo mental -> demostración en otra aplicación -> lectura profunda -> diagrama o traza -> aplicación del estudiante -> laboratorio de depuración.
- El ejemplo trabajado y la aplicación del estudiante resuelven problemas distintos. Ningún starter, pista o material de diagnóstico contiene la solución final.
- Cada práctica acepta soluciones equivalentes por comportamiento. Las comprobaciones de componentes se ejecutan en la vista previa real del navegador.
- Los proyectos usan archivos `.js`, `static properties` y módulos ES. No se enseñan decoradores ni sintaxis exclusiva de TypeScript.
- Las lecturas explican cuándo aplicar el concepto, cuándo evitarlo, buenas prácticas, errores frecuentes, accesibilidad y cómo investigarlo en MDN o Lit.

## Ruta de 45 unidades

### Web Components nativos

1. Contrato de un componente y nombres válidos — insignia de estado.
2. Clases, `HTMLElement` y por qué existe `super()` — tarjeta de perfil.
3. Conexión, desconexión y limpieza — reloj conectable.
4. Shadow DOM y frontera de estilos — aviso temático.
5. Atributos, propiedades y conversión — medidor de progreso.
6. Reflexión y estados observables — interruptor accesible.
7. Eventos públicos con `CustomEvent` — selector de cantidad.
8. Slots y composición — panel de contenido.
9. Render predecible desde estado — lista de compras.
10. Componentes padre/hijo y flujo unidireccional — carrito.
11. Accesibilidad, teclado, foco y nombres accesibles — menú de acciones.
12. Formularios y elementos asociados — campo de cantidad.
13. Trabajo asíncrono, carga, vacío, error y cancelación — buscador.
14. Pruebas de navegador y contrato publicable — diálogo reutilizable.

### Lit sobre la plataforma

15. Qué automatiza Lit y qué sigue siendo nativo — tarjeta de producto.
16. `html`, bindings y seguridad de templates — resumen de pedido.
17. Condicionales, listas y ausencia de contenido — panel de sesión.
18. Propiedades reactivas y atributos — ficha configurable.
19. Estado interno y fronteras de API — contador de inventario.
20. Arrays inmutables y actualización por referencia — tablero de tareas.
21. Eventos y formularios en Lit — editor de perfil.
22. Ciclo nativo dentro de Lit y obligación de llamar a `super` — monitor conectable.
23. Ciclo reactivo y `changedProperties` — comparador de filtros.
24. `firstUpdated`, `updated` y `updateComplete` — buscador con foco.
25. Estilos, `:host` y temas mediante propiedades CSS — tarjeta tematizable.
26. Slots, parts y contratos de composición — panel de aplicación.
27. `repeat`, `when` y `choose` según la identidad de los datos — bandeja de pedidos.
28. `classMap`, `styleMap`, `ref` y acceso DOM justificado — tabla interactiva.
29. Tareas asíncronas, carga, vacío, error y carreras — catálogo remoto.
30. Controladores reactivos, contexto y servicios compartidos — panel de conectividad.
31. Testing, accesibilidad, empaquetado y producción — biblioteca de componentes.
32. Primera integración por cortes verticales — gestor de incidencias.
33. Directivas personalizadas y `PartInfo` — formulario de validación.
34. Animación con propósito y movimiento reducido — bandeja de avisos.
35. Observer moderno, suscripciones y limpieza — tablero de métricas.
36. Bridge y Adapter para servicios externos — panel de pagos.
37. Proyecto API de museo con curaduría y estados — sala de museo.
38. Proyecto API de clima con concurrencia y fallos parciales — tablero multiciudad.
39. SSR, entorno DOM e hidratación — ficha de producto universal.
40. Capstone profesional con evidencia integral — sistema de soporte publicable.
41. Mixins heredados, cadena de `super` y controllers como alternativa — panel de viewport.
42. Grafos dirigidos y rechazo de ciclos antes de mutar — planificador de dependencias.
43. Orden topológico y Bridge de evaluadores — calculadora de circuitos.
44. Eventos públicos, pointer capture y dueño del estado — tablero Relé.
45. Reloj, historial y estado efímero — estudio Relé entregable.

## Arquitectura del contenido

`src/curriculum/web-components-lit/` contiene especificaciones, fábrica, razonamiento y registro del curso. Los workspaces importan Lit con `import { LitElement, html, css } from 'lit'`; el preview inyecta un import map fijado a Lit 3.3.3. Los guiones hablados viven en `docs/guiones/web-components-lit/` y funcionan con el reloj sintético hasta que se generen audios dedicados.

## Evaluación

- `function-call` comprueba reglas puras.
- `source-regex` se limita a contratos sintácticos inevitables, nunca a una única solución completa.
- `browser-script` espera el registro del elemento y ejecuta comprobaciones contra instancias reales, Shadow DOM, eventos y actualizaciones de Lit.
- Cada starter de clase y laboratorio debe fallar al menos una comprobación.
- Las soluciones de control solo existen dentro de tests, no en los datos enviados al navegador.

## Criterios de aceptación

- Catálogo con Fundamentos, JavaScript y Web Components + Lit independientes.
- 45 clases, 45 lecturas, 45 prácticas de razonamiento y 45 laboratorios.
- 45 aplicaciones de clase y 45 aplicaciones rotas diferentes.
- Trazabilidad ejecutable de las 27 clases heredadas en `legacyMigration.ts`.
- Guiones de al menos 500 palabras y lecturas nucleares de al menos 650 palabras por unidad.
- Ejemplos, starters y bugs como JavaScript válido, formateado y con líneas de hasta 120 caracteres.
- Cero `solutionFiles`, cero pistas con código final y cero archivos TypeScript en los workspaces.
- Dependencias pedagógicas verificadas en orden.
- Uso real de `super()` explicado causalmente en clases nativas y Lit.
- Inicio, unidad intermedia nativa, transición a Lit y proyecto final verificados en Browser.
