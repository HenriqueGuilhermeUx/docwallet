import { useEffect, useState } from 'react';
import { useDocumentsWithAuth } from './hooks/useDocumentsWithAuth';
import { DocumentType } from './types/document';
import { Document } from './types/document';
import {
  Header,
  Hero,
  SearchBar,
} from './components/Header';
import { CategoryTabs } from './components/CategoryTabs';
import { DocumentGrid } from './components/DocumentGrid';
import { FloatingActionButton } from './components/FloatingActionButton';
import { Toast } from './components/Toast';
import { AddDocumentModal } from './components/AddDocumentModal';
import { DocumentViewerModal } from './components/DocumentViewerModal';
import { AuthModal } from './components/AuthModal';
import { BlockchainPage } from './components/BlockchainPage';
import { AlertCircle, Brain, CheckCircle, Copy, FileSignature, FileKey, Loader2, Send, Shield, Zap } from 'lucide-react';
import { DIDWallet } from './components/DIDWallet';
import { ShareModal } from './components/ShareModal';
import { PublicDoc } from './components/PublicDoc';
import { ProductHome } from './components/ProductHome';
import { CertificatePage } from './components/CertificatePage';
import { SignPage } from './components/SignPage';
import { DeleteAccountPage, PrivacyPage, TermsPage } from './components/LegalPage';
import { ContractTemplatesPage } from './components/ContractTemplatesPage';
import { FreeHashValidatorPage } from './components/FreeHashValidatorPage';
import { CertificateLookupPage } from './components/CertificateLookupPage';
import { BusinessPage } from './components/BusinessPage';
import { ApiFuturePage } from './components/ApiFuturePage';
import { CertificateHistoryPanel } from './components/CertificateHistoryPanel';
import { SignaturesPage } from './components/SignaturesPage';
import { IntelligenceDashboard } from './components/IntelligenceDashboard';
import { DocFlowBusinessPage } from './components/DocFlowBusinessPage';
import { NexOfficeConnectFlow } from './components/NexOfficeConnectFlow';
import { requireApiUrl } from './lib/apiBase';

type IcpNextParty = {
  code: string;
  name: string;
  email?: string;
  url: string;
};

type IcpReturnPayload = {
  success?: boolean;
  session?: { status?: string };
  partyStatus?: string;
  requestStatus?: string;
  finalHash?: string | null;
  nextParty?: IcpNextParty | null;
  error?: string;
};

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

