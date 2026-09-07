import { COMPONENT_COURSE, COMPONENT_COURSE_SCRIMS } from '../../src/curriculum/web-components-lit/course';
import { reconstructWorkspaceAt } from '../../src/engine/eventLog';
import type { ScrimChallenge } from '../../src/types/scrim';
import { mountRegressions } from './regressionRunner';

// Browser-only regression: Happy DOM does not implement form-associated custom elements.
// These are test programs, never imported by the student application or exported catalog.
const lesson = COMPONENT_COURSE_SCRIMS['componentes-lit-12'];
const challenge = lesson.challenges[0];
const debug = COMPONENT_COURSE.modules.flatMap(module => module.items)
  .find(item => item.id === 'componentes-lit-12-debug');
if (!debug || debug.type !== 'debugging') throw new Error('Falta la práctica de formularios.');

const activities = {
  class: {
    challenge,
    workspace: reconstructWorkspaceAt(lesson.initialWorkspace, lesson.events, lesson.snapshots, challenge.timestamp).workspace,
  },
  debug: {
    challenge: { id: debug.id, title: debug.title, instructions: debug.description, timestamp: 0, tests: debug.tests, hints: [] } satisfies ScrimChallenge,
    workspace: debug.initialWorkspace,
  },
};

function fieldProgram(kind: 'class' | 'debug', { computed = false, initial = true, validity = true, changes = true } = {}) {
  const quantity = kind === 'class';
  const name = quantity ? 'QuantityField' : 'CouponField';
  const tag = quantity ? 'quantity-field' : 'coupon-field';
  return `class ${name} extends HTMLElement {
    static formAssociated = true;
    constructor() { super(); this.api = ${computed ? "this['attach' + 'Internals']()" : 'this.attachInternals()'}; }
    connectedCallback() {
      this.innerHTML = ${JSON.stringify(quantity ? '<input type="number" min="1" value="1" aria-label="Cantidad">' : '<input value="SAVE10" aria-label="Cupón">')};
      const input = this.querySelector('input');
      const publish = () => {
        ${computed ? "this.api['set' + 'FormValue'](input.value)" : 'this.api.setFormValue(input.value)'};
        ${quantity && validity ? "this.api.setValidity(Number(input.value) < 1 ? {rangeUnderflow:true} : {}, Number(input.value) < 1 ? 'La cantidad mínima es uno.' : '', input);" : ''}
      };
      ${changes ? "input.addEventListener('input', publish);" : ''}
      ${initial ? 'publish();' : ''}
    }
  }
  customElements.define('${tag}', ${name});`;
}

const cases = [
  { name: 'Clase: el programa inicial no aprueba', kind: 'class', source: activities.class.workspace.files['app.js'].content, accept: false, noPassed: true },
  { name: 'Clase: acepta un campo nativo completo', kind: 'class', source: fieldProgram('class'), accept: true },
  { name: 'Clase: acepta acceso calculado a las APIs', kind: 'class', source: fieldProgram('class', { computed: true }), accept: true },
  { name: 'Clase: rechaza omitir el valor inicial', kind: 'class', source: fieldProgram('class', { initial: false }), accept: false },
  { name: 'Clase: rechaza omitir la validez del host', kind: 'class', source: fieldProgram('class', { validity: false }), accept: false },
  { name: 'Clase: rechaza ignorar cambios del input', kind: 'class', source: fieldProgram('class', { changes: false }), accept: false },
  { name: 'Depuración: el programa inicial no aprueba', kind: 'debug', source: activities.debug.workspace.files['app.js'].content, accept: false, noPassed: true },
  { name: 'Depuración: acepta un campo nativo completo', kind: 'debug', source: fieldProgram('debug'), accept: true },
  { name: 'Depuración: acepta acceso calculado a las APIs', kind: 'debug', source: fieldProgram('debug', { computed: true }), accept: true },
  { name: 'Depuración: rechaza omitir el valor inicial', kind: 'debug', source: fieldProgram('debug', { initial: false }), accept: false },
  { name: 'Depuración: rechaza ignorar cambios del input', kind: 'debug', source: fieldProgram('debug', { changes: false }), accept: false },
] as const;

mountRegressions(cases.map(test => ({ ...test, ...activities[test.kind] })));
