import { create } from 'zustand';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = '/api/matches';

const useMatchStore = create((set, get) => ({
  matches: [],
  currentMatch: null,
  isLoading: false,
  error: null,

  fetchMatches: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(API_URL);
      set({ matches: response.data, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || error.message, isLoading: false });
      toast.error('Failed to fetch matches');
    }
  },

  createMatch: async (matchData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(API_URL, matchData, { withCredentials: true });
      set((state) => ({ matches: [...state.matches, response.data], isLoading: false }));
      toast.success('Match scheduled successfully! Referee login created.');
      return true;
    } catch (error) {
      set({ error: error.response?.data?.message || error.message, isLoading: false });
      toast.error(error.response?.data?.message || 'Failed to schedule match');
      return false;
    }
  },

  updateScore: async (id, scores) => {
    try {
      const response = await axios.put(`${API_URL}/${id}/score`, scores, { withCredentials: true });
      // Update the match in the list
      set((state) => ({
        matches: state.matches.map(m => m._id === id ? response.data : m)
      }));
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update score');
      return false;
    }
  },

  endMatch: async (id, data) => {
    try {
      const response = await axios.put(`${API_URL}/${id}/end`, data, { withCredentials: true });
      // Update the match in the list
      set((state) => ({
        matches: state.matches.map(m => m._id === id ? response.data : m)
      }));
      toast.success('Match ended successfully');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to end match');
      return false;
    }
  }
}));

export default useMatchStore;
