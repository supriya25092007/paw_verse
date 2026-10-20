import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Heart,
  HeartPulse,
  PawPrint,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PhotoWithFallback from "../components/PhotoWithFallback";
import ScrollReveal from "../components/ScrollReveal";

const petPhotos = [
  {
    name: "Dogs",
    copy: "Big hearts, muddy paws, endless joy.",
    image: "photo-1552053831-71594a27632d",
    alt: "Golden retriever enjoying a sunny day",
    tint: "peach",
  },
  {
    name: "Cats",
    copy: "Independent spirits, professional snugglers.",
    image: "photo-1514888286974-6c03e2ca1dba",
    alt: "Curious cat looking toward the camera",
    tint: "sage",
  },
  {
    name: "Small friends",
    copy: "Tiny companions with very big personalities.",
    image: "photo-1585110396000-c9ffd4e4b308",
    alt: "A small rabbit resting among soft greenery",
    tint: "peach",
  },
];

const services = [
  {
    icon: Stethoscope,
    title: "Find veterinary care",
    copy: "Keep clinic details close and book visits for the pets in your care.",
    link: "/clinics",
    label: "Explore clinics",
  },
  {
    icon: HeartPulse,
    title: "Stay on top of health",
    copy: "Bring vaccinations, care notes, and reminders together in one place.",
    link: "/health-passport",
    label: "See health tools",
  },
  {
    icon: CalendarDays,
    title: "Make time for their care",
    copy: "Create and review veterinary appointments for your pet family.",
    link: "/appointments",
    label: "View appointments",
  },
];

const dogHero = "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=1200&q=85";

function LandingFooter() {
  return (
    <footer className="landing-footer">
      <Link className="brand" to="/">
        <span className="brand-mark"><PawPrint size={17} fill="currentColor" /></span>
        <span>PawVerse<span className="brand-period">.</span></span>
      </Link>
      <span>A little more love, every day.</span>
      <span>Made for the ones with paws &amp; whiskers <span aria-hidden="true">♡</span></span>
    </footer>
  );
}

