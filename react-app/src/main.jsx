import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

// Wait for DOM to be ready
const rootElement = document.getElementById('react-shopping-app-root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('✅ React Mini-App mounted successfully');
} else {
  console.error('❌ React root element not found: #react-shopping-app-root');
}
