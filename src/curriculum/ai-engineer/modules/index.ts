import { AI_MODULE_00 } from './module00';
import { AI_MODULE_01 } from './module01';
import { AI_MODULE_02 } from './module02';
import { AI_MODULE_03 } from './module03';
import { AI_MODULE_04 } from './module04';
import { AI_MODULE_05 } from './module05';
import { AI_MODULE_06 } from './module06';
import { AI_MODULE_07 } from './module07';
import { AI_MODULE_08 } from './module08';

export const AI_SPECS_01_TO_27 = [
  ...AI_MODULE_00,
  ...AI_MODULE_01,
  ...AI_MODULE_02,
  ...AI_MODULE_03,
  ...AI_MODULE_04,
];

export const AI_SPECS_28_TO_51 = [
  ...AI_MODULE_05,
  ...AI_MODULE_06,
  ...AI_MODULE_07,
  ...AI_MODULE_08,
];

export const AI_SPECS = [
  ...AI_SPECS_01_TO_27,
  ...AI_SPECS_28_TO_51,
];
