import { Building2, CheckCircle, FileSignature, ShieldCheck, Users } from 'lucide-react';

const businessFeatures = [
  'Carteira de documentos da empresa',
  'Contratos e aceites com evidencias digitais',
  'Compartilhamento seguro por link',
  'Historico de certificados e hashes',
  'Fluxo de assinatura entre partes',
  'Plano Pro e API futura para integracoes',
];

export function BusinessPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-950 text-white border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center"><Building2 size={22} /></div>
            <div>
              <p className="font-bold text-lg">DocWallet Empresas</p>
              <p className="text-xs text-slate-400">Documentos, contratos e evidencias digitais</p>
            </div>
          </a>
          <a href="/" className="text-sm text-slate-300 hover:text-white">Voltar</a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        <section className="bg-slate-950 text-white rounded-3xl overflow-hidden">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 p-8 md:p-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 px-3 py-1 rounded-full text-sm font-semibold mb-5">
                <ShieldCheck size={16} /> Para empresas e profissionais
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">Menos papel. Mais prova. Mais controle.</h1>
              <p className="text-slate-300 text-lg leading-relaxed mt-5">
                O DocWallet ajuda empresas a organizar documentos, coletar assinaturas simples, compartilhar arquivos e manter prova tecnica de integridade por hash e blockchain.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-7">
                <a href="/" className="px-6 py-3 bg-white text-slate-950 rounded-xl font-semibold text-center hover:bg-slate-100">Comecar agora</a>
                <a href="mailto:suporte@docwallet.app?subject=DocWallet%20Empresas" className="px-6 py-3 bg-white/10 border border-white/20 rounded-xl font-semibold text-center hover:bg-white/15">Falar com comercial</a>
              </div>
            </div>
            <div className="bg-white/10 border border-white/10 rounded-3xl p-6 space-y-3">
              {businessFeatures.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle className="text-emerald-400 mt-0.5" size={20} />
                  <p className="text-sm text-slate-100">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-5 mt-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <FileSignature className="text-indigo-600 mb-4" size={30} />
            <h2 className="text-xl font-bold text-slate-900">Contratos e aceites</h2>
            <p className="text-slate-600 text-sm mt-3 leading-relaxed">Envie contratos para assinatura, registre nome, e-mail, data, IP, navegador e hash final.</p>
          </div>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <Users className="text-indigo-600 mb-4" size={30} />
            <h2 className="text-xl font-bold text-slate-900">Operacao em equipe</h2>
            <p className="text-slate-600 text-sm mt-3 leading-relaxed">Estrutura pensada para evoluir para times, permissoes, historico e planos corporativos.</p>
          </div>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <ShieldCheck className="text-indigo-600 mb-4" size={30} />
            <h2 className="text-xl font-bold text-slate-900">Evidencia verificavel</h2>
            <p className="text-slate-600 text-sm mt-3 leading-relaxed">Certificados publicos permitem conferir hash, transacao e integridade sem abrir sua conta.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
