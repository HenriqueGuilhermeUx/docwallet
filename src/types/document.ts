export type DocumentType =
  | 'rg'
  | 'cnh'
  | 'cpf'
  | 'passport'
  | 'voter_id'
  | 'professional_license'
  | 'health_card'
  | 'vaccine_card'
  | 'contract'
  | 'other';

export type Category =
  | 'ids'
  | 'registrations'
  | 'professional'
  | 'health'
  | 'contracts'
  | 'other';

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  category: Category;
  fileData: string;
  fileType: string;
  createdAt: string;
  thumbnail?: string;
  filePath?: string;
  fileSize?: number;
  fileHash?: string;
  isNotarized?: boolean;
  certificateId?: string;
}

export interface DocumentTypeInfo {
  type: DocumentType;
  label: string;
  labelPt: string;
  icon: string;
  category: Category;
}

export const DOCUMENT_TYPES: DocumentTypeInfo[] = [
  { type: 'rg', label: 'ID Card', labelPt: 'RG', icon: 'id-card', category: 'ids' },
  { type: 'cnh', label: 'Driver License', labelPt: 'CNH', icon: 'car', category: 'ids' },
  { type: 'cpf', label: 'CPF', labelPt: 'CPF', icon: 'fingerprint', category: 'registrations' },
  { type: 'passport', label: 'Passport', labelPt: 'Passaporte', icon: 'plane', category: 'ids' },
  { type: 'voter_id', label: 'Voter ID', labelPt: 'Título de Eleitor', icon: 'check-square', category: 'registrations' },
  { type: 'professional_license', label: 'Professional License', labelPt: 'Carteira Profissional', icon: 'briefcase', category: 'professional' },
  { type: 'health_card', label: 'Health Card', labelPt: 'Carteira de Saúde', icon: 'heart', category: 'health' },
  { type: 'vaccine_card', label: 'Vaccine Card', labelPt: 'Carteira de Vacinação', icon: 'syringe', category: 'health' },
  { type: 'contract', label: 'Contract', labelPt: 'Contrato', icon: 'file-text', category: 'contracts' },
  { type: 'other', label: 'Other', labelPt: 'Outro', icon: 'file', category: 'other' },
];

export const CATEGORIES: { key: Category | 'all'; label: string; labelPt: string }[] = [
  { key: 'all', label: 'All', labelPt: 'Todos' },
  { key: 'ids', label: 'IDs', labelPt: 'Documentos de ID' },
  { key: 'registrations', label: 'Registrations', labelPt: 'Cadastros' },
  { key: 'professional', label: 'Professional', labelPt: 'Profissionais' },
  { key: 'health', label: 'Health', labelPt: 'Saúde' },
  { key: 'contracts', label: 'Contracts', labelPt: 'Contratos' },
  { key: 'other', label: 'Other', labelPt: 'Outros' },
];

export const getDocumentTypeInfo = (type: DocumentType): DocumentTypeInfo => {
  return DOCUMENT_TYPES.find(dt => dt.type === type) || DOCUMENT_TYPES[DOCUMENT_TYPES.length - 1];
};

export const getCategoryDocuments = (category: Category): DocumentType[] => {
  return DOCUMENT_TYPES.filter(dt => dt.category === category).map(dt => dt.type);
};
