import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx' // Asegúrate de que importas App de ./App.jsx
// import './index.css' // Descomenta esto si tienes un archivo css global

// Esta es la forma moderna de iniciar React (versión 18)
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)