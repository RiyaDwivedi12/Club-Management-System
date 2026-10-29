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
    // --- 1. Attach auth token ---
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
      // Use .set() for Axios 1.x AxiosHeaders compatibility
      if (typeof config.headers?.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }

    // --- 2. Auto-fix multipart boundary ---
    // When sending FormData, remove any manually set Content-Type so
    // the browser auto-appends the correct boundary parameter
    if (config.data instanceof FormData) {
      if (typeof config.headers?.delete === 'function') {
        config.headers.delete('Content-Type');
      } else if (config.headers) {
        delete config.headers['Content-Type'];
        delete config.headers['content-type'];
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);


// Auto-recover if token expired or changed
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const msg = error.response?.data?.message || '';
    if (status === 401 && (msg.includes('token failed') || msg.includes('token expired'))) {
      localStorage.removeItem('authToken');
      try {
        const u = JSON.parse(localStorage.getItem('userInfo') || '{}');
        if (u?.token) {
          delete u.token;
          localStorage.setItem('userInfo', JSON.stringify(u));
        }
      } catch (e) {}
    }
    return Promise.reject(error);
  }
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
