import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { LifeLinkProvider } from './context/LifeLinkContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LifeLinkProvider>
      <App />
    </LifeLinkProvider>
  </React.StrictMode>
);
