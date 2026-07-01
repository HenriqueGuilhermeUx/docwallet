import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Copy,
  ExternalLink,
  FileSignature,
  FileText,
  History,
  Loader2,
  SearchCheck,
  Shield,
  Upload,
  Wallet,
  X,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { sha256File, sha256Text } from '../lib/hash';
import { connectWallet, getTargetChain, notarizeHashOnChain, WalletConnection } from '../lib/evmWallet';
import {
  BackendCertificate,
  confirmBackendCertificate,
  listBackendCertificates,
  verifyBackendHash,
} from '../lib/backendBlockchain';
import { readSession } from '../lib/backendSession';
import { openContractPdf } from '../lib/contractExport';
import { PRODUCT_COPY } from '../lib/productCopy';

interface BlockchainPageProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'notarize' | 'verify' | 'contracts' | 'history';
type ContractType = 'prestacao_servicos' | 'compra_venda' | 'locacao_comercial' | 'emprestimo_p2p' | 'confissao_divida' | 'nda';
type PaymentMethod = 'wallet' | 'pix';

const CONTRACT_TYPES: { id: ContractType; name: string; description: string }[] = [
  { id: 'prestacao_servicos', name: 'Prestação de Serviços', description: 'Contrato comercial simples para prestação de serviços.' },
  { id: 'compra_venda', name: 'Compra e Venda', description: 'Contrato para venda de bem, item ou ativo.' },
  { id: 'locacao_comercial', name: 'Locação Comercial', description: 'Contrato básico de locação para uso comercial.' },
  { id: 'emprestimo_p2p', name: 'Empréstimo P2P', description: 'Instrumento de empréstimo entre pessoas.' },
  { id: 'confissao_divida', name: 'Confissão de Dívida', description: 'Reconhecimento formal de débito.' },
  { id: 'nda', name: 'NDA / Confidencialidade', description: 'Acordo de confidencialidade e não divulgação.' },
];

const generateContract = (contractType: ContractType, partyA: string, partyB: string, description: string, emailA?: string, emailB?: string) => {
  const today = new Date().toLocaleDateString('pt-BR');
  const header = `DOCWALLET — CONTRATO DIGITAL\nData: ${today}\n\n`;
  const signature = `\n\nASSINATURA ELETRONICA DECLARATIVA\nAs partes declaram que aceitam a assinatura em meio digital e reconhecem que o hash do documento pode ser usado como prova de integridade.\n\nParte A: ${partyA || 'PARTE A'}${emailA ? ` — ${emailA}` : ''}\nParte B: ${partyB || 'PARTE B'}${emailB ? ` — ${emailB}` : ''}\n\n______________________________        ______________________________\n${partyA || 'PARTE A'}                         ${partyB || 'PARTE B'}\n\nHash e validacao blockchain gerados pelo DocWallet.`;

  const templates: Record<ContractType, string> = {
    prestacao_servicos: `CONTRATO DE PRESTACAO DE SERVICOS\n\nCONTRATANTE: ${partyA}\nCONTRATADO: ${partyB}\n\nOBJETO\n${description}\n\nAs partes acordam a prestacao dos servicos descritos acima, com obrigacoes, prazos e valores definidos entre si. O presente instrumento podera ser assinado eletronicamente e validado por hash em blockchain.`,
    compra_venda: `CONTRATO DE COMPRA E VENDA\n\nVENDEDOR: ${partyA}\nCOMPRADOR: ${partyB}\n\nOBJETO\n${description}\n\nAs partes celebram a compra e venda do bem descrito, obrigando-se ao cumprimento das condicoes comerciais acordadas.`,
    locacao_comercial: `CONTRATO DE LOCACAO COMERCIAL\n\nLOCADOR: ${partyA}\nLOCATARIO: ${partyB}\n\nOBJETO DA LOCACAO\n${description}\n\nO imovel ou espaco comercial descrito sera utilizado para finalidade licita, conforme condicoes acordadas entre as partes.`,
    emprestimo_p2p: `CONTRATO DE EMPRESTIMO ENTRE PESSOAS\n\nCREDOR: ${partyA}\nDEVEDOR: ${partyB}\n\nOBJETO\n${description}\n\nO devedor reconhece o recebimento do valor/obrigacao descrito e compromete-se a restitui-lo conforme condicoes acordadas.`,
    confissao_divida: `INSTRUMENTO PARTICULAR DE CONFISSAO DE DIVIDA\n\nCREDOR: ${partyA}\nDEVEDOR: ${partyB}\n\nOBJETO\n${description}\n\nO devedor confessa a divida descrita acima, assumindo obrigacao de pagamento nos termos acordados entre as partes.`,
    nda: `ACORDO DE CONFIDENCIALIDADE E NAO DIVULGACAO\n\nPARTE DIVULGANTE: ${partyA}\nPARTE RECEPTORA: ${partyB}\n\nOBJETO\n${description}\n\nA parte receptora compromete-se a manter sigilo sobre informacoes tecnicas, comerciais, estrategicas e operacionais relacionadas ao objeto acima.`,
  };

  return `${header}${templates[contractType]}${signature}`;
};

