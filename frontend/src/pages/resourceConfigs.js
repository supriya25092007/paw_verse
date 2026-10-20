const pet = { endpoint: "/pets/", labelFields: ["name"] };
const vet = {
  endpoint: "/vet-directory/",
  labelFields: ["display_name", "clinic_name", "address", "specialization"],
};
const adoptionListing = {
  endpoint: "/adoption-listings/",
  labelFields: ["pet_name", "pet_species", "pet_breed"],
  filter: (record) => record.status === "available",
};
const marketplaceListing = { endpoint: "/listings/", labelFields: ["title"], filter: (record) => record.status === "active" };
const service = { endpoint: "/services/", labelFields: ["title"] };
const groomingService = { ...service, ownerOnly: true, filter: (record) => record.kind === "grooming" };
const sittingService = { ...service, ownerOnly: true, filter: (record) => record.kind === "sitting" };
const activeService = { ...service, filter: (record) => record.is_active };
const rescueCase = { endpoint: "/rescue-cases/", labelFields: ["location", "description"] };

const reference = (name, label, source, required = true) => ({
  name,
  label,
  type: "reference",
  source,
  required,
});
const text = (name, label, required = true) => ({ name, label, type: "text", required });
const longText = (name, label, required = true) => ({ name, label, type: "textarea", required });
const date = (name, label, required = true) => ({ name, label, type: "date", required });
const dateTime = (name, label, required = true) => ({ name, label, type: "datetime-local", required });
const number = (name, label, required = true) => ({ name, label, type: "number", required });
const choice = (name, label, options, required = true) => ({ name, label, type: "select", options, required });
const checkbox = (name, label, defaultValue = false) => ({ name, label, type: "boolean", defaultValue });

