# FireGuard LTD — Fire Extinguisher Management System

Academic microservices project for managing fire extinguishers, inspections, maintenance, notifications, reports, and user authentication.

## Architecture

| Service | Port | Purpose |
|---------|------|---------|
| API Gateway | 5000 | Routes, JWT validation, Swagger UI, dashboard stats |
| Auth Service | 5001 | Signup, login, email OTP, JWT |
| User Service | 5002 | Admin user management |
| Fire Extinguisher Service | 5003 | CRUD, search, QR codes |
| Inspection Service | 5004 | Inspection records & history |
| Maintenance Service | 5005 | Maintenance work orders |
| Notification Service | 5006 | Email, dashboard alerts, WebSocket, daily cron |
| Reporting Service | 5007 | PDF reports (ADMIN) |
| Frontend | 5173 | React + TypeScript + Vite |

## Roles

- **ADMIN** — Manage users, extinguishers, inspections, maintenance, reports, assign inspectors, view statistics
- **INSPECTOR** — Perform inspections, update extinguisher condition, view assigned extinguishers
- **CLIENT** — View assigned extinguisher status, inspection history, maintenance history, and notifications (no purchasing — units are assigned by admin)

## Demo login credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | **admin@fireguard.com** | **Admin123!** |
| Inspector | inspector@fireguard.com | Admin123! |
| Client | client@fireguard.com | Admin123! |

All seed accounts are pre-verified (no OTP needed). New users register at `/signup` → OTP → login.

## Client vs Admin workflow (no shopping cart)

This project is a **fire extinguisher management system**, not an e-commerce store. Per TASK 2:

- **Admin** registers extinguishers and assigns them to a client (`assignedClientId` on the register form).
- **Client** logs in and views **My Extinguishers**, **Inspection History**, **Maintenance History**, and **Notifications**.

Demo data: run `npm run db:seed` — three sample units (`FE-DEMO-001` … `003`) are assigned to `client@fireguard.com`.

```bash
# Stop any running npm run dev first (avoids port conflicts & Prisma EPERM on Windows)
npm run setup    # install all deps, copy .env files, create DB, generate Prisma, seed
npm run dev      # start gateway + 7 backend services + frontend
```

- **Frontend:** http://localhost:5173
- **Swagger UI:** http://localhost:5000/api-docs
- **Health check:** http://localhost:5000/health

### Seed accounts (pre-verified)

See **Demo login credentials** table above.

## Workflow

1. **Signup** → email OTP verification → **Login**
2. **Admin** registers fire extinguishers (QR code generated automatically)
3. **Inspector** creates inspection records; status updates to *Inspection Due* when overdue (daily cron)
4. **Maintenance** records track scheduled/completed work
5. **Notification cron** (daily) sends alerts: 30-day expiry warnings, inspection due, maintenance reminders (deduplicated)
6. **Admin** downloads PDF reports from the Reports page

## Email (optional)

Configure Gmail SMTP in `notification-service/.env`:

```env
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your@gmail.com
```

Without SMTP, emails log as `[DEV EMAIL]` in the notification-service terminal. Dashboard notifications still work.

## Run services individually

```bash
npm run dev:gateway
npm run dev:auth
npm run dev:user
npm run dev:extinguisher
npm run dev:inspection
npm run dev:maintenance
npm run dev:notification
npm run dev:reporting
npm run dev:frontend
```

## Database

- MySQL database: `fireguard_ltd`
- Schema: `database/init.sql`
- Reset (drops all data): `npm run db:setup`

## Tech stack

**Backend:** Node.js, Express, TypeScript, Prisma, MySQL, Zod, JWT, BCrypt, node-cron, PDFKit, WebSocket

**Frontend:** React, TypeScript, Vite, TanStack Query, Tailwind CSS

## Project structure

Each microservice follows:

```
src/
├── controllers
├── services
├── routes
├── middleware
├── validators (or dto)
├── prisma
├── utils
├── types
└── app.ts
```

## Security

- JWT authentication on protected routes
- BCrypt password hashing
- Zod request validation
- Prisma ORM (SQL injection protection)
- Helmet + CORS on API Gateway
- Global error handlers & request logging

## Confirmation dialogs

The frontend asks *"Are you sure you want to perform this action?"* before logout, delete, maintenance completion, and inspection submission.
