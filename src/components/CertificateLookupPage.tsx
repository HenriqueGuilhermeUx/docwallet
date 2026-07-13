import { useState } from 'react';
import type { FormEvent } from 'react';
import { Search, ShieldCheck } from 'lucide-react';

export function CertificateLookupPage() {
  const [code, setCode] = useState('');

  const cleanCode = code.trim();
  const canSearch = cleanCode.length > 0;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSearch) return;
    window.location.href = `/cert/${encodeURIComponent(cleanCode)}`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-950 text-white border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center"><ShieldCheck size={22} /></div>
            <div>
              <p className="font-bold text-lg">DocWallet</p>
              <p className="text-xs text-slate-400">Verificacao publica</p>
            </div>
          </a>
          <a href="/" className="text-sm text-slate-300 hover:text-white">Voltar</a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 md:p-10 text-center">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Search size={30} />
          </div>
          <h1 className="text-4xl font-bold text-slate-900">Verificar certificado DocWallet</h1>
          <p className="text-slate-600 mt-4 max-w-2xl mx-auto leading-relaxed">
            Digite o codigo do certificado para abrir a pagina publica com hash, registro, status e evidencias disponiveis.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 max-w-xl mx-auto flex flex-col sm:flex-row gap-3">
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Ex: cert_... ou codigo informado no certificado"
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              disabled={!canSearch}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              Verificar
            </button>
          </form>
        </section>

        <section className="grid md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <p className="font-bold text-slate-900">Hash do arquivo</p>
            <p className="text-sm text-slate-500 mt-2">Confirma se o documento apresentado bate com o registro original.</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <p className="font-bold text-slate-900">Registro blockchain</p>
            <p className="text-sm text-slate-500 mt-2">Mostra a transacao e a rede quando o hash foi registrado on-chain.</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <p className="font-bold text-slate-900">Verificacao publica</p>
            <p className="text-sm text-slate-500 mt-2">Qualquer pessoa com o codigo pode conferir o certificado sem acessar sua conta.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
