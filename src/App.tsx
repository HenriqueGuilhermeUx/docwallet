import { useState } from 'react';
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
import { BannerBlockchain } from './components/BannerBlockchain';
import { BlockchainPage } from './components/BlockchainPage';
import { UserCircle, Shield, FileSignature, FileKey } from 'lucide-react';
import { DIDWallet } from './components/DIDWallet';
import { ShareModal } from './components/ShareModal';
import { PublicDoc } from './components/PublicDoc';
import { ProductHome } from './components/ProductHome';
import { CertificatePage } from './components/CertificatePage';

function App() {
  if (window.location.pathname.startsWith('/share/')) {
    return <PublicDoc />;
  }

  if (window.location.pathname.startsWith('/cert/')) {
    return <CertificatePage />;
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

  return (
    <div className="min-h-screen bg-background">
      <Header
        onAddClick={handleAddClick}
        user={user}
        onLogout={handleHeaderAction}
      />

      {!user ? (
        <>
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center mb-6 shadow-lg">
                <UserCircle className="text-white" size={48} />
              </div>
              <h3 className="text-3xl font-bold text-slate-800 mb-3">
                DocWallet
              </h3>
              <p className="text-slate-500 text-center max-w-2xl mb-8 text-lg">
                Carteira digital para guardar documentos, criar contratos simples, compartilhar com segurança e registrar provas de autenticidade em blockchain.
              </p>
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-8 py-3 bg-primary hover:bg-primary-dark text-white rounded-full font-semibold transition-colors shadow-lg"
              >
                Entrar ou Cadastrar
              </button>
            </div>

            <BannerBlockchain onLearnMore={() => setShowAuthModal(true)} />
          </div>
          <ProductHome onStart={() => setShowAuthModal(true)} />
        </>
      ) : (
        <>
          <Hero
            documentCount={allDocuments.length}
            onAddClick={handleAddClick}
          />

          <div className="max-w-6xl mx-auto px-4 mb-6">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                    <Shield className="text-white" size={28} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Validação Blockchain</h3>
                    <p className="text-white/80 text-sm">Pague avulso por documento ou contrato. Escolha carteira cripto ou Pix quando disponível.</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setShowBlockchainModal(true)}
                    className="px-5 py-3 bg-white text-indigo-600 rounded-xl font-semibold text-sm hover:bg-white/90 transition-colors flex items-center gap-2 shadow-lg"
                  >
                    <Shield size={18} />
                    Validar Documento
                  </button>
                  <button
                    onClick={() => setShowBlockchainModal(true)}
                    className="px-5 py-3 bg-white/20 backdrop-blur text-white rounded-xl font-semibold text-sm hover:bg-white/30 transition-colors flex items-center gap-2 border border-white/30"
                  >
                    <FileSignature size={18} />
                    Criar Contrato
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
