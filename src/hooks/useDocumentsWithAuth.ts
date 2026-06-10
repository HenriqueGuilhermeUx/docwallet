import { User } from '@supabase/supabase-js';
import { Document } from '../types/document';
import { supabase, signOut, onAuthStateChange } from '../lib/supabase';
import {
  uploadDocument as uploadDocToSupabase,
  fetchDocuments as fetchDocsFromSupabase,
  deleteDocument as deleteDocFromSupabase,
  generateShareLink,
} from '../lib/documents';
import { DocumentType, Category } from '../types/document';
import { useState, useEffect, useCallback } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

function getNexaStoredUser(): any | null {
  try {
    const stored = localStorage.getItem('docwallet_nexa_user');
    if (!stored) return null;

    const parsed = JSON.parse(stored);

    return {
      ...parsed,
      id: parsed.id,
      email: parsed.email,
      user_metadata: {
        name: parsed.fullName,
        nexaId: parsed.nexaId,
        username: parsed.username,
        walletAddress: parsed.walletAddress,
      },
      app_metadata: {
        provider: 'nexa',
      },
    };
  } catch {
    return null;
  }
}

export const useDocumentsWithAuth = () => {
  const [user, setUser] = useState<User | any | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<Toast | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const loadAuth = async () => {
      const nexaUser = getNexaStoredUser();

      if (nexaUser) {
        setUser(nexaUser);
        setIsAuthLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();

      setUser(session?.user ?? null);
      setIsAuthLoading(false);
    };

    loadAuth();

    const { data: { subscription } } = onAuthStateChange((supabaseUser) => {
  const nexaUser = getNexaStoredUser();

  if (nexaUser) {
    setUser(nexaUser);
    setIsAuthLoading(false);
    return;
  }

  if (supabaseUser) {
    setUser(supabaseUser);
  }

  setIsAuthLoading(false);
});
    return () => subscription.unsubscribe();
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
      const docs = await fetchDocsFromSupabase(user.id);
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
    }

    try {
      const newDoc = await uploadDocToSupabase(
        user.id,
        file,
        name,
        type,
        typeInfo.category,
      );

      setDocuments(prev => [newDoc, ...prev]);
      showToast('Documento adicionado com sucesso!', 'success');

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
      const filePath = doc.filePath || `${user.id}/${doc.id}`;

      await deleteDocFromSupabase(doc.id, filePath);

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
      const link = await generateShareLink(docId);
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
      localStorage.removeItem('docwallet_nexa_user');
      localStorage.removeItem('docwallet_nexa_token');

      await signOut();

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
