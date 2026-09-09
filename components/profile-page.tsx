"use client"

import { createPortal } from "react-dom"
import { useEffect, useMemo, useState } from "react"
import { collection, onSnapshot, orderBy, query } from "firebase/firestore"
import { toast } from "sonner"
import {
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  Clipboard,
  Crown,
  Edit3,
  Loader2,
  LogIn,
  LogOut,
  Mail,
  MessageCircle,
  Send,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react"
import AuthModal from "@/components/auth-modal"
import { useAuth } from "@/components/auth-provider"
import { db } from "@/lib/firebase"
import {
  markNotificationRead,
  subscribeToMyNotifications,
  type Notification,
} from "@/lib/notifications"
import { updateUserProfile } from "@/lib/user-profile"
import SubscriptionPanel from "@/components/subscription-panel"
import {
  getSupportMessages,
  sendSupportMessage,
  subscribeToSupportMessages,
  type SupportMessage,
} from "@/lib/support-chat"
import { doc } from "firebase/firestore"

interface ProfilePageProps {
  onNavigate?: (page: "contact" | "about" | "settings") => void
}

type Modal = "notifications" | "support" | null

function remainingDays(
  timestamp: { toMillis: () => number } | null,
  now: number,
) {
  if (!timestamp) return 0
  return Math.max(
    0,
    Math.ceil((timestamp.toMillis() - now) / 86400000),
  )
}

function formatTime(value: unknown) {
  if (
    !value ||
    typeof value !== "object" ||
    !("toDate" in value)
  ) {
    return "Just now"
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(
    (value as { toDate: () => Date }).toDate(),
  )
}

export default function ProfilePage(
  { onNavigate }: ProfilePageProps = {},
) {
  const {
    user,
    profile,
    entitlement,
    loading,
    signOut,
    refreshProfile,
  } = useAuth()

  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [modal, setModal] = useState<Modal>(null)
  const [showSubscriptions, setShowSubscriptions] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [now, setNow] = useState(Date.now())

  // শুধু portal-এর জন্য mount state
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    return () => {
      setMounted(false)
    }
  }, [])

  useEffect(() => {
    setName(profile?.name ?? user?.displayName ?? "")
    setDateOfBirth(profile?.dateOfBirth ?? "")
  }, [profile, user])

  useEffect(() => {
    if (!user) {
      setNotifications([])
      return
    }

    const unsubscribeNotifications =
      subscribeToMyNotifications(
        user.uid,
        setNotifications,
        () =>
          toast.error(
            "Notifications are unavailable right now.",
          ),
      )

    return () => unsubscribeNotifications()
  }, [user])

  useEffect(() => {
    if (!user || modal !== "support") return

    let active = true

    void getSupportMessages(user.uid).then((items) => {
      if (active) setMessages(items)
    })

    const unsubscribe =
      subscribeToSupportMessages(
        user.uid,
        setMessages,
      )

    return () => {
      active = false
      unsubscribe()
    }
  }, [modal, user])

  useEffect(() => {
    if (!modal) return

    const previousOverflow =
      document.body.style.overflow

    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [modal])

  useEffect(() => {
    const timer = window.setInterval(
      () => setNow(Date.now()),
      60000,
    )

    const openSubscriptions = () =>
      setShowSubscriptions(true)

    window.addEventListener(
      "mvbd:open-subscriptions",
      openSubscriptions,
    )

    return () => {
      window.clearInterval(timer)
      window.removeEventListener(
        "mvbd:open-subscriptions",
        openSubscriptions,
      )
    }
  }, [])

  const expiry =
    entitlement.isPremiumActive
      ? entitlement.subscriptionExpiresAt
      : entitlement.isTrialActive
        ? entitlement.trialExpiresAt
        : null

  const days = remainingDays(expiry, now)

  const daysTone =
    days <= 2
      ? "text-red-300"
      : days === 3
        ? "text-amber-300"
        : "text-lime-300"

  const unreadCount = notifications.filter(
    (item) => !item.read,
  ).length

  const isPremium =
    entitlement.isPremiumActive ||
    entitlement.isTrialActive

  const accountType =
    entitlement.isPremiumActive
      ? "Paid"
      : entitlement.isTrialActive
        ? "Trial"
        : "Free"

  const status =
    profile?.subscriptionStatus === "active"
      ? "Active"
      : profile?.subscriptionStatus === "pending"
        ? "Pending"
        : profile?.subscriptionStatus === "expired"
          ? "Cancelled"
          : "Not Active"

  const photo =
    user?.photoURL || profile?.photoURL

  const initials = (
    profile?.name ||
    user?.email ||
    "MV"
  )
    .slice(0, 2)
    .toUpperCase()

  const referralCode =
    profile?.referralCode ||
    profile?.mvbdId ||
    "MVBD-PENDING"

  const saveProfile = async () => {
    if (!user) return

    setSaving(true)

    try {
      await updateUserProfile(user.uid, {
        name: name.trim(),
        dateOfBirth: dateOfBirth.trim(),
      })

      await refreshProfile()

      setIsEditing(false)

      toast.success("Profile saved")
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not save profile",
      )
    } finally {
      setSaving(false)
    }
  }

  const copyCode = async () => {
    await navigator.clipboard.writeText(
      referralCode,
    )

    setCopied(true)

    window.setTimeout(
      () => setCopied(false),
      1600,
    )
  }

  const openNotifications = async () => {
    setModal("notifications")

    if (!user) return

    const unread = notifications.filter(
      (item) => !item.read,
    )

    await Promise.all(
      unread.map((item) =>
        markNotificationRead(
          user.uid,
          item.notificationId,
        ),
      ),
    )

    setNotifications((items) =>
      items.map((item) => ({
        ...item,
        read: true,
      })),
    )
  }

  const submitMessage = async () => {
    if (!user || !message.trim()) return

    setSending(true)

    try {
      await sendSupportMessage(
        user.uid,
        message.trim(),
        profile?.name ||
          user.email ||
          "User",
      )

      setMessage("")
    } catch {
      toast.error(
        "Message could not be sent",
      )
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[#07090d] text-zinc-400">
        <Loader2 className="size-6 animate-spin" />
      </main>
    )
  }

  if (!user) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[#07090d] px-4">
        <section className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[.04] p-8 text-center shadow-2xl">
          <div className="mx-auto mb-5 grid size-16 place-items-center rounded-2xl bg-lime-300 text-[#10130e]">
            <UserRound className="size-7" />
          </div>

          <h1 className="text-2xl font-semibold text-white">
            Your MVBD account
          </h1>

          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Sign in to manage your membership,
            referrals, notifications, and support.
          </p>

          <button
            onClick={() =>
              setShowAuthModal(true)
            }
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-lime-300 px-5 py-3 text-sm font-semibold text-[#11150d] transition hover:bg-lime-200"
          >
            <LogIn className="size-4" />
            Sign in
          </button>

          <AuthModal
            open={showAuthModal}
            onOpenChange={setShowAuthModal}
          />
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-0 bg-[#07090d] px-4 pt-5 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="relative isolate overflow-hidden rounded-[2rem] border border-white/10 bg-[#11151b] px-5 py-8 text-center shadow-2xl sm:px-10 sm:py-12">
          <div
            className="profile-atmosphere"
            aria-hidden="true"
          >
            <span />
            <span />
            <span />
          </div>

          <div className="relative z-10 flex justify-end">
            <button
              onClick={() => void signOut()}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs text-zinc-300 transition hover:bg-white/10"
            >
              <LogOut className="size-3.5" />
              Sign out
            </button>
          </div>

          <div className="relative z-10 mx-auto mt-2 grid size-32 place-items-center rounded-full border border-lime-200/40 bg-[#1b2420] shadow-[0_0_0_10px_rgba(190,242,100,.05),0_0_70px_rgba(190,242,100,.2)] sm:size-36">
            {photo ? (
              <img
                src={photo}
                alt="Your profile"
                className="size-full rounded-full object-cover"
              />
            ) : (
              <span className="text-3xl font-semibold text-lime-200">
                {initials}
              </span>
            )}

            {isPremium && (
              <span className="absolute -right-1 -top-3 grid size-9 rotate-12 place-items-center rounded-xl bg-lime-300 text-[#12160f] shadow-lg">
                <Crown className="size-5" />
              </span>
            )}
          </div>

          <p className="relative z-10 mt-5 text-2xl font-semibold tracking-tight">
            {profile?.name ||
              user.displayName ||
              "MVBD member"}
          </p>

          <p className="relative z-10 mt-1 text-sm text-zinc-400">
            {user.email}
          </p>

          <div className="relative z-10 mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm">
            <span
              className={`size-2 rounded-full ${
                isPremium
                  ? "bg-lime-300"
                  : "bg-red-400"
              }`}
            />

            {isPremium ? (
              <>
                <Crown className="size-4 text-lime-300" />
                Premium Membership
              </>
            ) : (
              "Normal User"
            )}
          </div>

          {expiry && (
            <div className="relative z-10 mx-auto mt-7 max-w-xs border-t border-white/10 pt-5">
              <p className="text-[11px] uppercase tracking-[.24em] text-zinc-500">
                Valid time
              </p>

              <p
                className={`mt-1 text-3xl font-semibold ${daysTone}`}
              >
                {days}{" "}
                <span className="text-base font-normal text-zinc-400">
                  Days
                </span>
              </p>
            </div>
          )}
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_.8fr]">
          <section className="rounded-[1.5rem] border border-white/10 bg-white/[.04] p-5 sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[.22em] text-lime-300">
                  Account details
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  Personal information
                </h2>
              </div>

              <button
                onClick={() =>
                  setIsEditing(
                    (value) => !value,
                  )
                }
                className="rounded-full border border-white/10 p-2 text-zinc-300 transition hover:bg-white/10"
                aria-label="Edit profile"
              >
                <Edit3 className="size-4" />
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="field">
                <span>Full name</span>

                {isEditing ? (
                  <input
                    value={name}
                    onChange={(event) =>
                      setName(
                        event.target.value,
                      )
                    }
                  />
                ) : (
                  <strong>
                    {profile?.name ||
                      "Not set"}
                  </strong>
                )}
              </label>

              <label className="field">
                <span>Email</span>

                <strong>
                  {user.email ||
                    "Not set"}
                </strong>

                <Mail className="field-icon" />
              </label>

              <label className="field">
                <span>Date of birth</span>

                {isEditing ? (
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(event) =>
                      setDateOfBirth(
                        event.target.value,
                      )
                    }
                  />
                ) : (
                  <strong>
                    {profile?.dateOfBirth ||
                      "Not set"}
                  </strong>
                )}

                <CalendarDays className="field-icon" />
              </label>

              <div className="field">
                <span>Member ID</span>

                <strong>
                  {profile?.mvbdId ||
                    "Pending"}
                </strong>

                <ShieldCheck className="field-icon" />
              </div>
            </div>

            {isEditing && (
              <button
                disabled={saving}
                onClick={() =>
                  void saveProfile()
                }
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-lime-300 px-5 py-2.5 text-sm font-semibold text-[#11150d] disabled:opacity-60"
              >
                {saving && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                Save changes
              </button>
            )}
          </section>

          <section className="rounded-[1.5rem] border border-white/10 bg-white/[.04] p-5 sm:p-7">
            <p className="text-[11px] uppercase tracking-[.22em] text-lime-300">
              Access
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              Account status
            </h2>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="text-zinc-400">
                  Status
                </span>

                <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-lime-200">
                  {status}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-400">
                  Type
                </span>

                <span className="font-medium">
                  {accountType}
                </span>
              </div>

              <button
                onClick={() =>
                  setShowSubscriptions(
                    true,
                  )
                }
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-lime-300 px-4 py-3 text-sm font-semibold text-[#11150d] transition hover:bg-lime-200"
              >
                <Crown className="size-4" />
                Manage premium access
              </button>
            </div>
          </section>
        </div>

        <section className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="rounded-[1.5rem] border border-lime-200/20 bg-lime-300/[.07] p-5 sm:p-7">
            <p className="text-[11px] uppercase tracking-[.22em] text-lime-300">
              Invite friends
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              Your promo code
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Share your code with friends and grow the MVBD community.
            </p>

            <div className="mt-5 flex items-center justify-between rounded-xl border border-lime-200/20 bg-black/20 p-3">
              <code className="text-sm tracking-[.16em] text-lime-200">
                {referralCode}
              </code>

              <button
                onClick={() =>
                  void copyCode()
                }
                className="inline-flex items-center gap-2 rounded-lg bg-lime-300 px-3 py-2 text-xs font-semibold text-[#11150d]"
              >
                {copied ? (
                  <Check className="size-3.5" />
                ) : (
                  <Clipboard className="size-3.5" />
                )}

                {copied
                  ? "Copied"
                  : "Copy code"}
              </button>
            </div>

            <p className="mt-5 text-sm text-zinc-300">
              <strong className="text-2xl text-white">
                {profile?.successfulReferrals ??
                  0}
              </strong>{" "}
              successful referrals
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() =>
                void openNotifications()
              }
              className="action-row"
            >
              <span className="icon-box">
                <Bell className="size-5" />
              </span>

              <span>
                <strong>
                  Notifications
                </strong>

                <small>
                  {unreadCount
                    ? `${unreadCount} unread update${
                        unreadCount === 1
                          ? ""
                          : "s"
                      }`
                    : "You're all caught up"}
                </small>
              </span>

              {unreadCount > 0 && (
                <i className="notification-dot" />
              )}

              <ChevronRight className="ml-auto size-4 text-zinc-500" />
            </button>

            <button
              onClick={() =>
                setModal("support")
              }
              className="action-row"
            >
              <span className="icon-box">
                <MessageCircle className="size-5" />
              </span>

              <span>
                <strong>
                  Support team
                </strong>

                <small>
                  Chat with MVBD support
                </small>
              </span>

              <ChevronRight className="ml-auto size-4 text-zinc-500" />
            </button>

            {onNavigate && (
              <button
                onClick={() =>
                  onNavigate("settings")
                }
                className="action-row"
              >
                <span className="icon-box">
                  <CircleHelp className="size-5" />
                </span>

                <span>
                  <strong>
                    More settings
                  </strong>

                  <small>
                    Manage your experience
                  </small>
                </span>

                <ChevronRight className="ml-auto size-4 text-zinc-500" />
              </button>
            )}
          </div>
        </section>
      </div>

      <SubscriptionPanel
        open={showSubscriptions}
        onOpenChange={
          setShowSubscriptions
        }
      />

      {/* Notifications / Support modal
          Portal-এর মাধ্যমে body-তে render হচ্ছে,
          তাই parent swipe transform-এর প্রভাব পড়বে না। */}
      {mounted && modal
        ? createPortal(
            <div
              className="modal-backdrop"
              onMouseDown={(event) => {
                if (
                  event.currentTarget ===
                  event.target
                ) {
                  setModal(null)
                }
              }}
            >
              <section className="modal-card max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-white/10 p-5">
                  <div>
                    <p className="text-[11px] uppercase tracking-[.2em] text-lime-300">
                      MVBD
                    </p>

                    <h2 className="text-xl font-semibold">
                      {modal ===
                      "notifications"
                        ? "Notifications"
                        : "Support team"}
                    </h2>
                  </div>

                  <button
                    onClick={() =>
                      setModal(null)
                    }
                    className="rounded-full p-2 text-zinc-400 hover:bg-white/10"
                    aria-label="Close"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                {modal ===
                "notifications" ? (
                  <div className="overflow-visible p-4">
                    {notifications.length ===
                    0 ? (
                      <p className="p-8 text-center text-sm text-zinc-500">
                        No notifications yet.
                      </p>
                    ) : (
                      notifications.map(
                        (item) => (
                          <article
                            key={
                              item.notificationId
                            }
                            className="border-b border-white/10 p-4 last:border-0"
                          >
                            <div className="flex gap-3">
                              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-lime-300/10 text-lime-300">
                                <Bell className="size-4" />
                              </span>

                              <div>
                                <p className="text-sm text-zinc-200">
                                  {
                                    item.message
                                  }
                                </p>

                                <p className="mt-1 text-xs text-zinc-500">
                                  {formatTime(
                                    item.createdAt,
                                  )}
                                </p>
                              </div>
                            </div>
                          </article>
                        ),
                      )
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-3 overflow-visible p-4">
                      {messages.length ===
                      0 ? (
                        <p className="py-8 text-center text-sm text-zinc-500">
                          Start a conversation with support.
                        </p>
                      ) : (
                        messages.map(
                          (item) => (
                            <div
                              key={item.id}
                              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                                item.senderUid ===
                                user.uid
                                  ? "ml-auto bg-lime-300 text-[#11150d]"
                                  : "bg-white/10 text-zinc-200"
                              }`}
                            >
                              <p>
                                {
                                  item.message
                                }
                              </p>

                              <p
                                className={`mt-1 text-[10px] ${
                                  item.senderUid ===
                                  user.uid
                                    ? "text-[#53652d]"
                                    : "text-zinc-500"
                                }`}
                              >
                                {formatTime(
                                  item.createdAt,
                                )}
                              </p>
                            </div>
                          ),
                        )
                      )}
                    </div>

                    <div className="flex gap-2 border-t border-white/10 p-4">
                      <input
                        value={message}
                        onChange={(event) =>
                          setMessage(
                            event.target.value,
                          )
                        }
                        onKeyDown={(event) => {
                          if (
                            event.key ===
                              "Enter" &&
                            !event.nativeEvent
                              .isComposing &&
                            event.keyCode !==
                              229
                          ) {
                            void submitMessage()
                          }
                        }}
                        placeholder="Write a message..."
                        className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 text-sm outline-none focus:border-lime-300/50"
                      />

                      <button
                        onClick={() =>
                          void submitMessage()
                        }
                        disabled={
                          sending ||
                          !message.trim()
                        }
                        className="grid size-11 shrink-0 place-items-center rounded-xl bg-lime-300 text-[#11150d] disabled:opacity-50"
                        aria-label="Send message"
                      >
                        {sending ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Send className="size-4" />
                        )}
                      </button>
                    </div>
                  </>
                )}
              </section>
            </div>,
            document.body,
          )
        : null}
    </main>
  )
}

// The profile's motion is intentionally CSS-only so Firebase listeners stay lightweight.
