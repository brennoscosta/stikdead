import { io } from 'socket.io-client';
import { getToken } from './api.js';

let socket = null;

export function getSocket() {
  if (socket) return socket;
  const base = import.meta.env.VITE_API_URL || '/';
  socket = io(base, {
    auth: { token: getToken() },
    transports: ['websocket', 'polling'],
  });
  return socket;
}

export function closeSocket() {
  socket?.close();
  socket = null;
}
