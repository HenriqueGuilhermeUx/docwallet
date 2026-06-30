import { useState } from 'react';
import { X, Download, Share2, Trash2, ZoomIn, ZoomOut } from 'lucide-react';
import { Document, getDocumentTypeInfo } from '../types/document';
import { formatDate } from '../utils/helpers';
import { ShareModal } from './ShareModal';

interface DocumentViewerModalProps {
  document: Document;
  onClose: () => void;
  onDelete: (document: Document) => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({ document, onClose, onDelete }) => {
  const [showShare, setShowShare] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [zoom, setZoom] = useState(1);

  const typeInfo = getDocumentTypeInfo(document.type);
  const isPdf = document.fileType === 'application/pdf';

  const handleDownload = () => {
    if (!document.fileData) return;

    const link = window.document.createElement('a');
    link.href = document.fileData;
    link.download = `${document.name}.${document.fileType.split('/')[1] || 'pdf'}`;
    link.rel = 'noopener noreferrer';
    link.click();
  };

  const handleDelete = () => {
    onDelete(document);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center">
                <span className="text-white font-semibold">{typeInfo.labelPt.substring(0, 2)}</span>
              </div>
              <div>
                <h3 className="text-white font-semibold">{document.name}</h3>
                <p className="text-white/60 text-sm">{formatDate(document.createdAt)}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="text-white" size={24} />
            </button>
          </div>
        </div>

        <div
          className="relative w-full h-full flex items-center justify-center overflow-auto p-4 pt-20 pb-24"
          onClick={() => !isPdf && setZoom(zoom === 1 ? 1.5 : 1)}
        >
          <div
            style={{ transform: isPdf ? 'none' : `scale(${zoom})`, transition: 'transform 0.2s ease' }}
            className="max-w-full max-h-full"
          >
            {document.fileData ? (
              isPdf ? (
                <iframe
                  src={document.fileData}
                  title={document.name}
                  className="w-[92vw] h-[78vh] max-w-5xl rounded-lg shadow-2xl bg-white"
                />
              ) : (
                <img
                  src={document.fileData}
                  alt={document.name}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                />
              )
            ) : (
              <div className="w-64 h-80 bg-slate-800 rounded-xl flex items-center justify-center">
                <p className="text-slate-500">Sem arquivo</p>
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 z-10">
          {!isPdf && (
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <ZoomOut className="text-white" size={20} />
              </button>
              <span className="text-white/60 text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <ZoomIn className="text-white" size={20} />
              </button>
            </div>
          )}

          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full font-medium transition-colors"
            >
              <Download size={18} />
              <span>Baixar</span>
            </button>
            <button
              onClick={() => setShowShare(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-full font-medium transition-colors"
            >
              <Share2 size={18} />
              <span>Compartilhar</span>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-full transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>

      {showShare && (
        <ShareModal
          document={document}
          onClose={() => setShowShare(false)}
        />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Excluir documento?</h3>
            <p className="text-slate-500 mb-6">
              Esta ação não pode ser desfeita. O documento "{document.name}" será removido permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 border border-slate-300 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
