# PawVerse --- Backend and Frontend Development Guide

**Project:** PawVerse -- Integrated Pet Care and Welfare Management
System\
**Document version:** 1.0\
**Backend:** Python, Django, Django REST Framework\
**Frontend:** React.js, Vite, React Router\
**Database:** MySQL

------------------------------------------------------------------------

## 1. Purpose

This document defines the development plan and implementation
conventions for the PawVerse backend and frontend applications. It is
intended to be saved as `PAWVERSE_DEVELOPMENT_GUIDE.md` and used as the
working guide while building the project.

PawVerse will provide pet profiles and health records, veterinary
appointments, reminders, adoption and rescue workflows, permitted
marketplace listings, service bookings, lost-and-found reports,
notifications, community features, and administration.

The complete feature set should be developed incrementally. Optional
integrations---such as payments, video consultations, AI-assisted
guidance, maps, SMS, and real-time chat---should be added only when
their provider, privacy, security, and legal requirements are
understood.

## 2. Architecture

The system uses a three-layer architecture:

1.  **React frontend:** renders pages, forms, dashboards, and user
    interactions.
2.  **Django REST API:** authenticates requests, enforces permissions,
    validates data, applies business rules, and exposes JSON endpoints.
3.  **MySQL database:** stores persistent application data accessed
    through Django ORM.

Typical request flow:

`Browser → React → HTTP/JSON API → Django REST Framework → Django ORM → MySQL`

The frontend must not connect directly to MySQL. Database credentials
and secret API keys must never be included in frontend code.

## 3. Technology Stack

  -----------------------------------------------------------------------
  Layer                   Technology              Responsibility
  ----------------------- ----------------------- -----------------------
  Frontend                React + Vite            User interface and
                                                  client-side application

  Routing                 React Router            Page navigation

  API client              Axios or Fetch          Communicate with
                                                  backend

  Backend                 Python + Django         Application logic and
                                                  server configuration

  API framework           Django REST Framework   REST endpoints,
                                                  serializers,
                                                  permissions

  Database                MySQL                   Relational data storage

  ORM                     Django ORM              Models, queries, and
                                                  migrations

  Authentication          Django authentication   Secure user access
                          with a documented       
                          session or token        
                          strategy                

  Testing                 Django test tools and   Automated verification
                          frontend test tools     

  Version control         Git                     Source control
  -----------------------------------------------------------------------

Use mutually compatible, supported versions and record dependencies in
`requirements.txt` and `package.json`.

## 4. Recommended Repository Structure

``` text
PawVerse/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── config/
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── asgi.py
│   │   └── wsgi.py
│   ├── accounts/
│   ├── pets/
│   ├── health_records/
│   ├── veterinary/
│   ├── appointments/
│   ├── reminders/
│   ├── marketplace/
│   ├── adoption/
│   ├── rescue/
│   ├── services/
│   ├── community/
│   ├── messaging/
│   ├── notifications/
│   ├── payments/
│   └── administration/
├── frontend/
│   ├── package.json
│   ├── .env.example
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── api/
│       ├── assets/
│       ├── components/
│       ├── layouts/
│       ├── pages/
│       ├── hooks/
│       ├── context/
│       ├── routes/
│       ├── styles/
│       └── utils/
├── database/
│   └── README.md
├── docs/
│   ├── SOFTWARE_REQUIREMENTS_SPECIFICATION.md
│   └── API_REFERENCE.md
├── .gitignore
└── README.md
```

Create Django apps as they are needed. Avoid generating every app before
its data model and responsibilities are understood.

## 5. Backend Application Development

### 5.1 Backend Responsibilities

The Django backend shall:

-   Manage user accounts, authentication, and role-based permissions.
-   Define data models and relationships.
-   Validate and process frontend API requests.
-   Apply business rules and protect private data.
-   Store and retrieve records through Django ORM.
-   Provide consistent JSON responses and useful error codes.
-   Manage uploaded files with validation and access control.
-   Support audit logging for important security and administrative
    actions.
-   Integrate external services only through server-side code.

### 5.2 Backend Setup

From the project directory, create and activate a virtual environment.

**Windows PowerShell:**

``` powershell
mkdir PawVerse
cd PawVerse
mkdir backend
cd backend

py -m venv .venv
.\.venv\Scripts\Activate.ps1

python -m pip install --upgrade pip
pip install django djangorestframework mysqlclient django-cors-headers python-dotenv
django-admin startproject config .
```

If `mysqlclient` cannot be installed in the development environment,
review its platform prerequisites before choosing a compatible
alternative. Do not change database drivers without verifying
Django/MySQL compatibility.

