import { useEffect, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";

export default function ImageUploadField({
  id,
  label,
  src,
  onSelect,
  onRemove,
  hint = "Choose a JPG, PNG, or WebP image (up to 5 MB).",
}) {
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (!src || typeof src === "string") {
      setPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(src);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [src]);

  const imageUrl = previewUrl || (typeof src === "string" ? src : "");

  return (
    <div className="image-upload-field">
      <div className="image-upload-preview">
        {imageUrl
          ? <img src={imageUrl} alt={`${label} preview`} />
          : <ImagePlus size={27} aria-hidden="true" />}
      </div>
      <div className="image-upload-copy">
        <span className="field-label">{label}</span>
        <span className="field-hint">{hint}</span>
        <div className="image-upload-actions">
          <input
            id={id}
            className="image-upload-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-label={`${label}: choose an image`}
            onChange={(event) => {
              onSelect(event.target.files?.[0] || null);
              event.target.value = "";
            }}
          />
          <label className="button button-light image-upload-button" htmlFor={id}>
            <ImagePlus size={15} /> {imageUrl ? "Change photo" : "Choose photo"}
          </label>
          {imageUrl && (
            <button className="button button-danger-quiet image-remove-button" type="button" onClick={onRemove}>
              <Trash2 size={14} /> Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
