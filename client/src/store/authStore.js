import { create } from 'zustand';
import axios from 'axios';

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('userInfo')) || null,
  isAuthenticated: !!localStorage.getItem('userInfo'),
  
  setCredentials: (userData) => {
    localStorage.setItem('userInfo', JSON.stringify(userData));
    // Save token for cross-domain auth (Vercel + Render)
    if (userData.token) {
      localStorage.setItem('authToken', userData.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
    }
    set({ user: userData, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('userInfo');
    localStorage.removeItem('authToken');
    delete axios.defaults.headers.common['Authorization'];
    set({ user: null, isAuthenticated: false });
  }
}));

// Restore token on page refresh
const savedToken = localStorage.getItem('authToken');
if (savedToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
}

export default useAuthStore;
