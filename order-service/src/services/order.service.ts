import axios from 'axios';
import { OrderStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { CreateOrderDto, RejectOrderDto } from '../dto/order.dto';
import { EXTinguisher_CATALOG } from '../data/catalog';

const extinguisherServiceUrl =
  process.env.FIRE_EXTINGUISHER_SERVICE_URL || 'http://localhost:5003';
const notificationServiceUrl =
  process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5006';

function generateOrderNumber(): string {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `FG-${stamp}-${random}`;
}

async function notifyUser(userId: number, title: string, message: string): Promise<void> {
  try {
    await axios.post(`${notificationServiceUrl}/notifications/internal/send`, {
      userId,
      title,
      message,
      notificationType: 'ORDER',
      sendEmail: true,
    });
  } catch (error) {
    console.error('[order-service] Failed to send notification:', error);
  }
}

export function getCatalog() {
  return EXTinguisher_CATALOG;
}

export async function createOrder(clientId: number, data: CreateOrderDto) {
  for (const item of data.items) {
    const match = EXTinguisher_CATALOG.find((c) => c.type === item.extinguisherType);
    if (!match) {
      throw new Error(`Unknown extinguisher type: ${item.extinguisherType}`);
    }
  }

  const totalQuantity = data.items.reduce((sum, item) => sum + item.quantity, 0);
  const orderNumber = generateOrderNumber();

  const order = await prisma.purchaseOrder.create({
    data: {
      clientId,
      orderNumber,
      totalQuantity,
      notes: data.notes,
      status: OrderStatus.PENDING,
      items: {
        create: data.items.map((item) => ({
          extinguisherType: item.extinguisherType,
          quantity: item.quantity,
        })),
      },
    },
    include: { items: true },
  });

  await notifyUser(
    clientId,
    'Order Submitted',
    `Your order ${orderNumber} for ${totalQuantity} extinguisher(s) was submitted and is pending admin approval.`
  );

  return order;
}

export async function getAllOrders(clientId?: number) {
  return prisma.purchaseOrder.findMany({
    where: clientId ? { clientId } : undefined,
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getOrderById(id: number) {
  return prisma.purchaseOrder.findUnique({
    where: { id },
    include: { items: true },
  });
}

export async function approveOrder(id: number) {
  const order = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  if (order.status !== OrderStatus.PENDING) {
    throw new Error('Only pending orders can be approved');
  }

  await axios.post(`${extinguisherServiceUrl}/internal/from-order`, {
    clientId: order.clientId,
    orderNumber: order.orderNumber,
    items: order.items.map((item) => ({
      type: item.extinguisherType,
      quantity: item.quantity,
    })),
  });

  const updated = await prisma.purchaseOrder.update({
    where: { id },
    data: { status: OrderStatus.COMPLETED },
    include: { items: true },
  });

  await notifyUser(
    order.clientId,
    'Order Approved',
    `Your order ${order.orderNumber} has been approved. ${order.totalQuantity} extinguisher(s) are now registered to your account.`
  );

  return updated;
}

export async function rejectOrder(id: number, data: RejectOrderDto) {
  const order = await prisma.purchaseOrder.findUnique({ where: { id } });

  if (!order) {
    throw new Error('Order not found');
  }

  if (order.status !== OrderStatus.PENDING) {
    throw new Error('Only pending orders can be rejected');
  }

  const updated = await prisma.purchaseOrder.update({
    where: { id },
    data: {
      status: OrderStatus.REJECTED,
      rejectionReason: data.rejectionReason,
    },
    include: { items: true },
  });

  await notifyUser(
    order.clientId,
    'Order Rejected',
    `Your order ${order.orderNumber} was rejected. Reason: ${data.rejectionReason}`
  );

  return updated;
}

export async function getOrderStats() {
  const [total, pending, rejected, completed] = await Promise.all([
    prisma.purchaseOrder.count(),
    prisma.purchaseOrder.count({ where: { status: OrderStatus.PENDING } }),
    prisma.purchaseOrder.count({ where: { status: OrderStatus.REJECTED } }),
    prisma.purchaseOrder.count({ where: { status: OrderStatus.COMPLETED } }),
  ]);

  return { total, pending, rejected, completed };
}
