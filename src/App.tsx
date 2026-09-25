import { useEffect, useState } from 'react';
import { useDocumentsWithAuth } from './hooks/useDocumentsWithAuth';
import { DocumentType } from './types/document';
import { Document } from './types/document';
import { Header, Hero, SearchBar } from './components/Header';
import { CategoryTabs } from './components/CategoryTabs';
import { DocumentGrid } from './components/DocumentGrid';
import { FloatingActionButton } from './components/FloatingActionButton';
import { Toast } from './components/Toast';
import { AddDocumentModal } from './components/AddDocumentModal';
import { DocumentViewerModal } from './components/DocumentViewerModal';
import { AuthModal } from './components/AuthModal';
import { BlockchainPage } from './components/BlockchainPage';
import { AlertCircle, Brain, CheckCircle, Copy, FileSignature, FileKey, Loader2, Send, Shield, Zap, Upload, ArrowRight } from 'lucide-react';
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
import { AppLink, useAppPath } from './lib/navigation';

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

  const clearReturnQuery = () => window.history.replaceState({}, '', window.location.pathname);

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
          const response = await fetch(`${requireApiUrl()}/api/sign/${encodeURIComponent(code)}/icp/status?signatureSessionId=${encodeURIComponent(sessionId)}`);
          const data = (await response.json().catch(() => ({}))) as IcpReturnPayload;
          if (!response.ok || data.success === false) throw new Error(data.error || 'Não foi possível confirmar a assinatura ICP-Brasil.');
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
        if (status === 'processing_error') throw new Error('O provedor informou um erro ao finalizar a assinatura ICP-Brasil.');
        throw new Error('A assinatura ainda não foi concluída pelo provedor. Tente novamente em instantes.');
      } catch (err: any) {
        if (cancelled) return;
        setMessage(err?.message || 'Erro ao sincronizar a assinatura ICP-Brasil.');
        setState('error');
      }
    };

    sync();
    return () => { cancelled = true; };
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
          <button onClick={() => { clearReturnQuery(); setState('ready'); }} className="mt-5 w-full py-3 bg-slate-900 text-white rounded-xl font-semibold">Voltar para a assinatura</button>
        </div>
      </div>
    );
  }

  const nextPartyUrl = nextParty ? `${window.location.origin}${nextParty.url}` : '';
  const whatsappText = nextParty ? encodeURIComponent(`Olá, ${nextParty.name}. Você recebeu um contrato para assinar no DocWallet: ${nextPartyUrl}`) : '';

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-lg w-full text-slate-900">
        <CheckCircle className="text-emerald-600 mb-4" size={48} />
        <h1 className="text-2xl font-bold">Assinatura ICP-Brasil concluída</h1>
        <p className="text-sm text-slate-500 mt-2">O DocWallet confirmou a sessão no provedor e registrou as evidências do certificado digital.</p>
        {nextParty && (
          <div className="mt-6 rounded-xl bg-indigo-50 border border-indigo-100 p-4">
            <p className="font-bold text-indigo-950">Enviar para a próxima parte</p>
            <p className="text-sm text-indigo-900 mt-1">Agora {nextParty.name} pode continuar a assinatura.</p>
            <input value={nextPartyUrl} readOnly className="mt-3 w-full px-3 py-2 rounded-lg border border-indigo-100 text-xs bg-white" />
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button onClick={() => navigator.clipboard.writeText(nextPartyUrl).catch(() => undefined)} className="py-2 bg-slate-900 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2"><Copy size={16} /> Copiar</button>
              <a href={`https://wa.me/?text=${whatsappText}`} target="_blank" rel="noreferrer" className="py-2 bg-emerald-600 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2"><Send size={16} /> WhatsApp</a>
            </div>
          </div>
        )}
        {requestCompleted && !nextParty && <div className="mt-6 rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-900">Todas as partes assinaram. O contrato foi concluído e recebeu o hash final do DocWallet.</div>}
        <button onClick={() => setState('ready')} className="mt-6 w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold">Ver documento e evidências</button>
      </div>
    </div>
  );
}

