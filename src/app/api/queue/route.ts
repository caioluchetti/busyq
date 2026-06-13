import { NextRequest, NextResponse } from "next/server";
import {
  getQueueForPlace, joinQueue, updateQueueStatus,
} from "@/lib/db/mock";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get("placeId");
  const userId = searchParams.get("userId");

  if (!placeId) {
    return NextResponse.json({ error: "placeId required" }, { status: 400 });
  }

  let queue = getQueueForPlace(placeId);
  if (userId) {
    queue = queue.filter(q => q.userId === userId || q.placeId === placeId);
  }

  return NextResponse.json({ queue, active: queue.filter(q => q.status === "waiting").length });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { placeId, userId, userName, partySize, action, queueId, status } = body;

    if (action === "join") {
      if (!placeId || !userId || !userName || !partySize) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
      }
      const entry = joinQueue(placeId, userId, userName, partySize);
      return NextResponse.json({ entry });
    }

    if (action === "update") {
      if (!queueId || !status) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
      }
      const updated = updateQueueStatus(queueId, status, userId);
      if (!updated) {
        return NextResponse.json({ error: "Not authorized or not found" }, { status: 403 });
      }
      return NextResponse.json({ entry: updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
