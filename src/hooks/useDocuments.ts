import { useState, useEffect, useCallback } from 'react';
import { Document, Category, DocumentType, getDocumentTypeInfo } from '../types/document';
import { generateId } from '../utils/helpers';

const STORAGE_KEY = 'docwallet_documents';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<Toast | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setDocuments(JSON.parse(stored));
      } catch {
        setDocuments([]);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
    }
  }, [documents, isLoading]);

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = generateId();
    setToast({ id, message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const addDocument = useCallback(async (
    name: string,
    type: DocumentType,
    fileData: string,
    fileType: Document['fileType']
  ) => {
    const docTypeInfo = getDocumentTypeInfo(type);
    const newDoc: Document = {
      id: generateId(),
      name,
      type,
      category: docTypeInfo.category,
      fileData,
      fileType,
      createdAt: new Date().toISOString(),
    };
    setDocuments(prev => [newDoc, ...prev]);
    showToast('Documento adicionado com sucesso!', 'success');
    return newDoc;
  }, [showToast]);

  const deleteDocument = useCallback((id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    showToast('Documento excluído', 'info');
  }, [showToast]);

  const getDocument = useCallback((id: string) => {
    return documents.find(doc => doc.id === id);
  }, [documents]);

  const filteredDocuments = documents.filter(doc => {
    const matchesCategory = activeCategory === 'all' || doc.category === activeCategory;
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryCount = (category: Category | 'all'): number => {
    if (category === 'all') return documents.length;
    return documents.filter(doc => doc.category === category).length;
  };

  return {
    documents: filteredDocuments,
    allDocuments: documents,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    addDocument,
    deleteDocument,
    getDocument,
    getCategoryCount,
    toast,
    isLoading,
  };
};