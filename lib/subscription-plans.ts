export type SubscriptionPlanId = "trial" | "monthly" | "two_months" | "three_months"

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
}

export const SUBSCRIPTION_PLANS: readonly SubscriptionPlan[] = [
  {
    planId: "trial",
    name: "TRIAL",
    planName: "7 Day Trial",
    durationDays: 7,
    duration: "7 days",
    amount: 0,
    price: "Free",
    description: "Explore the premium experience before choosing a paid plan.",
  },
  {
    planId: "monthly",
    name: "1 MONTH",
    planName: "1 Month",
    durationDays: 30,
    duration: "30 days",
    amount: 20,
    price: "৳20",
    description: "Perfect for trying the premium experience.",
  },
  {
    planId: "two_months",
    name: "2 MONTHS",
    planName: "2 Months",
    durationDays: 60,
    duration: "60 days",
    amount: 35,
    price: "৳35",
    description: "A balanced plan for regular members.",
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
    description: "Best value for long-term premium access.",
    save: "Best value",
  },
]

export const PAYMENT_NUMBER = "01865522275"
export const FREE_TRIAL_DAYS = 7

export type PaymentRequestStatus = "pending" | "approved" | "rejected"

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

export function getSubscriptionPlan(planId: string): SubscriptionPlan | null {
  return SUBSCRIPTION_PLANS.find((plan) => plan.planId === planId) || null
}

export function isValidSubscriptionPlan(planId: string): planId is SubscriptionPlanId {
  return planId === "monthly" || planId === "two_months" || planId === "three_months"
}

export function getPlanPrice(planId: SubscriptionPlanId): number {
  return getSubscriptionPlan(planId)?.amount || 0
}

export function getPlanDurationDays(planId: SubscriptionPlanId): number {
  return getSubscriptionPlan(planId)?.durationDays || 0
}
