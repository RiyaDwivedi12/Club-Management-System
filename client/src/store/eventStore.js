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
      const list = Array.isArray(response.data)
        ? response.data
        : (Array.isArray(response.data?.events) ? response.data.events : []);
      set({ events: list, isLoading: false });
    } catch (error) {
      set({ events: [], error: error.response?.data?.message || error.message, isLoading: false });
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
  },

  updateEvent: async (id, eventData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(`${API_URL}/${id}`, eventData, { withCredentials: true });
      set((state) => ({
        events: state.events.map(e => e._id === id ? response.data : e),
        isLoading: false
      }));
      toast.success('Event updated successfully');
      return true;
    } catch (error) {
      set({ error: error.response?.data?.message || error.message, isLoading: false });
      toast.error(error.response?.data?.message || 'Failed to update event');
      return false;
    }
  },

  deleteEvent: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await axios.delete(`${API_URL}/${id}`, { withCredentials: true });
      set((state) => ({
        events: state.events.filter(e => e._id !== id),
        isLoading: false
      }));
      toast.success('Event deleted successfully');
      return true;
    } catch (error) {
      set({ error: error.response?.data?.message || error.message, isLoading: false });
      toast.error(error.response?.data?.message || 'Failed to delete event');
      return false;
    }
  },

  fetchEventsByClub: async (clubId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_URL}/club/${clubId}`);
      set({ events: response.data, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || error.message, isLoading: false });
      toast.error('Failed to fetch club events');
    }
  },

  approveEvent: async (id, note = '') => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(`${API_URL}/${id}/approve`, { note }, { withCredentials: true });
      set((state) => ({
        events: state.events.map(e => e._id === id ? response.data : e),
        isLoading: false
      }));
      toast.success('Event approved successfully');
      return true;
    } catch (error) {
      set({ error: error.response?.data?.message || error.message, isLoading: false });
      toast.error(error.response?.data?.message || 'Failed to approve event');
      return false;
    }
  },

  rejectEvent: async (id, note) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(`${API_URL}/${id}/reject`, { note }, { withCredentials: true });
      set((state) => ({
        events: state.events.map(e => e._id === id ? response.data : e),
        isLoading: false
      }));
      toast.success('Event rejected successfully');
      return true;
    } catch (error) {
      set({ error: error.response?.data?.message || error.message, isLoading: false });
      toast.error(error.response?.data?.message || 'Failed to reject event');
      return false;
    }
  },

  overrideEvent: async (id, status, reason) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(`${API_URL}/${id}/override`, { status, reason }, { withCredentials: true });
      set((state) => ({
        events: state.events.map(e => e._id === id ? response.data : e),
        isLoading: false
      }));
      toast.success(`Event status overridden to ${status}`);
      return true;
    } catch (error) {
      set({ error: error.response?.data?.message || error.message, isLoading: false });
      toast.error(error.response?.data?.message || 'Failed to override event');
      return false;
    }
  }
}));

export default useEventStore;
