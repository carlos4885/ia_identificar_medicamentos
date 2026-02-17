import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // 1. Importamos el Router
import App from './App.jsx'
import './index.css' // Si tienes estilos globales

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)