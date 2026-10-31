import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Force light theme globally across the application
document.documentElement.setAttribute('data-theme', 'light');
document.documentElement.classList.remove('dark');
try {
  localStorage.removeItem('bop_theme');
  localStorage.removeItem('theme');
} catch {}

ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);