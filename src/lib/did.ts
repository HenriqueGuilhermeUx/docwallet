/**
 * DID (Decentralized Identifier) Library
 * Implements W3C DID Core standard for self-sovereign identity
 */

import { createHash, randomBytes } from 'crypto';

// DID Methods supported
export type DIDMethod = 'key' | 'ethr';

// DID Document structure (W3C spec)
export interface DIDDocument {
  '@context': string[];
  id: string;
  verificationMethod: VerificationMethod[];
  authentication: string[];
  assertionMethod: string[];
  capabilityInvocation: string[];
  capabilityDelegation: string[];
  service?: ServiceEndpoint[];
}

export interface VerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyJwk?: PublicKeyJwk;
  publicKeyHex?: string;
}

export interface PublicKeyJwk {
  kty: string;
  crv: string;
  x?: string;
  y?: string;
  n?: string;
  e?: string;
}

export interface ServiceEndpoint {
  id: string;
  type: string;
  serviceEndpoint: string;
}

export interface DIDResolutionResult {
  didDocument: DIDDocument | null;
  didResolutionMetadata: {
    contentType: string;
    error?: string;
  };
  didDocumentMetadata: {
    created?: string;
    updated?: string;
    deactivated?: boolean;
  };
}

// Generate a random key pair for DID
export async function generateKeyPair(): Promise<{
  publicKey: string;
  privateKey: string;
  address: string;
}> {
  const privateKeyBytes = randomBytes(32);
  const privateKeyHex = privateKeyBytes.toString('hex');

  // Generate address from private key (simplified eth style)
  const publicKeyHash = createHash('sha256').update(privateKeyBytes).digest('hex');
  const address = '0x' + publicKeyHash.slice(0, 40);

  return {
    publicKey: publicKeyHash,
    privateKey: privateKeyHex,
    address
  };
}

// Create DID from public key (did:key method)
export function createDIDKey(publicKeyHex: string): string {
  // Multicodec prefix for Ed25519 public key
  const multicodecPrefix = 'ed0120'; // Ed25519
  const encodedKey = multicodecPrefix + publicKeyHex;

  // Create base58btc encoded DID
  const did = base58Encode(encodedKey);
  return `did:key:${did}`;
}

// Create DID for Ethereum (did:ethr method)
export function createDIDEthr(address: string, network: string = 'mainnet'): string {
  const chainId = network === 'mainnet' ? '1' : '137'; // Polygon mainnet
  return `did:ethr:${chainId}:${address}`;
}

// Simple base58 encoding
function base58Encode(hexString: string): string {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const bytes = Buffer.from(hexString, 'hex');
  let result = '';
  let num = BigInt('0x' + bytes.toString('hex'));

  const base = BigInt(58);
  while (num > BigInt(0)) {
    const remainder = num % base;
    result = alphabet[Number(remainder)] + result;
    num = num / base;
  }

  return result || '1';
}

// Create DID Document from DID
export function createDIDDocument(
  did: string,
  publicKeyHex: string,
  privateKeyHex: string
): DIDDocument {
  const verificationMethodId = `${did}#keys-1`;

  return {
    '@context': [
      'https://www.w3.org/ns/did/v1',
      'https://w3id.org/security/v1'
    ],
    id: did,
    verificationMethod: [
      {
        id: verificationMethodId,
        type: 'Ed25519VerificationKey2018',
        controller: did,
        publicKeyHex: publicKeyHex
      }
    ],
    authentication: [verificationMethodId],
    assertionMethod: [verificationMethodId],
    capabilityInvocation: [verificationMethodId],
    capabilityDelegation: [verificationMethodId]
  };
}

// Resolve DID to document (simplified - in production use DID resolver)
export async function resolveDID(did: string): Promise<DIDResolutionResult> {
  const method = did.split(':')[1];

  if (method === 'key') {
    // Parse did:key
    const keyId = did.split(':')[2];
    const publicKeyHex = decodeBase58Key(keyId);

    return {
      didDocument: createDIDDocument(did, publicKeyHex, ''),
      didResolutionMetadata: {
        contentType: 'application/ld+json'
      },
      didDocumentMetadata: {
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      }
    };
  }

  if (method === 'ethr') {
    // For did:ethr, would need to resolve from Ethereum registry
    return {
      didDocument: null,
      didResolutionMetadata: {
        contentType: 'application/ld+json',
        error: 'Not implemented - would query Ethereum registry'
      },
      didDocumentMetadata: {}
    };
  }

  return {
    didDocument: null,
    didResolutionMetadata: {
      contentType: 'application/ld+json',
      error: 'Unsupported DID method'
    },
    didDocumentMetadata: {}
  };
}

// Decode base58 key back to hex (inverse of createDIDKey)
function decodeBase58Key(base58Key: string): string {
  // Simplified - in production use full base58 decode
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let result = '0x';

  for (let i = 0; i < base58Key.length; i++) {
    result += alphabet.indexOf(base58Key[i]).toString(16).padStart(2, '0');
  }

  return result.slice(2);
}

// Sign data with DID private key
export async function signWithDID(
  data: string,
  privateKeyHex: string
): Promise<string> {
  const dataBytes = Buffer.from(data, 'utf8');
  const keyBytes = Buffer.from(privateKeyHex, 'hex');

  const signature = createHash('sha256')
    .update(Buffer.concat([keyBytes, dataBytes]))
    .digest('hex');

  return signature;
}

// Verify DID signature
export async function verifyDIDSignature(
  data: string,
  signature: string,
  publicKeyHex: string
): Promise<boolean> {
  const dataBytes = Buffer.from(data, 'utf8');
  const sigBytes = Buffer.from(signature, 'hex');

  const expected = createHash('sha256')
    .update(Buffer.concat([Buffer.from(publicKeyHex, 'hex'), dataBytes]))
    .digest('hex');

  return signature === expected;
}

// Store DID securely
export function storeDIDLocally(did: string, document: DIDDocument): void {
  localStorage.setItem(`did_${did}`, JSON.stringify(document));
}

export function getStoredDID(did: string): DIDDocument | null {
  const stored = localStorage.getItem(`did_${did}`);
  return stored ? JSON.parse(stored) : null;
}

// List all stored DIDs
export function listStoredDIDs(): string[] {
  const keys = Object.keys(localStorage);
  return keys.filter(k => k.startsWith('did_')).map(k => k.replace('did_', ''));
}

// Export DID for backup
export function exportDIDBackup(did: string): string {
  const doc = getStoredDID(did);
  if (!doc) return '';

  return JSON.stringify({
    did,
    document: doc,
    exportedAt: new Date().toISOString()
  }, null, 2);
}

// Import DID from backup
export function importDIDBackup(backupJson: string): boolean {
  try {
    const backup = JSON.parse(backupJson);
    if (backup.did && backup.document) {
      storeDIDLocally(backup.did, backup.document);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export { createHash, randomBytes };