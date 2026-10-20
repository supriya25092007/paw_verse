# PawVerse frontend

React and Vite frontend for the existing PawVerse Django REST API. This app
reuses the existing authentication context, API client, protected routes, and
resource pages; it does not start or replace the backend.

## Local development

Install a supported Node.js LTS release, then from this directory run:

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

The Vite app runs at `http://localhost:5173`. The default API URL is
`http://127.0.0.1:8000/api`, matching the Django development server. If the
backend runs elsewhere, update `VITE_API_BASE_URL` in `.env`. This value is
public frontend configuration; do not put secrets in it.

Start the Django backend separately. The frontend uses its existing
email/password registration and JWT endpoints. Tokens are kept in
`sessionStorage`, refreshed using the documented refresh endpoint, and sent
through the shared Axios client.

## API-backed pages

The authenticated pages use the documented API resources for pet profiles,
vaccinations, medical history, reminders, veterinary profiles and clinics,
appointments, adoption listings and applications, rescue, product listings and
inquiries, services, community, messaging, and notifications. Resource forms
use backend validation messages and display request errors instead of silently
substituting demo data.

The marketplace search, category filter, and price sorting operate on records
loaded from `/api/listings/`; listings are paginated by the backend, so use
**Load more records** to include later pages in the current client-side search.
Seller edit and removal use the existing listing detail `PATCH` and `DELETE`
routes and are shown only for the current user's listings.

Other editable resource tabs expose update and delete actions only for records
the signed-in account is allowed to manage; read-only resources remain
read-only. Use the theme button in the authenticated app header to switch
between light and dark mode. The selection is saved in the browser.

Users can upload or remove a profile photo from Account settings and add,
replace, or remove a pet photo from that pet's profile. Uploads must be JPEG,
PNG, or WebP images no larger than 5 MB; the backend must have media storage
configured to retain and serve uploaded photos.

## API capabilities and configuration notes

- The marketplace listing model has no image field. Listing and pet-card
  photography is illustrative category imagery, not a seller-uploaded photo.
- The appointment API accepts a scheduled date/time but does not provide
  veterinarian availability slots.
- Transactions are read-only; payment-provider processing is not configured.
- The SMS notification channel is data-only; no SMS provider is configured.
- API pagination, CORS, permissions, database access, and endpoint availability
  must be verified against the running Django environment in use.

See [the API reference](../docs/API_REFERENCE.md) for request fields and access
rules.

Build the production bundle with `npm run build`; run it locally with
`npm run preview`.
