import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CirclePlus, Pencil, RefreshCw, Search, Send, Trash2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { api, getErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import PhotoWithFallback from "../components/PhotoWithFallback";
import { amazonSearchUrl, listingImageFor } from "./marketplaceUtils";

function recordsFrom(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

async function loadAllRecords(endpoint) {
  let url = endpoint;
  const records = [];
  while (url) {
    const { data } = await api.get(url);
    records.push(...recordsFrom(data));
    url = Array.isArray(data) ? null : data?.next || null;
  }
  return records;
}

function referenceLabel(record, fields) {
  const label = fields
    .map((field) => record?.[field])
    .find((value) => value !== null && value !== undefined && value !== "");
  if (label) return displayText(label);
  return `Record #${record.id}`;
}

function initialValues(fields = []) {
  return Object.fromEntries(fields.map((field) => [field.name, field.defaultValue ?? ""]));
}

function displayText(value) {
  return String(value).replace(/\[PawVerse demo\]\s*/gi, "").trim();
}

function displayOpeningHours(value) {
  if (Array.isArray(value)) {
    return value.map(displayText).filter(Boolean).join("; ");
  }
  if (typeof value === "string") return displayText(value);
  if (!value || typeof value !== "object") return displayValue(value);

  const formatTime = (hour, minute) => {
    const period = Number(hour) >= 12 ? "PM" : "AM";
    const hour12 = Number(hour) % 12 || 12;
    return `${hour12}:${minute} ${period}`;
  };
  const formatHours = (hours) => {
    const range = String(hours).match(/^\s*(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})\s*$/);
    if (range) return `${formatTime(range[1], range[2])}–${formatTime(range[3], range[4])}`;
    return displayText(hours);
  };

  return Object.entries(value)
    .map(([day, hours]) => {
      const label = day.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
      return `${label}: ${formatHours(hours)}`;
    })
    .join("; ");
}

function displayValue(value, field) {
  if (value === null || value === undefined || value === "") return "—";
  if (field === "opening_hours") return displayOpeningHours(value);
  if (Array.isArray(value)) return value.map(displayValue).join("; ");
  if (typeof value === "object") {
    return Object.entries(value)
      .map(([key, nestedValue]) => `${key.replaceAll("_", " ")}: ${displayValue(nestedValue)}`)
      .join("; ");
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return typeof value === "string" ? displayText(value) : String(value);
}

export default function ResourcePage({ config }) {
  const { user } = useAuth();
  const isMarketplace = config.endpoint === "/listings/";
  const [records, setRecords] = useState([]);
  const [nextPage, setNextPage] = useState(null);
  const [options, setOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [optionErrors, setOptionErrors] = useState({});
  const [notice, setNotice] = useState("");
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(() => ({
    ...initialValues(config.fields),
    ...(config.endpoint === "/inquiries/"
      ? { listing: new URLSearchParams(window.location.search).get("listing") || "" }
      : {}),
  }));
  const [searchQuery, setSearchQuery] = useState(
    () => new URLSearchParams(window.location.search).get("search") || "",
  );
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const searchableFields = useMemo(() => {
    const fields = new Set([
      ...Object.keys(records[0] || {}),
      ...(config.displayFields || []),
      ...Object.keys(form || {}),
    ]);
    return [...fields].filter((field) => field !== "id");
  }, [config.displayFields, form, records]);
  const [editingId, setEditingId] = useState(null);
  const referenceFields = useMemo(
    () => (config.fields || []).filter((field) => field.type === "reference"),
    [config.fields],
  );
  const categories = useMemo(
    () => [...new Set(records.map((record) => record.category).filter(Boolean))].sort(),
    [records],
  );
  const visibleRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = records.filter((record) => {
      if (isMarketplace && categoryFilter && record.category !== categoryFilter) return false;
      if (!query) return true;
      const haystacks = Object.entries(record)
        .flatMap(([key, value]) => {
          if (["id", "created_at", "updated_at", "read_at", "owner", "seller", "provider", "user"].includes(key)) return [];
          if (value === null || value === undefined || value === "") return [];
          if (typeof value === "object") return [JSON.stringify(value)];
          return [String(value)];
        });
      return haystacks.some((text) => text.toLowerCase().includes(query));
    });

    if (!isMarketplace) return filtered;

    return filtered.sort((first, second) => {
      if (sortOrder === "price-low") return Number(first.price) - Number(second.price);
      if (sortOrder === "price-high") return Number(second.price) - Number(first.price);
      return new Date(second.created_at || 0) - new Date(first.created_at || 0);
    });
  }, [categoryFilter, isMarketplace, records, searchQuery, sortOrder]);

  async function loadRecords() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(config.endpoint);
      setRecords(recordsFrom(data));
      setNextPage(Array.isArray(data) ? null : data?.next || null);
    } catch (requestError) {
      setError(getErrorMessage(requestError, `We couldn't load ${config.title.toLowerCase()}.`));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get(config.endpoint);
        if (active) {
          setRecords(recordsFrom(data));
          setNextPage(Array.isArray(data) ? null : data?.next || null);
        }
      } catch (requestError) {
        if (active) setError(getErrorMessage(requestError, `We couldn't load ${config.title.toLowerCase()}.`));
      } finally {
        if (active) setLoading(false);
      }

      const sourceResults = await Promise.all(referenceFields.map(async (field) => {
        try {
          const values = await loadAllRecords(field.source.endpoint);
          const available = values.filter((record) => (
            (!field.source.ownerOnly || record.provider === user?.id)
            && (!field.source.filter || field.source.filter(record))
          ));
          return [field.name, available, ""];
        } catch (requestError) {
          return [field.name, [], getErrorMessage(requestError, `Couldn't load options for ${field.label}.`)];
        }
      }));
      if (active) {
        setOptions(Object.fromEntries(sourceResults.map(([name, values]) => [name, values])));
        setOptionErrors(Object.fromEntries(sourceResults.filter(([, , message]) => message).map(([name, , message]) => [name, message])));
      }
    }
    load();
    return () => { active = false; };
  }, [config.endpoint, config.title, referenceFields, user?.id]);

  async function loadMore() {
    if (!nextPage || loadingMore) return;
    setLoadingMore(true);
    setError("");
    try {
      const { data } = await api.get(nextPage);
      setRecords((current) => [...current, ...recordsFrom(data)]);
      setNextPage(Array.isArray(data) ? null : data?.next || null);
    } catch (requestError) {
      setError(getErrorMessage(requestError, `We couldn't load more ${config.title.toLowerCase()}.`));
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    setNotice("");
    try {
      const payload = {};
      for (const field of config.fields || []) {
        const value = form[field.name];
        if (field.type === "boolean") {
          payload[field.name] = Boolean(value);
        } else if (field.type === "json") {
          if (value.trim()) payload[field.name] = JSON.parse(value);
          else if (editingId && field.required === false) payload[field.name] = {};
        } else if (field.type === "number") {
          if (value !== "") payload[field.name] = Number(value);
          else if (editingId && field.required === false) payload[field.name] = null;
        } else if (field.type === "id-list") {
          payload[field.name] = value.trim()
            ? value.split(",").map((item) => Number(item.trim())).filter(Number.isInteger)
            : [];
        } else if (value !== "" || editingId) {
          payload[field.name] = field.type === "reference"
            ? (value === "" ? null : Number(value))
            : value;
        }
      }
      if (editingId) await api.patch(`${config.endpoint}${editingId}/`, payload);
      else await api.post(config.endpoint, payload);
      setForm(initialValues(config.fields));
      setEditingId(null);
      setNotice(editingId ? `${config.title} record updated.` : `${config.title} saved.`);
      await loadRecords();
    } catch (requestError) {
      const message = requestError instanceof SyntaxError
        ? "Opening hours must be valid JSON."
        : getErrorMessage(requestError, `We couldn't save ${config.title.toLowerCase()}.`);
      setFormError(message);
    } finally {
      setSaving(false);
    }
  }

  function canManageRecord(record) {
    if (!config.manageOwnRecords && !config.manageBy) return false;
    if (config.manageOwnRecords) return true;
    return Number(record[config.manageBy]) === Number(user?.id);
  }

  function beginEdit(record) {
    const values = initialValues(config.fields);
    for (const field of config.fields || []) {
      const value = record[field.name];
      if (value === null || value === undefined) continue;
      if (field.type === "json") values[field.name] = JSON.stringify(value, null, 2);
      else if (field.type === "id-list") values[field.name] = Array.isArray(value) ? value.join(", ") : "";
      else if (field.type === "datetime-local") {
        const date = new Date(value);
        values[field.name] = Number.isNaN(date.valueOf())
          ? ""
          : new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      } else if (field.type === "date") values[field.name] = String(value).slice(0, 10);
      else values[field.name] = value;
    }
    setEditingId(record.id);
    setForm(values);
    setFormError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setForm(initialValues(config.fields));
    setEditingId(null);
    setFormError("");
  }

  async function deleteRecord(record) {
    const label = record.title || record.name || record.content || record.description || `${config.title} record`;
    if (!window.confirm(`Delete "${displayText(label)}"? This can't be undone.`)) return;
    setError("");
    setNotice("");
    try {
      await api.delete(`${config.endpoint}${record.id}/`);
      if (editingId === record.id) cancelEdit();
      setNotice(`${config.title} record deleted.`);
      await loadRecords();
    } catch (requestError) {
      setError(getErrorMessage(requestError, `We couldn't delete this ${config.title.toLowerCase()} record.`));
    }
  }

  function editListing(record) {
    setForm(Object.fromEntries(config.fields.map((field) => [field.name, record[field.name] ?? ""])));
    setEditingId(record.id);
    setFormError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteListing(record) {
    if (!window.confirm(`Remove “${record.title}” from the marketplace? This can't be undone.`)) return;
    setError("");
    setNotice("");
    try {
      await api.delete(`${config.endpoint}${record.id}/`);
      if (editingId === record.id) cancelEdit();
      setNotice("Listing removed.");
      await loadRecords();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "We couldn't remove this listing."));
    }
  }

  async function markRead(record) {
    try {
      await api.patch(`${config.endpoint}${record.id}/`, { read_at: new Date().toISOString() });
      setNotice("Notification marked as read.");
      await loadRecords();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "We couldn't update this notification."));
    }
  }

  function renderField(field) {
    const value = form[field.name] ?? "";
    const update = (nextValue) => setForm((current) => ({ ...current, [field.name]: nextValue }));
    const common = {
      id: `${config.endpoint}-${field.name}`,
      name: field.name,
      required: field.required !== false && field.type !== "boolean",
      value: field.type === "boolean" ? undefined : value,
      onChange: (event) => update(event.target.value),
    };

    if (field.type === "boolean") {
      return <label className="resource-checkbox" htmlFor={common.id} key={field.name}>
        <input id={common.id} type="checkbox" checked={Boolean(value)} onChange={(event) => update(event.target.checked)} />
        {field.label}
      </label>;
    }
    if (field.type === "reference") {
      const availableOptions = options[field.name] || [];
      if (!availableOptions.length) {
        return <label className="resource-field" htmlFor={common.id} key={field.name}>
          <span>{field.label} ID</span>
          <input {...common} type="number" min="1" step="1" />
          {optionErrors[field.name]
            ? <small className="resource-field-error">{optionErrors[field.name]}</small>
            : <small className="resource-field-hint">No records are available to select yet. Enter an existing record ID.</small>}
        </label>;
      }
      return <label className="resource-field" htmlFor={common.id} key={field.name}>
        <span>{field.label}</span>
        <select {...common}>
          <option value="">Choose a record</option>
          {availableOptions.map((record) => (
            <option key={record.id} value={record.id}>{referenceLabel(record, field.source.labelFields || [])}</option>
          ))}
        </select>
        {optionErrors[field.name] && <small className="resource-field-error">{optionErrors[field.name]}</small>}
      </label>;
    }
    if (field.type === "select") {
      return <label className="resource-field" htmlFor={common.id} key={field.name}>
        <span>{field.label}</span>
        <select {...common}>
          <option value="">Choose an option</option>
          {field.options.map(([optionValue, label]) => <option key={optionValue} value={optionValue}>{label}</option>)}
        </select>
      </label>;
    }
    if (field.type === "textarea" || field.type === "json") {
      return <label className="resource-field resource-field-wide" htmlFor={common.id} key={field.name}>
        <span>{field.label}</span>
        <textarea {...common} rows={field.type === "json" ? 3 : 4} />
        {field.hint && <small className="resource-field-hint">{field.hint}</small>}
      </label>;
    }
    if (field.type === "id-list") {
      return <label className="resource-field resource-field-wide" htmlFor={common.id} key={field.name}>
        <span>{field.label}</span><input {...common} type="text" inputMode="numeric" placeholder="e.g. 12, 18" />
      </label>;
    }
    return <label className="resource-field" htmlFor={common.id} key={field.name}>
      <span>{field.label}</span><input {...common} type={field.type} step={field.type === "number" ? "any" : undefined} />
    </label>;
  }

  return (
    <section className="resource-page">
      <header className="resource-heading">
        <div><div className="eyebrow">PAWVERSE MODULE</div><h1>{config.title}</h1><p>{config.description}</p></div>
        <button className="button button-light resource-refresh" type="button" onClick={loadRecords} disabled={loading}>
          <RefreshCw size={15} /> Refresh
        </button>
      </header>

      {error && <div className="form-alert" role="alert">{error}</div>}
      {notice && <div className="form-success" role="status">{notice}</div>}

      {config.create !== false && config.fields?.length > 0 && (
        <form className={`resource-form ${editingId ? "resource-form-editing" : ""}`} onSubmit={handleSubmit}>
          <h2>{editingId ? <><Pencil size={17} /> Update {config.title}</> : <><CirclePlus size={17} /> Add to {config.title}</>}</h2>
          {formError && <div className="form-alert" role="alert">{formError}</div>}
          <div className="resource-form-grid">{config.fields.map(renderField)}</div>
          <div className="resource-form-actions">
            {editingId && <button className="button button-light" type="button" onClick={cancelEdit}><X size={15} /> Cancel</button>}
            <button className="button button-dark" type="submit" disabled={saving}>
              <Send size={15} /> {saving ? "Saving..." : editingId ? "Update record" : "Save"}
            </button>
          </div>
        </form>
      )}

      <div className="resource-list-heading">
        <h2>Records <span className="crew-count">{visibleRecords.length}</span></h2>
      </div>
      <div className="marketplace-toolbar" role="search">
          <label className="marketplace-search">
            <Search size={17} aria-hidden="true" />
            <span className="sr-only">Search {config.title.toLowerCase()}</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={isMarketplace
                ? "Search products, categories..."
                : `Search ${config.title.toLowerCase()}...`}
            />
          </label>
          {isMarketplace && (
            <>
              <label className="marketplace-select">
                <span className="sr-only">Filter by category</span>
                <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                  <option value="">All categories</option>
                  {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </label>
              <label className="marketplace-select">
                <span className="sr-only">Sort listings</span>
                <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
                  <option value="newest">Newest first</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="price-high">Price: high to low</option>
                </select>
              </label>
            </>
          )}
      </div>
      {loading ? (
        <div className="resource-record-grid" aria-label={`Loading ${config.title.toLowerCase()}`}><div className="resource-skeleton" /><div className="resource-skeleton" /><div className="resource-skeleton" /></div>
      ) : visibleRecords.length === 0 && !error ? (
        <div className="empty-state">
          <div className="empty-state-icon"><CirclePlus size={21} /></div>
          <h3>{records.length ? `No ${config.title.toLowerCase()} match your search` : "No records yet"}</h3>
          <p>{records.length ? "Try another search or clear your search to see more." : "When records become available, they’ll appear here."}</p>
          {records.length > 0 && searchQuery && (
            <button className="text-button" type="button" onClick={() => {
              setSearchQuery("");
              setCategoryFilter("");
            }}>Clear search</button>
          )}
          {isMarketplace && records.length > 0 && categoryFilter && !searchQuery && (
            <button className="text-button" type="button" onClick={() => setCategoryFilter("")}>
              Clear filters
            </button>
          )}
        </div>
      ) : visibleRecords.length > 0 ? (
        <>
        {isMarketplace ? (
          <div className="marketplace-grid">
          {visibleRecords.map((record) => {
            const image = listingImageFor(record);
            const ownListing = Number(record.seller) === Number(user?.id);
            return (
            <article className="marketplace-card" key={record.id}>
              <Link className="marketplace-card-product-link" to={`/marketplace/${record.id}`} aria-label={`View ${displayText(record.title)}`}>
                <div className="marketplace-card-image-wrap">
                <PhotoWithFallback
                  src={image}
                  alt={image
                    ? `Illustration of ${record.title}`
                    : `Illustration placeholder for ${record.category || "pet product"}`}
                  fallbackLabel={`Illustration placeholder for ${record.category || "pet product"}`}
                  className="marketplace-card-image"
                />
                <span className="marketplace-photo-note">Product illustration</span>
                <span className="marketplace-category">{record.category}</span>
                </div>
              </Link>
              <div className="marketplace-card-body">
                <div className="marketplace-card-title"><h3><Link to={`/marketplace/${record.id}`}>{displayText(record.title)}</Link></h3></div>
                <p>{displayText(record.description)}</p>
                <div className="marketplace-card-actions">
                  <a
                    className="button button-light"
                    href={amazonSearchUrl(record)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on Amazon <ArrowRight size={15} />
                  </a>
                  {!ownListing && record.status === "active" && (
                    <Link className="button button-dark" to={`/marketplace-inquiries?listing=${record.id}`}>Ask about this item <ArrowRight size={15} /></Link>
                  )}
                  {(ownListing || record.status !== "active") && (
                    <span className="marketplace-status">{ownListing ? "Your listing" : record.status}</span>
                  )}
                  {ownListing && (
                    <div className="marketplace-owner-actions">
                      <button className="marketplace-edit" type="button" onClick={() => editListing(record)}>Edit</button>
                      <button className="marketplace-delete" type="button" onClick={() => deleteListing(record)}>Remove</button>
                    </div>
                  )}
                </div>
              </div>
            </article>
            );
          })}
          </div>
        ) : <div className="resource-record-grid">
          {visibleRecords.map((record) => (
            <article className="resource-record" key={record.id}>
              {(config.displayFields || Object.keys(record).filter((field) => field !== "id")).map((field) => (
                <div className="resource-record-row" key={field}>
                  <strong>{field === "opening_hours" ? "Opening hours" : field.replaceAll("_", " ")}</strong><span>{displayValue(record[field], field)}</span>
                </div>
              ))}
                {config.create !== false && canManageRecord(record) && (
                  <div className="resource-record-actions">
                    <button className="button button-light" type="button" onClick={() => beginEdit(record)}>
                      <Pencil size={14} /> Update
                    </button>
                    <button className="button button-danger-quiet" type="button" onClick={() => deleteRecord(record)}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                )}
                {config.endpoint === "/notifications/" && !record.read_at && (
                <button type="button" className="text-button" onClick={() => markRead(record)}>
                  Mark as read <ArrowRight size={14} />
                </button>
              )}
            </article>
          ))}
        </div>}
        {nextPage && <div className="load-more-wrap"><button className="button button-light" type="button" onClick={loadMore} disabled={loadingMore}>{loadingMore ? "Loading..." : "Load more records"}</button></div>}
        </>
      ) : null}
    </section>
  );
}
