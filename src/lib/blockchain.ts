import { Alchemy, Network } from 'alchemy-sdk';

// Configuracao do Alchemy
const alchemy = new Alchemy({
  apiKey: import.meta.env.VITE_ALCHEMY_API_KEY,
  network: Network.MATIC_MAINNET,
});

// Endereco do contrato (vazio por enquanto - precisa deployar)
const CONTRACT_ADDRESS = import.meta.env.VITE_NOTARIZE_CONTRACT_ADDRESS || '';

// Endereco da carteira admin (paga o gas fee)
const ADMIN_WALLET_ADDRESS = import.meta.env.VITE_ADMIN_WALLET_ADDRESS || '';

// ABI do contrato (vai ser definido quando deployar)
const NOTARIZE_ABI = [
  'function notarizeDocument(string memory documentHash, string memory documentName) public returns (bool)',
  'function getNotarization(string memory documentHash) public view returns (address, uint256, string memory)',
];

export interface NotarizationResult {
  success: boolean;
  txHash: string;
  blockNumber?: number;
  hash: string;
  timestamp: string;
  gasUsed?: string;
  gasCost?: string;
  network?: string;
  error?: string;
}

export interface WalletInfo {
  address: string;
  balance: string;
  isValid: boolean;
}

/**
 * Calcula hash SHA-256 de um arquivo (no navegador - privado)
 */
export const calculateFileHash = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

/**
 * Obtem informacoes da carteira admin
 */
export const getWalletInfo = async (): Promise<WalletInfo> => {
  try {
    const provider = await alchemy.config.getProvider();
    const balance = await provider.getBalance(ADMIN_WALLET_ADDRESS);

    return {
      address: ADMIN_WALLET_ADDRESS,
      balance: formatMatic(balance.toString()),
      isValid: ADMIN_WALLET_ADDRESS.startsWith('0x') && ADMIN_WALLET_ADDRESS.length === 42,
    };
  } catch (error) {
    return {
      address: ADMIN_WALLET_ADDRESS,
      balance: '0',
      isValid: false,
    };
  }
};

/**
 * Autentica documento na blockchain (simulado)
 * ATENCAO: Para funcionar 100%, precisa:
 * 1. Deployar o contrato inteligente na Polygon
 * 2. Ter MATIC na carteira admin para pagar gas
 * 3. Configurar as env vars no Netlify
 */
export const notarizeDocument = async (
  fileHash: string,
  documentName: string
): Promise<NotarizationResult> => {
  try {
    // Verificar se tem contrato configurado
    if (!CONTRACT_ADDRESS) {
      // Modo demo - simular transacao
      console.log('Modo Demo: Simulando autenticacao blockchain...');

      await new Promise(resolve => setTimeout(resolve, 2000));

      const fakeTxHash = '0x' + Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('');

      return {
        success: true,
        txHash: fakeTxHash,
        blockNumber: 52000000 + Math.floor(Math.random() * 1000000),
        hash: fileHash,
        timestamp: new Date().toISOString(),
        network: 'polygon',
        gasCost: '0.001 MATIC (estimado)',
      };
    }

    // Modo producao - transacao real
    // Para isso, precisaria:
    // 1. Conectar carteira do admin via provider
    // 2. Assinar transacao com a carteira
    // 3. Enviar para o contrato

    const provider = await alchemy.config.getProvider();

    // Exemplo de como seria (comentar por enquanto)
    // const wallet = new Wallet(PRIVATE_KEY, provider);
    // const contract = new Contract(CONTRACT_ADDRESS, NOTARIZE_ABI, wallet);
    // const tx = await contract.notarizeDocument(fileHash, documentName);
    // await tx.wait();

    return {
      success: true,
      txHash: '',
      hash: fileHash,
      timestamp: new Date().toISOString(),
      error: 'Contrato nao configurado. Use o modo demo.',
    };
  } catch (error: any) {
    return {
      success: false,
      txHash: '',
      hash: fileHash,
      timestamp: new Date().toISOString(),
      error: error.message || 'Erro ao autenticar documento',
    };
  }
};

/**
 * Verifica se uma transacao foi confirmada na blockchain
 */
export const verifyTransaction = async (txHash: string): Promise<NotarizationResult | null> => {
  try {
    const provider = await alchemy.config.getProvider();
    const tx = await provider.getTransactionReceipt(txHash);

    if (tx) {
      return {
        success: tx.blockNumber !== null,
        txHash: txHash,
        blockNumber: tx.blockNumber || undefined,
        hash: '',
        timestamp: new Date().toISOString(),
        gasUsed: tx.gasUsed.toString(),
      };
    }
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Obtem o gas price atual da rede Polygon
 */
export const getGasPrice = async (): Promise<string> => {
  try {
    const provider = await alchemy.config.getProvider();
    const gasPrice = await provider.getFeeData();
    return gasPrice.gasPrice?.toString() || '100000000000';
  } catch (error) {
    return '100000000000';
  }
};

/**
 * Estima o custo de gas para uma transacao
 */
export const estimateGas = async (): Promise<number> => {
  const gas = await import.meta.env.VITE_NOTARIZE_CONTRACT_ADDRESS ? 100000 : 75000;
  return gas;
};

/**
 * Calcula custo estimado em MATIC
 */
export const estimateCost = async (): Promise<string> => {
  try {
    const gasPrice = await getGasPrice();
    const gasLimit = await estimateGas();
    const costWei = BigInt(gasPrice) * BigInt(gasLimit);
    return formatMatic(costWei.toString());
  } catch (error) {
    return '0.001';
  }
};

/**
 * Formata o valor em MATIC
 */
export const formatMatic = (wei: string | number): string => {
  const num = typeof wei === 'string' ? parseFloat(wei) : wei;
  return (num / 1e18).toFixed(6);
};

export { alchemy };
