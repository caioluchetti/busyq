import { Place, PopularTime, PlacePhoto } from "@/types";
import { generateId } from "@/lib/utils";

const LAT = 40.7580;
const LNG = -73.9855;

const RESTAURANT_TYPES = [
  "restaurant", "cafe", "bar", "night_club", "bakery",
  "meal_takeaway", "fine_dining", "pizzeria", "sushi_bar",
];

const PLACE_NAMES = [
  "The Rustic Spoon", "Sakura Garden", "La Piazza", "Blue Elephant",
  "The Tipsy Goat", "Harvest Table", "Onda Azul", "Smoke & Barrel",
  "Golden Dragon", "The Greenhouse", "Salt & Pepper", "Moonlight Diner",
  "Bamboo House", "The Copper Pot", "Ember & Ash", "Seaside Grill",
  "Velvet Room", "The Daily Grind", "Noodle Paradise", "Taco Fiesta",
];

const STREET_NAMES = [
  "Broadway", "Fifth Ave", "Park Ave", "Madison Ave", "Lexington Ave",
  "Seventh Ave", "Eighth Ave", "Houston St", "Spring St", "Bleecker St",
];

const UNSPLASH_PHOTOS = [
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
  "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800",
  "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800",
  "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800",
  "https://images.unsplash.com/photo-1550966871-3ed3cdb51f3a?w=800",
  "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800",
  "https://images.unsplash.com/photo-1579027989536-b7b1f875659b?w=800",
  "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800",
];

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function shuffleWithSeed<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function photoForIndex(i: number): PlacePhoto {
  const url = UNSPLASH_PHOTOS[i % UNSPLASH_PHOTOS.length];
  return {
    ref: `photo_ref_${i}`,
    url,
    width: 800,
    height: 600,
    attribution: "Mock Photo",
  };
}

function generatePopularTimes(seed: number): PopularTime[] {
  const times: PopularTime[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 8; hour < 24; hour++) {
      const base = 30 + 25 * Math.sin((hour - 12) * Math.PI / 10);
      const noise = seededRandom(seed + day * 24 + hour) * 20 - 10;
      const weekendBoost = (day === 5 || day === 6) ? 15 : 0;
      times.push({
        day,
        hour,
        popularity: Math.max(0, Math.min(100, Math.round(base + noise + weekendBoost))),
      });
    }
  }
  return times;
}

function currentPopularityFromTimes(times: PopularTime[]): number {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const match = times.find(t => t.day === day && t.hour === hour);
  return match?.popularity ?? 30;
}

let cachedPlaces: Place[] | null = null;

export function generatePlaces(centerLat = LAT, centerLng = LNG, radiusMeters = 3000): Place[] {
  if (cachedPlaces) return cachedPlaces;

  const places: Place[] = [];
  const shuffledNames = shuffleWithSeed(PLACE_NAMES, 42);
  const shuffledStreets = shuffleWithSeed(STREET_NAMES, 99);

  for (let i = 0; i < shuffledNames.length; i++) {
    const angle = (i / shuffledNames.length) * Math.PI * 2;
    const distance = (radiusMeters * 0.3) +
      seededRandom(i * 7 + 3) * (radiusMeters * 0.7);
    const latOffset = (distance / 111320) * Math.cos(angle);
    const lngOffset = (distance / (111320 * Math.cos(centerLat * Math.PI / 180))) * Math.sin(angle);

    const lat = centerLat + latOffset;
    const lng = centerLng + lngOffset;
    const street = shuffledStreets[i % shuffledStreets.length];
    const streetNum = Math.floor(seededRandom(i * 13 + 5) * 900) + 100;
    const rating = +(3.0 + seededRandom(i * 31 + 7) * 2.0).toFixed(1);
    const totalRatings = Math.floor(seededRandom(i * 19 + 11) * 2000) + 50;
    const numPhotos = Math.floor(seededRandom(i * 23 + 1) * 3) + 1;

    const popularTimes = generatePopularTimes(i);
    const popularity = currentPopularityFromTimes(popularTimes);

    const types: string[] = [];
    const typeCount = Math.floor(seededRandom(i * 29 + 17) * 3) + 1;
    for (let t = 0; t < typeCount; t++) {
      const ti = Math.floor(seededRandom(i * 37 + t) * RESTAURANT_TYPES.length);
      if (!types.includes(RESTAURANT_TYPES[ti])) {
        types.push(RESTAURANT_TYPES[ti]);
      }
    }

    places.push({
      id: generateId(),
      googlePlaceId: `gp_${i}`,
      name: shuffledNames[i],
      address: `${streetNum} ${street}`,
      lat,
      lng,
      types,
      rating,
      userRatingsTotal: totalRatings,
      photos: Array.from({ length: numPhotos }, (_, p) => photoForIndex(i * 3 + p)),
      currentPopularity: popularity,
      popularTimes,
      claimedBy: null,
      isOpen: popularity > 0,
      queueEnabled: true,
      reservationEnabled: seededRandom(i * 3 + 7) > 0.3,
      createdAt: getNow(),
      updatedAt: getNow(),
    });
  }

  cachedPlaces = places;
  return places;
}

export function getPlaceById(id: string): Place | undefined {
  return generatePlaces().find(p => p.id === id);
}

export function searchNearby(
  lat: number,
  lng: number,
  radiusMeters = 2000,
  types?: string[]
): Place[] {
  const all = generatePlaces(lat, lng, radiusMeters);
  if (!types || types.length === 0) return all;
  return all.filter(p => p.types.some(t => types.includes(t)));
}

export function resetCache(): void {
  cachedPlaces = null;
}

function getNow(): string {
  return new Date().toISOString();
}
