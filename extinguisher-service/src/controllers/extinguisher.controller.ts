import { Request, Response } from 'express';
import {
  createExtinguisher,
  getAllExtinguishers,
  getExtinguisherById,
  updateExtinguisher,
  deleteExtinguisher,
  getExpiringExtinguishers,
  getExtinguisherStats,
  getMonthlyExpirations,
  getExtinguishersByClientId,
} from '../services/extinguisher.service';

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const extinguisher = await createExtinguisher(req.body);
    res.status(201).json(extinguisher);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create extinguisher';
    res.status(400).json({ error: message });
  }
}

export async function list(req: Request, res: Response): Promise<void> {
  try {
    const clientIdParam = req.query.clientId
      ? parseInt(req.query.clientId as string, 10)
      : undefined;

    if (req.user?.role === 'CLIENT') {
      const items = await getAllExtinguishers(req.user.userId);
      res.json(items);
      return;
    }

    if (clientIdParam) {
      const items = await getExtinguishersByClientId(clientIdParam);
      res.json(items);
      return;
    }

    const extinguishers = await getAllExtinguishers();
    res.json(extinguishers);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch extinguishers';
    res.status(500).json({ error: message });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid extinguisher ID' });
      return;
    }
    const extinguisher = await getExtinguisherById(id);
    if (!extinguisher) {
      res.status(404).json({ error: 'Extinguisher not found' });
      return;
    }
    if (req.user?.role === 'CLIENT' && extinguisher.clientId !== req.user.userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    res.json(extinguisher);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch extinguisher' });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid extinguisher ID' });
      return;
    }
    const extinguisher = await updateExtinguisher(id, req.body);
    res.json(extinguisher);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update extinguisher';
    res.status(message === 'Extinguisher not found' ? 404 : 400).json({ error: message });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid extinguisher ID' });
      return;
    }
    await deleteExtinguisher(id);
    res.json({ message: 'Extinguisher deleted successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete extinguisher';
    res.status(message === 'Extinguisher not found' ? 404 : 500).json({ error: message });
  }
}

export async function expiring(req: Request, res: Response): Promise<void> {
  try {
    const type = req.query.type as 'THIRTY_DAYS' | 'FOURTEEN_DAYS' | 'SEVEN_DAYS' | 'EXPIRED';
    if (!type) {
      res.status(400).json({ error: 'Valid type parameter is required' });
      return;
    }
    const extinguishers = await getExpiringExtinguishers(type);
    res.json(extinguishers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expiring extinguishers' });
  }
}

export async function stats(req: Request, res: Response): Promise<void> {
  try {
    const clientId = req.user?.role === 'CLIENT' ? req.user.userId : undefined;
    const result = await getExtinguisherStats(clientId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
}

export async function monthlyExpirations(_req: Request, res: Response): Promise<void> {
  try {
    const data = await getMonthlyExpirations();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
}
