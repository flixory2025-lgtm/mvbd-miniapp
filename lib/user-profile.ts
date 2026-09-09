import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore"

import { db } from "./firebase"

/* =========================================================
   TYPES
========================================================= */

export type AccessType =
  | "trial"
  | "subscription"
  | null

export type SubscriptionStatus =
  | "inactive"
  | "active"
  | "expired"
  | "pending"
  | null

export type SubscriptionPlanId =
  | "monthly"
  | "two_months"
  | "three_months"

export interface UserProfile {
  uid: string

  mvbdId: string

  name: string

  email: string

  photoURL: string | null

  dateOfBirth: string | null

  createdAt: Timestamp | null

  updatedAt: Timestamp | null

  /* -------------------------
     ACCESS
  ------------------------- */

  accessType: AccessType

  subscriptionStatus: SubscriptionStatus

  subscriptionPlan: SubscriptionPlanId | null

  /* -------------------------
     SUBSCRIPTION
  ------------------------- */

  subscriptionStartedAt: Timestamp | null

  subscriptionExpiresAt: Timestamp | null

  /* -------------------------
     TRIAL
  ------------------------- */

  trialStartedAt: Timestamp | null

  trialExpiresAt: Timestamp | null

  /* -------------------------
     REFERRAL
  ------------------------- */

  referralCode: string | null

  referredBy: string | null

  successfulReferrals: number
}

/* =========================================================
   MVBD ID
========================================================= */

function generateMVBDId(): string {
  const random = Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase()

  return `MVBD-${random}`
}

/* =========================================================
   NORMALIZE PROFILE
========================================================= */

export function normalizeProfile(
  data: Record<string, any>
): UserProfile {
  return {
    uid: data.uid || "",

    mvbdId: data.mvbdId || "",

    name: data.name || "User",

    email: data.email || "",

    photoURL: data.photoURL || null,

    dateOfBirth: data.dateOfBirth || null,

    createdAt:
      data.createdAt instanceof Timestamp
        ? data.createdAt
        : null,

    updatedAt:
      data.updatedAt instanceof Timestamp
        ? data.updatedAt
        : null,

    /*
     * IMPORTANT:
     * New users DO NOT automatically receive trial.
     */

    accessType:
      data.accessType === "trial" ||
      data.accessType === "subscription"
        ? data.accessType
        : null,

    subscriptionStatus:
      data.subscriptionStatus === "active" ||
      data.subscriptionStatus === "expired" ||
      data.subscriptionStatus === "pending" ||
      data.subscriptionStatus === "inactive"
        ? data.subscriptionStatus
        : null,

    subscriptionPlan:
      data.subscriptionPlan === "monthly" ||
      data.subscriptionPlan === "two_months" ||
      data.subscriptionPlan === "three_months"
        ? data.subscriptionPlan
        : null,

    subscriptionStartedAt:
      data.subscriptionStartedAt instanceof Timestamp
        ? data.subscriptionStartedAt
        : null,

    subscriptionExpiresAt:
      data.subscriptionExpiresAt instanceof Timestamp
        ? data.subscriptionExpiresAt
        : null,

    trialStartedAt:
      data.trialStartedAt instanceof Timestamp
        ? data.trialStartedAt
        : null,

    trialExpiresAt:
      data.trialExpiresAt instanceof Timestamp
        ? data.trialExpiresAt
        : null,

    referralCode:
      typeof data.referralCode === "string"
        ? data.referralCode
        : null,

    referredBy:
      typeof data.referredBy === "string"
        ? data.referredBy
        : null,

    successfulReferrals:
      typeof data.successfulReferrals === "number"
        ? data.successfulReferrals
        : 0,
  }
}

/* =========================================================
   CREATE / ENSURE USER PROFILE
========================================================= */