function IcpReturnGate() {
  const [state, setState] = useState<'syncing' | 'ready' | 'completed' | 'error'>('syncing');
  const [message, setMessage] = useState('Confirmando sua assinatura ICP-Brasil...');
  const [nextParty, setNextParty] = useState<IcpNextParty | null>(null);
  const [requestCompleted, setRequestCompleted] = useState(false);

  const parts = window.location.pathname.split('/').filter(Boolean);
  const code = parts[0] === 'sign' ? parts[1] : '';
  const sessionId = new URLSearchParams(window.location.search).get('signatureSessionId') || '';

  const clearReturnQuery = () => {
    window.history.replaceState({}, '', window.location.pathname);
  };

  useEffect(() => {
    if (!sessionId || !code) {
      setState('ready');
      return;
    }

    let cancelled = false;

    const sync = async () => {
      try {
        let result: IcpReturnPayload | null = null;
        for (let attempt = 0; attempt < 8; attempt += 1) {
          const response = await fetch(
            `${requireApiUrl()}/api/sign/${encodeURIComponent(code)}/icp/status?signatureSessionId=${encodeURIComponent(sessionId)}`,
          );
          const data = (await response.json().catch(() => ({}))) as IcpReturnPayload;
          if (!response.ok || data.success === false) {
            throw new Error(data.error || 'Não foi possível confirmar a assinatura ICP-Brasil.');
          }
          result = data;
          const status = (data.session?.status || '').toLowerCase();
          if (status === 'completed' || status === 'user_cancelled' || status === 'processing_error') break;
          setMessage('Assinatura recebida. Finalizando a validação do certificado...');
          await sleep(1500);
        }

        if (cancelled || !result) return;
        const status = (result.session?.status || '').toLowerCase();
        if (status === 'completed' || result.partyStatus === 'signed') {
          setNextParty(result.nextParty || null);
          setRequestCompleted(result.requestStatus === 'completed');
          clearReturnQuery();
          setState('completed');
          return;
        }
        if (status === 'user_cancelled') {
          clearReturnQuery();
          setState('ready');
          return;
        }
        if (status === 'processing_error') {
          throw new Error('O provedor informou um erro ao finalizar a assinatura ICP-Brasil.');
        }
        throw new Error('A assinatura ainda não foi concluída pelo provedor. Tente novamente em instantes.');
      } catch (err: any) {
        if (cancelled) return;
        setMessage(err?.message || 'Erro ao sincronizar a assinatura ICP-Brasil.');
        setState('error');
      }
    };

    sync();
    return () => {
      cancelled = true;
    };
  }, [code, sessionId]);

  if (state === 'ready') return <SignPage />;

  if (state === 'syncing') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 text-center shadow-2xl max-w-md w-full">
          <Loader2 className="animate-spin mx-auto text-indigo-600 mb-4" size={42} />
          <h1 className="text-xl font-bold text-slate-900">Validando assinatura ICP-Brasil</h1>
          <p className="text-sm text-slate-500 mt-2">{message}</p>
        </div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 text-center shadow-2xl max-w-md w-full">
          <AlertCircle className="mx-auto text-amber-500 mb-4" size={42} />
          <h1 className="text-xl font-bold text-slate-900">Precisamos confirmar o retorno</h1>
          <p className="text-sm text-slate-500 mt-2">{message}</p>
          <button
            onClick={() => { clearReturnQuery(); setState('ready'); }}
            className="mt-5 w-full py-3 bg-slate-900 text-white rounded-xl font-semibold"
          >
            Voltar para a assinatura
          </button>
        </div>
      </div>
    );
  }

  const nextPartyUrl = nextParty ? `${window.location.origin}${nextParty.url}` : '';
  const whatsappText = nextParty
    ? encodeURIComponent(`Olá, ${nextParty.name}. Você recebeu um contrato para assinar no DocWallet: ${nextPartyUrl}`)
    : '';

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-lg w-full text-slate-900">
        <CheckCircle className="text-emerald-600 mb-4" size={48} />
        <h1 className="text-2xl font-bold">Assinatura ICP-Brasil concluída</h1>
        <p className="text-sm text-slate-500 mt-2">
          O DocWallet confirmou a sessão no provedor e registrou as evidências do certificado digital.
        </p>

        {nextParty && (
          <div className="mt-6 rounded-xl bg-indigo-50 border border-indigo-100 p-4">
            <p className="font-bold text-indigo-950">Enviar para a próxima parte</p>
            <p className="text-sm text-indigo-900 mt-1">Agora {nextParty.name} pode continuar a assinatura.</p>
            <input value={nextPartyUrl} readOnly className="mt-3 w-full px-3 py-2 rounded-lg border border-indigo-100 text-xs bg-white" />
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                onClick={() => navigator.clipboard.writeText(nextPartyUrl).catch(() => undefined)}
                className="py-2 bg-slate-900 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
              >
                <Copy size={16} /> Copiar
              </button>
              <a
                href={`https://wa.me/?text=${whatsappText}`}
                target="_blank"
                rel="noreferrer"
                className="py-2 bg-emerald-600 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
              >
                <Send size={16} /> WhatsApp
              </a>
            </div>
          </div>
        )}

        {requestCompleted && !nextParty && (
          <div className="mt-6 rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-900">
            Todas as partes assinaram. O contrato foi concluído e recebeu o hash final do DocWallet.
          </div>
        )}

        <button
          onClick={() => setState('ready')}
          className="mt-6 w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold"
        >
          Ver documento e evidências
        </button>
      </div>
    </div>
  );
}

