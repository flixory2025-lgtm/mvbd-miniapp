"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Phone,
  User,
  Mail,
  Calendar,
  Settings,
  MessageCircle,
  Info,
  LogIn,
  LogOut,
  Bell,
  Crown,
  Copy,
  Check,
  Gift,
  Clock3,
  ShieldCheck,
  X,
} from "lucide-react"

import AuthModal from "@/components/auth-modal"
import AccessStatusCard from "@/components/access-status-card"
import { useAuth } from "@/components/auth-provider"
import { updateUserProfile } from "@/lib/user-profile"
import {
  subscribeToMyNotifications,
  markNotificationRead,
  type NotificationItem,
} from "@/lib/notifications";

interface ProfileData {
  name: string
  age: string
  email: string
  phone: string
  dateOfBirth: string
}

interface ProfilePageProps {
  onNavigate?: (page: "contact" | "about" | "settings") => void
}

const DEFAULT_PROFILE_IMAGE =
  "https://i.postimg.cc/HLmyFnnv/photo-2026-05-31-12-04-09-(2).jpg"

const socialLinks = [
  {
    id: "manager",
    title: "Manager",
    subtitle: "01945715199",
    icon: Phone,
    iconBg: "from-green-500 to-emerald-600",
    link: "tel:01945715199",
  },
  {
    id: "fb-page1",
    title: "Facebook Page 1",
    subtitle: "Visit our page",
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    iconBg: "from-blue-500 to-blue-700",
    link: "https://www.facebook.com/share/14V2B4K8zkC/",
  },
  {
    id: "fb-page2",
    title: "Facebook Page 2",
    subtitle: "Visit our page",
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    iconBg: "from-blue-500 to-blue-700",
    link: "https://www.facebook.com/share/1AWJvyVYZt/",
  },
  {
    id: "private-group",
    title: "Private Request Group",
    subtitle: "Join our private group",
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    iconBg: "from-blue-500 to-blue-700",
    link: "https://www.facebook.com/groups/963258709145001/?ref=share&mibextid=NSMWBT",
  },
  {
    id: "public-group",
    title: "Public Request Group",
    subtitle: "Join our public group",
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    iconBg: "from-blue-500 to-blue-700",
    link: "https://www.facebook.com/groups/733950559669339/?ref=share&mibextid=NSMWBT",
  },
  {
    id: "telegram",
    title: "Telegram Channels",
    subtitle: "Join all our channels",
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
    iconBg: "from-sky-500 to-blue-500",
    link: "https://t.me/addlist/KsvYsf4YPzliZjY1",
  },
]

function getTimestampMillis(value: unknown): number {
  if (!value) return 0

  if (value instanceof Date) {
    return value.getTime()
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toMillis" in value &&
    typeof (value as { toMillis?: unknown }).toMillis === "function"
  ) {
    return (value as { toMillis: () => number }).toMillis()
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "seconds" in value
  ) {
    const seconds = Number(
      (value as { seconds?: number }).seconds ?? 0
    )

    return seconds * 1000
  }

  if (typeof value === "string") {
    const parsed = new Date(value).getTime()
    return Number.isNaN(parsed) ? 0 : parsed
  }

  return 0
}

function calculateAge(dateOfBirth: string): string {
  if (!dateOfBirth) return ""

  const birthDate = new Date(dateOfBirth)

  if (Number.isNaN(birthDate.getTime())) {
    return ""
  }

  const today = new Date()

  let age = today.getFullYear() - birthDate.getFullYear()

  const monthDifference =
    today.getMonth() - birthDate.getMonth()

  if (
    monthDifference < 0 ||
    (monthDifference === 0 &&
      today.getDate() < birthDate.getDate())
  ) {
    age--
  }

  return age >= 0 ? String(age) : ""
}

function formatRemainingTime(milliseconds: number): string {
  if (milliseconds <= 0) {
    return "Expired"
  }

  const totalSeconds = Math.floor(milliseconds / 1000)

  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor(
    (totalSeconds % 86400) / 3600
  )
  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  )
  const seconds = totalSeconds % 60

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }

  return `${seconds}s`
}

function formatDate(value: unknown): string {
  const milliseconds = getTimestampMillis(value)

  if (!milliseconds) {
    return "—"
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(milliseconds))
}

