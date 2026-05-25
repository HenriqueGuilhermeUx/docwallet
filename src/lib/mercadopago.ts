import { MercadoPagoConfig, Payment, PreApprovalPlan } from '@mercadopago/sdk-react';
import { createClient } from '@supabase/supabase-js';

// Config Mercado Pago (server-side access token)
const mercadopagoConfig = new MercadoPagoConfig({
  accessToken: import.meta.env.MERCADOPAGO_ACCESS_TOKEN || '',
});

// Precos dos creditos
export const CREDIT_PACKAGES = [
  { id: 'credits_5', name: '5 Creditos', credits: 5, price: 25, description: 'R$5 por documento' },
  { id: 'credits_10', name: '10 Creditos', credits: 10, price: 45, description: 'R$4.50 por documento' },
  { id: 'credits_20', name: '20 Creditos', credits: 20, price: 80, description: 'R$4 por documento' },
  { id: 'credits_50', name: '50 Creditos', credits: 50, price: 175, description: 'R$3.50 por documento' },
];

// Cria pagamento no Mercado Pago
export const createPayment = async (packageId: string, userId: string, userEmail: string) => {
  const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
  if (!pkg) throw new Error('Pacote invalido');

  try {
    const payment = new Payment(mercadopagoConfig);

    const response = await payment.create({
      body: {
        transaction_amount: pkg.price,
        description: `DocWallet - ${pkg.name}`,
        payment_method_id: 'pix',
        payer: {
          email: userEmail,
          identification: {
            type: 'CPF',
            number: '00000000000',
          },
        },
        metadata: {
          package_id: packageId,
          credits: pkg.credits,
          user_id: userId,
        },
      },
    });

    return {
      success: true,
      paymentId: response.id,
      status: response.status,
      pointOfInteraction: response.point_of_interaction,
    };
  } catch (error: any) {
    console.error('Erro Mercado Pago:', error);
    return {
      success: false,
      error: error.message || 'Erro ao criar pagamento',
    };
  }
};

// Verifica status do pagamento
export const checkPaymentStatus = async (paymentId: string) => {
  try {
    const payment = new Payment(mercadopagoConfig);
    const response = await payment.get(paymentId);
    return {
      status: response.status,
      statusDetail: response.status_detail,
    };
  } catch (error: any) {
    return {
      status: 'unknown',
      statusDetail: error.message,
    };
  }
};

// Adiciona creditos ao usuario (via backend/Supabase)
export const addCreditsToUser = async (userId: string, credits: number, paymentId: string) => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Configuracao Supabase incompleta');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Atualiza saldo de creditos
  const { error: updateError } = await supabase.rpc('add_user_credits', {
    p_user_id: userId,
    p_amount: credits,
  });

  if (updateError) {
    // Se a funcao nao existir, faz manualmente
    const { data: currentData, error: selectError } = await supabase
      .from('user_credits')
      .select('balance, total_purchased')
      .eq('user_id', userId)
      .single();

    if (selectError) {
      // Cria registro se nao existir
      await supabase.from('user_credits').insert({
        user_id: userId,
        balance: credits,
        total_purchased: credits,
        total_used: 0,
      });
    } else {
      await supabase
        .from('user_credits')
        .update({
          balance: currentData.balance + credits,
          total_purchased: currentData.total_purchased + credits,
        })
        .eq('user_id', userId);
    }
  }

  // Adiciona historico
  await supabase.from('credits_history').insert({
    user_id: userId,
    amount: credits,
    type: 'purchase',
    description: `Compra de ${credits} creditos`,
    payment_id: paymentId,
  });

  return { success: true };
};

// Verifica e atualiza creditos (chamado pelo webhook)
export const processPaymentWebhook = async (paymentId: string) => {
  const status = await checkPaymentStatus(paymentId);

  if (status.status === 'approved') {
    // Buscar dados do pagamento (precisa do backend real)
    // Por enquanto, apenas log
    console.log(`Pagamento ${paymentId} aprovado`);
    return { processed: true, status: 'approved' };
  }

  return { processed: false, status: status.status };
};

// Debita creditos do usuario
export const useCredits = async (userId: string, amount: number, description: string) => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Configuracao Supabase incompleta');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Busca saldo atual
  const { data, error } = await supabase
    .from('user_credits')
    .select('balance')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    throw new Error('Usuario nao encontrado');
  }

  if (data.balance < amount) {
    throw new Error('Creditos insuficientes');
  }

  // Debita creditos
  await supabase
    .from('user_credits')
    .update({
      balance: data.balance - amount,
      total_used: amount,
    })
    .eq('user_id', userId);

  // Adiciona historico
  await supabase.from('credits_history').insert({
    user_id: userId,
    amount: -amount,
    type: 'use',
    description,
  });

  return { success: true, newBalance: data.balance - amount };
};

// Busca creditos do usuario
export const getUserCredits = async (userId: string) => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Configuracao Supabase incompleta');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from('user_credits')
    .select('balance, total_purchased, total_used')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return { balance: 0, totalPurchased: 0, totalUsed: 0 };
  }

  return {
    balance: data.balance,
    totalPurchased: data.total_purchased,
    totalUsed: data.total_used,
  };
};

// Busca historico de creditos
export const getCreditsHistory = async (userId: string) => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Configuracao Supabase incompleta');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from('credits_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return [];
  }

  return data;
};
