export type SubscriptionPlanId =
  | "monthly"
  | "two_months"
  | "three_months"

export interface SubscriptionPlan {
  id: SubscriptionPlanId
  name: string
  durationDays: number
  price: number
  currency: "BDT"
}

/*
 * =========================================================
 * MVBD SUBSCRIPTION PLANS
 * =========================================================
 *
 * এই object-টাই পুরো project-এর central plan source.
 *
 * UI, payment request এবং admin approval—
 * সবাই একই plan information ব্যবহার করবে।
 */

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "monthly",
    name: "1 Month",
    durationDays: 30,
    price: 20,
    currency: "BDT",
  },

  {
    id: "two_months",
    name: "2 Months",
    durationDays: 60,
    price: 35,
    currency: "BDT",
  },

  {
    id: "three_months",
    name: "3 Months",
    durationDays: 90,
    price: 50,
    currency: "BDT",
  },
]

/*
 * =========================================================
 * PAYMENT NUMBER
 * =========================================================
 */

export const PAYMENT_NUMBER = "01865522275"

/*
 * =========================================================
 * FREE TRIAL
 * =========================================================
 */

export const FREE_TRIAL_DAYS = 7

/*
 * =========================================================
 * PAYMENT REQUEST STATUS
 * =========================================================
 */

export type PaymentRequestStatus =
  | "pending"
  | "approved"
  | "rejected"

/*
 * =========================================================
 * GET PLAN
 * =========================================================
 */

export function getSubscriptionPlan(
  planId: string
): SubscriptionPlan | null {
  return (
    SUBSCRIPTION_PLANS.find(
      (plan) => plan.id === planId
    ) || null
  )
}

/*
 * =========================================================
 * CHECK VALID PLAN
 * =========================================================
 */

export function isValidSubscriptionPlan(
  planId: string
): planId is SubscriptionPlanId {
  return (
    planId === "monthly" ||
    planId === "two_months" ||
    planId === "three_months"
  )
}

/*
 * =========================================================
 * GET PLAN PRICE
 * =========================================================
 */

export function getPlanPrice(
  planId: SubscriptionPlanId
): number {
  const plan =
    getSubscriptionPlan(planId)

  return plan?.price || 0
}

/*
 * =========================================================
 * GET PLAN DURATION
 * =========================================================
 */

export function getPlanDurationDays(
  planId: SubscriptionPlanId
): number {
  const plan =
    getSubscriptionPlan(planId)

  return plan?.durationDays || 0
}
