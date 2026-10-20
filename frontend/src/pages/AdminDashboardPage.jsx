import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  Heart,
  PawPrint,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Stethoscope,
  Users,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api, getErrorMessage } from "../api/client";

const adminShortcuts = [
  { label: "Manage pets", detail: "Review pet profiles", path: "/pets", icon: PawPrint, tone: "coral" },
  { label: "Appointments", detail: "View care schedules", path: "/appointments", icon: CalendarDays, tone: "teal" },
  { label: "Vet profiles", detail: "Browse veterinary care", path: "/vet-profiles", icon: Stethoscope, tone: "lavender" },
  { label: "Marketplace", detail: "Review product listings", path: "/marketplace", icon: ShoppingBag, tone: "peach" },
  { label: "Community", detail: "Open the community feed", path: "/community", icon: Users, tone: "green" },
  { label: "Role guide", detail: "View roles and permissions", path: "/roles", icon: ShieldCheck, tone: "yellow" },
];

const metricCards = [
  { key: "users", label: "Community members", icon: Users, tone: "teal" },
  { key: "pets", label: "Pets cared for", icon: PawPrint, tone: "coral" },
  { key: "veterinary_profiles", label: "Vet profiles", icon: Stethoscope, tone: "lavender" },
  { key: "appointments", label: "Appointments", icon: CalendarDays, tone: "yellow" },
  { key: "marketplace_products", label: "Marketplace listings", icon: ShoppingBag, tone: "peach" },
  { key: "active_products", label: "Active listings", icon: BadgeCheck, tone: "green" },
  { key: "vaccinations", label: "Vaccination records", icon: ShieldCheck, tone: "blue" },
  { key: "medical_records", label: "Health records", icon: Heart, tone: "rose" },
];

