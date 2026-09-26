import React from 'react';
import ReactDOM from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import App from './App';
import { NativeDocWalletApp } from './components/NativeDocWalletApp';
import './index.css';

const configureNativeStatusBar = async () => {
  if (!Capacitor.isNativePlatform()) return;

  document.documentElement.classList.add('capacitor-native');

  try {
    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setBackgroundColor({ color: '#ffffff' });
    await StatusBar.setStyle({ style: Style.Dark });
  } catch (error) {
    console.warn('DocWallet status bar setup skipped:', error);
  }
};

configureNativeStatusBar();

const nativeWorkspacePaths = new Set(['/', '/inteligencia', '/docflow', '/docflow-business', '/assinaturas']);
const useNativeWorkspace = Capacitor.isNativePlatform() && nativeWorkspacePaths.has(window.location.pathname);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {useNativeWorkspace ? <NativeDocWalletApp initialPath={window.location.pathname} /> : <App />}
  </React.StrictMode>,
);
