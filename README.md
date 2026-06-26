# OTLI Client

React + Vite + Tailwind CSS + shadcn-style UI client connected to the OTLI Express backend. This version includes Socket.IO realtime updates and request cleanup to avoid repeated duplicate GET requests.

## Main routes

Client portal:

- `/`
- `/register`
- `/profile`
- `/pre-advice`
- `/booking`
- `/my-bookings`

Admin portal:

- `/admin`
- `/admin/account-approval`
- `/admin/pre-advice-approval`
- `/admin/booking-approval`
- `/admin/gate-in`
- `/admin/users`
- `/admin/api-logs`
- `/admin/audit-logs`
- `/admin/settings`

## Client account flow

- New client registers and uploads documents
- Client can login even when status is pending
- Pending client can only update profile or upload missing documents
- Rejected client can login, edit the profile, replace documents, and resubmit
- Resubmitting a rejected profile changes the account back to pending
- Only verified clients can submit pre-advice and bookings
- Client navbar shows Booking for creating booking requests
- Username dropdown has My Bookings for the booking list

## Realtime and request cleanup

- Socket.IO client listens for account, pre-advice, booking, gate-in, and admin-user events.
- React StrictMode was removed from `src/main.jsx` to stop double API calls during development.
- GET requests are deduped while already in flight.
- Short GET cache is used to stop duplicate calls from fast re-renders.
- `fetch` uses `cache: "no-store"` to avoid repeated 304 revalidation logs.

## Local setup

```bash
npm install
cp .env.example .env
npm run dev
```

Client `.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

For Vercel, set `VITE_API_URL` to your Render backend API URL.
