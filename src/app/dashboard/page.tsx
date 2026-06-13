"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth, upgradeToOwner } from "@/lib/auth/store";
import { getClaimedPlaces, getPendingReservationsForOwner } from "@/lib/db/mock";
import {
  Place, Reservation,
} from "@/types";
import { timeAgo, formatWaitTime } from "@/lib/utils";
import { Button, Badge, Card, CardContent, CardHeader } from "@/components/ui";
import {
  LayoutDashboard, Store, CalendarCheck, Users, TrendingUp,
  CreditCard, ArrowRight, Bell,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(getAuth());
  const [claimedPlaces, setClaimedPlaces] = useState<Place[]>([]);
  const [pendingReservations, setPendingReservations] = useState<Reservation[]>([]);

  useEffect(() => {
    const u = getAuth();
    setUser(u);
    if (u) {
      setClaimedPlaces(getClaimedPlaces(u.id));
      setPendingReservations(getPendingReservationsForOwner(u.id));
    }
  }, []);

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-lg font-semibold text-gray-700">Please sign in</h2>
        <p className="text-gray-500 mt-1">You need an account to manage your places.</p>
        <Button className="mt-4" onClick={() => router.push("/auth/login")}>
          Sign In
        </Button>
      </div>
    );
  }

  if (user.role !== "owner") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Store className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <h1 className="text-xl font-bold text-gray-900">Restaurant Owner Dashboard</h1>
        <p className="text-gray-500 mt-1 max-w-md mx-auto">
          Manage your restaurant&apos;s queue, reservations, and busyness settings.
          Upgrade your account to get started.
        </p>
        <Button
          className="mt-6"
          onClick={() => {
            upgradeToOwner();
            setUser(getAuth());
            router.refresh();
          }}
        >
          <CreditCard className="mr-1.5 h-4 w-4" />
          Upgrade to Owner Account
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-brand-600" />
            Dashboard
          </h1>
          <p className="text-gray-500 mt-1">Manage your restaurants and view activity.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100">
              <Store className="h-6 w-6 text-brand-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{claimedPlaces.length}</p>
              <p className="text-sm text-gray-500">Claimed Places</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
              <CalendarCheck className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pendingReservations.length}</p>
              <p className="text-sm text-gray-500">Pending Reservations</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {claimedPlaces.reduce((s, p) => s + p.currentPopularity, 0)}%
              </p>
              <p className="text-sm text-gray-500">Avg Crowd Level</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {claimedPlaces.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Store className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-700">No places claimed yet</h3>
            <p className="text-gray-500 mt-1 mb-4">
              Claim your restaurant to manage queues, reservations, and busyness.
            </p>
            <Button onClick={() => router.push("/")}>
              Browse Places to Claim
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Your Places</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {claimedPlaces.map(place => (
              <div
                key={place.id}
                className="cursor-pointer"
                onClick={() => router.push(`/dashboard/places/${place.id}`)}
              >
                <Card className="hover:shadow-md transition-shadow">
                <div className="relative aspect-[2/1] overflow-hidden rounded-t-xl">
                  <img
                    src={place.photos[0]?.url}
                    alt={place.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <h3 className="font-bold text-white text-lg">{place.name}</h3>
                  </div>
                </div>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1 text-sm">
                        <Badge variant={
                          place.currentPopularity > 60 ? "red" :
                          place.currentPopularity > 30 ? "yellow" : "green"
                        }>
                          {place.currentPopularity}% busy
                        </Badge>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingReservations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Bell className="h-5 w-5 text-yellow-600" />
            Pending Reservations ({pendingReservations.length})
          </h2>
          <div className="space-y-2">
            {pendingReservations.map(r => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
              >
                <div>
                  <p className="font-medium text-gray-900">{r.userName}</p>
                  <p className="text-sm text-gray-500">
                    {r.date} at {r.time} · Party of {r.partySize}
                    {r.notes ? ` · "${r.notes}"` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={async () => {
                      await fetch("/api/reservations", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          action: "update",
                          reservationId: r.id,
                          status: "confirmed",
                          userId: user.id,
                        }),
                      });
                      setPendingReservations(prev => prev.filter(rr => rr.id !== r.id));
                    }}
                  >
                    Confirm
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={async () => {
                      await fetch("/api/reservations", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          action: "update",
                          reservationId: r.id,
                          status: "denied",
                          userId: user.id,
                        }),
                      });
                      setPendingReservations(prev => prev.filter(rr => rr.id !== r.id));
                    }}
                  >
                    Deny
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
