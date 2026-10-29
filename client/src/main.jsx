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

// Ensure authToken is populated from userInfo if previously logged in
try {
  const stored = JSON.parse(localStorage.getItem('userInfo') || '{}');
  if (stored?.token && !localStorage.getItem('authToken')) {
    localStorage.setItem('authToken', stored.token);
  }
} catch (e) {
  // ignore json parse error
}

// Dynamic request interceptor: attach Bearer token on EVERY outgoing HTTP call
axios.interceptors.request.use(
  (config) => {
    let token = localStorage.getItem('authToken');
    if (!token) {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        token = userInfo?.token;
      } catch (e) {
        token = null;
      }
    }
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Auto-fix for all document/file uploads:
    // If request data is FormData, remove manual Content-Type so browser sets correct boundary
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
