import { useEffect } from 'react';
import './USPreview.css';
import USHashTool from './USHashTool';

/** An isolated en-US marketing preview; never connects to Brazil product APIs. */
const features = [
  { title: "Document vault", copy: "Organize important files and find the records your team needs." },
  { title: "Document intelligence", copy: "Review parties, dates, obligations and extracted details with human verification." },
  { title: "DocFlow", copy: "Connect documents to business processes, reviews and approvals." },
  { title: "Audit evidence", copy: "Preserve integrity checks, document history and traceable events." },
];

export default function USPreview() {
  useEffect(() => {
    const previousLang = document.documentElement.lang;
    const previousTitle = document.title;
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previousDescription = description?.content;
    // Keep unapproved US previews out of public search indexes.
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const createdRobots = !robots;
    if (!robots) {
      robots = document.createElement('meta');
      robots.name = 'robots';
      document.head.appendChild(robots);
    }
    const previousRobots = robots.content;
    robots.content = 'noindex,nofollow';
    document.documentElement.lang = 'en-US';
    document.title = "DocWallet USA | Alternative Ventures";
    if (description) description.content = "Secure documents & workflow intelligence — a United States localization preview.";
    return () => {
      document.documentElement.lang = previousLang;
      document.title = previousTitle;
      if (description && previousDescription !== undefined) description.content = previousDescription;
      if (createdRobots) robots.remove();
      else robots.content = previousRobots;
    };
  }, []);

  return (
    <div className="avus">
      <header className="avus-header">
        <a className="avus-wordmark" href="/us" aria-label="DocWallet USA home">DocWallet<span>USA</span></a>
        <nav aria-label="Page navigation"><a href="#features">Capabilities</a><a href="#release">US availability</a></nav>
      </header>
      <main>
        <section className="avus-hero">
          <div className="avus-copy">
            <p className="avus-eyebrow">Alternative Ventures / United States</p>
            <p className="avus-subheading">Secure documents & workflow intelligence</p>
            <h1>The right document. The right evidence. A simpler workflow.</h1>
            <p className="avus-intro">A secure place to organize documents, review key information, coordinate approvals and keep track of what changed. Built on DocWallet’s existing document-management architecture.</p>
            <div className="avus-hero-actions"><a href="#features" className="avus-primary">Explore capabilities <span aria-hidden="true">↗</span></a><a href="#release" className="avus-outline">Launch status</a></div>
            <p className="avus-disclaimer">Product localization preview · No US checkout or account activation</p>
          </div>
          <div className="avus-graphic" aria-label="Illustrative operating flow">
            <p>AN INTEGRATED WORKFLOW</p>
            <div className="avus-graphic-row"><span>01</span><strong>Organize the work</strong></div>
            <div className="avus-graphic-row"><span>02</span><strong>Review the evidence</strong></div>
            <div className="avus-graphic-row"><span>03</span><strong>Act with confidence</strong></div>
            <small>Illustrative experience, not a live US account</small>
          </div>
        </section>
        <section id="features" className="avus-features">
          <p className="avus-eyebrow">Capabilities</p>
          <h2>A powerful foundation, being prepared for the US.</h2>
          <div className="avus-grid">{features.map((feature, index) => <article key={feature.title}><span>0{index + 1}</span><h3>{feature.title}</h3><p>{feature.copy}</p></article>)}</div>
        </section>
        <USHashTool />
        <section id="release" className="avus-release">
          <p className="avus-eyebrow">US readiness</p>
          <h2>Localization in progress</h2>
          <p>US electronic-signature workflows require a separate legal and technical review. This preview does not enable signatures or claim US legal certification.</p>
          <p>Functionality, terms, pricing and availability will be reviewed before a public US launch.</p>
        </section>
      </main>
      <footer className="avus-footer"><span>DocWallet USA · Alternative Ventures</span><a href="https://alternativeventures.com.br/">About Alternative Ventures ↗</a></footer>
    </div>
  );
}
