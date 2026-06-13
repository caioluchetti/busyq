import {
  Place, QueueEntry, Reservation, UserPhoto,
  BusynessReport, UserProfile,
} from "@/types";
import { generateId, getNow } from "@/lib/utils";
import { generatePlaces } from "@/lib/google-places/mock";

let queues: QueueEntry[] = [];
let reservations: Reservation[] = [];
let userPhotos: UserPhoto[] = [];
let reports: BusynessReport[] = [];
let profiles: UserProfile[] = [];

const globalStore = globalThis as unknown as {
  __busyq_queues?: QueueEntry[];
  __busyq_reservations?: Reservation[];
  __busyq_photos?: UserPhoto[];
  __busyq_reports?: BusynessReport[];
  __busyq_profiles?: UserProfile[];
};

export function initStore() {
  if (globalStore.__busyq_queues) queues = globalStore.__busyq_queues;
  if (globalStore.__busyq_reservations) reservations = globalStore.__busyq_reservations;
  if (globalStore.__busyq_photos) userPhotos = globalStore.__busyq_photos;
  if (globalStore.__busyq_reports) reports = globalStore.__busyq_reports;
  if (globalStore.__busyq_profiles) profiles = globalStore.__busyq_profiles;
}

function persist() {
  globalStore.__busyq_queues = [...queues];
  globalStore.__busyq_reservations = [...reservations];
  globalStore.__busyq_photos = [...userPhotos];
  globalStore.__busyq_reports = [...reports];
  globalStore.__busyq_profiles = [...profiles];
}

// ---- Places ----

export function getPlaces(): Place[] {
  return generatePlaces().map(p => {
    const queueCount = queues.filter(q => q.placeId === p.id && q.status === "waiting").length;
    const recentReports = reports.filter(r => r.placeId === p.id);
    const avgReport = recentReports.length > 0
      ? recentReports.reduce((s, r) => s + r.level, 0) / recentReports.length
      : 0;
    return {
      ...p,
      currentPopularity: Math.min(100, Math.round(
        p.currentPopularity + avgReport * 5 + queueCount * 3
      )),
    };
  });
}

export function getPlaceById(id: string): Place | undefined {
  return getPlaces().find(p => p.id === id);
}

export function claimPlace(placeId: string, userId: string) {
  const profile = profiles.find(p => p.id === userId);
  if (profile) {
    if (!profile.claimedPlaceIds.includes(placeId)) {
      profile.claimedPlaceIds.push(placeId);
      persist();
    }
  }
}

// ---- Queues ----

export function getQueueForPlace(placeId: string): QueueEntry[] {
  return queues
    .filter(q => q.placeId === placeId && q.status !== "cancelled")
    .sort((a, b) => a.position - b.position);
}

export function getUserQueues(userId: string): QueueEntry[] {
  return queues.filter(q => q.userId === userId);
}

export function joinQueue(placeId: string, userId: string, userName: string, partySize: number): QueueEntry {
  const existing = queues.filter(q => q.placeId === placeId && q.status === "waiting");
  const position = existing.length + 1;
  const entry: QueueEntry = {
    id: generateId(),
    placeId,
    userId,
    userName,
    partySize,
    status: "waiting",
    position,
    estimatedWaitMinutes: 15 + position * 12,
    createdAt: getNow(),
    updatedAt: getNow(),
  };
  queues.push(entry);
  persist();
  return entry;
}

export function updateQueueStatus(
  queueId: string,
  status: QueueEntry["status"],
  userId?: string
): QueueEntry | null {
  const entry = queues.find(q => q.id === queueId);
  if (!entry) return null;

  const isOwner = userId
    ? profiles.some(p => p.id === userId && p.claimedPlaceIds.includes(entry.placeId))
    : false;
  const isSelf = userId === entry.userId;

  if (!isOwner && !isSelf) return null;

  entry.status = status;
  entry.updatedAt = getNow();

  if (status === "cancelled") {
    const waiting = queues.filter(q =>
      q.placeId === entry.placeId && q.status === "waiting" && q.position > entry.position
    );
    for (const w of waiting) {
      w.position -= 1;
      w.updatedAt = getNow();
    }
  }

  persist();
  return entry;
}

