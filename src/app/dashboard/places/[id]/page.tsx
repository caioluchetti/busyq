"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAuth } from "@/lib/auth/store";
import { getPlaceById, claimPlace, getQueueForPlace, getReservationsForPlace } from "@/lib/db/mock";
import { Place, QueueEntry, Reservation } from "@/types";
import { Button, Badge, Card, CardContent, CardHeader, Input } from "@/components/ui";
import { ArrowLeft, Users, Calendar, Settings, Bell } from "lucide-react";

export default function DashboardPlacePage() {
  const params = useParams();
  const router = useRouter();
  const placeId = params.id as string;
  const user = typeof window !== "undefined" ? getAuth() : null;

  const [place, setPlace] = useState<Place | undefined>();
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [queueEnabled, setQueueEnabled] = useState(true);
  const [reserveEnabled, setReserveEnabled] = useState(true);

  const refresh = useCallback(() => {
    const p = getPlaceById(placeId);
    setPlace(p);
    if (p) {
      setQueueEnabled(p.queueEnabled);
      setReserveEnabled(p.reservationEnabled);
    }
    setQueue(getQueueForPlace(placeId));
    setReservations(getReservationsForPlace(placeId));
  }, [placeId]);

  useEffect(() => { refresh(); }, [refresh]);

  if (!user || user.role !== "owner") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">Owner access required.</p>
        <Button className="mt-4" onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">Place not found.</p>
      </div>
    );
  }

  const isClaimed = user.claimedPlaceIds?.includes?.(placeId) ?? false;

  const handleClaim = () => {
    claimPlace(placeId, user.id);
    router.refresh();
    refresh();
  };

  const handleQueueAction = async (queueId: string, status: QueueEntry["status"]) => {
    await fetch("/api/queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", queueId, status, userId: user.id }),
    });
    refresh();
  };

  const handleReservationAction = async (resId: string, status: Reservation["status"]) => {
    await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", reservationId: resId, status, userId: user.id }),
    });
    refresh();
  };

  const activeQueue = queue.filter(q => q.status === "waiting");
  const pendingReservations = reservations.filter(r => r.status === "pending");

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <button
        onClick={() => router.push("/dashboard")}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{place.name}</h1>
          <p className="text-gray-500">{place.address}</p>
        </div>
        {!isClaimed && (
          <Button onClick={handleClaim}><Settings className="mr-1.5 h-4 w-4" /> Claim This Place</Button>
        )}
      </div>

      {!isClaimed && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-800">
          Claim this restaurant to manage its queue and reservations.
        </div>
      )}

      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-brand-600" />
            Queue Management
            <Badge variant={activeQueue.length > 5 ? "red" : "green"}>
              {activeQueue.length} waiting
            </Badge>
          </h3>
        </CardHeader>
        <CardContent>
          {activeQueue.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No one in queue.</p>
          ) : (
            <div className="space-y-2">
              {activeQueue.map(entry => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-gray-900">#{entry.position} {entry.userName}</p>
                    <p className="text-xs text-gray-500">
                      Party of {entry.partySize} · Est. {entry.estimatedWaitMinutes}min
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="primary" onClick={() => handleQueueAction(entry.id, "notified")}>
                      <Bell className="h-3 w-3 mr-1" /> Notify
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleQueueAction(entry.id, "seated")}>
                      Seat
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleQueueAction(entry.id, "cancelled")}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-brand-600" />
            Reservation Requests
            <Badge variant={pendingReservations.length > 0 ? "yellow" : "gray"}>
              {pendingReservations.length} pending
            </Badge>
          </h3>
        </CardHeader>
        <CardContent>
          {pendingReservations.length === 0 && reservations.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No reservations yet.</p>
          ) : (
            <div className="space-y-2">
              {reservations.map(r => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-gray-900">{r.userName}</p>
                    <p className="text-sm text-gray-500">
                      {r.date} at {r.time} · Party of {r.partySize}
                      {r.notes && ` · "${r.notes}"`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={
                      r.status === "confirmed" ? "green" :
                      r.status === "denied" ? "red" :
                      r.status === "cancelled" ? "gray" : "yellow"
                    }>
                      {r.status}
                    </Badge>
                    {r.status === "pending" && (
                      <>
                        <Button size="sm" variant="primary" onClick={() => handleReservationAction(r.id, "confirmed")}>
                          Confirm
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleReservationAction(r.id, "denied")}>
                          Deny
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
