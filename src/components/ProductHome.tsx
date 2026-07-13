import { ArrowRight, BellRing, Briefcase, CheckCircle, Code2, FileCheck, FileSignature, Mail, Rocket, Shield, Smartphone, Sparkles, Wallet } from 'lucide-react';
import { PRODUCT_COPY } from '../lib/productCopy';
import { CONTRACT_TEMPLATES } from '../lib/contractTemplates';

const features = [
  {
    icon: Wallet,
    title: 'Cofre de documentos',
    description: 'Guarde documentos importantes, contratos, comprovantes, laudos e recibos em uma carteira digital simples.',
  },
  {
    icon: FileSignature,
    title: 'Assinatura eletronica',
    description: 'Envie contrato para uma ou mais partes assinarem com nome, e-mail, data, IP, navegador e trilha de aceite.',
  },
  {
    icon: FileCheck,
    title: 'Certificado blockchain',
    description: 'Registre o hash SHA-256 e gere uma pagina publica para verificar integridade e evidencias.',
  },
  {
    icon: Shield,
    title: 'Compartilhamento seguro',
    description: 'Crie links controlados para compartilhar documentos sem mandar arquivos soltos pelo WhatsApp.',
  },
];

const roadmap = [
  { icon: Mail, title: 'Envio por e-mail', description: 'Convites automaticos para as partes assinarem contratos.' },
  { icon: BellRing, title: 'Lembretes de assinatura', description: 'Avisos para quem ainda nao assinou o documento.' },
  { icon: Briefcase, title: 'Area para empresas', description: 'Planos, historico e recursos para operacao profissional.' },
  { icon: Code2, title: 'API futura', description: 'Integracoes para documentos, certificados, assinaturas e webhooks.' },
];

const useCases = [
  'Prestacao de servicos',
  'Contrato de namoro',
  'NDA / confidencialidade',
  'Confissao de divida',
  'Recibo de pagamento',
  'Locacao simples',
  'Termo de imagem',
  'Acordo de convivencia',
];

