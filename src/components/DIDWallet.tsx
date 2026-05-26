import { useState, useEffect } from 'react';
import {
  X,
  Shield,
  User,
  Key,
  Plus,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  Globe,
  Calendar,
  Briefcase,
  MapPin,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  FileKey,
  Zap
} from 'lucide-react';
import {
  DIDDocument,
  generateKeyPair,
  createDIDKey,
  createDIDEthr,
  createDIDDocument,
  listStoredDIDs,
  getStoredDID,
  exportDIDBackup,
  importDIDBackup
} from '../lib/did';
import {
  VerifiableCredential,
  CredentialType,
  issueCredential,
  verifyCredential,
  listStoredCredentials,
  formatCredentialDisplay,
  storeCredentialLocally,
  CREDENTIAL_SCHEMAS
} from '../lib/verifiableCredentials';
import {
  ZKProof,
  ZKProofType,
  generateAgeProof,
  generateBlacklistProof,
  generateCitizenshipProof,
  listStoredProofs,
  formatProofDisplay,
  ZK_PROOF_TYPES
} from '../lib/zkp';
import { didit, DiditVerificationResult, DiditCredential } from '../lib/didit';

interface DIDWalletProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'identities' | 'credentials' | 'proofs' | 'kyc' | 'create';

export function DIDWallet({ isOpen, onClose }: DIDWalletProps) {
  const [activeTab, setActiveTab] = useState<TabType>('identities');
  const [dids, setDids] = useState<{ did: string; document: DIDDocument }[]>([]);
  const [credentials, setCredentials] = useState<VerifiableCredential[]>([]);
  const [proofs, setProofs] = useState<ZKProof[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<VerifiableCredential | null>(null);
  const [selectedProof, setSelectedProof] = useState<ZKProof | null>(null);

  // Form states
  const [newDidType, setNewDidType] = useState<'key' | 'ethr'>('key');
  const [credentialForm, setCredentialForm] = useState({
    type: 'PersonCredential' as CredentialType,
    name: '',
    cpf: '',
    birthDate: '',
    country: ''
  });
  const [proofForm, setProofForm] = useState({
    type: 'age_above' as ZKProofType,
    threshold: '18'
  });

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = () => {
    // Load stored DIDs
    const storedDids = listStoredDIDs();
    const didData = storedDids.map(did => ({
      did,
      document: getStoredDID(did)!
    })).filter(d => d.document);
    setDids(didData);

    // Load stored credentials
    setCredentials(listStoredCredentials());

    // Load stored proofs
    setProofs(listStoredProofs());
  };

  const handleCreateDID = async () => {
    setLoading(true);
    try {
      const { publicKey, privateKey, address } = await generateKeyPair();

      let did: string;
      if (newDidType === 'key') {
        did = createDIDKey(publicKey);
      } else {
        did = createDIDEthr(address);
      }

      const document = createDIDDocument(did, publicKey, privateKey);

      // Store DID locally
      localStorage.setItem(`did_${did}`, JSON.stringify({
        ...document,
        privateKey // Note: In production, encrypt this!
      }));

      // Also store private key separately
      localStorage.setItem(`did_private_${did}`, privateKey);

      loadData();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating DID:', error);
    }
    setLoading(false);
  };

  const handleCreateCredential = async () => {
    setLoading(true);
    try {
      // Use first DID as issuer (in production, use a proper issuer DID)
      const issuerDid = dids[0]?.did || 'did:key:placeholder';

      const subjectData: any = {
        name: credentialForm.name,
        ...(credentialForm.type === 'PersonCredential' && { cpf: credentialForm.cpf }),
        ...(credentialForm.type === 'PersonCredential' && { birthDate: credentialForm.birthDate }),
        ...(credentialForm.type === 'KYCAccreditationCredential' && { accreditedAt: new Date().toISOString() })
      };

      // Get issuer private key
      const issuerPrivateKey = localStorage.getItem(`did_private_${issuerDid}`) || 'default';

      const credential = await issueCredential(
        issuerDid,
        issuerDid, // holder is same as issuer for demo
        credentialForm.type,
        subjectData,
        issuerPrivateKey
      );

      storeCredentialLocally(credential);
      loadData();
      setShowCredentialModal(false);
      setCredentialForm({ type: 'PersonCredential', name: '', cpf: '', birthDate: '', country: '' });
    } catch (error) {
      console.error('Error creating credential:', error);
    }
    setLoading(false);
  };

  const handleCreateProof = async () => {
    setLoading(true);
    try {
      let proof: ZKProof;

      switch (proofForm.type) {
        case 'age_above':
          const birthDate = prompt('Digite sua data de nascimento (YYYY-MM-DD):');
          if (birthDate) {
            proof = await generateAgeProof(birthDate, parseInt(proofForm.threshold));
          } else {
            throw new Error('Birth date required');
          }
          break;
        case 'citizenship':
          proof = await generateCitizenshipProof(credentialForm.country || 'BR');
          break;
        default:
          proof = await generateCitizenshipProof('BR');
      }

      // Store proof
      localStorage.setItem(`zkproof_${proof.nullifier}`, JSON.stringify(proof));
      const list = JSON.parse(localStorage.getItem('zkproof_list') || '[]');
      list.push(proof.nullifier);
      localStorage.setItem('zkproof_list', JSON.stringify(list));

      loadData();
      setShowProofModal(false);
    } catch (error) {
      console.error('Error creating proof:', error);
    }
    setLoading(false);
  };

  const handleVerifyCredential = async (credential: VerifiableCredential) => {
    const result = await verifyCredential(credential);
    alert(result.verified
      ? 'Credencial Valida!\n' + (result.warnings.length ? 'Avisos: ' + result.warnings.join(', ') : '')
      : 'Credencial Invalida!\nErros: ' + result.errors.join(', ')
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copiado para a area de transferencia!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <FileKey className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Identidade Auto-Soberana</h2>
              <p className="text-white/80 text-sm">DIDs + Credenciais Verificaveis + ZKPs</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {[
            { key: 'identities', label: 'Identidades', icon: User },
            { key: 'credentials', label: 'Credenciais', icon: Shield },
            { key: 'proofs', label: 'Provas ZK', icon: Zap },
            { key: 'create', label: 'Criar', icon: Plus }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => {
                if (tab.key === 'create') {
                  setShowCreateModal(true);
                } else {
                  setActiveTab(tab.key as TabType);
                }
              }}
              className={`flex-1 py-4 px-4 flex items-center justify-center gap-2 font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Identities Tab */}
          {activeTab === 'identities' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Suas Identidades Descentralizadas</h3>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700"
                >
                  <Plus size={18} />
                  Nova Identidade
                </button>
              </div>

              {dids.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl">
                  <Key className="mx-auto text-slate-400 mb-4" size={48} />
                  <p className="text-slate-600 mb-4">Nenhuma identidade criada ainda</p>
                  <p className="text-slate-500 text-sm">
                    Crie uma identidade para ter controle total dos seus dados
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dids.map(({ did, document }) => (
                    <div key={did} className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                              {did.split(':')[1]?.toUpperCase()}
                            </span>
                            <CheckCircle className="text-green-500" size={16} />
                          </div>
                          <p className="font-mono text-sm text-slate-700 break-all">{did}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            Criado em: {document['@context'] ? 'W3C Standard' : 'N/A'}
                          </p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(did)}
                          className="p-2 hover:bg-slate-200 rounded-lg"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Info Section */}
              <div className="mt-6 bg-indigo-50 rounded-xl p-4">
                <h4 className="font-semibold text-indigo-800 mb-2 flex items-center gap-2">
                  <Globe size={18} />
                  O que sao DIDs?
                </h4>
                <p className="text-sm text-indigo-700">
                  Identificadores Descentralizados permitem que voce tenha propriedade total da sua identidade.
                  Diferente de um login tradicional, voce controla quem pode acessar seus dados e pode
                  compartilhar apenas o necessario, sem revelar informacoes desnecessarias.
                </p>
              </div>
            </div>
          )}

          {/* Credentials Tab */}
          {activeTab === 'credentials' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Credenciais Verificaveis</h3>
                <button
                  onClick={() => setShowCredentialModal(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700"
                  disabled={dids.length === 0}
                >
                  <Plus size={18} />
                  Nova Credencial
                </button>
              </div>

              {credentials.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl">
                  <Shield className="mx-auto text-slate-400 mb-4" size={48} />
                  <p className="text-slate-600 mb-4">Nenhuma credencial criada</p>
                  <p className="text-slate-500 text-sm">
                    Credenciais sao emissoes por emissores confiaveis que verificam suas informacoes
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {credentials.map(credential => {
                    const display = formatCredentialDisplay(credential);
                    return (
                      <div key={credential.id} className="bg-slate-50 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              display.status === 'valid' ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                              {display.status === 'valid' ? (
                                <CheckCircle className="text-green-600" size={20} />
                              ) : (
                                <AlertCircle className="text-red-600" size={20} />
                              )}
                            </div>
                            <div>
                              <h4 className="font-semibold">{display.title}</h4>
                              <p className="text-sm text-slate-500">{display.subtitle}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleVerifyCredential(credential)}
                            className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-sm hover:bg-indigo-200"
                          >
                            Verificar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Proofs Tab */}
          {activeTab === 'proofs' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Provas de Conhecimento Zero</h3>
                <button
                  onClick={() => setShowProofModal(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700"
                >
                  <Plus size={18} />
                  Gerar Prova
                </button>
              </div>

              <div className="bg-amber-50 rounded-xl p-4 mb-4">
                <p className="text-sm text-amber-800">
                  <strong>Privacidade Total:</strong> Provas ZK permitem que você prove coisas sobre si mesmo
                  sem revelar os dados reais. Por exemplo, provar que tem mais de 18 anos sem mostrar
                  sua data de nascimento.
                </p>
              </div>

              {proofs.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl">
                  <Zap className="mx-auto text-slate-400 mb-4" size={48} />
                  <p className="text-slate-600 mb-4">Nenhuma prova gerada</p>
                  <p className="text-slate-500 text-sm">
                    Gere provas para usar em aplicacoes que aceitam ZKP
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {proofs.map(proof => {
                    const display = formatProofDisplay(proof);
                    return (
                      <div key={proof.nullifier} className="bg-slate-50 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Zap className="text-purple-600" size={20} />
                            </div>
                            <div>
                              <h4 className="font-semibold">{display.title}</h4>
                              <p className="text-sm text-slate-500 truncate max-w-xs">
                                Nullifier: {proof.nullifier.slice(0, 20)}...
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              display.status === 'valid'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {display.status === 'valid' ? 'Valida' : 'Usada/Expirada'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create DID Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Criar Nova Identidade</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tipo de DID</label>
                <select
                  value={newDidType}
                  onChange={e => setNewDidType(e.target.value as 'key' | 'ethr')}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="key">did:key (Universal)</option>
                  <option value="ethr">did:ethr (Ethereum/Polygon)</option>
                </select>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 text-sm">
                <p className="font-medium mb-2">Como funciona:</p>
                <ul className="text-slate-600 space-y-1">
                  <li>- Uma chave publica e gerada no seu navegador</li>
                  <li>- Seu DID e criado a partir dessa chave</li>
                  <li>- A chave privada fica apenas no seu dispositivo</li>
                  <li>- Voce controla quem pode verificar seus dados</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2 border rounded-lg hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateDID}
                disabled={loading}
                className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Criando...' : 'Criar DID'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Credential Modal */}
      {showCredentialModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Criar Credencial</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tipo de Credencial</label>
                <select
                  value={credentialForm.type}
                  onChange={e => setCredentialForm({ ...credentialForm, type: e.target.value as CredentialType })}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="PersonCredential">Identidade Pessoal</option>
                  <option value="AgeVerificationCredential">Verificacao de Idade</option>
                  <option value="AddressCredential">Endereco</option>
                  <option value="EmploymentCredential">Vinculo Empregaticio</option>
                  <option value="KYCAccreditationCredential">Verificacao KYC</option>
                </select>
              </div>

              {credentialForm.type === 'PersonCredential' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Nome Completo</label>
                    <input
                      type="text"
                      value={credentialForm.name}
                      onChange={e => setCredentialForm({ ...credentialForm, name: e.target.value })}
                      className="w-full p-3 border rounded-lg"
                      placeholder="Seu nome completo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">CPF (criptografado)</label>
                    <input
                      type="text"
                      value={credentialForm.cpf}
                      onChange={e => setCredentialForm({ ...credentialForm, cpf: e.target.value })}
                      className="w-full p-3 border rounded-lg"
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Data de Nascimento</label>
                    <input
                      type="date"
                      value={credentialForm.birthDate}
                      onChange={e => setCredentialForm({ ...credentialForm, birthDate: e.target.value })}
                      className="w-full p-3 border rounded-lg"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCredentialModal(false)}
                className="flex-1 py-2 border rounded-lg hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateCredential}
                disabled={loading}
                className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Criando...' : 'Emitir Credencial'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Proof Modal */}
      {showProofModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Gerar Prova ZK</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tipo de Prova</label>
                <select
                  value={proofForm.type}
                  onChange={e => setProofForm({ ...proofForm, type: e.target.value as ZKProofType })}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="age_above">Verificacao de Idade</option>
                  <option value="citizenship">Nacionalidade</option>
                  <option value="not_in_blacklist">Sem Restricoes</option>
                  <option value="income_above">Renda Minima</option>
                  <option value="credit_score_above">Score de Credito</option>
                </select>
              </div>

              {proofForm.type === 'age_above' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Idade Minima</label>
                  <input
                    type="number"
                    value={proofForm.threshold}
                    onChange={e => setProofForm({ ...proofForm, threshold: e.target.value })}
                    className="w-full p-3 border rounded-lg"
                    min="0"
                  />
                </div>
              )}

              <div className="bg-purple-50 rounded-lg p-4 text-sm">
                <p className="font-medium text-purple-800 mb-2">O que acontece:</p>
                <p className="text-purple-700">
                  A prova sera gerada localmente no seu dispositivo. Seus dados reais NAO serao
                  transmitidos - apenas uma prova matematica de que voce atende ao criterio.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowProofModal(false)}
                className="flex-1 py-2 border rounded-lg hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateProof}
                disabled={loading}
                className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? 'Gerando...' : 'Gerar Prova'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}