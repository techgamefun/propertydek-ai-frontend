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

## Property documents

Property detail pages support uploading, downloading, and deleting private
property files such as permits and inspection reports. Local uploads accept
PDF, DOC, DOCX, JPG, and PNG files up to 15 MB. The optional Google Drive
picker imports user-selected files (including exportable Google Docs, Sheets,
Slides, and Drawings) into the open property's private documents. Configure
`NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_GOOGLE_API_KEY`, and
`NEXT_PUBLIC_GOOGLE_APP_ID` in the frontend environment, and enable the Drive
and Picker APIs for the Google Cloud project. The API key should be restricted
to your application origins and Google Picker API. The frontend client ID must
match the backend's `GOOGLE_CLIENT_ID`; configure these values before building
the app. Drive files are stored as property documents and are not parsed into
PropertyDek records.

## Tenant management

The Tenants section provides a workspace-scoped directory with search, tenant
profiles, contact and emergency-contact details, notes, lease history, and
maintenance history. Owners, admins, and property managers can create and edit
tenant profiles. Tenants with lease history cannot be deleted.

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
