/**
 * Verifiable Credentials (VC) Library
 * Implements W3C VC Data Model v1.1
 */

import { createHash } from '../utils/crypto';
import { signWithDID, verifyDIDSignature } from './did';

// Credential types
export type CredentialStatus = 'valid' | 'revoked' | 'expired' | 'suspended';

export type CredentialType =
  | 'VerifiableCredential'
  | 'PersonCredential'
  | 'AgeVerificationCredential'
  | 'AddressCredential'
  | 'EmploymentCredential'
  | 'KYCAccreditationCredential';

// W3C VC Data Model structure
export interface VerifiableCredential {
  '@context': string[];
  id: string;
  type: string[];
  issuer: string;
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: CredentialSubject;
  proof?: VerifiableProof;
}

export interface CredentialSubject {
  id?: string;
  type?: string;
  // Dynamic properties based on credential type
  [key: string]: any;
}

export interface VerifiablePresentation {
  '@context': string[];
  id?: string;
  type: string[];
  holder: string;
  verifiableCredential?: VerifiableCredential[];
  proof?: VerifiableProof;
}

export interface VerifiableProof {
  type: string;
  created: string;
  challenge?: string;
  domain?: string;
  proofPurpose: string;
  verificationMethod: string;
  proofValue: string;
}

// Credential schema definitions
export interface CredentialSchema {
  id: string;
  type: string;
  name?: string;
  description?: string;
}

export const CREDENTIAL_SCHEMAS: Record<CredentialType, CredentialSchema> = {
  'VerifiableCredential': {
    id: 'https://www.w3.org/2018/credentials/v1',
    type: 'JsonSchemaValidator2018'
  },
  'PersonCredential': {
    id: 'https://docs.dock.io/schemas/personCredential.json',
    type: 'JsonSchemaValidator2018',
    name: 'Person Credential',
    description: 'Verifies identity of a person with personal data'
  },
  'AgeVerificationCredential': {
    id: 'https://docs.dock.io/schemas/ageVerification.json',
    type: 'JsonSchemaValidator2018',
    name: 'Age Verification',
    description: 'Proves a person is above a minimum age without revealing birth date'
  },
  'AddressCredential': {
    id: 'https://docs.dock.io/schemas/addressCredential.json',
    type: 'JsonSchemaValidator2018',
    name: 'Address Credential',
    description: 'Verifies residential address'
  },
  'EmploymentCredential': {
    id: 'https://docs.dock.io/schemas/employmentCredential.json',
    type: 'JsonSchemaValidator2018',
    name: 'Employment Credential',
    description: 'Confirms employment status'
  },
  'KYCAccreditationCredential': {
    id: 'https://docs.dock.io/schemas/kycAccreditation.json',
    type: 'JsonSchemaValidator2018',
    name: 'KYC Accreditation',
    description: 'Confirms user completed KYC verification'
  }
};

// Issue a new verifiable credential
export async function issueCredential(
  issuerDid: string,
  holderDid: string,
  credentialType: CredentialType,
  subjectData: CredentialSubject,
  issuerPrivateKey: string,
  expirationDate?: string
): Promise<VerifiableCredential> {
  const credentialId = `urn:uuid:${generateUUID()}`;

  const credential: VerifiableCredential = {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://w3id.org/security/v1'
    ],
    id: credentialId,
    type: [
      'VerifiableCredential',
      credentialType
    ],
    issuer: issuerDid,
    issuanceDate: new Date().toISOString(),
    credentialSubject: {
      id: holderDid,
      type: credentialType,
      ...subjectData
    }
  };

  if (expirationDate) {
    credential.expirationDate = expirationDate;
  }

  // Create proof (signature)
  const credentialData = JSON.stringify(credential);
  const proofValue = await signWithDID(credentialData, issuerPrivateKey);

  credential.proof = {
    type: 'Ed25519Signature2018',
    created: new Date().toISOString(),
    proofPurpose: 'assertionMethod',
    verificationMethod: `${issuerDid}#keys-1`,
    proofValue
  };

  return credential;
}

// Verify a credential
export async function verifyCredential(
  credential: VerifiableCredential
): Promise<{
  verified: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Check expiration
  if (credential.expirationDate) {
    if (new Date(credential.expirationDate) < new Date()) {
      errors.push('Credential has expired');
    }
  }

  // 2. Check proof exists
  if (!credential.proof) {
    errors.push('No proof attached to credential');
    return { verified: false, errors, warnings };
  }

  // 3. Verify signature (requires issuer document)
  // In production, would resolve DID and verify with public key
  if (!credential.proof.proofValue) {
    errors.push('No proof value');
  }

  // 4. Check required fields
  if (!credential.issuer) errors.push('Missing issuer');
  if (!credential.issuanceDate) errors.push('Missing issuance date');
  if (!credential.credentialSubject) errors.push('Missing credential subject');

  // 5. Check context
  if (!credential['@context']?.includes('https://www.w3.org/2018/credentials/v1')) {
    warnings.push('Non-standard context');
  }

  return {
    verified: errors.length === 0,
    errors,
    warnings
  };
}

