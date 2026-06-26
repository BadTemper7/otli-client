# OTLI Client - Vercel Ready

React + Vite + Tailwind CSS client for the OTLI Logistics Management System.

## Included

- Client portal and admin portal
- Complete container yard flow modules
- Registration with email OTP
- OTP-only verification screen after registration submit
- Modern 6-box OTP input
- Resend OTP button with 60-second countdown
- Account is not saved during the first registration submit
- Account is saved only after OTP verification
- Socket.IO realtime connection
- Vercel SPA routing support

## Environment Variables

Create `.env.local` for local development:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

For Vercel production:

```env
VITE_API_URL=https://otli-server.onrender.com/api
VITE_SOCKET_URL=https://otli-server.onrender.com
```

## Install and Run

```bash
npm install --legacy-peer-deps --no-audit --no-fund
npm run dev
```

## Build

```bash
npm run build
```

## Vercel Settings

```txt
Framework Preset: Vite
Install Command: npm install --legacy-peer-deps --no-audit --no-fund
Build Command: npm run build
Output Directory: dist
```
