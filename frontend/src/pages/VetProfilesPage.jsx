import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, RefreshCw, Search, Stethoscope } from "lucide-react";
import { api, getErrorMessage } from "../api/client";

function recordsFrom(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function initials(name) {
  return String(name || "Veterinary professional")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function cleanProfileText(value) {
  return String(value || "").replace(/\[PawVerse\s+demo\s*\]\s*/gi, "").trim();
}

export default function VetProfilesPage() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const visibleProfiles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return profiles;
    return profiles.filter((profile) => [
      profile.display_name,
      profile.clinic_name,
      profile.specialization,
      profile.address,
      profile.contact_number,
      profile.bio,
    ].some((value) => String(value || "").toLowerCase().includes(query)));
  }, [profiles, searchQuery]);

  async function loadProfiles() {
    setLoading(true);
    setError("");
    try {
      let url = "/vet-directory/";
      const results = [];
      while (url) {
        const { data } = await api.get(url);
        results.push(...recordsFrom(data));
        url = Array.isArray(data) ? null : data?.next || null;
      }
      setProfiles(results);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "We couldn't load the veterinary directory."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadProfiles(); }, []);

  return (
    <section className="resource-page vet-directory">
      <header className="resource-heading">
        <div>
          <div className="eyebrow"><Stethoscope size={14} /> PAWVERSE CARE NETWORK</div>
          <h1>Veterinary professionals</h1>
          <p>Explore verified practitioners and their specialties. Your own profile is included so you can review it.</p>
        </div>
        <button className="button button-light resource-refresh" type="button" onClick={loadProfiles} disabled={loading}>
          <RefreshCw size={15} /> Refresh
        </button>
      </header>

      {error && <div className="form-alert" role="alert">{error}</div>}
      {loading ? (
        <div className="resource-record-grid" aria-label="Loading veterinary professionals">
          <div className="resource-skeleton" /><div className="resource-skeleton" /><div className="resource-skeleton" />
        </div>
      ) : profiles.length ? (
        <>
          <div className="marketplace-toolbar" role="search">
            <label className="marketplace-search">
              <Search size={17} aria-hidden="true" />
              <span className="sr-only">Search veterinary profiles</span>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search vets, clinics, specialties..."
              />
            </label>
          </div>
          <div className="vet-directory-summary">
            <span className="crew-count">{visibleProfiles.length}</span>
            <span>{visibleProfiles.length === 1 ? "professional" : "professionals"} matching your search</span>
          </div>
          {visibleProfiles.length ? (
            <div className="vet-directory-grid">
              {visibleProfiles.map((profile) => (
                <article className="vet-directory-card" key={profile.id}>
                  <div className="vet-directory-card-top">
                    <div className="vet-directory-avatar" aria-hidden="true">{initials(profile.display_name)}</div>
                    {profile.is_verified && (
                      <span className="vet-verified"><BadgeCheck size={15} /> Verified</span>
                    )}
                  </div>
                  <h2>{profile.display_name || "Veterinary professional"}</h2>
                  <p className="vet-directory-specialty">{cleanProfileText(profile.specialization)}</p>
                  <p className="vet-directory-clinic">{cleanProfileText(profile.clinic_name) || "Independent practice"}</p>
                  {profile.address && <p className="vet-directory-address">{cleanProfileText(profile.address)}</p>}
                  {profile.contact_number && (
                    <p className="vet-directory-contact">
                      <a href={`tel:${profile.contact_number}`}>{cleanProfileText(profile.contact_number)}</a>
                    </p>
                  )}
                  {profile.bio && <p className="vet-directory-bio">{cleanProfileText(profile.bio)}</p>}
                  <div className="vet-directory-card-footer">
                    <span>Consultation</span>
                    <strong>{Number(profile.consultation_fee) > 0
                      ? `${Number(profile.consultation_fee).toFixed(2)} / visit`
                      : "Contact for fee"}</strong>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon"><Search size={21} /></div>
              <h3>No matching veterinary profiles</h3>
              <p>Try a different clinic name, vet name, or specialty.</p>
              <button className="text-button" type="button" onClick={() => setSearchQuery("")}>Clear search</button>
            </div>
          )}
        </>
      ) : !error ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Stethoscope size={21} /></div>
          <h3>No verified profiles yet</h3>
          <p>Verified veterinary professionals will appear here as they join PawVerse.</p>
        </div>
      ) : null}
    </section>
  );
}
