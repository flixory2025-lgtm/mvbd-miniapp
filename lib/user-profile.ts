import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  Timestamp,
  where,
  type DocumentData,
  type DocumentReference,
  type Unsubscribe,
} from "firebase/firestore"
import type { User } from "firebase/auth"

import { db } from "@/lib/firebase"

export const TRIAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000

export type AccessType = "trial" | "subscription" | null
export type SubscriptionStatus =
  | "inactive"
  | "active"
  | "expired"
  | "pending"
  | null

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

  // Referral system
  referralCode: string
  referredBy: string | null
  usedReferralCode: string | null
  successfulReferrals: number
}

function generateMvbdId() {
  const randomId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto
          .randomUUID()
          .replaceAll("-", "")
          .slice(0, 16)
          .toUpperCase()
      : Math.random().toString(36).slice(2, 18).toUpperCase()

  return `MVBD-${randomId}`
}

function generateReferralCode() {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()
      : Math.random().toString(36).slice(2, 10).toUpperCase()

  return `MVBD-${random}`
}

function asTimestamp(value: unknown): Timestamp | null {
  return value instanceof Timestamp ? value : null
}

function normalizeProfile(data: DocumentData): UserProfile {
  return {
    uid: String(data.uid || ""),
    mvbdId: String(data.mvbdId || ""),

    name: typeof data.name === "string" ? data.name : "",
    email: typeof data.email === "string" ? data.email : "",

    photoURL:
      typeof data.photoURL === "string" && data.photoURL
        ? data.photoURL
        : null,

    dateOfBirth:
      typeof data.dateOfBirth === "string"
        ? data.dateOfBirth
        : "",

    createdAt:
      asTimestamp(data.createdAt) ?? Timestamp.now(),

    accessType:
      data.accessType === "trial" ||
      data.accessType === "subscription"
        ? data.accessType
        : null,

    subscriptionStatus:
      ["inactive", "active", "expired", "pending"].includes(
        data.subscriptionStatus,
      )
        ? data.subscriptionStatus
        : null,

    subscriptionPlan:
      typeof data.subscriptionPlan === "string"
        ? data.subscriptionPlan
        : null,

    subscriptionStartedAt:
      asTimestamp(data.subscriptionStartedAt),

    subscriptionExpiresAt:
      asTimestamp(data.subscriptionExpiresAt),

    trialStartedAt:
      asTimestamp(data.trialStartedAt) ?? Timestamp.now(),

    trialExpiresAt:
      asTimestamp(data.trialExpiresAt) ?? Timestamp.now(),

    referralCode:
      typeof data.referralCode === "string" &&
      data.referralCode.trim()
        ? data.referralCode
        : generateReferralCode(),

    referredBy:
      typeof data.referredBy === "string"
        ? data.referredBy
        : null,

    usedReferralCode:
      typeof data.usedReferralCode === "string"
        ? data.usedReferralCode
        : null,

    successfulReferrals:
      typeof data.successfulReferrals === "number"
        ? data.successfulReferrals
        : 0,
  }
}

/**
 * Find a user by their permanent referral code.
 */
export async function findUserByReferralCode(
  referralCode: string,
): Promise<UserProfile | null> {
  const normalizedCode = referralCode.trim().toUpperCase()

  if (!normalizedCode) {
    return null
  }

  const referralQuery = query(
    collection(db, "users"),
    where("referralCode", "==", normalizedCode),
  )

  const snapshot = await getDocs(referralQuery)

  if (snapshot.empty) {
    return null
  }

  return normalizeProfile(snapshot.docs[0].data())
}

/**
 * Get realtime referral count for a referrer.
 *
 * Source of truth:
 * users where referredBy === referrerUid
 */
export function subscribeToReferralCount(
  referrerUid: string,
  onChange: (count: number) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const referralQuery = query(
    collection(db, "users"),
    where("referredBy", "==", referrerUid),
  )

  return onSnapshot(
    referralQuery,
    (snapshot) => {
      onChange(snapshot.size)
    },
    (error) => {
      onError?.(error)
    },
  )
}

/**
 * Get referred users for Admin Panel / future admin usage.
 */
export async function getReferredUsers(
  referrerUid: string,
): Promise<UserProfile[]> {
  const referralQuery = query(
    collection(db, "users"),
    where("referredBy", "==", referrerUid),
  )

  const snapshot = await getDocs(referralQuery)

  return snapshot.docs.map((item) =>
    normalizeProfile(item.data()),
  )
}

