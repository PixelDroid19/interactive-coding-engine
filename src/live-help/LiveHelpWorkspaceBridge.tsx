import React, { useEffect, useRef } from 'react';
import { Headphones } from 'lucide-react';
import type { WorkspaceSnapshot } from '../types/scrim';
import { liveHelpContextKey, serializeClientFrame, type LiveHelpContext, type LiveHelpProposalEvent, type LiveHelpSnapshotPayload } from './protocol';
import type { LiveHelpWorkspaceAdapter } from './LiveHelpProvider';
import { useOptionalLiveHelp } from './LiveHelpProvider';
import { applyPatchProposal, liveHelpWorkspaceRevision, type PatchProposalOutcome } from './workspace';

export interface LiveHelpWorkspaceBridgeProps {
  context: LiveHelpContext;
  workspace: WorkspaceSnapshot;
  onWorkspaceChange(next: WorkspaceSnapshot): void;
  onProposalApplied?(next: WorkspaceSnapshot): void;
  pause?(): void;
  proposalGuard?(): string | null;
  validateProposal?(next: WorkspaceSnapshot): string | null;
}

function snapshotFromWorkspace(workspace: WorkspaceSnapshot): LiveHelpSnapshotPayload {
  return {
    revision: liveHelpWorkspaceRevision(workspace),
    activeFile: workspace.activeFilePath,
    files: Object.values(workspace.files)
      .sort((left, right) => left.path.localeCompare(right.path))
      .map((file) => ({ path: file.path, content: file.content })),
  };
}

export function LiveHelpWorkspaceBridge({ context, workspace, onWorkspaceChange, onProposalApplied, pause, proposalGuard, validateProposal }: LiveHelpWorkspaceBridgeProps) {
  const liveHelp = useOptionalLiveHelp();
  const contextKey = liveHelpContextKey(context);
  const workspaceRef = useRef(workspace);
  const contextRef = useRef(context);
  const changeRef = useRef(onWorkspaceChange);
  const proposalChangeRef = useRef(onProposalApplied);
  const pauseRef = useRef(pause);
  const proposalGuardRef = useRef(proposalGuard);
  const proposalValidatorRef = useRef(validateProposal);
  const adapterRef = useRef<LiveHelpWorkspaceAdapter | null>(null);

  workspaceRef.current = workspace;
  contextRef.current = context;
  changeRef.current = onWorkspaceChange;
  proposalChangeRef.current = onProposalApplied;
  pauseRef.current = pause;
  proposalGuardRef.current = proposalGuard;
  proposalValidatorRef.current = validateProposal;

  if (!adapterRef.current) {
    adapterRef.current = {
      getContext: () => contextRef.current,
      captureSnapshot: () => snapshotFromWorkspace(workspaceRef.current),
      applyProposal: (event: LiveHelpProposalEvent): PatchProposalOutcome => {
        const blockedMessage = proposalGuardRef.current?.();
        if (blockedMessage) return { outcome: 'blocked', message: blockedMessage };
        const previousWorkspace = workspaceRef.current;
        const currentRevision = liveHelpWorkspaceRevision(workspaceRef.current);
        try {
          return applyPatchProposal({
            workspace: workspaceRef.current,
            revision: currentRevision,
            patch: event.payload.patch,
            pause: pauseRef.current,
            validate: (next) => {
              const runtimeMessage = proposalValidatorRef.current?.(next);
              if (runtimeMessage) return runtimeMessage;
              try {
                serializeClientFrame({ type: 'snapshot', ...snapshotFromWorkspace(next) });
                return null;
              } catch {
                return 'La propuesta dejaría un proyecto demasiado grande para compartir de forma segura.';
              }
            },
            commit: (next) => {
              (proposalChangeRef.current ?? changeRef.current)(next);
              workspaceRef.current = next;
            },
          });
        } catch {
          workspaceRef.current = previousWorkspace;
          return { outcome: 'blocked', message: 'No pudimos aplicar la propuesta al editor. El código se conserva sin cambios.' };
        }
      },
    };
  }

  const registerWorkspace = liveHelp?.registerWorkspace;
  useEffect(() => registerWorkspace ? registerWorkspace(adapterRef.current!) : undefined, [contextKey, registerWorkspace]);
  if (!liveHelp?.canUseLiveHelp) return null;

  const status = liveHelp.session?.status === 'active' ? 'Sesión activa' : liveHelp.session?.status === 'accepted' ? 'Conectando' : liveHelp.session?.status === 'claimed' ? 'Consentimiento' : liveHelp.session?.status === 'requested' ? 'Esperando' : 'Ayuda en vivo';
  return <button type="button" className="live-help-launcher" aria-label="Abrir ayuda en vivo" onClick={liveHelp.openPanel}><Headphones size={16} aria-hidden="true" /><span>{status}</span></button>;
}
