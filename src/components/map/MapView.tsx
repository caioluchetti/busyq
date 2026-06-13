"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { HeatmapPoint } from "@/types";
import { getHeatmapConfig } from "@/lib/heatmap";

declare global {
  interface Window {
    L: typeof L;
  }
}

interface MapViewProps {
  center: [number, number];
  zoom?: number;
  heatmapPoints?: HeatmapPoint[];
  onBoundsChange?: (bounds: { lat: number; lng: number; radius: number }) => void;
  onPlaceClick?: (placeId: string) => void;
}

export default function MapView({
  center,
  zoom = 14,
  heatmapPoints,
  onBoundsChange,
  onPlaceClick,
}: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const heatmapLayerRef = useRef<L.Layer | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!mapContainerRef.current || initializedRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center,
      zoom,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.control.attribution({ position: "bottomleft", prefix: false }).addTo(map);

    mapRef.current = map;
    initializedRef.current = true;

    map.on("moveend", () => {
      if (onBoundsChange) {
        const bounds = map.getBounds();
        const center = bounds.getCenter();
        const radius = Math.round(center.distanceTo(bounds.getNorthEast()) * 0.7);
        onBoundsChange({ lat: center.lat, lng: center.lng, radius });
      }
    });

    return () => {
      map.remove();
      initializedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    if (heatmapLayerRef.current) {
      map.removeLayer(heatmapLayerRef.current);
      heatmapLayerRef.current = null;
    }

    if (heatmapPoints && heatmapPoints.length > 0) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js";
      script.async = true;

      script.onload = () => {
        const LHeat = (window.L as Record<string, unknown>)?.heatLayer as
          | ((latlngs: [number, number, number][], options?: Record<string, unknown>) => L.Layer)
          | undefined;

        if (!LHeat || !map) return;

        const config = getHeatmapConfig();
        const data: [number, number, number][] = heatmapPoints.map(p => [
          p.lat,
          p.lng,
          p.intensity / 100,
        ]);

        const layer = LHeat(data, {
          radius: config.radius,
          blur: config.blur,
          maxZoom: config.maxZoom,
          max: 1,
          gradient: config.gradient,
        });

        layer.addTo(map);
        heatmapLayerRef.current = layer;
      };

      document.head.appendChild(script);
    }

    heatmapPoints?.slice(0, 10).forEach(p => {
      const size = 6 + (p.intensity / 100) * 14;
      const color =
        p.intensity < 25 ? "#22c55e" :
        p.intensity < 50 ? "#eab308" :
        p.intensity < 75 ? "#ef4444" : "#7c3aed";

      const marker = L.circleMarker([p.lat, p.lng], {
        radius: size,
        fillColor: color,
        color: "#fff",
        weight: 1.5,
        fillOpacity: 0.85,
      });

      marker.bindTooltip(p.placeName, {
        direction: "top",
        offset: [0, -size],
        className: "leaflet-tooltip-custom",
      });

      marker.on("click", () => {
        if (onPlaceClick) onPlaceClick(p.placeId);
      });

      marker.addTo(map);
      markersRef.current.push(marker);
    });
  }, [heatmapPoints]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setView(center, zoom);
  }, [center[0], center[1], zoom]);

  return (
    <div
      ref={mapContainerRef}
      className="h-full w-full"
      style={{ zIndex: 0 }}
    />
  );
}
