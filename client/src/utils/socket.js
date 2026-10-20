import { io } from 'socket.io-client';
import { BACKEND_URL } from './config';

// Connect to EC2 backend or fallback to relative host in local dev
const socket = io(BACKEND_URL || undefined, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 20,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling']
});

export default socket;

