import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './i18n'; // <-- ensure global i18n is initialized once
import './index.css';
import { HelmetProvider } from 'react-helmet-async'; // ✅ SEO provider

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
  // ...your existing imports/render

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('SW registration failed', err);
    });
  });
}

);
