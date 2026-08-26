import React, { forwardRef } from 'react';
import { WorkspaceSnapshot } from '../../types/scrim';
import { FloatingBrowser, FloatingBrowserRef } from './FloatingBrowser';

export type PreviewPaneRef = FloatingBrowserRef;

interface PreviewPaneProps {
  workspace: WorkspaceSnapshot;
  onRunClick?: () => void;
  autoReload?: boolean;
  isFloating?: boolean;
  onToggleFloating?: () => void;
  previewRuntime?: 'standard' | 'cells';
}

export const PreviewPane = forwardRef<FloatingBrowserRef, PreviewPaneProps>(({
  workspace,
  onRunClick,
  autoReload = true,
  isFloating = false,
  onToggleFloating,
  previewRuntime,
}, ref) => {
  return (
    <FloatingBrowser
      ref={ref}
      workspace={workspace}
      onRunClick={onRunClick}
      autoReload={autoReload}
      isFloating={isFloating}
      onToggleFloating={onToggleFloating || (() => {})}
      previewRuntime={previewRuntime}
    />
  );
});
