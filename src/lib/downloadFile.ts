import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export type FileDeliveryResult = 'saved' | 'shared' | 'downloaded';

const sanitizeFilename = (value: string) => {
  const cleaned = String(value || 'docwallet-arquivo')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || 'docwallet-arquivo';
};

const blobToBase64 = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(reader.error || new Error('Não foi possível preparar o arquivo.'));
  reader.onload = () => {
    const result = String(reader.result || '');
    const comma = result.indexOf(',');
    resolve(comma >= 0 ? result.slice(comma + 1) : result);
  };
  reader.readAsDataURL(blob);
});

export const deliverFileToUser = async (
  blob: Blob,
  filename: string,
  title = 'Arquivo DocWallet',
): Promise<FileDeliveryResult> => {
  const safeName = sanitizeFilename(filename);

  if (Capacitor.isNativePlatform()) {
    const base64 = await blobToBase64(blob);
    let persisted = false;

    try {
      await Filesystem.writeFile({
        path: `DocWallet/${safeName}`,
        data: base64,
        directory: Directory.Documents,
        recursive: true,
      });
      persisted = true;
    } catch (error) {
      console.warn('DocWallet could not persist file in Documents; using native share fallback.', error);
    }

    const cacheResult = await Filesystem.writeFile({
      path: safeName,
      data: base64,
      directory: Directory.Cache,
      recursive: true,
    });

    try {
      await Share.share({
        title,
        text: persisted ? 'O arquivo também foi salvo em Documentos/DocWallet.' : undefined,
        files: [cacheResult.uri],
        dialogTitle: 'Salvar ou compartilhar',
      });
    } catch (error: any) {
      if (!persisted) throw error;
      console.warn('DocWallet native share sheet was dismissed or unavailable.', error);
    }

    return persisted ? 'saved' : 'shared';
  }

  const file = new File([blob], safeName, { type: blob.type || 'application/octet-stream' });
  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
    share?: (data: ShareData) => Promise<void>;
  };

  if (typeof nav.share === 'function') {
    const shareData: ShareData = { title, files: [file] };
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
