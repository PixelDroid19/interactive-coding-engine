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
}

export const PreviewPane = forwardRef<FloatingBrowserRef, PreviewPaneProps>(({
  workspace,
  onRunClick,
  autoReload = true,
  isFloating = false,
  onToggleFloating,
}, ref) => {
  return (
    <FloatingBrowser
      ref={ref}
      workspace={workspace}
      onRunClick={onRunClick}
      autoReload={autoReload}
      isFloating={isFloating}
      onToggleFloating={onToggleFloating || (() => {})}
    />
  );
});

