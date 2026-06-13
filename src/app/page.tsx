"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import PlaceCard from "@/components/places/PlaceCard";
import { Input, Badge } from "@/components/ui";
import { Place, HeatmapPoint } from "@/types";
import { Search, SlidersHorizontal, List, MapIcon } from "lucide-react";

const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-100 flex items-center justify-center">
      <p className="text-gray-400">Loading map...</p>
    </div>
  ),
});

export default function HomePage() {
  const router = useRouter();
  const [places, setPlaces] = useState<Place[]>([]);
  const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>([]);
  const [center, setCenter] = useState<[number, number]>([40.758, -73.9855]);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchPlaces = useCallback(async (lat: number, lng: number, radius: number) => {
    try {
      const res = await fetch(
        `/api/places?lat=${lat}&lng=${lng}&radius=${radius}&heatmap=true`
      );
      const data = await res.json();
      setPlaces(data.places ?? []);
      setHeatmapPoints(data.heatmap ?? []);
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPlaces(center[0], center[1], 3000);
  }, []);

  const handleBoundsChange = useCallback(
    (bounds: { lat: number; lng: number; radius: number }) => {
      fetchPlaces(bounds.lat, bounds.lng, Math.max(bounds.radius, 1000));
    },
    [fetchPlaces]
  );

  const filtered = places.filter(
    p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.address.toLowerCase().includes(search.toLowerCase()) ||
      p.types.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <div className="hidden lg:flex w-96 flex-shrink-0 flex-col border-r border-gray-200 bg-white">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search restaurants, bars, cafes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl bg-gray-100 h-48" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">No places found</p>
            </div>
          ) : (
            filtered.map(place => (
              <PlaceCard key={place.id} place={place} />
            ))
          )}
        </div>
      </div>

      <div className="flex-1 relative">
        <div className="absolute top-3 left-3 right-3 z-10 lg:hidden">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search places..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-white/90 backdrop-blur shadow-lg"
            />
          </div>
        </div>

        {viewMode === "map" ? (
          <MapView
            center={center}
            heatmapPoints={heatmapPoints}
            onBoundsChange={handleBoundsChange}
            onPlaceClick={(id) => router.push(`/place/${id}`)}
          />
        ) : (
          <div className="h-full overflow-y-auto p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
              {filtered.map(place => (
                <PlaceCard key={place.id} place={place} />
              ))}
            </div>
          </div>
        )}

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 rounded-full bg-white/90 backdrop-blur shadow-lg border border-gray-200 p-1 lg:hidden">
          <button
            onClick={() => setViewMode("map")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === "map" ? "bg-brand-600 text-white" : "text-gray-600"
            }`}
          >
            <MapIcon className="h-4 w-4 inline mr-1" />
            Map
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === "list" ? "bg-brand-600 text-white" : "text-gray-600"
            }`}
          >
            <List className="h-4 w-4 inline mr-1" />
            List
          </button>
        </div>
      </div>
    </div>
  );
}
