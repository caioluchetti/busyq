import { HeatmapPoint, Place } from "@/types";
import { getQueueForPlace, getReportsForPlace } from "@/lib/db/mock";

export function computeHeatmapPoints(places: Place[]): HeatmapPoint[] {
  return places.map(place => {
    const queue = getQueueForPlace(place.id);
    const activeQueue = queue.filter(q => q.status === "waiting").length;
    const reports = getReportsForPlace(place.id);
    const avgReport = reports.length > 0
      ? reports.reduce((s, r) => s + r.level, 0) / reports.length
      : 0;

    const intensity = Math.round(
      (place.currentPopularity * 0.5) +
      (avgReport * 12) +
      (activeQueue * 5)
    );

    return {
      lat: place.lat,
      lng: place.lng,
      intensity: Math.min(100, Math.max(0, intensity)),
      placeId: place.id,
      placeName: place.name,
    };
  });
}

export function getHeatmapConfig() {
  return {
    radius: 25,
    blur: 15,
    maxZoom: 18,
    max: 100,
    gradient: {
      0.0: "#22c55e",
      0.25: "#86efac",
      0.5: "#eab308",
      0.75: "#ef4444",
      1.0: "#7c3aed",
    },
  };
}
