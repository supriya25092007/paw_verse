import { ArrowLeft, Check, LogOut, UserRound } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, getErrorMessage } from "../api/client";
import ImageUploadField from "../components/ImageUploadField";
import { useAuth } from "../context/AuthContext";

export default function AccountPage() {
  const { user, setUser, signOut } = useAuth();
  const [form, setForm] = useState({ first_name: user?.first_name || "", last_name: user?.last_name || "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      let payload = form;
      if (profilePhoto) {
        payload = new FormData();
        Object.entries(form).forEach(([key, value]) => payload.append(key, value));
        payload.append("profile_photo", profilePhoto);
      } else if (removePhoto) {
        payload = { ...form, profile_photo: null };
      }
      const { data } = await api.patch("/auth/me/", payload);
      setUser(data);
      setForm({ first_name: data.first_name || "", last_name: data.last_name || "" });
      setProfilePhoto(null);
      setRemovePhoto(false);
      setMessage("Your details are all up to date.");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "We couldn't update your details."));
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <div className="account-page">
      <Link to="/dashboard" className="back-link"><ArrowLeft size={16} /> Back to your crew</Link>
      <div className="form-page-heading"><span className="eyebrow"><UserRound size={14} /> YOUR CORNER</span><h1>A few things <span>about you.</span></h1><p>It’s nice to know the human behind all those paws.</p></div>
      <form className="account-card" onSubmit={handleSubmit}>
        <div className="account-card-top"><div className="account-icon"><UserRound size={20} /></div><div><h2>Your details</h2><p>Just the basics, kept nice and simple.</p></div></div>
        {error && <div className="form-alert" role="alert">{error}</div>}
        {message && <div className="form-success" role="status"><Check size={16} /> {message}</div>}
        <div className="form-fields">
          <div className="field-full">
            <ImageUploadField
              id="account-profile-photo"
              label="Profile photo"
              src={profilePhoto || (!removePhoto ? user?.profile_photo : "")}
              onSelect={(file) => { setProfilePhoto(file); setRemovePhoto(false); }}
              onRemove={() => { setProfilePhoto(null); setRemovePhoto(true); }}
            />
          </div>
          <label>First name<input autoComplete="given-name" value={form.first_name} onChange={(event) => setForm((current) => ({ ...current, first_name: event.target.value }))} /></label>
          <label>Last name<input autoComplete="family-name" value={form.last_name} onChange={(event) => setForm((current) => ({ ...current, last_name: event.target.value }))} /></label>
          <label className="field-full">Email address<input type="email" value={user?.email || ""} disabled /><span className="field-hint">Your email is the sign-in for your account.</span></label>
        </div>
        <div className="form-actions"><span className="account-role">Pet parent account</span><button className="button button-dark" disabled={saving}>{saving ? "Saving..." : "Save changes"} <Check size={16} /></button></div>
      </form>
      <button className="signout-mobile" onClick={handleSignOut}><LogOut size={16} /> Sign out of PawVerse</button>
    </div>
  );
}
