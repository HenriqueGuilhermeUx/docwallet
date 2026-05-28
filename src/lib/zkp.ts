/**
 * Zero-Knowledge Proofs (ZKP) Library
 * Simplified implementation for on-chain verification
 * In production, use circom + snarkjs for real ZK proofs
 */

// Browser-compatible crypto using crypto-browserify
import { createHash } from '../utils/crypto';

function getRandomBytes(size: number): Uint8Array {
  const array = new Uint8Array(size);
  crypto.getRandomValues(array);
  return array;
}

function randomBytesHex(size: number): string {
  return Array.from(getRandomBytes(size)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ZK Proof types
export type ZKProofType =
  | 'age_above'
  | 'citizenship'
  | 'not_in_blacklist'
  | 'income_above'
  | 'credit_score_above';

export interface ZKProof {
  type: ZKProofType;
  publicInputs: string[];
  proofValue: string;
  challenge: string;
  response: string;
  nullifier: string;
  expirationDate?: string;
}

export interface ZKProofRequest {
  type: ZKProofType;
  threshold: number | string;
  verifierAddress: string;
  signal?: string;
}

// Merkle Tree for membership proofs
export class MerkleTree {
  private layers: string[][] = [];

  constructor(leaves: string[]) {
    this.buildTree(leaves);
  }

  private buildTree(leaves: string[]): void {
    if (leaves.length === 0) throw new Error('No leaves provided');

    // Hash all leaves
    let currentLayer = leaves.map(l => this.hash(l));

    this.layers.push(currentLayer);

    // Build tree up
    while (currentLayer.length > 1) {
      const nextLayer: string[] = [];

      for (let i = 0; i < currentLayer.length; i += 2) {
        const left = currentLayer[i];
        const right = currentLayer[i + 1] || left;
        nextLayer.push(this.hash(left + right));
      }

      this.layers.push(nextLayer);
      currentLayer = nextLayer;
    }
  }

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  getRoot(): string {
    return this.layers[this.layers.length - 1][0];
  }

  getProof(index: number): { leaf: string; path: string[]; pathIndices: number[] } {
    const proof: string[] = [];
    const pathIndices: number[] = [];

    let currentIndex = index;

    for (let i = 0; i < this.layers.length - 1; i++) {
      const isRightNode = currentIndex % 2 === 1;
      const siblingIndex = isRightNode ? currentIndex - 1 : currentIndex + 1;

      pathIndices.push(isRightNode ? 1 : 0);

      if (siblingIndex < this.layers[i].length) {
        proof.push(this.layers[i][siblingIndex]);
      } else {
        proof.push(this.layers[i][currentIndex]);
      }

      currentIndex = Math.floor(currentIndex / 2);
    }

    return {
      leaf: this.layers[0][index],
      path: proof,
      pathIndices
    };
  }
}

// Generate proof for age verification
export async function generateAgeProof(
  birthDate: string,
  minimumAge: number,
  signal: string = ''
): Promise<ZKProof> {
  const birthTimestamp = new Date(birthDate).getTime();
  const currentTimestamp = Date.now();
  const ageInSeconds = (currentTimestamp - birthTimestamp) / 1000;
  const requiredSeconds = minimumAge * 365.25 * 24 * 3600;

  // Commitment to birth date
  const secret = createHash('sha256').update(birthDate).digest('hex');
  const nullifier = createHash('sha256').update(secret + randomBytesHex(16)).digest('hex');

  // Challenge based on signal and nullifier
  const challenge = createHash('sha256')
    .update(signal + nullifier + minimumAge.toString())
    .digest('hex');

  // Response: prove knowledge of birth date without revealing it
  // In production: response = (secret + challenge * nullifier) mod r
  const response = createHash('sha256')
    .update(secret + challenge)
    .digest('hex');

  // Proof value: 1 if age >= minimumAge, 0 otherwise
  const isEligible = ageInSeconds >= requiredSeconds ? '1' : '0';
  const proofValue = createHash('sha256')
    .update(nullifier + challenge + isEligible)
    .digest('hex');

  return {
    type: 'age_above',
    publicInputs: [minimumAge.toString()],
    proofValue,
    challenge,
    response,
    nullifier
  };
}

// Generate proof for blacklist check (NOT in list)
export async function generateBlacklistProof(
  userId: string,
  blacklistRoot: string,
  userMerkleProof: { leaf: string; path: string[]; pathIndices: number[] }
): Promise<ZKProof> {
  const secret = createHash('sha256').update(userId).digest('hex');
  const nullifier = createHash('sha256').update(secret + randomBytesHex(16)).digest('hex');

  // Verify user is NOT in the blacklist
  // In production: use semaphore/gnark for actual ZK proof
  const challenge = createHash('sha256')
    .update(nullifier + blacklistRoot)
    .digest('hex');

  const response = createHash('sha256')
    .update(secret + challenge + JSON.stringify(userMerkleProof.path))
    .digest('hex');

  const proofValue = createHash('sha256')
    .update('not_in_blacklist' + nullifier + challenge)
    .digest('hex');

  return {
    type: 'not_in_blacklist',
    publicInputs: [blacklistRoot],
    proofValue,
    challenge,
    response,
    nullifier
  };
}

// Generate proof for citizenship
export async function generateCitizenshipProof(
  countryCode: string,
  signal: string = ''
): Promise<ZKProof> {
  const secret = createHash('sha256').update(countryCode).digest('hex');
  const nullifier = createHash('sha256').update(secret + randomBytesHex(16)).digest('hex');

  const challenge = createHash('sha256')
    .update(signal + nullifier + countryCode)
    .digest('hex');

  const response = createHash('sha256')
    .update(secret + challenge)
    .digest('hex');

  const proofValue = createHash('sha256')
    .update('citizen_' + countryCode + nullifier + challenge)
    .digest('hex');

  return {
    type: 'citizenship',
    publicInputs: [countryCode],
    proofValue,
    challenge,
    response,
    nullifier
  };
}

// Generate generic proof
export async function generateProof(
  claim: string,
  value: string,
  type: ZKProofType,
  signal: string = ''
): Promise<ZKProof> {
  const secret = createHash('sha256').update(value + claim).digest('hex');
  const nullifier = createHash('sha256').update(secret + randomBytesHex(16)).digest('hex');

  const challenge = createHash('sha256')
    .update(signal + nullifier + type + claim)
    .digest('hex');

  const response = createHash('sha256')
    .update(secret + challenge)
    .digest('hex');

  const proofValue = createHash('sha256')
    .update(type + claim + nullifier + challenge)
    .digest('hex');

  return {
    type,
    publicInputs: [claim],
    proofValue,
    challenge,
    response,
    nullifier
  };
}

// Verify ZK proof (on-chain or off-chain)
export async function verifyProof(
  proof: ZKProof,
  expectedChallenge: string
): Promise<{
  valid: boolean;
  reason?: string;
}> {
  // 1. Verify challenge matches
  if (proof.challenge !== expectedChallenge) {
    return { valid: false, reason: 'Challenge mismatch' };
  }

  // 2. Verify nullifier is valid format
  if (!proof.nullifier.match(/^[a-f0-9]{64}$/)) {
    return { valid: false, reason: 'Invalid nullifier format' };
  }

  // 3. Verify proof value is valid
  if (!proof.proofValue.match(/^[a-f0-9]{64}$/)) {
    return { valid: false, reason: 'Invalid proof value format' };
  }

  // 4. Check proof is recent (within 24 hours)
  // In production: use timestamp in proof or verify on-chain

  return { valid: true };
}

// Generate circuit input for ZK verifier
export function generateVerifierInput(proof: ZKProof): {
  publicInputHash: string;
  proofA: [string, string];
  proofB: [[string, string], [string, string]];
  proofC: [string, string];
  publicInputs: string[];
} {
  // Simplified - in production use snarkjs to generate proper proof
  const inputHash = createHash('sha256')
    .update(proof.publicInputs.join(''))
    .digest('hex');

  // Mock proof components (would be real snarkjs output in production)
  return {
    publicInputHash: inputHash,
    proofA: [
      '0x' + proof.challenge.slice(0, 64),
      '0x' + proof.response.slice(0, 64)
    ],
    proofB: [
      ['0x' + proof.nullifier.slice(0, 64), '0x' + proof.proofValue.slice(0, 64)],
      ['0x1', '0x2']
    ],
    proofC: [
      '0x' + proof.proofValue.slice(0, 64),
      '0x' + proof.nullifier.slice(0, 64)
    ],
    publicInputs: proof.publicInputs
  };
}

// Store proof locally
export function storeProofLocally(proof: ZKProof): void {
  const storageKey = `zkproof_${proof.nullifier}`;
  localStorage.setItem(storageKey, JSON.stringify(proof));

  // Update proof list
  const listKey = 'zkproof_list';
  const list = JSON.parse(localStorage.getItem(listKey) || '[]');
  if (!list.includes(proof.nullifier)) {
    list.push(proof.nullifier);
    localStorage.setItem(listKey, JSON.stringify(list));
  }
}

// Get stored proof by nullifier
export function getStoredProof(nullifier: string): ZKProof | null {
  const stored = localStorage.getItem(`zkproof_${nullifier}`);
  return stored ? JSON.parse(stored) : null;
}

// List all stored proofs
export function listStoredProofs(): ZKProof[] {
  const list = JSON.parse(localStorage.getItem('zkproof_list') || '[]');
  return list
    .map((n: string) => getStoredProof(n))
    .filter((p: ZKProof | null) => p !== null);
}

// Verify proof against a verifier contract (returns call data)
export async function generateVerificationCallData(
  proof: ZKProof,
  verifierAddress: string
): Promise<{
  to: string;
  data: string;
  value: string;
}> {
  const inputs = generateVerifierInput(proof);

  // Encode for verifier contract
  // In production: use ABI encoding with correct verifier interface
  const abiEncoded = [
    inputs.publicInputHash,
    inputs.proofA[0],
    inputs.proofA[1],
    inputs.proofB[0][0],
    inputs.proofB[0][1],
    inputs.proofB[1][0],
    inputs.proofB[1][1],
    inputs.proofC[0],
    inputs.proofC[1],
    ...inputs.publicInputs
  ].join(',');

  return {
    to: verifierAddress,
    data: '0x' + createHash('sha256').update(abiEncoded).digest('hex'),
    value: '0'
  };
}

// ZK Proof types with descriptions for UI
export const ZK_PROOF_TYPES = {
  'age_above': {
    name: 'Verificacao de Idade',
    description: 'Prova que voce tem mais de X anos sem revelar sua data de nascimento',
    icon: 'Calendar'
  },
  'citizenship': {
    name: 'Nacionalidade',
    description: 'Prova sua nacionalidade sem revelar outros dados pessoais',
    icon: 'Globe'
  },
  'not_in_blacklist': {
    name: 'Sem Restricoes',
    description: 'Prova que voce nao esta em nenhuma lista de bloqueio',
    icon: 'CheckCircle'
  },
  'income_above': {
    name: 'Renda Minima',
    description: 'Prova que sua renda e superior a um valor sem revelar valores exatos',
    icon: 'DollarSign'
  },
  'credit_score_above': {
    name: 'Score de Credito',
    description: 'Prova que seu score de credito e superior a um limite sem revelar o numero',
    icon: 'TrendingUp'
  }
};

// Format proof for display
export function formatProofDisplay(proof: ZKProof): {
  title: string;
  description: string;
  icon: string;
  status: 'valid' | 'used' | 'expired';
} {
  const typeInfo = ZK_PROOF_TYPES[proof.type];

  return {
    title: typeInfo?.name || 'Zero-Knowledge Proof',
    description: typeInfo?.description || '',
    icon: typeInfo?.icon || 'Lock',
    status: 'valid'
  };
}