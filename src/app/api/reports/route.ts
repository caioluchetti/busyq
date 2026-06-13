import { NextRequest, NextResponse } from "next/server";
import { getReportsForPlace, submitReport } from "@/lib/db/mock";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get("placeId");

  if (!placeId) {
    return NextResponse.json({ error: "placeId required" }, { status: 400 });
  }

  const reports = getReportsForPlace(placeId);
  const avg = reports.length > 0
    ? +(reports.reduce((s, r) => s + r.level, 0) / reports.length).toFixed(1)
    : 0;

  return NextResponse.json({ reports, averageLevel: avg, total: reports.length });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { placeId, userId, level, comment } = body;

    if (!placeId || !userId || !level) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const report = submitReport(placeId, userId, level, comment);
    return NextResponse.json({ report });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
