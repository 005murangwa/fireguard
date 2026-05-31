/**
 * =============================================================================
 * FireGuard LTD - Fire Extinguisher Service Business Logic
 * =============================================================================
 * WHAT: CRUD, search, filter, pagination, QR generation, and scan lookup.
 * WHY:  Centralizes all database and external-service interactions.
 * =============================================================================
 */

import { ExtinguisherStatus, Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import {
  formatExtinguisher,
  calculateStatus,
  parseDate,
  calculateTotalPages,
  generateExtinguisherCode,
} from '../utils/extinguisher.util';
import { generateQrCodeDataUrl } from '../utils/qrcode.util';
import { validateClientExists } from '../utils/auth-client.util';
import {
  CreateExtinguisherInput,
  UpdateExtinguisherInput,
  ListExtinguishersQuery,
} from '../validators/extinguisher.validator';
import {
  FireExtinguisherResponse,
  PaginatedExtinguishers,
  ScanResult,
  JwtPayload,
} from '../types';
import { canAccessExtinguisher } from '../middleware/auth.middleware';

/** Service-layer error with HTTP status code for controller mapping. */
export class ExtinguisherServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string
  ) {
    super(message);
    this.name = 'ExtinguisherServiceError';
  }
}

/**
 * Builds Prisma WHERE clause scoped to the caller's role.
 * ADMIN sees all records; CLIENT/INSPECTOR see only assigned units.
 *
 * @param user - Authenticated JWT payload
 * @param query - Optional additional filters from query string
 */
function buildAccessFilter(
  user: JwtPayload,
  query?: ListExtinguishersQuery
): Prisma.FireExtinguisherWhereInput {
  const where: Prisma.FireExtinguisherWhereInput = {};

  // Role-based row-level security
  if (user.role === 'CLIENT') {
    where.assignedClientId = user.userId;
  } else if (user.role === 'INSPECTOR') {
    // Inspectors see all client-deployed (assigned) units
    where.assignedClientId = { not: null };
  }
  // ADMIN: no additional filter

  if (query?.status) {
    where.status = query.status as ExtinguisherStatus;
  }

  if (query?.type) {
    where.type = { contains: query.type };
  }

  if (query?.manufacturer) {
    where.manufacturer = { contains: query.manufacturer };
  }

  if (query?.assignedClientId && user.role === 'ADMIN') {
    where.assignedClientId = query.assignedClientId;
  }

  if (query?.search) {
    where.OR = [
      { extinguisherCode: { contains: query.search } },
      { type: { contains: query.search } },
      { manufacturer: { contains: query.search } },
      { installationLocation: { contains: query.search } },
    ];
  }

  return where;
}

/**
 * Creates a new fire extinguisher with auto-generated QR code data URL.
 *
 * @param data - Validated create payload
 */
export async function createExtinguisher(
  data: CreateExtinguisherInput
): Promise<FireExtinguisherResponse> {
  const code = data.extinguisherCode?.trim() || generateExtinguisherCode();

  const existing = await prisma.fireExtinguisher.findUnique({
    where: { extinguisherCode: code },
  });

  if (existing) {
    throw new ExtinguisherServiceError(
      'Extinguisher code already exists',
      409,
      'CODE_ALREADY_EXISTS'
    );
  }

  if (data.assignedClientId) {
    await validateClientExists(data.assignedClientId);
  }

  const manufacturingDate = parseDate(data.manufacturingDate);
  const expirationDate = parseDate(data.expirationDate);
  const status =
    (data.status as ExtinguisherStatus) ||
    calculateStatus(expirationDate);

  // Generate QR code PNG data URL before persisting
  const qrCodeData = await generateQrCodeDataUrl(code);

  const record = await prisma.fireExtinguisher.create({
    data: {
      extinguisherCode: code,
      type: data.type,
      manufacturer: data.manufacturer,
      capacity: data.capacity,
      installationLocation: data.installationLocation,
      manufacturingDate,
      expirationDate,
      status,
      assignedClientId: data.assignedClientId ?? null,
      qrCodeData,
    },
  });

  return formatExtinguisher(record);
}

