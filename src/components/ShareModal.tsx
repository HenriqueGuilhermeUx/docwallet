import { useState, useEffect } from 'react';
import { X, Copy, Mail, MessageCircle, Check, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Document } from '../types/document';
import { getWhatsAppShareUrl, getEmailSubject, getEmailBody } from '../utils/helpers';
import { backendShareLink } from '../lib/backendDocuments';

interface ShareModalProps {
  document: Document;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ document, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const createSecureLink = async () => {
      try {
        const secureLink = backendShareLink(document.id);
        setShareUrl(secureLink);
      } catch (error) {
        console.error('Erro ao criar link:', error);
        setShareUrl(`${window.location.origin}/share/${document.id}`);
      } finally {
        setIsLoading(false);
      }
    };
    createSecureLink();
  }, [document.id]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Failed to copy');
    }
  };

  const handleWhatsApp = () => {
    window.open(getWhatsAppShareUrl(document.name, shareUrl), '_blank');
  };

  const handleEmail = () => {
    window.location.href = `mailto:?subject=${getEmailSubject(document.name)}&body=${getEmailBody(document.name, shareUrl)}`;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Compartilhar</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="text-slate-500" size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-col items-center">
            {isLoading ? (
              <div className="bg-slate-50 p-8 rounded-xl flex flex-col items-center">
                <Loader2 className="text-primary animate-spin mb-2" size={32} />
                <p className="text-slate-500 text-sm">Gerando link...</p>
              </div>
            ) : (
              <div className="bg-white p-4 rounded-xl shadow-card">
                <QRCodeSVG
                  value={shareUrl}
                  size={180}
                  level="M"
                  includeMargin={true}
                />
              </div>
            )}
            <p className="text-slate-500 text-sm mt-4 text-center">
              {isLoading ? (
                'Aguarde...'
              ) : (
                <>
                  Link de download autenticado pelo backend<br />
                  <span className="font-mono text-xs text-slate-400">{document.name}</span>
                </>
              )}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleCopyLink}
              disabled={isLoading}
              className={`flex items-center gap-3 w-full p-4 rounded-xl transition-colors ${
                isLoading
                  ? 'bg-slate-50 cursor-not-allowed opacity-50'
                  : 'bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                {copied ? <Check className="text-secondary" size={20} /> : <Copy className="text-slate-600" size={20} />}
              </div>
              <div className="text-left">
                <p className="font-medium text-slate-800">{copied ? 'Copiado!' : 'Copiar link'}</p>
                <p className="text-sm text-slate-500 truncate">{copied ? 'Link na área de transferência' : shareUrl || 'Gerando...'}</p>
              </div>
            </button>

            <button
              onClick={handleWhatsApp}
              disabled={isLoading}
              className={`flex items-center gap-3 w-full p-4 rounded-xl transition-colors ${
                isLoading
                  ? 'bg-green-50 cursor-not-allowed opacity-50'
                  : 'bg-green-50 hover:bg-green-100'
              }`}
            >
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <MessageCircle className="text-white" size={20} />
              </div>
              <div className="text-left">
                <p className="font-medium text-slate-800">WhatsApp</p>
                <p className="text-sm text-slate-500">Enviar via WhatsApp</p>
              </div>
            </button>

            <button
              onClick={handleEmail}
              disabled={isLoading}
              className={`flex items-center gap-3 w-full p-4 rounded-xl transition-colors ${
                isLoading
                  ? 'bg-blue-50 cursor-not-allowed opacity-50'
                  : 'bg-blue-50 hover:bg-blue-100'
              }`}
            >
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Mail className="text-white" size={20} />
              </div>
              <div className="text-left">
                <p className="font-medium text-slate-800">E-mail</p>
                <p className="text-sm text-slate-500">Enviar por e-mail</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
