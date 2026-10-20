import { ArrowUpRight, CalendarDays, Weight } from "lucide-react";
import { Link } from "react-router-dom";
import PhotoWithFallback from "./PhotoWithFallback";

const petArt = {
  dog: {
    tint: "peach",
    type: "dog",
    images: [
      "photo-1552053831-71594a27632d",
      "photo-1543466835-00a7907e9de1",
      "photo-1551717743-49959800b1f6",
      "photo-1548199973-03cce0bbc87b",
      "photo-1537151608828-ea2b11777ee8",
      "photo-1517849845537-4d257902454a",
      "photo-1534361960057-19889db9621e",
      "photo-1587300003388-59208cc962cb",
      "photo-1583337130417-3346a1be7dee",
      "photo-1560807707-8cc77767d783",
      "photo-1601758228041-f3b2795255f1",
      "photo-1598133894008-61f7fdb8cc3a",
      "photo-1558788353-f76d92427f16",
    ],
  },
  cat: {
    tint: "lavender",
    type: "cat",
    images: [
      "photo-1514888286974-6c03e2ca1dba",
      "photo-1573865526739-10659fec78a5",
      "photo-1533738363-b7f9aef128ce",
      "photo-1495360010541-f48722b34f7d",
      "photo-1513360371669-4adf3dd7dff8",
      "photo-1574158622682-e40e69881006",
    ],
  },
  bird: {
    tint: "sky",
    type: "bird",
    images: [
      "photo-1552728089-57bdde30beb3",
      "photo-1444464666168-49d633b86797",
      "photo-1549608276-5786777e6587",
    ],
  },
  small_mammal: {
    tint: "mint",
    type: "small mammal",
    images: [
      "photo-1585110396000-c9ffd4e4b308",
      "photo-1589923188900-85dae523342b",
      "photo-1583301286816-f4f05e1e8b25",
    ],
  },
  reptile: {
    tint: "lime",
    type: "reptile",
    images: ["photo-1535591273668-578e31182c4f", "photo-1531386151447-fd76ad50012f"],
  },
  other: {
    tint: "cream",
    type: "pet",
    images: ["photo-1450778869180-41d0601e046e", "photo-1548199973-03cce0bbc87b"],
  },
};

function ageLabel(dateOfBirth) {
  if (!dateOfBirth) return "Age not added";
  const born = new Date(`${dateOfBirth}T00:00:00`);
  const now = new Date();
  let years = now.getFullYear() - born.getFullYear();
  let months = now.getMonth() - born.getMonth();
  if (now.getDate() < born.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years > 0) return `${years} ${years === 1 ? "year" : "years"} old`;
  return `${Math.max(months, 0)} ${months === 1 ? "month" : "months"} old`;
}

export default function PetCard({ pet, photoIndex = 0 }) {
  const art = petArt[pet.species] || petArt.other;
  const image = art.images[photoIndex % art.images.length];
  return (
    <article className="pet-card">
      <Link to={`/pets/${pet.id}`} className={`pet-card-art art-${art.tint}`} aria-label={`View ${pet.name}'s profile`}>
        <PhotoWithFallback
          src={pet.photo || `https://images.unsplash.com/${image}?auto=format&fit=crop&w=700&q=85`}
          alt={pet.photo ? `${pet.name}'s photo` : `Illustrative ${art.type} portrait for ${pet.name}`}
          fallbackLabel={`Illustrative ${art.type} portrait`}
          className="pet-card-photo"
        />
        <span className="pet-card-arrow"><ArrowUpRight size={17} /></span>
        <span className="pet-art-spark pet-art-spark-one">✳</span>
        <span className="pet-art-spark pet-art-spark-two">·</span>
      </Link>
      <div className="pet-card-body">
        <div className="pet-card-title">
          <div>
            <h3>{pet.name}</h3>
            <p>{pet.breed || pet.species.replace("_", " ")}</p>
          </div>
          <span className={`sex-dot sex-${pet.sex}`} title={pet.sex || "unknown"} />
        </div>
        <div className="pet-card-meta">
          <span><CalendarDays size={14} /> {ageLabel(pet.date_of_birth)}</span>
          {pet.weight_kg && <span><Weight size={14} /> {pet.weight_kg} kg</span>}
        </div>
      </div>
    </article>
  );
}
