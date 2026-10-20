import { ArrowLeft, Check, Heart, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, getErrorMessage } from "../api/client";
import ImageUploadField from "../components/ImageUploadField";

const blankPet = {
  name: "",
  species: "dog",
  breed: "",
  sex: "unknown",
  date_of_birth: "",
  weight_kg: "",
  color: "",
  microchip_number: "",
  notes: "",
};

const speciesOptions = [
  ["dog", "Dog", "🐕"],
  ["cat", "Cat", "🐈"],
  ["bird", "Bird", "🦜"],
  ["small_mammal", "Small mammal", "🐇"],
  ["reptile", "Reptile", "🦎"],
  ["other", "Other", "🐾"],
];

export default function PetFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(blankPet);
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [petPhoto, setPetPhoto] = useState(null);
  const [existingPhoto, setExistingPhoto] = useState("");
  const [removePhoto, setRemovePhoto] = useState(false);

  useEffect(() => {
    if (!isEditing) return undefined;
    let active = true;
    api.get(`/pets/${id}/`)
      .then(({ data }) => {
        if (active) {
          setForm({ ...blankPet, ...data });
          setExistingPhoto(data.photo || "");
        }
      })
      .catch((requestError) => { if (active) setError(getErrorMessage(requestError, "We couldn't find that pet profile.")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, isEditing]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const petDetails = {
      ...form,
      date_of_birth: form.date_of_birth || null,
      weight_kg: form.weight_kg || null,
      microchip_number: form.microchip_number.trim() || null,
    };
    delete petDetails.photo;
    const payload = petPhoto
      ? new FormData()
      : removePhoto
        ? { ...petDetails, photo: null }
        : petDetails;
    if (petPhoto) {
      Object.entries(petDetails).forEach(([key, value]) => {
        if (value !== null && value !== undefined) payload.append(key, value);
      });
      payload.append("photo", petPhoto);
    }
    try {
      const { data } = isEditing
        ? await api.patch(`/pets/${id}/`, payload)
        : await api.post("/pets/", payload);
      if (data.photo) setExistingPhoto(data.photo);
      setPetPhoto(null);
      setRemovePhoto(false);
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(getErrorMessage(requestError, "We couldn't save this profile. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Remove ${form.name || "this pet"} from your PawVerse account? This can't be undone.`)) return;
    setSubmitting(true);
    try {
      await api.delete(`/pets/${id}/`);
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(getErrorMessage(requestError, "We couldn't remove this profile. Please try again."));
      setSubmitting(false);
    }
  }

  if (loading) return <div className="page-loading">Finding your pet's profile...</div>;

  return (
    <div className="pet-form-page">
      <Link to="/dashboard" className="back-link"><ArrowLeft size={16} /> Back to your crew</Link>
      <div className="form-page-heading">
        <span className="eyebrow"><Heart size={14} /> {isEditing ? "A LITTLE UPDATE" : "A NEW LITTLE FRIEND"}</span>
        <h1>{isEditing ? <>A little more about <span>{form.name || "your friend"}.</span></> : <>Let's meet your <span>best friend.</span></>}</h1>
        <p>{isEditing ? "Keep their profile just the way they are — up to date." : "The basics are lovely. You can fill in the rest whenever you like."}</p>
      </div>
      {error && <div className="form-alert" role="alert">{error}</div>}
      <form className="pet-form" onSubmit={handleSubmit}>
        <section className="form-section">
          <div className="form-section-title"><span>01</span><div><h2>The introductions</h2><p>Every good story starts with a name.</p></div></div>
          <div className="form-fields">
            <label className="field-full">Their name <span className="required-mark">*</span><input maxLength={100} value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="What do you call them?" required /></label>
            <div className="field-full">
              <ImageUploadField
                id="pet-photo"
                label="Their photo"
                src={petPhoto || (!removePhoto ? existingPhoto : "")}
                onSelect={(file) => { setPetPhoto(file); setRemovePhoto(false); }}
                onRemove={() => { setPetPhoto(null); setRemovePhoto(true); }}
              />
            </div>
            <div className="field-full"><span className="field-label">They are a...</span><div className="species-grid">
              {speciesOptions.map(([value, label, emoji]) => (
                <button type="button" className={`species-option ${form.species === value ? "species-selected" : ""}`} key={value} onClick={() => update("species", value)} aria-pressed={form.species === value}>
                  <span>{emoji}</span>{label}
                </button>
              ))}
            </div></div>
            <label>Breed <span className="optional-label">OPTIONAL</span><input maxLength={100} value={form.breed || ""} onChange={(event) => update("breed", event.target.value)} placeholder="e.g. Golden retriever" /></label>
            <label>Sex <select value={form.sex || "unknown"} onChange={(event) => update("sex", event.target.value)}><option value="unknown">Rather not say</option><option value="female">Female</option><option value="male">Male</option></select></label>
          </div>
        </section>

        <section className="form-section">
          <div className="form-section-title"><span>02</span><div><h2>The little details</h2><p>Just the things that make them, them.</p></div></div>
          <div className="form-fields">
            <label>Date of birth <span className="optional-label">OPTIONAL</span><input type="date" max={new Date().toISOString().slice(0, 10)} value={form.date_of_birth || ""} onChange={(event) => update("date_of_birth", event.target.value)} /></label>
            <label>Weight <span className="optional-label">OPTIONAL</span><div className="input-with-unit"><input type="number" min="0.01" step="0.01" value={form.weight_kg || ""} onChange={(event) => update("weight_kg", event.target.value)} placeholder="0.0" /><span>kg</span></div></label>
            <label>Coat / color <span className="optional-label">OPTIONAL</span><input maxLength={100} value={form.color || ""} onChange={(event) => update("color", event.target.value)} placeholder="e.g. Golden, tabby, speckled..." /></label>
            <label>Microchip number <span className="optional-label">OPTIONAL</span><input maxLength={64} value={form.microchip_number || ""} onChange={(event) => update("microchip_number", event.target.value)} placeholder="If they have one" /></label>
            <label className="field-full">A little note about them <span className="optional-label">OPTIONAL</span><textarea rows={4} value={form.notes || ""} onChange={(event) => update("notes", event.target.value)} placeholder="Their favorite sunny spot, a funny little habit, anything you'd like to remember..." /></label>
          </div>
        </section>

        <div className="form-actions">
          <Link to="/dashboard" className="button button-light">Maybe later</Link>
          <div>
            {isEditing && <button type="button" className="button button-danger-quiet" onClick={handleDelete} disabled={submitting}><Trash2 size={15} /> Remove profile</button>}
            <button className="button button-dark" disabled={submitting}>{submitting ? "Saving..." : isEditing ? "Save their profile" : "Save their little profile"} <Check size={16} /></button>
          </div>
        </div>
      </form>
    </div>
  );
}
