import { NextRequest, NextResponse } from "next/server";
import { getPhotosForPlace, addPhoto } from "@/lib/db/mock";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get("placeId");

  if (!placeId) {
    return NextResponse.json({ error: "placeId required" }, { status: 400 });
  }

  const photos = getPhotosForPlace(placeId);
  return NextResponse.json({ photos });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { placeId, userId, userName, url, caption, width, height } = body;

    if (!placeId || !userId || !userName || !url) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const photo = addPhoto(placeId, userId, userName, url, caption, width ?? 800, height ?? 600);
    return NextResponse.json({ photo });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
