import { Code2, KeyRound, ShieldCheck, Webhook } from 'lucide-react';

const endpoints = [
  { method: 'POST', path: '/documents/hash', description: 'Calcular ou registrar hash de documento.' },
  { method: 'POST', path: '/certificates', description: 'Criar certificado de integridade.' },
  { method: 'GET', path: '/certificates/{id}', description: 'Consultar certificado publico.' },
  { method: 'POST', path: '/signatures/request', description: 'Criar pedido de assinatura.' },
  { method: 'POST', path: '/webhooks', description: 'Receber eventos de assinatura e certificado.' },
];

export function ApiFuturePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-950 text-white border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center"><Code2 size={22} /></div>
            <div>
              <p className="font-bold text-lg">DocWallet API</p>
              <p className="text-xs text-slate-400">Em breve</p>
            </div>
          </a>
          <a href="/" className="text-sm text-slate-300 hover:text-white">Voltar</a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 md:p-10">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold mb-4">
            <Code2 size={16} /> API futura
          </div>
          <h1 className="text-4xl font-bold text-slate-900 leading-tight">Infraestrutura de documentos, assinaturas e certificados para integrar no seu sistema.</h1>
          <p className="text-slate-600 mt-4 text-lg leading-relaxed max-w-3xl">
            A API do DocWallet sera pensada para empresas que querem gerar hashes, certificados publicos, links de assinatura e trilhas de auditoria sem construir tudo do zero.
          </p>
        </section>

        <section className="grid md:grid-cols-3 gap-5 mt-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <KeyRound className="text-indigo-600 mb-4" size={30} />
            <h2 className="text-xl font-bold text-slate-900">API keys</h2>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">Chaves por empresa, limites de uso, logs e controle de acesso.</p>
          </div>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <Webhook className="text-indigo-600 mb-4" size={30} />
            <h2 className="text-xl font-bold text-slate-900">Webhooks</h2>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">Eventos de documento criado, assinatura concluida, certificado emitido e falha de validacao.</p>
          </div>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <ShieldCheck className="text-indigo-600 mb-4" size={30} />
            <h2 className="text-xl font-bold text-slate-900">Verificacao publica</h2>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">Endpoints e paginas publicas para terceiros verificarem certificados.</p>
          </div>
        </section>

        <section className="bg-slate-950 text-white rounded-3xl mt-6 p-6 md:p-8">
          <h2 className="text-2xl font-bold">Endpoints previstos</h2>
          <div className="mt-5 space-y-3">
            {endpoints.map((item) => (
              <div key={item.path} className="bg-white/10 border border-white/10 rounded-2xl p-4 grid md:grid-cols-[90px_1fr_1.2fr] gap-3 text-sm">
                <span className="font-bold text-emerald-300">{item.method}</span>
                <code className="text-indigo-200">{item.path}</code>
                <span className="text-slate-300">{item.description}</span>
              </div>
            ))}
          </div>
          <a href="mailto:suporte@docwallet.app?subject=Tenho%20interesse%20na%20API%20DocWallet" className="mt-6 inline-flex px-5 py-3 bg-white text-slate-950 rounded-xl font-semibold text-sm hover:bg-slate-100">
            Quero entrar na lista da API
          </a>
        </section>
      </main>
    </div>
  );
}
