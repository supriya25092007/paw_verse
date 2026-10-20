import { ArrowRight, Bell, Bone, CalendarDays, CirclePlus, HeartPulse, PawPrint, Search, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, getErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import PetCard from "../components/PetCard";

export default function DashboardPage() {
  const { user } = useAuth();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [nextPage, setNextPage] = useState(null);
  const [petCount, setPetCount] = useState(0);
  const [query, setQuery] = useState("");
  const [retry, setRetry] = useState(0);
  const [overview, setOverview] = useState(null);
  const [overviewErrors, setOverviewErrors] = useState([]);
  const [overviewLoading, setOverviewLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadPets() {
      setLoading(true);
      try {
        const { data } = await api.get("/pets/");
        if (active) {
          const results = Array.isArray(data) ? data : data.results || [];
          setPets(results);
          setPetCount(data.count ?? results.length);
          setNextPage(data.next || null);
          setError("");
        }
      } catch (requestError) {
        if (active) setError(getErrorMessage(requestError, "We couldn't load your pets right now."));
      } finally {
        if (active) setLoading(false);
      }
    }
    loadPets();
    async function loadOverview() {
      setOverviewLoading(true);
      const endpoints = [
        ["appointments", "/appointments/"],
        ["vaccinations", "/vaccinations/"],
        ["reminders", "/reminders/"],
      ];
      const results = await Promise.all(endpoints.map(async ([key, endpoint]) => {
        try {
          const { data } = await api.get(endpoint);
          const items = Array.isArray(data) ? data : data.results || [];
          if (key === "reminders" && !Array.isArray(data)) {
            let next = data.next;
            while (next) {
              const { data: nextPage } = await api.get(next);
              items.push(...(Array.isArray(nextPage) ? nextPage : nextPage.results || []));
              next = Array.isArray(nextPage) ? null : nextPage.next || null;
            }
          }
          return [key, { count: data.count ?? items.length, items }, ""];
        } catch (requestError) {
          return [key, null, getErrorMessage(requestError, `Couldn't load ${key}.`)];
        }
      }));
      if (active) {
        setOverview(Object.fromEntries(results.map(([key, value]) => [key, value])));
        setOverviewErrors(results.filter(([, , message]) => message).map(([, , message]) => message));
        setOverviewLoading(false);
      }
    }
    loadOverview();
    return () => { active = false; };
  }, [retry]);

  async function loadMorePets() {
    if (!nextPage || loadingMore) return;
    setLoadingMore(true);
    setError("");
    try {
      const { data } = await api.get(nextPage);
      const results = Array.isArray(data) ? data : data.results || [];
      setPets((current) => [...current, ...results]);
      setPetCount(data.count ?? petCount);
      setNextPage(data.next || null);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "We couldn't load more pets right now."));
    } finally {
      setLoadingMore(false);
    }
  }

  const visiblePets = useMemo(
    () => {
      const normalizedQuery = query.trim().toLowerCase();
      return pets.filter((pet) => (
        [pet.name, pet.species, pet.breed, pet.color]
          .some((value) => String(value || "").toLowerCase().includes(normalizedQuery))
      ));
    },
    [pets, query],
  );
  const petPhotoIndexes = useMemo(() => {
    const speciesIndexes = new Map();
    return new Map(pets.map((pet) => {
      const index = speciesIndexes.get(pet.species) || 0;
      speciesIndexes.set(pet.species, index + 1);
      return [pet.id, index];
    }));
  }, [pets]);
  const upcomingReminders = overview?.reminders?.items?.filter((reminder) => (
    reminder.status === "open" && reminder.due_at && new Date(reminder.due_at) >= new Date()
  )).length;
  const firstName = user?.first_name || "friend";

  return (
    <div className="dashboard-page">
      <section className="welcome-banner">
        <div className="welcome-copy">
          <div className="eyebrow"><Sparkles size={14} /> YOUR PET FAMILY, ALL IN ONE PLACE</div>
          <h1>Well, hello there,<br /><span>{firstName}.</span></h1>
          <p>A little home base for all the little lives you love.</p>
          <Link to="/pets/new" className="button button-dark">Add your pet <ArrowRight size={16} /></Link>
        </div>
        <div className="welcome-art">
          <span className="welcome-sun" /><span className="welcome-pet">🐈</span><span className="welcome-paw paw-one">🐾</span><span className="welcome-paw paw-two">✳</span>
          <div className="welcome-art-caption"><span>♡</span> all together, all loved</div>
        </div>
      </section>

      <section className="overview-section" aria-labelledby="overview-heading">
        <div className="dashboard-section-heading">
          <div><div className="eyebrow"><HeartPulse size={14} /> THE LITTLE THINGS, TAKEN CARE OF</div><h2 id="overview-heading">Care at a glance</h2></div>
        </div>
        {overviewErrors.length > 0 && (
          <div className="form-alert dashboard-alert" role="alert">
            Some care details could not be loaded: {overviewErrors.join(" ")}
            <button className="inline-button" onClick={() => setRetry((current) => current + 1)}>Try again</button>
          </div>
        )}
        <div className="overview-grid">
          <Link className="overview-tile" to="/appointments">
            <span className="overview-icon overview-icon-peach"><CalendarDays size={19} /></span>
            <span className="overview-copy"><small>Appointments</small><strong>{overviewLoading ? "…" : overview?.appointments?.count ?? "—"}</strong><span>Visits in your care</span></span>
            <ArrowRight className="overview-arrow" size={16} />
          </Link>
          <Link className="overview-tile" to="/health-passport">
            <span className="overview-icon overview-icon-sage"><HeartPulse size={19} /></span>
            <span className="overview-copy"><small>Vaccinations</small><strong>{overviewLoading ? "…" : overview?.vaccinations?.count ?? "—"}</strong><span>Health records saved</span></span>
            <ArrowRight className="overview-arrow" size={16} />
          </Link>
          <Link className="overview-tile" to="/reminders">
            <span className="overview-icon overview-icon-terracotta"><Bell size={19} /></span>
            <span className="overview-copy"><small>Upcoming reminders</small><strong>{overviewLoading ? "…" : upcomingReminders ?? "—"}</strong><span>Open care tasks ahead</span></span>
            <ArrowRight className="overview-arrow" size={16} />
          </Link>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-heading">
          <div><div className="eyebrow"><Bone size={14} /> THE IMPORTANT ONES</div><h2>Meet your crew <span className="crew-count">{petCount}</span></h2></div>
          {pets.length > 0 && <Link to="/pets/new" className="subtle-action"><CirclePlus size={16} /> Add a pet</Link>}
        </div>
        {pets.length > 0 && (
          <div className="marketplace-toolbar" role="search">
            <label className="marketplace-search">
              <Search size={17} aria-hidden="true" />
              <span className="sr-only">Search pets</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search pets by name, type, or breed..."
              />
            </label>
          </div>
        )}

        {error && <div className="form-alert dashboard-alert" role="alert">{error} <button className="inline-button" onClick={() => setRetry((current) => current + 1)}>Try again</button></div>}
        {loading ? (
          <div className="pet-grid" aria-label="Loading your pets">{[1, 2, 3].map((item) => <div className="pet-skeleton" key={item}><div /><span /><span /></div>)}</div>
        ) : visiblePets.length ? (
          <div className="pet-grid">{visiblePets.map((pet) => <PetCard pet={pet} photoIndex={petPhotoIndexes.get(pet.id)} key={pet.id} />)}</div>
        ) : pets.length ? (
          <div className="empty-state search-empty"><div className="empty-state-icon"><PawPrint size={23} /></div><h3>No paws by that name</h3><p>Try another search and we’ll find your friend.</p><button className="text-button" onClick={() => setQuery("")}>Clear search</button></div>
        ) : !error ? (
          <div className="empty-state">
            <div className="empty-state-icon"><span>🐾</span></div><h3>Your crew is waiting to meet you</h3>
            <p>Add a pet profile to keep the little details about your best friend together.</p>
            <Link to="/pets/new" className="button button-dark">Add your pet <ArrowRight size={16} /></Link>
          </div>
        ) : null}
        {!loading && nextPage && (
          <div className="load-more-wrap">
            <button className="button button-light" onClick={loadMorePets} disabled={loadingMore}>
              {loadingMore ? "Finding the rest of your crew..." : `Meet more of your crew (${pets.length} of ${petCount})`}
            </button>
          </div>
        )}
      </section>
      <div className="dashboard-footer-note"><span>✳</span> The best things in life have paws.</div>
    </div>
  );
}
