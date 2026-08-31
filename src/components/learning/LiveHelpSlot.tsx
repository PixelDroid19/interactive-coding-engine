import React from 'react';
import { Headphones } from 'lucide-react';
import { UiButton } from '../ui/UiButton';

export type LiveHelpStatus = 'available' | 'waiting' | 'active';

export interface LiveHelpIntegration {
  status: LiveHelpStatus;
  statusLabel: string;
  description: string;
  primaryAction?: Readonly<{
    label: string;
    onAction: () => void | Promise<void>;
  }>;
  secondaryAction?: Readonly<{
    label: string;
    onAction: () => void | Promise<void>;
  }>;
}

interface LiveHelpSlotProps {
  integration?: LiveHelpIntegration;
}

export const LiveHelpSlot: React.FC<LiveHelpSlotProps> = ({ integration }) => {
  if (!integration) return null;

  return (
    <section className={`learning-center__card learning-center__live-help is-${integration.status}`} aria-labelledby="live-help-title">
      <div className="learning-center__card-heading">
        <span>AYUDA EN VIVO</span>
        <small>{integration.statusLabel}</small>
      </div>
      <Headphones aria-hidden="true" size={31} strokeWidth={1.5} />
      <h3 id="live-help-title">Ayuda en vivo</h3>
      <p>{integration.description}</p>
      {(integration.primaryAction || integration.secondaryAction) && (
        <div className="learning-center__live-help-actions">
          {integration.primaryAction && <UiButton variant="primary" onClick={() => void integration.primaryAction?.onAction()}>{integration.primaryAction.label}</UiButton>}
          {integration.secondaryAction && <UiButton variant="secondary" onClick={() => void integration.secondaryAction?.onAction()}>{integration.secondaryAction.label}</UiButton>}
        </div>
      )}
    </section>
  );
};
