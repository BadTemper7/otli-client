# OTLI Client

React + Vite + Tailwind CSS client for the OTLI Logistics Management System.

## Production backend

This build is already configured for the Render backend:

```env
VITE_API_URL=https://otli-server.onrender.com/api
VITE_SOCKET_URL=https://otli-server.onrender.com
```

`VITE_API_URL` is used for REST API requests.
`VITE_SOCKET_URL` is used for Socket.IO realtime updates.

## Local setup

```bash
npm install --legacy-peer-deps --no-audit --no-fund
npm run dev
```

## Production build

```bash
npm run build
```

## Vercel settings

Use these settings in Vercel:

```txt
Framework Preset: Vite
Install Command: npm install --legacy-peer-deps --no-audit --no-fund
Build Command: npm run build
Output Directory: dist
Node Version: 20.x
```

Add these environment variables in Vercel:

```env
VITE_API_URL=https://otli-server.onrender.com/api
VITE_SOCKET_URL=https://otli-server.onrender.com
```

`vercel.json` is included for SPA routing, so refreshes on `/admin`, `/profile`, `/booking`, and `/my-bookings` should not show 404.
