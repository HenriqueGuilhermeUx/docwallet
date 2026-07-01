import { BrowserProvider, formatEther, getAddress, parseEther } from 'ethers';
import { hashToCalldata } from './hash';

type EthereumProvider = {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export interface WalletConnection {
  address: string;
  chainId: number;
  balance: string;
}

export interface BlockchainReceipt {
  walletAddress: string;
  chainId: number;
  networkName: string;
  txHash: string;
  blockNumber: number | null;
  explorerUrl: string;
  pricePaid: string;
  currency: string;
  timestamp: string;
}

const getRequiredTreasuryAddress = (): string => {
  const configured = import.meta.env.VITE_DOCWALLET_TREASURY_ADDRESS;

  if (!configured) {
    throw new Error('Configure VITE_DOCWALLET_TREASURY_ADDRESS no Netlify para receber pagamentos cripto.');
  }

  return getAddress(configured);
};

export const getTargetChain = () => {
  const chainId = Number(import.meta.env.VITE_DOCWALLET_CHAIN_ID || '137');
  const networkName = import.meta.env.VITE_DOCWALLET_NETWORK_NAME || 'Polygon';
  const rpcUrl = import.meta.env.VITE_DOCWALLET_RPC_URL || 'https://polygon-rpc.com';
  const explorerUrl = import.meta.env.VITE_DOCWALLET_EXPLORER_URL || 'https://polygonscan.com/tx';
  const nativeName = import.meta.env.VITE_DOCWALLET_NATIVE_NAME || 'POL';
  const nativeSymbol = import.meta.env.VITE_DOCWALLET_NATIVE_SYMBOL || 'POL';
  const nativeDecimals = Number(import.meta.env.VITE_DOCWALLET_NATIVE_DECIMALS || '18');

  return {
    chainId,
    chainIdHex: `0x${chainId.toString(16)}`,
    networkName,
    rpcUrl,
    explorerUrl,
    nativeCurrency: {
      name: nativeName,
      symbol: nativeSymbol,
      decimals: nativeDecimals,
    },
  };
};

const getBrowserProvider = (): BrowserProvider => {
  if (!window.ethereum) {
    throw new Error('Carteira cripto não encontrada. Instale MetaMask, Rabby ou abra em um navegador com carteira Web3.');
  }

  return new BrowserProvider(window.ethereum as any);
};

export const connectWallet = async (): Promise<WalletConnection> => {
  const provider = getBrowserProvider();
  const accounts = await provider.send('eth_requestAccounts', []);

  if (!accounts?.[0]) {
    throw new Error('Nenhuma conta foi conectada.');
  }

  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const network = await provider.getNetwork();
  const balance = await provider.getBalance(address);

  return {
    address,
    chainId: Number(network.chainId),
    balance: formatEther(balance),
  };
};

export const ensureTargetChain = async (): Promise<void> => {
  if (!window.ethereum) {
    throw new Error('Carteira cripto não encontrada.');
  }

  const target = getTargetChain();

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: target.chainIdHex }],
    });
  } catch (error: any) {
    if (error?.code !== 4902) {
      throw error;
    }

    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: target.chainIdHex,
        chainName: target.networkName,
        nativeCurrency: target.nativeCurrency,
        rpcUrls: [target.rpcUrl],
        blockExplorerUrls: [target.explorerUrl.replace(/\/tx\/?$/i, '')],
      }],
    });
  }
};

export const notarizeHashOnChain = async (hash: string): Promise<BlockchainReceipt> => {
  await ensureTargetChain();

  const provider = getBrowserProvider();
  const signer = await provider.getSigner();
  const walletAddress = await signer.getAddress();
  const target = getTargetChain();
  const treasuryAddress = getRequiredTreasuryAddress();
  const pricePaid = import.meta.env.VITE_DOCWALLET_NOTARIZATION_PRICE_NATIVE || '0.01';
  const currency = target.nativeCurrency.symbol;

  const tx = await signer.sendTransaction({
    to: treasuryAddress,
    value: parseEther(pricePaid),
    data: hashToCalldata(hash),
  });

  const receipt = await tx.wait();

  return {
    walletAddress,
    chainId: target.chainId,
    networkName: target.networkName,
    txHash: tx.hash,
    blockNumber: receipt?.blockNumber ?? null,
    explorerUrl: `${target.explorerUrl}/${tx.hash}`,
    pricePaid,
    currency,
    timestamp: new Date().toISOString(),
  };
};
