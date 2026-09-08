"use client"

import { useEffect, useMemo, useState } from "react"
import { Clock3, Crown, LockKeyhole, ShieldCheck } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

type AccessStatusCardProps = { onOpenSubscriptions?: () => void }

export default function AccessStatusCard({ onOpenSubscriptions }: AccessStatusCardProps) {
  const { user, entitlement } = useAuth()
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const expiresAt = entitlement.isPremiumActive ? entitlement.subscriptionExpiresAt : entitlement.trialExpiresAt
  const remaining = useMemo(() => Math.max(0, (expiresAt?.toMillis() ?? 0) - now), [expiresAt, now])
  const days = Math.floor(remaining / 86400000)
  const hours = Math.floor((remaining % 86400000) / 3600000)
  const minutes = Math.floor((remaining % 3600000) / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)
  const hasAccess = Boolean(user && entitlement.hasWatchAccess)

  return <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl">
    <div className="relative flex items-start gap-3"><div className={`flex size-10 shrink-0 items-center justify-center rounded-2xl ${hasAccess ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"}`}>{entitlement.isPremiumActive ? <Crown className="size-5" /> : entitlement.isTrialActive ? <Clock3 className="size-5" /> : <LockKeyhole className="size-5" />}</div><div className="min-w-0 flex-1"><p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Watch access</p><h3 className="mt-1 text-lg font-bold text-white">{entitlement.isPremiumActive ? "Premium membership active" : entitlement.isTrialActive ? "7-day trial active" : "Subscription required"}</h3><p className="mt-1 text-sm leading-relaxed text-slate-400">{hasAccess ? `${days}d ${hours}h ${minutes}m ${seconds}s remaining` : "Choose a plan and submit your transaction ID. Access starts after admin approval."}</p></div></div>
    {!hasAccess && <button type="button" onClick={() => onOpenSubscriptions ? onOpenSubscriptions() : window.dispatchEvent(new CustomEvent("mvbd:open-subscriptions"))} className="mt-4 w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-400">View subscription plans</button>}
    {hasAccess && <div className="mt-4 flex items-center gap-2 text-xs text-emerald-300"><ShieldCheck className="size-4" />Access is verified from your account status</div>}
  </section>
}
