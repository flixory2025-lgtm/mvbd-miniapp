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
  Send,
  Loader2,
} from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { updateUserProfile } from "@/lib/user-profile"
import { db, auth } from "@/lib/firebase"

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore"

import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth"

interface ProfileData {
  name: string
  age: string
  email: string
  phone: string
  dateOfBirth: string
}

interface ProfilePageProps {
  onNavigate?: (
    page: "contact" | "about" | "settings"
  ) => void
}

interface NotificationItem {
  id: string
  uid?: string
  title: string
  message: string
  type?: string
  read?: boolean
  createdAt?: unknown
}

interface SupportMessage {
  id: string
  uid?: string
  senderUid?: string
  senderName?: string
  senderRole?: "user" | "admin"
  message: string
  createdAt?: unknown
}

interface ExtendedProfile {
  uid?: string
  mvbdId?: string
  name?: string
  email?: string
  photoURL?: string
  dateOfBirth?: string
  phone?: string

  accessType?: "trial" | "subscription" | null
  subscriptionStatus?: string | null
  subscriptionPlan?: string | null

  subscriptionStartedAt?: unknown
  subscriptionExpiresAt?: unknown

  trialStartedAt?: unknown
  trialExpiresAt?: unknown

  referralCode?: string
  promoCode?: string
  referralCount?: number
  successfulReferrals?: number
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
    icon: "facebook",
    iconBg: "from-blue-500 to-blue-700",
    link: "https://www.facebook.com/share/14V2B4K8zkC/",
  },
  {
    id: "fb-page2",
    title: "Facebook Page 2",
    subtitle: "Visit our page",
    icon: "facebook",
    iconBg: "from-blue-500 to-blue-700",
    link: "https://www.facebook.com/share/1AWJvyVYZt/",
  },
  {
    id: "private-group",
    title: "Private Request Group",
    subtitle: "Join our private group",
    icon: "facebook",
    iconBg: "from-blue-500 to-blue-700",
    link: "https://www.facebook.com/groups/963258709145001/?ref=share&mibextid=NSMWBT",
  },
  {
    id: "public-group",
    title: "Public Request Group",
    subtitle: "Join our public group",
    icon: "facebook",
    iconBg: "from-blue-500 to-blue-700",
    link: "https://www.facebook.com/groups/733950559669339/?ref=share&mibextid=NSMWBT",
  },
  {
    id: "telegram",
    title: "Telegram Channels",
    subtitle: "Join all our channels",
    icon: "telegram",
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
    typeof (value as { toMillis?: unknown }).toMillis ===
      "function"
  ) {
    return (
      value as {
        toMillis: () => number
      }
    ).toMillis()
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "seconds" in value
  ) {
    return (
      Number(
        (value as { seconds?: number }).seconds ?? 0
      ) * 1000
    )
  }

  if (typeof value === "string") {
    const parsed = new Date(value).getTime()

    return Number.isNaN(parsed) ? 0 : parsed
  }

  if (typeof value === "number") {
    return value
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

  let age =
    today.getFullYear() -
    birthDate.getFullYear()

  const monthDifference =
    today.getMonth() -
    birthDate.getMonth()

  if (
    monthDifference < 0 ||
    (
      monthDifference === 0 &&
      today.getDate() < birthDate.getDate()
    )
  ) {
    age--
  }

  return age >= 0 ? String(age) : ""
}

