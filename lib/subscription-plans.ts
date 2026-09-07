export type SubscriptionPlanId = "monthly" | "two_months" | "three_months"

export type SubscriptionPlan = {
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

export function getSubscriptionPlan(planId: string) {
  return SUBSCRIPTION_PLANS.find((plan) => plan.planId === planId) ?? null
}

export const PAYMENT_NUMBER = "01865522275"

export type PaymentRequestStatus = "pending" | "approved" | "rejected"

export type PaymentRequest = {
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
  reviewedAt: unknown | null
  reviewedBy: string | null
  adminNote: string | null
}

export type AdminPaymentReview = Pick<
  PaymentRequest,
  | "requestId"
  | "userName"
  | "mvbdId"
  | "planName"
  | "amount"
  | "transactionId"
  | "createdAt"
  | "status"
  | "adminNote"
>

export const ADMIN_COLLECTIONS = {
  users: "users",
  paymentRequests: "paymentRequests",
  subscriptions: "subscriptions",
  notifications: "notifications",
} as const

export const ADMIN_REVIEW_NOT_READY_MESSAGE =
  "Admin review requires a trusted server authorization path and is not available from this client yet."
