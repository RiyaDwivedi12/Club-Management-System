import { io } from 'socket.io-client';

// Use VITE_API_URL if provided (for remote backend), otherwise fallback to same-origin in PROD or localhost:5000 in DEV
const SOCKET_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? undefined : 'http://localhost:5000');

const socket = io(SOCKET_URL, {
  autoConnect: true,
  withCredentials: true,
  transports: ['websocket', 'polling'],
});

export default socket;
