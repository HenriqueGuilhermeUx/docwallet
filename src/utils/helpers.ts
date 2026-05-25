export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export const isValidFileType = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  return validTypes.includes(file.type);
};

export const isValidFileSize = (file: File, maxSizeMB: number = 10): boolean => {
  return file.size <= maxSizeMB * 1024 * 1024;
};

export const getShareUrl = (documentId: string): string => {
  return `https://docwallet.app/share/${documentId}`;
};

export const getWhatsAppShareUrl = (documentName: string, shareUrl: string): string => {
  const message = encodeURIComponent(
    `Olá! Compartilho meu documento "${documentName}" via DocWallet: ${shareUrl}`
  );
  return `https://wa.me/?text=${message}`;
};

export const getEmailSubject = (documentName: string): string => {
  return `Documento: ${documentName}`;
};

export const getEmailBody = (documentName: string, shareUrl: string): string => {
  return encodeURIComponent(
    `Olá!\n\nEstou compartilhando o documento "${documentName}" via DocWallet.\n\nAcesse aqui: ${shareUrl}\n\n---\nEnviado via DocWallet - Carteira Digital de Documentos`
  );
};