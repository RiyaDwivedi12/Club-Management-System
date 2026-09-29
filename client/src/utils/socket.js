import { io } from 'socket.io-client';

// Usually we proxy API requests, but for Socket.IO it's better to provide the explicit URL if not on same host.
// Assuming development on localhost:5000 and production on same origin.
const SOCKET_URL = import.meta.env.PROD ? undefined : 'http://localhost:5000';

const socket = io(SOCKET_URL, {
  autoConnect: true,
  withCredentials: true,
});

export default socket;