// ---- Reservations ----

export function getReservationsForPlace(placeId: string): Reservation[] {
  return reservations
    .filter(r => r.placeId === placeId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function getUserReservations(userId: string): Reservation[] {
  return reservations.filter(r => r.userId === userId);
}

export function createReservation(
  placeId: string,
  userId: string,
  userName: string,
  date: string,
  time: string,
  partySize: number,
  notes?: string
): Reservation {
  const res: Reservation = {
    id: generateId(),
    placeId,
    userId,
    userName,
    date,
    time,
    partySize,
    status: "pending",
    notes,
    createdAt: getNow(),
    updatedAt: getNow(),
  };
  reservations.push(res);
  persist();
  return res;
}

export function updateReservationStatus(
  id: string,
  status: Reservation["status"],
  userId?: string
): Reservation | null {
  const res = reservations.find(r => r.id === id);
  if (!res) return null;

  const isOwner = userId
    ? profiles.some(p => p.id === userId && p.claimedPlaceIds.includes(res.placeId))
    : false;
  const isSelf = userId === res.userId;

  if (!isOwner && !isSelf) return null;
  if (isSelf && (status === "confirmed" || status === "denied")) return null;

  res.status = status;
  res.updatedAt = getNow();
  persist();
  return res;
}

// ---- Photos ----

export function getPhotosForPlace(placeId: string): UserPhoto[] {
  return userPhotos
    .filter(p => p.placeId === placeId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function addPhoto(
  placeId: string,
  userId: string,
  userName: string,
  url: string,
  caption: string,
  width: number,
  height: number
): UserPhoto {
  const photo: UserPhoto = {
    id: generateId(),
    placeId,
    userId,
    userName,
    url,
    thumbnailUrl: url,
    caption,
    width,
    height,
    createdAt: getNow(),
  };
  userPhotos.push(photo);
  persist();
  return photo;
}

// ---- Busyness Reports ----

export function getReportsForPlace(placeId: string): BusynessReport[] {
  return reports
    .filter(r => r.placeId === placeId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function submitReport(
  placeId: string,
  userId: string,
  level: number,
  comment?: string
): BusynessReport {
  const report: BusynessReport = {
    id: generateId(),
    placeId,
    userId,
    level: Math.max(1, Math.min(5, level)),
    comment,
    createdAt: getNow(),
  };
  reports.push(report);
  persist();
  return report;
}

// ---- Profiles ----

export function getProfile(userId: string): UserProfile | undefined {
  return profiles.find(p => p.id === userId);
}

export function getOrCreateProfile(
  userId: string,
  email: string,
  name?: string
): UserProfile {
  let profile = profiles.find(p => p.id === userId);
  if (!profile) {
    profile = {
      id: userId,
      email,
      name: name ?? email.split("@")[0],
      role: "user",
      claimedPlaceIds: [],
      createdAt: getNow(),
    };
    profiles.push(profile);
    persist();
  }
  return profile;
}

export function upgradeToOwner(userId: string): UserProfile | null {
  const profile = profiles.find(p => p.id === userId);
  if (!profile) return null;
  profile.role = "owner";
  persist();
  return profile;
}

export function getClaimedPlaces(userId: string): Place[] {
  const profile = profiles.find(p => p.id === userId);
  if (!profile) return [];
  return getPlaces().filter(p => profile.claimedPlaceIds.includes(p.id));
}

export function getPendingReservationsForOwner(userId: string): Reservation[] {
  const profile = profiles.find(p => p.id === userId);
  if (!profile) return [];
  return reservations.filter(r =>
    profile.claimedPlaceIds.includes(r.placeId) && r.status === "pending"
  );
}

initStore();
