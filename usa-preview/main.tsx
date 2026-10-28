import React from 'react';
import { createRoot } from 'react-dom/client';
import USPreview from '../src/components/USPreview';
import USWorkspace from '../src/components/USWorkspace';

// Explicit route allowlist: never import App.tsx, BR auth, billing, API or PWA.
const path = window.location.pathname.replace(/\/+$/, '') || '/';
const screen = path === '/' || path === '/us'
  ? <USPreview />
  : path === '/us/workspace'
    ? <USWorkspace />
    : <main lang="en-US"><h1>Page not found</h1><p>This USA demonstration has no account, payment or Brazilian application routes.</p></main>;
createRoot(document.getElementById('root')!).render(<React.StrictMode>{screen}</React.StrictMode>);