export default function HomePage() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  function searchMarketplace(event) {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/marketplace?search=${encodeURIComponent(query)}` : "/marketplace");
  }

  return (
    <div className="landing">
      <header className="landing-nav">
        <Link className="brand" to="/" aria-label="PawVerse home">
          <span className="brand-mark"><PawPrint size={21} fill="currentColor" /></span>
          <span>PawVerse<span className="brand-period">.</span></span>
        </Link>
        <nav aria-label="Main navigation" className="landing-links">
          <a href="#discover">Discover</a>
          <a href="#care">Pet care</a>
          <Link to="/marketplace">Marketplace</Link>
        </nav>
        <div className="landing-actions">
          <Link className="text-link" to="/login">Log in</Link>
          <Link className="button button-dark button-compact" to="/register">
            Join PawVerse <ArrowRight size={15} />
          </Link>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> A HAPPIER HOME FOR EVERY PAW</div>
            <h1>Good days start<br />with <span className="headline-highlight">four paws.</span></h1>
            <p className="hero-description">
              Meet your new favorite corner of the internet for pet care, community,
              and all the little things that make life together special.
            </p>
            <form className="hero-search" onSubmit={searchMarketplace} role="search">
              <Search size={19} aria-hidden="true" />
              <label className="sr-only" htmlFor="home-search">Search marketplace listings</label>
              <input
                id="home-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Try treats, toys, essentials..."
              />
              <button className="button button-dark" type="submit">Search</button>
            </form>
            <div className="hero-actions">
              <Link to="/register" className="button button-dark">Find your new best friend <ArrowRight size={17} /></Link>
              <a href="#discover" className="button button-light">Explore <ArrowDown size={16} /></a>
            </div>
            <div className="hero-proof">
              <div className="proof-avatars" aria-hidden="true"><span>🐶</span><span>🐱</span><span>🐰</span></div>
              <div><strong>For every kind of pet person</strong><small>Care, connection, and community in one place.</small></div>
            </div>
          </div>
          <div className="hero-art-wrap">
            <div className="hero-photo-frame">
              <PhotoWithFallback
                src={dogHero}
                alt="Happy dog enjoying a moment outdoors"
                fallbackLabel="A happy dog"
                className="hero-photo"
                eager
              />
              <span className="hero-photo-wash" aria-hidden="true" />
              <div className="floating-note note-top"><Sparkles size={15} /> Every day, a little brighter</div>
              <div className="floating-note note-bottom"><Heart size={15} fill="currentColor" /> made for the love they give</div>
            </div>
            <div className="hero-caption"><span className="caption-line" /> For the very best kind of company.</div>
            <span className="hero-paw hero-paw-one" aria-hidden="true">✳</span>
            <span className="hero-paw hero-paw-two" aria-hidden="true">✦</span>
          </div>
          <span className="hero-background-spark spark-left" aria-hidden="true">✳</span>
          <span className="hero-background-spark spark-right" aria-hidden="true">✦</span>
        </section>

        <section className="landing-marquee" aria-label="PawVerse values">
          <span>MORE NOSE BOOPS</span><i>✳</i><span>LESS TO KEEP TRACK OF</span>
          <i>✳</i><span>ALL THE LITTLE THINGS</span><i>✳</i><span>MORE TAIL WAGS</span>
        </section>

        <ScrollReveal>
          <section className="landing-discover section-wrap" id="discover">
            <div className="section-heading">
              <div>
                <div className="eyebrow"><PawPrint size={14} /> FIND YOUR KIND OF COMPANY</div>
                <h2>Big love comes in<br /><span>all shapes &amp; sizes.</span></h2>
              </div>
              <p>Browse adoption listings shared by the PawVerse community and find the next little friend to make your house a home.</p>
            </div>
            <div className="discover-grid">
              {petPhotos.map((pet, index) => (
                <Link className={`discover-card discover-card-${pet.tint}`} to="/adoption-listings" key={pet.name}>
                  <div className="discover-image-wrap">
                    <PhotoWithFallback
                      src={`https://images.unsplash.com/${pet.image}?auto=format&fit=crop&w=760&q=80`}
                      alt={pet.alt}
                      fallbackLabel={pet.alt}
                      className="discover-image"
                    />
                    <span className="discover-count">0{index + 1}</span>
                    <span className="discover-arrow"><ArrowUpRight size={18} /></span>
                  </div>
                  <div className="discover-copy"><div><h3>{pet.name}</h3><p>{pet.copy}</p></div><ArrowRight size={17} /></div>
                </Link>
              ))}
            </div>
            <div className="discover-note"><ShieldCheck size={16} /> Listings are shared by the community. Sign in to explore available pets.</div>
          </section>
        </ScrollReveal>

        <ScrollReveal>
          <section className="landing-care section-wrap" id="care">
            <div className="care-intro">
              <span className="eyebrow"><Heart size={14} /> THE LITTLE THINGS, TAKEN CARE OF</span>
              <h2>A little peace of mind<br />for a <em>whole lot of love.</em></h2>
              <p>From the next vet visit to that important vaccine date, keep the everyday details together and spend more time on the good stuff.</p>
              <Link to="/register" className="button button-dark">Make a free account <ArrowRight size={16} /></Link>
              <div className="care-stamp"><PawPrint size={18} /> Thoughtfully made<br />for pet people</div>
            </div>
            <div className="care-service-list">
              {services.map(({ icon: Icon, title, copy, link, label }, index) => (
                <article className="care-service" key={title}>
                  <span className={`care-service-icon care-service-icon-${index}`}><Icon size={20} /></span>
                  <div><h3>{title}</h3><p>{copy}</p><Link to={link}>{label} <ArrowRight size={14} /></Link></div>
                </article>
              ))}
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal>
          <section className="landing-cta section-wrap" id="made-for-love">
            <div className="cta-decoration">🐾</div><div className="cta-decoration cta-decoration-two">✳</div>
            <span className="eyebrow"><Heart size={14} /> YOUR NEXT CHAPTER, TOGETHER</span>
            <h2>More room for<br />the good stuff.</h2>
            <p>Build a little home for the pets, people, and moments you love.</p>
            <Link className="button button-cream" to="/register">Create your PawVerse account <ArrowRight size={16} /></Link>
            <small>Free to join · Always pet people first</small>
          </section>
        </ScrollReveal>
      </main>
      <LandingFooter />
    </div>
  );
}
