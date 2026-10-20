import {
  ChevronDown,
  CircleHelp,
  House,
  LogOut,
  Menu,
  Moon,
  PawPrint,
  Plus,
  Settings2,
  Sun,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { modules } from "../modules";

const moduleGroups = modules.reduce((groups, module) => {
  const group = groups.find((item) => item.label === module.group);
  if (group) group.items.push(module);
  else groups.push({ label: module.group, items: [module] });
  return groups;
}, []);

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("pawverse.theme") === "dark");
  const navigate = useNavigate();
  const location = useLocation();
  const currentModule = modules.find(
    (module) => location.pathname === module.path || location.pathname.startsWith(`${module.path}/`),
  );
  const breadcrumb = currentModule?.label || (location.pathname.startsWith("/account") ? "Account settings" : "PawVerse home");
  const initials = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .map((name) => name[0])
    .join("")
    .toUpperCase() || user?.email?.[0]?.toUpperCase() || "P";

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    localStorage.setItem("pawverse.theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <Link className="brand" to="/dashboard" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark"><PawPrint size={21} fill="currentColor" /></span>
          <span>PawVerse<span className="brand-period">.</span></span>
        </Link>
        <nav className="side-nav" aria-label="Main navigation">
          <div className="sidebar-group">
            <div className="sidebar-label">YOUR SPACE</div>
            <NavLink to="/dashboard" onClick={() => setMenuOpen(false)}>
              <House size={18} /> Overview
            </NavLink>
          </div>
          {moduleGroups.map((group) => (
            <div className="sidebar-group" key={group.label}>
              <div className="sidebar-label">{group.label}</div>
              {group.items.map(({ path, label, icon: Icon }) => (
                <NavLink key={path} to={path} onClick={() => setMenuOpen(false)}>
                  <Icon size={18} /> {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-note">
          <div className="note-icon"><CircleHelp size={17} /></div>
          <strong>A little space for every paw</strong>
          <p>Explore pet care, services, community, and more, all in one place.</p>
        </div>
        <div className="sidebar-bottom">
          <Link className="sidebar-account" to="/account" onClick={() => setMenuOpen(false)}>
            {user?.profile_photo
              ? <img className="avatar avatar-small avatar-photo" src={user.profile_photo} alt="" />
              : <span className="avatar avatar-small">{initials}</span>}
            <span className="account-copy">
              <strong>{user?.first_name || "Pet parent"}</strong>
              <small>Account settings</small>
            </span>
            <Settings2 size={17} />
          </Link>
          <button className="signout-link" onClick={handleSignOut}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {menuOpen && <button className="mobile-overlay" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}
      <main className="workspace">
        <header className="topbar">
          <button className="icon-button menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Close menu" : "Open menu"}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="breadcrumb">Your space <ChevronDown size={14} className="breadcrumb-chevron" /> <span>{breadcrumb}</span></div>
          <div className="topbar-actions">
            <button
              className="button button-light theme-toggle"
              type="button"
              onClick={() => setDarkMode((current) => !current)}
              aria-label={`Switch to ${darkMode ? "light" : "dark"} mode`}
              aria-pressed={darkMode}
              title={`Switch to ${darkMode ? "light" : "dark"} mode`}
            >
              {darkMode ? <Sun size={17} /> : <Moon size={17} />}
              <span>{darkMode ? "Light mode" : "Dark mode"}</span>
            </button>
            <Link to="/pets/new" className="button button-dark button-compact"><Plus size={16} /> Add a pet</Link>
            <Link to="/account" className="avatar top-avatar" aria-label="Account settings">
              {user?.profile_photo
                ? <img className="avatar-photo" src={user.profile_photo} alt="" />
                : initials}
            </Link>
          </div>
        </header>
        <div className="workspace-content"><Outlet /></div>
      </main>
    </div>
  );
}
