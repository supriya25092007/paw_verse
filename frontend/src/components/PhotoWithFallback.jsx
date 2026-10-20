import { useEffect, useState } from "react";

export default function PhotoWithFallback({
  src,
  alt,
  fallbackLabel = "A happy pet",
  className = "",
  eager = false,
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => { setFailed(false); }, [src]);

  if (failed || !src) {
    return (
      <div className={`photo-fallback ${className}`} role="img" aria-label={fallbackLabel}>
        <span aria-hidden="true">🐾</span>
      </div>
    );
  }

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      fetchpriority={eager ? "high" : "auto"}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
