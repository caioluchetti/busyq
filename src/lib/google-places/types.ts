import { Place } from "@/types";

export interface PlaceSearchResult {
  place_id: string;
  name: string;
  vicinity: string;
  geometry: { location: { lat: number; lng: number } };
  rating: number;
  user_ratings_total: number;
  types: string[];
  photos?: { photo_reference: string; width: number; height: number }[];
  opening_hours?: { open_now: boolean };
  current_popularity?: number;
  popular_times?: { day: number; hour: number; popularity: number }[];
}

export type PlaceSearchResponse = PlaceSearchResult[];
export type PlaceDetailsResponse = PlaceSearchResult;

export function mapGooglePlaceToApp(result: PlaceSearchResult): Place {
  return {
    id: result.place_id,
    googlePlaceId: result.place_id,
    name: result.name,
    address: result.vicinity,
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
    types: result.types,
    rating: result.rating,
    userRatingsTotal: result.user_ratings_total,
    photos: (result.photos ?? []).map(p => ({
      ref: p.photo_reference,
      url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${p.photo_reference}`,
      width: p.width,
      height: p.height,
      attribution: "Google Places",
    })),
    currentPopularity: result.current_popularity ?? 30,
    popularTimes: result.popular_times ?? [],
    claimedBy: null,
    isOpen: result.opening_hours?.open_now ?? true,
    queueEnabled: true,
    reservationEnabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
