export type SubscriptionPlanId =
  | "trial"
  | "monthly"
  | "two_months"
  | "three_months"

export type FreeAccessType =
  | "external"
  | "mebook"
  | "info"
  | "restricted"

export interface FreeAccessItem {
  id: string
  title: string
  description: string
  type: FreeAccessType
  href?: string
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
  freeAccess?: readonly FreeAccessItem[]
  notIncluded?: readonly string[]
}

export const SUBSCRIPTION_PLANS: readonly SubscriptionPlan[] = [
  {
    planId: "trial",
    name: "FREE PLAN",
    planName: "Free Plan",
    durationDays: 7,
    duration: "Free",
    amount: 0,
    price: "FREE",
    description: "বিজ্ঞাপনমুক্ত অভিজ্ঞতায় MVBD Mini App-এর সব movie 480P–720P পর্যন্ত ফ্রিতে দেখুন ও Normal Download করুন।",

    freeAccess: [
      {
        id: "mvbd-pm",
        title: "MVBD PM Channel",
        description: "Visit the official MVBD PM channel.",
        type: "external",
        href: "https://t.me/mvbdpm2",
      },
      {
        id: "anime",
        title: "Anime Verse BD Channel",
        description: "Visit the Anime Verse BD channel.",
        type: "external",
        href: "https://t.me/avbdpm",
      },
      {
        id: "mebook",
        title: "MeBook",
        description: "Open the MeBook section.",
        type: "mebook",
      },
      {
        id: "trailers",
        title: "Movie & Series Trailer Access",
        description: "Access available movie and series trailers.",
        type: "info",
      },
      {
        id: "free-movies",
        title: "Free 480P–720P Movie Watch",
        description: "Start exploring করুন—সব movie 480P–720P পর্যন্ত ফ্রিতে দেখুন, Normal Download করুন এবং বিজ্ঞাপনমুক্ত অভিজ্ঞতা উপভোগ করুন।",
        type: "external",
        href: "/",
      },
      {
        id: "restricted",
        title: "18+ Channel",
        description: "18+ channel খুলতে ক্লিক করুন।",
        type: "external",
        href: "https://t.me/MoviesVerseBD",
      },
    ],

    notIncluded: [
      "Premium subscription features",
      "Full premium movie access",
      "Premium series access",
      "Premium download features",
      "Full MVBD Mini App premium features",
    ],
  },

  {
    planId: "monthly",
    name: "1 MONTH",
    planName: "1 Month",
    durationDays: 30,
    duration: "30 days",
    amount: 20,
    price: "৳20",
    description: "বিজ্ঞাপনমুক্ত অভিজ্ঞতায় 1080P–4K movie access ও premium download সুবিধা।",
  },

  {
    planId: "two_months",
    name: "2 MONTHS",
    planName: "2 Months",
    durationDays: 60,
    duration: "60 days",
    amount: 35,
    price: "৳35",
    description: "জনপ্রিয় প্যাকেজ: 1080P–4K movie access, premium download ও ad-free experience।",
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
    description: "সেরা ভ্যালু: 1080P–4K movie access, premium download ও বিজ্ঞাপনমুক্ত অভিজ্ঞতা।",
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
  planId: string
): SubscriptionPlan | null {
  return (
    SUBSCRIPTION_PLANS.find(
      (plan) => plan.planId === planId
    ) || null
  )
}

export function isValidSubscriptionPlan(
  planId: string
): planId is SubscriptionPlanId {
  return (
    planId === "monthly" ||
    planId === "two_months" ||
    planId === "three_months"
  )
}

export function getPlanPrice(
  planId: SubscriptionPlanId
): number {
  return getSubscriptionPlan(planId)?.amount || 0
}

export function getPlanDurationDays(
  planId: SubscriptionPlanId
): number {
  return getSubscriptionPlan(planId)?.durationDays || 0
}
