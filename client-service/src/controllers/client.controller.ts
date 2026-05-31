import { Request, Response } from 'express';
import {
  createClient,
  getAllClients,
  getClientById,
  searchClients,
  updateClient,
  deleteClient,
  getClientHistory,
  getClientStats,
  getMonthlyRegistrations,
} from '../services/client.service';

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const client = await createClient(req.body);
    res.status(201).json(client);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create client';
    res.status(400).json({ error: message });
  }
}

export async function list(req: Request, res: Response): Promise<void> {
  try {
    const clients = await getAllClients();
    res.json(clients);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch clients';
    res.status(500).json({ error: message });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid client ID' });
      return;
    }

    const client = await getClientById(id);
    if (!client) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    res.json(client);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch client';
    res.status(500).json({ error: message });
  }
}

export async function search(req: Request, res: Response): Promise<void> {
  try {
    const query = (req.query.q as string) || '';
    if (!query.trim()) {
      res.status(400).json({ error: 'Search query is required' });
      return;
    }

    const clients = await searchClients(query);
    res.json(clients);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Search failed';
    res.status(500).json({ error: message });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid client ID' });
      return;
    }

    const client = await updateClient(id, req.body);
    res.json(client);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update client';
    const status = message === 'Client not found' ? 404 : 400;
    res.status(status).json({ error: message });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid client ID' });
      return;
    }

    await deleteClient(id);
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete client';
    const status = message === 'Client not found' ? 404 : 500;
    res.status(status).json({ error: message });
  }
}

export async function history(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid client ID' });
      return;
    }

    const records = await getClientHistory(id);
    res.json(records);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch history';
    const status = message === 'Client not found' ? 404 : 500;
    res.status(status).json({ error: message });
  }
}

export async function stats(_req: Request, res: Response): Promise<void> {
  try {
    const result = await getClientStats();
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch stats';
    res.status(500).json({ error: message });
  }
}

export async function monthlyRegistrations(_req: Request, res: Response): Promise<void> {
  try {
    const data = await getMonthlyRegistrations();
    res.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch data';
    res.status(500).json({ error: message });
  }
}