const lifecycleCards = [
  { href: '/', label: 'Receber', text: 'Documentos e arquivos', Icon: Upload },
  { href: '/inteligencia', label: 'Entender', text: 'Dados, prazos e alertas', Icon: Brain },
  { href: '/docflow', label: 'Processar', text: 'Regras e aprovações', Icon: Zap },
  { href: '/assinaturas', label: 'Assinar', text: 'Eletrônica ou ICP-Brasil', Icon: FileSignature },
  { href: '/validar-documento', label: 'Comprovar', text: 'Hash e evidências', Icon: Shield },
];

function WorkspaceApp({ path }: { path: string }) {
  const {
    user, documents, allDocuments, activeCategory, setActiveCategory, searchQuery, setSearchQuery,
    addDocument, deleteDocument, getCategoryCount, handleLogout, toast, isLoading, isAuthLoading,
  } = useDocumentsWithAuth();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showBlockchainModal, setShowBlockchainModal] = useState(false);
  const [showDIDWallet, setShowDIDWallet] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const handleAddClick = () => user ? setShowAddModal(true) : setShowAuthModal(true);
  const handleAddDocument = async (name: string, type: DocumentType, file: File) => { await addDocument(name, type, file); };
  const handleHeaderAction = () => user ? handleLogout() : setShowAuthModal(true);

  const footer = (
    <footer className="max-w-7xl mx-auto px-4 py-8 text-center text-xs text-slate-400 flex flex-wrap items-center justify-center gap-3">
      <span>DocWallet © 2026</span>
      <AppLink href="/">Documentos</AppLink>
      <AppLink href="/inteligencia">Inteligência</AppLink>
      <AppLink href="/docflow">DocFlow</AppLink>
      <AppLink href="/assinaturas">Assinaturas</AppLink>
      <AppLink href="/modelos">Modelos</AppLink>
      <AppLink href="/validar-documento">Validar</AppLink>
      <AppLink href="/verificar-certificado">Certificado</AppLink>
      <AppLink href="/empresas">Empresas</AppLink>
      <AppLink href="/api">API</AppLink>
      <AppLink href="/privacy">Privacidade</AppLink>
      <AppLink href="/terms">Termos</AppLink>
    </footer>
  );

  const common = (
    <>
      {showAddModal && user && <AddDocumentModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onAdd={handleAddDocument} />}
      {showAuthModal && <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={() => {}} />}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </>
  );

  if (isAuthLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="text-center"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" /><p className="text-slate-500">Carregando...</p></div></div>;
  }

  if (path === '/assinaturas') {
    return <div className="min-h-screen bg-background"><Header currentPath={path} onAddClick={handleAddClick} user={user} onLogout={handleHeaderAction} /><SignaturesPage user={user} onLogin={() => setShowAuthModal(true)} />{footer}{common}</div>;
  }

  if (path === '/inteligencia') {
    return <div className="min-h-screen bg-background"><Header currentPath={path} onAddClick={handleAddClick} user={user} onLogout={handleHeaderAction} /><IntelligenceDashboard user={user} documents={allDocuments} onLogin={() => setShowAuthModal(true)} />{footer}{common}</div>;
  }

  if (path === '/docflow' || path === '/docflow-business') {
    return <div className="min-h-screen bg-background"><Header currentPath={path} onAddClick={handleAddClick} user={user} onLogout={handleHeaderAction} /><DocFlowBusinessPage user={user} documents={allDocuments} onLogin={() => setShowAuthModal(true)} onAddDocument={handleAddClick} />{footer}{common}</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header currentPath={path} onAddClick={handleAddClick} user={user} onLogout={handleHeaderAction} />
      {path === '/' && <NexOfficeConnectFlow user={user} onLogin={() => setShowAuthModal(true)} />}

      {!user ? (
        <ProductHome onStart={() => setShowAuthModal(true)} />
      ) : (
        <>
          <Hero documentCount={allDocuments.length} onAddClick={handleAddClick} />

          <section className="max-w-7xl mx-auto px-4 -mt-1 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {lifecycleCards.map(({ href, label, text, Icon }, index) => (
                <AppLink key={href} href={href} className="group bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <div className="flex items-center justify-between gap-2">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><Icon size={19} /></div>
                    {index < lifecycleCards.length - 1 ? <ArrowRight size={15} className="text-slate-300 group-hover:text-indigo-500" /> : <CheckCircle size={16} className="text-emerald-500" />}
                  </div>
                  <p className="font-black text-slate-900 mt-3">{label}</p>
                  <p className="text-xs text-slate-500 mt-1">{text}</p>
                </AppLink>
              ))}
            </div>
          </section>

          <CertificateHistoryPanel />

          <div className="max-w-7xl mx-auto px-4 mb-6">
            <div className="bg-slate-950 rounded-[1.6rem] p-5 md:p-6 text-white">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-300">Ações rápidas</p>
                  <h3 className="text-xl font-black mt-1">O que você quer fazer agora?</h3>
                  <p className="text-slate-400 text-sm mt-1">As ferramentas continuam disponíveis, mas agora organizadas pelo ciclo do documento.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <AppLink href="/inteligencia" className="px-4 py-2.5 bg-white text-slate-950 rounded-xl font-semibold text-sm flex items-center gap-2"><Brain size={17} /> Analisar</AppLink>
                  <AppLink href="/docflow" className="px-4 py-2.5 bg-violet-600 text-white rounded-xl font-semibold text-sm flex items-center gap-2"><Zap size={17} /> Criar fluxo</AppLink>
                  <AppLink href="/assinaturas" className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm flex items-center gap-2"><FileSignature size={17} /> Assinar</AppLink>
                  <button onClick={() => setShowBlockchainModal(true)} className="px-4 py-2.5 bg-white/10 text-white rounded-xl font-semibold text-sm flex items-center gap-2 border border-white/10"><Shield size={17} /> Integridade</button>
                  <button onClick={() => setShowDIDWallet(true)} className="px-4 py-2.5 bg-white/10 text-white rounded-xl font-semibold text-sm flex items-center gap-2 border border-white/10"><FileKey size={17} /> Identidade Beta</button>
                </div>
              </div>
            </div>
          </div>

          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <CategoryTabs activeCategory={activeCategory} onCategoryChange={setActiveCategory} getCategoryCount={getCategoryCount} />
          <DocumentGrid documents={documents} onDocumentClick={setSelectedDocument} onShareDocument={(doc) => { setSelectedDocument(doc); setShowShareModal(true); }} onAuthenticateDocument={(doc) => { setSelectedDocument(doc); setShowBlockchainModal(true); }} isLoading={isLoading} />
          <FloatingActionButton onClick={handleAddClick} />
        </>
      )}

      {footer}
      {common}

      {selectedDocument && <DocumentViewerModal document={selectedDocument} onClose={() => setSelectedDocument(null)} onDelete={deleteDocument} />}
      <BlockchainPage isOpen={showBlockchainModal} onClose={() => setShowBlockchainModal(false)} />
      <DIDWallet isOpen={showDIDWallet} onClose={() => setShowDIDWallet(false)} />
      {showShareModal && selectedDocument && <ShareModal document={selectedDocument} onClose={() => setShowShareModal(false)} />}
    </div>
  );
}

function App() {
  const path = useAppPath();

  if (path.startsWith('/share/')) return <PublicDoc />;
  if (path.startsWith('/cert/')) return <CertificatePage />;
  if (path.startsWith('/sign/')) return <IcpReturnGate />;
  if (path === '/privacy') return <PrivacyPage />;
  if (path === '/terms') return <TermsPage />;
  if (path === '/delete-account') return <DeleteAccountPage />;
  if (path === '/modelos') return <ContractTemplatesPage />;
  if (path === '/validar-documento') return <FreeHashValidatorPage />;
  if (path === '/verificar-certificado') return <CertificateLookupPage />;
  if (path === '/empresas') return <BusinessPage />;
  if (path === '/api') return <ApiFuturePage />;

  return <WorkspaceApp path={path} />;
}

export default App;
