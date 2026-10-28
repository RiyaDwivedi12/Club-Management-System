import { io } from 'socket.io-client';

// Use VITE_API_URL if provided, or default to live Render backend in production
const SOCKET_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://club-management-system-1-t4a7.onrender.com' : 'http://localhost:5000');

const socket = io(SOCKET_URL, {
  autoConnect: true,
  withCredentials: true,
  transports: ['websocket', 'polling'],
});

export default socket;
