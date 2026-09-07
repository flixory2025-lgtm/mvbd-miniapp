import type { Timestamp } from "firebase/firestore"

import type { UserProfile } from "@/lib/user-profile"

export type EntitlementState = "TRIAL_ACTIVE" | "PREMIUM_ACTIVE" | "TRIAL_EXPIRED" | "NO_ACCESS"

export type Entitlement = {
  state: EntitlementState
  isAuthenticated: boolean
  isTrialActive: boolean
  isPremiumActive: boolean
  hasWatchAccess: boolean
  accessType: UserProfile["accessType"]
  subscriptionStatus: UserProfile["subscriptionStatus"]
  subscriptionPlan: string | null
  trialExpiresAt: Timestamp | null
  subscriptionExpiresAt: Timestamp | null
}

export function getEntitlement(user: UserProfile | null, now = Date.now()): Entitlement {
  const isTrialActive = Boolean(
    user?.accessType === "trial" && user.trialExpiresAt.toMillis() > now,
  )
  const subscriptionExpiresAt = user?.subscriptionExpiresAt?.toMillis()
  const isPremiumActive = Boolean(
    user?.accessType === "subscription" &&
      user.subscriptionStatus === "active" &&
      subscriptionExpiresAt !== undefined &&
      subscriptionExpiresAt > now,
  )

  let state: EntitlementState = "NO_ACCESS"
  if (isPremiumActive) state = "PREMIUM_ACTIVE"
  else if (isTrialActive) state = "TRIAL_ACTIVE"
  else if (user && user.trialExpiresAt.toMillis() <= now) state = "TRIAL_EXPIRED"

  return {
    state,
    isAuthenticated: Boolean(user),
    isTrialActive,
    isPremiumActive,
    hasWatchAccess: isTrialActive || isPremiumActive,
    accessType: user?.accessType ?? null,
    subscriptionStatus: user?.subscriptionStatus ?? null,
    subscriptionPlan: user?.subscriptionPlan ?? null,
    trialExpiresAt: user?.trialExpiresAt ?? null,
    subscriptionExpiresAt: user?.subscriptionExpiresAt ?? null,
  }
}
