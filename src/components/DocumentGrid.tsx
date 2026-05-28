import { Document } from '../types/document';
import { DocumentCard } from './DocumentCard';
import { FileText, Loader2 } from 'lucide-react';

interface DocumentGridProps {
  documents: Document[];
  onDocumentClick: (document: Document) => void;
  onShareDocument?: (document: Document) => void;
  onAuthenticateDocument?: (document: Document) => void;
  isLoading?: boolean;
}

export const DocumentGrid: React.FC<DocumentGridProps> = ({
  documents,
  onDocumentClick,
  onShareDocument,
  onAuthenticateDocument,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <Loader2 className="text-primary animate-spin mb-4" size={48} />
        <p className="text-slate-500">Carregando documentos...</p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
          <FileText className="text-slate-300" size={48} />
        </div>
        <h3 className="text-xl font-semibold text-slate-700 mb-2">
          Nenhum documento encontrado
        </h3>
        <p className="text-slate-500 text-center max-w-md">
          Adicione seus primeiros documentos para começar a organizar sua carteira digital.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {documents.map((doc) => (
          <DocumentCard
            key={doc.id}
            document={doc}
            onClick={() => onDocumentClick(doc)}
            onShare={onShareDocument}
            onAuthenticate={onAuthenticateDocument}
          />
        ))}
      </div>
    </div>
  );
};