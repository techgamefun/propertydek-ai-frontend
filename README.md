# PropertyDek AI frontend

The registration form sends `fullName`, `email`, and `password`, with optional
`phone` and a JPG, PNG, or WebP profile photo (up to 5 MB), to
`POST /api/auth/register` as multipart form data. The backend stores profile
photos in Cloudinary and returns the generated `avatarUrl`. The login form sends
JSON to `POST /api/auth/login`. Next.js forwards these same-origin requests to
the backend at `http://localhost:5000` by default. TanStack React Query manages
both authentication mutations and their pending, success, and error states.
Successful logins store a session in an HttpOnly cookie set by the backend.

## Lease management

The authenticated workspace includes a Leases section to create and track
leases, select or add a tenant, manage lease dates and payment terms, and
attach private lease documents. Lease summaries can be printed or saved as
PDF. That summary is not a jurisdiction-specific legal agreement, and
electronic signing remains unavailable until an e-signature provider is
configured.

## Invoices

The workspace Invoices section supports creating draft rent invoices for
active leases, issuing or voiding invoices, tracking partial/outstanding
balances, recording already-received manual payments, recording externally
completed refunds, and printing invoices.
No payment is collected or charged online; payment records reflect receipts
processed outside PropertyDek.

## Development

Start the backend from the `Backend` directory, then run the frontend:

```bash
npm run dev
```

If the backend runs at a different origin, set `BACKEND_API_URL` in the
frontend environment before starting
Next.js. The backend must be reachable from the Next.js server.

Run `npm run lint` and `npm run build` to validate the frontend.
