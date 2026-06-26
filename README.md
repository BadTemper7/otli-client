# OTLI Client and Admin Frontend

React + Vite + Tailwind CSS frontend for the OTLI Logistics Management System.

## Deployment

This package is ready for Vercel.

### Required Vercel Environment Variables

```env
VITE_API_URL=https://otli-server.onrender.com/api
VITE_SOCKET_URL=https://otli-server.onrender.com
```

Socket.IO uses the HTTPS server URL. Do not add `/api` to `VITE_SOCKET_URL`.

### Vercel Settings

```txt
Framework Preset: Vite
Install Command: npm install --legacy-peer-deps --no-audit --no-fund
Build Command: npm run build
Output Directory: dist
```

`vercel.json` is included for SPA routing.

## Modules Included

### Client Portal

- Register with email OTP
- Login
- Profile and resubmission
- Pre-Advice submission
- Gate Appointment / Booking
- My Gate Appointments
- Gate-Out Request
- My Gate-Out Requests
- My Billing

### Admin Portal

Access admin using `/admin`.

- Dashboard
- Account Approval
- Pre-Advice Approval
- Booking / Gate Appointment Approval
- Gate-In Module
- Inventory / Yard Monitoring
- Billing Module
- Gate-Out Module
- Payment Verification
- Reports
- Validation Rules
- Users and Module Access
- API Logs
- Audit Logs
- Settings

## Local Run

```bash
npm install --legacy-peer-deps --no-audit --no-fund
npm run dev
```

## Build Check

This package was build-tested with:

```bash
npm run build
```
