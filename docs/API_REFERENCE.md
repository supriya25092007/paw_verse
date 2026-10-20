# PawVerse Backend API

Base URL for local development: `http://127.0.0.1:8000`

Protected endpoints use `Authorization: Bearer <access-token>`. Collection
responses use page-number pagination (`count`, `next`, `previous`, `results`).
Validation errors return HTTP 400 with field names and error messages.
Unless stated otherwise, endpoints require authentication and user-owned
records are scoped to the authenticated account. Request bodies cannot set
ownership, verification, or workflow-status fields.

## Authentication

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register/` | Public | Create a pet-owner account |
| `POST` | `/api/auth/token/` | Public | Obtain access and refresh JWTs |
| `POST` | `/api/auth/token/refresh/` | Public | Obtain a new access JWT |
| `GET` | `/api/auth/me/` | Authenticated | Get the current account |
| `PATCH` | `/api/auth/me/` | Authenticated | Update first and last name |

Registration accepts `email`, `password`, and optional `first_name` and
`last_name`. Public registration always assigns the `pet_owner` role.
Sign in with the `email` and `password` fields. Access tokens expire after
30 minutes and refresh tokens after one day.

## Pets

All pet endpoints are authenticated and operate only on pets owned by the
current account. Supplying an `owner` during create/update does not change
ownership.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/pets/` | List the current user's pets |
| `POST` | `/api/pets/` | Create a pet |
| `GET` | `/api/pets/{id}/` | Retrieve an owned pet |
| `PUT` / `PATCH` | `/api/pets/{id}/` | Update an owned pet |
| `DELETE` | `/api/pets/{id}/` | Delete an owned pet |

Pet fields: `name` (required), `species` (`dog`, `cat`, `bird`,
`small_mammal`, `reptile`, `other`), `breed`, `sex` (`male`, `female`,
`unknown`), `date_of_birth`, `weight_kg`, `color`, `microchip_number`, and
`notes`. The API generates `id`, `owner`, `created_at`, and `updated_at`.

## API resources by backend app

| App | Models | Routes |
| --- | --- | --- |
| `accounts` | `User`, `Role` | `GET /api/roles/` (staff only); authentication routes above |
| `pets` | `Pet` (`PetProfile` alias) | `/api/pets/` |
| `health_records` | `Vaccination`, `MedicalHistory` | `/api/vaccinations/`, `/api/medical-history/` |
| `reminders` | `CareReminder` | `/api/reminders/` |
| `veterinary` | `VetProfile`, `Clinic` | `/api/vet-profiles/`, `/api/clinics/` |
| `appointments` | `Booking` | `/api/appointments/` |
| `adoption` | `Listing`, `Application` | `/api/adoption-listings/`, `/api/adoption-applications/` |
| `rescue` | `RescueCase`, `Volunteer` | `/api/rescue-cases/`, `/api/volunteers/` |
| `marketplace` | `Listing`, `Inquiry` | `/api/listings/`, `/api/inquiries/` |
| `services` | `Service`, `Grooming`, `Sitting`, `Booking` | `/api/services/`, `/api/grooming/`, `/api/sitting/`, `/api/service-bookings/` |
| `payments` | `Transaction` | `/api/transactions/` (read-only; payment-provider processing is not configured) |
| `community` | `Post`, `LostFound` | `/api/posts/`, `/api/lost-found/` |
| `messaging` | `Chat`, `Message` | `/api/chats/`, `/api/messages/` |
| `notifications` | `Notification` (in-app/SMS channel) | `/api/notifications/` (read and mark read) |
| `administration` | `AuditLog`, `Approval`, `Analytics` | `/api/admin/audit-logs/`, `/api/admin/approvals/`, `/api/admin/analytics/` (staff read-only) |

Health records, reminders, appointments, and service bookings validate that
the referenced pet belongs to the authenticated user. Vet profiles, clinics,
services, listings, and applications assign their account foreign keys on the
server. Active marketplace/adoption listings and active services are
discoverable by authenticated users; only their owners can edit them.
Applicants may withdraw an adoption application, and listing owners may
approve or reject applications for their listings. Admin resources require
Django staff permissions. The SMS channel is data-only; no SMS provider
integration is configured.
