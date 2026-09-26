import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Brain,
  FileSignature,
  LogOut,
  Plus,
  Shield,
  Upload,
  Wallet,
  Zap,
} from 'lucide-react';
import { useDocumentsWithAuth } from '../hooks/useDocumentsWithAuth';
import { Document } from '../types/document';
import { DocumentType } from '../types/document';
import { AddDocumentModal } from './AddDocumentModal';
import { AuthModal } from './AuthModal';
import { CategoryTabs } from './CategoryTabs';
import { CertificateHistoryPanel } from './CertificateHistoryPanel';
import { CertificateLookupPage } from './CertificateLookupPage';
import { DocFlowBusinessPage } from './DocFlowBusinessPage';
import { DocumentGrid } from './DocumentGrid';
import { DocumentViewerModal } from './DocumentViewerModal';
import { FreeHashValidatorPage } from './FreeHashValidatorPage';
import { IntelligenceDashboard } from './IntelligenceDashboard';
import { SearchBar } from './Header';
import { NativeSignaturesPage } from './NativeSignaturesPage';
import { ShareModal } from './ShareModal';
import { Toast } from './Toast';

type NativeTab = 'receive' | 'understand' | 'process' | 'sign' | 'prove';
type ProveTool = 'hash' | 'certificate' | null;

type NativeDocWalletAppProps = {
  initialPath?: string;
};

const pathToTab = (path: string): NativeTab => {
  if (path === '/inteligencia') return 'understand';
  if (path === '/docflow' || path === '/docflow-business') return 'process';
  if (path === '/assinaturas') return 'sign';
  return 'receive';
};

const tabToPath: Record<NativeTab, string> = {
  receive: '/',
  understand: '/inteligencia',
  process: '/docflow',
  sign: '/assinaturas',
  prove: '/',
};

const tabs = [
  { id: 'receive' as const, label: 'Receber', Icon: Upload },
  { id: 'understand' as const, label: 'Entender', Icon: Brain },
  { id: 'process' as const, label: 'Processar', Icon: Zap },
  { id: 'sign' as const, label: 'Assinar', Icon: FileSignature },
  { id: 'prove' as const, label: 'Comprovar', Icon: Shield },
];

