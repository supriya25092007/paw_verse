const listingPhotos = {
  harness: "/demo-products/trail-harness.svg",
  accessories: "/demo-products/trail-harness.svg",
  food: "/demo-products/slow-feeder-bowl.svg",
  bowl: "/demo-products/slow-feeder-bowl.svg",
  toy: "/demo-products/puzzle-treat-toy.svg",
  puzzle: "/demo-products/puzzle-treat-toy.svg",
  blanket: "/demo-products/travel-blanket.svg",
  bedding: "/demo-products/pet-bed.svg",
  bed: "/demo-products/pet-bed.svg",
  brush: "/demo-products/grooming-brush.svg",
  grooming: "/demo-products/grooming-brush.svg",
  carrier: "/demo-products/pet-carrier.svg",
};

export function listingImageFor(record) {
  if (record.image_url) return record.image_url;
  const category = String(record.category || "").toLowerCase();
  return Object.entries(listingPhotos).find(([key]) => category.includes(key))?.[1];
}

export function amazonSearchUrl(record) {
  const title = String(record.title || "").replace(/\[PawVerse\s+demo\s*\]\s*/gi, "").trim();
  return `https://www.amazon.com/s?k=${encodeURIComponent(title)}`;
}
