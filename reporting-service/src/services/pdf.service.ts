/**
 * =============================================================================
 * FireGuard LTD — PDF Report Generator (pdfkit)
 * =============================================================================
 * Builds downloadable PDF buffers for each report type.
 * All reports share a common header/footer layout for brand consistency.
 * =============================================================================
 */

import PDFDocument from 'pdfkit';
import {
  ExtinguisherRow,
  InspectionRow,
  MaintenanceRow,
  SystemStatistics,
} from './data-aggregator.service';

/** Brand colors used across all PDF reports. */
const COLORS = {
  primary: '#dc2626',
  text: '#1f2937',
  muted: '#6b7280',
  headerBg: '#fef2f2',
};

/**
 * Create a PDFDocument with standard FireGuard LTD page settings.
 * Returns both the doc instance and a Promise that resolves to the final Buffer.
 */
function createDocument(title: string): { doc: PDFKit.PDFDocument; bufferPromise: Promise<Buffer> } {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const chunks: Buffer[] = [];

  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  const bufferPromise = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  // Report header banner
  doc.rect(50, 50, doc.page.width - 100, 60).fill(COLORS.headerBg);
  doc.fillColor(COLORS.primary).fontSize(20).font('Helvetica-Bold');
  doc.text('FireGuard LTD', 60, 65);
  doc.fillColor(COLORS.text).fontSize(14).font('Helvetica');
  doc.text(title, 60, 88);

  doc.moveDown(3);
  doc.fillColor(COLORS.muted).fontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' });
  doc.moveDown(1);

  return { doc, bufferPromise };
}

/** Add a simple data table to the PDF document. */
function addTable(
  doc: PDFKit.PDFDocument,
  headers: string[],
  rows: string[][],
  columnWidths: number[]
): void {
  const startX = 50;
  let y = doc.y;
  const rowHeight = 20;
  const pageBottom = doc.page.height - 50;

  // Header row
  doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.primary);
  let x = startX;
  headers.forEach((header, i) => {
    doc.text(header, x, y, { width: columnWidths[i], continued: false });
    x += columnWidths[i];
  });
  y += rowHeight;
  doc.moveTo(startX, y).lineTo(startX + columnWidths.reduce((a, b) => a + b, 0), y).stroke(COLORS.primary);

  // Data rows
  doc.font('Helvetica').fontSize(8).fillColor(COLORS.text);
  for (const row of rows) {
    if (y + rowHeight > pageBottom) {
      doc.addPage();
      y = 50;
    }

    x = startX;
    row.forEach((cell, i) => {
      doc.text(cell || '—', x, y + 2, { width: columnWidths[i], continued: false });
      x += columnWidths[i];
    });
    y += rowHeight;
  }

  doc.y = y + 10;
}

/** Footer with page numbers on every page. */
function addPageNumbers(doc: PDFKit.PDFDocument): void {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.fillColor(COLORS.muted).fontSize(8);
    doc.text(
      `Page ${i + 1} of ${range.count} — FireGuard LTD Confidential`,
      50,
      doc.page.height - 30,
      { align: 'center', width: doc.page.width - 100 }
    );
  }
}

/** PDF report: all extinguishers currently marked EXPIRED. */
export async function generateExpiredExtinguishersPdf(
  items: ExtinguisherRow[]
): Promise<Buffer> {
  const { doc, bufferPromise } = createDocument('Expired Fire Extinguishers Report');

  doc.fillColor(COLORS.text).fontSize(11).font('Helvetica');
  doc.text(`Total expired extinguishers: ${items.length}`);
  doc.moveDown(1);

  if (items.length === 0) {
    doc.text('No expired extinguishers found.');
  } else {
    addTable(
      doc,
      ['Code', 'Type', 'Location', 'Expiration', 'Status'],
      items.map((e) => [
        e.extinguisherCode,
        e.type,
        e.installationLocation,
        new Date(e.expirationDate).toLocaleDateString(),
        e.status,
      ]),
      [80, 80, 140, 80, 80]
    );
  }

  addPageNumbers(doc);
  doc.end();
  return bufferPromise;
}

/** PDF report: extinguishers expiring within the next 30 days. */
export async function generateUpcomingExpirationsPdf(
  items: ExtinguisherRow[]
): Promise<Buffer> {
  const { doc, bufferPromise } = createDocument('Upcoming Expirations Report (30 Days)');

  doc.fillColor(COLORS.text).fontSize(11).font('Helvetica');
  doc.text(`Extinguishers expiring within 30 days: ${items.length}`);
  doc.moveDown(1);

  if (items.length === 0) {
    doc.text('No upcoming expirations in the next 30 days.');
  } else {
    addTable(
      doc,
      ['Code', 'Type', 'Manufacturer', 'Location', 'Expiration'],
      items.map((e) => [
        e.extinguisherCode,
        e.type,
        e.manufacturer,
        e.installationLocation,
        new Date(e.expirationDate).toLocaleDateString(),
      ]),
      [70, 70, 90, 130, 80]
    );
  }

  addPageNumbers(doc);
  doc.end();
  return bufferPromise;
}

