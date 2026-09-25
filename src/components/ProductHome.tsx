import { ArrowRight, CheckCircle, FileCheck, FileSignature, Shield, Wallet, Brain, Zap, Building2 } from 'lucide-react';
import { AppLink } from '../lib/navigation';

const lifecycle = [
  { label: '1. Receber', text: 'foto, upload, e-mail ou API', icon: Wallet },
  { label: '2. Entender', text: 'partes, datas, valores e riscos', icon: Brain },
  { label: '3. Processar', text: 'regras, aprovação e integrações', icon: Zap },
  { label: '4. Assinar', text: 'eletrônica, OTP ou ICP-Brasil', icon: FileSignature },
  { label: '5. Comprovar', text: 'hash, evidências e auditoria', icon: Shield },
];

const features = [
  { icon: Wallet, title: 'Documentos', description: 'Um cofre operacional para contratos, comprovantes, documentos e arquivos importantes.' },
  { icon: Brain, title: 'Inteligência', description: 'O DocWallet lê o documento e transforma conteúdo em dados úteis para decisão e automação.' },
  { icon: Zap, title: 'DocFlow', description: 'Documentos viram processos com validação, aprovação, assinatura, integrações e arquivo.' },
  { icon: FileSignature, title: 'Assinaturas', description: 'E-mail, WhatsApp, evidências reforçadas, OTP e certificado digital ICP-Brasil no mesmo produto.' },
  { icon: FileCheck, title: 'Validação', description: 'Hashes e evidências permitem comprovar integridade e consultar a trilha do documento.' },
  { icon: Shield, title: 'Digital Trust', description: 'Preserve original, versões, eventos, identidade do signatário e prova técnica do ciclo completo.' },
];

export const ProductHome: React.FC<{ onStart: () => void }> = ({ onStart }) => (
  <main className="max-w-7xl mx-auto px-4 py-8 sm:py-12 space-y-6">
    <section className="bg-slate-950 text-white rounded-[2.2rem] overflow-hidden border border-slate-900 shadow-xl">
      <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-8 p-7 sm:p-10 lg:p-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 text-indigo-100 px-3 py-1 rounded-full text-sm font-semibold mb-5">
            <Brain size={16} /> Document Intelligence + Workflow + Digital Trust
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-black leading-[1.05]">Do documento recebido à decisão, assinatura e prova.</h1>
          <p className="text-slate-300 mt-5 text-base sm:text-lg leading-relaxed max-w-2xl">
            O DocWallet recebe documentos, entende o conteúdo, conduz o processo, coleta a assinatura adequada e preserva as evidências — em um único fluxo.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-7">
            <button onClick={onStart} className="px-7 py-3 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-500 transition-colors shadow-lg active:scale-95">Entrar ou criar conta</button>
            <AppLink href="/docflow" className="px-7 py-3 bg-white text-slate-950 rounded-full font-bold hover:bg-slate-100 transition-colors text-center">Ver DocFlow</AppLink>
          </div>
          <p className="text-xs text-slate-500 mt-5">Assinatura eletrônica e assinatura qualificada ICP-Brasil são apresentadas de forma distinta conforme o método utilizado.</p>
        </div>

        <div className="space-y-2">
          {lifecycle.map(({ label, text, icon: Icon }, index) => (
            <div key={label} className="flex items-center gap-4 bg-white/7 border border-white/10 rounded-2xl p-4">
              <div className="w-11 h-11 rounded-xl bg-indigo-500/15 text-indigo-200 flex items-center justify-center"><Icon size={21} /></div>
              <div className="flex-1"><p className="font-black">{label}</p><p className="text-sm text-slate-400">{text}</p></div>
              {index < lifecycle.length - 1 && <ArrowRight size={17} className="text-slate-600" />}
              {index === lifecycle.length - 1 && <CheckCircle size={18} className="text-emerald-400" />}
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="grid md:grid-cols-3 gap-4">
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

    <section className="bg-indigo-50 border border-indigo-100 rounded-[2rem] p-6 lg:p-8 grid lg:grid-cols-[0.9fr_1.1fr] gap-5 items-center">
      <div>
        <div className="inline-flex items-center gap-2 text-indigo-700 font-bold text-sm"><Building2 size={16} /> PARA EMPRESAS</div>
        <h2 className="text-2xl lg:text-3xl font-black mt-3 text-slate-950">DocFlow é o motor operacional do DocWallet.</h2>
        <p className="text-slate-600 mt-3 text-sm leading-relaxed">Aprovação deixa de ser uma ilha: o processo pode terminar em assinatura eletrônica/ICP-Brasil, entrega por e-mail ou WhatsApp, integração e arquivo auditável.</p>
      </div>
      <div className="grid sm:grid-cols-4 gap-2 text-xs">
        {['RECEBER documento', 'ENTENDER conteúdo', 'APROVAR + ASSINAR', 'COMPROVAR + ARQUIVAR'].map((item) => (
          <div key={item} className="bg-white border border-indigo-100 rounded-2xl p-3 font-semibold text-slate-800">{item}</div>
        ))}
      </div>
    </section>

    <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 className="font-bold text-slate-900">Um produto, um ciclo documental.</h2>
        <p className="text-sm text-slate-600 mt-1">Documentos, inteligência, DocFlow, assinatura e confiança deixam de parecer módulos separados.</p>
      </div>
      <button onClick={onStart} className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-950 text-white rounded-xl font-semibold hover:bg-slate-800 active:scale-95">Acessar agora <ArrowRight size={17} /></button>
    </section>
  </main>
);
