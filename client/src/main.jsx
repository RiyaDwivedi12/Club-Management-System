import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import App from './App.jsx'
import './index.css'

// Connect to live Render backend in production automatically
const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://club-management-system-1-t4a7.onrender.com' : '');
if (API_BASE) {
  axios.defaults.baseURL = API_BASE;
}
axios.defaults.withCredentials = true;

// Attach Bearer token from localStorage for cross-domain auth
const savedAuth = localStorage.getItem('authToken');
if (savedAuth) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${savedAuth}`;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
