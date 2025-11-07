import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import './i18n';

const root = ReactDOM.createRoot(document.getElementById('root'));

function renderApp() {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

renderApp();

// Optional: Vite-specific HMR setup for React
if (import.meta.hot) {
  import.meta.hot.accept('./App', () => {
    renderApp();
  });
}