"use client";

import { Suspense } from "react";
import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { getAuth } from "@/lib/auth/store";
import BusynessGauge from "@/components/places/BusynessGauge";
import PhotoFeed from "@/components/places/PhotoFeed";
import QueueWidget from "@/components/queue/QueueWidget";
import { Button, Badge, Card, CardContent } from "@/components/ui";
import {
  Place, UserPhoto, QueueEntry, Reservation, busynessLevel,
  busynessColor,
} from "@/types";
import { timeAgo, formatWaitTime } from "@/lib/utils";
import {
  MapPin, Star, Clock, ArrowLeft, Calendar, Users,
  Camera, MessageSquare, AlertCircle,
} from "lucide-react";

function PlaceDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const placeId = params.id as string;
  const actionParam = searchParams.get("action");

  const [place, setPlace] = useState<Place | null>(null);
  const [photos, setPhotos] = useState<UserPhoto[]>([]);
  const [queueCount, setQueueCount] = useState(0);
  const [showReserveForm, setShowReserveForm] = useState(actionParam === "reserve");
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportLevel, setReportLevel] = useState(3);
  const [reportComment, setReportComment] = useState("");
  const [reserveDate, setReserveDate] = useState(new Date().toISOString().split("T")[0]);
  const [reserveTime, setReserveTime] = useState("19:00");
  const [reserveParty, setReserveParty] = useState(2);
  const [reserveNotes, setReserveNotes] = useState("");
  const [reserveSuccess, setReserveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const user = typeof window !== "undefined" ? getAuth() : null;
  const isOwner = user
    ? place?.claimedBy === user.id ||
      user.claimedPlaceIds?.includes?.(placeId)
    : false;
  const owned = user?.claimedPlaceIds?.includes?.(placeId) ?? false;

  const fetchData = useCallback(async () => {
    try {
      const [placesRes, queueRes, photosRes] = await Promise.all([
        fetch(`/api/places?lat=40.758&lng=-73.9855&radius=5000`),
        fetch(`/api/queue?placeId=${placeId}`),
        fetch(`/api/photos?placeId=${placeId}`),
      ]);
      const placesData = await placesRes.json();
      const queueData = await queueRes.json();
      const photosData = await photosRes.json();

      const found = (placesData.places ?? []).find(
        (p: Place) => p.id === placeId
      );
      if (found) setPlace(found);
      setQueueCount(queueData.active ?? 0);
      setPhotos(photosData.photos ?? []);
    } catch {
      // ignore
    }
    setLoading(false);
  }, [placeId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    if (actionParam === "queue") {
      document.getElementById("queue-section")?.scrollIntoView({ behavior: "smooth" });
    }
    if (actionParam === "reserve") {
      setShowReserveForm(true);
      document.getElementById("reserve-section")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [actionParam]);

  const handleReserve = async () => {
    if (!user || !place) return;
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          placeId: place.id,
          userId: user.id,
          userName: user.name,
          date: reserveDate,
          time: reserveTime,
          partySize: reserveParty,
          notes: reserveNotes,
        }),
      });
      if (res.ok) {
        setReserveSuccess(true);
        setShowReserveForm(false);
      }
    } catch {
      // ignore
    }
  };

  const handleReport = async () => {
    if (!user || !place) return;
    try {
      await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeId: place.id,
          userId: user.id,
          level: reportLevel,
          comment: reportComment,
        }),
      });
      setShowReportForm(false);
      setReportComment("");
      fetchData();
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded mb-4" />
        <div className="h-64 bg-gray-200 rounded-xl mb-6" />
        <div className="h-4 w-full bg-gray-200 rounded mb-2" />
        <div className="h-4 w-2/3 bg-gray-200 rounded" />
      </div>
    );
  }

  if (!place) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-gray-700">Place not found</h2>
        <p className="text-gray-500 mt-1">This place may no longer be available.</p>
        <Button variant="primary" className="mt-4" onClick={() => router.push("/")}>
          Back to Discover
        </Button>
      </div>
    );
  }

  const level = busynessLevel(place.currentPopularity);
  const color = busynessColor(level);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="relative aspect-[3/1] overflow-hidden rounded-xl bg-gray-200">
        <img
          src={place.photos[0]?.url}
          alt={place.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4">
          <h1 className="text-3xl font-bold text-white">{place.name}</h1>
          <div className="flex items-center gap-3 mt-1 text-white/80">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-white">{place.rating}</span>
              <span>({place.userRatingsTotal})</span>
            </div>
            <span>·</span>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {place.address}
            </div>
          </div>
        </div>
        {isOwner && (
          <Badge variant="green" className="absolute top-4 right-4 shadow">Your Place</Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 flex flex-col items-center">
          <BusynessGauge popularity={place.currentPopularity} size={180} />
          <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {queueCount} in queue
            </div>
            {queueCount > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                ~{formatWaitTime(15 + queueCount * 12)}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 text-gray-400"
            onClick={() => setShowReportForm(!showReportForm)}
          >
            <MessageSquare className="h-3.5 w-3.5 mr-1" />
            Report crowd level
          </Button>

          {showReportForm && (
            <Card className="w-full mt-3">
              <CardContent className="space-y-3">
                <p className="text-sm font-medium">How busy is it?</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(l => (
                    <button
                      key={l}
                      onClick={() => setReportLevel(l)}
                      className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                        reportLevel === l
                          ? "bg-brand-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Empty</span>
                  <span>Packed</span>
                </div>
                <input
                  placeholder="Quick comment (optional)"
                  value={reportComment}
                  onChange={e => setReportComment(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
                <Button size="sm" className="w-full" onClick={handleReport}>
                  Submit Report
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="flex flex-wrap gap-2">
            {place.types.map(t => (
              <Badge key={t} variant="gray">
                {t.replace(/_/g, " ")}
              </Badge>
            ))}
          </div>

          <div id="queue-section">
            <QueueWidget
              placeId={place.id}
              userId={user?.id}
              userName={user?.name}
              isOwner={isOwner}
              onRequireAuth={() => router.push("/auth/login")}
            />
          </div>

          {place.reservationEnabled && (
            <div id="reserve-section">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-brand-600" />
                  Reservations
                </h3>
                {!showReserveForm && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (!user) { router.push("/auth/login"); return; }
                      setShowReserveForm(true);
                    }}
                  >
                    Reserve a Table
                  </Button>
                )}
              </div>

              {reserveSuccess && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-4 mb-4">
                  <p className="text-sm font-medium text-green-800">Reservation submitted!</p>
                  <p className="text-xs text-green-600">The restaurant will confirm shortly.</p>
                </div>
              )}

              {showReserveForm && (
                <Card className="mb-4">
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                        <input
                          type="date"
                          value={reserveDate}
                          onChange={e => setReserveDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Time</label>
                        <input
                          type="time"
                          value={reserveTime}
                          onChange={e => setReserveTime(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Party Size</label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={reserveParty}
                        onChange={e => setReserveParty(parseInt(e.target.value) || 1)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Notes (optional)</label>
                      <input
                        placeholder="Special requests..."
                        value={reserveNotes}
                        onChange={e => setReserveNotes(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1" onClick={handleReserve}>
                        Confirm Reservation
                      </Button>
                      <Button variant="ghost" onClick={() => setShowReserveForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <PhotoFeed photos={photos} placeId={place.id} placeName={place.name} />
        </div>
      </div>
    </div>
  );
}

export default function PlaceDetailPage() {
  return (
    <Suspense fallback={
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded mx-auto" />
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    }>
      <PlaceDetailContent />
    </Suspense>
  );
}