/**
 * Lists extinguishers with search, filter, pagination, and role-based scoping.
 *
 * @param user - Authenticated caller
 * @param query - Validated list query params
 */
export async function listExtinguishers(
  user: JwtPayload,
  query: ListExtinguishersQuery
): Promise<PaginatedExtinguishers> {
  const { page, limit } = query;
  const skip = (page - 1) * limit;
  const where = buildAccessFilter(user, query);

  const [records, total] = await Promise.all([
    prisma.fireExtinguisher.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.fireExtinguisher.count({ where }),
  ]);

  return {
    data: records.map(formatExtinguisher),
    total,
    page,
    limit,
    totalPages: calculateTotalPages(total, limit),
  };
}

/**
 * Retrieves a single extinguisher by ID with access control check.
 *
 * @param user - Authenticated caller
 * @param id - Primary key
 */
export async function getExtinguisherById(
  user: JwtPayload,
  id: number
): Promise<FireExtinguisherResponse> {
  const record = await prisma.fireExtinguisher.findUnique({ where: { id } });

  if (!record) {
    throw new ExtinguisherServiceError('Extinguisher not found', 404, 'NOT_FOUND');
  }

  if (!canAccessExtinguisher(user, record)) {
    throw new ExtinguisherServiceError('Access denied', 403, 'FORBIDDEN');
  }

  return formatExtinguisher(record);
}

/**
 * Partially updates an extinguisher record (ADMIN only at route level).
 *
 * @param id - Primary key
 * @param data - Validated update payload
 */
export async function updateExtinguisher(
  id: number,
  data: UpdateExtinguisherInput
): Promise<FireExtinguisherResponse> {
  const existing = await prisma.fireExtinguisher.findUnique({ where: { id } });

  if (!existing) {
    throw new ExtinguisherServiceError('Extinguisher not found', 404, 'NOT_FOUND');
  }

  if (data.assignedClientId) {
    await validateClientExists(data.assignedClientId);
  }

  const manufacturingDate = data.manufacturingDate
    ? parseDate(data.manufacturingDate)
    : existing.manufacturingDate;
  const expirationDate = data.expirationDate
    ? parseDate(data.expirationDate)
    : existing.expirationDate;

  const status = data.status
    ? (data.status as ExtinguisherStatus)
    : calculateStatus(expirationDate, existing.status);

  const updated = await prisma.fireExtinguisher.update({
    where: { id },
    data: {
      type: data.type,
      manufacturer: data.manufacturer,
      capacity: data.capacity,
      installationLocation: data.installationLocation,
      manufacturingDate,
      expirationDate,
      status,
      assignedClientId: data.assignedClientId !== undefined ? data.assignedClientId : undefined,
    },
  });

  return formatExtinguisher(updated);
}

/**
 * Permanently deletes an extinguisher record (ADMIN only).
 *
 * @param id - Primary key
 */
export async function deleteExtinguisher(id: number): Promise<void> {
  const existing = await prisma.fireExtinguisher.findUnique({ where: { id } });

  if (!existing) {
    throw new ExtinguisherServiceError('Extinguisher not found', 404, 'NOT_FOUND');
  }

  await prisma.fireExtinguisher.delete({ where: { id } });
}

/**
 * QR scan lookup by extinguisher code — returns minimal field set for field use.
 *
 * @param user - Authenticated caller
 * @param code - Extinguisher code from QR scan
 */
export async function scanByCode(user: JwtPayload, code: string): Promise<ScanResult> {
  const record = await prisma.fireExtinguisher.findUnique({
    where: { extinguisherCode: code },
  });

  if (!record) {
    throw new ExtinguisherServiceError('Extinguisher not found', 404, 'NOT_FOUND');
  }

  if (!canAccessExtinguisher(user, record)) {
    throw new ExtinguisherServiceError('Access denied', 403, 'FORBIDDEN');
  }

  return {
    extinguisherCode: record.extinguisherCode,
    type: record.type,
    installationLocation: record.installationLocation,
    status: record.status,
    expirationDate: record.expirationDate,
    assignedClientId: record.assignedClientId,
  };
}
