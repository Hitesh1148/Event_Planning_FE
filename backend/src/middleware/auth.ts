import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import prisma from '../prisma';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required. No token provided.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret) as AuthenticatedUser;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true }
    });

    if (!user) {
      res.status(401).json({ error: 'User account not found.' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired session token.' });
  }
};

export const requireGroupMember = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const groupId = req.params.groupId || req.body.groupId;
    if (!groupId) {
      res.status(400).json({ error: 'Group ID is required.' });
      return;
    }

    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: req.user!.id
        }
      }
    });

    if (!member) {
      res.status(403).json({ error: 'You are not a member of this group.' });
      return;
    }

    next();
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify group membership.' });
  }
};

export const requireEventAccess = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const eventId = req.params.eventId || req.body.eventId;
    if (!eventId) {
      res.status(400).json({ error: 'Event ID is required.' });
      return;
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        group: {
          include: {
            members: {
              where: { userId: req.user!.id }
            }
          }
        }
      }
    });

    if (!event) {
      res.status(404).json({ error: 'Event not found.' });
      return;
    }

    if (event.group.members.length === 0 && event.organizerId !== req.user!.id) {
      res.status(403).json({ error: 'Access denied. You do not belong to this event group.' });
      return;
    }

    next();
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify event access permissions.' });
  }
};
