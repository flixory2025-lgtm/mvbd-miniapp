import {
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  Timestamp,
  type DocumentData,
  type DocumentReference,
  type Unsubscribe,
} from "firebase/firestore"
import type { User } from "firebase/auth"

import { db } from "@/lib/firebase"

export const TRIAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000

export type AccessType = "trial" | "subscription" | null
export type SubscriptionStatus = "inactive" | "active" | "expired" | "pending" | null
export type AccountStatus = "active" | "suspended" | "banned"

export type UserProfile = {
  uid: string
  mvbdId: string
  name: string
  email: string
  photoURL: string | null
  dateOfBirth: string
  createdAt: Timestamp
  accessType: AccessType
  subscriptionStatus: SubscriptionStatus
  subscriptionPlan: string | null
  subscriptionStartedAt: Timestamp | null
  subscriptionExpiresAt: Timestamp | null
  trialStartedAt: Timestamp
  trialExpiresAt: Timestamp
  trialUsedAt: Timestamp | null
  referralCode: string
  referredBy: string | null
  successfulReferrals: number
  accountStatus: AccountStatus
}

function generateMvbdId() {
  const randomId = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()
    : Math.random().toString(36).slice(2, 18).toUpperCase()

  return `MVBD-${randomId}`
}

function asTimestamp(value: unknown): Timestamp | null {
  return value instanceof Timestamp ? value : null
}

function normalizeProfile(data: DocumentData): UserProfile {
  return {
    uid: String(data.uid),
    mvbdId: String(data.mvbdId),
    name: typeof data.name === "string" ? data.name : "",
    email: typeof data.email === "string" ? data.email : "",
    photoURL: typeof data.photoURL === "string" ? data.photoURL : null,
    dateOfBirth: typeof data.dateOfBirth === "string" ? data.dateOfBirth : "",
    createdAt: asTimestamp(data.createdAt) ?? Timestamp.now(),
    accessType: data.accessType === "trial" || data.accessType === "subscription" ? data.accessType : null,
    subscriptionStatus: ["inactive", "active", "expired", "pending"].includes(data.subscriptionStatus)
      ? data.subscriptionStatus
      : null,
    subscriptionPlan: typeof data.subscriptionPlan === "string" ? data.subscriptionPlan : null,
    subscriptionStartedAt: asTimestamp(data.subscriptionStartedAt),
    subscriptionExpiresAt: asTimestamp(data.subscriptionExpiresAt),
    trialStartedAt: asTimestamp(data.trialStartedAt) ?? Timestamp.now(),
    trialExpiresAt: asTimestamp(data.trialExpiresAt) ?? Timestamp.now(),
    trialUsedAt: asTimestamp(data.trialUsedAt),
    referralCode: typeof data.referralCode === "string" ? data.referralCode.trim().toUpperCase() : String(data.mvbdId || "MVBD-PENDING"),
    referredBy: typeof data.referredBy === "string" ? data.referredBy.trim().toUpperCase() : null,
    successfulReferrals: typeof data.successfulReferrals === "number" ? data.successfulReferrals : 0,
    accountStatus: data.accountStatus === "banned" || data.accountStatus === "suspended" ? data.accountStatus : "active",
  }
}

