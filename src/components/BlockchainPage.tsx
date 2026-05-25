import { useState } from 'react';
import {
  Shield,
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Copy,
  ExternalLink,
  FileSignature,
  X,
  Briefcase,
  Users,
  Eye,
  Tag,
  CreditCard,
  ShoppingCart
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface BlockchainPageProps {
  isOpen: boolean;
  onClose: () => void;
  userCredits: number;
  onCreditsChange?: (credits: number) => void;
}

type TabType = 'notarize' | 'contracts' | 'history' | 'credits';
type ContractType = 'service' | 'partnership' | 'nda' | 'sale';

// Pacotes de creditos
const CREDIT_PACKAGES = [
  { id: 'credits_5', name: '5 Creditos', credits: 5, price: 25, perDoc: 5 },
  { id: 'credits_10', name: '10 Creditos', credits: 10, price: 45, perDoc: 4.5 },
  { id: 'credits_20', name: '20 Creditos', credits: 20, price: 80, perDoc: 4 },
  { id: 'credits_50', name: '50 Creditos', credits: 50, price: 175, perDoc: 3.5 },
];

export const BlockchainPage: React.FC<BlockchainPageProps> = ({
  isOpen,
  onClose,
  userCredits,
  onCreditsChange
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('notarize');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState<string | null>(null);
  const [isCalculatingHash, setIsCalculatingHash] = useState(false);
  const [isNotarizing, setIsNotarizing] = useState(false);
  const [notarizationResult, setNotarizationResult] = useState<any>(null);
  const [selectedContract, setSelectedContract] = useState<ContractType | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [isBuyingCredits, setIsBuyingCredits] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixCode, setPixCode] = useState<string | null>(null);

  const contracts = [
    { type: 'service' as ContractType, name: 'Prestacao de Servicos', icon: Briefcase, description: 'Contrato para servicos profissionais' },
    { type: 'partnership' as ContractType, name: 'Parceria Comercial', icon: Users, description: 'Acordo de cooperacao entre empresas' },
    { type: 'nda' as ContractType, name: 'NDA - Confidencialidade', icon: Eye, description: 'Acordo de nao divulgacao' },
    { type: 'sale' as ContractType, name: 'Compra e Venda', icon: Tag, description: 'Contrato de compra e venda' },
  ];

  const calculateFileHash = async (file: File) => {
    setIsCalculatingHash(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      setFileHash(hashHex);
      setSelectedFile(file);
    } catch (error) {
      console.error('Erro ao calcular hash:', error);
    } finally {
      setIsCalculatingHash(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) calculateFileHash(file);
  };

  const handleNotarize = async () => {
    if (!fileHash || userCredits <= 0) return;

    setIsNotarizing(true);
    // Simular autenticacao
    setTimeout(() => {
      setNotarizationResult({
        success: true,
        txHash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        timestamp: new Date().toISOString(),
        hash: fileHash,
      });
      // Debitar credito
      if (onCreditsChange) {
        onCreditsChange(userCredits - 1);
      }
      setIsNotarizing(false);
    }, 2000);
  };

  const handleBuyCredits = (pkgId: string) => {
    const pkg = CREDIT_PACKAGES.find(p => p.id === pkgId);
    if (!pkg) return;

    setSelectedPackage(pkgId);
    setIsBuyingCredits(true);

    // Simular QR Code PIX (em producao, seria gerado pelo Mercado Pago)
    const fakePix = '00020126580014br.gov.bcb.pix0136' +
      Math.random().toString(36).substring(2) +
      '520400005303986540' +
      pkg.price.toFixed(2).replace('.', '') +
      '5802BR5924000096530398202048';

    setPixCode(fakePix);
    setShowPixModal(true);
  };

  const handleConfirmPayment = () => {
    const pkg = CREDIT_PACKAGES.find(p => p.id === selectedPackage);
    if (pkg && onCreditsChange) {
      onCreditsChange(userCredits + pkg.credits);
    }
    setShowPixModal(false);
    setSelectedPackage(null);
    setPixCode(null);
    alert('Creditos adicionados! (Em producao, isso aconteceria apos confirmacao do Mercado Pago)');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                  <Shield className="text-white" size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">DocWallet Blockchain</h2>
                  <p className="text-white/80 text-sm">Autenticacao e Contratos Inteligentes</p>
                </div>
              </div>
              <button onClick={onClose} className="text-white/80 hover:text-white p-2">
                <X size={24} />
              </button>
            </div>

            {/* Credits Badge */}
            <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-2">
              <DollarSign className="text-white" size={16} />
              <span className="text-white font-semibold">{userCredits}</span>
              <span className="text-white/80 text-sm">creditos disponiveis</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 flex-wrap">
            <button
              onClick={() => setActiveTab('notarize')}
              className={`flex-1 py-3 px-4 font-medium text-center transition-colors text-sm ${
                activeTab === 'notarize'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Shield className="inline mr-1" size={16} />
              Autenticar
            </button>
            <button
              onClick={() => setActiveTab('contracts')}
              className={`flex-1 py-3 px-4 font-medium text-center transition-colors text-sm ${
                activeTab === 'contracts'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <FileSignature className="inline mr-1" size={16} />
              Contratos
            </button>
            <button
              onClick={() => setActiveTab('credits')}
              className={`flex-1 py-3 px-4 font-medium text-center transition-colors text-sm ${
                activeTab === 'credits'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <CreditCard className="inline mr-1" size={16} />
              Comprar Creditos
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-3 px-4 font-medium text-center transition-colors text-sm ${
                activeTab === 'history'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <CheckCircle className="inline mr-1" size={16} />
              Historico
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Tab: Notarize */}
            {activeTab === 'notarize' && (
              <div className="space-y-6">
                {!notarizationResult ? (
                  <>
                    {/* Upload Area */}
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleFileDrop}
                      className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer"
                      onClick={() => document.getElementById('file-input')?.click()}
                    >
                      <input
                        id="file-input"
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) calculateFileHash(file);
                        }}
                      />
                      <Upload className="mx-auto text-slate-400 mb-4" size={48} />
                      <p className="text-slate-600 font-medium mb-2">
                        Arraste ou clique para selecionar
                      </p>
                      <p className="text-slate-400 text-sm">
                        PDF, JPG, PNG (max. 10MB)
                      </p>
                    </div>

                    {/* File Info */}
                    {selectedFile && (
                      <div className="bg-slate-50 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <FileText className="text-indigo-600" size={24} />
                          <div className="flex-1">
                            <p className="font-medium text-slate-800">{selectedFile.name}</p>
                            <p className="text-sm text-slate-500">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>

                        {isCalculatingHash && (
                          <div className="flex items-center gap-2 text-slate-500">
                            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            <span>Calculando hash SHA-256...</span>
                          </div>
                        )}

                        {fileHash && !isCalculatingHash && (
                          <div className="bg-white rounded-lg p-3 border border-slate-200">
                            <p className="text-xs text-slate-500 mb-1">Hash SHA-256 (Impressao Digital)</p>
                            <code className="text-xs text-indigo-600 break-all">{fileHash}</code>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Notarize Button */}
                    <button
                      onClick={handleNotarize}
                      disabled={!fileHash || isCalculatingHash || isNotarizing || userCredits <= 0}
                      className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isNotarizing ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Registrando na Blockchain...
                        </>
                      ) : (
                        <>
                          <Shield size={20} />
                          Autenticar na Blockchain (1 credito)
                        </>
                      )}
                    </button>

                    {userCredits <= 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                        <AlertCircle className="text-amber-600 flex-shrink-0" size={24} />
                        <div className="flex-1">
                          <p className="font-medium text-amber-800">Sem creditos</p>
                          <p className="text-sm text-amber-600">Adquira creditos para autenticar documentos</p>
                        </div>
                        <button
                          onClick={() => setActiveTab('credits')}
                          className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium"
                        >
                          Comprar
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center space-y-6">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="text-green-600" size={48} />
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">Documento Autenticado!</h3>
                      <p className="text-slate-500">Seu documento foi registrado na blockchain Polygon</p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Transaction Hash</p>
                        <div className="flex items-center gap-2 bg-white rounded-lg p-2 border">
                          <code className="text-xs text-indigo-600 flex-1 break-all">
                            {notarizationResult.txHash}
                          </code>
                          <button
                            onClick={() => copyToClipboard(notarizationResult.txHash)}
                            className="p-1 hover:bg-slate-100 rounded"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <a
                          href={`https://polygonscan.com/tx/${notarizationResult.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-indigo-700"
                        >
                          Ver no PolygonScan
                          <ExternalLink size={14} />
                        </a>
                        <button
                          onClick={() => setShowQRModal(true)}
                          className="py-2 px-4 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-300"
                        >
                          QR Code
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setNotarizationResult(null);
                        setSelectedFile(null);
                        setFileHash(null);
                      }}
                      className="text-indigo-600 font-medium hover:underline"
                    >
                      Autenticar outro documento
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Contracts */}
            {activeTab === 'contracts' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Escolha o tipo de contrato</h3>
                  <p className="text-slate-500 text-sm">Selecione um modelo para criar seu contrato inteligente</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {contracts.map((contract) => {
                    const IconComponent = contract.icon;
                    return (
                      <button
                        key={contract.type}
                        onClick={() => setSelectedContract(contract.type)}
                        className={`p-6 rounded-xl border-2 text-left transition-all ${
                          selectedContract === contract.type
                            ? 'border-indigo-600 bg-indigo-50'
                            : 'border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-3">
                          <IconComponent className="text-indigo-600" size={24} />
                        </div>
                        <h4 className="font-bold text-slate-800 mb-1">{contract.name}</h4>
                        <p className="text-sm text-slate-500">{contract.description}</p>
                      </button>
                    );
                  })}
                </div>

                {selectedContract && (
                  <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-200">
                    <h4 className="font-bold text-slate-800 mb-4">Formulario do Contrato</h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Parte 1</label>
                          <input type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Nome / CNPJ" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Parte 2</label>
                          <input type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Nome / CNPJ" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Objeto / Descricao</label>
                        <textarea className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" rows={3} placeholder="Descreva o objeto do contrato..."></textarea>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Valor</label>
                          <input type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="R$ 0,00" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Data de Vigencia</label>
                          <input type="date" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                      </div>
                      <button
                        disabled={userCredits < 2}
                        className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        <FileSignature size={20} />
                        Gerar Contrato (2 creditos)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Credits */}
            {activeTab === 'credits' && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <ShoppingCart className="mx-auto text-indigo-600 mb-4" size={48} />
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Comprar Creditos</h3>
                  <p className="text-slate-500">Escolha um pacote de creditos para autenticacao de documentos</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {CREDIT_PACKAGES.map((pkg) => (
                    <button
                      key={pkg.id}
                      onClick={() => handleBuyCredits(pkg.id)}
                      disabled={isBuyingCredits}
                      className="p-6 rounded-xl border-2 border-slate-200 hover:border-indigo-400 transition-all text-left relative overflow-hidden"
                    >
                      {pkg.credits >= 20 && (
                        <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-2 py-1 rounded-bl-lg">
                          Melhor custo
                        </div>
                      )}
                      <div className="text-3xl font-bold text-indigo-600 mb-2">{pkg.credits}</div>
                      <div className="text-lg font-semibold text-slate-800 mb-1">{pkg.name}</div>
                      <div className="text-2xl font-bold text-slate-900 mb-2">R$ {pkg.price}</div>
                      <div className="text-sm text-slate-500">R$ {pkg.perDoc.toFixed(2)} por documento</div>
                    </button>
                  ))}
                </div>

                <div className="bg-slate-50 rounded-xl p-4 mt-6">
                  <h4 className="font-semibold text-slate-800 mb-2">Como funciona?</h4>
                  <ul className="text-sm text-slate-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                      Pague via PIX com qualquer banco
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                      Creditos adicionados automaticamente apos confirmacao
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                      Documentos autenticados para sempre na blockchain
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Tab: History */}
            {activeTab === 'history' && (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="text-slate-400" size={40} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Nenhum documento autenticado</h3>
                <p className="text-slate-500 mb-6">Seus documentos autenticados aparecerao aqui</p>
                <button
                  onClick={() => setActiveTab('notarize')}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold">
                  Autenticar primeiro documento
                </button>
              </div>
            )}
          </div>
        </div>

        {/* QR Modal */}
        {showQRModal && notarizationResult && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
              <h3 className="text-lg font-bold mb-4">QR Code para Verificacao</h3>
              <div className="bg-white p-4 rounded-xl border inline-block mb-4">
                <QRCodeSVG
                  value={`https://docwallet.app/verify/${notarizationResult.txHash}`}
                  size={200}
                  level="M"
                />
              </div>
              <p className="text-sm text-slate-500 mb-4">
                Escaneie para verificar a autenticidade do documento
              </p>
              <button
                onClick={() => setShowQRModal(false)}
                className="w-full py-2 bg-slate-200 text-slate-700 rounded-lg font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        {/* PIX Modal */}
        {showPixModal && pixCode && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
              <h3 className="text-lg font-bold mb-4">Pagamento PIX</h3>
              <div className="bg-slate-100 rounded-xl p-4 mb-4">
                <QRCodeSVG
                  value={pixCode}
                  size={180}
                  level="M"
                />
              </div>
              <p className="text-xs text-slate-500 mb-4 break-all">
                {pixCode.substring(0, 50)}...
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm">
                <p className="text-amber-800 font-medium">Modo Demo</p>
                <p className="text-amber-600 text-xs">Clique em "Confirmar" para simular pagamento aprovado</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowPixModal(false);
                    setSelectedPackage(null);
                    setPixCode(null);
                  }}
                  className="flex-1 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmPayment}
                  className="flex-1 py-2 bg-green-600 text-white rounded-lg font-medium"
                >
                  Confirmar Pagamento
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};