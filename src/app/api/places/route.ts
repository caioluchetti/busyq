import { NextRequest, NextResponse } from "next/server";
import { searchNearby } from "@/lib/google-places/mock";
import { computeHeatmapPoints } from "@/lib/heatmap";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") ?? "40.7580");
  const lng = parseFloat(searchParams.get("lng") ?? "-73.9855");
  const radius = parseFloat(searchParams.get("radius") ?? "3000");
  const types = searchParams.get("types")?.split(",").filter(Boolean);
  const heatmap = searchParams.get("heatmap") !== "false";

  const places = searchNearby(lat, lng, radius, types);

  const response: Record<string, unknown> = {
    places,
    total: places.length,
  };

  if (heatmap) {
    response.heatmap = computeHeatmapPoints(places);
  }

  return NextResponse.json(response);
}
