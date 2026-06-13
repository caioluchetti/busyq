"use client";

import { UserProfile } from "@/types";
import { getOrCreateProfile } from "@/lib/db/mock";

const AUTH_KEY = "busyq_auth_user";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "user" | "owner";
  claimedPlaceIds: string[];
}

export function saveAuth(user: AuthUser) {
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  }
}

export function getAuth(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearAuth() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_KEY);
  }
}

export function signUp(email: string, password: string, name: string): AuthUser {
  if (!email || !password || password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const profile = getOrCreateProfile(id, email, name);

  const user: AuthUser = {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role,
    claimedPlaceIds: profile.claimedPlaceIds,
  };
  saveAuth(user);
  return user;
}

export function signIn(email: string, password: string): AuthUser {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const id = `user_${Math.random().toString(36).substring(2, 14)}`;
  const profile = getOrCreateProfile(id, email);

  const user: AuthUser = {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role,
    claimedPlaceIds: profile.claimedPlaceIds,
  };
  saveAuth(user);
  return user;
}

export function signOut() {
  clearAuth();
}

export function upgradeToOwner(): AuthUser | null {
  const user = getAuth();
  if (!user) return null;
  user.role = "owner";
  saveAuth(user);
  return user;
}
