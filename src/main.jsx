import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { loadCachedTheme } from './lib/theme'

// Apply cached org theme BEFORE first React render to prevent color flash
loadCachedTheme();

ReactDOM.createRoot(document.getElementById('root')).render(

  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
