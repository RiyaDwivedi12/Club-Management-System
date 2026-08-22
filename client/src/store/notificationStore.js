import { create } from 'zustand';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = '/api/notifications';
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  socket: null,
  isLoading: false,

  initSocket: (user) => {
    if (!user) return;
    const socket = io(SOCKET_URL);
    socket.emit('setup', user);

    socket.on('notification', (newNotification) => {
      set((state) => {
        const notifications = [newNotification, ...state.notifications];
        return {
          notifications,
          unreadCount: notifications.filter((n) => !n.isRead).length,
        };
      });
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const response = await axios.get(API_URL, { withCredentials: true });
      const notifications = response.data;
      set({
        notifications,
        unreadCount: notifications.filter((n) => !n.isRead).length,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch notifications', error);
      set({ isLoading: false });
    }
  },

  markAsRead: async (id) => {
    try {
      await axios.put(`${API_URL}/${id}/read`, {}, { withCredentials: true });
      set((state) => {
        const notifications = state.notifications.map((n) =>
          n._id === id ? { ...n, isRead: true } : n
        );
        return {
          notifications,
          unreadCount: notifications.filter((n) => !n.isRead).length,
        };
      });
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  }
}));

export default useNotificationStore;
