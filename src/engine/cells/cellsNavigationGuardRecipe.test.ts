import { describe, expect, it } from 'vitest';
import { navigationGuardSource } from './cellsNavigationGuardRecipe';

async function createGuard() {
  return (await import(`data:text/javascript;base64,${Buffer.from(navigationGuardSource()).toString('base64')}`)).createNavigationGuard;
}
const route = (page: string) => ({ from: { page: 'home', params: {} }, to: { page, params: { id: 'first' } } });

describe('coordinación de confirmaciones de navegación', () => {
  it('invalida una respuesta pendiente si una navegación posterior ya no necesita confirmar', async () => {
    const factory = await createGuard();
    let dirty = true;
    let answer!: (value: unknown) => void;
    const applied: unknown[] = [];
    const guard = factory({ hasPendingChanges: () => dirty, decide: () => new Promise((resolve) => { answer = resolve; }), navigate: (...args: unknown[]) => applied.push(args) });
    const intent = route('product-detail');
    guard.interceptor(intent);
    const pending = guard.handleIntercepted(intent);
    dirty = false;
    expect(guard.interceptor(route('favorites'))).toEqual({ intercept: false });
    answer({ action: 'allow' });
    await pending;
    expect(applied).toEqual([]);
  });

  it('retira el permiso si falla la reanudación y no acepta destinos alterados por la respuesta', async () => {
    const factory = await createGuard();
    const applied: unknown[] = [];
    const guard = factory({ hasPendingChanges: () => true, decide: async () => ({ action: 'allow', target: { page: 'other' } }), navigate: (...args: unknown[]) => { applied.push(args); throw new Error('navigation failed'); } });
    const intent = route('product-detail');
    guard.interceptor(intent);
    await expect(guard.handleIntercepted(intent)).rejects.toThrow('navigation failed');
    expect(applied).toEqual([['product-detail', { id: 'first' }]]);
    expect(guard.interceptor(intent)).toEqual({ intercept: true });
  });

  it('intercepta síncronamente y autoriza una única reanudación tras confirmar', async () => {
    const factory = await createGuard();
    const applied: unknown[] = [];
    const guard = factory({ hasPendingChanges: () => true, decide: async ({ target }: { target: unknown }) => ({ action: 'allow', target }), navigate: (...args: unknown[]) => applied.push(args) });
    const intent = route('product-detail');
    expect(guard.interceptor(intent)).toEqual({ intercept: true });
    expect(applied).toEqual([]);
    await guard.handleIntercepted(intent);
    expect(applied).toEqual([['product-detail', { id: 'first' }]]);
    expect(guard.interceptor(intent)).toEqual({ intercept: false });
    expect(guard.interceptor(intent)).toEqual({ intercept: true });
  });

  it('ignora una confirmación resuelta después de una intención nueva', async () => {
    const factory = await createGuard();
    const applied: unknown[] = [];
    const answers: Array<(value: unknown) => void> = [];
    const guard = factory({ hasPendingChanges: () => true, decide: () => new Promise((resolve) => answers.push(resolve)), navigate: (...args: unknown[]) => applied.push(args) });
    const first = route('product-detail');
    const second = route('favorites');
    guard.interceptor(first);
    const pendingFirst = guard.handleIntercepted(first);
    guard.interceptor(second);
    const pendingSecond = guard.handleIntercepted(second);
    answers[0]({ action: 'allow', target: first.to });
    await pendingFirst;
    expect(applied).toEqual([]);
    answers[1]({ action: 'cancel', target: second.to });
    await pendingSecond;
    expect(applied).toEqual([]);
  });

  it('no duplica confirmaciones y descarta las pendientes al liberar el coordinador', async () => {
    const factory = await createGuard();
    let answer!: (value: unknown) => void;
    let confirmations = 0;
    const applied: unknown[] = [];
    const guard = factory({ hasPendingChanges: () => true, decide: () => { confirmations += 1; return new Promise((resolve) => { answer = resolve; }); }, navigate: (...args: unknown[]) => applied.push(args) });
    const intent = route('product-detail');
    guard.interceptor(intent);
    const pending = guard.handleIntercepted(intent);
    await guard.handleIntercepted(intent);
    expect(confirmations).toBe(1);
    guard.dispose();
    answer({ action: 'allow', target: intent.to });
    await pending;
    expect(applied).toEqual([]);
  });
});
