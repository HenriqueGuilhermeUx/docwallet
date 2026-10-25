import { useEffect, useState } from 'react';
import './USPreview.css';

type DemoDocument = { id: number; title: string; category: 'Contracts' | 'Records' | 'Invoices'; status: 'Needs review' | 'Reviewed' };
const initialDocuments: DemoDocument[] = [
  { id: 1, title: 'Vendor agreement — sample', category: 'Contracts', status: 'Needs review' },
  { id: 2, title: 'Insurance policy — sample', category: 'Records', status: 'Reviewed' },
  { id: 3, title: 'Service invoice — sample', category: 'Invoices', status: 'Needs review' },
];

/** US workflow prototype using in-memory sample rows; no documents are stored or transmitted. */
export default function USWorkspace() {
  const [documents, setDocuments] = useState<DemoDocument[]>(initialDocuments);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  useEffect(() => {
    const previousLang = document.documentElement.lang;
    const previousTitle = document.title;
    const existingRobots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const robots = existingRobots || document.createElement('meta');
    const previousRobots = robots.content;
    if (!existingRobots) {
      robots.name = 'robots';
      document.head.appendChild(robots);
    }
    robots.content = 'noindex,nofollow';
    document.documentElement.lang = 'en-US';
    document.title = 'DocWallet USA | Document workspace walkthrough';
    return () => {
      document.documentElement.lang = previousLang;
      document.title = previousTitle;
      if (existingRobots) robots.content = previousRobots;
      else robots.remove();
    };
  }, []);
  const filtered = documents.filter(doc => (category === 'All' || doc.category === category) && doc.title.toLowerCase().includes(search.trim().toLowerCase()));
  const pending = documents.filter(doc => doc.status === 'Needs review').length;
  return (
    <div className="avus avus-workspace">
      <header className="avus-header"><a className="avus-wordmark" href="/us">DocWallet<span>USA</span></a><nav><a href="/us">Overview</a><a href="#documents">Documents</a></nav></header>
      <main>
        <section className="avus-features">
          <p className="avus-eyebrow">Interactive preview · Sample documents</p>
          <h1>Know what needs your attention.</h1>
          <p className="avus-intro">Explore an English-language document workspace. No real files, accounts, signatures or backend requests are involved. Review actions are temporary and only affect this page.</p>
          <div className="avus-grid">
            <article><span>DOCUMENTS</span><h3>{documents.length}</h3><p>Example records</p></article>
            <article><span>AWAITING REVIEW</span><h3>{pending}</h3><p>Sample review queue</p></article>
            <article><span>REVIEWED</span><h3>{documents.length - pending}</h3><p>Demonstration only</p></article>
          </div>
          <section id="documents" className="avus-workspace-panel">
            <h2>Document workspace</h2>
            <div className="avus-controls"><label htmlFor="us-document-search">Find a document<input id="us-document-search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search sample documents" /></label><label htmlFor="us-document-category">Category<select id="us-document-category" value={category} onChange={event => setCategory(event.target.value)}>{['All', 'Contracts', 'Records', 'Invoices'].map(value => <option key={value}>{value}</option>)}</select></label></div>
            <div className="avus-document-list">{filtered.length ? filtered.map(doc => <article key={doc.id}><div><small>{doc.category} · {doc.status}</small><strong>{doc.title}</strong></div><button type="button" onClick={() => setDocuments(current => current.map(item => item.id === doc.id ? { ...item, status: item.status === 'Needs review' ? 'Reviewed' : 'Needs review' } : item))}>{doc.status === 'Needs review' ? 'Mark reviewed' : 'Reopen review'}</button></article>) : <p>No sample documents match this search.</p>}</div>
            <button className="avus-reset" type="button" onClick={() => { setDocuments(initialDocuments); setSearch(''); setCategory('All'); }}>Reset sample data</button>
          </section>
          <p className="avus-disclaimer">US electronic signature compliance, account activation and storage are not enabled in this walkthrough. Your Brazilian documents and signature flows are untouched.</p>
        </section>
      </main>
    </div>
  );
}
