import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, AuthenticatedRequest, requireGroupMember } from '../middleware/auth';

import { formatZodError } from '../utils/validation';

const router = Router();

const createGroupSchema = z.object({
  name: z.string().min(2, 'Group name must be at least 2 characters'),
  description: z.string().optional(),
});

// List user's groups
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const memberships = await prisma.groupMember.findMany({
      where: { userId: req.user!.id },
      include: {
        group: {
          include: {
            members: {
              include: {
                user: { select: { id: true, name: true, email: true, avatarUrl: true } }
              }
            },
            events: {
              select: { id: true, title: true, status: true, selectedDate: true, eventType: true }
            }
          }
        }
      },
      orderBy: { joinedAt: 'desc' }
    });

    res.json({ groups: memberships.map(m => ({ ...m.group, myRole: m.role })) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve groups.' });
  }
});

// Create group
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parsed = createGroupSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const { name, description } = parsed.data;
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const group = await prisma.group.create({
      data: {
        name,
        description,
        inviteCode,
        createdById: req.user!.id,
        members: {
          create: {
            userId: req.user!.id,
            role: 'ADMIN'
          }
        }
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } }
        }
      }
    });

    res.status(201).json({ group, message: 'Group created successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create group.' });
  }
});

// Get group details
router.get('/:groupId', authenticate, requireGroupMember, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const group = await prisma.group.findUnique({
      where: { id: req.params.groupId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } }
          }
        },
        events: {
          include: {
            organizer: { select: { id: true, name: true } },
            members: true,
            proposals: true
          },
          orderBy: { createdAt: 'desc' }
        },
        invitations: {
          where: { status: 'PENDING' }
        }
      }
    });

    if (!group) {
      res.status(404).json({ error: 'Group not found.' });
      return;
    }

    res.json({ group });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve group details.' });
  }
});

// Join group via invite code
router.post('/join', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode) {
      res.status(400).json({ error: 'Invite code is required.' });
      return;
    }

    const group = await prisma.group.findUnique({
      where: { inviteCode: inviteCode.trim().toUpperCase() }
    });

    if (!group) {
      res.status(404).json({ error: 'No group found with this invite code.' });
      return;
    }

    const existing = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: req.user!.id
        }
      }
    });

    if (existing) {
      res.status(400).json({ error: 'You are already a member of this group.' });
      return;
    }

    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: req.user!.id,
        role: 'MEMBER'
      }
    });

    res.json({ group, message: `Successfully joined ${group.name}!` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to join group.' });
  }
});

// Send invitation by email
router.post('/:groupId/invitations', authenticate, requireGroupMember, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      res.status(400).json({ error: 'Valid email is required.' });
      return;
    }

    const token = Math.random().toString(36).substring(2, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await prisma.groupInvitation.create({
      data: {
        groupId: req.params.groupId,
        email: email.toLowerCase(),
        token,
        invitedById: req.user!.id,
        expiresAt
      }
    });

    res.status(201).json({
      invitation,
      inviteUrl: `/invite/${token}`,
      message: `Invitation generated for ${email}.`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create group invitation.' });
  }
});

// Leave group or remove member
router.delete('/:groupId/members/:userId', authenticate, requireGroupMember, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { groupId, userId } = req.params;
    const currentUserId = req.user!.id;

    // Check if requester is admin or leaving themselves
    if (userId !== currentUserId) {
      const requesterMembership = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId: currentUserId } }
      });
      if (requesterMembership?.role !== 'ADMIN') {
        res.status(403).json({ error: 'Only group admins can remove other members.' });
        return;
      }
    }

    await prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId } }
    });

    res.json({ message: 'Member removed from group.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove member.' });
  }
});

export default router;
