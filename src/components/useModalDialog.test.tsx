// @vitest-environment happy-dom
import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useModalDialog } from './useModalDialog';

function DialogHarness({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useModalDialog<HTMLDivElement>({
    open,
    onClose: () => {
      setOpen(false);
      onClose();
    },
  });

  return <>
    <button type="button" onClick={() => setOpen(true)}>Abrir</button>
    {open && <div ref={dialogRef} role="dialog" aria-modal="true">
      <button type="button">Antes</button>
      <button type="button" data-dialog-initial-focus>Primero</button>
      <button type="button">Último</button>
    </div>}
  </>;
}

afterEach(cleanup);

describe('useModalDialog', () => {
  it('mueve el foco, lo encierra, cierra con Escape y lo devuelve al activador', async () => {
    const onClose = vi.fn();
    render(<DialogHarness onClose={onClose} />);
    const trigger = screen.getByRole('button', { name: 'Abrir' });
    trigger.focus();
    fireEvent.click(trigger);

    const first = screen.getByRole('button', { name: 'Primero' });
    const before = screen.getByRole('button', { name: 'Antes' });
    const last = screen.getByRole('button', { name: 'Último' });
    await waitFor(() => expect(document.activeElement).toBe(first));

    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(before);
    before.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });
});
