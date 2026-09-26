export type FileDeliveryResult = 'shared' | 'downloaded';

export const deliverFileToUser = async (
  blob: Blob,
  filename: string,
  title = 'Arquivo DocWallet',
): Promise<FileDeliveryResult> => {
  const safeName = filename || 'docwallet-arquivo';
  const file = new File([blob], safeName, { type: blob.type || 'application/octet-stream' });
  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
    share?: (data: ShareData) => Promise<void>;
  };

  if (typeof nav.share === 'function') {
    const shareData: ShareData = {
      title,
      files: [file],
    };
    const canShare = typeof nav.canShare !== 'function' || nav.canShare(shareData);
    if (canShare) {
      await nav.share(shareData);
      return 'shared';
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = safeName;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  window.setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 1500);
  return 'downloaded';
};
