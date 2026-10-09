import { io, Socket } from 'socket.io-client';
import { getAuthToken } from './api';

const SOCKET_URL = import.meta.env.VITE_API_URL || '/';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token = getAuthToken();
    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
      transports: ['websocket', 'polling']
    });
  }
  return socket;
}

export function reconnectSocketWithToken(token: string) {
  if (socket) {
    socket.disconnect();
  }
  socket = io(SOCKET_URL, {
    auth: { token },
    autoConnect: true,
    transports: ['websocket', 'polling']
  });
}
