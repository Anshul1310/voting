import { io } from 'socket.io-client';

// Connect to backend (relative path uses Vite's proxy in dev or same host in prod)
const socket = io({
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 20,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling']
});

export default socket;
