import { Request, Response } from 'express';
import {
  createFollowUp,
  getAllFollowUps,
  getFollowUpById,
  updateFollowUp,
  deleteFollowUp,
  getPendingCount,
  getFollowUpStats,
} from '../services/follow-up.service';

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const followUp = await createFollowUp(req.body);
    res.status(201).json(followUp);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create follow-up' });
  }
}

export async function list(req: Request, res: Response): Promise<void> {
  try {
    const clientId = req.user?.role === 'CLIENT' ? req.user.userId : undefined;
    const followUps = await getAllFollowUps(clientId);
    res.json(followUps);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch follow-ups' });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const followUp = await getFollowUpById(id);
    if (!followUp) {
      res.status(404).json({ error: 'Follow-up not found' });
      return;
    }
    if (req.user?.role === 'CLIENT' && followUp.clientId !== req.user.userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    res.json(followUp);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch follow-up' });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const followUp = await updateFollowUp(id, req.body);
    res.json(followUp);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update';
    res.status(message === 'Follow-up not found' ? 404 : 400).json({ error: message });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    await deleteFollowUp(id);
    res.json({ message: 'Follow-up deleted' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete';
    res.status(message === 'Follow-up not found' ? 404 : 500).json({ error: message });
  }
}

export async function pending(_req: Request, res: Response): Promise<void> {
  try {
    const count = await getPendingCount();
    res.json({ pending: count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending count' });
  }
}

export async function stats(_req: Request, res: Response): Promise<void> {
  try {
    const result = await getFollowUpStats();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
}