/** PDF report: full inspection history and upcoming due dates. */
export async function generateInspectionReportPdf(
  items: InspectionRow[]
): Promise<Buffer> {
  const { doc, bufferPromise } = createDocument('Inspection Report');

  doc.fillColor(COLORS.text).fontSize(11).font('Helvetica');
  doc.text(`Total inspection records: ${items.length}`);
  doc.moveDown(1);

  if (items.length === 0) {
    doc.text('No inspection records available.');
  } else {
    addTable(
      doc,
      ['Code', 'Date', 'Condition', 'Next Due', 'Remarks'],
      items.map((i) => [
        i.extinguisherCode,
        new Date(i.inspectionDate).toLocaleDateString(),
        i.condition,
        new Date(i.nextInspectionDate).toLocaleDateString(),
        (i.remarks || '').slice(0, 40),
      ]),
      [70, 70, 80, 80, 120]
    );
  }

  addPageNumbers(doc);
  doc.end();
  return bufferPromise;
}

/** PDF report: maintenance history and scheduled work. */
export async function generateMaintenanceReportPdf(
  items: MaintenanceRow[]
): Promise<Buffer> {
  const { doc, bufferPromise } = createDocument('Maintenance Report');

  doc.fillColor(COLORS.text).fontSize(11).font('Helvetica');
  doc.text(`Total maintenance records: ${items.length}`);
  doc.moveDown(1);

  if (items.length === 0) {
    doc.text('No maintenance records available.');
  } else {
    addTable(
      doc,
      ['Code', 'Date', 'Technician', 'Status', 'Description'],
      items.map((m) => [
        m.extinguisherCode,
        new Date(m.maintenanceDate).toLocaleDateString(),
        m.technician,
        m.status,
        m.description.slice(0, 50),
      ]),
      [70, 70, 80, 70, 130]
    );
  }

  addPageNumbers(doc);
  doc.end();
  return bufferPromise;
}

/** PDF report: system-wide statistics dashboard summary. */
export async function generateSystemStatisticsPdf(
  stats: SystemStatistics
): Promise<Buffer> {
  const { doc, bufferPromise } = createDocument('System Statistics Report');

  doc.fillColor(COLORS.text).fontSize(12).font('Helvetica-Bold');
  doc.text('Users');
  doc.font('Helvetica').fontSize(10);
  doc.text(`  Total: ${stats.users.total}`);
  doc.text(`  Admins: ${stats.users.admins}  |  Clients: ${stats.users.clients}  |  Inspectors: ${stats.users.inspectors}`);
  doc.moveDown(1);

  doc.font('Helvetica-Bold').fontSize(12).text('Fire Extinguishers');
  doc.font('Helvetica').fontSize(10);
  doc.text(`  Total: ${stats.extinguishers.total}`);
  doc.text(`  Active: ${stats.extinguishers.active}  |  Expired: ${stats.extinguishers.expired}`);
  doc.text(`  Inspection Due: ${stats.extinguishers.inspectionDue}  |  Under Maintenance: ${stats.extinguishers.underMaintenance}`);
  doc.moveDown(1);

  doc.font('Helvetica-Bold').fontSize(12).text('Inspections');
  doc.font('Helvetica').fontSize(10);
  doc.text(`  Total Records: ${stats.inspections.total}`);
  doc.text(`  Due This Month: ${stats.inspections.dueThisMonth}`);
  doc.moveDown(1);

  doc.font('Helvetica-Bold').fontSize(12).text('Maintenance');
  doc.font('Helvetica').fontSize(10);
  doc.text(`  Total Records: ${stats.maintenance.total}`);
  doc.text(`  Scheduled: ${stats.maintenance.scheduled}  |  Completed: ${stats.maintenance.completed}`);
  doc.moveDown(1);

  doc.font('Helvetica-Bold').fontSize(12).text('Notifications');
  doc.font('Helvetica').fontSize(10);
  doc.text(`  Total Sent: ${stats.notifications.total}`);
  doc.text(`  Unread: ${stats.notifications.unread}`);

  addPageNumbers(doc);
  doc.end();
  return bufferPromise;
}
