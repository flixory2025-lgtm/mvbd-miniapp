export type SubscriptionPlanId =
  | "trial"
  | "monthly"
  | "two_months"
  | "three_months"

export interface PlanAccessItem {
  id: string
  title: string
  description: string
  available: boolean
  buttonText?: string
  action?: string
  locked?: boolean
}

export interface SubscriptionPlan {
  planId: SubscriptionPlanId
  name: string
  planName: string
  durationDays: number
  duration: string
  amount: number
  price: string
  description: string
  popular?: boolean
  save?: string

  /*
   * Free-plan popup access list.
   * Paid plans can also use this later if needed.
   */
  accessItems?: PlanAccessItem[]

  /*
   * Things unavailable on the free plan.
   */
  lockedItems?: string[]
}

const FREE_ACCESS_ITEMS: PlanAccessItem[] = [
  {
    id: "mvbd-pm",
    title: "MVBD PM Channel",
    description: "Access the official MVBD PM channel.",
    available: true,
    buttonText: "Open Channel",
    action: "mvbd-pm",
  },

  /*
   * The 18+ channel is intentionally not given a direct
   * access link here.
   */
  {
    id: "moviesversebd-18",
    title: "MoviesVerseBD Channel",
    description: "Age-restricted channel access.",
    available: false,
    buttonText: "18+ Restricted",
    action: "restricted",
    locked: true,
  },

  {
    id: "anime-verse",
    title: "Anime Verse BD",
    description: "Access the Anime Verse BD channel.",
    available: true,
    buttonText: "Open Channel",
    action: "anime-verse",
  },

  {
    id: "mebook",
    title: "MVBD MeBook",
    description: "Open the MVBD MeBook section.",
    available: true,
    buttonText: "Open MeBook",
    action: "mebook",
  },

  {
    id: "mini-app",
    title: "MVBD Mini App",
    description: "Basic Mini App access is available.",
    available: true,
    buttonText: "Check Access",
    action: "mini-app",
  },

  {
    id: "trailers",
    title: "Movie & Series Trailers",
    description: "Explore available movie and series trailers.",
    available: true,
    buttonText: "Watch Trailers",
    action: "trailers",
  },
]

const FREE_LOCKED_ITEMS = [
  "Full Movie Streaming",
  "Premium Content",
  "Download Option",
  "Ad-Free Experience",
  "Premium-only Library",
  "Priority Support",
]

export const SUBSCRIPTION_PLANS: readonly SubscriptionPlan[] = [
  {
    planId: "trial",

    /*
     * Kept as "trial" internally so your existing Firebase/payment
     * types don't break, but the UI presents it as FREE PLAN.
     */
    name: "FREE PLAN",
    planName: "Free Access",

    durationDays: 0,
    duration: "Free",

    amount: 0,
    price: "FREE",

    description:
      "Explore MVBD's available free features and community access.",

    accessItems: FREE_ACCESS_ITEMS,

    lockedItems: FREE_LOCKED_ITEMS,
  },

  {
    planId: "monthly",
    name: "1 MONTH",
    planName: "1 Month",

    durationDays: 30,
    duration: "30 days",

    amount: 20,
    price: "৳20",

    description:
      "Premium access for 30 days with the full authorized premium experience.",
  },

  {
    planId: "two_months",
    name: "2 MONTHS",
    planName: "2 Months",

    durationDays: 60,
    duration: "60 days",

    amount: 35,
    price: "৳35",

    description:
      "A balanced 60-day premium membership for regular members.",

    popular: true,
    save: "Save ৳5",
  },

  {
    planId: "three_months",
    name: "3 MONTHS",
    planName: "3 Months",

    durationDays: 90,
    duration: "90 days",

    amount: 50,
    price: "৳50",

    description:
      "90 days of premium membership for long-term access.",

    save: "Best value",
  },
]

export const PAYMENT_NUMBER = "01865522275"

export const FREE_TRIAL_DAYS = 7

export type PaymentRequestStatus =
  | "pending"
  | "approved"
  | "rejected"

export interface PaymentRequest {
  requestId: string
  uid: string
  mvbdId: string
  userName: string
  planId: SubscriptionPlanId
  planName: string
  amount: number
  transactionId: string
  status: PaymentRequestStatus
  createdAt: unknown
  reviewedAt: unknown
  reviewedBy: string | null
  adminNote: string | null
}

export function getSubscriptionPlan(
  planId: string,
): SubscriptionPlan | null {
  return (
    SUBSCRIPTION_PLANS.find(
      (plan) => plan.planId === planId,
    ) || null
  )
}

export function isValidSubscriptionPlan(
  planId: string,
): planId is SubscriptionPlanId {
  return (
    planId === "monthly" ||
    planId === "two_months" ||
    planId === "three_months"
  )
}

export function getPlanPrice(
  planId: SubscriptionPlanId,
): number {
  return getSubscriptionPlan(planId)?.amount || 0
}

export function getPlanDurationDays(
  planId: SubscriptionPlanId,
): number {
  return (
    getSubscriptionPlan(planId)?.durationDays || 0
  )
}
