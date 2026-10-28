import { create } from 'zustand';
import axios from 'axios';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const API_URL = '/api/notifications';
const SOCKET_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? undefined : 'http://localhost:5000');

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  socket: null,
  isLoading: false,

  initSocket: (user) => {
    if (!user) return;

    // Avoid duplicate socket connection if already connected
    const currentSocket = get().socket;
    if (currentSocket && currentSocket.connected) return;

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      socket.emit('setup', user);
    });

    socket.on('notification', (newNotification) => {
      // Trigger a clean toast notification popup
      toast(newNotification.message, {
        icon: '🔔',
        style: {
          borderRadius: '14px',
          background: '#0d9488',
          color: '#ffffff',
          fontWeight: 'bold',
          fontSize: '13px',
        },
        duration: 4500,
      });

      set((state) => {
        // Prevent duplicate notifications in list
        const exists = state.notifications.some((n) => n._id === newNotification._id);
        if (exists) return state;

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
      const notifications = response.data || [];
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
  },

  markAllAsRead: async () => {
    try {
      await axios.put(`${API_URL}/read-all`, {}, { withCredentials: true });
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('Failed to mark all notifications as read', error);
    }
  },

  deleteNotification: async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`, { withCredentials: true });
      set((state) => {
        const notifications = state.notifications.filter((n) => n._id !== id);
        return {
          notifications,
          unreadCount: notifications.filter((n) => !n.isRead).length,
        };
      });
    } catch (error) {
      console.error('Failed to delete notification', error);
    }
  },
}));

export default useNotificationStore;
