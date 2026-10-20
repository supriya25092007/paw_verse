import { useEffect, useMemo, useState } from "react";
import { ChevronDown, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { api, getErrorMessage } from "../api/client";

function recordsFrom(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

const roleDefinitions = [
  {
    name: "Pet owner",
    code: "pet-owner",
    description: "A person caring for one or more pets.",
  },
  {
    name: "Veterinarian",
    code: "veterinarian",
    description: "A veterinary professional who provides animal healthcare.",
  },
  {
    name: "Clinic staff",
    code: "clinic-staff",
    description: "A member of a veterinary clinic team.",
  },
  {
    name: "Shelter staff",
    code: "shelter-staff",
    description: "A member of an animal shelter team.",
  },
  {
    name: "Service provider",
    code: "service-provider",
    description: "A provider of pet-care services.",
  },
  {
    name: "Adoption coordinator",
    code: "adoption-coordinator",
    description: "Helps pets find suitable homes and supports adopters.",
  },
  {
    name: "Foster caregiver",
    code: "foster-caregiver",
    description: "Provides temporary care and a safe home for pets.",
  },
  {
    name: "Pet sitter",
    code: "pet-sitter",
    description: "Cares for pets while their families are away.",
  },
  {
    name: "Groomer",
    code: "groomer",
    description: "Provides grooming and coat-care services for pets.",
  },
  {
    name: "Pet trainer",
    code: "pet-trainer",
    description: "Helps pets and their families build positive behaviors.",
  },
  {
    name: "Rescue volunteer",
    code: "rescue-volunteer",
    description: "Supports animal rescue and community pet-safety efforts.",
  },
  {
    name: "Animal welfare advocate",
    code: "animal-welfare-advocate",
    description: "Promotes responsible care and well-being for animals.",
  },
  {
    name: "Pet nutrition advisor",
    code: "pet-nutrition-advisor",
    description: "Helps families make informed choices about pet nutrition.",
  },
  {
    name: "Community moderator",
    code: "community-moderator",
    description: "Helps keep the PawVerse community welcoming and helpful.",
  },
];

const roleDetails = {
  "pet-owner": "Manage pet profiles and keep track of their care, appointments, and community activity.",
  veterinarian: "Provide animal-health guidance and care, and maintain relevant professional information.",
  "clinic-staff": "Support clinic operations and help coordinate care for the clinic's patients.",
  "shelter-staff": "Help care for animals at a shelter and support their adoption and wellbeing.",
  "service-provider": "Offer pet-care services and communicate with the families who use them.",
  "adoption-coordinator": "Coordinate adoption enquiries, support prospective adopters, and help match pets with suitable homes.",
  "foster-caregiver": "Provide temporary, safe care for pets while they await a permanent home.",
  "pet-sitter": "Provide day-to-day care for pets when their families are away.",
  groomer: "Provide grooming and coat-care services suited to each pet.",
  "pet-trainer": "Help pets and their families build positive behaviors through training.",
  "rescue-volunteer": "Assist with animal rescue efforts and practical community support.",
  "animal-welfare-advocate": "Promote responsible animal care and community awareness.",
  "pet-nutrition-advisor": "Help families understand pet nutrition and make informed food choices.",
  "community-moderator": "Help maintain a welcoming, respectful, and helpful community.",
};

function isSampleRole(record) {
  const name = String(record?.name ?? "").trim();
  const code = String(record?.code ?? "").trim();
  const description = String(record?.description ?? "").trim();

  return (
    name.toLowerCase().startsWith("sample role")
    || code.toLowerCase().startsWith("sample-role")
    || description.toLowerCase().includes("pawverse demo role")
  );
}

function displayRole(role) {
  if (isSampleRole(role)) return null;

  const normalizedCode = role.code?.toLowerCase().replaceAll("_", "-");
  const knownRole = roleDefinitions.find(
    (definition) => definition.code === normalizedCode
      || definition.name.toLowerCase() === role.name?.toLowerCase(),
  );
  if (knownRole) return { ...knownRole, id: role.id };

  const sampleMatch = role.name?.trim().match(/^(?:sample\s+)?role[\s_-]*(\d+)$/i);
  const sampleIndex = sampleMatch ? Number(sampleMatch[1]) - 1 : -1;
  const sampleRole = roleDefinitions[sampleIndex];
  if (sampleRole) return { ...sampleRole, id: role.id };

  return role;
}

function roleKey(role) {
  return String(role.name || role.code || role.id)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function loadAllRecords(endpoint) {
  let url = endpoint;
  const results = [];
  while (url) {
    const { data } = await api.get(url);
    results.push(...recordsFrom(data));
    url = Array.isArray(data) ? null : data?.next || null;
  }
  return results;
}

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedRole, setExpandedRole] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const uniqueRoles = [];
  const seenRoles = new Set();
  for (const record of roles) {
    const role = displayRole(record);
    if (!role) continue;
    const key = roleKey(role);
    if (seenRoles.has(key)) continue;
    seenRoles.add(key);
    uniqueRoles.push({ ...role, key });
  }
  const visibleRoles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return uniqueRoles;
    return uniqueRoles.filter((role) => (
      [role.name, role.code, role.description, roleDetails[role.code]]
        .some((value) => String(value || "").toLowerCase().includes(query))
    ));
  }, [roles, searchQuery]);

  async function loadRoles() {
    setLoading(true);
    setError("");
    try {
      setRoles(await loadAllRecords("/roles/"));
    } catch (requestError) {
      setError(getErrorMessage(requestError, "We couldn't load role definitions."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadRoles(); }, []);

  return (
    <section className="resource-page roles-page">
      <header className="resource-heading">
        <div>
          <div className="eyebrow"><ShieldCheck size={14} /> PAWVERSE COMMUNITY</div>
          <h1>Roles &amp; permissions</h1>
          <p>Learn how different roles support the PawVerse community.</p>
        </div>
        <button className="button button-light resource-refresh" type="button" onClick={loadRoles} disabled={loading}>
          <RefreshCw size={15} /> Refresh
        </button>
      </header>
      <div className="roles-readonly-note" role="note">
        Role definitions are informational and read-only. Account permissions are managed securely by PawVerse.
      </div>
      {error && <div className="form-alert" role="alert">{error}</div>}
      {!loading && uniqueRoles.length > 0 && (
        <div className="marketplace-toolbar" role="search">
          <label className="marketplace-search">
            <Search size={17} aria-hidden="true" />
            <span className="sr-only">Search roles</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search roles and descriptions..."
            />
          </label>
        </div>
      )}
      {loading ? (
        <div className="resource-record-grid" aria-label="Loading roles">
          <div className="resource-skeleton" /><div className="resource-skeleton" /><div className="resource-skeleton" />
        </div>
      ) : visibleRoles.length ? (
        <div className="roles-grid">
          {visibleRoles.map((role, index) => {
            const isExpanded = expandedRole === role.key;
            return (
              <article className={`role-card role-card-${index % 4}`} key={role.key}>
                <div className="role-card-icon"><ShieldCheck size={19} /></div>
                <h2>{role.name}</h2>
                <p>{role.description || "A PawVerse community role."}</p>
                <button
                  className="role-card-toggle"
                  type="button"
                  aria-expanded={isExpanded}
                  onClick={() => setExpandedRole(isExpanded ? "" : role.key)}
                >
                  {isExpanded ? "Hide details" : "View role details"}
                  <ChevronDown size={15} aria-hidden="true" />
                </button>
                {isExpanded && (
                  <div className="role-card-details">
                    <strong>Role overview</strong>
                    <p>{roleDetails[role.code] || role.description || "This role supports the PawVerse community."}</p>
                    {role.code && <span className="role-card-code">Role code: {role.code}</span>}
                    <small>Role descriptions are informational. Account permissions are managed separately by PawVerse.</small>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : !error && uniqueRoles.length ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Search size={21} /></div>
          <h3>No matching roles</h3>
          <p>Try another role name or description.</p>
          <button className="text-button" type="button" onClick={() => setSearchQuery("")}>Clear search</button>
        </div>
      ) : !error ? (
        <div className="empty-state">
          <div className="empty-state-icon"><ShieldCheck size={21} /></div>
          <h3>No role definitions available</h3>
          <p>Role descriptions will appear here when configured.</p>
        </div>
      ) : null}
    </section>
  );
}
