import { ArrowLeft, ArrowRight, PawPrint } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";

function AuthFrame({ children }) {
  return (
    <main className="auth-page">
      <section className="auth-visual">
        <Link className="brand brand-light" to="/"><span className="brand-mark"><PawPrint size={21} fill="currentColor" /></span><span>PawVerse<span className="brand-period">.</span></span></Link>
        <div className="auth-visual-copy">
          <span className="auth-kicker">A softer spot for the ones you love</span>
          <h2>More nose boops.<br />Less to keep track of.</h2>
          <p>Your pet's little corner of the universe is waiting.</p>
        </div>
        <div className="auth-pet-art"><div className="auth-art-sun" /><span>🐕</span><i>✿</i></div>
        <div className="auth-visual-footer"><span>Made for pet people, always.</span><span>01 — 03</span></div>
      </section>
      <section className="auth-content">
        <Link to="/" className="auth-back"><ArrowLeft size={15} /> Back to home</Link>
        {children}
        <div className="auth-legal">By continuing, you agree to be kind to pets and the people who love them. ♡</div>
      </section>
    </main>
  );
}

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const registrationComplete = Boolean(location.state?.registered);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      const destination = location.state?.from;
      navigate(
        destination
          ? `${destination.pathname}${destination.search || ""}${destination.hash || ""}`
          : "/dashboard",
        { replace: true },
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError, "We couldn't sign you in. Check your details and try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthFrame>
      <div className="auth-form-wrap">
        <span className="eyebrow"><span className="eyebrow-dot" /> GOOD TO HAVE YOU BACK</span>
        <h1>Welcome home.</h1>
        <p className="auth-subtitle">Your favorite little faces missed you.</p>
        {registrationComplete && <div className="form-success" role="status">Your account is ready. Log in and make a space for your pet. ♡</div>}
        {error && <div className="form-alert" role="alert">{error}</div>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>Email address<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></label>
          <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" required /></label>
          <button className="button button-dark auth-submit" disabled={submitting}>{submitting ? "Finding your space..." : "Log in to PawVerse"} <ArrowRight size={16} /></button>
        </form>
        <p className="auth-switch">New around here? <Link to="/register">Create your free account</Link></p>
      </div>
    </AuthFrame>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(form);
      navigate("/login", { replace: true, state: { registered: true } });
    } catch (requestError) {
      setError(getErrorMessage(requestError, "We couldn't create your account. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthFrame>
      <div className="auth-form-wrap">
        <span className="eyebrow"><span className="eyebrow-dot" /> YOUR LITTLE CORNER STARTS HERE</span>
        <h1>Come on in.</h1>
        <p className="auth-subtitle">Make a space for the best part of your day.</p>
        {error && <div className="form-alert" role="alert">{error}</div>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-row">
            <label>First name<input autoComplete="given-name" value={form.first_name} onChange={(event) => update("first_name", event.target.value)} placeholder="Jamie" /></label>
            <label>Last name<input autoComplete="family-name" value={form.last_name} onChange={(event) => update("last_name", event.target.value)} placeholder="Parker" /></label>
          </div>
          <label>Email address<input type="email" autoComplete="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="you@example.com" required /></label>
          <label>Password<input type="password" autoComplete="new-password" value={form.password} onChange={(event) => update("password", event.target.value)} placeholder="At least 8 characters" minLength={8} required /></label>
          <button className="button button-dark auth-submit" disabled={submitting}>{submitting ? "Making your space..." : "Create my free account"} <ArrowRight size={16} /></button>
        </form>
        <p className="auth-switch">Already one of us? <Link to="/login">Log in instead</Link></p>
      </div>
    </AuthFrame>
  );
}
