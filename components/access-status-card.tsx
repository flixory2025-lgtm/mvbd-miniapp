"use client"

import {
  CheckCircle2,
  Clock3,
  Crown,
  ShieldAlert,
} from "lucide-react"

type AccessStatusCardProps = {
  entitlement?: {
    hasWatchAccess?: boolean
    accessType?: string | null
    subscriptionStatus?: string | null
    subscriptionPlan?: string | null
    trialExpiresAt?: unknown
    subscriptionExpiresAt?: unknown
  } | null
  profile?: {
    accessType?: string | null
    subscriptionStatus?: string | null
    subscriptionPlan?: string | null
    trialExpiresAt?: unknown
    subscriptionExpiresAt?: unknown
  } | null
}

function getMillis(value: unknown): number {
  if (!value) return 0

  if (
    typeof value === "object" &&
    value !== null &&
    "toMillis" in value &&
    typeof (value as { toMillis?: unknown }).toMillis === "function"
  ) {
    return (value as { toMillis: () => number }).toMillis()
  }

  if (value instanceof Date) {
    return value.getTime()
  }

  if (typeof value === "number") {
    return value
  }

  if (typeof value === "string") {
    const time = Date.parse(value)
    return Number.isNaN(time) ? 0 : time
  }

  return 0
}

function formatRemaining(milliseconds: number): string {
  if (milliseconds <= 0) {
    return "Expired"
  }

  const totalSeconds = Math.floor(milliseconds / 1000)

  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor(
    (totalSeconds % 86400) / 3600,
  )
  const minutes = Math.floor(
    (totalSeconds % 3600) / 60,
  )

  if (days > 0) {
    return `${days}d ${hours}h remaining`
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`
  }

  return `${Math.max(minutes, 1)}m remaining`
}

function getPlanName(plan?: string | null) {
  switch (plan) {
    case "monthly":
      return "1 Month Plan"

    case "two_months":
      return "2 Months Plan"

    case "three_months":
      return "3 Months Plan"

    default:
      return "Premium Access"
  }
}

export default function AccessStatusCard({
  entitlement,
  profile,
}: AccessStatusCardProps) {
  const hasAccess =
    entitlement?.hasWatchAccess === true ||
    profile?.subscriptionStatus === "active"

  const accessType =
    entitlement?.accessType ||
    profile?.accessType ||
    null

  const isSubscription =
    accessType === "subscription" ||
    profile?.subscriptionStatus === "active"

  const isTrial = accessType === "trial"

  const expiryValue = isSubscription
    ? entitlement?.subscriptionExpiresAt ??
      profile?.subscriptionExpiresAt
    : entitlement?.trialExpiresAt ??
      profile?.trialExpiresAt

  const expiryMs = getMillis(expiryValue)

  const isExpired =
    expiryMs > 0 && expiryMs <= Date.now()

  if (!hasAccess || isExpired) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/5">
            <ShieldAlert className="h-6 w-6 text-white/50" />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-white/35">
              Access Status
            </p>

            <h3 className="mt-1 text-lg font-bold text-white">
              No Active Access
            </h3>

            <p className="mt-1 text-sm leading-5 text-white/45">
              Subscribe or activate an available trial
              to unlock watch access.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const title = isTrial
    ? "Free Trial Active"
    : getPlanName(
        entitlement?.subscriptionPlan ??
          profile?.subscriptionPlan,
      )

  return (
    <div className="overflow-hidden rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.06] p-5 backdrop-blur-xl">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/10">
          {isTrial ? (
            <Clock3 className="h-6 w-6 text-emerald-300" />
          ) : (
            <Crown className="h-6 w-6 text-emerald-300" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-medium uppercase tracking-wider text-emerald-300/60">
              Access Status
            </p>

            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-semibold text-emerald-300">
              <CheckCircle2 className="h-3 w-3" />
              ACTIVE
            </span>
          </div>

          <h3 className="mt-1 text-lg font-bold text-white">
            {title}
          </h3>

          <div className="mt-2 flex flex-wrap gap-2">
            {expiryMs > 0 && (
              <span className="rounded-full bg-black/20 px-3 py-1 text-xs text-white/60">
                {formatRemaining(
                  expiryMs - Date.now(),
                )}
              </span>
            )}

            {expiryMs > 0 && (
              <span className="rounded-full bg-black/20 px-3 py-1 text-xs text-white/40">
                Expires{" "}
                {new Date(expiryMs).toLocaleDateString(
                  "en-GB",
                  {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  },
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
            }