export const NativeDocWalletApp: React.FC<NativeDocWalletAppProps> = ({ initialPath = '/' }) => {
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

  const [tab, setTab] = useState<NativeTab>(() => pathToTab(initialPath));
  const [proveTool, setProveTool] = useState<ProveTool>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [shareDocument, setShareDocument] = useState<Document | null>(null);

  const userLabel = useMemo(() => user?.email?.split('@')[0] || 'Conta', [user?.email]);
  const userInitial = user?.email?.[0]?.toUpperCase() || 'U';

  const selectTab = (next: NativeTab) => {
    setTab(next);
    setProveTool(null);
    const path = tabToPath[next];
    if (next !== 'prove' && window.location.pathname !== path) {
      window.history.replaceState({}, '', path);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddClick = () => {
    if (!user) setShowAuthModal(true);
    else setShowAddModal(true);
  };

  const handleAddDocument = async (name: string, type: DocumentType, file: File) => {
    await addDocument(name, type, file);
  };

  const topBar = (
    <header
      className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="h-16 px-4 flex items-center justify-between gap-3">
        <button type="button" onClick={() => selectTab('receive')} className="flex items-center gap-3 min-w-0 text-left">
          <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-md shrink-0">
            <Wallet size={21} className="text-white" />
          </span>
          <span className="min-w-0">
            <span className="block text-base font-black text-slate-900 truncate">DocWallet</span>
            <span className="block text-[11px] text-slate-500 truncate">seus documentos em movimento</span>
          </span>
        </button>

        {user ? (
          <div className="flex items-center gap-2">
            <span className="hidden min-[390px]:block text-xs text-slate-500 max-w-24 truncate">{userLabel}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold active:scale-95"
              aria-label="Sair da conta"
              title="Sair"
            >
              {userInitial}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAuthModal(true)}
            className="min-h-10 px-4 rounded-full bg-slate-900 text-white text-sm font-bold active:scale-95"
          >
            Entrar
          </button>
        )}
      </div>
    </header>
  );

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-semibold text-slate-700">Abrindo seu DocWallet...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex-1 px-6 py-10 flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-950/30">
              <Wallet size={25} />
            </div>
            <div>
              <h1 className="text-xl font-black">DocWallet</h1>
              <p className="text-xs text-slate-400">Document Intelligence & Trust</p>
            </div>
          </div>

          <div className="py-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-xs font-semibold text-indigo-100 mb-5">
              <BadgeCheck size={15} /> documentos do início à prova
            </div>
            <h2 className="text-4xl font-black leading-tight tracking-tight">
              Receba. Entenda.<br />Processe. Assine.<br /><span className="text-indigo-400">Comprove.</span>
            </h2>
            <p className="mt-5 text-slate-300 leading-relaxed max-w-sm">
              Um único app para acompanhar o ciclo completo dos seus documentos com inteligência, workflow e evidências.
            </p>

            <div className="grid grid-cols-5 gap-2 mt-8">
              {tabs.map(({ id, label, Icon }) => (
                <div key={id} className="text-center">
                  <div className="mx-auto w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Icon size={18} className="text-indigo-200" />
                  </div>
                  <p className="mt-2 text-[10px] text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="w-full min-h-14 rounded-2xl bg-white text-slate-950 font-black text-base active:scale-[0.99]"
            >
              Entrar ou criar conta
            </button>
            <p className="mt-3 text-center text-xs text-slate-500">O mesmo ambiente seguro do DocWallet Web.</p>
          </div>
        </div>
        {showAuthModal && (
          <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={() => setShowAuthModal(false)} />
        )}
        {toast && <Toast message={toast.message} type={toast.type} />}
      </div>
    );
  }

  const receiveView = (
    <>
      <section className="px-4 pt-5 pb-7 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-200">Receber</p>
            <h2 className="text-2xl font-black mt-1">Sua caixa documental</h2>
            <p className="text-sm text-indigo-100 mt-1">
              {allDocuments.length > 0 ? `${allDocuments.length} documento${allDocuments.length === 1 ? '' : 's'} sob seu controle` : 'Adicione seu primeiro documento'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddClick}
            className="w-12 h-12 rounded-2xl bg-white text-indigo-700 flex items-center justify-center shadow-lg active:scale-95 shrink-0"
            aria-label="Adicionar documento"
          >
            <Plus size={22} />
          </button>
        </div>
      </section>

      <div className="-mt-4 relative z-10">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>
      <CategoryTabs activeCategory={activeCategory} onCategoryChange={setActiveCategory} getCategoryCount={getCategoryCount} />
      <DocumentGrid
        documents={documents}
        onDocumentClick={setSelectedDocument}
        onShareDocument={(document) => setShareDocument(document)}
        isLoading={isLoading}
      />
    </>
  );

  const proveHome = (
    <div className="px-4 py-5 space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">Comprovar</p>
        <h2 className="text-2xl font-black text-slate-900 mt-1">Provas e confiança</h2>
        <p className="text-sm text-slate-500 mt-1">Confira a integridade de documentos e consulte certificados DocWallet.</p>
      </div>

      <CertificateHistoryPanel />

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setProveTool('hash')}
          className="text-left min-h-32 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm active:scale-[0.99]"
        >
          <Shield size={24} className="text-emerald-600" />
          <p className="font-black text-slate-900 mt-4">Validar hash</p>
          <p className="text-xs text-slate-500 mt-1">Confira a integridade de um documento.</p>
        </button>

        <button
          type="button"
          onClick={() => setProveTool('certificate')}
          className="text-left min-h-32 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm active:scale-[0.99]"
        >
          <BadgeCheck size={24} className="text-indigo-600" />
          <p className="font-black text-slate-900 mt-4">Certificado</p>
          <p className="text-xs text-slate-500 mt-1">Consulte certificados DocWallet.</p>
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        Recursos pagos de registro em blockchain permanecem disponíveis no DocWallet Web e não fazem parte desta versão Android da Google Play.
      </div>
    </div>
  );

  const proveView = proveTool ? (
    <div className="pb-6">
      <div className="sticky top-16 z-30 bg-slate-50/95 backdrop-blur border-b border-slate-200 px-4 py-3">
        <button
          type="button"
          onClick={() => setProveTool(null)}
          className="inline-flex items-center gap-2 min-h-10 px-3 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700"
        >
          <ArrowLeft size={17} /> Voltar para Comprovar
        </button>
      </div>
      {proveTool === 'hash' ? <FreeHashValidatorPage /> : <CertificateLookupPage />}
    </div>
  ) : proveHome;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {topBar}

      <main className="pb-28">
        {tab === 'receive' && receiveView}
        {tab === 'understand' && <IntelligenceDashboard user={user} documents={allDocuments} onLogin={() => setShowAuthModal(true)} />}
        {tab === 'process' && <DocFlowBusinessPage user={user} documents={allDocuments} onLogin={() => setShowAuthModal(true)} onAddDocument={handleAddClick} />}
        {tab === 'sign' && <NativeSignaturesPage user={user} onLogin={() => setShowAuthModal(true)} />}
        {tab === 'prove' && proveView}
      </main>

      <nav
        className="fixed bottom-0 inset-x-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur px-1 pt-2"
        style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
        aria-label="Navegação principal"
      >
        <div className="grid grid-cols-5">
          {tabs.map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => selectTab(id)}
                className={`min-h-14 flex flex-col items-center justify-center gap-1 rounded-xl transition-colors ${active ? 'text-indigo-700 bg-indigo-50' : 'text-slate-500'}`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10px] font-bold">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {showAddModal && (
        <AddDocumentModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onAdd={handleAddDocument} />
      )}

      {selectedDocument && (
        <DocumentViewerModal document={selectedDocument} onClose={() => setSelectedDocument(null)} onDelete={deleteDocument} />
      )}

      {shareDocument && (
        <ShareModal document={shareDocument} onClose={() => setShareDocument(null)} />
      )}

      {showAuthModal && (
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={() => setShowAuthModal(false)} />
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}

      <button type="button" onClick={handleLogout} className="sr-only" aria-label="Sair da conta">
        <LogOut size={16} />
      </button>
    </div>
  );
};
