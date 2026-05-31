/** FireGuard LTD shared TypeScript types for the React frontend. */

export type UserRole = 'ADMIN' | 'INSPECTOR' | 'CLIENT';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  isVerified: boolean;
  createdAt: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface FireExtinguisher {
  id: number;
  extinguisherCode: string;
  type: string;
  manufacturer: string;
  capacity: string;
  installationLocation: string;
  manufacturingDate: string;
  expirationDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'UNDER_MAINTENANCE' | 'INSPECTION_DUE';
  assignedClientId: number | null;
  qrCodeData: string | null;
  createdAt: string;
}

export interface Inspection {
  id: number;
  extinguisherCode: string;
  inspectorId: number;
  inspectionDate: string;
  condition: string;
  remarks: string | null;
  nextInspectionDate: string;
}

export interface MaintenanceRecord {
  id: number;
  extinguisherCode: string;
  maintenanceDate: string;
  description: string;
  technician: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  isRead: boolean;
  notificationType: string;
  createdAt: string;
}

export interface AdminDashboardStats {
  totalUsers: number;
  totalExtinguishers: number;
  activeExtinguishers: number;
  expiredExtinguishers: number;
  pendingInspections: number;
  upcomingExpirations: number;
  notificationsSent: number;
}

export interface CatalogItem {
  type: string;
  manufacturer: string;
  capacity: string;
  description: string;
  unitPrice: number;
}

export interface PurchaseOrderItem {
  id: number;
  extinguisherType: string;
  quantity: number;
}

export interface PurchaseOrder {
  id: number;
  clientId: number;
  orderNumber: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  totalQuantity: number;
  notes: string | null;
  rejectionReason: string | null;
  createdAt: string;
  items: PurchaseOrderItem[];
}

/** Paginated list shape returned by fire-extinguisher-service GET /extinguishers */
export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