export const ProductHome: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  const highlightedTemplates = CONTRACT_TEMPLATES.filter((item) => item.popular).slice(0, 6);

  return (
    <div className="max-w-6xl mx-auto px-4 pb-12 space-y-8">
      <section className="bg-slate-950 text-white rounded-[2rem] overflow-hidden shadow-card border border-white/10">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 p-8 lg:p-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 text-white px-3 py-1 rounded-full text-sm font-semibold mb-5">
              <Sparkles size={16} /> App Android em analise na Google Play
            </div>
            <h1 className="text-4xl lg:text-6xl font-black leading-tight">
              Guarde, assine, compartilhe e comprove documentos em minutos.
            </h1>
            <p className="text-slate-300 mt-5 text-lg leading-relaxed max-w-2xl">
              O DocWallet combina cofre digital, contratos simples, assinatura eletronica com evidencias e certificado de integridade em blockchain.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <button
                onClick={onStart}
                className="px-7 py-3 bg-white text-slate-950 rounded-full font-bold hover:bg-slate-100 transition-colors shadow-lg"
              >
                Criar conta gratis
              </button>
              <a href="/validar-documento" className="px-7 py-3 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 transition-colors text-center">
                Validar documento gratis
              </a>
              <a href="/modelos" className="px-7 py-3 bg-white/10 border border-white/20 text-white rounded-full font-bold hover:bg-white/15 transition-colors text-center">
                Ver modelos
              </a>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
              {['SHA-256', 'Blockchain', 'Assinatura', 'Certificado'].map((item) => (
                <div key={item} className="bg-white/10 border border-white/10 rounded-2xl p-4">
                  <p className="text-sm text-slate-300">DocWallet</p>
                  <p className="font-bold">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white text-slate-950 rounded-[2rem] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm text-slate-500">Contrato assinado</p>
                <p className="text-2xl font-black">Certificado pronto</p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center"><CheckCircle size={26} /></div>
            </div>
            <div className="space-y-3">
              {['Parte A assinou', 'Parte B assinou', 'Hash final gerado', 'Registro blockchain'].map((item) => (
                <div key={item} className="flex items-center gap-3 bg-slate-50 rounded-2xl p-4">
                  <CheckCircle className="text-emerald-500" size={19} />
                  <span className="font-semibold text-sm">{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 bg-slate-950 text-white rounded-2xl p-4">
              <p className="text-xs text-slate-400">Hash SHA-256</p>
              <p className="font-mono text-xs break-all mt-2">a3f8c2d1e9b4...7f2a1c3d5e8b</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-4 gap-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div key={feature.title} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <Icon className="text-indigo-600 mb-4" size={30} />
              <h3 className="text-lg font-bold text-slate-900">{feature.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed mt-2">{feature.description}</p>
            </div>
          );
        })}
      </section>

      <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 lg:p-10">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold mb-4">
              <Rocket size={16} /> Como funciona
            </div>
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 leading-tight">Do arquivo ao certificado em 4 passos.</h2>
            <p className="text-slate-600 mt-4 leading-relaxed">
              O DocWallet nao promete ser cartorio. Ele organiza documentos, registra aceite eletronico e cria evidencia tecnica verificavel.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              ['1', 'Envie ou crie', 'Suba um documento ou comece por um modelo de contrato.'],
              ['2', 'Compartilhe', 'Gere link seguro para visualizacao, download ou assinatura.'],
              ['3', 'Assine', 'Colete aceite com dados, horario, IP e navegador.'],
              ['4', 'Comprove', 'Calcule hash, registre em blockchain e emita certificado publico.'],
            ].map(([step, title, description]) => (
              <div key={step} className="bg-slate-50 rounded-3xl p-5">
                <div className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black mb-4">{step}</div>
                <h3 className="font-bold text-slate-900">{title}</h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 lg:p-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold mb-4">
              <FileSignature size={16} /> Biblioteca de modelos
            </div>
            <h2 className="text-3xl font-black text-slate-900">Contratos diversos, inclusive os que estao em alta.</h2>
            <p className="text-slate-600 mt-3 max-w-3xl">
              Modelos para uso comercial, pessoal, familiar, financeiro e imobiliario. Contrato de namoro, convivencia e uniao estavel entram com aviso de revisao juridica quando o caso exigir.
            </p>
          </div>
          <a href="/modelos" className="inline-flex items-center gap-2 px-5 py-3 bg-slate-950 text-white rounded-xl font-semibold hover:bg-slate-800">
            Ver biblioteca <ArrowRight size={17} />
          </a>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {highlightedTemplates.map((template) => (
            <div key={template.title} className="rounded-3xl bg-slate-50 p-5 border border-slate-100">
              <p className="text-xs font-bold text-indigo-600 uppercase">{template.category}</p>
              <h3 className="text-lg font-bold text-slate-900 mt-2">{template.title}</h3>
              <p className="text-sm text-slate-600 mt-2">{template.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid lg:grid-cols-[1fr_0.8fr] gap-6">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-[2rem] p-8 lg:p-10">
          <h2 className="text-3xl font-black">Planos simples para comecar.</h2>
          <p className="text-white/80 mt-3">Comece gratis e pague quando precisar validar, assinar ou comprovar.</p>
          <div className="grid sm:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 border border-white/10 rounded-3xl p-5">
              <p className="font-bold">Gratis</p>
              <p className="text-sm text-white/70 mt-1">Guardar e compartilhar documentos.</p>
            </div>
            <div className="bg-white text-slate-950 rounded-3xl p-5">
              <p className="font-bold">Documento</p>
              <p className="text-3xl font-black mt-1">{PRODUCT_COPY.documentPrice}</p>
              <p className="text-sm text-slate-500">validacao avulsa</p>
            </div>
            <div className="bg-white text-slate-950 rounded-3xl p-5">
              <p className="font-bold">Contrato</p>
              <p className="text-3xl font-black mt-1">{PRODUCT_COPY.contractPrice}</p>
              <p className="text-sm text-slate-500">assinatura + hash</p>
            </div>
          </div>
          <div className="mt-5 bg-white/10 border border-white/10 rounded-3xl p-5">
            <p className="font-bold">Plano Pro em breve</p>
            <p className="text-sm text-white/75 mt-1">Mais documentos, mais assinaturas, historico ampliado, empresa e recursos profissionais.</p>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 lg:p-10">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-semibold mb-4">
            <Smartphone size={16} /> Google Play
          </div>
          <h2 className="text-3xl font-black text-slate-900">App Android em analise.</h2>
          <p className="text-slate-600 mt-3 leading-relaxed">
            O DocWallet ja esta no forno para Android. Enquanto isso, voce pode usar pelo navegador e criar sua conta normalmente.
          </p>
          <div className="mt-5 space-y-3">
            {roadmap.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex gap-3 rounded-2xl bg-slate-50 p-4">
                  <Icon className="text-indigo-600 mt-0.5" size={20} />
                  <div>
                    <p className="font-bold text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-600">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 lg:p-10">
        <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-8 items-start">
          <div>
            <h2 className="text-3xl font-black text-slate-900">Feito para documentos que precisam de controle.</h2>
            <p className="text-slate-600 mt-3 leading-relaxed">
              O DocWallet ajuda pessoas, autonomos e empresas a organizar provas digitais sem transformar o produto em cartorio ou consultoria juridica.
            </p>
            <a href="/empresas" className="mt-5 inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700">
              Conhecer area para empresas <ArrowRight size={17} />
            </a>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {useCases.map((item) => (
              <div key={item} className="flex items-center gap-3 bg-slate-50 rounded-2xl p-4">
                <CheckCircle className="text-emerald-500" size={19} />
                <span className="font-semibold text-slate-800 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-amber-50 border border-amber-100 rounded-[2rem] p-6 text-amber-950 text-sm leading-relaxed">
        <strong>Aviso importante:</strong> o DocWallet nao e cartorio, nao substitui reconhecimento de firma, nao presta consultoria juridica e nao deve ser apresentado como assinatura qualificada ICP-Brasil. A plataforma registra evidencias digitais de aceite, hash, historico e prova tecnica de integridade.
      </section>
    </div>
  );
};
