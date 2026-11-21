import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClientProvider } from '@solana/react';
import { client } from './client';
import { App } from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClientProvider client={client}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClientProvider>
  </StrictMode>,
);
