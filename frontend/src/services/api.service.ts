/**
 * FireGuard LTD API client — all requests go through the API Gateway (port 5000).
 */
import api from '../lib/api';
import type {
  LoginResponse,
  User,
  FireExtinguisher,
  Inspection,
  MaintenanceRecord,
  Notification,
  AdminDashboardStats,
  Paginated,
  CatalogItem,
  PurchaseOrder,
} from '../types';

/** Backend may return a plain array or { data: T[] } — always normalize to T[]. */
function asArray<T>(payload: T[] | Paginated<T>): T[] {
  return Array.isArray(payload) ? payload : (payload?.data ?? []);
}

export const authApi = {
  signup: (data: { firstName: string; lastName: string; email: string; phoneNumber: string; password: string; role?: string }) =>
    api.post('/auth/signup', data),
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }),
  verifyOtp: (email: string, otpCode: string) =>
    api.post<LoginResponse>('/auth/verify-otp', { email, otpCode }),
  resendOtp: (email: string) => api.post('/auth/resend-otp', { email }),
  getMe: () => api.get<User>('/auth/me').catch(() => null),
};

export const userApi = {
  getAll: (params?: Record<string, string>) =>
    api.get('/users', { params }).then((res) => {
      const payload = res.data as { data?: User[] } | User[];
      const items = Array.isArray(payload) ? payload : (payload?.data ?? []);
      return { ...res, data: items };
    }),
  getStats: () => api.get('/users/stats'),
  update: (id: number, data: Partial<User>) => api.patch(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
  assignRole: (id: number, role: string) => api.patch(`/users/${id}/role`, { role }),
  getStaff: () => api.get<User[]>('/users/staff'),
};

export const extinguisherApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<Paginated<FireExtinguisher>>('/extinguishers', { params }).then((res) => {
      const payload = res.data;
      const items = asArray(payload);
      const meta = Array.isArray(payload)
        ? { total: items.length, page: 1, limit: items.length, totalPages: 1 }
        : { total: payload.total, page: payload.page, limit: payload.limit, totalPages: payload.totalPages };
      return { ...res, data: items, meta };
    }),
  getById: (id: number) => api.get<FireExtinguisher>(`/extinguishers/${id}`),
  create: (data: Partial<FireExtinguisher>) => api.post<FireExtinguisher>('/extinguishers', data),
  update: (id: number, data: Partial<FireExtinguisher>) => api.patch<FireExtinguisher>(`/extinguishers/${id}`, data),
  delete: (id: number) => api.delete(`/extinguishers/${id}`),
  scan: (code: string) => api.get(`/extinguishers/scan/${code}`),
};

export const inspectionApi = {
  getAll: () => api.get<Inspection[]>('/inspections'),
  create: (data: Partial<Inspection>) => api.post<Inspection>('/inspections', data),
  update: (id: number, data: Partial<Inspection>) => api.patch<Inspection>(`/inspections/${id}`, data),
  delete: (id: number) => api.delete(`/inspections/${id}`),
  history: (code: string) => api.get<Inspection[]>(`/inspections/history/${code}`),
};

export const maintenanceApi = {
  getAll: () => api.get<MaintenanceRecord[]>('/maintenance'),
  create: (data: Partial<MaintenanceRecord>) => api.post<MaintenanceRecord>('/maintenance', data),
  update: (id: number, data: Partial<MaintenanceRecord>) => api.patch<MaintenanceRecord>(`/maintenance/${id}`, data),
  complete: (id: number) => api.post(`/maintenance/${id}/complete`),
  delete: (id: number) => api.delete(`/maintenance/${id}`),
  history: (code: string) => api.get<MaintenanceRecord[]>(`/maintenance/history/${code}`),
};

export const notificationApi = {
  getAll: () =>
    api.get<Notification[] | Paginated<Notification>>('/notifications').then((res) => ({
      ...res,
      data: asArray(res.data),
    })),
  markRead: (id: number) => api.patch(`/notifications/${id}/read`),
  runCron: () => api.post('/notifications/run-cron'),
};

export const reportApi = {
  download: (type: string) =>
    api.get(`/reports/${type}`, { responseType: 'blob' }),
};

export const dashboardApi = {
  getStats: () => api.get<AdminDashboardStats>('/dashboard/stats'),
};

export const orderApi = {
  getCatalog: () => api.get<CatalogItem[]>('/orders/catalog'),
  getAll: () => api.get<PurchaseOrder[]>('/orders'),
  create: (data: { items: { extinguisherType: string; quantity: number }[]; notes?: string }) =>
    api.post<PurchaseOrder>('/orders', data),
  approve: (id: number) => api.patch<PurchaseOrder>(`/orders/${id}/approve`),
  reject: (id: number, rejectionReason: string) =>
    api.patch<PurchaseOrder>(`/orders/${id}/reject`, { rejectionReason }),
};
