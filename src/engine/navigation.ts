import { Course, CurriculumItem } from '../types/curriculum';

export interface OrderedItem {
  item: CurriculumItem;
  moduleId: string;
  moduleTitle: string;
  index: number;
}

export function getOrderedItems(course: Course): OrderedItem[] {
  const ordered: OrderedItem[] = [];
  let idx = 0;
  for (const mod of course.modules) {
    for (const item of mod.items) {
      ordered.push({ item, moduleId: mod.id, moduleTitle: mod.title, index: idx++ });
    }
  }
  return ordered;
}

export function getCurrentOrderedIndex(course: Course, currentItemId: string | null): number {
  if (!currentItemId) return -1;
  const ordered = getOrderedItems(course);
  return ordered.findIndex((o) => o.item.id === currentItemId);
}

export interface NavigationState {
  hasPrevious: boolean;
  hasNext: boolean;
  isFirst: boolean;
  isLast: boolean;
  previous: OrderedItem | null;
  next: OrderedItem | null;
  current: OrderedItem | null;
}

export function getNavigationState(course: Course, currentItemId: string | null): NavigationState {
  const ordered = getOrderedItems(course);
  const currentIdx = getCurrentOrderedIndex(course, currentItemId);
  const current = currentIdx >= 0 ? ordered[currentIdx] : null;
  const hasPrevious = currentIdx > 0;
  const hasNext = currentIdx >= 0 && currentIdx < ordered.length - 1;
  const isFirst = currentIdx === 0;
  const isLast = currentIdx === ordered.length - 1 && currentIdx >= 0;
  return {
    hasPrevious,
    hasNext,
    isFirst,
    isLast,
    previous: hasPrevious ? ordered[currentIdx - 1] : null,
    next: hasNext ? ordered[currentIdx + 1] : null,
    current,
  };
}
