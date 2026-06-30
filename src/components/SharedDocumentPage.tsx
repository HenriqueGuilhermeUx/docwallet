import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Download, FileText, Loader2, ShieldCheck } from 'lucide-react';
import { Document, getDocumentTypeInfo } from '../types/document';
import { getSharedDocument } from '../lib/documents';
import { formatDate } from '../utils/helpers';

interface SharedDocumentPageProps {
  shareId: string;
}

const normalizeSharedDocument = (payload: any): Document | null => {
  if (!payload) return null;

  const doc = Array.isArray(payload)
    ? payload[0]
    : payload.documents ?? payload;

  if (!doc) return null;

  return {
    id: doc.id ?? doc.document_id ?? '',
    name: doc.name ?? 'Documento compartilhado',
    type: doc.type ?? 'other',
    category: doc.category ?? 'other',
    fileData: doc.file_url ?? doc.fileData ?? '',
    fileType: (doc.file_type ?? doc.fileType ?? 'application/pdf') as any,
    createdAt: doc.created_at ?? doc.createdAt ?? new Date().toISOString(),
    filePath: doc.file_path ?? doc.filePath,
  };
};

export const SharedDocumentPage: React.FC<SharedDocumentPageProps> = ({ shareId }) => {
  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadSharedDocument = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const payload = await getSharedDocument(shareId);
        const normalized = normalizeSharedDocument(payload);

        if (!normalized) {
          throw new Error('Documento compartilhado não encontrado.');
        }

        setDocument(normalized);
      } catch (error: any) {
        console.error('Erro ao abrir documento compartilhado:', error);
        setErrorMessage(error?.message || 'Link inválido, expirado ou revogado.');
      } finally {
        setIsLoading(false);
      }
    };

    loadSharedDocument();
  }, [shareId]);

  const typeInfo = useMemo(() => {
    if (!document) return null;
    return getDocumentTypeInfo(document.type);
  }, [document]);

  const handleDownload = () => {
    if (!document?.fileData) return;

    const link = window.document.createElement('a');
    link.href = document.fileData;
    link.download = `${document.name}.${document.fileType.split('/')[1] || 'pdf'}`;
    link.rel = 'noopener noreferrer';
    link.click();
  };

  const isPdf = document?.fileType === 'application/pdf';

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="font-bold leading-tight">DocWallet</p>
              <p className="text-xs text-slate-400">Compartilhamento seguro</p>
            </div>
          </div>
          <button
            onClick={() => { window.location.href = '/'; }}
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-sm font-medium transition-colors"
          >
            Abrir meu DocWallet
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {isLoading && (
          <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
            <Loader2 className="animate-spin text-indigo-400 mb-4" size={42} />
            <h1 className="text-2xl font-bold">Abrindo documento seguro...</h1>
            <p className="text-slate-400 mt-2">Validando link temporário do DocWallet.</p>
          </div>
        )}

        {!isLoading && errorMessage && (
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="max-w-md w-full bg-white text-slate-900 rounded-2xl p-6 shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertCircle className="text-red-600" size={26} />
              </div>
              <h1 className="text-xl font-bold">Não foi possível abrir</h1>
              <p className="text-slate-600 mt-2">{errorMessage}</p>
              <button
                onClick={() => { window.location.href = '/'; }}
                className="mt-6 w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors"
              >
                Voltar para o DocWallet
              </button>
            </div>
          </div>
        )}

        {!isLoading && document && typeInfo && (
          <div className="space-y-6">
            <div className="bg-white text-slate-900 rounded-2xl p-5 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FileText size={28} />
                </div>
                <div>
                  <h1 className="text-xl font-bold">{document.name}</h1>
                  <p className="text-slate-500 text-sm">
                    {typeInfo.labelPt} • compartilhado em ambiente seguro • {formatDate(document.createdAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={handleDownload}
                className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Download size={18} />
                Baixar
              </button>
            </div>

            <div className="bg-slate-900 border border-white/10 rounded-2xl p-3 md:p-5 shadow-2xl min-h-[70vh] flex items-center justify-center">
              {document.fileData ? (
                isPdf ? (
                  <iframe
                    src={document.fileData}
                    title={document.name}
                    className="w-full h-[72vh] rounded-xl bg-white"
                  />
                ) : (
                  <img
                    src={document.fileData}
                    alt={document.name}
                    className="max-w-full max-h-[72vh] object-contain rounded-xl"
                  />
                )
              ) : (
                <div className="text-center text-slate-400">
                  <FileText className="mx-auto mb-3" size={42} />
                  <p>Arquivo indisponível.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
