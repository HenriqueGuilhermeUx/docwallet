/**
 * Didit SDK Integration
 * Verifiable Credentials & Decentralized Identity
 *
 * API Key: QlHpB0a8_xm1Zcz7PJTVfiStl-XMMYuCVhkg5UpZ4vk
 */

const DIDIT_API_KEY = 'QlHpB0a8_xm1Zcz7PJTVfiStl-XMMYuCVhkg5UpZ4vk';
const DIDIT_API_URL = 'https://api.didit.io/api/v1';

export interface DiditUser {
  id: string;
  email: string;
  did?: string;
  status: 'pending' | 'verified' | 'failed' | 'kyc_verified';
}

export interface DiditVerificationRequest {
  email: string;
  redirectUrl?: string;
  metadata?: Record<string, any>;
}

export interface DiditVerificationResult {
  id: string;
  status: 'pending' | 'completed' | 'failed';
  userId?: string;
  did?: string;
  level?: 'basic' | 'advanced' | 'plus';
  error?: string;
}

export interface DiditCredential {
  id: string;
  type: string;
  userId: string;
  issuedAt: string;
  expiresAt?: string;
  revoked: boolean;
  data: Record<string, any>;
}

export interface DiditVCRequest {
  userId: string;
  credentialType: string;
  claims: Record<string, any>;
  expirationDate?: string;
}

/**
 * SDK cliente para Didit
 */
class DiditSDK {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string = DIDIT_API_KEY) {
    this.apiKey = apiKey;
    this.baseUrl = DIDIT_API_URL;
  }

  /**
   * Headers padrao para todas as requisicoes
   */
  private getHeaders(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Iniciar verificacao de identidade
   * Gera link para o usuario completar KYC
   */
  async createVerification(params: DiditVerificationRequest): Promise<{
    verificationId: string;
    verificationUrl: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/verifications`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          email: params.email,
          redirect_url: params.redirectUrl || window.location.origin,
          metadata: params.metadata || {}
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar verificacao');
      }

      const data = await response.json();

      return {
        verificationId: data.id,
        verificationUrl: data.url
      };
    } catch (error: any) {
      console.error('Erro Didit createVerification:', error);
      throw error;
    }
  }

  /**
   * Verificar status de uma verificacao
   */
  async getVerificationStatus(verificationId: string): Promise<DiditVerificationResult> {
    try {
      const response = await fetch(`${this.baseUrl}/verifications/${verificationId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao buscar status');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Erro Didit getVerificationStatus:', error);
      throw error;
    }
  }

  /**
   * Obter usuario pelo email
   */
  async getUser(email: string): Promise<DiditUser | null> {
    try {
      const response = await fetch(`${this.baseUrl}/users?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error('Erro ao buscar usuario');
      }

      const data = await response.json();
      return data.users?.[0] || null;
    } catch (error: any) {
      console.error('Erro Didit getUser:', error);
      return null;
    }
  }

  /**
   * Criar DID para usuario
   */
  async createDID(userId: string): Promise<{
    did: string;
    document: Record<string, any>;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/identifiers`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar DID');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Erro Didit createDID:', error);
      throw error;
    }
  }

  /**
   * Emitir credencial verificavel
   */
  async issueCredential(params: DiditVCRequest): Promise<DiditCredential> {
    try {
      const response = await fetch(`${this.baseUrl}/credentials`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          user_id: params.userId,
          type: params.credentialType,
          claims: params.claims,
          expiration_date: params.expirationDate
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao emitir credencial');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Erro Didit issueCredential:', error);
      throw error;
    }
  }

  /**
   * Listar credenciais de um usuario
   */
  async listCredentials(userId: string): Promise<DiditCredential[]> {
    try {
      const response = await fetch(`${this.baseUrl}/credentials?user_id=${userId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error('Erro ao listar credenciais');
      }

      const data = await response.json();
      return data.credentials || [];
    } catch (error: any) {
      console.error('Erro Didit listCredentials:', error);
      return [];
    }
  }

  /**
   * Revogar credencial
   */
  async revokeCredential(credentialId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/credentials/${credentialId}/revoke`, {
        method: 'POST',
        headers: this.getHeaders()
      });

      return response.ok;
    } catch (error: any) {
      console.error('Erro Didit revokeCredential:', error);
      return false;
    }
  }

  /**
   * Verificar credencial
   */
  async verifyCredential(credentialId: string): Promise<{
    valid: boolean;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/credentials/${credentialId}/verify`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        return { valid: false, error: error.message };
      }

      return { valid: true };
    } catch (error: any) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Gerar link de verificacao com уровень específico
   */
  async createVerificationLink(params: {
    email: string;
    level: 'basic' | 'advanced' | 'plus';
    redirectUrl?: string;
  }): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/verifications/link`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          email: params.email,
          level: params.level,
          redirect_url: params.redirectUrl || window.location.origin
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar link');
      }

      const data = await response.json();
      return data.url;
    } catch (error: any) {
      console.error('Erro Didit createVerificationLink:', error);
      throw error;
    }
  }

  /**
   * Webhook para receber eventos de verificacao
   * Configure no painel Didit: Settings > Webhooks
   */
  async processWebhook(payload: Record<string, any>): Promise<{
    type: string;
    userId?: string;
    did?: string;
  }> {
    // Processar eventos do webhook
    switch (payload.event) {
      case 'verification.completed':
        return {
          type: 'verification.completed',
          userId: payload.user_id,
          did: payload.did
        };
      case 'credential.issued':
        return {
          type: 'credential.issued',
          userId: payload.user_id
        };
      case 'credential.revoked':
        return {
          type: 'credential.revoked',
          userId: payload.user_id
        };
      default:
        return { type: payload.event || 'unknown' };
    }
  }
}

// Instancia unica do SDK
export const didit = new DiditSDK();

// Exportar tipos para uso no frontend
export type {
  DiditUser,
  DiditVerificationRequest,
  DiditVerificationResult,
  DiditCredential,
  DiditVCRequest
};
