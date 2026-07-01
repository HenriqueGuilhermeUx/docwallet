import { CheckCircle, FileText, Shield, Wallet } from 'lucide-react';
import { PRODUCT_COPY } from '../lib/productCopy';

export const ProductHome: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  return (
    <section className="max-w-6xl mx-auto px-4 pb-10">
      <div className="bg-white rounded-3xl shadow-card border border-slate-100 overflow-hidden">
        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-0">
          <div className="p-8 lg:p-10">
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold mb-4">
              <Shield size={16} /> Beta comercial
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 leading-tight">
              {PRODUCT_COPY.headline}
            </h2>
            <p className="text-slate-500 mt-4 text-lg leading-relaxed">
              {PRODUCT_COPY.subheadline}
            </p>

            <div className="grid sm:grid-cols-2 gap-3 mt-6">
              <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                <CheckCircle className="text-emerald-500 mt-0.5" size={20} />
                <div>
                  <p className="font-semibold text-slate-800">Documentos sem custo</p>
                  <p className="text-sm text-slate-500">Salvar, visualizar e compartilhar.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                <CheckCircle className="text-emerald-500 mt-0.5" size={20} />
                <div>
                  <p className="font-semibold text-slate-800">Pague somente ao validar</p>
                  <p className="text-sm text-slate-500">Pix Woovi ou carteira cripto.</p>
                </div>
              </div>
            </div>

            <button
              onClick={onStart}
              className="mt-7 px-7 py-3 bg-primary hover:bg-primary-dark text-white rounded-full font-semibold transition-colors shadow-lg"
            >
              Comecar agora
            </button>
          </div>

          <div className="bg-slate-950 p-8 lg:p-10 text-white flex flex-col justify-center">
            <div className="space-y-4">
              <div className="rounded-2xl bg-white/10 border border-white/10 p-5">
                <div className="flex items-center gap-3 mb-2"><FileText size={22} /><p className="font-bold">Documento</p></div>
                <p className="text-3xl font-bold">{PRODUCT_COPY.documentPrice}</p>
                <p className="text-sm text-slate-300 mt-1">validacao avulsa</p>
              </div>
              <div className="rounded-2xl bg-white/10 border border-white/10 p-5">
                <div className="flex items-center gap-3 mb-2"><Wallet size={22} /><p className="font-bold">Contrato</p></div>
                <p className="text-3xl font-bold">{PRODUCT_COPY.contractPrice}</p>
                <p className="text-sm text-slate-300 mt-1">geracao e validacao</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