export async function ensureUserProfile(user: User, legacyProfile?: Partial<Pick<UserProfile, "name" | "email" | "photoURL" | "dateOfBirth" | "referralCode">>) {
  const profileRef = doc(db, "users", user.uid)

  return runTransaction(db, async (transaction) => {
    const existing = await transaction.get(profileRef)
    if (existing.exists()) {
      const current = normalizeProfile(existing.data())
      const updates: Partial<Pick<UserProfile, "name" | "dateOfBirth" | "email" | "photoURL">> = {}
      if (!current.name && legacyProfile?.name) updates.name = legacyProfile.name
      if (!current.dateOfBirth && legacyProfile?.dateOfBirth) updates.dateOfBirth = legacyProfile.dateOfBirth
      if (!current.email && (user.email || legacyProfile?.email)) updates.email = user.email || legacyProfile?.email || ""
      if (!current.photoURL && (user.photoURL || legacyProfile?.photoURL)) updates.photoURL = user.photoURL || legacyProfile?.photoURL || null
      if (Object.keys(updates).length > 0) {
        transaction.update(profileRef, updates)
        return { ...current, ...updates }
      }
      return current
    }

    const trialStartedAt = Timestamp.now()
    const profile: UserProfile = {
      uid: user.uid,
      mvbdId: generateMvbdId(),
      name: legacyProfile?.name || user.displayName || "",
      email: user.email || legacyProfile?.email || "",
      photoURL: user.photoURL || legacyProfile?.photoURL || null,
      dateOfBirth: legacyProfile?.dateOfBirth || "",
      createdAt: trialStartedAt,
      accessType: null,
      subscriptionStatus: "inactive",
      subscriptionPlan: null,
      subscriptionStartedAt: null,
      subscriptionExpiresAt: null,
      trialStartedAt,
      trialExpiresAt: Timestamp.fromMillis(trialStartedAt.toMillis() + TRIAL_DURATION_MS),
      trialUsedAt: null,
      referralCode: legacyProfile?.referralCode || `MVBD-${generateMvbdId().slice(-6)}`,
      referredBy: legacyProfile?.referralCode?.trim().toUpperCase() || null,
      successfulReferrals: 0,
      accountStatus: "active",
    }

    transaction.set(profileRef, profile)

    return profile
  })
}

export async function getUserProfile(uid: string) {
  const profileSnapshot = await getDoc(doc(db, "users", uid))
  return profileSnapshot.exists() ? normalizeProfile(profileSnapshot.data()) : null
}

export function subscribeToUserProfile(
  uid: string,
  onChange: (profile: UserProfile | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, "users", uid),
    (snapshot) => onChange(snapshot.exists() ? normalizeProfile(snapshot.data()) : null),
    (error) => onError?.(error),
  )
}

export async function activateTrial(uid: string) {
  const profileRef: DocumentReference<UserProfile> = doc(
    db,
    "users",
    uid,
  ) as DocumentReference<UserProfile>
  return runTransaction(db, async (transaction) => {
    const existing = await transaction.get(profileRef)
    if (!existing.exists()) {
      throw new Error("Your profile is not available yet.")
    }
    const profile = normalizeProfile(existing.data())
    if (profile.trialUsedAt !== null) {
      throw new Error("Your 7-day trial has already been used.")
    }
    if (
      profile.accessType === "subscription" &&
      profile.subscriptionStatus === "active"
    ) {
      throw new Error("Your paid membership is already active.")
    }
    const trialStartedAt = Timestamp.now()
    const trialExpiresAt = Timestamp.fromMillis(
      trialStartedAt.toMillis() + TRIAL_DURATION_MS,
    )
    transaction.update(profileRef, {
      accessType: "trial",
      subscriptionStatus: "inactive",
      trialStartedAt,
      trialExpiresAt,
      trialUsedAt: trialStartedAt,
    })
    return {
      ...profile,
      accessType: "trial" as const,
      subscriptionStatus: "inactive" as const,
      trialStartedAt,
      trialExpiresAt,
      trialUsedAt: trialStartedAt,
    }
  })
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<Pick<UserProfile, "name" | "dateOfBirth">>,
) {
  const profileRef: DocumentReference<UserProfile> = doc(db, "users", uid) as DocumentReference<UserProfile>
  await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(profileRef)
    if (!existing.exists()) throw new Error("Your profile is not available yet.")
    transaction.update(profileRef, updates)
  })
}

export function getLegacyProfile() {
  if (typeof window === "undefined") return undefined

  try {
    const savedProfile = window.localStorage.getItem("mvbd_profile")
    if (!savedProfile) return undefined
    const parsed = JSON.parse(savedProfile) as Record<string, unknown>
    return {
      name: typeof parsed.name === "string" ? parsed.name : "",
      email: typeof parsed.email === "string" ? parsed.email : "",
      photoURL: typeof parsed.photoURL === "string" ? parsed.photoURL : "",
      dateOfBirth: typeof parsed.dateOfBirth === "string" ? parsed.dateOfBirth : "",
      referralCode: typeof parsed.referralCode === "string" ? parsed.referralCode : "",
    }
  } catch {
    return undefined
  }
}

export function clearLegacyProfile() {
  if (typeof window !== "undefined") window.localStorage.removeItem("mvbd_profile")
}
