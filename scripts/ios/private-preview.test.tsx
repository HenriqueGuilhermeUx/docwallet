// UI-only preview lifecycle test: never contacts production or a live backend.
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DocumentViewerModal } from '../../src/components/DocumentViewerModal';
import type { Document } from '../../src/types/document';
import { SESSION_CHANGE_EVENT } from '../../src/lib/backendSession';
import { fetchPrivateDocumentBlob } from '../../src/lib/secureDocumentDownloads';

vi.mock('../../src/lib/secureDocumentDownloads', () => ({
  fetchPrivateDocumentBlob: vi.fn(async () => new Blob(['synthetic private image'], { type: 'image/png' })),
}));
vi.mock('../../src/components/DocumentIntelligencePanel', () => ({
  DocumentIntelligencePanel: () => null,
}));

const fakeDocument: Document = {
  id: 'synthetic-doc-id',
  name: 'Documento sintético',
  type: 'rg',
  category: 'ids',
  fileData: '',
  fileType: 'image/png',
  createdAt: '2026-01-01T00:00:00Z',
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('private preview lifecycle without session in URL', () => {
  it('uses a temporary object URL and revokes it when modal unmounts', async () => {
    const originalCreate = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
    const originalRevoke = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');
    const create = vi.fn(() => 'blob:synthetic-private-preview');
    const revoke = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: create });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revoke });
    try {
      const { unmount } = render(
        <DocumentViewerModal document={fakeDocument} onClose={vi.fn()} onDelete={vi.fn()} />,
      );
      await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
      const image = screen.getByAltText('Documento sintético') as HTMLImageElement;
      expect(image.getAttribute('src')).toBe('blob:synthetic-private-preview');
      expect(image.getAttribute('src')).not.toContain('synthetic-session-secret');
      expect(fetchPrivateDocumentBlob).toHaveBeenCalled();
      unmount();
      expect(revoke).toHaveBeenCalledWith('blob:synthetic-private-preview');
    } finally {
      if (originalCreate) Object.defineProperty(URL, 'createObjectURL', originalCreate);
      else delete (URL as any).createObjectURL;
      if (originalRevoke) Object.defineProperty(URL, 'revokeObjectURL', originalRevoke);
      else delete (URL as any).revokeObjectURL;
    }
  });

  it('requests closure when authentication session is cleared', () => {
    const onClose = vi.fn();
    render(<DocumentViewerModal document={fakeDocument} onClose={onClose} onDelete={vi.fn()} />);
    window.dispatchEvent(new CustomEvent(SESSION_CHANGE_EVENT, { detail: null }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
