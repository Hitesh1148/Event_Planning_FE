import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import prisma from '../prisma';
import { AuthenticatedUser } from '../middleware/auth';

export interface AuthenticatedSocket extends Socket {
  user?: AuthenticatedUser;
}

export function setupSocketIO(io: Server) {
  // Socket authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        return next(new Error('Socket authentication error: Token not provided'));
      }

      const decoded = jwt.verify(token, config.jwtSecret) as AuthenticatedUser;
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, name: true }
      });

      if (!user) {
        return next(new Error('Socket authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Socket authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    // Authorized room join for events
    socket.on('join_event', async (eventId: string, callback?: (res: any) => void) => {
      try {
        if (!socket.user || !eventId) {
          if (callback) callback({ success: false, error: 'Unauthorized or missing event ID' });
          return;
        }

        // Verify membership access
        const event = await prisma.event.findUnique({
          where: { id: eventId },
          include: {
            group: {
              include: {
                members: { where: { userId: socket.user.id } }
              }
            }
          }
        });

        if (!event || (event.group.members.length === 0 && event.organizerId !== socket.user.id)) {
          if (callback) callback({ success: false, error: 'Access denied: not a group member' });
          return;
        }

        const roomName = `event:${eventId}`;
        socket.join(roomName);
        if (callback) callback({ success: true, room: roomName });
      } catch (e) {
        if (callback) callback({ success: false, error: 'Failed to join event room' });
      }
    });

    socket.on('leave_event', (eventId: string) => {
      socket.leave(`event:${eventId}`);
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  return {
    broadcastEventUpdate: (eventId: string, eventName: string, payload: any) => {
      io.to(`event:${eventId}`).emit(eventName, payload);
    }
  };
}
