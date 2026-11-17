// Isolated UI regression test: no backend, real document data, or upload calls.
// Runs on CI with disposable test-only packages installed without changing lockfiles.
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AddDocumentModal } from '../../src/components/AddDocumentModal';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('DocWallet Docs failed upload retry', () => {
  it('retains a synthetic file after rejection and closes only after successful retry', async () => {
    const onClose = vi.fn();
    const onAdd = vi.fn()
      .mockRejectedValueOnce(new Error('synthetic backend 503: no real network'))
      .mockResolvedValueOnce(undefined);

    const { container } = render(
      <AddDocumentModal isOpen={true} onClose={onClose} onAdd={onAdd} />
    );

    fireEvent.click(screen.getByText('RG'));
    const picker = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(picker).not.toBeNull();
    const file = new File(['synthetic-only'], 'qa-ficticio.pdf', { type: 'application/pdf' });
    fireEvent.change(picker, { target: { files: [file] } });
    expect(screen.getByText('qa-ficticio.pdf')).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText('Ex: RG - João Silva'), {
      target: { value: 'Documento de teste fictício' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1));
    await screen.findByText(/Não foi possível salvar o documento/);
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText('qa-ficticio.pdf')).toBeTruthy();
    expect((screen.getByPlaceholderText('Ex: RG - João Silva') as HTMLInputElement).value)
      .toBe('Documento de teste fictício');

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(onAdd).toHaveBeenNthCalledWith(1, 'Documento de teste fictício', 'rg', file);
    expect(onAdd).toHaveBeenNthCalledWith(2, 'Documento de teste fictício', 'rg', file);
  });
});
