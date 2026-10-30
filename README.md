# PropertyDek AI frontend

The registration form sends `fullName`, `email`, and `password`, with optional
`phone` and a JPG, PNG, or WebP profile photo (up to 5 MB), to
`POST /api/auth/register` as multipart form data. The backend stores profile
photos in Cloudinary and returns the generated `avatarUrl`. The login form sends
JSON to `POST /api/auth/login`. Next.js forwards these same-origin requests to
the backend at `http://localhost:5000` by default. TanStack React Query manages
both authentication mutations and their pending, success, and error states.
Successful logins store a session in an HttpOnly cookie set by the backend.

## Development

Start the backend from the `Backend` directory, then run the frontend:

```bash
npm run dev
```

If the backend runs at a different origin, set `BACKEND_API_URL` in the
frontend environment before starting
Next.js. The backend must be reachable from the Next.js server.

Run `npm run lint` and `npm run build` to validate the frontend.
