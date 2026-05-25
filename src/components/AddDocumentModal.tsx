import { useState, useRef } from 'react';
import { X, Upload, Camera, CreditCard, Car, Fingerprint, Plane, CheckSquare, Briefcase, Heart, Syringe, FileText, File, Loader2 } from 'lucide-react';
import { DocumentType, DOCUMENT_TYPES } from '../types/document';
import { isValidFileType, isValidFileSize } from '../utils/helpers';

interface AddDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, type: DocumentType, file: File) => void;
}

const iconComponents: Record<string, React.FC<{ className?: string; size?: number }>> = {
  'id-card': CreditCard,
  'car': Car,
  'fingerprint': Fingerprint,
  'plane': Plane,
  'check-square': CheckSquare,
  'briefcase': Briefcase,
  'heart': Heart,
  'syringe': Syringe,
  'file-text': FileText,
  'file': File,
};

export const AddDocumentModal: React.FC<AddDocumentModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setStep(1);
    setSelectedType(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setDocumentName('');
    setError(null);
    setIsUploading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileSelect = (file: File) => {
    setError(null);

    if (!isValidFileType(file)) {
      setError('Formato não suportado. Use JPG, PNG ou PDF.');
      return;
    }

    if (!isValidFileSize(file)) {
      setError('Arquivo muito grande. Máximo 10MB.');
      return;
    }

    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file));
    }
    setStep(3);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleSubmit = async () => {
    if (!selectedType || !selectedFile || !documentName.trim()) return;

    setIsUploading(true);
    try {
      await onAdd(documentName.trim(), selectedType, selectedFile);
      handleClose();
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden animate-modal-enter">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">
            {step === 1 ? 'Selecione o tipo' : step === 2 ? 'Adicione a imagem' : 'Nome do documento'}
          </h2>
          <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="text-slate-500" size={20} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {step === 1 && (
            <div className="grid grid-cols-3 gap-3">
              {DOCUMENT_TYPES.map((docType) => {
                const Icon = iconComponents[docType.icon] || File;
                const isSelected = selectedType === docType.type;

                return (
                  <button
                    key={docType.type}
                    onClick={() => {
                      setSelectedType(docType.type);
                      setStep(2);
                    }}
                    className={`
                      flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200
                      ${isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-slate-200 hover:border-primary/50 hover:bg-slate-50'
                      }
                    `}
                  >
                    <div className={`p-3 rounded-xl ${isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Icon size={24} />
                    </div>
                    <span className="text-sm font-medium text-slate-700 text-center">{docType.labelPt}</span>
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
                  ${isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-300 hover:border-primary/50 hover:bg-slate-50'
                  }
                `}
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                    <Upload className="text-slate-500" size={32} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-700 mb-1">Arraste ou clique para enviar</p>
                    <p className="text-sm text-slate-500">JPG, PNG ou PDF (máx. 10MB)</p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={() => setStep(1)}
                className="w-full text-slate-500 py-2 hover:text-slate-700 transition-colors"
              >
                Voltar
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              {previewUrl && (
                <div className="aspect-[3/4] bg-slate-100 rounded-xl overflow-hidden">
                  <img src={previewUrl} alt="Document preview" className="w-full h-full object-contain" />
                </div>
              )}
              {selectedFile && !previewUrl && (
                <div className="aspect-[3/4] bg-slate-100 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="text-slate-400 mx-auto mb-2" size={48} />
                    <p className="text-slate-500">{selectedFile.name}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nome do documento
                </label>
                <input
                  type="text"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="Ex: RG - João Silva"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  disabled={isUploading}
                  className="flex-1 py-3 border border-slate-300 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Voltar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!documentName.trim() || isUploading}
                  className="flex-1 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isUploading && <Loader2 className="animate-spin" size={18} />}
                  {isUploading ? 'Enviando...' : 'Salvar'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-center gap-2 p-4 border-t border-slate-200">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-2 h-2 rounded-full transition-colors ${
                s === step ? 'bg-primary' : 'bg-slate-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};