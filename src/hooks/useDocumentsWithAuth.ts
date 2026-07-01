import { Document, DocumentType, Category } from '../types/document';
import { useState, useEffect, useCallback } from 'react';
import { BackendUser, readProfile, readSession, clearSession } from '../lib/backendSession';
import {
  listBackendDocuments,
  uploadBackendDocument,
  deleteBackendDocument,
  backendShareLink,
} from '../lib/backendDocuments';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const useDocumentsWithAuth = () => {
  const [user, setUser] = useState<BackendUser | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<Toast | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const savedUser = readProfile();
    const savedSession = readSession();

    if (savedUser && savedSession) {
      setUser(savedUser);
    } else {
      setUser(null);
    }

    setIsAuthLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      loadDocuments();
    } else {
      setDocuments([]);
      setIsLoading(false);
    }
  }, [user]);

  const loadDocuments = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const docs = await listBackendDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
      showToast('Erro ao carregar documentos', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = generateId();
    setToast({ id, message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const addDocument = useCallback(async (
    name: string,
    type: DocumentType,
    file: File
  ) => {
    if (!user) {
      showToast('Você precisa estar logado para adicionar documentos', 'error');
      return null;
    }

    const typeInfo = { type, category: 'other' as Category };

    if (type === 'rg' || type === 'cnh' || type === 'passport') {
      typeInfo.category = 'ids';
    } else if (type === 'cpf' || type === 'voter_id') {
      typeInfo.category = 'registrations';
    } else if (type === 'professional_license') {
      typeInfo.category = 'professional';
    } else if (type === 'health_card' || type === 'vaccine_card') {
      typeInfo.category = 'health';
    } else if (type === 'contract') {
      typeInfo.category = 'contracts';
    }

    try {
      const newDoc = await uploadBackendDocument(
        file,
        name,
        type,
        typeInfo.category,
      );

      setDocuments(prev => [newDoc, ...prev]);
      showToast('Documento salvo no backend DocWallet!', 'success');

      return newDoc;
    } catch (error) {
      console.error('Error adding document:', error);
      showToast('Erro ao adicionar documento', 'error');

      return null;
    }
  }, [user, showToast]);

  const deleteDocument = useCallback(async (doc: Document) => {
    if (!user) return;

    try {
      await deleteBackendDocument(doc.id);

      setDocuments(prev => prev.filter(d => d.id !== doc.id));
      showToast('Documento excluído', 'info');
    } catch (error) {
      console.error('Error deleting document:', error);
      showToast('Erro ao excluir documento', 'error');
    }
  }, [user, showToast]);

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

  const createShareLink = async (docId: string): Promise<string> => {
    try {
      const link = backendShareLink(docId);
      showToast('Link de compartilhamento criado!', 'success');

      return link;
    } catch (error) {
      console.error('Error creating share link:', error);
      showToast('Erro ao criar link', 'error');

      return '';
    }
  };

  const handleLogout = async () => {
    try {
      clearSession();
      setUser(null);
      setDocuments([]);
      showToast('Você foi desconectado', 'info');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return {
    user,
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
    createShareLink,
    handleLogout,
    toast,
    isLoading,
    isAuthLoading,
    reloadDocuments: loadDocuments,
  };
};
