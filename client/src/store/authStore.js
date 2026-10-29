import { create } from 'zustand';
import axios from 'axios';

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('userInfo')) || null,
  isAuthenticated: !!localStorage.getItem('userInfo'),
  
  setCredentials: (userData) => {
    localStorage.setItem('userInfo', JSON.stringify(userData));
    // Save token separately for cross-domain auth (Vercel + Render)
    if (userData.token) {
      localStorage.setItem('authToken', userData.token);
      // Works for both Axios 1.x and older
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

// Restore token on page refresh — runs when store is first imported
try {
  const savedToken =
    localStorage.getItem('authToken') ||
    JSON.parse(localStorage.getItem('userInfo') || '{}')?.token;

  if (savedToken) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
    if (!localStorage.getItem('authToken')) {
      localStorage.setItem('authToken', savedToken);
    }
  }
} catch (e) {
  // ignore JSON parse errors on corrupt localStorage
}

export default useAuthStore;