Save installed, tested dependencies:

``` powershell
pip freeze > requirements.txt
```

### 5.3 Create Django Applications

From the `backend` directory:

``` powershell
python manage.py startapp accounts
python manage.py startapp pets
python manage.py startapp health_records
python manage.py startapp veterinary
python manage.py startapp appointments
python manage.py startapp reminders
python manage.py startapp marketplace
python manage.py startapp adoption
python manage.py startapp rescue
python manage.py startapp services
python manage.py startapp notifications
```

Add an app to `INSTALLED_APPS` only after it exists. Add
`rest_framework`, `corsheaders`, and the required database driver
configuration to Django settings.

### 5.4 MySQL Configuration

Create a MySQL database and a dedicated database user. Grant only the
privileges needed by the application. Do not use the MySQL root account
for the application.

Example SQL (adjust the database name, username, host, and password for
your environment):

``` sql
CREATE DATABASE pawverse_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER 'pawverse_app'@'localhost'
  IDENTIFIED BY 'REPLACE_WITH_A_STRONG_PASSWORD';

GRANT ALL PRIVILEGES ON pawverse_db.*
  TO 'pawverse_app'@'localhost';

FLUSH PRIVILEGES;
```

Use environment variables for database credentials. Keep the actual
`.env` file out of Git.

Example `backend/.env.example`:

``` dotenv
DJANGO_SECRET_KEY=replace-me
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=pawverse_db
DB_USER=pawverse_app
DB_PASSWORD=replace-me
DB_HOST=127.0.0.1
DB_PORT=3306

FRONTEND_ORIGIN=http://localhost:5173
```

Load environment variables in Django settings and configure `DATABASES`
with the MySQL backend (`django.db.backends.mysql`). Use a strong,
private `SECRET_KEY`; set `DEBUG=False` and configure production hosts
before deployment.

### 5.5 Backend API Conventions

-   Use `/api/` as the API prefix.
-   Use plural resource names, such as `/api/pets/`.
-   Use serializers for input validation and output representation.
-   Use DRF permissions to enforce access control on the server.
-   Return appropriate HTTP status codes.
-   Paginate collection endpoints.
-   Filter and order only by explicitly supported fields.
-   Do not trust user IDs, prices, roles, ownership, payment status, or
    verification status supplied by the browser.
-   Use database transactions for multi-step operations that must
    succeed or fail together.
-   Document endpoint parameters, response bodies, and error formats.

### 5.6 Initial API Map

  ------------------------------------------------------------------------
  Area                    Example endpoint         Purpose
  ----------------------- ------------------------ -----------------------
  Authentication          `/api/auth/`             Login, logout,
                                                   registration, current
                                                   user

  Accounts                `/api/users/`            User profile management

  Pets                    `/api/pets/`             Pet profile CRUD

  Health records          `/api/health-records/`   Authorized health
                                                   records

  Clinics                 `/api/clinics/`          Clinic discovery and
                                                   management

  Appointments            `/api/appointments/`     Booking and status
                                                   management

  Reminders               `/api/reminders/`        Care reminder
                                                   management

  Marketplace             `/api/listings/`         Permitted listings and
                                                   inquiries

  Adoption                `/api/adoption/`         Adoption listings and
                                                   applications

  Rescue                  `/api/rescue/`           Rescue cases and
                                                   coordination

  Services                `/api/services/`         Grooming, sitting, and
                                                   other services

  Notifications           `/api/notifications/`    In-app notifications

  Administration          `/api/admin/`            Restricted
                                                   administration
                                                   functions
  ------------------------------------------------------------------------

These are proposed routes, not endpoints that exist automatically.
Implement and test each endpoint before the frontend depends on it.

### 5.7 Backend Data Model Plan

Define models and relationships before implementing serializers and
views. Likely model groups include:

-   **Identity:** User, UserProfile, Organization,
    OrganizationMembership, ProfessionalVerification.
-   **Pets:** Pet, PetOwnership, HealthRecord, Vaccination,
    MedicationSchedule, MedicalDocument, CareReminder.
-   **Veterinary:** VeterinaryClinic, VeterinarianProfile, Availability,
    Appointment, Consultation.
-   **Marketplace:** Listing, ListingCategory, ListingImage, Inquiry,
    Order, PaymentTransaction.
-   **Adoption and rescue:** Shelter, RescueCase, AdoptionListing,
    AdoptionApplication, FosterApplication, FosterPlacement.
-   **Services:** ServiceProvider, Service, ServiceBooking, Review.
-   **Community:** LostFoundReport, CommunityPost, Comment, Event,
    EventRegistration.
