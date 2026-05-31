import axios from 'axios';
import { OrderStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { CreateOrderDto, RejectOrderDto } from '../dto/order.dto';

const extinguisherServiceUrl =
  process.env.EXTinguisher_SERVICE_URL || 'http://localhost:5003';
const notificationServiceUrl =
  process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5004';

function generateOrderNumber(): string {
  const date = new Date();
  const stamp = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `PO-${stamp}-${random}`;
}

function generateSerialNumber(orderNumber: string, itemId: number, index: number): string {
  return `${orderNumber}-${itemId}-${index + 1}`;
}

async function notifyClient(clientId: number, message: string): Promise<void> {
  try {
    await axios.post(`${notificationServiceUrl}/notifications/email`, {
      clientId,
      subject: 'Fire Extinguisher System Update',
      html: `<p>${message}</p>`,
    });
  } catch (error) {
    console.error('Failed to notify client:', error);
  }
}

export async function createOrder(clientId: number, data: CreateOrderDto) {
  const totalQuantity = data.items.reduce((sum, item) => sum + item.quantity, 0);
  const orderNumber = generateOrderNumber();

  return prisma.purchaseOrder.create({
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

  const purchaseDate = new Date();
  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);

  for (const item of order.items) {
    for (let i = 0; i < item.quantity; i++) {
      await axios.post(`${extinguisherServiceUrl}/extinguishers`, {
        clientId: order.clientId,
        serialNumber: generateSerialNumber(order.orderNumber, item.id, i),
        extinguisherType: item.extinguisherType,
        quantity: 1,
        purchaseDate: purchaseDate.toISOString(),
        expiryDate: expiryDate.toISOString(),
      });
    }
  }

  const updated = await prisma.purchaseOrder.update({
    where: { id },
    data: { status: OrderStatus.COMPLETED },
    include: { items: true },
  });

  await notifyClient(
    order.clientId,
    `Your purchase order ${order.orderNumber} has been approved. ${order.totalQuantity} extinguisher(s) are now registered and monitoring has started.`
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

  await notifyClient(
    order.clientId,
    `Your purchase order ${order.orderNumber} was rejected. Reason: ${data.rejectionReason}`
  );

  return updated;
}

export async function getOrderStats() {
  const [total, pending, approved, rejected, completed] = await Promise.all([
    prisma.purchaseOrder.count(),
    prisma.purchaseOrder.count({ where: { status: OrderStatus.PENDING } }),
    prisma.purchaseOrder.count({ where: { status: OrderStatus.APPROVED } }),
    prisma.purchaseOrder.count({ where: { status: OrderStatus.REJECTED } }),
    prisma.purchaseOrder.count({ where: { status: OrderStatus.COMPLETED } }),
  ]);

  return { total, pending, approved, rejected, completed };
}

export async function getMonthlyOrders() {
  const orders = await prisma.purchaseOrder.findMany({
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const monthMap = new Map<string, number>();
  for (const order of orders) {
    const month = order.createdAt.toISOString().slice(0, 7);
    monthMap.set(month, (monthMap.get(month) || 0) + 1);
  }

  return Array.from(monthMap.entries()).map(([month, count]) => ({ month, count }));
}
