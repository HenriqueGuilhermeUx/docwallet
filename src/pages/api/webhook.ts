/**
 * Didit Webhook Handler
 * Endpoint: https://docwallet.netlify.app/api/webhook
 *
 * Este arquivo deve ser configurado no painel Didit:
 * Settings > Webhooks > Add Webhook
 * URL: https://docwallet.netlify.app/api/webhook
 */

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    console.log('Didit Webhook received:', JSON.stringify(body, null, 2));

    const { event, user_id, did, credential_id, status, email } = body;

    // Verificar token do webhook (se configurado)
    const webhookSecret = import.meta.env.DIDIT_WEBHOOK_SECRET;
    const authHeader = request.headers.get('authorization');

    // Processar diferentes eventos
    switch (event) {
      case 'verification.completed':
        console.log(`Verificacao KYC concluida para usuario: ${user_id}`);
        // TODO: Atualizar status do usuario no Supabase
        // TODO: Gerar e armazenar DID
        // TODO: Notificar usuario
        break;

      case 'verification.failed':
        console.log(`Verificacao KYC falhou para usuario: ${user_id}`);
        // TODO: Notificar usuario sobre falha
        // TODO: Registrar erro
        break;

      case 'credential.issued':
        console.log(`Credencial emitida: ${credential_id} para usuario: ${user_id}`);
        // TODO: Armazenar credencial no Supabase
        // TODO: Notificar usuario
        break;

      case 'credential.revoked':
        console.log(`Credencial revogada: ${credential_id}`);
        // TODO: Atualizar status da credencial
        // TODO: Notificar usuario
        break;

      default:
        console.log(`Evento nao tratado: ${event}`);
    }

    // Responder sucesso
    return new Response(
      JSON.stringify({
        success: true,
        message: `Evento ${event} processado com sucesso`
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Erro ao processar webhook:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Erro ao processar webhook'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
};

// Handler para GET (verificacao de health)
export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      status: 'ok',
      service: 'DocWallet Webhook',
      timestamp: new Date().toISOString()
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
};