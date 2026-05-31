/**
 * =============================================================================
 * FireGuard LTD - QR Code Generation Utility
 * =============================================================================
 * WHAT: Generates QR code data URLs embedded in extinguisher records on create.
 * WHY:  Enables field technicians to scan units via GET /scan/:code.
 * =============================================================================
 */

import QRCode from 'qrcode';

/** Payload encoded inside each extinguisher QR code. */
export interface QrPayload {
  service: 'fire-extinguisher-service';
  extinguisherCode: string;
  scanUrl: string;
}

/**
 * Builds the JSON payload stored in qrCodeData and encoded in the QR image.
 *
 * @param extinguisherCode - Unique unit identifier
 * @param baseUrl - Service base URL for scan deep-link
 */
export function buildQrPayload(extinguisherCode: string, baseUrl: string): QrPayload {
  return {
    service: 'fire-extinguisher-service',
    extinguisherCode,
    scanUrl: `${baseUrl}/scan/${extinguisherCode}`,
  };
}

/**
 * Generates a base64 PNG data URL for the QR code.
 * The scan URL points to this service's /scan/:code endpoint.
 *
 * @param extinguisherCode - Unique unit code to encode
 * @returns Base64 data URL suitable for storing in qrCodeData column
 */
export async function generateQrCodeDataUrl(extinguisherCode: string): Promise<string> {
  const port = process.env.PORT || 5003;
  const baseUrl = process.env.SERVICE_BASE_URL || `http://localhost:${port}`;
  const payload = buildQrPayload(extinguisherCode, baseUrl);

  // Encode JSON payload — scanners can parse extinguisherCode directly
  return QRCode.toDataURL(JSON.stringify(payload), {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 256,
  });
}
