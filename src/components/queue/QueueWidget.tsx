"use client";

import { useState, useEffect, useCallback } from "react";
import { QueueEntry } from "@/types";
import { formatWaitTime, timeAgo } from "@/lib/utils";
import { Button, Badge, Input } from "@/components/ui";
import { Users, Clock, Bell } from "lucide-react";

interface QueueWidgetProps {
  placeId: string;
  userId?: string;
  userName?: string;
  isOwner?: boolean;
  onRequireAuth?: () => void;
}

export default function QueueWidget({
  placeId,
  userId,
  userName = "User",
  isOwner = false,
  onRequireAuth,
}: QueueWidgetProps) {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [userEntry, setUserEntry] = useState<QueueEntry | null>(null);
  const [partySize, setPartySize] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch(`/api/queue?placeId=${placeId}${userId ? `&userId=${userId}` : ""}`);
      const data = await res.json();
      setQueue(data.queue ?? []);
      if (userId) {
        const mine = (data.queue ?? []).find(
          (q: QueueEntry) => q.userId === userId && q.status !== "cancelled"
        );
        setUserEntry(mine ?? null);
      }
    } catch {
      // ignore
    }
  }, [placeId, userId]);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 10000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  const activeQueue = queue.filter(q => q.status === "waiting");

  const handleJoin = async () => {
    if (!userId) { onRequireAuth?.(); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          placeId,
          userId,
          userName,
          partySize,
        }),
      });
      if (!res.ok) throw new Error("Failed to join");
      await fetchQueue();
    } catch (e) {
      setError("Could not join queue");
    }
    setLoading(false);
  };

  const handleLeave = async () => {
    if (!userEntry) return;
    setLoading(true);
    try {
      await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          queueId: userEntry.id,
          status: "cancelled",
          userId,
        }),
      });
      await fetchQueue();
    } catch {
      setError("Could not leave queue");
    }
    setLoading(false);
  };

  const handleOwnerUpdate = async (queueId: string, status: QueueEntry["status"]) => {
    if (!isOwner) return;
    try {
      await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", queueId, status, userId }),
      });
      await fetchQueue();
    } catch {
      // ignore
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Users className="h-5 w-5 text-brand-600" />
          Live Queue
          {activeQueue.length > 0 && (
            <Badge variant={activeQueue.length > 5 ? "red" : "yellow"}>
              {activeQueue.length} waiting
            </Badge>
          )}
        </h3>
        {activeQueue.length > 0 && (
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            ~{formatWaitTime(15 + activeQueue.length * 12)} wait
          </div>
        )}
      </div>

      {!userEntry && !isOwner && (
        <div className="rounded-lg border border-gray-200 p-4 bg-gray-50 mb-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Party Size</label>
              <Input
                type="number"
                min={1}
                max={20}
                value={partySize}
                onChange={e => setPartySize(parseInt(e.target.value) || 1)}
                className="h-9"
              />
            </div>
            <Button onClick={handleJoin} disabled={loading} className="flex-shrink-0">
              {loading ? "Joining..." : "Join Queue"}
            </Button>
          </div>
          {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        </div>
      )}

      {userEntry && (
        <div className="rounded-lg border border-brand-200 bg-brand-50 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-brand-800">You&apos;re in the queue!</p>
              <p className="text-sm text-brand-600">
                Position #{userEntry.position} · Party of {userEntry.partySize} ·
                Est. wait: {formatWaitTime(userEntry.estimatedWaitMinutes)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="yellow">{userEntry.status}</Badge>
              <Button variant="ghost" size="sm" onClick={handleLeave} disabled={loading}>
                Leave
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeQueue.length === 0 && !userEntry && (
        <p className="text-sm text-gray-400 text-center py-4">No one in queue right now. Join to reserve your spot!</p>
      )}

      {activeQueue.length > 0 && (
        <div className="space-y-2">
          {activeQueue.slice(0, 10).map(entry => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-400 w-6">#{entry.position}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {entry.userName}
                    {entry.userId === userId && " (you)"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Party of {entry.partySize} · Joined {timeAgo(entry.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isOwner && entry.status === "waiting" && (
                  <>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleOwnerUpdate(entry.id, "notified")}
                    >
                      <Bell className="h-3 w-3 mr-1" /> Notify
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleOwnerUpdate(entry.id, "seated")}
                    >
                      Seat
                    </Button>
                  </>
                )}
                {!isOwner && (
                  <span className="text-xs text-gray-400">
                    ~{formatWaitTime(entry.estimatedWaitMinutes)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeQueue.length > 10 && (
        <p className="text-center text-sm text-gray-400 mt-2">
          +{activeQueue.length - 10} more in queue
        </p>
      )}
    </div>
  );
}
