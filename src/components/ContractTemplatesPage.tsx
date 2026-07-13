import { useMemo, useState } from 'react';
import { FileSignature, Search, ShieldAlert } from 'lucide-react';
import { CONTRACT_TEMPLATES, TEMPLATE_CATEGORIES, ContractTemplateCategory } from '../lib/contractTemplates';

export function ContractTemplatesPage() {
  const [activeCategory, setActiveCategory] = useState<ContractTemplateCategory | 'Todos'>('Todos');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return CONTRACT_TEMPLATES.filter((item) => {
      const matchesCategory = activeCategory === 'Todos' || item.category === activeCategory;
      const matchesTerm = !term || [item.title, item.description, item.audience, item.category, ...item.tags]
        .join(' ')
        .toLowerCase()
        .includes(term);
      return matchesCategory && matchesTerm;
    });
  }, [activeCategory, query]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-950 text-white border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center"><FileSignature size={22} /></div>
            <div>
              <p className="font-bold text-lg">DocWallet</p>
              <p className="text-xs text-slate-400">Biblioteca de modelos</p>
            </div>
          </a>
          <a href="/" className="text-sm text-slate-300 hover:text-white">Voltar</a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 md:p-10">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold mb-4">
            <FileSignature size={16} /> Modelos DocWallet
          </div>
          <div className="grid lg:grid-cols-[1fr_0.7fr] gap-8 items-end">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 leading-tight">Contratos simples para assinar, compartilhar e comprovar.</h1>
              <p className="text-slate-600 mt-4 text-lg leading-relaxed">
                Biblioteca inicial com modelos comerciais, pessoais, familiares, financeiros e imobiliarios. Use como ponto de partida, edite os dados e registre evidencias digitais no DocWallet.
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-sm text-amber-900 leading-relaxed flex gap-3">
              <ShieldAlert className="shrink-0 mt-0.5" size={20} />
              <p>Modelos sao apoio operacional e nao substituem revisao juridica. Em casos sensiveis, como namoro, uniao estavel, trabalho, familia, dividas e imoveis, revise com profissional habilitado.</p>
            </div>
          </div>
        </section>

        <section className="mt-6 bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por namoro, prestacao, NDA, recibo, locacao..."
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(['Todos', ...TEMPLATE_CATEGORIES] as const).map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${activeCategory === category ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {filtered.map((template) => (
            <article key={template.title} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-wide text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{template.category}</span>
                {template.popular && <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">Popular</span>}
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-4">{template.title}</h2>
              <p className="text-sm text-slate-500 mt-1">{template.audience}</p>
              <p className="text-slate-600 text-sm leading-relaxed mt-4 flex-1">{template.description}</p>
              <div className="flex flex-wrap gap-2 mt-5">
                {template.tags.map((tag) => <span key={tag} className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">{tag}</span>)}
              </div>
              {template.sensitive && <p className="text-xs text-amber-700 bg-amber-50 rounded-xl p-3 mt-4">Recomendado revisar juridicamente antes de usar em situacoes relevantes.</p>}
              <a href="/" className="mt-5 inline-flex justify-center px-4 py-3 bg-slate-950 text-white rounded-xl font-semibold text-sm hover:bg-slate-800">
                Usar no DocWallet
              </a>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
