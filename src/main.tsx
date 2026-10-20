import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import InstallAppPrompt from './components/InstallAppPrompt';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <InstallAppPrompt />
  </StrictMode>,
);

// Service worker minimal pour permettre l'installation PWA
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* silencieux si hors HTTPS / dev sans SW */
    });
  });
}
