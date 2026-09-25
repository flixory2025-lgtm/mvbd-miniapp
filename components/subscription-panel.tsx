"use client"

import { createPortal } from "react-dom"
import { useEffect, useState } from "react"
import {
  BookOpen,
  Check,
  ChevronRight,
  Crown,
  ExternalLink,
  Film,
  Lock,
  Loader2,
  Play,
  Send,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/components/auth-provider"
import { createPendingPaymentRequest } from "@/lib/payment-requests"
import {
  PAYMENT_NUMBER,
  SUBSCRIPTION_PLANS,
  type SubscriptionPlanId,
} from "@/lib/subscription-plans"

interface SubscriptionPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenMeBook?: () => void
}

export default function SubscriptionPanel({
  open,
  onOpenChange,
  onOpenMeBook,
}: SubscriptionPanelProps) {
  const { user, profile, entitlement } = useAuth()

  const [selected, setSelected] =
    useState<SubscriptionPlanId>("two_months")

  const [transactionId, setTransactionId] = useState("")
  const [loading, setLoading] = useState(false)
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null)

  // --------------------------------------------------
  // Portal
  // --------------------------------------------------

  useEffect(() => {
    setPortalNode(document.body)

    return () => {
      setPortalNode(null)
    }
  }, [])

  // --------------------------------------------------
  // Prevent background scrolling
  // --------------------------------------------------

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  // --------------------------------------------------
  // Reset form when modal closes
  // --------------------------------------------------

  useEffect(() => {
    if (!open) {
      setTransactionId("")
    }
  }, [open])

  // --------------------------------------------------
  // Don't render
  // --------------------------------------------------

  if (!open || !portalNode) return null

  // --------------------------------------------------
  // Plans
  // --------------------------------------------------

  const freePlan =
    SUBSCRIPTION_PLANS.find((plan) => plan.planId === "trial") ?? null

  const paidPlans = SUBSCRIPTION_PLANS.filter(
    (plan) => plan.planId !== "trial",
  )

  const selectedPlan = paidPlans.find(
    (plan) => plan.planId === selected,
  )

  const activePaidPlan = entitlement.isPremiumActive
    ? entitlement.subscriptionPlan
    : null

  // --------------------------------------------------
  // Payment
  // --------------------------------------------------

  const submitPayment = async () => {
    if (!user || !profile || !selectedPlan) return

    if (!transactionId.trim()) {
      toast.error("Please enter your transaction ID")
      return
    }

    setLoading(true)

    try {
      await createPendingPaymentRequest({
        user,
        profile,
        planId: selectedPlan.planId,
        transactionId: transactionId.trim(),
      })

      toast.success("Payment request submitted for review")

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

  // --------------------------------------------------
  // Free Plan Items
  // --------------------------------------------------

  const freeFeatures = [
    {
      id: "mvbd-pm",
      icon: Send,
      title: "MVBD PM Channel",
      description: "Access the official MVBD PM channel.",
      type: "link" as const,
      href: "https://t.me/mvbdpm2",
    },

    {
      id: "anime-verse",
      icon: Play,
      title: "Anime Verse BD Channel",
      description: "Access the Anime Verse BD channel.",
      type: "link" as const,
      href: "https://t.me/avbdpm",
    },

    {
      id: "mebook",
      icon: BookOpen,
      title: "MeBook",
      description: "Explore the MeBook section from MVBD.",
      type: "mebook" as const,
    },

    {
      id: "trailers",
      icon: Film,
      title: "Movie & Series Trailer Access",
      description:
        "Watch available movie and series trailers.",
      type: "info" as const,
    },

    {
      id: "restricted",
      icon: Lock,
      title: "Age-restricted Content",
      description:
        "This content is age-restricted and isn't available here.",
      type: "restricted" as const,
    },
  ]

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 p-3 backdrop-blur-md sm:p-5"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) {
          onOpenChange(false)
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="subscription-panel-title"
        className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#090d09] shadow-[0_25px_100px_rgba(0,0,0,.65)]"
      >
        {/* --------------------------------------------- */}
        {/* Header */}
        {/* --------------------------------------------- */}

        <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-white/[.025] px-5 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-lime-300">
              MoviesVerseBD
            </p>

            <h2
              id="subscription-panel-title"
              className="mt-1 text-xl font-semibold tracking-tight text-white sm:text-2xl"
            >
              Choose your access
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              Free access or unlock premium features.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[.04] text-zinc-400 transition hover:bg-white/[.09] hover:text-white"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* --------------------------------------------- */}
        {/* Scrollable Content */}
        {/* --------------------------------------------- */}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="space-y-5 p-4 sm:p-6">

            {/* ========================================= */}
            {/* FREE PLAN */}
            {/* ========================================= */}

            <div className="relative overflow-hidden rounded-[24px] border border-lime-300/20 bg-gradient-to-br from-lime-300/[.10] via-white/[.035] to-transparent p-4 sm:p-5">

              {/* Glow */}
              <div className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-lime-300/10 blur-3xl" />

              {/* Free Plan Header */}

              <div className="relative flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-lime-300/20 bg-lime-300/10">
                    <Check className="size-5 text-lime-300" />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-white">
                        Free Plan
                      </h3>

                      <span className="rounded-full border border-lime-300/20 bg-lime-300/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-lime-300">
                        Free
                      </span>
                    </div>

                    <p className="mt-1 text-sm leading-5 text-zinc-400">
                      {freePlan?.description ||
                        "Basic access available to MVBD members."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Free Features */}

              <div className="relative mt-5 grid gap-2.5 sm:grid-cols-2">
                {freeFeatures.map((feature) => {
                  const Icon = feature.icon

                  // -------------------------------------
                  // External Link
                  // -------------------------------------

                  if (feature.type === "link") {
                    return (
                      <a
                        key={feature.id}
                        href={feature.href}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3.5 transition duration-200 hover:border-lime-300/25 hover:bg-lime-300/[.06]"
                      >
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/[.06] text-lime-300">
                          <Icon className="size-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-zinc-100">
                            {feature.title}
                          </p>

                          <p className="mt-0.5 text-[11px] leading-4 text-zinc-500">
                            {feature.description}
                          </p>
                        </div>

                        <ExternalLink className="size-4 shrink-0 text-zinc-600 transition group-hover:text-lime-300" />
                      </a>
                    )
                  }

                  // -------------------------------------
                  // MeBook
                  // -------------------------------------

                  if (feature.type === "mebook") {
                    return (
                      <button
                        key={feature.id}
                        type="button"
                        onClick={() => {
                          onOpenChange(false)
                          onOpenMeBook?.()
                        }}
                        className="group flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3.5 text-left transition duration-200 hover:border-lime-300/25 hover:bg-lime-300/[.06]"
                      >
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/[.06] text-lime-300">
                          <Icon className="size-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-zinc-100">
                            {feature.title}
                          </p>

                          <p className="mt-0.5 text-[11px] leading-4 text-zinc-500">
                            {feature.description}
                          </p>
                        </div>

                        <ChevronRight className="size-4 shrink-0 text-zinc-600 transition group-hover:translate-x-0.5 group-hover:text-lime-300" />
                      </button>
                    )
                  }

                  // -------------------------------------
                  // Age Restricted
                  // -------------------------------------

                  if (feature.type === "restricted") {
                    return (
                      <div
                        key={feature.id}
                        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3.5 opacity-70"
                      >
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/[.05] text-zinc-500">
                          <Lock className="size-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-zinc-300">
                            {feature.title}
                          </p>

                          <p className="mt-0.5 text-[11px] leading-4 text-zinc-600">
                            {feature.description}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full border border-white/10 px-2 py-1 text-[9px] uppercase tracking-wider text-zinc-600">
                          Locked
                        </span>
                      </div>
                    )
                  }

                  // -------------------------------------
                  // Normal Info
                  // -------------------------------------

                  return (
                    <div
                      key={feature.id}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3.5"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/[.06] text-lime-300">
                        <Icon className="size-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-zinc-100">
                          {feature.title}
                        </p>

                        <p className="mt-0.5 text-[11px] leading-4 text-zinc-500">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Premium Note */}

              <div className="relative mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <p className="text-xs leading-5 text-zinc-500">
                  Want more access? Choose a premium plan below to unlock
                  the paid features available on MVBD.
                </p>
              </div>
            </div>

            {/* ========================================= */}
            {/* PAID PLANS */}
            {/* ========================================= */}

            <div>
              <div className="mb-3 flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-xl bg-lime-300/10">
                  <Crown className="size-4 text-lime-300" />
                </div>

                <div>
                  <h3 className="font-medium text-white">
                    Premium Plans
                  </h3>

                  <p className="text-[11px] text-zinc-500">
                    Choose a plan that works for you.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {paidPlans.map((plan) => {
                  const isSelected = selected === plan.planId

                  const isCurrent =
                    activePaidPlan === plan.planId

                  return (
                    <button
                      key={plan.planId}
                      type="button"
                      onClick={() => setSelected(plan.planId)}
                      className={[
                        "relative overflow-hidden rounded-2xl border p-4 text-left transition duration-200",
                        isSelected
                          ? "border-lime-300 bg-lime-300/10 shadow-[0_0_25px_rgba(163,230,53,.08)]"
                          : "border-white/10 bg-white/[.03] hover:border-white/20 hover:bg-white/[.06]",
                      ].join(" ")}
                    >
                      {/* Selected Indicator */}

                      {isSelected && (
                        <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-lime-300">
                          <Check className="size-3 text-[#11150d]" />
                        </span>
                      )}

                      {/* Current Badge */}

                      {isCurrent && (
                        <span className="mb-2 inline-flex rounded-full border border-lime-300/20 bg-lime-300/10 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-lime-300">
                          Current
                        </span>
                      )}

                      <p className="text-xs text-zinc-500">
                        {plan.duration}
                      </p>

                      <p className="mt-2 text-xl font-semibold text-white">
                        {plan.price}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-zinc-500">
                        {plan.description}
                      </p>

                      {plan.popular && (
                        <span className="mt-3 inline-flex rounded-full bg-lime-300 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#11150d]">
                          Popular
                        </span>
                      )}

                      {plan.save && (
                        <p className="mt-2 text-[10px] font-medium text-lime-300/80">
                          {plan.save}
                        </p>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ========================================= */}
            {/* PAYMENT BOX */}
            {/* ========================================= */}

            {selectedPlan && (
              <div className="rounded-[22px] border border-white/10 bg-white/[.025] p-4 sm:p-5">

                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-lime-300/10">
                    <Send className="size-4 text-lime-300" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">
                      Complete your payment
                    </p>

                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      Send{" "}
                      <strong className="text-zinc-200">
                        {selectedPlan.price}
                      </strong>{" "}
                      to{" "}
                      <strong className="text-lime-200">
                        {PAYMENT_NUMBER}
                      </strong>
                      .
                    </p>
                  </div>
                </div>

                {/* Payment Number */}

                <div className="mt-4 rounded-2xl border border-lime-300/15 bg-lime-300/[.05] p-3.5">
                  <p className="text-[10px] uppercase tracking-[.18em] text-zinc-500">
                    Payment Number
                  </p>

                  <p className="mt-1 text-lg font-semibold tracking-wide text-lime-200">
                    {PAYMENT_NUMBER}
                  </p>
                </div>

                {/* Transaction ID */}

                <div className="mt-4">
                  <label
                    htmlFor="transaction-id"
                    className="mb-2 block text-xs font-medium text-zinc-400"
                  >
                    Transaction ID
                  </label>

                  <input
                    id="transaction-id"
                    type="text"
                    value={transactionId}
                    onChange={(event) =>
                      setTransactionId(event.target.value)
                    }
                    placeholder="Enter your transaction ID"
                    autoComplete="off"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 transition focus:border-lime-300/50 focus:bg-black/40"
                  />
                </div>

                {/* Submit */}

                <button
                  type="button"
                  disabled={loading || !transactionId.trim()}
                  onClick={() => void submitPayment()}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-lime-300 px-4 py-3 text-sm font-semibold text-[#11150d] transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="size-4" />
                      Submit for Review
                    </>
                  )}
                </button>

                <p className="mt-3 text-center text-[10px] leading-4 text-zinc-600">
                  Your premium access will be activated after admin
                  review and approval.
                </p>
              </div>
            )}

            {/* Bottom spacing */}

            <div className="h-1" />
          </div>
        </div>
      </section>
    </div>,
    portalNode,
  )
}
