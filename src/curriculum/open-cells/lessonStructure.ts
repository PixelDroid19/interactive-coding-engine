import type { ReadingItem } from '../../types/curriculum';

const TRAILS: Array<{ until: number; paths: string[]; relationship: string }> = [
  { until: 14, paths: ['package.json', 'src/<componente>.js', 'demo/demo.js', 'test/unit/<componente>.test.js'], relationship: 'entrada pública → implementación → consumidor humano → comprobación' },
  { until: 22, paths: ['src/<componente>.js', 'src/components/<dependencia>.js', 'demo/index.html', 'test/unit/<componente>.test.js'], relationship: 'import → registro scoped → tag renderizado → aislamiento comprobado' },
  { until: 30, paths: ['locales/locales.json', 'src/<componente>.js', 'demo/demo.js', 'test/unit/<componente>.test.js'], relationship: 'catálogo o evento → componente → consumidor → contrato observable' },
  { until: 38, paths: ['demo/index.html', 'demo/demo.js', 'custom-elements.json', 'test/unit/<componente>.test.js'], relationship: 'caso de uso → entrada pública → documentación → prueba' },
  { until: 46, paths: ['app/scripts/app.js', 'app/scripts/app-routes.js', 'app/pages/<pagina>/<pagina>.js', 'app/config/dev.js'], relationship: 'arranque → resolución de página → ciclo de vida → configuración' },
  { until: 54, paths: ['app/scripts/app-routes.js', 'app/scripts/channels.js', 'app/pages/<origen>/<origen>.js', 'app/pages/<destino>/<destino>.js'], relationship: 'intención → contrato de comunicación → publicación → consumo' },
  { until: 62, paths: ['app/data/<gestor>.js', 'app/pages/<pagina>/<pagina>.js', 'app/scripts/channels.js', 'test/unit/app.test.js'], relationship: 'petición → transición de estado → publicación → evidencia' },
  { until: Number.POSITIVE_INFINITY, paths: ['package.json', 'app/config/prod.js', 'test/unit/app.test.js', 'README.md'], relationship: 'contrato de entrega → configuración → verificación → continuación' },
];

export function enrichOpenCellsSections(
  number: number,
  title: string,
  summary: string,
  sections: ReadingItem['sections'],
): ReadingItem['sections'] {
  const trail = TRAILS.find((candidate) => number <= candidate.until) ?? TRAILS.at(-1)!;
  const pathList = trail.paths.map((path) => `\`${path}\``).join(' → ');
  return [
    ...sections,
    {
      title: 'Recorrido de archivos',
      content: `Para comprobar «${title}», sigue ${pathList}. Busca esta relación: ${trail.relationship}. En cada frontera anota qué recibe, qué entrega y cómo se conecta con esta meta: ${summary}`,
      example: `Objetivo: ${title}\nPrimera evidencia: localiza la entrada pública.\nRecorrido: ${trail.paths.join(' -> ')}\nCierre: ejecuta el consumidor y la prueba desde fuera.`,
      exampleCaption: 'Recorrido mínimo para investigar el contrato sin adivinar.',
    },
    {
      title: 'Antes de editar',
      content: `Explica con tus palabras esta predicción: ${summary} Señala el archivo que contiene la causa, el resultado visible que debería cambiar y una segunda entrada que impediría aprobar una solución fija.`,
    },
  ];
}