export const resourceConfigs = {
  healthPassport: {
    title: "Health Passport & Vaccinations",
    description: "Record vaccinations and upcoming doses for your pets.",
    endpoint: "/vaccinations/",
    manageOwnRecords: true,
    fields: [
      reference("pet", "Pet", pet),
      text("name", "Vaccine name"),
      date("administered_on", "Administered on"),
      date("next_due_on", "Next due on", false),
      reference("veterinarian", "Veterinarian", vet, false),
      longText("notes", "Notes", false),
    ],
    displayFields: ["name", "pet", "administered_on", "next_due_on", "veterinarian"],
  },
  reminders: {
    title: "Care Reminders",
    description: "Create and track the care tasks coming up for your pets.",
    endpoint: "/reminders/",
    manageOwnRecords: true,
    fields: [
      reference("pet", "Pet", pet),
      text("title", "Reminder"),
      longText("details", "Details", false),
      dateTime("due_at", "Due date and time"),
      text("recurrence", "Recurrence (optional)", false),
      choice("status", "Status", [["open", "Open"], ["done", "Done"], ["cancelled", "Cancelled"]]),
    ],
    displayFields: ["title", "pet", "due_at", "recurrence", "status"],
  },
  careRecords: {
    title: "Care Records",
    description: "Keep a dated medical and care history for each pet.",
    endpoint: "/medical-history/",
    manageOwnRecords: true,
    fields: [
      reference("pet", "Pet", pet),
      text("title", "Record title"),
      longText("description", "Details"),
      date("occurred_on", "Date"),
      reference("veterinarian", "Veterinarian", vet, false),
    ],
    displayFields: ["title", "pet", "occurred_on", "description", "veterinarian"],
  },
  vetProfiles: {
    title: "Veterinary Profiles",
    description: "Explore verified veterinary professionals and their practice details.",
    endpoint: "/vet-directory/",
    create: false,
    displayFields: ["display_name", "clinic_name", "address", "contact_number", "specialization", "consultation_fee", "bio", "is_verified"],
  },
  vetProfileManagement: {
    title: "My Veterinary Profile",
    description: "Manage your own veterinary profile and specialties.",
    endpoint: "/vet-profiles/",
    fields: [
      text("clinic_name", "Clinic name", false),
      text("address", "Clinic address", false),
      text("contact_number", "Contact number", false),
      text("specialization", "Specialization"),
      text("license_number", "License number"),
      number("consultation_fee", "Consultation fee"),
      longText("bio", "Biography", false),
    ],
    displayFields: ["clinic_name", "address", "contact_number", "specialization", "license_number", "consultation_fee", "is_verified"],
  },
  clinics: {
    title: "Veterinary Clinics",
    description: "Browse and register veterinary clinic details.",
    endpoint: "/clinics/",
    manageOwnRecords: true,
    fields: [
      text("name", "Clinic name"),
      longText("address", "Address"),
      text("phone", "Phone", false),
      { name: "email", label: "Email", type: "email", required: false },
      {
        name: "opening_hours",
        label: "Opening hours",
        type: "json",
        required: false,
        hint: 'Enter a JSON object, for example: {"weekdays":"09:00-18:00","saturday":"09:00-13:00","sunday":"Closed"}.',
      },
    ],
    displayFields: ["name", "address", "phone", "email", "opening_hours"],
  },
  appointments: {
    title: "Veterinary Appointments",
    description: "Book and review veterinary visits for your pets.",
    endpoint: "/appointments/",
    manageOwnRecords: true,
    fields: [
      reference("pet", "Pet", pet),
      reference("veterinarian", "Veterinarian", vet),
      dateTime("scheduled_at", "Appointment date and time"),
      longText("reason", "Reason for visit"),
    ],
    displayFields: ["pet", "veterinarian", "scheduled_at", "reason", "status"],
  },
  adoptionListings: {
    title: "Adoption Listings",
    description: "Create and explore pet adoption listings.",
    endpoint: "/adoption-listings/",
    manageBy: "owner",
    fields: [
      reference("pet", "Pet", pet),
      text("contact_number", "Contact number"),
      longText("description", "Listing description"),
    ],
    displayFields: ["pet_name", "pet_species", "pet_breed", "contact_number", "description", "status", "created_at"],
  },
  adoptionApplications: {
    title: "Adoption Applications",
    description: "Apply to available listings and track your applications.",
    endpoint: "/adoption-applications/",
    manageBy: "applicant",
    fields: [
      reference("listing", "Adoption listing", adoptionListing),
      text("contact_number", "Contact number"),
      longText("message", "Tell the listing owner about your home"),
    ],
    displayFields: ["listing_pet_name", "listing_pet_species", "listing_pet_breed", "contact_number", "message", "status", "created_at"],
  },
  rescueCases: {
    title: "Rescue Cases",
    description: "Report an animal welfare case and follow its progress.",
    endpoint: "/rescue-cases/",
    manageOwnRecords: true,
    fields: [
      reference("pet", "Related pet (optional)", pet, false),
      longText("description", "Case details"),
      text("location", "Location"),
    ],
    displayFields: ["location", "description", "pet", "status", "created_at"],
  },
  volunteers: {
    title: "Rescue Volunteers",
    description: "Volunteer for a rescue case and view approval status.",
    endpoint: "/volunteers/",
    manageOwnRecords: true,
    fields: [
      reference("rescue_case", "Rescue case", rescueCase),
      longText("message", "Message (optional)", false),
    ],
    displayFields: ["rescue_case", "message", "approved", "created_at"],
  },
  marketplace: {
    title: "Product Marketplace",
    description: "Browse products and publish items for the PawVerse community.",
    endpoint: "/listings/",
    manageBy: "seller",
    fields: [
      text("title", "Product title"),
      longText("description", "Description"),
      text("category", "Category"),
      text("image_url", "Product image URL or site path (optional)", false),
    ],
    displayFields: ["title", "category", "status", "description"],
  },
  marketplaceInquiries: {
    title: "Marketplace Inquiries",
    description: "Contact sellers and review inquiries about listings.",
    endpoint: "/inquiries/",
    manageOwnRecords: true,
    fields: [
      reference("listing", "Marketplace listing", marketplaceListing),
      longText("message", "Message to seller"),
    ],
    displayFields: ["listing", "message", "created_at"],
  },
  services: {
    title: "Grooming & Sitting Services",
    description: "Publish a grooming or sitting service for pet families.",
    endpoint: "/services/",
    manageBy: "provider",
    fields: [
      choice("kind", "Service type", [["grooming", "Grooming"], ["sitting", "Sitting"]]),
      text("title", "Service name"),
      longText("description", "Description", false),
      number("price", "Price"),
      checkbox("is_active", "Available for booking", true),
    ],
    displayFields: ["title", "kind", "price", "is_active", "description"],
  },
  grooming: {
    title: "Grooming Details",
    description: "Add grooming duration and bath details to your service.",
    endpoint: "/grooming/",
    manageOwnRecords: true,
    fields: [
      reference("service", "Your grooming service", groomingService),
      number("duration_minutes", "Duration in minutes"),
      checkbox("includes_bath", "Includes a bath"),
    ],
    displayFields: ["service", "duration_minutes", "includes_bath"],
  },
  sitting: {
    title: "Pet Sitting Details",
    description: "Set overnight and service-area details for a sitting service.",
    endpoint: "/sitting/",
    manageOwnRecords: true,
    fields: [
      reference("service", "Your sitting service", sittingService),
      checkbox("overnight", "Overnight sitting"),
      text("service_area", "Service area", false),
    ],
    displayFields: ["service", "overnight", "service_area"],
  },
  serviceBookings: {
    title: "Service Bookings",
    description: "Book and review grooming or sitting services for your pets.",
    endpoint: "/service-bookings/",
    manageOwnRecords: true,
    fields: [
      reference("pet", "Pet", pet),
      reference("service", "Available service", activeService),
      dateTime("scheduled_at", "Booking date and time"),
    ],
    displayFields: ["pet", "service", "scheduled_at", "status"],
  },
  transactions: {
    title: "Payments & Transactions",
    description: "Review the transaction history connected to your account.",
    endpoint: "/transactions/",
    create: false,
    displayFields: ["amount", "currency", "status", "provider_reference", "created_at"],
  },
  community: {
    title: "Community Feed",
    description: "Share an update with the PawVerse pet community.",
    endpoint: "/posts/",
    manageOwnRecords: true,
    fields: [longText("content", "Your post")],
    displayFields: ["content", "author", "created_at", "updated_at"],
  },
  lostFound: {
    title: "Lost & Found",
    description: "Post or browse a lost or found pet report.",
    endpoint: "/lost-found/",
    manageOwnRecords: true,
    fields: [
      choice("report_type", "Report type", [["lost", "Lost"], ["found", "Found"]]),
      reference("pet", "Pet (optional)", pet, false),
      longText("description", "Description"),
      text("location", "Last seen location"),
      dateTime("last_seen_at", "Date and time last seen"),
    ],
    displayFields: ["report_type", "pet", "location", "last_seen_at", "description", "resolved"],
  },
  chats: {
    title: "Messaging Chats",
    description: "Create a private chat and review conversations you participate in.",
    endpoint: "/chats/",
    manageOwnRecords: true,
    fields: [
      { name: "participants", label: "Other participant user IDs (comma-separated, optional)", type: "id-list", required: false },
    ],
    displayFields: ["participants", "created_at", "updated_at"],
  },
  messages: {
    title: "Messages",
    description: "Send a message to a chat you participate in.",
    endpoint: "/messages/",
    manageBy: "sender",
    fields: [
      reference("chat", "Chat", { endpoint: "/chats/", labelFields: ["id"] }),
      longText("content", "Message"),
    ],
    displayFields: ["chat", "sender", "content", "sent_at", "read_at"],
  },
  notifications: {
    title: "Notifications",
    description: "Review your notifications and mark them as read.",
    endpoint: "/notifications/",
    create: false,
    displayFields: ["title", "body", "channel", "sent_at", "read_at", "created_at"],
  },
  roles: {
    title: "User Roles",
    description: "Review PawVerse role definitions and understand the permissions assigned to different account types.",
    endpoint: "/roles/",
    create: false,
    displayFields: ["name", "code", "description"],
  },
};
