import React from 'react';
import ReactDOM from 'react-dom/client';
import USPreview from './components/USPreview';
import USWorkspace from './components/USWorkspace';
const route = location.pathname.replace(/\/$/, '') || '/';
const content = route === '/' || route === '/us' ? <USPreview /> : route === '/us/workspace' ? <USWorkspace /> : <main lang="en-US"><h1>Page unavailable</h1><p>This preview has no Brazilian accounts or document actions.</p><a href="/us">DocWallet USA</a></main>;
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode>{content}</React.StrictMode>);