function formatRemainingTime(
  milliseconds: number
): string {
  if (milliseconds <= 0) {
    return "Expired"
  }

  const totalSeconds = Math.floor(
    milliseconds / 1000
  )

  const days = Math.floor(
    totalSeconds / 86400
  )

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
  const milliseconds =
    getTimestampMillis(value)

  if (!milliseconds) {
    return "—"
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(new Date(milliseconds))
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

  const liveProfile =
    firestoreProfile as ExtendedProfile | null

  const [profile, setProfile] =
    useState<ProfileData>({
      name: "",
      age: "",
      email: "",
      phone: "",
      dateOfBirth: "",
    })

  const [isEditing, setIsEditing] =
    useState(false)

  const [saving, setSaving] =
    useState(false)

  const [profileImage, setProfileImage] =
    useState(DEFAULT_PROFILE_IMAGE)

  const [showSocialLinks, setShowSocialLinks] =
    useState(false)

  const [notifications, setNotifications] =
    useState<NotificationItem[]>([])

  const [showNotifications, setShowNotifications] =
    useState(false)

  const [copied, setCopied] =
    useState(false)

  const [now, setNow] =
    useState(Date.now())

  const [showSupport, setShowSupport] =
    useState(false)

  const [supportMessages, setSupportMessages] =
    useState<SupportMessage[]>([])

  const [supportText, setSupportText] =
    useState("")

  const [sendingSupport, setSendingSupport] =
    useState(false)

  const [showLogin, setShowLogin] =
    useState(false)

  const [loginEmail, setLoginEmail] =
    useState("")

  const [loginPassword, setLoginPassword] =
    useState("")

  const [loginLoading, setLoginLoading] =
    useState(false)

  const [loginError, setLoginError] =
    useState("")

  /*
   * Firebase profile → local state
   */
  useEffect(() => {
    if (!liveProfile) {
      return
    }

    const dateOfBirth =
      liveProfile.dateOfBirth || ""

    setProfile({
      name: liveProfile.name || "",
      age: calculateAge(dateOfBirth),
      email:
        liveProfile.email ||
        user?.email ||
        "",
      phone:
        liveProfile.phone || "",
      dateOfBirth,
    })

    setProfileImage(
      liveProfile.photoURL ||
        user?.photoURL ||
        DEFAULT_PROFILE_IMAGE
    )
  }, [
    liveProfile,
    user,
  ])

  /*
   * Keep age synced with DOB.
   */
  useEffect(() => {
    if (!profile.dateOfBirth) {
      return
    }

    setProfile((current) => ({
      ...current,
      age: calculateAge(
        current.dateOfBirth
      ),
    }))
  }, [
    profile.dateOfBirth,
  ])

  /*
   * Firebase realtime notifications.
   *
   * Direct Firestore listener is intentionally used here
   * so this page does not depend on a separate
   * notifications helper function.
   */
  useEffect(() => {
    if (!user?.uid) {
      setNotifications([])
      return
    }

    const notificationsQuery =
      query(
        collection(
          db,
          "notifications"
        ),
        where(
          "uid",
          "==",
          user.uid
        ),
        limit(50)
      )

    const unsubscribe =
      onSnapshot(
        notificationsQuery,
        (snapshot) => {
          const items =
            snapshot.docs.map(
              (item) => {
                const data =
                  item.data()

                return {
                  id: item.id,
                  uid: data.uid,
                  title:
                    data.title ||
                    "MVBD Notification",
                  message:
                    data.message ||
                    "",
                  type:
                    data.type ||
                    "system",
                  read:
                    Boolean(data.read),
                  createdAt:
                    data.createdAt,
                }
              }
            )

          items.sort(
            (a, b) =>
              getTimestampMillis(
                b.createdAt
              ) -
              getTimestampMillis(
                a.createdAt
              )
          )

          setNotifications(
            items
          )
        },
        (error) => {
          console.error(
            "Notification listener:",
            error
          )

          setNotifications([])
        }
      )

    return () => {
      unsubscribe()
    }
  }, [
    user?.uid,
  ])

  /*
   * Firebase realtime support chat.
   */
  useEffect(() => {
    if (!user?.uid) {
      setSupportMessages([])
      return
    }

    const supportQuery =
      query(
        collection(
          db,
          "supportMessages"
        ),
        where(
          "uid",
          "==",
          user.uid
        ),
        limit(100)
      )

    const unsubscribe =
      onSnapshot(
        supportQuery,
        (snapshot) => {
          const messages =
            snapshot.docs.map(
              (item) => {
                const data =
                  item.data()

                return {
                  id: item.id,
                  uid: data.uid,
                  senderUid:
                    data.senderUid,
                  senderName:
                    data.senderName,
                  senderRole:
                    data.senderRole ||
                    "user",
                  message:
                    data.message ||
                    "",
                  createdAt:
                    data.createdAt,
                }
              }
            )

          messages.sort(
            (a, b) =>
              getTimestampMillis(
                a.createdAt
              ) -
              getTimestampMillis(
                b.createdAt
              )
          )

          setSupportMessages(
            messages
          )
        },
        (error) => {
          console.error(
            "Support listener:",
            error
          )
        }
      )

    return () => {
      unsubscribe()
    }
  }, [
    user?.uid,
  ])

  /*
   * Countdown.
   */
  useEffect(() => {
    const timer =
      window.setInterval(() => {
        setNow(
          Date.now()
        )
      }, 1000)

    return () => {
      window.clearInterval(
        timer
      )
    }
  }, [])

  /*
   * Unread notifications.
   */
  const unreadNotificationCount =
    useMemo(() => {
      return notifications.filter(
        (item) =>
          !item.read
      ).length
    }, [
      notifications,
    ])

  /*
   * Referral.
   */
  const referralCode =
    liveProfile?.referralCode ||
    liveProfile?.promoCode ||
    ""

  const referralCount =
    Number(
      liveProfile
        ?.successfulReferrals ??
        liveProfile
          ?.referralCount ??
        0
    )

  /*
   * Subscription.
   */
  const subscriptionPlan =
    liveProfile
      ?.subscriptionPlan ||
    ""

  const subscriptionExpiryMillis =
    getTimestampMillis(
      liveProfile
        ?.subscriptionExpiresAt
    )

  const trialExpiryMillis =
    getTimestampMillis(
      liveProfile
        ?.trialExpiresAt
    )

  const hasActiveSubscription =
    Boolean(
      entitlement?.hasPremiumAccess ||
      (
        liveProfile
          ?.subscriptionStatus ===
          "active" &&
        subscriptionExpiryMillis >
          now
      )
    )

  const hasActiveTrial =
    Boolean(
      entitlement?.isTrialActive ||
      (
        liveProfile
          ?.accessType ===
          "trial" &&
        trialExpiryMillis >
          now
      )
    )

  const accessExpiryMillis =
    hasActiveSubscription
      ? subscriptionExpiryMillis
      : hasActiveTrial
        ? trialExpiryMillis
        : 0

  const remainingMilliseconds =
    accessExpiryMillis -
    now

  const accessStatus =
    hasActiveSubscription
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
    const cleanName =
      profile.name.trim()

    if (!cleanName) {
      return
    }

    setSaving(true)

    try {
      if (user?.uid) {
        await updateUserProfile(
          user.uid,
          {
            name: cleanName,
            dateOfBirth:
              profile.dateOfBirth.trim(),
          }
        )

        /*
         * Phone is an additional Firebase
         * profile field.
         */
        try {
          await updateDoc(
            doc(
              db,
              "users",
              user.uid
            ),
            {
              phone:
                profile.phone.trim(),
            }
          )
        } catch (phoneError) {
          console.warn(
            "Phone field could not be updated:",
            phoneError
          )
        }
      } else {
        const localProfile = {
          ...profile,
          name: cleanName,
        }

        localStorage.setItem(
          "mvbd_profile",
          JSON.stringify(
            localProfile
          )
        )

        setProfile(
          localProfile
        )
      }

      setIsEditing(false)
    } catch (error) {
      console.error(
        "Profile save error:",
        error
      )
    } finally {
      setSaving(false)
    }
  }

  /*
   * Copy referral.
   */
  const handleCopyReferral =
    async () => {
      if (!referralCode) {
        return
      }

      try {
        await navigator.clipboard.writeText(
          referralCode
        )

        setCopied(true)

        window.setTimeout(
          () => {
            setCopied(false)
          },
          1800
        )
      } catch (error) {
        console.error(
          "Copy error:",
          error
        )
      }
    }

  /*
   * Mark notification read.
   */
  const handleNotificationClick =
    async (
      notification: NotificationItem
    ) => {
      if (
        notification.read
      ) {
        return
      }

      try {
        await updateDoc(
          doc(
            db,
            "notifications",
            notification.id
          ),
          {
            read: true,
            readAt:
              serverTimestamp(),
          }
        )
      } catch (error) {
        console.error(
          "Notification read error:",
          error
        )
      }
    }

  /*
   * Mark all notifications read.
   */
  const handleMarkAllRead =
    async () => {
      const unread =
        notifications.filter(
          (item) =>
            !item.read
        )

      await Promise.allSettled(
        unread.map(
          (item) =>
            updateDoc(
              doc(
                db,
                "notifications",
                item.id
              ),
              {
                read: true,
                readAt:
                  serverTimestamp(),
              }
            )
        )
      )
    }

  /*
   * Send support message.
   */
  const handleSendSupport =
    async () => {
      const message =
        supportText.trim()

      if (
        !message ||
        !user?.uid ||
        sendingSupport
      ) {
        return
      }

      setSendingSupport(true)

      try {
        await addDoc(
          collection(
            db,
            "supportMessages"
          ),
          {
            uid:
              user.uid,
            senderUid:
              user.uid,
            senderName:
              liveProfile
                ?.name ||
              user.displayName ||
              "MVBD User",
            senderRole:
              "user",
            message,
            createdAt:
              serverTimestamp(),
          }
        )

        setSupportText("")
      } catch (error) {
        console.error(
          "Support message error:",
          error
        )
      } finally {
        setSendingSupport(
          false
        )
      }
    }

  /*
   * Login.
   */
  const handleLogin =
    async () => {
      const email =
        loginEmail.trim()

      if (
        !email ||
        !loginPassword
      ) {
        setLoginError(
          "Email এবং password দিন।"
        )
        return
      }

      setLoginLoading(true)
      setLoginError("")

      try {
        await signInWithEmailAndPassword(
          auth,
          email,
          loginPassword
        )

        setShowLogin(false)
        setLoginEmail("")
        setLoginPassword("")
      } catch (error) {
        console.error(
          "Login error:",
          error
        )

        setLoginError(
          "Email অথবা password সঠিক নয়।"
        )
      } finally {
        setLoginLoading(
          false
        )
      }
    }

  /*
   * Google login.
   */
  const handleGoogleLogin =
    async () => {
      setLoginLoading(true)
      setLoginError("")

      try {
        const provider =
          new GoogleAuthProvider()

        await signInWithPopup(
          auth,
          provider
        )

        setShowLogin(false)
      } catch (error) {
        console.error(
          "Google login error:",
          error
        )

        setLoginError(
          "Google sign in সম্পন্ন করা যায়নি।"
        )
      } finally {
        setLoginLoading(
          false
        )
      }
    }

  /*
   * External links.
   */
  const handleLinkClick =
    (link: string) => {
      window.open(
        link,
        "_blank",
        "noopener,noreferrer"
      )
    }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a12] via-[#050508] to-[#020206] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-white/10" />

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

          {/* PROFILE */}
          <div className="relative overflow-hidden rounded-3xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5" />

            <div className="relative p-6">

              <div className="mb-5 flex items-center justify-between gap-2">

                {user ? (
                  <button
                    type="button"
                    onClick={() =>
                      setShowNotifications(
                        true
                      )
                    }
                    className="relative flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10 transition"
                  >
                    <Bell className="size-4" />

                    <span>
                      Notifications
                    </span>

                    {unreadNotificationCount >
                      0 && (
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
                    className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10 transition"
                  >
                    <LogOut className="size-4" />
                    Sign out
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setShowLogin(true)
                    }
                    className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300 hover:bg-emerald-500/20 transition"
                  >
                    <LogIn className="size-4" />
                    Sign in
                  </button>
                )}
              </div>

              {/* IMAGE */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative">

                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-500 blur-xl opacity-50 animate-pulse" />

                  <div className="relative w-24 h-24 rounded-full overflow-hidden ring-4 ring-white/20 shadow-2xl">
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover bg-slate-900"
                    />
                  </div>

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

                <h2 className="text-white font-bold text-2xl mt-4">
                  {profile.name ||
                    "আপনার নাম"}
                </h2>

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

              {/* FIELDS */}
              <div className="space-y-3">

                {/* NAME */}
                <div className="rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 p-3">
                    <User className="w-4 h-4 text-emerald-400" />

                    <div className="flex-1">
                      <label className="text-slate-300 text-xs">
                        নাম
                      </label>

                      {isEditing ? (
                        <input
                          type="text"
                          value={profile.name}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              name:
                                e.target.value,
                            })
                          }
                          className="w-full bg-transparent text-white text-sm outline-none"
                        />
                      ) : (
                        <p className="text-white text-sm">
                          {profile.name ||
                            "সেট করা হয়নি"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* AGE */}
                <div className="rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 p-3">
                    <Calendar className="w-4 h-4 text-emerald-400" />

                    <div>
                      <label className="text-slate-300 text-xs">
                        বয়স
                      </label>

                      <p className="text-white text-sm">
                        {profile.age ||
                          "সেট করা হয়নি"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* EMAIL */}
                <div className="rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 p-3">
                    <Mail className="w-4 h-4 text-emerald-400" />

                    <div className="flex-1 min-w-0">
                      <label className="text-slate-300 text-xs">
                        Email
                      </label>

                      <p className="text-white text-sm break-all">
                        {profile.email ||
                          "সেট করা হয়নি"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* PHONE */}
                <div className="rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 p-3">
                    <Phone className="w-4 h-4 text-emerald-400" />

                    <div className="flex-1">
                      <label className="text-slate-300 text-xs">
                        Phone Number
                      </label>

                      {isEditing ? (
                        <input
                          type="tel"
                          value={profile.phone}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              phone:
                                e.target.value,
                            })
                          }
                          className="w-full bg-transparent text-white text-sm outline-none"
                        />
                      ) : (
                        <p className="text-white text-sm">
                          {profile.phone ||
                            "সেট করা হয়নি"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* DOB */}
                {isEditing && (
                  <div className="rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 p-3">
                      <Calendar className="w-4 h-4 text-emerald-400" />

                      <div className="flex-1">
                        <label className="text-slate-300 text-xs">
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

                <button
                  type="button"
                  disabled={saving}
                  onClick={
                    isEditing
                      ? () =>
                          void handleSave()
                      : () =>
                          setIsEditing(
                            true
                          )
                  }
                  className="w-full py-2.5 mt-4 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 active:scale-[0.98] transition disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : isEditing
                      ? "Save Profile"
                      : "Edit Profile"}
                </button>
              </div>
            </div>
          </div>

          {/* ACCOUNT STATUS */}
          {user && (
            <div className="relative overflow-hidden rounded-3xl bg-white/5 border border-white/10 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5" />

              <div className="relative p-5">

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-white font-bold text-lg">
                      Account Status
                    </p>

                    <p className="text-slate-400 text-xs mt-1">
                      Firebase synced membership
                    </p>
                  </div>

                  <div
                    className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                      accessStatus ===
                      "premium"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : accessStatus ===
                            "trial"
                          ? "bg-purple-500/15 text-purple-300"
                          : "bg-white/5 text-slate-400"
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 inline mr-1" />

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

                      <div className="flex-1">
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

                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
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
                ) : (
                  <div className="rounded-2xl bg-black/20 border border-white/10 p-4">
                    <p className="text-white font-semibold text-sm">
                      No active access
                    </p>

                    <p className="text-slate-400 text-xs mt-1">
                      Your account currently has no active subscription or trial.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MEMBERSHIP */}
          {user && (
            <div className="relative overflow-hidden rounded-3xl bg-white/5 border border-white/10 shadow-2xl">
              <div className="relative p-5">

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
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

                  <p className="text-white font-bold text-lg mt-1">
                    {liveProfile?.mvbdId ||
                      "Generating..."}
                  </p>
                </div>

                {/* REFERRAL */}
                <div className="mt-3 rounded-2xl bg-black/20 border border-white/10 p-4">
                  <div className="flex items-center justify-between gap-3">

                    <div className="min-w-0">
                      <p className="text-slate-400 text-[11px] uppercase tracking-wider">
                        Referral Code
                      </p>

                      <p className="text-white font-bold text-base mt-1">
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
                        className="w-10 h-10 shrink-0 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center"
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

                {/* REFERRALS */}
                <div className="mt-3 flex items-center justify-between rounded-2xl bg-black/20 border border-white/10 px-4 py-3">
                  <div>
                    <p className="text-white text-sm font-semibold">
                      Successful Referrals
                    </p>

                    <p className="text-slate-400 text-xs mt-0.5">
                      Firebase synced
                    </p>
                  </div>

                  <span className="text-emerald-300 font-bold text-lg">
                    {referralCount}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* MENU */}
          <div className="relative overflow-hidden rounded-3xl bg-white/5 border border-white/10 shadow-2xl">
            <div className="relative p-6">

              <h3 className="text-white font-bold text-2xl mb-6">
                Menu
              </h3>

              <div className="space-y-2.5">

                <button
                  type="button"
                  onClick={() =>
                    onNavigate?.(
                      "contact"
                    )
                  }
                  className="group w-full flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-3 hover:bg-white/10 transition"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
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

                  <span className="text-white/50">
                    →
                  </span>
                </button>

                {/* SUPPORT CHAT */}
                {user && (
                  <button
                    type="button"
                    onClick={() =>
                      setShowSupport(true)
                    }
                    className="group w-full flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-3 hover:bg-white/10 transition"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>

                    <div className="text-left flex-1">
                      <p className="text-white font-semibold text-sm">
                        Live Support
                      </p>

                      <p className="text-slate-400 text-xs">
                        Chat with MVBD support team
                      </p>
                    </div>

                    <span className="text-emerald-400 text-xs font-bold">
                      LIVE
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    onNavigate?.(
                      "about"
                    )
                  }
                  className="group w-full flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-3 hover:bg-white/10 transition"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
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

                  <span className="text-white/50">
                    →
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onNavigate?.(
                      "settings"
                    )
                  }
                  className="group w-full flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-3 hover:bg-white/10 transition"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
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

                  <span className="text-white/50">
                    →
                  </span>
                </button>

                {/* SOCIAL */}
                <button
                  type="button"
                  onClick={() =>
                    setShowSocialLinks(
                      (current) =>
                        !current
                    )
                  }
                  className="group w-full flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-3 hover:bg-white/10 transition"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
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
                      (item) => (
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
                            {item.icon ===
                            Phone ? (
                              <Phone className="w-5 h-5 text-white" />
                            ) : item.icon ===
                              "telegram" ? (
                              <Send className="w-5 h-5 text-white" />
                            ) : (
                              <span className="text-white font-bold">
                                f
                              </span>
                            )}
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
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10">
            <p className="text-center text-slate-400 text-sm">
              © 2025 MoviesVerse.
              সর্বাধিকার সংরক্ষিত. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* =========================
          NOTIFICATIONS
      ========================== */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3 bg-black/70 backdrop-blur-md"
          onClick={() =>
            setShowNotifications(
              false
            )
          }
        >
          <div
            className="w-full max-w-lg max-h-[85vh] overflow-hidden rounded-3xl border border-white/10 bg-[#0b0c14]/95 shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">

              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-emerald-400" />
              </div>

              <div className="flex-1">
                <h3 className="text-white font-bold">
                  Notifications
                </h3>

                <p className="text-slate-400 text-xs">
                  {unreadNotificationCount >
                  0
                    ? `${unreadNotificationCount} unread`
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
                  className="text-[11px] text-emerald-300 mr-2"
                >
                  Mark all read
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  setShowNotifications(
                    false
                  )
                }
                className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-slate-300" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(85vh-82px)] p-3">
              {notifications.length ===
              0 ? (
                <div className="py-14 text-center">
                  <Bell className="w-7 h-7 text-slate-500 mx-auto" />

                  <p className="text-white font-semibold mt-4">
                    No notifications
                  </p>

                  <p className="text-slate-500 text-xs mt-1">
                    New MVBD updates will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map(
                    (
                      notification
                    ) => (
                      <button
                        type="button"
                        key={
                          notification.id
                        }
                        onClick={() =>
                          void handleNotificationClick(
                            notification
                          )
                        }
                        className={`w-full text-left rounded-2xl border p-4 ${
                          notification.read
                            ? "bg-white/[0.025] border-white/5"
                            : "bg-emerald-500/[0.06] border-emerald-400/15"
                        }`}
                      >
                        <div className="flex gap-3">

                          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                            {notification.type ===
                            "referral" ? (
                              <Gift className="w-4 h-4 text-purple-400" />
                            ) : notification.type ===
                              "subscription" ? (
                              <Crown className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Bell className="w-4 h-4 text-slate-300" />
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

      {/* =========================
          SUPPORT CHAT
      ========================== */}
      {showSupport &&
        user && (
          <div
            className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-3 bg-black/70 backdrop-blur-md"
            onClick={() =>
              setShowSupport(false)
            }
          >
            <div
              className="w-full max-w-lg h-[80vh] sm:h-[650px] rounded-3xl border border-white/10 bg-[#0b0c14]/95 shadow-2xl flex flex-col overflow-hidden"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">

                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-emerald-400" />
                </div>

                <div className="flex-1">
                  <h3 className="text-white font-bold">
                    MVBD Support
                  </h3>

                  <p className="text-emerald-400 text-[11px]">
                    ● Live support
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowSupport(false)
                  }
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-slate-300" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">

                {supportMessages.length ===
                0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <MessageCircle className="w-10 h-10 text-slate-600" />

                    <p className="text-white font-semibold mt-4">
                      Start a conversation
                    </p>

                    <p className="text-slate-500 text-xs mt-1 max-w-xs">
                      Send a message to MVBD support. Admin replies will appear here in realtime.
                    </p>
                  </div>
                ) : (
                  supportMessages.map(
                    (message) => {
                      const isAdmin =
                        message.senderRole ===
                        "admin"

                      return (
                        <div
                          key={
                            message.id
                          }
                          className={`flex ${
                            isAdmin
                              ? "justify-start"
                              : "justify-end"
                          }`}
                        >
                          <div
                            className={`max-w-[82%] rounded-2xl px-4 py-3 ${
                              isAdmin
                                ? "bg-white/10 border border-white/10"
                                : "bg-emerald-500/15 border border-emerald-400/20"
                            }`}
                          >
                            {isAdmin && (
                              <p className="text-emerald-400 text-[10px] font-bold mb-1">
                                MVBD SUPPORT
                              </p>
                            )}

                            <p className="text-white text-sm leading-5">
                              {
                                message.message
                              }
                            </p>

                            <p className="text-slate-500 text-[9px] mt-2">
                              {formatDate(
                                message.createdAt
                              )}
                            </p>
                          </div>
                        </div>
                      )
                    }
                  )
                )}
              </div>

              <div className="p-3 border-t border-white/10">
                <div className="flex items-end gap-2 rounded-2xl bg-white/5 border border-white/10 p-2">

                  <textarea
                    value={
                      supportText
                    }
                    onChange={(e) =>
                      setSupportText(
                        e.target.value
                      )
                    }
                    onKeyDown={(e) => {
                      if (
                        e.key ===
                          "Enter" &&
                        !e.shiftKey
                      ) {
                        e.preventDefault()

                        void handleSendSupport()
                      }
                    }}
                    placeholder="Write a message..."
                    rows={1}
                    className="flex-1 resize-none bg-transparent text-white text-sm outline-none px-2 py-2 placeholder:text-slate-500"
                  />

                  <button
                    type="button"
                    disabled={
                      sendingSupport ||
                      !supportText.trim()
                    }
                    onClick={() =>
                      void handleSendSupport()
                    }
                    className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center disabled:opacity-40"
                  >
                    {sendingSupport ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 text-white" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* =========================
          SIMPLE LOGIN MODAL
      ========================== */}
      {showLogin && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
          onClick={() =>
            setShowLogin(false)
          }
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0b0c14]/95 shadow-2xl p-5"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="flex items-center justify-between mb-5">

              <div>
                <h3 className="text-white text-xl font-bold">
                  Welcome Back
                </h3>

                <p className="text-slate-400 text-xs mt-1">
                  Sign in to your MVBD account
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowLogin(false)
                }
                className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-slate-300" />
              </button>
            </div>

            {loginError && (
              <div className="mb-3 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {loginError}
              </div>
            )}

            <div className="space-y-3">

              <input
                type="email"
                value={loginEmail}
                onChange={(e) =>
                  setLoginEmail(
                    e.target.value
                  )
                }
                placeholder="Email"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm outline-none focus:border-emerald-400/40"
              />

              <input
                type="password"
                value={
                  loginPassword
                }
                onChange={(e) =>
                  setLoginPassword(
                    e.target.value
                  )
                }
                placeholder="Password"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm outline-none focus:border-emerald-400/40"
              />

              <button
                type="button"
                disabled={
                  loginLoading
                }
                onClick={() =>
                  void handleLogin()
                }
                className="w-full rounded-xl bg-emerald-500 py-3 text-white font-bold text-sm disabled:opacity-50"
              >
                {loginLoading
                  ? "Signing in..."
                  : "Sign In"}
              </button>

              <div className="flex items-center gap-3">
                <div className="h-px bg-white/10 flex-1" />
                <span className="text-slate-500 text-xs">
                  OR
                </span>
                <div className="h-px bg-white/10 flex-1" />
              </div>

              <button
                type="button"
                disabled={
                  loginLoading
                }
                onClick={() =>
                  void handleGoogleLogin()
                }
                className="w-full rounded-xl bg-white/5 border border-white/10 py-3 text-white font-semibold text-sm disabled:opacity-50"
              >
                Continue with Google
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        ::-webkit-scrollbar {
          width: 7px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.03);
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.18);
          border-radius: 999px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.28);
        }

        @keyframes mvbdProfilePulse {
          0%,
          100% {
            opacity: 0.55;
          }

          50% {
            opacity: 0.25;
          }
        }

        .animate-pulse {
          animation: mvbdProfilePulse
            3s cubic-bezier(0.4, 0, 0.6, 1)
            infinite;
        }
      `}</style>
    </>
  )
}
