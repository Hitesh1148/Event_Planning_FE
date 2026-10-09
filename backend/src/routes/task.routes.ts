import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, AuthenticatedRequest, requireEventAccess } from '../middleware/auth';

import { formatZodError } from '../utils/validation';

const router = Router();

const createTaskSchema = z.object({
  title: z.string().min(2, 'Task title is required'),
  description: z.string().optional(),
  assignedToId: z.string().optional(),
  deadline: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM')
});

// List event tasks
router.get('/events/:eventId/tasks', authenticate, requireEventAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tasks = await prisma.task.findMany({
      where: { eventId: req.params.eventId },
      include: {
        assignedTo: { select: { id: true, name: true, avatarUrl: true } },
        createdBy: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve tasks.' });
  }
});

// Create task
router.post('/events/:eventId/tasks', authenticate, requireEventAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const { title, description, assignedToId, deadline, priority } = parsed.data;

    const task = await prisma.task.create({
      data: {
        eventId: req.params.eventId,
        title,
        description,
        assignedToId: assignedToId || null,
        deadline: deadline ? new Date(deadline) : null,
        priority,
        status: 'TODO',
        createdById: req.user!.id
      },
      include: {
        assignedTo: { select: { id: true, name: true } }
      }
    });

    // Record decision history
    await prisma.decisionHistory.create({
      data: {
        eventId: req.params.eventId,
        actorId: req.user!.id,
        actionType: 'TASK_CREATED',
        entityType: 'Task',
        entityId: task.id,
        details: JSON.stringify({ title: task.title, priority, assignedTo: task.assignedTo?.name || 'Unassigned' })
      }
    });

    res.status(201).json({ task, message: 'Task created successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task.' });
  }
});

// Update task
router.patch('/tasks/:taskId', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    const { title, description, assignedToId, deadline, priority, status } = req.body;

    const existing = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!existing) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        title,
        description,
        assignedToId: assignedToId !== undefined ? (assignedToId || null) : undefined,
        deadline: deadline !== undefined ? (deadline ? new Date(deadline) : null) : undefined,
        priority,
        status
      },
      include: {
        assignedTo: { select: { id: true, name: true } }
      }
    });

    // Record history
    await prisma.decisionHistory.create({
      data: {
        eventId: existing.eventId,
        actorId: req.user!.id,
        actionType: 'TASK_UPDATED',
        entityType: 'Task',
        entityId: taskId,
        details: JSON.stringify({ title: updated.title, status: updated.status })
      }
    });

    res.json({ task: updated, message: 'Task updated.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task.' });
  }
});

// Delete task
router.delete('/tasks/:taskId', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existing) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }

    await prisma.task.delete({ where: { id: taskId } });
    res.json({ message: 'Task removed.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task.' });
  }
});

export default router;