export async function ensureUserProfile(
  user: User,
  legacyProfile?: Partial<
    Pick<
      UserProfile,
      | "name"
      | "email"
      | "photoURL"
      | "dateOfBirth"
      | "referralCode"
    >
  > & {
    referredBy?: string | null
    usedReferralCode?: string | null
  },
) {
  const profileRef = doc(db, "users", user.uid)

  return runTransaction(db, async (transaction) => {
    const existing = await transaction.get(profileRef)

    // Existing account:
    // NEVER overwrite referral relationship.
    if (existing.exists()) {
      return normalizeProfile(existing.data())
    }

    const trialStartedAt = Timestamp.now()

    let referredBy: string | null = null
    let usedReferralCode: string | null = null

    const incomingReferralCode =
      legacyProfile?.usedReferralCode ||
      legacyProfile?.referralCode ||
      ""

    if (incomingReferralCode.trim()) {
      const normalizedReferralCode =
        incomingReferralCode.trim().toUpperCase()

      const referralQuery = query(
        collection(db, "users"),
        where("referralCode", "==", normalizedReferralCode),
      )

      const referralSnapshot =
        await getDocs(referralQuery)

      if (!referralSnapshot.empty) {
        const referrerDoc =
          referralSnapshot.docs[0]

        // Prevent self-referral.
        if (referrerDoc.id !== user.uid) {
          referredBy = referrerDoc.id
          usedReferralCode = normalizedReferralCode
        }
      }
    }

    const generatedReferralCode =
      generateReferralCode()

    const profile: UserProfile = {
      uid: user.uid,

      mvbdId: generateMvbdId(),

      name:
        legacyProfile?.name ||
        user.displayName ||
        "",

      email:
        user.email ||
        legacyProfile?.email ||
        "",

      photoURL:
        user.photoURL ||
        legacyProfile?.photoURL ||
        null,

      dateOfBirth:
        legacyProfile?.dateOfBirth ||
        "",

      createdAt: trialStartedAt,

      accessType: null,

      subscriptionStatus: "inactive",

      subscriptionPlan: null,

      subscriptionStartedAt: null,

      subscriptionExpiresAt: null,

      trialStartedAt,

      trialExpiresAt: Timestamp.fromMillis(
        trialStartedAt.toMillis() +
          TRIAL_DURATION_MS,
      ),

      referralCode: generatedReferralCode,

      referredBy,

      usedReferralCode,

      // This value is retained for backward compatibility.
      // The realtime count should come from referredBy queries.
      successfulReferrals: 0,
    }

    transaction.set(profileRef, profile)

    return profile
  })
}

export async function getUserProfile(uid: string) {
  const profileSnapshot = await getDoc(
    doc(db, "users", uid),
  )

  return profileSnapshot.exists()
    ? normalizeProfile(profileSnapshot.data())
    : null
}

export function subscribeToUserProfile(
  uid: string,
  onChange: (profile: UserProfile | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, "users", uid),
    (snapshot) =>
      onChange(
        snapshot.exists()
          ? normalizeProfile(snapshot.data())
          : null,
      ),
    (error) => onError?.(error),
  )
}

export async function activateTrial(uid: string) {
  const profileRef =
    doc(
      db,
      "users",
      uid,
    ) as DocumentReference<UserProfile>

  return runTransaction(db, async (transaction) => {
    const existing =
      await transaction.get(profileRef)

    if (!existing.exists()) {
      throw new Error(
        "Your profile is not available yet.",
      )
    }

    const profile =
      normalizeProfile(existing.data())

    if (
      profile.accessType === "trial" &&
      profile.trialExpiresAt.toMillis() >
        Date.now()
    ) {
      return profile
    }

    if (
      profile.accessType === "subscription" &&
      profile.subscriptionStatus === "active"
    ) {
      throw new Error(
        "Your paid membership is already active.",
      )
    }

    const trialStartedAt =
      Timestamp.now()

    const trialExpiresAt =
      Timestamp.fromMillis(
        trialStartedAt.toMillis() +
          TRIAL_DURATION_MS,
      )

    transaction.update(profileRef, {
      accessType: "trial",
      subscriptionStatus: "inactive",
      trialStartedAt,
      trialExpiresAt,
    })

    return {
      ...profile,
      accessType: "trial" as const,
      subscriptionStatus:
        "inactive" as const,
      trialStartedAt,
      trialExpiresAt,
    }
  })
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<
    Pick<UserProfile, "name" | "dateOfBirth">
  >,
) {
  const profileRef =
    doc(
      db,
      "users",
      uid,
    ) as DocumentReference<UserProfile>

  await runTransaction(db, async (transaction) => {
    const existing =
      await transaction.get(profileRef)

    if (!existing.exists()) {
      throw new Error(
        "Your profile is not available yet.",
      )
    }

    transaction.update(profileRef, updates)
  })
}

export function getLegacyProfile() {
  if (typeof window === "undefined") {
    return undefined
  }

  try {
    const savedProfile =
      window.localStorage.getItem(
        "mvbd_profile",
      )

    if (!savedProfile) {
      return undefined
    }

    const parsed =
      JSON.parse(savedProfile) as Record<
        string,
        unknown
      >

    return {
      name:
        typeof parsed.name === "string"
          ? parsed.name
          : "",

      email:
        typeof parsed.email === "string"
          ? parsed.email
          : "",

      photoURL:
        typeof parsed.photoURL === "string"
          ? parsed.photoURL
          : "",

      dateOfBirth:
        typeof parsed.dateOfBirth === "string"
          ? parsed.dateOfBirth
          : "",
    }
  } catch {
    return undefined
  }
}

export function clearLegacyProfile() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(
      "mvbd_profile",
    )
  }
}
