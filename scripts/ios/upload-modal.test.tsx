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

  it('rejects an unsupported synthetic file before allowing upload', () => {
    const onAdd = vi.fn();
    const { container } = render(
      <AddDocumentModal isOpen={true} onClose={vi.fn()} onAdd={onAdd} />
    );
    fireEvent.click(screen.getByText('RG'));
    const picker = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(picker, {
      target: { files: [new File(['fake'], 'nao-permitido.txt', { type: 'text/plain' })] },
    });
    expect(screen.getByText('Formato não suportado. Use JPG, PNG ou PDF.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Salvar' })).toBeNull();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('blocks a synthetic PDF larger than 10 MB before upload', () => {
    const onAdd = vi.fn();
    const { container } = render(
      <AddDocumentModal isOpen={true} onClose={vi.fn()} onAdd={onAdd} />
    );
    fireEvent.click(screen.getByText('RG'));
    const picker = container.querySelector('input[type="file"]') as HTMLInputElement;
    const oversized = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'muito-grande.pdf', {
      type: 'application/pdf',
    });
    fireEvent.change(picker, { target: { files: [oversized] } });
    expect(screen.getByText('Arquivo muito grande. Máximo 10MB.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Salvar' })).toBeNull();
    expect(onAdd).not.toHaveBeenCalled();
  });
});
