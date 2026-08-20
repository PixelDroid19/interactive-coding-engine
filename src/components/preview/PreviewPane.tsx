import React, { forwardRef } from 'react';
import { WorkspaceSnapshot } from '../../types/scrim';
import { FloatingBrowser, FloatingBrowserRef } from './FloatingBrowser';

export type PreviewPaneRef = FloatingBrowserRef;

interface PreviewPaneProps {
  workspace: WorkspaceSnapshot;
  onRunClick?: () => void;
  autoReload?: boolean;
  instructorPointer?: { x: number; y: number; clicked?: boolean; targetArea?: any };
  isFloating?: boolean;
  onToggleFloating?: () => void;
}

export const PreviewPane = forwardRef<FloatingBrowserRef, PreviewPaneProps>(({
  workspace,
  onRunClick,
  autoReload = true,
  instructorPointer,
  isFloating = false,
  onToggleFloating,
}, ref) => {
  return (
    <FloatingBrowser
      ref={ref}
      workspace={workspace}
      onRunClick={onRunClick}
      autoReload={autoReload}
      instructorPointer={
        instructorPointer
          ? {
              ...instructorPointer,
              targetArea: instructorPointer.targetArea || 'preview',
            }
          : undefined
      }
      isFloating={isFloating}
      onToggleFloating={onToggleFloating || (() => {})}
    />
  );
});

