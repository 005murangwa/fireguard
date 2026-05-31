import { ExtinguisherStatus } from '@prisma/client';

export function calculateStatus(expiryDate: Date): ExtinguisherStatus {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return ExtinguisherStatus.EXPIRED;
  }

  if (diffDays <= 30) {
    return ExtinguisherStatus.EXPIRING_SOON;
  }

  return ExtinguisherStatus.ACTIVE;
}

export function daysUntilExpiry(expiryDate: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const diffMs = expiry.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function formatStatusLabel(status: ExtinguisherStatus): string {
  switch (status) {
    case ExtinguisherStatus.EXPIRING_SOON:
      return 'Expiring Soon';
    case ExtinguisherStatus.EXPIRED:
      return 'Expired';
    default:
      return 'Active';
  }
}
