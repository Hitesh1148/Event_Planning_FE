import { io, Socket } from 'socket.io-client';
import { getAuthToken } from './api';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token = getAuthToken();
    socket = io('/', {
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
  socket = io('/', {
    auth: { token },
    autoConnect: true,
    transports: ['websocket', 'polling']
  });
}
