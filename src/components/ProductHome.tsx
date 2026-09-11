import { ArrowRight, CheckCircle, FileCheck, FileSignature, Shield, Wallet, Brain, Zap, Building2 } from 'lucide-react';

const features = [
  {
    icon: Wallet,
    title: 'Cofre digital',
    description: 'Guarde documentos, comprovantes, contratos e arquivos importantes em uma conta simples.',
  },
  {
    icon: Brain,
    title: 'DocWallet Intelligence',
    description: 'Entenda o que existe dentro do documento: partes, datas, valores, prazos, obrigações e alertas.',
  },
  {
    icon: Zap,
    title: 'DocFlow Business',
    description: 'Transforme documentos em processos configuráveis, aprovações e integrações B2B.',
  },
  {
    icon: FileSignature,
    title: 'Assinaturas',
    description: 'Envie documentos para assinatura, acompanhe pendências e baixe evidências digitais.',
  },
  {
    icon: FileCheck,
    title: 'Validação por hash',
    description: 'Calcule o SHA-256 e consulte certificados de integridade quando precisar comprovar um arquivo.',
  },
  {
    icon: Shield,
    title: 'Digital Trust',
    description: 'Preserve arquivo original, versões, trilha de auditoria e prova técnica de integridade.',
  },
];

export const ProductHome: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  return (
    <main className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
      <section className="bg-white rounded-[2rem] border border-slate-100 shadow-card overflow-hidden">
        <div className="grid lg:grid-cols-[1fr_0.85fr] gap-8 p-7 sm:p-10 lg:p-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold mb-5">
              <Brain size={16} /> Document Intelligence + Digital Trust
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight text-slate-950">
              Seu documento não fica apenas guardado. O DocWallet entende o que existe dentro dele.
            </h1>

            <p className="text-slate-600 mt-5 text-base sm:text-lg leading-relaxed max-w-2xl">
              Guarde arquivos, crie contratos, colete assinaturas, extraia dados importantes e transforme documentos em processos com o DocFlow by DocWallet.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-7">
              <button
                onClick={onStart}
                className="px-7 py-3 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 transition-colors shadow-lg active:scale-95"
              >
                Entrar ou criar conta
              </button>
              <a
                href="/inteligencia"
                className="px-7 py-3 bg-slate-950 text-white rounded-full font-bold hover:bg-slate-800 transition-colors text-center"
              >
                Ver inteligência
              </a>
              <a
                href="/docflow"
                className="px-7 py-3 bg-violet-600 text-white rounded-full font-bold hover:bg-violet-700 transition-colors text-center"
              >
                DocFlow Business
              </a>
            </div>

            <p className="text-xs text-slate-400 mt-5">
              Apoio informacional. Não substitui cartório, consultoria jurídica ou assinatura qualificada ICP-Brasil.
            </p>
          </div>

          <div className="bg-slate-950 text-white rounded-[1.7rem] p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm text-slate-400">DocFlow by DocWallet</p>
                <p className="text-2xl font-black">Foto → processo</p>
              </div>
              <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center">
                <Zap size={24} />
              </div>
            </div>

            <div className="space-y-3">
              {['Recibo recebido', 'Dados extraídos', 'Gestor aprovou', 'Financeiro notificado', 'Comprovante arquivado'].map((item) => (
                <div key={item} className="flex items-center gap-3 bg-white/10 border border-white/10 rounded-2xl p-4">
                  <CheckCircle className="text-emerald-400" size={19} />
                  <span className="font-semibold text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 bg-slate-950 text-white rounded-[2rem] p-6 lg:p-8 grid lg:grid-cols-[0.8fr_1.2fr] gap-5 items-center">
        <div>
          <div className="inline-flex items-center gap-2 text-violet-200 font-bold text-sm"><Building2 size={16} /> DOCFLOW BY DOCWALLET</div>
          <h2 className="text-2xl lg:text-3xl font-black mt-3">Transforme documentos em processos.</h2>
          <p className="text-slate-300 mt-3 text-sm leading-relaxed">Não venda OCR. Venda o fim da digitação manual: fotografe, confirme e o processo continua sozinho.</p>
        </div>
        <div className="grid sm:grid-cols-4 gap-2 text-xs">
          {['QUANDO documento recebido', 'EXTRAIR valor/data/fornecedor', 'PEDIR centro de custo', 'ENTÃO aprovar + integrar'].map((item) => (
            <div key={item} className="bg-white/10 border border-white/10 rounded-2xl p-3 font-semibold">{item}</div>
          ))}
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4 mt-6">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div key={feature.title} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <Icon className="text-indigo-600 mb-4" size={30} />
              <h2 className="text-lg font-bold text-slate-900">{feature.title}</h2>
              <p className="text-sm text-slate-600 leading-relaxed mt-2">{feature.description}</p>
            </div>
          );
        })}
      </section>

      <section className="mt-6 bg-slate-50 border border-slate-200 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-bold text-slate-900">Já tem uma conta?</h2>
          <p className="text-sm text-slate-600 mt-1">Entre para acessar documentos, inteligência, DocFlow, assinaturas, contratos e certificados.</p>
        </div>
        <button
          onClick={onStart}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-950 text-white rounded-xl font-semibold hover:bg-slate-800 active:scale-95"
        >
          Acessar agora <ArrowRight size={17} />
        </button>
      </section>
    </main>
  );
};
