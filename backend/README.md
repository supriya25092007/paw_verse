# PawVerse Backend

PawVerse backend: Django REST Framework API with email-based accounts,
JWT authentication, owner-scoped pet profiles, and API modules for health,
veterinary care, reminders, appointments, adoption, rescue, marketplace,
services, payments, community, messaging, notifications, and administration.

## Local setup (Windows PowerShell)

From the repository root:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
py -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `.env` with the MySQL database and a private Django secret. Create the
database and least-privilege application user as described in
`docx/PAWVERSE_DEVELOPMENT_GUIDE.md`. Then initialize and start the API:

```powershell
py manage.py makemigrations
py manage.py migrate
py manage.py createsuperuser
py manage.py runserver
```

The API runs at `http://127.0.0.1:8000`. The browsable API is available at
`/api/`; endpoint details are in [`../docs/API_REFERENCE.md`](../docs/API_REFERENCE.md).

## Admin dashboard staff access

The Admin Dashboard and administration API are available only to active
accounts with Django staff access. After creating or selecting an account,
grant access from the `backend` directory:

```powershell
py manage.py set_staff_access staff@example.com
```

This grants `is_staff` only; it does not grant superuser privileges or change
the account's password or application role. The account can then sign in with
its existing credentials and open **Admin Dashboard**. To remove staff access
later, run:

```powershell
py manage.py set_staff_access staff@example.com --revoke
```

Superuser accounts must have their superuser access explicitly removed before
their staff access can be revoked.

## Additive demo data

The `seed_demo_data` management command adds fictional, consistently tagged
records through Django's ORM. It never drops or truncates tables, does not
change existing accounts or pets, and can be run repeatedly without duplicating
its fixtures. It refuses to write unless the effective connection is MySQL
database `pawverse` and you pass `--yes`.

From this directory, apply the reviewed schema migration, preview the seeder,
then run it:

```powershell
py manage.py migrate
py manage.py seed_demo_data --dry-run
py manage.py seed_demo_data --yes
```

Migration `marketplace.0002_listing_image_url` adds an optional image reference
to marketplace listings; it is additive and does not alter existing listing
data. Seeded product illustrations are served from the frontend's
`public/demo-products/` directory. The command uses the existing Oliver
Beagle's owner as the demo account when Oliver is present; otherwise it creates
`demo.owner@pawverse.example` with an unusable password. To attach records to
another account, pass `--owner-email your-account@example.test`. Existing
account credentials are never changed. Use the account's existing password to
sign in; if the command created the demo account, set its password interactively
with `py manage.py changepassword demo.owner@pawverse.example`.

Fictional companion accounts created for related records have unusable
passwords. The current schema has no medicine model, and the legacy
`veterinary.Appointment` model is not connected to an API route; demo
appointments use the API-backed `appointments.Booking` model. Veterinary
profiles remain owner-scoped for editing, while the authenticated directory
lists verified professionals and the signed-in provider's own profile. Role
definitions are authenticated and read-only. Admin dashboard metrics, audit
logs, approvals, and analytics require a staff account.

Account profile photos and pet photos are uploaded as validated image files
with a 5 MB limit. In development, uploaded media is stored in `backend/media/`
and served by Django when `DEBUG` is enabled. Production deployments must
configure persistent media storage and serve media through an appropriate
web server or object-storage service before enabling photo uploads.

## Tests

Tests use an in-memory SQLite database, so a local MySQL server is not needed:

```powershell
$env:DB_ENGINE = "django.db.backends.sqlite3"
$env:DB_NAME = ":memory:"
py manage.py test
Remove-Item Env:DB_ENGINE
Remove-Item Env:DB_NAME
```

The normal application configuration defaults to MySQL. Do not use the
development secret key or `DJANGO_DEBUG=True` in production.
