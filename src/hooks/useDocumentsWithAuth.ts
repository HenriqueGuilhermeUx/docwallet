import { Document, DocumentType, Category } from '../types/document';
import { useState, useEffect, useCallback } from 'react';
import { BackendUser, clearSession, readProfile, SESSION_CHANGE_EVENT } from '../lib/backendSession';
import { linkWithNexaToken, loginWithNexaToken, validateBackendSession } from '../lib/backendLogin';
import {
  listBackendDocuments,
  uploadBackendDocument,
  deleteBackendDocument,
  backendShareLink,
} from '../lib/backendDocuments';
import { analyzeDocument } from '../lib/intelligence';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const PENDING_NEXA_LINK_KEY = 'docwallet_pending_nexa_link';

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const useDocumentsWithAuth = () => {
  const cachedProfile = readProfile();
  const [user, setUser] = useState<BackendUser | null>(cachedProfile);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<Toast | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // When we already have a cached profile, keep the shell visible and validate
  // the token in the background. This avoids the "logged out" flash on every
  // internal page navigation while still clearing the session on a real 401.
  const [isAuthLoading, setIsAuthLoading] = useState(!cachedProfile);
  const [nexaLinkRequired, setNexaLinkRequired] = useState(false);

  useEffect(() => {
    let mounted = true;
    let linkingPendingNexa = false;

    const readPendingNexaToken = () => {
      try {
        return String(window.sessionStorage.getItem(PENDING_NEXA_LINK_KEY) || '').trim();
      } catch {
        return '';
      }
    };

    const savePendingNexaToken = (token: string) => {
      try {
        window.sessionStorage.setItem(PENDING_NEXA_LINK_KEY, token);
      } catch {
        // Session storage is a convenience for the one-time linking flow only.
      }
    };

    const clearPendingNexaToken = () => {
      try {
        window.sessionStorage.removeItem(PENDING_NEXA_LINK_KEY);
      } catch {
        // Ignore browsers where sessionStorage is unavailable.
      }
    };

    const completePendingNexaLink = async () => {
      if (linkingPendingNexa) return;
      const pendingToken = readPendingNexaToken();
      if (!pendingToken || !readProfile()) return;

      linkingPendingNexa = true;
      clearPendingNexaToken();
      try {
        const linkedUser = await linkWithNexaToken(pendingToken);
        if (!mounted) return;
        setUser(linkedUser);
        setNexaLinkRequired(false);
        setIsLoading(true);
        setIsAuthLoading(false);
      } catch (error) {
        savePendingNexaToken(pendingToken);
        if (!mounted) return;
        console.warn('Nexa ID account linking failed:', error);
        setNexaLinkRequired(true);
        setIsAuthLoading(false);
      } finally {
        linkingPendingNexa = false;
      }
    };

    const syncFromStorage = (event?: Event) => {
      if (!mounted) return;
      const detail = event instanceof CustomEvent ? event.detail as BackendUser | null : undefined;
      const nextProfile = detail === undefined ? readProfile() : detail;
      setUser(nextProfile);
      setIsAuthLoading(false);
      if (nextProfile && readPendingNexaToken()) {
        void completePendingNexaLink();
      }
    };

    window.addEventListener(SESSION_CHANGE_EVENT, syncFromStorage as EventListener);
    window.addEventListener('storage', syncFromStorage);

    const initAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const nexaToken = String(params.get('nexaToken') || '').trim();

      if (nexaToken) {
        params.delete('nexaToken');
        const nextQuery = params.toString();
        window.history.replaceState(
          {},
          '',
          `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`,
        );

        try {
          const federatedUser = await loginWithNexaToken(nexaToken);
          if (!mounted) return;
          clearPendingNexaToken();
          setNexaLinkRequired(false);
          setUser(federatedUser);
          setIsLoading(true);
          setIsAuthLoading(false);
          return;
        } catch (error: any) {
          console.warn('Nexa ID federation login failed:', error);
          if (Number(error?.status) === 409) {
            savePendingNexaToken(nexaToken);

            const existingUser = await validateBackendSession();
            if (!mounted) return;

            if (existingUser) {
              setUser(existingUser);
              await completePendingNexaLink();
              return;
            }

            setNexaLinkRequired(true);
            setUser(null);
            setIsLoading(false);
            setIsAuthLoading(false);
            return;
          }
          // Invalid/expired tokens and transient failures never force account linking.
        }
      }

      const validUser = await validateBackendSession();
      if (!mounted) return;
      setUser(validUser || readProfile());
      if (!validUser && !readProfile()) setIsLoading(false);
      setIsAuthLoading(false);
    };

    initAuth().catch(() => {
      if (mounted) {
        // A transient backend/network failure is not a logout condition.
        // Keep the locally cached session profile and let the next API call
        // determine whether the token is genuinely invalid.
        setUser(readProfile());
        setIsLoading(false);
        setIsAuthLoading(false);
      }
    });

    return () => {
      mounted = false;
      window.removeEventListener(SESSION_CHANGE_EVENT, syncFromStorage as EventListener);
      window.removeEventListener('storage', syncFromStorage);
    };
  }, []);

  useEffect(() => {
    if (user) {
      loadDocuments();
    } else {
      setDocuments([]);
      setIsLoading(false);
    }
  }, [user?.id]);

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = generateId();
    setToast({ id, message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const loadDocuments = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const docs = await listBackendDocuments();
      setDocuments(docs);
    } catch (error: any) {
      console.error('Error loading documents:', error);
      showToast(error?.message || 'Não foi possível carregar os documentos agora. Sua sessão foi preservada.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

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
      showToast('Documento salvo. Iniciando DocWallet Intelligence...', 'success');

      analyzeDocument(newDoc.id)
        .then(() => showToast('Documento analisado pelo DocWallet Intelligence', 'success'))
        .catch((error) => {
          console.warn('DocWallet Intelligence analysis failed:', error);
          showToast('Documento salvo. Análise pode ser feita ao abrir o documento.', 'info');
        });

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

  const refreshAuth = async () => {
    const next = await validateBackendSession().catch(() => readProfile());
    setUser(next || readProfile());
    return next;
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
    refreshAuth,
    nexaLinkRequired,
  };
};
