import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ExternalLink, ShieldCheck, ShoppingBag } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { api, getErrorMessage } from "../api/client";
import PhotoWithFallback from "../components/PhotoWithFallback";
import { useAuth } from "../context/AuthContext";
import { amazonSearchUrl, listingImageFor } from "./marketplaceUtils";

function displayText(value) {
  return String(value || "").replace(/\[PawVerse demo\]\s*/gi, "").trim();
}

export default function MarketplaceProductPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadProduct() {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get(`/listings/${id}/`);
        if (active) setProduct(data);
      } catch (requestError) {
        if (active) {
          setProduct(null);
          setError(getErrorMessage(requestError, "We couldn't load this product."));
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    loadProduct();
    return () => { active = false; };
  }, [id]);

  const ownListing = product && Number(product.seller) === Number(user?.id);
  const canAskSeller = product?.status === "active" && !ownListing;

  return (
    <section className="resource-page marketplace-product-page">
      <Link className="marketplace-back-link" to="/marketplace"><ArrowLeft size={16} /> Back to marketplace</Link>
      {loading ? (
        <div className="marketplace-product-loading" aria-label="Loading product">
          <div className="resource-skeleton" />
          <div className="resource-skeleton" />
        </div>
      ) : error ? (
        <div className="form-alert" role="alert">{error}</div>
      ) : product ? (
        <article className="marketplace-product">
          <div className="marketplace-product-image">
            <PhotoWithFallback
              src={listingImageFor(product)}
              alt={`Illustration of ${displayText(product.title)}`}
              fallbackLabel={`Illustration placeholder for ${product.category || "pet product"}`}
              className="marketplace-product-photo"
            />
            <span className="marketplace-category">{product.category}</span>
          </div>
          <div className="marketplace-product-info">
            <span className="marketplace-product-eyebrow"><ShoppingBag size={14} /> PAWVERSE MARKETPLACE</span>
            <span className="marketplace-product-category">{product.category}</span>
            <h1>{displayText(product.title)}</h1>
            <a
              className="button button-dark marketplace-product-cta"
              href={amazonSearchUrl(product)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Find this item on Amazon <ExternalLink size={16} />
            </a>
            <div className="marketplace-product-divider" />
            <h2>About this product</h2>
            <p className="marketplace-product-description">{displayText(product.description) || "No additional product information was provided."}</p>
            <div className="marketplace-product-trust">
              <ShieldCheck size={18} />
              <span>Connect directly with the PawVerse community seller to ask questions before arranging a purchase.</span>
            </div>
            {canAskSeller ? (
              <Link className="button button-light marketplace-product-cta" to={`/marketplace-inquiries?listing=${product.id}`}>
                Ask the seller about this item <ArrowRight size={16} />
              </Link>
            ) : (
              <div className="marketplace-product-status" role="status">
                {ownListing
                  ? "This is your listing."
                  : <><CheckCircle2 size={16} /> Listing status: {product.status}</>}
              </div>
            )}
            <p className="marketplace-product-note">Product listing only. Payment and delivery arrangements are handled with the seller.</p>
          </div>
        </article>
      ) : null}
    </section>
  );
}
