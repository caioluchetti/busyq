import { NextRequest, NextResponse } from "next/server";
import {
  getReservationsForPlace, getUserReservations,
  createReservation, updateReservationStatus,
} from "@/lib/db/mock";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get("placeId");
  const userId = searchParams.get("userId");

  let reservations;
  if (placeId) {
    reservations = getReservationsForPlace(placeId);
  } else if (userId) {
    reservations = getUserReservations(userId);
  } else {
    return NextResponse.json({ error: "placeId or userId required" }, { status: 400 });
  }

  return NextResponse.json({ reservations });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, placeId, userId, userName, date, time, partySize, notes, reservationId, status } = body;

    if (action === "create") {
      if (!placeId || !userId || !userName || !date || !time || !partySize) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
      }
      const reservation = createReservation(placeId, userId, userName, date, time, partySize, notes);
      return NextResponse.json({ reservation });
    }

    if (action === "update") {
      if (!reservationId || !status) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
      }
      const updated = updateReservationStatus(reservationId, status, userId);
      if (!updated) {
        return NextResponse.json({ error: "Not authorized or not found" }, { status: 403 });
      }
      return NextResponse.json({ reservation: updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
