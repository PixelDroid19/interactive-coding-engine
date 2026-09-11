import { expect, it } from 'vitest';
import { cloneRuntimeData } from './cloneRuntimeData';

it('mantiene callbacks ejecutables y aísla objetos y arrays mutables', async () => {
  const provider = async () => ({ titulo: 'Guía práctica' });
  const original = { args: [provider, { values: [1] }] };
  const copy = cloneRuntimeData(original);
  expect(copy.args[0]).toBe(provider);
  expect(await (copy.args[0] as typeof provider)()).toEqual({ titulo: 'Guía práctica' });
  (copy.args[1] as { values: number[] }).values.push(2);
  expect(original.args[1]).toEqual({ values: [1] });
});

it('conserva referencias repetidas y ciclos sin compartir el objeto original', () => {
  const child = { value: 1 };
  const original: { a: typeof child; b: typeof child; self?: unknown } = { a: child, b: child };
  original.self = original;
  const copy = cloneRuntimeData(original);
  expect(copy.self).toBe(copy);
  expect(copy.a).toBe(copy.b);
  expect(copy.a).not.toBe(child);
});

it('sigue clonando los valores nativos y conserva huecos de arrays', () => {
  const original = { date: new Date('2026-01-01'), values: new Array(2) };
  const copy = cloneRuntimeData(original);
  expect(copy.date).toEqual(original.date);
  expect(copy.date).not.toBe(original.date);
  expect(copy.values).toHaveLength(2);
  expect(0 in copy.values).toBe(false);
});
