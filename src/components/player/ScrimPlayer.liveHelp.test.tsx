// @vitest-environment happy-dom
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FUNDAMENTOS_SCRIMS } from '../../curriculum/fundamentos/course';
import { loadLastBranchForLesson } from '../../engine/persistence';
import { clearTutorWorkspace, getTutorWorkspace } from '../../learning/tutor/tutorContext';

const bridge = vi.hoisted(() => ({ props: null as any }));
const engine = vi.hoisted(() => ({ instances: [] as any[] }));

vi.mock('../../engine/playbackEngine', () => {
  class FakePlaybackEngine {
    readonly pause = vi.fn(() => this.callbacks.onPlaybackStateChange('paused'));
    readonly play = vi.fn(() => this.callbacks.onPlaybackStateChange('playing'));
    private status = 'paused';

    constructor(readonly callbacks: any) {
      engine.instances.push(this);
    }

    setVolume() {}
    setMuted() {}
    loadLesson() {}
    destroy() {}
    seek() {}
    markChallengeTriggered() {}
    setPlaybackRate() {}
    getCurrentTime() { return 0; }
    getStatus() { return this.status; }
  }
  return { PlaybackEngine: FakePlaybackEngine };
});

vi.mock('../../live-help/LiveHelpWorkspaceBridge', () => ({
  LiveHelpWorkspaceBridge: (props: any) => {
    bridge.props = props;
    return null;
  },
}));

import { ScrimPlayer } from './ScrimPlayer';

describe('ScrimPlayer con una propuesta de ayuda en vivo', () => {
  const lesson = FUNDAMENTOS_SCRIMS['fundamentos-01'];

  beforeEach(() => {
    localStorage.clear();
    bridge.props = null;
    engine.instances.length = 0;
    clearTutorWorkspace('global');
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    bridge.props = null;
    engine.instances.length = 0;
    clearTutorWorkspace('global');
  });

  it('convierte el parche aceptado en una rama persistente que una cinta posterior no puede sobrescribir y puede recuperarse', async () => {
    const path = lesson.initialWorkspace.activeFilePath;
    const patchedContent = `${lesson.initialWorkspace.files[path]?.content}\n// cambio aceptado de ayuda`;
    const view = render(<ScrimPlayer
      lessonData={lesson}
      onBack={() => undefined}
      liveHelpContext={{ courseSlug: 'fundamentos', lessonKey: lesson.id, surface: 'lesson' }}
    />);

    await waitFor(() => expect(bridge.props).not.toBeNull());
    const patchedWorkspace = {
      ...bridge.props.workspace,
      files: {
        ...bridge.props.workspace.files,
        [path]: { ...bridge.props.workspace.files[path], content: patchedContent },
      },
    };
    await act(async () => {
      bridge.props.pause();
      bridge.props.onProposalApplied(patchedWorkspace);
    });

    await waitFor(() => expect(screen.getByText('Editando')).toBeTruthy());
    expect(engine.instances[0]?.pause).toHaveBeenCalledTimes(1);
    expect(loadLastBranchForLesson(lesson.id)?.workspace.files[path]?.content).toBe(patchedContent);

    act(() => engine.instances[0]?.callbacks.onWorkspaceChange({
      ...patchedWorkspace,
      files: {
        ...patchedWorkspace.files,
        [path]: { ...patchedWorkspace.files[path], content: '// escritura posterior de la cinta' },
      },
    }));
    await waitFor(() => expect(bridge.props.workspace.files[path]?.content).toBe(patchedContent));

    view.unmount();
    render(<ScrimPlayer
      lessonData={lesson}
      onBack={() => undefined}
      liveHelpContext={{ courseSlug: 'fundamentos', lessonKey: lesson.id, surface: 'lesson' }}
    />);
    fireEvent.click(await screen.findByRole('button', { name: 'Continuar donde lo dejé' }));

    await waitFor(() => expect(getTutorWorkspace()?.snapshot.files[path]).toBe(patchedContent));
  });
});