-   **Communication:** Conversation, Message, Notification.
-   **Governance:** AuditLog, ModerationAction.

Finalize fields, cardinality, deletion behavior, privacy, and
constraints in the ER diagram before making migrations. If using a
custom Django user model, create it at the beginning of the project
before the first migration.

### 5.8 Backend Implementation Order

1.  Project settings, environment variables, and MySQL connection.
2.  Custom user model and authentication strategy.
3.  Roles, organizations, permissions, and profile APIs.
4.  Pet profiles and ownership checks.
5.  Health records and reminders.
6.  Clinics and appointments.
7.  Adoption, rescue, and volunteer workflows.
8.  Marketplace and service bookings.
9.  Notifications and community features.
10. Optional integrations and administration analytics.

### 5.9 Backend Checks

Run the following commands from `backend/`:

``` powershell
python manage.py check
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Run migrations only after the model design and settings are ready.
`makemigrations` creates migration files; `migrate` applies them to the
configured database.

## 6. Frontend Application Development

### 6.1 Frontend Responsibilities

The React frontend shall:

-   Provide a responsive, accessible interface.
-   Display role-appropriate pages and navigation.
-   Collect and validate user input for usability.
-   Call Django APIs and display loading, success, empty, and error
    states.
-   Keep authentication behavior consistent with the chosen backend
    strategy.
-   Avoid storing sensitive health or personal data unnecessarily in
    browser storage.
-   Never contain database credentials or private server-side API keys.

Frontend route guards improve the user experience but do not replace
backend authorization.

### 6.2 Frontend Setup

From the project root:

``` powershell
cd ..
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install axios react-router-dom
npm run dev
```

Choose the React template when prompted if the command opens an
interactive setup. Use a supported Node.js version compatible with the
selected Vite release.

### 6.3 Frontend Environment

Create `frontend/.env.example`:

``` dotenv
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

For local development, copy this to `.env` and adjust the URL if needed.
Vite exposes `VITE_` variables to browser code, so never put secrets in
them.

### 6.4 Frontend Organization

-   `api/`: API client and endpoint functions.
-   `components/`: reusable buttons, form fields, cards, tables, modals,
    and alerts.
-   `layouts/`: public layout and authenticated dashboard layout.
-   `pages/`: page-level views.
-   `routes/`: route configuration and navigation guards.
-   `context/`: shared client state where appropriate.
-   `hooks/`: reusable React hooks.
-   `styles/`: global styles, design tokens, and responsive styling.
-   `utils/`: small, reusable formatting and validation helpers.

Keep API calls out of large page components where practical. Use
reusable services and consistent error handling.

### 6.5 Initial Frontend Pages

**Public pages** - Home / landing page - About PawVerse - Services and
feature overview - Login - Registration - Password reset

**Pet owner pages** - Dashboard - My Pets - Pet Profile - Health
Passport - Medication and Vaccination Reminders - Appointments -
Lost-and-Found Reports - Marketplace - Adoption - Service Bookings -
Notifications - Account Settings

**Professional and organization pages** - Clinic dashboard - Appointment
management - Shelter dashboard - Adoption application management -
Rescue cases - Volunteer opportunities - Seller and service-provider
listings

**Administration pages** - User and role management - Verification
requests - Listing and content moderation - Reports and analytics

Show a page only when the user's role and permissions allow it; the
backend must enforce the same rules.

### 6.6 Frontend API Client

Create one shared Axios instance with the base URL from
`import.meta.env.VITE_API_BASE_URL`. Configure common headers and
centralized error handling.

Choose either a documented session-based approach with appropriate CSRF
handling or a token-based approach with secure token lifecycle
management. Do not mix approaches accidentally. For cookie-based
authentication, configure Django's trusted origins, CORS, cookies, and
CSRF protections correctly.

### 6.7 Frontend Design Requirements

-   Use a consistent visual design system for colors, spacing,
    typography, buttons, cards, and form controls.
-   Make layouts responsive for desktop, tablet, and mobile.
-   Provide clear form labels and inline validation messages.
-   Show loading indicators and prevent duplicate submissions where
    appropriate.
-   Display empty states when there is no data.
-   Provide confirmation before destructive actions.
-   Use accessible contrast, focus indicators, and keyboard-friendly
    interactions.
-   Handle API errors without exposing internal server details.
-   Optimize image sizes and avoid loading large lists all at once.

## 7. Frontend--Backend Integration

The frontend and backend run as separate development servers. For
example:

-   React/Vite: `http://localhost:5173`
-   Django: `http://127.0.0.1:8000`

