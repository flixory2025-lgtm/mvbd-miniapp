import type { Timestamp } from "firebase/firestore"

import {
  isSubscriptionActive,
  isTrialActive,
  type UserProfile,
} from "./user-profile"

export type EntitlementState =
  | "unauthenticated"
  | "normal"
  | "trial"
  | "premium"
  | "expired"

export type AccessType =
  | "trial"
  | "subscription"
  | null

export interface Entitlement {
  isAuthenticated: boolean

  state: EntitlementState

  isTrialActive: boolean

  isPremiumActive: boolean

  hasWatchAccess: boolean

  accessType: AccessType

  subscriptionStatus:
    | "inactive"
    | "active"
    | "expired"
    | "pending"
    | null

  subscriptionPlan:
    | "monthly"
    | "two_months"
    | "three_months"
    | null

  trialExpiresAt: Timestamp | null

  subscriptionExpiresAt: Timestamp | null

  expiresAt: Timestamp | null

  remainingMilliseconds: number
}

/* =========================================================
   GET ENTITLEMENT
========================================================= */

export function getEntitlement(
  profile: UserProfile | null
): Entitlement {
  if (!profile) {
    return {
      isAuthenticated: false,

      state: "unauthenticated",

      isTrialActive: false,

      isPremiumActive: false,

      hasWatchAccess: false,

      accessType: null,

      subscriptionStatus: null,

      subscriptionPlan: null,

      trialExpiresAt: null,

      subscriptionExpiresAt: null,

      expiresAt: null,

      remainingMilliseconds: 0,
    }
  }

  const trialActive =
    isTrialActive(profile)

  const premiumActive =
    isSubscriptionActive(profile)

  const hasWatchAccess =
    trialActive || premiumActive

  let state: EntitlementState

  if (premiumActive) {
    state = "premium"
  } else if (trialActive) {
    state = "trial"
  } else if (
    profile.subscriptionStatus === "expired"
  ) {
    state = "expired"
  } else {
    state = "normal"
  }

  const expiresAt =
    premiumActive
      ? profile.subscriptionExpiresAt
      : trialActive
        ? profile.trialExpiresAt
        : null

  const remainingMilliseconds =
    expiresAt
      ? Math.max(
          0,
          expiresAt.toMillis() -
            Date.now()
        )
      : 0

  return {
    isAuthenticated: true,

    state,

    isTrialActive: trialActive,

    isPremiumActive: premiumActive,

    hasWatchAccess,

    accessType:
      profile.accessType,

    subscriptionStatus:
      profile.subscriptionStatus,

    subscriptionPlan:
      profile.subscriptionPlan,

    trialExpiresAt:
      profile.trialExpiresAt,

    subscriptionExpiresAt:
      profile.subscriptionExpiresAt,

    expiresAt,

    remainingMilliseconds,
  }
}

/* =========================================================
   WATCH ACCESS
========================================================= */

export function canWatch(
  profile: UserProfile | null
): boolean {
  return getEntitlement(
    profile
  ).hasWatchAccess
}

/* =========================================================
   GET ACCESS LABEL
========================================================= */

export function getAccessLabel(
  entitlement: Entitlement
): string {
  if (
    entitlement.state === "premium"
  ) {
    return "Premium"
  }

  if (
    entitlement.state === "trial"
  ) {
    return "Free Trial"
  }

  if (
    entitlement.state === "expired"
  ) {
    return "Expired"
  }

  if (
    entitlement.state === "normal"
  ) {
    return "Normal"
  }

  return "Not signed in"
}

/* =========================================================
   REMAINING TIME
========================================================= */

export function formatRemainingTime(
  milliseconds: number
): string {
  if (milliseconds <= 0) {
    return "Expired"
  }

  const totalSeconds =
    Math.floor(
      milliseconds / 1000
    )

  const days =
    Math.floor(
      totalSeconds /
        (60 * 60 * 24)
    )

  const hours =
    Math.floor(
      (totalSeconds %
        (60 * 60 * 24)) /
        (60 * 60)
    )

  const minutes =
    Math.floor(
      (totalSeconds %
        (60 * 60)) /
        60
    )

  const seconds =
    totalSeconds % 60

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }

  return `${seconds}s`
}
