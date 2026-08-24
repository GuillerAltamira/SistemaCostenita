import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';
import { checkAndMigrateLocalStorage } from './services/mockData';

// Asegurar que el almacenamiento local esté sincronizado con la versión por peso (Gramos/Kg)
checkAndMigrateLocalStorage();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
