import { describe, it, expect } from 'vitest';
import { getOrderedItems, getNavigationState } from './navigation';
import { FUNDAMENTOS_COURSE } from '../curriculum/fundamentos/course';

describe('navigation', () => {
  it('ordena correctamente el currículo', () => {
    const ordered = getOrderedItems(FUNDAMENTOS_COURSE);
    expect(ordered.length).toBeGreaterThan(10);
    expect(ordered[0].item.id).toBe('fundamentos-01');
    // First module first item should be scrim
    expect(ordered[0].item.type).toBe('scrim');
  });

  it('primer elemento no tiene anterior', () => {
    const ordered = getOrderedItems(FUNDAMENTOS_COURSE);
    const firstId = ordered[0].item.id;
    const nav = getNavigationState(FUNDAMENTOS_COURSE, firstId);
    expect(nav.isFirst).toBe(true);
    expect(nav.hasPrevious).toBe(false);
    expect(nav.previous).toBeNull();
    expect(nav.hasNext).toBe(true);
    expect(nav.next).not.toBeNull();
  });

  it('elemento intermedio tiene anterior y siguiente', () => {
    const ordered = getOrderedItems(FUNDAMENTOS_COURSE);
    const midId = ordered[Math.floor(ordered.length / 2)].item.id;
    const nav = getNavigationState(FUNDAMENTOS_COURSE, midId);
    expect(nav.hasPrevious).toBe(true);
    expect(nav.hasNext).toBe(true);
    expect(nav.isFirst).toBe(false);
    expect(nav.isLast).toBe(false);
  });

  it('último elemento tiene siguiente falso y es último', () => {
    const ordered = getOrderedItems(FUNDAMENTOS_COURSE);
    const lastId = ordered[ordered.length - 1].item.id;
    const nav = getNavigationState(FUNDAMENTOS_COURSE, lastId);
    expect(nav.isLast).toBe(true);
    expect(nav.hasNext).toBe(false);
    expect(nav.next).toBeNull();
    expect(nav.hasPrevious).toBe(true);
  });

  it('transición lección → depuración', () => {
    // In fundamentals, each scrim is followed by its debug item
    const ordered = getOrderedItems(FUNDAMENTOS_COURSE);
    // Find first scrim
    const firstScrimIdx = ordered.findIndex(o => o.item.type === 'scrim');
    const next = ordered[firstScrimIdx + 1];
    expect(next.item.type).toBe('debugging');
    const nav = getNavigationState(FUNDAMENTOS_COURSE, ordered[firstScrimIdx].item.id);
    expect(nav.next?.item.id).toBe(next.item.id);
  });

  it('transición depuración → siguiente lección', () => {
    const ordered = getOrderedItems(FUNDAMENTOS_COURSE);
    const firstDebugIdx = ordered.findIndex(o => o.item.type === 'debugging');
    const next = ordered[firstDebugIdx + 1];
    expect(next.item.type).toBe('scrim');
    const nav = getNavigationState(FUNDAMENTOS_COURSE, ordered[firstDebugIdx].item.id);
    expect(nav.next?.item.id).toBe(next.item.id);
  });

  it('regresar al anterior funciona', () => {
    const ordered = getOrderedItems(FUNDAMENTOS_COURSE);
    const idx = 5;
    const nav = getNavigationState(FUNDAMENTOS_COURSE, ordered[idx].item.id);
    expect(nav.previous?.item.id).toBe(ordered[idx - 1].item.id);
  });

  it('maneja id desconocido', () => {
    const nav = getNavigationState(FUNDAMENTOS_COURSE, 'no-existe');
    expect(nav.current).toBeNull();
    expect(nav.hasPrevious).toBe(false);
    expect(nav.hasNext).toBe(false);
  });
});
