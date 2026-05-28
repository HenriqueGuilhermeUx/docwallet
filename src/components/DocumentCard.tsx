import { Document } from '../types/document';
import { formatDate, truncateText } from '../utils/helpers';
import { DocumentTypeIcon } from './Header';
import { getDocumentTypeInfo } from '../types/document';
import { Calendar, Eye, Share2, Shield } from 'lucide-react';

interface DocumentCardProps {
  document: Document;
  onClick: () => void;
  onShare?: (document: Document) => void;
  onAuthenticate?: (document: Document) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ document, onClick, onShare, onAuthenticate }) => {
  const typeInfo = getDocumentTypeInfo(document.type);

  return (
    <div className="group bg-white rounded-xl shadow-card border border-slate-100 overflow-hidden transition-all duration-200 hover:shadow-card-hover hover:scale-[1.02] hover:border-primary/30">
      <button onClick={onClick} className="text-left w-full">
        <div className="aspect-[3/4] bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden">
          {document.fileData ? (
            <img
              src={document.fileData}
              alt={document.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <DocumentTypeIcon
                iconName={typeInfo.icon}
                className="text-slate-300"
                size={48}
              />
            </div>
          )}

          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-sm">
            <DocumentTypeIcon
              iconName={typeInfo.icon}
              className="text-primary"
              size={20}
            />
          </div>

          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg transform scale-75 group-hover:scale-100">
              <Eye className="text-primary" size={24} />
            </div>
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-slate-800 mb-1 truncate">
            {truncateText(document.name, 28)}
          </h3>
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <DocumentTypeIcon iconName={typeInfo.icon} className="text-slate-400" size={14} />
            <span>{typeInfo.labelPt}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400 text-xs mt-2">
            <Calendar size={12} />
            <span>{formatDate(document.createdAt)}</span>
          </div>
        </div>
      </button>

      {/* Quick Actions Bar */}
      <div className="px-4 pb-4 flex gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); onShare?.(document); }}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
        >
          <Share2 size={14} />
          <span>Compartilhar</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onAuthenticate?.(document); }}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Shield size={14} />
          <span>Autenticar</span>
        </button>
      </div>
    </div>
  );
};