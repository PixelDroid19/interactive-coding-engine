import { AI_FASE_01 } from './fase01';
import { AI_FASE_02 } from './fase02';
import { AI_FASE_03 } from './fase03';
import { AI_FASE_04 } from './fase04';
import { AI_FASE_05 } from './fase05';
import { AI_FASE_06 } from './fase06';
import { AI_FASE_07 } from './fase07';

// Progresión completa: 39 clases en 7 fases que construyen el TutorLocal,
// un chat educativo local que crece capacidad a capacidad.
export const AI_SPECS = [
  ...AI_FASE_01,
  ...AI_FASE_02,
  ...AI_FASE_03,
  ...AI_FASE_04,
  ...AI_FASE_05,
  ...AI_FASE_06,
  ...AI_FASE_07,
];

/** Clases de la Fase 1 a la 3 (fundamentos, conversación y motor local). */
export const AI_SPECS_01_A_16 = [...AI_FASE_01, ...AI_FASE_02, ...AI_FASE_03];