// Create a verifiable presentation (subset of credentials)
export function createPresentation(
  holderDid: string,
  credentials: VerifiableCredential[],
  challenge?: string
): VerifiablePresentation {
  return {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id: `urn:uuid:${generateUUID()}`,
    type: ['VerifiablePresentation'],
    holder: holderDid,
    verifiableCredential: credentials
  };
}

// Derive selective disclosure presentation (for ZKP)
export function deriveSelectiveCredential(
  credential: VerifiableCredential,
  fieldsToReveal: string[],
  challenge: string,
  nonce: string
): {
  revealedFields: Record<string, any>;
  proof: string;
} {
  // In production, use ZK proofs for selective disclosure
  // This is a simplified version showing the concept

  const revealedFields: Record<string, any> = {};

  // Only reveal requested fields
  for (const field of fieldsToReveal) {
    if (credential.credentialSubject[field] !== undefined) {
      revealedFields[field] = credential.credentialSubject[field];
    }
  }

  // Create proof of derivation
  const proofData = JSON.stringify({
    credentialId: credential.id,
    revealedFields,
    challenge,
    nonce
  });

  const proof = createHash('sha256').update(proofData).digest('hex');

  return {
    revealedFields,
    proof
  };
}

// Store credential locally
export function storeCredentialLocally(credential: VerifiableCredential): void {
  const storageKey = `vc_${credential.id}`;
  localStorage.setItem(storageKey, JSON.stringify(credential));

  // Also update user's credential list
  const listKey = 'vc_list';
  const list = JSON.parse(localStorage.getItem(listKey) || '[]');
  if (!list.includes(credential.id)) {
    list.push(credential.id);
    localStorage.setItem(listKey, JSON.stringify(list));
  }
}

// Get stored credential
export function getStoredCredential(credentialId: string): VerifiableCredential | null {
  const stored = localStorage.getItem(`vc_${credentialId}`);
  return stored ? JSON.parse(stored) : null;
}

// List all stored credentials
export function listStoredCredentials(): VerifiableCredential[] {
  const list = JSON.parse(localStorage.getItem('vc_list') || '[]');
  return list
    .map((id: string) => getStoredCredential(id))
    .filter((vc: VerifiableCredential | null) => vc !== null);
}

// Revoke credential (marks as revoked in local storage)
export function revokeCredential(credentialId: string): boolean {
  const credential = getStoredCredential(credentialId);
  if (!credential) return false;

  // Store revocation status
  localStorage.setItem(`revoked_${credentialId}`, JSON.stringify({
    revokedAt: new Date().toISOString()
  }));

  return true;
}

// Check if credential is revoked
export function isCredentialRevoked(credentialId: string): boolean {
  return localStorage.getItem(`revoked_${credentialId}`) !== null;
}

// Export credentials for backup
export function exportCredentialsBackup(): string {
  const credentials = listStoredCredentials();
  return JSON.stringify({
    credentials,
    exportedAt: new Date().toISOString(),
    version: '1.0'
  }, null, 2);
}

// Import credentials from backup
export function importCredentialsBackup(backupJson: string): {
  imported: number;
  failed: number;
} {
  try {
    const backup = JSON.parse(backupJson);
    let imported = 0;
    let failed = 0;

    for (const credential of backup.credentials || []) {
      try {
        if (credential.id && credential.type) {
          storeCredentialLocally(credential);
          imported++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    return { imported, failed };
  } catch {
    return { imported: 0, failed: 0 };
  }
}

// Generate UUID for credential IDs
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Format credential for display
export function formatCredentialDisplay(credential: VerifiableCredential): {
  title: string;
  subtitle: string;
  status: 'valid' | 'expired' | 'revoked';
  icon: string;
} {
  const type = credential.type[1] || credential.type[0];

  let title = 'Credential';
  let subtitle = '';
  let icon = 'Award';

  switch (type) {
    case 'PersonCredential':
      title = 'Identidade Pessoal';
      subtitle = credential.credentialSubject.name || 'Documento de identidade';
      icon = 'User';
      break;
    case 'AgeVerificationCredential':
      title = 'Verificacao de Idade';
      subtitle = `Maior de ${credential.credentialSubject.minimumAge || 18} anos`;
      icon = 'Calendar';
      break;
    case 'AddressCredential':
      title = 'Endereco Verificado';
      subtitle = credential.credentialSubject.address || 'Residencial';
      icon = 'MapPin';
      break;
    case 'EmploymentCredential':
      title = 'Vinculo Empregaticio';
      subtitle = credential.credentialSubject.employer || 'Empregador';
      icon = 'Briefcase';
      break;
    case 'KYCAccreditationCredential':
      title = 'Verificacao KYC';
      subtitle = 'Verificacao de identidade completa';
      icon = 'Shield';
      break;
  }

  let status: 'valid' | 'expired' | 'revoked' = 'valid';

  if (isCredentialRevoked(credential.id)) {
    status = 'revoked';
  } else if (credential.expirationDate && new Date(credential.expirationDate) < new Date()) {
    status = 'expired';
  }

  return { title, subtitle, status, icon };
}