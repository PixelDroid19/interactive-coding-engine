import { describe, expect, it } from 'vitest';
import { createCellsComponentWorkspace, widgetMixinSource } from './cellsRecipes';

function runtime() {
  return new Function(`${widgetMixinSource().replace('export const WidgetMixin', 'const WidgetMixin')}; return WidgetMixin;`)();
}

describe('educational Cells composition contracts', () => {
  it('maps classes by their public is getter and preserves inherited scoped registrations', () => {
    class Existing { static get is() { return 'academy-existing'; } }
    class Action { static get is() { return 'academy-action'; } }
    class Base { static get scopedElements() { return { 'academy-existing': Existing }; } }
    const Host = runtime()(Base);
    expect(Host.scopedElementsFromClasses([Action])).toEqual({
      'academy-existing': Existing,
      'academy-action': Action,
    });
    expect(Host.configurationScopedElements()).toEqual([]);
  });

  it('lets an educational host supply configuration classes without global registration', () => {
    class Notice { static get is() { return 'academy-notice'; } }
    class Host extends runtime()(class {}) {
      static configurationScopedElements() { return [Notice]; }
      static get scopedElements() { return this.scopedElementsFromClasses(this.configurationScopedElements()); }
    }
    expect(Host.scopedElements).toEqual({ 'academy-notice': Notice });
    expect(Host.scopedElementsFromClasses([])).toEqual({});
  });

  it('rejects invalid dependencies instead of making an unusable local registry', () => {
    const Host = runtime()(class {});
    expect(() => Host.scopedElementsFromClasses([class {}])).toThrow('ACADEMY_SCOPED_INVALID_CLASS');
    expect(() => Host.scopedElementsFromClasses([{ is: 'academy-object' }])).toThrow('ACADEMY_SCOPED_INVALID_CLASS');
    expect(() => Host.scopedElementsFromClasses(null)).toThrow('ACADEMY_SCOPED_INVALID_CLASSES');
  });

  it('keeps named shared styles isolated and returns defensive arrays', () => {
    const files = createCellsComponentWorkspace({ name: 'academy-card' }).snapshot.files;
    const source = files['src/styles/shared-styles.js']?.content ?? '';
    expect(source).not.toBe('');
    const { registerComponentSharedStyles, getComponentSharedStyles } = new Function(
      `${source.replaceAll('export function ', 'function ')}; return { registerComponentSharedStyles, getComponentSharedStyles };`,
    )();
    const first = Object.freeze({ cssText: ':host { color: blue; }' });
    const second = Object.freeze({ cssText: ':host { color: green; }' });
    registerComponentSharedStyles('academy-card-shared-styles', [first]);
    registerComponentSharedStyles('academy-other-shared-styles', [second]);
    const read = getComponentSharedStyles('academy-card-shared-styles');
    read.push(second);
    expect(getComponentSharedStyles('academy-card-shared-styles')).toEqual([first]);
    expect(getComponentSharedStyles('academy-other-shared-styles')).toEqual([second]);
    expect(getComponentSharedStyles('unknown')).toEqual([]);
  });
});
