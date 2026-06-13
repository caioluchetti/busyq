export interface Place {
  id: string;
  googlePlaceId?: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  types: string[];
  rating: number;
  userRatingsTotal: number;
  photos: PlacePhoto[];
  currentPopularity: number;
  popularTimes: PopularTime[];
  claimedBy: string | null;
  isOpen: boolean;
  queueEnabled: boolean;
  reservationEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlacePhoto {
  ref: string;
  url: string;
  width: number;
  height: number;
  attribution: string;
}

export interface PopularTime {
  day: number;
  hour: number;
  popularity: number;
}

export interface QueueEntry {
  id: string;
  placeId: string;
  userId: string;
  userName: string;
  partySize: number;
  status: "waiting" | "notified" | "seated" | "cancelled";
  position: number;
  estimatedWaitMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface Reservation {
  id: string;
  placeId: string;
  userId: string;
  userName: string;
  date: string;
  time: string;
  partySize: number;
  status: "pending" | "confirmed" | "denied" | "cancelled";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPhoto {
  id: string;
  placeId: string;
  userId: string;
  userName: string;
  url: string;
  thumbnailUrl: string;
  caption: string;
  width: number;
  height: number;
  createdAt: string;
}

export interface BusynessReport {
  id: string;
  placeId: string;
  userId: string;
  level: number;
  comment?: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: "user" | "owner";
  claimedPlaceIds: string[];
  createdAt: string;
}

export type BusynessLevel = "quiet" | "moderate" | "busy" | "packed";

export function busynessLevel(popularity: number): BusynessLevel {
  if (popularity < 25) return "quiet";
  if (popularity < 50) return "moderate";
  if (popularity < 75) return "busy";
  return "packed";
}

export function busynessColor(level: BusynessLevel): string {
  switch (level) {
    case "quiet":
      return "#22c55e";
    case "moderate":
      return "#eab308";
    case "busy":
      return "#ef4444";
    case "packed":
      return "#7c3aed";
  }
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
  placeId: string;
  placeName: string;
}