function fullName(first, last, fallback = "—") {
  return [first, last].filter(Boolean).join(" ") || fallback;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? String(value)
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function cleanAppointmentText(value) {
  return String(value || "")
    .replace(/\[PawVerse\s+demo\s*\]\s*/gi, "")
    .trim();
}

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const [dashboardAccessDenied, setDashboardAccessDenied] = useState(false);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setDashboardError("");
    try {
      const { data } = await api.get("/admin/dashboard/");
      setDashboard(data);
      setDashboardAccessDenied(false);
    } catch (requestError) {
      setDashboard(null);
      setDashboardAccessDenied(requestError?.response?.status === 403);
      setDashboardError(getErrorMessage(requestError, "We couldn't load the administration dashboard."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadDashboard(); }, []);

  async function reviewAppointment(appointment, status) {
    setActionError("");
    setNotice("");
    try {
      await api.patch(`/admin/appointments/${appointment.id}/review/`, { status });
      setNotice(`Appointment ${status}.`);
      await loadDashboard();
    } catch (requestError) {
      setActionError(getErrorMessage(requestError, "Couldn't update this appointment."));
    }
  }

  const metrics = dashboard?.metrics || {};
  const appointmentStatuses = metrics.appointment_statuses || {};
  const pendingAppointments = dashboard?.pending_appointments || [];
  const recentPets = dashboard?.recent_pets || [];
  const recentAppointments = dashboard?.recent_appointments || [];
  const recentUsers = dashboard?.recent_users || [];
  const filteredDashboardRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const matches = (record) => !query || Object.values(record)
      .some((value) => String(value || "").toLowerCase().includes(query));
    return {
      pendingAppointments: pendingAppointments.filter(matches),
      recentPets: recentPets.filter(matches),
      recentAppointments: recentAppointments.filter(matches),
      recentUsers: recentUsers.filter(matches),
    };
  }, [pendingAppointments, recentAppointments, recentPets, recentUsers, searchQuery]);
  const hasOperationalRecords = ["pets", "veterinary_profiles", "appointments", "marketplace_products"]
    .some((key) => Number(metrics[key]) > 0);

  return (
    <section className="resource-page admin-dashboard">
      <header className="resource-heading">
        <div>
          <div className="eyebrow"><ShieldCheck size={14} /> PAWVERSE OPERATIONS</div>
          <h1>Admin Dashboard</h1>
          <p>Live platform activity, recent records, and community approvals.</p>
        </div>
        <button className="button button-light resource-refresh" type="button" onClick={loadDashboard} disabled={loading}>
          <RefreshCw size={15} /> Refresh
        </button>
      </header>

      {actionError && <div className="form-alert" role="alert">{actionError}</div>}
      {notice && <div className="form-success" role="status">{notice}</div>}
      {dashboardError && <div className="form-alert" role="alert">{dashboardError}</div>}
      {dashboardAccessDenied && (
        <div className="admin-access-notice" role="note">
          <ShieldCheck size={20} />
          <div>
            <strong>Staff access is required for live admin data.</strong>
            <p>Sign in with a Django staff account to view platform metrics and review appointment requests.</p>
          </div>
        </div>
      )}

      <section className="admin-shortcuts" aria-label="Administration shortcuts">
        <div className="admin-shortcuts-heading">
          <span className="eyebrow">QUICK ACCESS</span>
          <h2>Where would you like to go?</h2>
        </div>
        <div className="admin-shortcut-grid">
          {adminShortcuts.map(({ label, detail, path, icon: Icon, tone }) => (
            <Link className="admin-shortcut" to={path} key={path}>
              <span className={`admin-shortcut-icon admin-shortcut-${tone}`}><Icon size={18} /></span>
              <span><strong>{label}</strong><small>{detail}</small></span>
              <ArrowRight className="admin-shortcut-arrow" size={16} />
            </Link>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="admin-metric-grid" aria-label="Loading dashboard">
          {metricCards.map(({ key }) => <div className="resource-skeleton admin-metric-skeleton" key={key} />)}
        </div>
      ) : dashboard && (
        <>
          {!hasOperationalRecords && (
            <section className="admin-first-steps">
              <div>
                <span className="eyebrow">GETTING STARTED</span>
                <h2>Your platform overview will grow as records are added.</h2>
                <p>Metrics on this page reflect live PawVerse data. Start with pet profiles, appointments, or veterinary listings to see activity here.</p>
              </div>
              <Link className="button button-dark" to="/pets">Explore pet profiles <ArrowRight size={15} /></Link>
            </section>
          )}
          <section className="admin-overview">
            <div className="admin-overview-copy">
              <span className="admin-live-indicator"><span /> DATABASE OVERVIEW</span>
              <h2>Care is happening here.</h2>
              <p>Current totals and recent activity from your PawVerse database.</p>
            </div>
            <div className="admin-status-summary">
              <span>Appointments by status</span>
              {Object.keys(appointmentStatuses).length ? Object.entries(appointmentStatuses).map(([status, count]) => (
                <span className="admin-status-pill" key={status}>
                  <strong>{count}</strong> {status.replaceAll("_", " ")}
                </span>
              )) : <span className="admin-status-pill"><strong>0</strong> scheduled</span>}
            </div>
          </section>

          <div className="admin-metric-grid">
            {metricCards.map(({ key, label, icon: Icon, tone }) => (
              <article className={`admin-metric-card admin-metric-${tone}`} key={key}>
                <div className="admin-metric-icon"><Icon size={19} /></div>
                <span>{label}</span>
                <strong>{Number(metrics[key] || 0).toLocaleString()}</strong>
              </article>
            ))}
          </div>

          <div className="marketplace-toolbar" role="search">
            <label className="marketplace-search">
              <Search size={17} aria-hidden="true" />
              <span className="sr-only">Search dashboard records</span>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search appointments, pets, or members..."
              />
            </label>
          </div>

          <div className="admin-data-grid">
            <section className="admin-data-panel admin-approvals-panel">
              <div className="admin-data-panel-heading">
                <div><span className="eyebrow">NEEDS A LOOK</span><h2>Pending appointments</h2></div>
                <span className="crew-count">{filteredDashboardRecords.pendingAppointments.length}</span>
              </div>
              {filteredDashboardRecords.pendingAppointments.length ? (
                <div className="admin-approval-list">
                  {filteredDashboardRecords.pendingAppointments.map((appointment) => (
                    <article className="admin-approval-row" key={appointment.id}>
                      <div className="admin-approval-copy">
                        <strong>{appointment.pet__name || "Pet"} · {appointment.pet__species || "Pet appointment"}</strong>
                        <span className="admin-appointment-concern">Concern: {cleanAppointmentText(appointment.reason) || "No concern provided"}</span>
                        <small className="admin-appointment-meta">
                          Requested by {fullName(appointment.user__first_name, appointment.user__last_name, appointment.user__email)}
                          {" · "}{formatDate(appointment.scheduled_at)}
                        </small>
                        {(appointment.veterinarian__clinic_name || appointment.veterinarian__specialization) && (
                          <small className="admin-appointment-meta">
                            {[
                              appointment.veterinarian__clinic_name,
                              appointment.veterinarian__specialization,
                            ].filter(Boolean).map(cleanAppointmentText).filter(Boolean).join(" · ")}
                          </small>
                        )}
                      </div>
                      <div className="approval-actions">
                        <button className="button button-dark" type="button" onClick={() => reviewAppointment(appointment, "confirmed")} aria-label={`Confirm appointment for ${appointment.pet__name || "pet"}`}>
                          <Check size={14} /> Confirm
                        </button>
                        <button className="button button-light" type="button" onClick={() => reviewAppointment(appointment, "cancelled")} aria-label={`Decline appointment for ${appointment.pet__name || "pet"}`}>
                          <X size={14} /> Decline
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : <p className="admin-panel-empty">{searchQuery ? "No matching appointment requests." : "No appointment requests to review."}</p>}
            </section>

            <section className="admin-data-panel">
              <div className="admin-data-panel-heading"><div><span className="eyebrow">FRESH PAWS</span><h2>Recently added pets</h2></div><PawPrint size={19} /></div>
              <div className="admin-compact-list">
                {filteredDashboardRecords.recentPets.map((pet) => (
                  <article className="admin-compact-row" key={pet.id}>
                    <span className="admin-list-avatar admin-avatar-coral"><PawPrint size={15} /></span>
                    <span className="admin-compact-main"><strong>{pet.name}</strong><small>{[pet.breed, pet.species].filter(Boolean).join(" · ") || "Pet profile"}</small></span>
                    <span className="admin-compact-aside">{fullName(pet.owner__first_name, pet.owner__last_name, pet.owner__email || "Owner")}</span>
                  </article>
                ))}
                {!filteredDashboardRecords.recentPets.length && <p className="admin-panel-empty">{searchQuery ? "No matching pet profiles." : "No pet profiles yet."}</p>}
              </div>
            </section>

            <section className="admin-data-panel">
              <div className="admin-data-panel-heading"><div><span className="eyebrow">CARE SCHEDULE</span><h2>Recent appointments</h2></div><CalendarDays size={19} /></div>
              <div className="admin-compact-list">
                {filteredDashboardRecords.recentAppointments.map((appointment) => (
                  <article className="admin-compact-row" key={appointment.id}>
                    <span className="admin-list-avatar admin-avatar-teal"><CalendarDays size={15} /></span>
                    <span className="admin-compact-main">
                      <strong>{appointment.pet__name || "Pet appointment"}</strong>
                      <small>{fullName(appointment.user__first_name, appointment.user__last_name, appointment.user__email)}</small>
                    </span>
                    <span className="admin-compact-aside">{formatDate(appointment.scheduled_at)} · {appointment.status}</span>
                  </article>
                ))}
                {!filteredDashboardRecords.recentAppointments.length && <p className="admin-panel-empty">{searchQuery ? "No matching appointments." : "No appointments yet."}</p>}
              </div>
            </section>

            <section className="admin-data-panel">
              <div className="admin-data-panel-heading"><div><span className="eyebrow">COMMUNITY</span><h2>New members</h2></div><Users size={19} /></div>
              <div className="admin-compact-list">
                {filteredDashboardRecords.recentUsers.map((member) => (
                  <article className="admin-compact-row" key={member.id}>
                    <span className="admin-list-avatar admin-avatar-lavender"><Users size={15} /></span>
                    <span className="admin-compact-main"><strong>{fullName(member.first_name, member.last_name, member.email)}</strong><small>{member.role || "Community member"}</small></span>
                    <span className="admin-compact-aside">{formatDate(member.date_joined)}</span>
                  </article>
                ))}
                {!filteredDashboardRecords.recentUsers.length && <p className="admin-panel-empty">{searchQuery ? "No matching members." : "No members yet."}</p>}
              </div>
            </section>

          </div>
        </>
      )}
    </section>
  );
}
