import { create } from 'zustand';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = '/api/events';

const useEventStore = create((set, get) => ({
  events: [],
  currentEvent: null,
  isLoading: false,
  error: null,

  fetchEvents: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(API_URL);
      set({ events: response.data, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || error.message, isLoading: false });
      toast.error('Failed to fetch events');
    }
  },

  fetchEventById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      set({ currentEvent: response.data, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || error.message, isLoading: false });
      toast.error('Failed to fetch event details');
    }
  },

  createEvent: async (eventData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(API_URL, eventData, { withCredentials: true });
      set((state) => ({ events: [...state.events, response.data], isLoading: false }));
      toast.success('Event created successfully');
      return true;
    } catch (error) {
      set({ error: error.response?.data?.message || error.message, isLoading: false });
      toast.error(error.response?.data?.message || 'Failed to create event');
      return false;
    }
  },

  joinEvent: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/${id}/join`, {}, { withCredentials: true });
      toast.success(response.data.message);
      await get().fetchEvents();
      if (get().currentEvent && get().currentEvent._id === id) {
          await get().fetchEventById(id);
      }
      return true;
    } catch (error) {
      set({ error: error.response?.data?.message || error.message, isLoading: false });
      toast.error(error.response?.data?.message || 'Failed to join event');
      return false;
    }
  }
}));

export default useEventStore;
