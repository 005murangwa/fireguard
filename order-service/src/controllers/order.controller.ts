import { Request, Response } from 'express';
import {
  createOrder,
  getAllOrders,
  getOrderById,
  approveOrder,
  rejectOrder,
  getOrderStats,
  getCatalog,
} from '../services/order.service';

export async function create(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const order = await createOrder(req.user.userId, req.body);
    res.status(201).json(order);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create order';
    res.status(400).json({ error: message });
  }
}

export async function list(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const clientId = req.user.role === 'CLIENT' ? req.user.userId : undefined;
    const orders = await getAllOrders(clientId);
    res.json(orders);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch orders';
    res.status(500).json({ error: message });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid order ID' });
      return;
    }
    const order = await getOrderById(id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    if (req.user?.role === 'CLIENT' && order.clientId !== req.user.userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    res.json(order);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch order';
    res.status(500).json({ error: message });
  }
}

export async function approve(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid order ID' });
      return;
    }
    const order = await approveOrder(id);
    res.json(order);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to approve order';
    res.status(400).json({ error: message });
  }
}

export async function reject(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid order ID' });
      return;
    }
    const order = await rejectOrder(id, req.body);
    res.json(order);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reject order';
    res.status(400).json({ error: message });
  }
}

export async function catalog(_req: Request, res: Response): Promise<void> {
  res.json(getCatalog());
}

export async function stats(_req: Request, res: Response): Promise<void> {
  try {
    const result = await getOrderStats();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
}

export async function pending(_req: Request, res: Response): Promise<void> {
  try {
    const orders = await getAllOrders();
    res.json(orders.filter((o) => o.status === 'PENDING'));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending orders' });
  }
}