function App() {
  if (window.location.pathname.startsWith('/share/')) {
    return <PublicDoc />;
  }

  if (window.location.pathname.startsWith('/cert/')) {
    return <CertificatePage />;
  }

  if (window.location.pathname.startsWith('/sign/')) {
    return <IcpReturnGate />;
  }

  if (window.location.pathname === '/privacy') {
    return <PrivacyPage />;
  }

  if (window.location.pathname === '/terms') {
    return <TermsPage />;
  }

  if (window.location.pathname === '/delete-account') {
    return <DeleteAccountPage />;
  }

  if (window.location.pathname === '/modelos') {
    return <ContractTemplatesPage />;
  }

  if (window.location.pathname === '/validar-documento') {
    return <FreeHashValidatorPage />;
  }

  if (window.location.pathname === '/verificar-certificado') {
    return <CertificateLookupPage />;
  }

  if (window.location.pathname === '/empresas') {
    return <BusinessPage />;
  }

  if (window.location.pathname === '/api') {
    return <ApiFuturePage />;
  }

  const {
    user,
    documents,
    allDocuments,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    addDocument,
    deleteDocument,
    getCategoryCount,
    handleLogout,
    toast,
    isLoading,
    isAuthLoading,
  } = useDocumentsWithAuth();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showBlockchainModal, setShowBlockchainModal] = useState(false);
  const [showDIDWallet, setShowDIDWallet] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const handleAddClick = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      setShowAddModal(true);
    }
  };

  const handleAddDocument = async (
    name: string,
    type: DocumentType,
    file: File
  ) => {
    await addDocument(name, type, file);
  };

  const handleDocumentClick = (doc: Document) => {
    setSelectedDocument(doc);
  };

  const handleShareDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setShowShareModal(true);
  };

  const handleAuthenticateDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setShowBlockchainModal(true);
  };

  const handleHeaderAction = () => {
    if (user) {
      handleLogout();
    } else {
      setShowAuthModal(true);
    }
  };

  const footer = (
    <footer className="max-w-6xl mx-auto px-4 py-8 text-center text-xs text-slate-400 flex flex-wrap items-center justify-center gap-3">
      <span>DocWallet Docs © 2026</span>
      <a href="/inteligencia" className="hover:text-slate-600">Inteligência</a>
      <a href="/docflow" className="hover:text-slate-600">DocFlow</a>
      <a href="/assinaturas" className="hover:text-slate-600">Assinaturas</a>
      <a href="/modelos" className="hover:text-slate-600">Modelos</a>
      <a href="/validar-documento" className="hover:text-slate-600">Validar grátis</a>
      <a href="/verificar-certificado" className="hover:text-slate-600">Verificar certificado</a>
      <a href="/empresas" className="hover:text-slate-600">Empresas</a>
      <a href="/api" className="hover:text-slate-600">API</a>
      <a href="/privacy" className="hover:text-slate-600">Política de Privacidade</a>
      <a href="/terms" className="hover:text-slate-600">Termos de Uso</a>
      <a href="/delete-account" className="hover:text-slate-600">Excluir conta e dados</a>
    </footer>
  );

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (window.location.pathname === '/assinaturas') {
    return (
      <div className="min-h-screen bg-background">
        <Header onAddClick={handleAddClick} user={user} onLogout={handleHeaderAction} />
        <SignaturesPage user={user} onLogin={() => setShowAuthModal(true)} />
        {footer}
        {showAuthModal && <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={() => {}} />}
        {toast && <Toast message={toast.message} type={toast.type} />}
      </div>
    );
  }

  if (window.location.pathname === '/inteligencia') {
    return (
      <div className="min-h-screen bg-background">
        <Header onAddClick={handleAddClick} user={user} onLogout={handleHeaderAction} />
        <IntelligenceDashboard user={user} documents={allDocuments} onLogin={() => setShowAuthModal(true)} />
        {footer}
        {showAuthModal && <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={() => {}} />}
        {toast && <Toast message={toast.message} type={toast.type} />}
      </div>
    );
  }

  if (window.location.pathname === '/docflow' || window.location.pathname === '/docflow-business') {
    return (
      <div className="min-h-screen bg-background">
        <Header onAddClick={handleAddClick} user={user} onLogout={handleHeaderAction} />
        <DocFlowBusinessPage user={user} documents={allDocuments} onLogin={() => setShowAuthModal(true)} onAddDocument={handleAddClick} />
        {footer}
        {showAddModal && user && <AddDocumentModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onAdd={handleAddDocument} />}
        {showAuthModal && <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={() => {}} />}
        {toast && <Toast message={toast.message} type={toast.type} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        onAddClick={handleAddClick}
        user={user}
        onLogout={handleHeaderAction}
      />

      <NexOfficeConnectFlow user={user} onLogin={() => setShowAuthModal(true)} />

      {!user ? (
        <ProductHome onStart={() => setShowAuthModal(true)} />
      ) : (
        <>
          <Hero
            documentCount={allDocuments.length}
            onAddClick={handleAddClick}
          />

          <CertificateHistoryPanel />

          <div className="max-w-6xl mx-auto px-4 mb-6">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                    <Brain className="text-white" size={28} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Document Intelligence + Digital Trust</h3>
                    <p className="text-white/80 text-sm">Entenda documentos, crie processos, acompanhe assinaturas e registre provas de integridade.</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <a
                    href="/inteligencia"
                    className="px-5 py-3 bg-white text-indigo-600 rounded-xl font-semibold text-sm hover:bg-white/90 transition-colors flex items-center gap-2 shadow-lg"
                  >
                    <Brain size={18} />
                    Inteligência
                  </a>
                  <a
                    href="/docflow"
                    className="px-5 py-3 bg-white/20 backdrop-blur text-white rounded-xl font-semibold text-sm hover:bg-white/30 transition-colors flex items-center gap-2 border border-white/30"
                  >
                    <Zap size={18} />
                    DocFlow
                  </a>
                  <a
                    href="/assinaturas"
                    className="px-5 py-3 bg-white/20 backdrop-blur text-white rounded-xl font-semibold text-sm hover:bg-white/30 transition-colors flex items-center gap-2 border border-white/30"
                  >
                    <FileSignature size={18} />
                    Assinaturas
                  </a>
                  <button
                    onClick={() => setShowBlockchainModal(true)}
                    className="px-5 py-3 bg-white/20 backdrop-blur text-white rounded-xl font-semibold text-sm hover:bg-white/30 transition-colors flex items-center gap-2 border border-white/30"
                  >
                    <Shield size={18} />
                    Validar / Blockchain
                  </button>
                  <button
                    onClick={() => setShowDIDWallet(true)}
                    className="px-5 py-3 bg-white/20 backdrop-blur text-white rounded-xl font-semibold text-sm hover:bg-white/30 transition-colors flex items-center gap-2 border border-white/30"
                  >
                    <FileKey size={18} />
                    Identidade Digital Beta
                  </button>
                </div>
              </div>
            </div>
          </div>

          <SearchBar value={searchQuery} onChange={setSearchQuery} />

          <CategoryTabs
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            getCategoryCount={getCategoryCount}
          />

          <DocumentGrid
            documents={documents}
            onDocumentClick={handleDocumentClick}
            onShareDocument={handleShareDocument}
            onAuthenticateDocument={handleAuthenticateDocument}
            isLoading={isLoading}
          />

          <FloatingActionButton onClick={handleAddClick} />
        </>
      )}

      {footer}

      {showAddModal && user && (
        <AddDocumentModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddDocument}
        />
      )}

      {selectedDocument && (
        <DocumentViewerModal
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          onDelete={deleteDocument}
        />
      )}

      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {}}
        />
      )}

      <BlockchainPage
        isOpen={showBlockchainModal}
        onClose={() => setShowBlockchainModal(false)}
      />

      <DIDWallet
        isOpen={showDIDWallet}
        onClose={() => setShowDIDWallet(false)}
      />

      {showShareModal && selectedDocument && (
        <ShareModal
          document={selectedDocument}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}

export default App;
