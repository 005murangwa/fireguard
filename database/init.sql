/**
 * FireGuard LTD - MySQL Database Initialization Script
 *
 * WHAT: Creates the shared database and all tables used by the microservices.
 * WHY:  All services connect to one MySQL database (academic monorepo pattern).
 * HOW:  Run via `npm run db:setup` (scripts/setup-database.js).
 *
 * NOTE: Drops existing database on setup for clean academic demos.
 */

DROP DATABASE IF EXISTS fireguard_ltd;

CREATE DATABASE IF NOT EXISTS fireguard_ltd
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE fireguard_ltd;

-- ---------------------------------------------------------------------------
-- USERS (Auth + User services)
-- Business rule: isVerified must be true before login is allowed.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT NOT NULL AUTO_INCREMENT,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phoneNumber VARCHAR(20) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('ADMIN', 'INSPECTOR', 'CLIENT') NOT NULL DEFAULT 'CLIENT',
  isVerified BOOLEAN NOT NULL DEFAULT FALSE,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY users_email_key (email)
);

-- ---------------------------------------------------------------------------
-- OTP VERIFICATION (Auth service)
-- Business rule: OTP expires; invalid/expired OTP rejected at login.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS otp_verifications (
  id INT NOT NULL AUTO_INCREMENT,
  otpCode VARCHAR(6) NOT NULL,
  email VARCHAR(255) NOT NULL,
  expirationTime DATETIME(3) NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY otp_verifications_email_idx (email)
);

-- ---------------------------------------------------------------------------
-- FIRE EXTINGUISHERS (Fire Extinguisher service)
-- Statuses updated manually and by daily cron automation.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fire_extinguishers (
  id INT NOT NULL AUTO_INCREMENT,
  extinguisherCode VARCHAR(50) NOT NULL,
  type VARCHAR(100) NOT NULL,
  manufacturer VARCHAR(100) NOT NULL,
  capacity VARCHAR(50) NOT NULL,
  installationLocation VARCHAR(255) NOT NULL,
  manufacturingDate DATETIME(3) NOT NULL,
  expirationDate DATETIME(3) NOT NULL,
  status ENUM('ACTIVE', 'EXPIRED', 'UNDER_MAINTENANCE', 'INSPECTION_DUE') NOT NULL DEFAULT 'ACTIVE',
  assignedClientId INT NULL,
  qrCodeData TEXT NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY fire_extinguishers_code_key (extinguisherCode),
  KEY fire_extinguishers_status_idx (status),
  KEY fire_extinguishers_expiration_idx (expirationDate)
);

-- ---------------------------------------------------------------------------
-- INSPECTIONS (Inspection service)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inspections (
  id INT NOT NULL AUTO_INCREMENT,
  extinguisherCode VARCHAR(50) NOT NULL,
  inspectorId INT NOT NULL,
  inspectionDate DATETIME(3) NOT NULL,
  `condition` VARCHAR(100) NOT NULL,
  remarks TEXT NULL,
  nextInspectionDate DATETIME(3) NOT NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY inspections_extinguisherCode_idx (extinguisherCode),
  KEY inspections_inspectorId_idx (inspectorId),
  KEY inspections_nextInspectionDate_idx (nextInspectionDate)
);

-- ---------------------------------------------------------------------------
-- MAINTENANCE (Maintenance service)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS maintenance_records (
  id INT NOT NULL AUTO_INCREMENT,
  extinguisherCode VARCHAR(50) NOT NULL,
  maintenanceDate DATETIME(3) NOT NULL,
  description TEXT NOT NULL,
  technician VARCHAR(100) NOT NULL,
  status ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY maintenance_extinguisherCode_idx (extinguisherCode),
  KEY maintenance_status_idx (status)
);

-- ---------------------------------------------------------------------------
-- NOTIFICATIONS (Notification service) - dashboard + email alerts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id INT NOT NULL AUTO_INCREMENT,
  userId INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  isRead BOOLEAN NOT NULL DEFAULT FALSE,
  notificationType VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY notifications_userId_idx (userId),
  KEY notifications_isRead_idx (isRead)
);

-- ---------------------------------------------------------------------------
-- PURCHASE ORDERS (Order service) — clients request extinguishers from catalog
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS purchase_orders (
  id INT NOT NULL AUTO_INCREMENT,
  clientId INT NOT NULL,
  orderNumber VARCHAR(50) NOT NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
  totalQuantity INT NOT NULL DEFAULT 0,
  notes TEXT NULL,
  rejectionReason TEXT NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY purchase_orders_orderNumber_key (orderNumber),
  KEY purchase_orders_clientId_idx (clientId),
  KEY purchase_orders_status_idx (status)
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id INT NOT NULL AUTO_INCREMENT,
  purchaseOrderId INT NOT NULL,
  extinguisherType VARCHAR(100) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  KEY purchase_order_items_purchaseOrderId_idx (purchaseOrderId),
  CONSTRAINT purchase_order_items_order_fkey
    FOREIGN KEY (purchaseOrderId) REFERENCES purchase_orders(id) ON DELETE CASCADE
);

-- Prevent duplicate expiry alert for same user + extinguisher + type
CREATE TABLE IF NOT EXISTS notification_dedup (
  id INT NOT NULL AUTO_INCREMENT,
  userId INT NOT NULL,
  extinguisherCode VARCHAR(50) NOT NULL,
  alertType VARCHAR(50) NOT NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY notification_dedup_unique (userId, extinguisherCode, alertType)
);