export const BlockchainPage: React.FC<BlockchainPageProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('notarize');
  const [wallet, setWallet] = useState<WalletConnection | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState<string>('');
  const [isHashing, setIsHashing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<BackendCertificate | null>(null);
  const [verifyFile, setVerifyFile] = useState<File | null>(null);
  const [verifyResult, setVerifyResult] = useState<BackendCertificate | null>(null);
  const [verifyMessage, setVerifyMessage] = useState<string>('');
  const [history, setHistory] = useState<BackendCertificate[]>([]);
  const [error, setError] = useState<string>('');
  const [contractType, setContractType] = useState<ContractType>('prestacao_servicos');
  const [partyA, setPartyA] = useState('');
  const [partyB, setPartyB] = useState('');
  const [emailA, setEmailA] = useState('');
  const [emailB, setEmailB] = useState('');
  const [contractDescription, setContractDescription] = useState('');
  const [contractContent, setContractContent] = useState('');
  const [contractHash, setContractHash] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wallet');

  const targetChain = getTargetChain();
  const price = import.meta.env.VITE_DOCWALLET_NOTARIZATION_PRICE_NATIVE || '0.01';

  const loadHistory = async () => {
    if (!readSession()) return;

    const records = await listBackendCertificates();
    setHistory(records);
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory().catch(() => undefined);
    }
  }, [isOpen]);

  const handleConnectWallet = async () => {
    setError('');
    try {
      const connection = await connectWallet();
      setWallet(connection);
    } catch (err: any) {
      setError(err?.message || 'Erro ao conectar carteira.');
    }
  };

  const handleFileSelect = async (file: File) => {
    setError('');
    setSelectedFile(file);
    setResult(null);
    setIsHashing(true);

    try {
      const hash = await sha256File(file);
      setFileHash(hash);
    } catch (err: any) {
      setError(err?.message || 'Erro ao calcular hash do arquivo.');
    } finally {
      setIsHashing(false);
    }
  };

  const ensureWalletPayment = () => {
    if (paymentMethod === 'pix') {
      throw new Error('Pix Woovi preparado para a proxima etapa de ativacao. Use carteira cripto por enquanto.');
    }
  };

  const handleNotarizeFile = async () => {
    if (!selectedFile || !fileHash) return;

    setError('');
    setIsSubmitting(true);

    try {
      if (!readSession()) throw new Error('Faça login antes de validar um documento em blockchain.');
      ensureWalletPayment();

      const receipt = await notarizeHashOnChain(fileHash);
      const record = await confirmBackendCertificate({
        fileHash,
        documentName: selectedFile.name,
        txHash: receipt.txHash,
        walletAddress: receipt.walletAddress,
      });

      setResult(record);
      setWallet({ address: receipt.walletAddress, chainId: receipt.chainId, balance: wallet?.balance || '0' });
      await loadHistory();
    } catch (err: any) {
      setError(err?.shortMessage || err?.message || 'Erro ao registrar na blockchain.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyFile = async (file: File) => {
    setError('');
    setVerifyFile(file);
    setVerifyResult(null);
    setVerifyMessage('Calculando hash...');

    try {
      const hash = await sha256File(file);
      const record = await verifyBackendHash(hash);

      if (record) {
        setVerifyResult(record);
        setVerifyMessage('Documento autentico: hash encontrado no registro DocWallet.');
      } else {
        setVerifyMessage('Documento nao encontrado. O hash deste arquivo nao possui certificado DocWallet.');
      }
    } catch (err: any) {
      setVerifyMessage('');
      setError(err?.message || 'Erro ao verificar documento.');
    }
  };

  const handleGenerateContract = async () => {
    setError('');
    setResult(null);

    if (!partyA.trim() || !partyB.trim() || !contractDescription.trim()) {
      setError('Preencha as partes e o objeto do contrato.');
      return;
    }

    const content = generateContract(contractType, partyA.trim(), partyB.trim(), contractDescription.trim(), emailA.trim(), emailB.trim());
    setContractContent(content);
    setContractHash(await sha256Text(content));
  };

  const handleNotarizeContract = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      if (!readSession()) throw new Error('Faça login antes de validar um contrato em blockchain.');
      if (!contractContent) throw new Error('Gere o contrato antes de registrar em blockchain.');
      ensureWalletPayment();

      const hash = contractHash || await sha256Text(contractContent);
      const receipt = await notarizeHashOnChain(hash);
      const selected = CONTRACT_TYPES.find((item) => item.id === contractType);
      const record = await confirmBackendCertificate({
        fileHash: hash,
        documentName: selected?.name || 'Contrato DocWallet',
        txHash: receipt.txHash,
        walletAddress: receipt.walletAddress,
      });

      setResult(record);
      await loadHistory();
    } catch (err: any) {
      setError(err?.shortMessage || err?.message || 'Erro ao registrar contrato.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadContract = () => {
    if (!contractContent) return;
    const selected = CONTRACT_TYPES.find((item) => item.id === contractType);
    openContractPdf({
      title: selected?.name || 'Contrato DocWallet',
      content: contractContent,
      hash: contractHash,
      certificateId: result?.certificate_id,
    });
  };

  const handleDownloadContractTxt = () => {
    if (!contractContent) return;

    const blob = new Blob([contractContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = 'contrato-docwallet.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value).catch(() => undefined);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                  <Shield className="text-white" size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">DocWallet Pay-per-use</h2>
                  <p className="text-white/80 text-sm">Documentos gratuitos para guardar e compartilhar. Pague apenas para validar.</p>
                </div>
              </div>
              <button onClick={onClose} className="text-white/80 hover:text-white p-2">
                <X size={24} />
              </button>
            </div>

            <div className="mt-5 grid md:grid-cols-[1fr_auto] gap-3 items-center">
              <div className="text-white/90 text-sm">
                Documento: <strong>{PRODUCT_COPY.documentPrice}</strong> ou <strong>{price} {targetChain.nativeCurrency.symbol}</strong> • Contrato: <strong>{PRODUCT_COPY.contractPrice}</strong>
              </div>
              <button
                onClick={handleConnectWallet}
                className="px-4 py-2 rounded-xl bg-white text-indigo-700 font-semibold flex items-center justify-center gap-2"
              >
                <Wallet size={18} />
                {wallet ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : 'Conectar carteira'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 border-b border-slate-200">
            <button onClick={() => setActiveTab('notarize')} className={`py-3 px-4 text-sm font-semibold ${activeTab === 'notarize' ? 'text-indigo-600 bg-indigo-50 border-b-2 border-indigo-600' : 'text-slate-500'}`}>
              <Shield className="inline mr-1" size={16} /> Validar
            </button>
            <button onClick={() => setActiveTab('verify')} className={`py-3 px-4 text-sm font-semibold ${activeTab === 'verify' ? 'text-indigo-600 bg-indigo-50 border-b-2 border-indigo-600' : 'text-slate-500'}`}>
              <SearchCheck className="inline mr-1" size={16} /> Verificar
            </button>
            <button onClick={() => setActiveTab('contracts')} className={`py-3 px-4 text-sm font-semibold ${activeTab === 'contracts' ? 'text-indigo-600 bg-indigo-50 border-b-2 border-indigo-600' : 'text-slate-500'}`}>
              <FileSignature className="inline mr-1" size={16} /> Contratos
            </button>
            <button onClick={() => setActiveTab('history')} className={`py-3 px-4 text-sm font-semibold ${activeTab === 'history' ? 'text-indigo-600 bg-indigo-50 border-b-2 border-indigo-600' : 'text-slate-500'}`}>
              <History className="inline mr-1" size={16} /> Historico
            </button>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 text-red-700">
                <AlertCircle size={22} className="flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="mb-5 grid sm:grid-cols-2 gap-3">
              <button onClick={() => setPaymentMethod('wallet')} className={`p-3 rounded-xl border text-sm font-semibold ${paymentMethod === 'wallet' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'}`}>Carteira cripto</button>
              <button onClick={() => setPaymentMethod('pix')} className={`p-3 rounded-xl border text-sm font-semibold ${paymentMethod === 'pix' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600'}`}>Pix Woovi</button>
            </div>

            {activeTab === 'notarize' && (
              <div className="space-y-5">
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer" onClick={() => window.document.getElementById('notarize-file')?.click()}>
                  <input
                    id="notarize-file"
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                  />
                  <Upload className="mx-auto text-slate-400 mb-4" size={48} />
                  <p className="text-slate-700 font-semibold">Selecione o documento para validar</p>
                  <p className="text-slate-400 text-sm mt-1">PDF, JPG ou PNG. O arquivo nao vai para a blockchain; apenas o hash.</p>
                </div>

                {selectedFile && (
                  <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <FileText className="text-indigo-600" size={24} />
                      <div>
                        <p className="font-semibold text-slate-800">{selectedFile.name}</p>
                        <p className="text-sm text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    {isHashing ? (
                      <div className="flex items-center gap-2 text-slate-500"><Loader2 className="animate-spin" size={18} /> Calculando SHA-256...</div>
                    ) : (
                      <div className="bg-white border border-slate-200 rounded-lg p-3">
                        <p className="text-xs text-slate-500 mb-1">Hash SHA-256</p>
                        <code className="text-xs text-indigo-600 break-all">{fileHash}</code>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleNotarizeFile}
                  disabled={!selectedFile || !fileHash || isSubmitting || isHashing}
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Shield size={20} />}
                  {paymentMethod === 'pix' ? `Pagar com Pix Woovi (${PRODUCT_COPY.documentPrice})` : `Pagar e registrar (${price} ${targetChain.nativeCurrency.symbol})`}
                </button>
              </div>
            )}

            {activeTab === 'verify' && (
              <div className="space-y-5">
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer" onClick={() => window.document.getElementById('verify-file')?.click()}>
                  <input
                    id="verify-file"
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) handleVerifyFile(file);
                    }}
                  />
                  <SearchCheck className="mx-auto text-slate-400 mb-4" size={48} />
                  <p className="text-slate-700 font-semibold">Verificar autenticidade de um arquivo</p>
                  <p className="text-slate-400 text-sm mt-1">O DocWallet calcula o hash e compara com certificados registrados.</p>
                </div>

                {verifyFile && (
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="font-semibold text-slate-800">{verifyFile.name}</p>
                    <p className="text-sm text-slate-500 mt-1">{verifyMessage}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'contracts' && (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-sm text-amber-800">
                    Contratos avulsos a {PRODUCT_COPY.contractPrice}. Gere PDF profissional, inclua declaracao de aceite eletronico e registre o hash em blockchain.
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Tipo de contrato</label>
                    <select value={contractType} onChange={(event) => setContractType(event.target.value as ContractType)} className="mt-1 w-full border border-slate-300 rounded-xl px-4 py-3">
                      {CONTRACT_TYPES.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Parte A</label>
                    <input value={partyA} onChange={(event) => setPartyA(event.target.value)} className="mt-1 w-full border border-slate-300 rounded-xl px-4 py-3" placeholder="Nome da parte A" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700">E-mail Parte A</label>
                    <input value={emailA} onChange={(event) => setEmailA(event.target.value)} className="mt-1 w-full border border-slate-300 rounded-xl px-4 py-3" placeholder="email@parte-a.com" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Parte B</label>
                    <input value={partyB} onChange={(event) => setPartyB(event.target.value)} className="mt-1 w-full border border-slate-300 rounded-xl px-4 py-3" placeholder="Nome da parte B" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700">E-mail Parte B</label>
                    <input value={emailB} onChange={(event) => setEmailB(event.target.value)} className="mt-1 w-full border border-slate-300 rounded-xl px-4 py-3" placeholder="email@parte-b.com" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Objeto / descricao</label>
                    <textarea value={contractDescription} onChange={(event) => setContractDescription(event.target.value)} className="mt-1 w-full border border-slate-300 rounded-xl px-4 py-3 min-h-[120px]" placeholder="Descreva o objeto do contrato" />
                  </div>
                  <button onClick={handleGenerateContract} className="w-full py-3 bg-slate-800 text-white rounded-xl font-semibold">Gerar contrato</button>
                  <button onClick={handleNotarizeContract} disabled={!contractContent || isSubmitting} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Shield size={18} />}
                    {paymentMethod === 'pix' ? `Pagar Pix e registrar (${PRODUCT_COPY.contractPrice})` : 'Registrar contrato em blockchain'}
                  </button>
                </div>
                <div className="bg-slate-950 text-slate-100 rounded-xl p-4 min-h-[420px] overflow-auto">
                  {contractContent ? (
                    <>
                      <pre className="whitespace-pre-wrap text-sm">{contractContent}</pre>
                      {contractHash && <p className="mt-4 text-xs text-slate-400 break-all">SHA-256: {contractHash}</p>}
                      <div className="flex flex-wrap gap-2 mt-4">
                        <button onClick={handleDownloadContract} className="px-4 py-2 rounded-lg bg-white text-slate-900 hover:bg-slate-100 text-sm font-semibold">Gerar PDF</button>
                        <button onClick={handleDownloadContractTxt} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm">Baixar TXT</button>
                      </div>
                    </>
                  ) : (
                    <p className="text-slate-400 text-sm">Preencha os dados e gere o contrato para visualizar aqui.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-3">
                {history.length === 0 ? (
                  <p className="text-slate-500 text-center py-10">Nenhum certificado blockchain ainda.</p>
                ) : history.map((item) => (
                  <div key={item.id} className="border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-800">{item.document_name}</p>
                      <p className="text-xs text-slate-500 mt-1">Certificado: {item.certificate_id}</p>
                      <p className="text-xs text-slate-500">Hash: {item.file_hash}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => copyToClipboard(item.tx_hash)} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200"><Copy size={18} /></button>
                      <a href={`/cert/${item.certificate_id}`} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100"><CheckCircle size={18} /></a>
                      <a href={item.explorer_url} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100"><ExternalLink size={18} /></a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(result || verifyResult) && (
              <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                <div className="flex flex-col md:flex-row gap-5">
                  <div className="bg-white rounded-xl p-3 w-fit">
                    <QRCodeSVG value={`${window.location.origin}/cert/${(result || verifyResult)?.certificate_id}`} size={120} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-emerald-700 font-bold mb-2">
                      <CheckCircle size={22} /> Certificado DocWallet confirmado
                    </div>
                    <p className="text-sm text-slate-700">Certificado: <strong>{(result || verifyResult)?.certificate_id}</strong></p>
                    <p className="text-sm text-slate-700">Rede: {(result || verifyResult)?.network_name}</p>
                    <p className="text-sm text-slate-700 break-all">TX: {(result || verifyResult)?.tx_hash}</p>
                    <div className="flex flex-wrap gap-3 mt-3">
                      <a href={`/cert/${(result || verifyResult)?.certificate_id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-emerald-700 font-semibold">
                        Ver certificado <ExternalLink size={16} />
                      </a>
                      <a href={(result || verifyResult)?.explorer_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-indigo-600 font-semibold">
                        Ver no explorador <ExternalLink size={16} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
