import React from 'react';

interface TechnologyPathProps {
  currentCourseId: string;
}

const STEPS = [
  {
    id: 'course-javascript',
    short: 'JavaScript',
    title: 'Lenguaje y lógica',
    description: 'Datos, funciones, módulos, asincronía y DOM.',
    output: 'Comportamiento reutilizable',
  },
  {
    id: 'course-web-components-lit',
    short: 'Web Components',
    title: 'Contrato del navegador',
    description: 'Custom elements, propiedades, atributos, eventos y Shadow DOM.',
    output: 'Componente interoperable',
  },
  {
    id: 'course-web-components-lit',
    short: 'Lit',
    title: 'Implementación reactiva',
    description: 'Templates, estado reactivo, estilos y ciclo de actualización.',
    output: 'Componente mantenible',
  },
  {
    id: 'course-open-cells',
    short: 'Cells',
    title: 'Arquitectura de producto',
    description: 'Contratos, composición scoped, páginas, canales, datos y entrega.',
    output: 'Aplicación escalable',
  },
] as const;

export const TechnologyPath: React.FC<TechnologyPathProps> = ({ currentCourseId }) => (
  <section className="technology-path" aria-labelledby="technology-path-title">
    <header>
      <span>MAPA DE TECNOLOGÍAS</span>
      <h3 id="technology-path-title">De una instrucción a una aplicación Cells</h3>
      <p>Cada capa conserva la anterior. Cells no reemplaza Lit, Lit no reemplaza Web Components y ninguna funciona sin JavaScript.</p>
    </header>
    <ol aria-label="Relación entre JavaScript, Web Components, Lit y Cells">
      {STEPS.map((step, index) => {
        const isCurrent = step.id === currentCourseId;
        return (
          <li key={`${step.short}-${index}`} className={isCurrent ? 'is-current' : ''}>
            <div className="technology-path__number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</div>
            <article>
              <div className="technology-path__eyebrow"><strong>{step.short}</strong>{isCurrent && <span>Estás aquí</span>}</div>
              <h4>{step.title}</h4>
              <p>{step.description}</p>
              <small>Produce: {step.output}</small>
            </article>
            {index < STEPS.length - 1 && <div className="technology-path__connector" aria-hidden="true"><span>se apoya en</span><b>↓</b></div>}
          </li>
        );
      })}
    </ol>
    <aside>
      <strong>Cómo leer el mapa</strong>
      <p>Si un problema aparece en Cells, baja una capa hasta encontrar el contrato responsable. Después vuelve a subir comprobando cada frontera.</p>
    </aside>
  </section>
);
