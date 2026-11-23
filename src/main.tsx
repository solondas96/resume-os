import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { UpdatePrompt } from './components/pwa/UpdatePrompt';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
    {/* Mounted at the root, so the service worker registers on every screen, including first run */}
    <UpdatePrompt />
  </React.StrictMode>
);