export async function ensureUserProfile({
  uid,
  email,
  name,
  photoURL = null,
  dateOfBirth = null,
  referralCode = null,
}: {
  uid: string
  email: string
  name: string
  photoURL?: string | null
  dateOfBirth?: string | null
  referralCode?: string | null
}): Promise<UserProfile> {
  const userRef = doc(db, "users", uid)

  const profile = await runTransaction(
    db,
    async (transaction) => {
      const snapshot = await transaction.get(userRef)

      /*
       * EXISTING USER
       *
       * Never reset their subscription/trial/access.
       */

      if (snapshot.exists()) {
        return normalizeProfile({
          uid,
          ...snapshot.data(),
        })
      }

      /*
       * NEW USER
       */

      const mvbdId = generateMVBDId()

      const newProfile = {
        uid,

        mvbdId,

        name: name.trim() || "User",

        email: email.trim(),

        photoURL: photoURL || null,

        dateOfBirth: dateOfBirth || null,

        createdAt: serverTimestamp(),

        updatedAt: serverTimestamp(),

        /*
         * New account starts as NORMAL USER.
         */

        accessType: null,

        subscriptionStatus: "inactive",

        subscriptionPlan: null,

        subscriptionStartedAt: null,

        subscriptionExpiresAt: null,

        /*
         * Trial is NOT automatically activated.
         */

        trialStartedAt: null,

        trialExpiresAt: null,

        /*
         * Referral information.
         */

        referralCode:
          generateReferralCode(mvbdId),

        referredBy:
          referralCode || null,

        successfulReferrals: 0,
      }

      transaction.set(userRef, newProfile)

      return normalizeProfile({
        uid,
        ...newProfile,

        /*
         * serverTimestamp() values are unresolved
         * during the transaction, therefore use now
         * for the returned local object.
         */

        createdAt: Timestamp.now(),

        updatedAt: Timestamp.now(),
      })
    }
  )

  return profile
}

/* =========================================================
   REFERRAL CODE GENERATOR
========================================================= */

function generateReferralCode(
  mvbdId: string
): string {
  const suffix = mvbdId
    .replace("MVBD-", "")
    .substring(0, 6)

  return `MVBD${suffix}`
}

/* =========================================================
   GET USER PROFILE
========================================================= */

export async function getUserProfile(
  uid: string
): Promise<UserProfile | null> {
  const userRef = doc(db, "users", uid)

  const snapshot = await getDoc(userRef)

  if (!snapshot.exists()) {
    return null
  }

  return normalizeProfile({
    uid,
    ...snapshot.data(),
  })
}

/* =========================================================
   UPDATE SAFE PROFILE FIELDS
========================================================= */

export async function updateUserProfile(
  uid: string,
  updates: {
    name?: string
    dateOfBirth?: string | null
    photoURL?: string | null
  }
): Promise<void> {
  const userRef = doc(db, "users", uid)

  const safeUpdates: Record<string, any> = {
    updatedAt: serverTimestamp(),
  }

  if (typeof updates.name === "string") {
    safeUpdates.name = updates.name.trim()
  }

  if (
    updates.dateOfBirth === null ||
    typeof updates.dateOfBirth === "string"
  ) {
    safeUpdates.dateOfBirth =
      updates.dateOfBirth
  }

  if (
    updates.photoURL === null ||
    typeof updates.photoURL === "string"
  ) {
    safeUpdates.photoURL =
      updates.photoURL
  }

  await updateDoc(
    userRef,
    safeUpdates
  )
}

/* =========================================================
   CHECK TRIAL CLAIMED
========================================================= */

export async function hasClaimedTrial(
  uid: string
): Promise<boolean> {
  const profile = await getUserProfile(uid)

  if (!profile) {
    return false
  }

  return !!profile.trialStartedAt
}

/* =========================================================
   CHECK SUBSCRIPTION ACTIVE
========================================================= */

export function isSubscriptionActive(
  profile: UserProfile
): boolean {
  if (
    profile.accessType !== "subscription"
  ) {
    return false
  }

  if (
    profile.subscriptionStatus !== "active"
  ) {
    return false
  }

  if (!profile.subscriptionExpiresAt) {
    return false
  }

  return (
    profile.subscriptionExpiresAt.toMillis() >
    Date.now()
  )
}

/* =========================================================
   CHECK TRIAL ACTIVE
========================================================= */

export function isTrialActive(
  profile: UserProfile
): boolean {
  if (
    profile.accessType !== "trial"
  ) {
    return false
  }

  if (!profile.trialExpiresAt) {
    return false
  }

  return (
    profile.trialExpiresAt.toMillis() >
    Date.now()
  )
}
