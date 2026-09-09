"use client"

import { createPortal } from "react-dom"
import { useEffect, useState } from "react"
import { Check, Clock3, Crown, Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/components/auth-provider"
import { activateTrial } from "@/lib/user-profile"
import { createPendingPaymentRequest } from "@/lib/payment-requests"
import {
  PAYMENT_NUMBER,
  SUBSCRIPTION_PLANS,
  type SubscriptionPlanId,
} from "@/lib/subscription-plans"

export default function SubscriptionPanel({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { user, profile, entitlement, refreshProfile } = useAuth()

  const [selected, setSelected] =
    useState<SubscriptionPlanId>("two_months")
  const [transactionId, setTransactionId] = useState("")
  const [loading, setLoading] = useState(false)
  const [confirmTrial, setConfirmTrial] = useState(false)

  const [mounted, setMounted] = useState(false)

  // Portal safely mounts only on the client.
  useEffect(() => {
    setMounted(true)

    return () => {
      setMounted(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      setTransactionId("")
      setConfirmTrial(false)
    }
  }, [open])

  if (!open || !mounted) return null

  const paidPlans = SUBSCRIPTION_PLANS.filter(
    (plan) => plan.planId !== "trial",
  )

  const selectedPlan = paidPlans.find(
    (plan) => plan.planId === selected,
  )

  const activePaidPlan = entitlement.isPremiumActive
    ? entitlement.subscriptionPlan
    : null

  const startTrial = async () => {
    if (!user) return

    setLoading(true)

    try {
      await activateTrial(user.uid)
      await refreshProfile()

      toast.success("Your 7-day trial is active")

      onOpenChange(false)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not activate trial",
      )
    } finally {
      setLoading(false)
    }
  }

  const submitPayment = async () => {
    if (!user || !profile || !selectedPlan) return

    setLoading(true)

    try {
      await createPendingPaymentRequest({
        user,
        profile,
        planId: selectedPlan.planId,
        transactionId,
      })

      toast.success(
        "Payment request submitted for review",
      )

      setTransactionId("")
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not submit payment request",
      )
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) {
          onOpenChange(false)
        }
      }}
    >
      <section className="modal-card max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/10 p-5">
          <div>
            <p className="text-[11px] uppercase tracking-[.2em] text-lime-300">
              MVBD premium
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              Choose your access
            </h2>
          </div>

          <button
            onClick={() => onOpenChange(false)}
            className="rounded-full p-2 text-zinc-400 hover:bg-white/10"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="rounded-2xl border border-lime-200/20 bg-lime-300/[.07] p-4">
            <div className="flex items-start gap-3">
              <span className="icon-box">
                <Clock3 className="size-5" />
              </span>

              <div>
                <p className="font-medium">
                  Try 7 days free
                </p>

                <p className="mt-1 text-sm leading-6 text-zinc-400">
                  Activate once to explore premium
                  access. Your status stays tied to
                  your Firebase profile.
                </p>
              </div>
            </div>

            {confirmTrial ? (
              <div className="mt-4 flex gap-2">
                <button
                  disabled={loading}
                  onClick={() => void startTrial()}
                  className="rounded-full bg-lime-300 px-4 py-2 text-sm font-semibold text-[#11150d]"
                >
                  {loading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Confirm trial"
                  )}
                </button>

                <button
                  onClick={() =>
                    setConfirmTrial(false)
                  }
                  className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300"
                >
                  Back
                </button>
              </div>
            ) : (
              <button
                disabled={
                  entitlement.isTrialActive ||
                  entitlement.isPremiumActive
                }
                onClick={() =>
                  setConfirmTrial(true)
                }
                className="mt-4 rounded-full bg-lime-300 px-4 py-2 text-sm font-semibold text-[#11150d] disabled:opacity-50"
              >
                {entitlement.isTrialActive
                  ? "Trial active"
                  : entitlement.isPremiumActive
                    ? "Membership active"
                    : "Start trial"}
              </button>
            )}
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <Crown className="size-4 text-lime-300" />

              <h3 className="font-medium">
                Paid plans
              </h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {paidPlans.map((plan) => (
                <button
                  key={plan.planId}
                  onClick={() =>
                    setSelected(plan.planId)
                  }
                  data-plan-active={
                    activePaidPlan === plan.planId
                      ? "true"
                      : activePaidPlan
                        ? "false"
                        : "selection"
                  }
                  className={`rounded-2xl border p-4 text-left transition ${
                    selected === plan.planId
                      ? "border-lime-300 bg-lime-300/10"
                      : "border-white/10 bg-white/[.03] hover:bg-white/[.07]"
                  }`}
                >
                  <p className="text-xs text-zinc-400">
                    {plan.duration}
                  </p>

                  <p className="mt-2 text-lg font-semibold">
                    {plan.price}
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    {plan.description}
                  </p>

                  {plan.popular && (
                    <span className="mt-3 inline-flex rounded-full bg-lime-300 px-2 py-1 text-[10px] font-semibold text-[#11150d]">
                      Popular
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[.03] p-4">
            <p className="text-sm text-zinc-300">
              Send{" "}
              <strong className="text-white">
                {selectedPlan?.price}
              </strong>{" "}
              to{" "}
              <strong className="text-lime-200">
                {PAYMENT_NUMBER}
              </strong>
              , then submit your transaction ID.
              Access is activated only after admin
              review.
            </p>

            <input
              value={transactionId}
              onChange={(event) =>
                setTransactionId(
                  event.target.value,
                )
              }
              placeholder="Transaction ID"
              className="mt-4 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-lime-300"
            />

            <button
              disabled={
                loading ||
                !transactionId.trim()
              }
              onClick={() =>
                void submitPayment()
              }
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-lime-300 px-4 py-2.5 text-sm font-semibold text-[#11150d] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}

              Submit for review
            </button>
          </div>
        </div>
      </section>
    </div>,
    document.body,
  )
}
