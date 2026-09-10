"use client"

import { useEffect, useState } from "react"
import { Check, Clock3, Crown, Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/components/auth-provider"
import { activateTrial } from "@/lib/user-profile"
import { createPendingPaymentRequest } from "@/lib/payment-requests"
import { PAYMENT_NUMBER, SUBSCRIPTION_PLANS, type SubscriptionPlanId } from "@/lib/subscription-plans"

export default function SubscriptionPanel({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { user, profile, entitlement, refreshProfile } = useAuth()
  const [selected, setSelected] = useState<SubscriptionPlanId>("two_months")
  const [transactionId, setTransactionId] = useState("")
  const [promoCode, setPromoCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [confirmTrial, setConfirmTrial] = useState(false)

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = previous }
  }, [open])

  useEffect(() => {
    if (!open) { setTransactionId(""); setPromoCode(""); setConfirmTrial(false) }
  }, [open])

  if (!open) return null
  const paidPlans = SUBSCRIPTION_PLANS.filter((plan) => plan.planId !== "trial")
  const activePlan = entitlement.isPremiumActive ? entitlement.subscriptionPlan : null

  const startTrial = async () => {
    if (!user) return
    setLoading(true)
    try { await activateTrial(user.uid); await refreshProfile(); toast.success("Your 7-day trial is active"); onOpenChange(false) }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not activate trial") }
    finally { setLoading(false) }
  }

  const submitPayment = async (planId: SubscriptionPlanId) => {
    if (!user || !profile) return
    const plan = paidPlans.find((item) => item.planId === planId)
    if (!plan) return
    setLoading(true)
    try {
      await createPendingPaymentRequest({ user, profile, planId, transactionId, promoCode })
      toast.success("Payment request submitted for review")
      setTransactionId(""); setPromoCode("")
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not submit payment request") }
    finally { setLoading(false) }
  }

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) onOpenChange(false) }}><section className="modal-card max-h-[90vh] overflow-y-auto border border-lime-200/20 bg-[#10170e] shadow-[0_0_80px_rgba(163,230,53,.12)]"><header className="flex items-center justify-between border-b border-lime-200/10 p-5"><div><p className="text-[11px] uppercase tracking-[.2em] text-lime-300">MVBD premium</p><h2 className="mt-1 text-xl font-semibold text-white">Choose your access</h2></div><button onClick={() => onOpenChange(false)} className="rounded-full p-2 text-zinc-400 hover:bg-lime-200/10" aria-label="Close"><X className="size-5" /></button></header><div className="space-y-5 p-5"><div className="rounded-2xl border border-lime-200/20 bg-lime-300/[.07] p-4"><div className="flex items-start gap-3"><span className="icon-box"><Clock3 className="size-5" /></span><div><p className="font-medium text-white">Try 7 days free</p><p className="mt-1 text-sm leading-6 text-zinc-400">Activate once to explore premium access.</p></div></div><button disabled={entitlement.isTrialActive || entitlement.isPremiumActive || loading} onClick={() => setConfirmTrial(true)} className="mt-4 rounded-full bg-lime-300 px-4 py-2 text-sm font-semibold text-[#11150d] disabled:opacity-50">{entitlement.isTrialActive ? "Trial active" : entitlement.isPremiumActive ? "Membership active" : confirmTrial ? (loading ? <Loader2 className="size-4 animate-spin" /> : "Confirm trial") : "Start trial"}</button></div><div><div className="mb-3 flex items-center gap-2"><Crown className="size-4 text-lime-300" /><h3 className="font-medium text-white">Paid plans</h3></div><div className="grid gap-3 sm:grid-cols-3">{paidPlans.map((plan) => { const subscribed = activePlan === plan.planId; const selectedPlan = selected === plan.planId; return <article key={plan.planId} className={`relative rounded-2xl border p-4 transition ${subscribed ? "border-lime-300 bg-lime-300/15 shadow-[0_0_30px_rgba(163,230,53,.16)]" : selectedPlan ? "border-lime-200/50 bg-white/[.06]" : "border-white/10 bg-black/20 opacity-75"}`}><button onClick={() => setSelected(plan.planId)} className="w-full text-left"><div className="flex items-center justify-between"><h4 className="font-semibold text-white">{plan.planName}</h4>{subscribed ? <span className="rounded-full bg-lime-300 px-2 py-1 text-[10px] font-bold text-[#11150d]">SUBSCRIBED</span> : selectedPlan ? <Check className="size-4 text-lime-300" /> : null}</div><p className="mt-3 text-2xl font-semibold text-lime-200">৳{plan.amount}</p><p className="mt-1 text-xs text-zinc-400">{plan.durationDays} days access</p></button><button disabled={subscribed || loading} onClick={() => void submitPayment(plan.planId)} className={`mt-4 w-full rounded-full px-3 py-2 text-sm font-semibold ${subscribed ? "bg-lime-300 text-[#11150d]" : "bg-white/10 text-white hover:bg-lime-300 hover:text-[#11150d]"}`}>{subscribed ? "Subscribed" : loading && selectedPlan ? <Loader2 className="mx-auto size-4 animate-spin" /> : "Continue"}</button></article> })}</div></div><div className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-sm text-zinc-300">Send payment to <strong className="text-lime-200">{PAYMENT_NUMBER}</strong>, then enter your details.</p><input value={transactionId} onChange={(event) => setTransactionId(event.target.value)} placeholder="Transaction ID" className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-lime-300" /><input value={promoCode} onChange={(event) => setPromoCode(event.target.value.toUpperCase())} placeholder="Promo code (optional)" className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm uppercase text-white outline-none focus:border-lime-300" /><p className="text-xs leading-5 text-zinc-500">Promo codes are counted only after the referred user’s payment is approved.</p></div></div></section></div>
}

