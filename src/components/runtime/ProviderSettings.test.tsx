// @vitest-environment happy-dom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProviderSessionStore } from '../../engine/ai/browserApiProvider';
import { ProviderSettings } from './ProviderSettings';

describe('ProviderSettings', () => {
  afterEach(cleanup);

  it('explica el riesgo y conserva la clave solo en el almacén de sesión', () => {
    const store = new ProviderSessionStore();
    const onConfigured = vi.fn();
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    render(<ProviderSettings scope="curso-ai" store={store} onConfigured={onConfigured} />);

    expect(screen.getByText(/solo vive en la memoria de esta pestaña/i)).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Proveedor'), { target: { value: 'gemini' } });
    fireEvent.change(screen.getByLabelText('Modelo'), { target: { value: 'gemini-2.5-flash' } });
    fireEvent.change(screen.getByLabelText('Clave de API'), { target: { value: 'temporal-123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Usar durante esta sesión' }));

    expect(store.get('curso-ai')).toMatchObject({ kind: 'gemini', apiKey: 'temporal-123' });
    expect(onConfigured).toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    expect((screen.getByLabelText('Clave de API') as HTMLInputElement).type).toBe('password');
  });
});
