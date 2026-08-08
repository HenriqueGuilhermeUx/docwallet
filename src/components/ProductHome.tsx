import { ArrowRight, CheckCircle, FileCheck, FileSignature, Shield, Wallet } from 'lucide-react';

const features = [
  {
    icon: Wallet,
    title: 'Cofre digital',
    description: 'Guarde documentos, comprovantes, contratos e arquivos importantes em uma conta simples.',
  },
  {
    icon: FileSignature,
    title: 'Contratos simples',
    description: 'Crie modelos básicos e envie para assinatura eletrônica com evidências digitais.',
  },
  {
    icon: FileCheck,
    title: 'Validação por hash',
    description: 'Calcule o SHA-256 e consulte certificados de integridade quando precisar comprovar um arquivo.',
  },
];

export const ProductHome: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  return (
    <main className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      <section className="bg-white rounded-[2rem] border border-slate-100 shadow-card overflow-hidden">
        <div className="grid lg:grid-cols-[1fr_0.8fr] gap-8 p-7 sm:p-10 lg:p-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold mb-5">
              <Shield size={16} /> Documentos, contratos e evidências digitais
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight text-slate-950">
              Organize documentos e gere provas digitais em poucos minutos.
            </h1>

            <p className="text-slate-600 mt-5 text-base sm:text-lg leading-relaxed max-w-2xl">
              O DocWallet Docs ajuda você a guardar documentos, criar contratos simples, coletar assinatura eletrônica e consultar certificados de integridade.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-7">
              <button
                onClick={onStart}
                className="px-7 py-3 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 transition-colors shadow-lg active:scale-95"
              >
                Entrar ou criar conta
              </button>
              <a
                href="/validar-documento"
                className="px-7 py-3 bg-slate-100 text-slate-800 rounded-full font-bold hover:bg-slate-200 transition-colors text-center"
              >
                Validar documento grátis
              </a>
            </div>

            <p className="text-xs text-slate-400 mt-5">
              Não substitui cartório, consultoria jurídica ou assinatura qualificada ICP-Brasil.
            </p>
          </div>

          <div className="bg-slate-950 text-white rounded-[1.7rem] p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm text-slate-400">DocWallet Docs</p>
                <p className="text-2xl font-black">Seu cofre digital</p>
              </div>
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center">
                <Wallet size={24} />
              </div>
            </div>

            <div className="space-y-3">
              {['Documento salvo', 'Contrato criado', 'Assinatura registrada', 'Certificado consultável'].map((item) => (
                <div key={item} className="flex items-center gap-3 bg-white/10 border border-white/10 rounded-2xl p-4">
                  <CheckCircle className="text-emerald-400" size={19} />
                  <span className="font-semibold text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
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
          <p className="text-sm text-slate-600 mt-1">Entre para acessar seus documentos, contratos e certificados.</p>
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
