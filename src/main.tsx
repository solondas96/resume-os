import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/errors/ErrorBoundary';
import { UpdatePrompt } from './components/pwa/UpdatePrompt';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary area="The app">
      <App />
    </ErrorBoundary>
    {/* Mounted at the root, so the service worker registers on every screen, including first run */}
    <UpdatePrompt />
  </React.StrictMode>
);