export default function ProfilePage({
  onNavigate,
}: ProfilePageProps = {}) {
  const {
    user,
    profile: firestoreProfile,
    entitlement,
    loading: authLoading,
    signOut,
  } = useAuth()

  const [showAuthModal, setShowAuthModal] = useState(false)

  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    age: "",
    email: "",
    phone: "",
    dateOfBirth: "",
  })

  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const [profileImage, setProfileImage] =
    useState(DEFAULT_PROFILE_IMAGE)

  const [showSocialLinks, setShowSocialLinks] =
    useState(false)

  const [notifications, setNotifications] = useState<
    NotificationItem[]
  >([])

  const [showNotifications, setShowNotifications] =
    useState(false)

  const [copied, setCopied] = useState(false)

  const [now, setNow] = useState(Date.now())

  /*
   * Firebase profile → local profile state
   */
  useEffect(() => {
    if (firestoreProfile) {
      const age = calculateAge(
        firestoreProfile.dateOfBirth || ""
      )

      setProfile({
        name: firestoreProfile.name || "",
        age,
        email: firestoreProfile.email || "",
        phone:
          (firestoreProfile as unknown as {
            phone?: string
          }).phone || "",
        dateOfBirth:
          firestoreProfile.dateOfBirth || "",
      })

      setProfileImage(
        firestoreProfile.photoURL ||
          DEFAULT_PROFILE_IMAGE
      )

      return
    }

    if (!user) {
      const savedProfile =
        localStorage.getItem("mvbd_profile")

      if (savedProfile) {
        try {
          const saved = JSON.parse(savedProfile)

          setProfile((current) => ({
            ...current,
            ...saved,
          }))
        } catch {
          localStorage.removeItem("mvbd_profile")
        }
      }
    }
  }, [firestoreProfile, user])

  /*
   * Keep age synced with DOB.
   */
  useEffect(() => {
    if (!profile.dateOfBirth) return

    setProfile((current) => ({
      ...current,
      age: calculateAge(current.dateOfBirth),
    }))
  }, [profile.dateOfBirth])

  /*
   * Firebase realtime notifications.
   */
  useEffect(() => {
    if (!user?.uid) {
      setNotifications([])
      return
    }

    const unsubscribe =
      subscribeToMyNotifications(
        user.uid,
        (items) => {
          setNotifications(items)
        },
        (error) => {
          console.error(
            "Notification realtime listener error:",
            error
          )
        }
      )

    return () => {
      unsubscribe()
    }
  }, [user?.uid])

  /*
   * Update countdown every second.
   */
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [])

  /*
   * Unread notifications.
   */
  const unreadNotificationCount = useMemo(() => {
    return notifications.filter(
      (notification) => !notification.read
    ).length
  }, [notifications])

  /*
   * Referral code.
   *
   * Supports referralCode if it already exists
   * in the Firebase user profile.
   */
  const referralCode =
    (firestoreProfile as unknown as {
      referralCode?: string
    } | null)?.referralCode || ""

  const referralCount = Number(
    (firestoreProfile as unknown as {
      successfulReferrals?: number
      referralCount?: number
    } | null)?.successfulReferrals ??
      (firestoreProfile as unknown as {
        referralCount?: number
      } | null)?.referralCount ??
      0
  )

  /*
   * Subscription information.
   */
  const subscriptionPlan =
    firestoreProfile?.subscriptionPlan || ""

  const subscriptionExpiresAt =
    firestoreProfile?.subscriptionExpiresAt || null

  const trialExpiresAt =
    firestoreProfile?.trialExpiresAt || null

  const subscriptionExpiryMillis =
    getTimestampMillis(subscriptionExpiresAt)

  const trialExpiryMillis =
    getTimestampMillis(trialExpiresAt)

  const hasActiveSubscription =
    Boolean(
      entitlement?.hasPremiumAccess ||
        (
          entitlement?.subscriptionStatus ===
            "active" &&
          subscriptionExpiryMillis > now
        )
    )

  const hasActiveTrial =
    Boolean(
      entitlement?.isTrialActive ||
        (
          firestoreProfile?.accessType === "trial" &&
          trialExpiryMillis > now
        )
    )

  const accessExpiryMillis = hasActiveSubscription
    ? subscriptionExpiryMillis
    : hasActiveTrial
      ? trialExpiryMillis
      : 0

  const remainingMilliseconds =
    accessExpiryMillis - now

  const accessStatus = hasActiveSubscription
    ? "premium"
    : hasActiveTrial
      ? "trial"
      : "normal"

  const accessLabel =
    accessStatus === "premium"
      ? "MVBD PREMIUM"
      : accessStatus === "trial"
        ? "FREE TRIAL"
        : "NORMAL MEMBER"

  /*
   * Save profile.
   */
  const handleSave = async () => {
    const cleanName = profile.name.trim()

    if (!cleanName) {
      return
    }

    setSaving(true)

    try {
      if (user) {
        await updateUserProfile(user.uid, {
          name: cleanName,
          dateOfBirth:
            profile.dateOfBirth.trim(),
        })

        setProfile((current) => ({
          ...current,
          name: cleanName,
          age: calculateAge(
            current.dateOfBirth
          ),
        }))
      } else {
        const nextProfile = {
          ...profile,
          name: cleanName,
        }

        localStorage.setItem(
          "mvbd_profile",
          JSON.stringify(nextProfile)
        )

        setProfile(nextProfile)
      }

      setIsEditing(false)
    } catch (error) {
      console.error(
        "Failed to save profile:",
        error
      )
    } finally {
      setSaving(false)
    }
  }

  /*
   * Open external/social link.
   */
  const handleLinkClick = (link: string) => {
    window.open(
      link,
      "_blank",
      "noopener,noreferrer"
    )
  }

  /*
   * Mark notification as read.
   */
  const handleNotificationClick = async (
    notification: NotificationItem
  ) => {
    if (notification.read) return

    try {
      await markNotificationRead(
        notification.id
      )
    } catch (error) {
      console.error(
        "Failed to mark notification as read:",
        error
      )
    }
  }

  /*
   * Mark all visible notifications as read.
   */
  const handleMarkAllRead = async () => {
    const unread = notifications.filter(
      (notification) => !notification.read
    )

    if (!unread.length) return

    await Promise.allSettled(
      unread.map((notification) =>
        markNotificationRead(
          notification.id
        )
      )
    )
  }

  /*
   * Copy referral code.
   */
  const handleCopyReferral = async () => {
    if (!referralCode) return

    try {
      await navigator.clipboard.writeText(
        referralCode
      )

      setCopied(true)

      window.setTimeout(() => {
        setCopied(false)
      }, 1800)
    } catch (error) {
      console.error(
        "Failed to copy referral code:",
        error
      )
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a12] via-[#050508] to-[#020206] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-emerald-400/20" />

            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-400 animate-spin" />
          </div>

          <p className="text-sm text-slate-400">
            Loading profile...
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a12] via-[#050508] to-[#020206]">
        <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">

          {/* =========================
              PROFILE CARD
          ========================== */}
          <div className="relative overflow-hidden rounded-3xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl transition-all duration-300 hover:shadow-emerald-500/5">

            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5" />

            <div className="relative p-6">

              {/* Top actions */}
              <div className="mb-5 flex items-center justify-between gap-2">

                {user ? (
                  <button
                    type="button"
                    onClick={() =>
                      setShowNotifications(true)
                    }
                    className="relative flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"
                  >
                    <Bell className="size-4" />

                    <span>
                      Notifications
                    </span>

                    {unreadNotificationCount > 0 && (
                      <span className="min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {unreadNotificationCount >
                        99
                          ? "99+"
                          : unreadNotificationCount}
                      </span>
                    )}
                  </button>
                ) : (
                  <div />
                )}

                {user ? (
                  <button
                    type="button"
                    onClick={() =>
                      void signOut()
                    }
                    className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"
                  >
                    <LogOut className="size-4" />
                    Sign out
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setShowAuthModal(true)
                    }
                    className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300 transition hover:bg-emerald-500/20"
                  >
                    <LogIn className="size-4" />
                    Sign in
                  </button>
                )}
              </div>

              {/* Profile image */}
              <div className="flex flex-col items-center mb-6">

                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-500 blur-xl opacity-60 animate-pulse" />

                  <div className="relative w-24 h-24 rounded-full overflow-hidden ring-4 ring-white/20 shadow-2xl">
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover bg-gradient-to-br from-slate-800 to-slate-900"
                    />
                  </div>

                  {/* Status indicator */}
                  <div
                    className={`absolute bottom-0 right-1 w-6 h-6 rounded-full border-4 border-[#080810] flex items-center justify-center ${
                      accessStatus ===
                      "premium"
                        ? "bg-emerald-400"
                        : accessStatus ===
                            "trial"
                          ? "bg-purple-400"
                          : "bg-slate-500"
                    }`}
                  >
                    {accessStatus ===
                      "premium" && (
                      <Crown className="w-3 h-3 text-black" />
                    )}
                  </div>
                </div>

                <h2 className="text-white font-bold text-2xl mt-4 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                  {profile.name ||
                    "আপনার নাম"}
                </h2>

                {/* Access badge */}
                <div
                  className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold tracking-wide ${
                    accessStatus ===
                    "premium"
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-400/20"
                      : accessStatus ===
                          "trial"
                        ? "bg-purple-500/15 text-purple-300 border border-purple-400/20"
                        : "bg-white/5 text-slate-400 border border-white/10"
                  }`}
                >
                  {accessStatus ===
                    "premium" && (
                    <Crown className="w-3.5 h-3.5" />
                  )}

                  {accessStatus ===
                    "trial" && (
                    <Clock3 className="w-3.5 h-3.5" />
                  )}

                  {accessLabel}
                </div>
              </div>

              {/* Profile fields */}
              <div className="space-y-3">

                {/* Name */}
                <div className="group relative overflow-hidden rounded-xl backdrop-blur-md bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300">
                  <div className="flex items-center gap-2 p-3">
                    <User className="w-4 h-4 text-emerald-400 flex-shrink-0" />

                    <div className="flex-1">
                      <label className="text-slate-300 text-xs font-medium tracking-wide">
                        নাম
                      </label>

                      {isEditing ? (
                        <input
                          type="text"
                          value={profile.name}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              name: e.target.value,
                            })
                          }
                          className="w-full bg-transparent text-white text-sm outline-none placeholder:text-slate-500"
                          placeholder="আপনার নাম লিখুন"
                        />
                      ) : (
                        <p className="text-white text-sm">
                          {profile.name || (
                            <span className="text-slate-400">
                              সেট করা হয়নি
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Age */}
                <div className="group relative overflow-hidden rounded-xl backdrop-blur-md bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300">
                  <div className="flex items-center gap-2 p-3">
                    <Calendar className="w-4 h-4 text-emerald-400 flex-shrink-0" />

                    <div className="flex-1">
                      <label className="text-slate-300 text-xs font-medium tracking-wide">
                        বয়স
                      </label>

                      <p className="text-white text-sm">
                        {profile.age || (
                          <span className="text-slate-400">
                            সেট করা হয়নি
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="group relative overflow-hidden rounded-xl backdrop-blur-md bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 p-3">
                    <Mail className="w-4 h-4 text-emerald-400 flex-shrink-0" />

                    <div className="flex-1">
                      <label className="text-slate-300 text-xs font-medium tracking-wide">
                        Email
                      </label>

                      <p className="text-white text-sm break-all">
                        {profile.email || (
                          <span className="text-slate-400">
                            সেট করা হয়নি
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div className="group relative overflow-hidden rounded-xl backdrop-blur-md bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300">
                  <div className="flex items-center gap-2 p-3">
                    <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />

                    <div className="flex-1">
                      <label className="text-slate-300 text-xs font-medium tracking-wide">
                        Phone Number
                      </label>

                      {isEditing ? (
                        <input
                          type="tel"
                          value={profile.phone}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              phone: e.target.value,
                            })
                          }
                          className="w-full bg-transparent text-white text-sm outline-none placeholder:text-slate-500"
                          placeholder="আপনার নম্বর লিখুন"
                        />
                      ) : (
                        <p className="text-white text-sm">
                          {profile.phone || (
                            <span className="text-slate-400">
                              সেট করা হয়নি
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Date of birth */}
                {isEditing && (
                  <div className="group relative overflow-hidden rounded-xl backdrop-blur-md bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 p-3">
                      <Calendar className="w-4 h-4 text-emerald-400 flex-shrink-0" />

                      <div className="flex-1">
                        <label className="text-slate-300 text-xs font-medium tracking-wide">
                          Date of Birth
                        </label>

                        <input
                          type="date"
                          value={
                            profile.dateOfBirth
                          }
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              dateOfBirth:
                                e.target.value,
                            })
                          }
                          className="w-full mt-1 bg-transparent text-white text-sm outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Edit / Save */}
                <button
                  type="button"
                  disabled={saving}
                  onClick={
                    isEditing
                      ? () => void handleSave()
                      : () =>
                          setIsEditing(true)
                  }
                  className="relative w-full py-2.5 mt-4 rounded-xl font-bold text-white overflow-hidden group transition-all duration-300 transform active:scale-95 disabled:opacity-60"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-600 group-hover:from-emerald-600 group-hover:to-emerald-700 transition-all duration-300" />

                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <span className="relative text-sm tracking-wide">
                    {saving
                      ? "Saving..."
                      : isEditing
                        ? "Save Profile"
                        : "Edit Profile"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* =========================
              ACCOUNT STATUS
          ========================== */}
          {user && (
            <div className="relative overflow-hidden rounded-3xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5" />

              <div className="relative p-5">

                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <p className="text-white font-bold text-lg">
                      Account Status
                    </p>

                    <p className="text-slate-400 text-xs mt-1">
                      Firebase synced membership
                    </p>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
                      accessStatus ===
                      "premium"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : accessStatus ===
                            "trial"
                          ? "bg-purple-500/15 text-purple-300"
                          : "bg-white/5 text-slate-400"
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />

                    {accessStatus ===
                      "premium"
                      ? "ACTIVE"
                      : accessStatus ===
                          "trial"
                        ? "TRIAL"
                        : "NORMAL"}
                  </div>
                </div>

                {accessStatus !==
                "normal" ? (
                  <div className="rounded-2xl bg-black/20 border border-white/10 p-4">

                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                          accessStatus ===
                          "premium"
                            ? "bg-emerald-500/10"
                            : "bg-purple-500/10"
                        }`}
                      >
                        {accessStatus ===
                        "premium" ? (
                          <Crown className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Clock3 className="w-5 h-5 text-purple-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm">
                          {accessStatus ===
                          "premium"
                            ? subscriptionPlan ||
                              "Premium Subscription"
                            : "7 Day Free Trial"}
                        </p>

                        <p className="text-slate-400 text-xs mt-1">
                          Expires{" "}
                          {formatDate(
                            accessExpiryMillis
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-xs">
                          Remaining
                        </span>

                        <span
                          className={`font-bold text-sm ${
                            remainingMilliseconds >
                            0
                              ? "text-emerald-300"
                              : "text-red-400"
                          }`}
                        >
                          {formatRemainingTime(
                            remainingMilliseconds
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-black/20 border border-white/10 p-4">
                    <p className="text-white font-semibold text-sm">
                      No active access
                    </p>

                    <p className="text-slate-400 text-xs mt-1">
                      Choose a subscription or
                      claim your available trial
                      from the subscription page.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Existing access card */}
          <AccessStatusCard />

          {/* =========================
              MVBD ID + REFERRAL
          ========================== */}
          {user && (
            <div className="relative overflow-hidden rounded-3xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-emerald-500/5" />

              <div className="relative p-5">

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
                    <Gift className="w-5 h-5 text-emerald-400" />
                  </div>

                  <div>
                    <h3 className="text-white font-bold">
                      MVBD Membership
                    </h3>

                    <p className="text-slate-400 text-xs">
                      Your account information
                    </p>
                  </div>
                </div>

                {/* MVBD ID */}
                <div className="rounded-2xl bg-black/20 border border-white/10 p-4">
                  <p className="text-slate-400 text-[11px] uppercase tracking-wider">
                    MVBD ID
                  </p>

                  <p className="text-white font-bold text-lg mt-1 break-all">
                    {firestoreProfile?.mvbdId ||
                      "Generating..."}
                  </p>
                </div>

                {/* Referral */}
                <div className="mt-3 rounded-2xl bg-black/20 border border-white/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-slate-400 text-[11px] uppercase tracking-wider">
                        Referral Code
                      </p>

                      <p className="text-white font-bold text-base mt-1 break-all">
                        {referralCode ||
                          "Not available"}
                      </p>
                    </div>

                    {referralCode && (
                      <button
                        type="button"
                        onClick={() =>
                          void handleCopyReferral()
                        }
                        className="shrink-0 w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-slate-300 hover:bg-white/10 transition"
                        aria-label="Copy referral code"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Referral count */}
                <div className="mt-3 flex items-center justify-between rounded-2xl bg-black/20 border border-white/10 px-4 py-3">
                  <div>
                    <p className="text-white text-sm font-semibold">
                      Successful Referrals
                    </p>

                    <p className="text-slate-400 text-xs mt-0.5">
                      Updated from Firebase
                    </p>
                  </div>

                  <span className="text-emerald-300 font-bold text-lg">
                    {referralCount}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* =========================
              MENU
          ========================== */}
          <div className="relative overflow-hidden rounded-3xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl transition-all duration-300 hover:shadow-cyan-500/5">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-emerald-500/5" />

            <div className="relative p-6">

              <h3 className="text-white font-bold text-2xl mb-6 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                Menu
              </h3>

              <div className="space-y-2.5">

                {/* Contact */}
                <button
                  type="button"
                  onClick={() =>
                    onNavigate?.("contact")
                  }
                  className="group w-full flex items-center gap-3 rounded-xl backdrop-blur-md bg-white/5 border border-white/10 hover:bg-white/10 p-3 transition-all duration-300 active:scale-[0.98]"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-300">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>

                  <div className="text-left flex-1">
                    <p className="text-white font-semibold text-sm">
                      Contact Us
                    </p>

                    <p className="text-slate-400 text-xs">
                      Get in touch with us
                    </p>
                  </div>

                  <span className="text-white/60 group-hover:text-white transition-colors">
                    →
                  </span>
                </button>

                {/* About */}
                <button
                  type="button"
                  onClick={() =>
                    onNavigate?.("about")
                  }
                  className="group w-full flex items-center gap-3 rounded-xl backdrop-blur-md bg-white/5 border border-white/10 hover:bg-white/10 p-3 transition-all duration-300 active:scale-[0.98]"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-300">
                    <Info className="w-5 h-5 text-white" />
                  </div>

                  <div className="text-left flex-1">
                    <p className="text-white font-semibold text-sm">
                      About Us
                    </p>

                    <p className="text-slate-400 text-xs">
                      Learn about our platform
                    </p>
                  </div>

                  <span className="text-white/60 group-hover:text-white transition-colors">
                    →
                  </span>
                </button>

                {/* Settings */}
                <button
                  type="button"
                  onClick={() =>
                    onNavigate?.("settings")
                  }
                  className="group w-full flex items-center gap-3 rounded-xl backdrop-blur-md bg-white/5 border border-white/10 hover:bg-white/10 p-3 transition-all duration-300 active:scale-[0.98]"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-300">
                    <Settings className="w-5 h-5 text-white" />
                  </div>

                  <div className="text-left flex-1">
                    <p className="text-white font-semibold text-sm">
                      Settings
                    </p>

                    <p className="text-slate-400 text-xs">
                      Customize your experience
                    </p>
                  </div>

                  <span className="text-white/60 group-hover:text-white transition-colors">
                    →
                  </span>
                </button>

                {/* Social links */}
                <button
                  type="button"
                  onClick={() =>
                    setShowSocialLinks(
                      (current) => !current
                    )
                  }
                  className="group w-full flex items-center gap-3 rounded-xl backdrop-blur-md bg-white/5 border border-white/10 hover:bg-white/10 p-3 transition-all duration-300 active:scale-[0.98]"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-300">
                    <Phone className="w-5 h-5 text-white" />
                  </div>

                  <div className="text-left flex-1">
                    <p className="text-white font-semibold text-sm">
                      MVBD Social & Links
                    </p>

                    <p className="text-slate-400 text-xs">
                      Facebook, Telegram & more
                    </p>
                  </div>

                  <span className="text-white/60">
                    {showSocialLinks
                      ? "−"
                      : "+"}
                  </span>
                </button>

                {showSocialLinks && (
                  <div className="pt-1 space-y-2">
                    {socialLinks.map(
                      (item) => {
                        const Icon =
                          item.icon

                        return (
                          <button
                            type="button"
                            key={item.id}
                            onClick={() =>
                              handleLinkClick(
                                item.link
                              )
                            }
                            className="w-full flex items-center gap-3 rounded-xl bg-black/20 border border-white/10 p-3 hover:bg-white/5 transition"
                          >
                            <div
                              className={`w-9 h-9 rounded-full bg-gradient-to-br ${item.iconBg} flex items-center justify-center`}
                            >
                              <Icon />
                            </div>

                            <div className="flex-1 text-left">
                              <p className="text-white text-sm font-semibold">
                                {item.title}
                              </p>

                              <p className="text-slate-400 text-xs">
                                {item.subtitle}
                              </p>
                            </div>

                            <span className="text-white/40">
                              ↗
                            </span>
                          </button>
                        )
                      }
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-center text-slate-400 text-sm">
              © 2025 MoviesVerse.
              সর্বাধিকার সংরক্ষিত. All rights
              reserved.
            </p>
          </div>
        </div>
      </div>

      {/* =========================
          NOTIFICATION MODAL
      ========================== */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md"
          onClick={() =>
            setShowNotifications(false)
          }
        >
          <div
            className="w-full max-w-lg max-h-[85vh] overflow-hidden rounded-3xl border border-white/10 bg-[#0b0c14]/95 shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-emerald-400" />
              </div>

              <div className="flex-1">
                <h3 className="text-white font-bold">
                  Notifications
                </h3>

                <p className="text-slate-400 text-xs">
                  {unreadNotificationCount > 0
                    ? `${unreadNotificationCount} unread notification${
                        unreadNotificationCount >
                        1
                          ? "s"
                          : ""
                      }`
                    : "You're all caught up"}
                </p>
              </div>

              {unreadNotificationCount >
                0 && (
                <button
                  type="button"
                  onClick={() =>
                    void handleMarkAllRead()
                  }
                  className="text-[11px] text-emerald-300 hover:text-emerald-200 mr-2"
                >
                  Mark all read
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  setShowNotifications(false)
                }
                className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:bg-white/10"
                aria-label="Close notifications"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Notifications */}
            <div className="overflow-y-auto max-h-[calc(85vh-82px)] p-3">

              {notifications.length ===
              0 ? (
                <div className="py-14 text-center">
                  <div className="w-14 h-14 mx-auto rounded-full bg-white/5 flex items-center justify-center">
                    <Bell className="w-6 h-6 text-slate-500" />
                  </div>

                  <p className="text-white font-semibold mt-4">
                    No notifications
                  </p>

                  <p className="text-slate-500 text-xs mt-1">
                    New updates from MVBD will
                    appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map(
                    (notification) => (
                      <button
                        type="button"
                        key={notification.id}
                        onClick={() =>
                          void handleNotificationClick(
                            notification
                          )
                        }
                        className={`w-full text-left rounded-2xl border p-4 transition ${
                          notification.read
                            ? "bg-white/[0.025] border-white/5"
                            : "bg-emerald-500/[0.06] border-emerald-400/15"
                        }`}
                      >
                        <div className="flex gap-3">

                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              notification.type ===
                              "subscription"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : notification.type ===
                                    "payment"
                                  ? "bg-orange-500/10 text-orange-400"
                                  : notification.type ===
                                      "referral"
                                    ? "bg-purple-500/10 text-purple-400"
                                    : "bg-white/5 text-slate-300"
                            }`}
                          >
                            {notification.type ===
                            "subscription" ? (
                              <Crown className="w-4 h-4" />
                            ) : notification.type ===
                              "referral" ? (
                              <Gift className="w-4 h-4" />
                            ) : (
                              <Bell className="w-4 h-4" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2">
                              <h4 className="text-white text-sm font-semibold flex-1">
                                {
                                  notification.title
                                }
                              </h4>

                              {!notification.read && (
                                <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                              )}
                            </div>

                            <p className="text-slate-400 text-xs leading-5 mt-1">
                              {
                                notification.message
                              }
                            </p>

                            <p className="text-slate-600 text-[10px] mt-2">
                              {formatDate(
                                notification.createdAt
                              )}
                            </p>
                          </div>
                        </div>
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Auth */}
      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
      />

      {/* Global CSS */}
      <style jsx global>{`
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 0.6;
          }

          50% {
            opacity: 0.3;
          }
        }

        .animate-pulse {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1)
            infinite;
        }
      `}</style>
    </>
  )
}
