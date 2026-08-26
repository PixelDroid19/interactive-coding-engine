# Playground nativo de Cells con componentes neutrales

## Objetivo

El curso de Cells debe enseñar contratos reales del ecosistema sin incluir componentes, paquetes, nombres ni APIs privadas de organizaciones externas. La plataforma será responsable de la experiencia de demostración; el iframe se limitará a ejecutar el proyecto del estudiante.

## Decisiones

- Los proyectos didácticos usarán componentes locales `academy-*`.
- Los ejemplos conservarán `LitElement`, `ScopedElementsMixin`, `WidgetMixin`, propiedades públicas, eventos compuestos, i18n, SCSS como fuente y el artefacto `css.js` generado.
- El manifiesto de un componente declarará solo dependencias abiertas y locales necesarias para el ejercicio.
- La interfaz de demostración será React nativo: casos, pestañas Visual/Código/Documentación, idioma, tamaños, ocultar interfaz y flujo de eventos.
- El iframe contendrá solo la salida ejecutable del componente o de la aplicación y un puente mínimo de mensajes.
- Las aplicaciones conservarán el renderizado completo; el workbench especializado se activa solo para proyectos de componente.
- El curso, las pruebas, los guiones y los proyectos virtuales no contendrán paquetes, etiquetas ni referencias privadas de terceros.

## Contrato del puente

La plataforma envía al iframe:

- `demo:set-case` con propiedades públicas del caso seleccionado.
- `locale:set` con `es` o `en`.

El iframe envía a la plataforma:

- `ready` cuando el componente está montado.
- `component:event` con nombre y `detail` de eventos públicos.
- `error` cuando falla la carga o la ejecución.

## Criterios de aceptación

1. La búsqueda global en currículo, motor, pruebas y guiones no encuentra paquetes, etiquetas ni nombres privados de terceros.
2. El scaffold contiene al menos dos componentes locales neutrales registrados en `scopedElements`.
3. El componente principal importa estilos desde su `css.js`, derivado del SCSS.
4. La salida del compilador no genera controles de demo dentro del iframe.
5. Los controles nativos cambian caso, idioma y tamaño sin reconstruir una aplicación falsa por lección.
6. Los eventos del componente aparecen en el inspector de la plataforma.
7. El laboratorio y la vista flotante comparten el mismo workbench nativo.
8. Una aplicación Cells sigue ocupando su vista previa completa.
9. Los modos normal y cyber funcionan en escritorio y móvil.
