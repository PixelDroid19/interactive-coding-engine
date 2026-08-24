// @vitest-environment happy-dom
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { publishInstructorPointer } from '../../engine/instructorPointer';
import { InstructorCursor } from './InstructorCursor';

function rect(left: number, top: number, width: number, height: number): DOMRect {
  return {
    x: left,
    y: top,
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
    toJSON: () => ({}),
  } as DOMRect;
}

describe('InstructorCursor global route', () => {
  afterEach(() => {
    publishInstructorPointer(undefined);
    cleanup();
  });

  it('draws one cursor halfway between two real interface surfaces', () => {
    const { container } = render(
      <>
        <div className="files-surface"><InstructorCursor containerType="files" /></div>
        <div className="editor-surface"><InstructorCursor containerType="editor" /></div>
        <InstructorCursor containerType="global" />
      </>,
    );

    const files = container.querySelector('[data-instructor-area="files"]') as HTMLElement;
    const editor = container.querySelector('[data-instructor-area="editor"]') as HTMLElement;
    const root = container.querySelector('[data-instructor-pointer-root]') as HTMLElement;
    const layer = container.querySelector('[data-instructor-pointer-layer]') as HTMLElement;
    files.getBoundingClientRect = () => rect(100, 100, 200, 100);
    editor.getBoundingClientRect = () => rect(500, 100, 400, 300);
    root.getBoundingClientRect = () => rect(0, 0, 1000, 500);

    publishInstructorPointer({
      x: 50,
      y: 50,
      targetArea: 'files',
      transition: {
        from: { x: 50, y: 50, targetArea: 'files' },
        to: { x: 50, y: 50, targetArea: 'editor' },
        progress: 0.5,
      },
    } as never);

    expect(container.querySelectorAll('[data-instructor-pointer-layer]')).toHaveLength(1);
    expect(layer.style.opacity).toBe('1');
    expect(layer.style.transform).toBe('translate3d(45%, 40%, 0)');
  });
});
