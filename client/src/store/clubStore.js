import { create } from 'zustand';
import axios from 'axios';
import toast from 'react-hot-toast';

// Set base URL or handle in vite config/axios instance globally
const API_URL = '/api/clubs';

const useClubStore = create((set, get) => ({
  clubs: [],
  currentClub: null,
  isLoading: false,
  error: null,

  fetchClubs: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(API_URL);
      set({ clubs: response.data, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || error.message, isLoading: false });
      toast.error('Failed to fetch clubs');
    }
  },

  fetchClubById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      set({ currentClub: response.data, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || error.message, isLoading: false });
      toast.error('Failed to fetch club details');
    }
  },

  requestJoinClub: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/${id}/request-join`, {}, { withCredentials: true });
      toast.success(response.data.message);
      // Refresh current club to update pending requests list
      await get().fetchClubById(id);
    } catch (error) {
      set({ error: error.response?.data?.message || error.message, isLoading: false });
      toast.error(error.response?.data?.message || 'Failed to request join');
    }
  },

  leaveClub: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/${id}/leave`, {}, { withCredentials: true });
      toast.success(response.data.message);
      // Refresh current club
      await get().fetchClubById(id);
    } catch (error) {
      set({ error: error.response?.data?.message || error.message, isLoading: false });
      toast.error(error.response?.data?.message || 'Failed to leave club');
    }
  },

  approveMember: async (id, userId, action) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(`${API_URL}/${id}/approve-member`, { userId, action }, { withCredentials: true });
      toast.success(response.data.message);
      // Refresh current club
      await get().fetchClubById(id);
    } catch (error) {
      set({ error: error.response?.data?.message || error.message, isLoading: false });
      toast.error(error.response?.data?.message || 'Failed to update member status');
    }
  },

  fetchPresidentClubs: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_URL}/president`, { withCredentials: true });
      set({ clubs: response.data, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || error.message, isLoading: false });
      toast.error('Failed to fetch your clubs');
    }
  },

  fetchCoordinatorClubs: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_URL}/coordinator`, { withCredentials: true });
      set({ clubs: response.data, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || error.message, isLoading: false });
      toast.error('Failed to fetch assigned clubs');
    }
  }
}));

export default useClubStore;