Configure Django CORS for the exact frontend development origin. Do not
allow every origin in production. If cookie-based authentication is
used, configure CSRF trusted origins and cookie settings as well.

Integration workflow:

1.  Implement and test a backend endpoint.
2.  Document its method, URL, permissions, request body, response body,
    and errors.
3.  Implement the corresponding frontend API function.
4.  Connect the API function to the page or component.
5.  Test successful, invalid, unauthenticated, and unauthorized
    requests.
6.  Verify that the database contains the expected results.
7.  Add automated tests for the workflow.

## 8. Security and Privacy Requirements

-   Enforce authorization on every protected backend operation.
-   Verify that a user owns or is authorized to access each requested
    object.
-   Use Django password hashing and a secure authentication strategy.
-   Keep secrets in environment variables or a secret manager.
-   Use HTTPS in production.
-   Validate file type, size, and access permissions for uploads.
-   Apply rate limiting or abuse controls to sensitive endpoints where
    appropriate.
-   Use safe, parameterized ORM operations; avoid constructing SQL from
    untrusted strings.
-   Minimize personal information in public listings and lost-pet
    reports.
-   Protect medical records and private conversations.
-   Verify payment status server-side if payments are integrated.
-   Maintain backups and audit logs for sensitive operations.
-   Set production `DEBUG=False` and configure allowed hosts correctly.

## 9. Testing Plan

### Backend tests

-   Model constraints and relationships.
-   Serializer validation.
-   Authentication and role permissions.
-   Pet ownership and medical-record access.
-   Appointment conflicts and status transitions.
-   Adoption and listing workflows.
-   API error handling.
-   Database integration.

### Frontend tests

-   Component rendering.
-   Form validation.
-   Navigation and role-specific UI.
-   API loading and error states.
-   Successful and failed submissions.
-   Responsive layouts and accessibility basics.

### End-to-end workflows

-   Register or sign in.
-   Create a pet profile.
-   Add a health record.
-   Book and manage an appointment.
-   Create and review an adoption application.
-   Submit and moderate a listing.
-   Confirm that unauthorized users cannot access private data.

## 10. Development Milestones

  -----------------------------------------------------------------------
  Milestone                           Deliverable
  ----------------------------------- -----------------------------------
  1\. Requirements and design         Approved SRS, ER diagram, role
                                      matrix, API plan

  2\. Project setup                   Django project, React project,
                                      MySQL connection

  3\. Identity                        User model, login, registration,
                                      permissions

  4\. Core pet care                   Pet profiles, health records,
                                      reminders

  5\. Veterinary workflows            Clinics, availability, appointments

  6\. Welfare workflows               Adoption, fostering, rescue,
                                      volunteers

  7\. Marketplace and services        Listings, inquiries, service
                                      bookings

  8\. User experience                 Responsive dashboards,
                                      notifications, moderation

  9\. Quality assurance               Automated tests, security checks,
                                      bug fixes

  10\. Release                        Production configuration, backup
                                      plan, documentation
  -----------------------------------------------------------------------

Implement one end-to-end feature at a time rather than building every
frontend page before the API exists.

## 11. Definition of Done

A feature is complete when:

-   Its requirements and permissions are defined.
-   The database model and migration are reviewed.
-   The backend endpoint validates and authorizes requests.
-   The frontend handles success, loading, empty, and error states.
-   Automated tests cover the key behavior.
-   Unauthorized access and invalid input have been tested.
-   The feature is documented.
-   No credentials or secrets are committed to version control.

## 12. Deployment Checklist

Before production:

-   Set `DEBUG=False`.
-   Configure a strong secret key and secure environment variables.
-   Restrict allowed hosts and CORS origins.
-   Configure HTTPS and secure cookies.
-   Use a least-privilege MySQL account.
-   Apply database migrations through the deployment process.
-   Configure static and media file serving.
-   Set up backups, logs, monitoring, and recovery testing.
-   Review privacy notices and data retention.
-   Verify all optional external integrations.
-   Run automated tests and smoke tests.

## 13. Recommended Next Deliverables

Complete these artifacts before large-scale implementation:

1.  Final Software Requirements Specification.
2.  Entity Relationship Diagram (ERD).
3.  MySQL logical schema and data dictionary.
4.  Django model and migration plan.
5.  API endpoint specification.
6.  Role and permission matrix.
7.  React page map and component plan.
8.  Test cases and acceptance checklist.

------------------------------------------------------------------------

**Project baseline:** PawVerse uses React for the frontend, Django REST
Framework for the backend, and MySQL for data storage. This guide
defines the development approach; the actual application features become
available only as their models, APIs, UI components, and tests are
implemented.
