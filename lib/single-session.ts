import {
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore"
import type { User } from "firebase/auth"

import { db } from "@/lib/firebase"

export const SINGLE_SESSION_REPLACED = "single-session-replaced"
const SESSION_STORAGE_PREFIX = "mvbd-active-session:"

function getStoredSessionId(uid: string) {
  if (typeof window === "undefined") return null

  try {
    return window.sessionStorage.getItem(`${SESSION_STORAGE_PREFIX}${uid}`)
  } catch {
    return null
  }
}

function storeSessionId(uid: string, sessionId: string) {
  if (typeof window === "undefined") return

  try {
    window.sessionStorage.setItem(`${SESSION_STORAGE_PREFIX}${uid}`, sessionId)
  } catch {
    // Session storage can be unavailable in privacy-restricted browsers.
  }
}

export class SingleSessionError extends Error {
  code = SINGLE_SESSION_REPLACED

  constructor() {
    super(SINGLE_SESSION_REPLACED)
    this.name = "SingleSessionError"
  }
}

function createSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function getDeviceLabel() {
  if (typeof navigator === "undefined") return "Web browser"

  const browser = /Edg\//.test(navigator.userAgent)
    ? "Edge"
    : /Chrome\//.test(navigator.userAgent)
      ? "Chrome"
      : /Firefox\//.test(navigator.userAgent)
        ? "Firefox"
        : /Safari\//.test(navigator.userAgent)
          ? "Safari"
          : "Web browser"

  return `${browser} on ${navigator.platform || "this device"}`
}

export async function claimSingleSession(user: User) {
  const storedSessionId = getStoredSessionId(user.uid)
  const sessionId = storedSessionId ?? createSessionId()
  const sessionRef = doc(db, "activeSessions", user.uid)

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(sessionRef)
    const activeSessionId = snapshot.exists()
      ? snapshot.data().sessionId
      : null

    if (
      typeof activeSessionId === "string" &&
      activeSessionId !== sessionId
    ) {
      throw new SingleSessionError()
    }

    transaction.set(
      sessionRef,
      {
        uid: user.uid,
        sessionId,
        device: getDeviceLabel(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  })

  storeSessionId(user.uid, sessionId)
  return sessionId
}

export function subscribeToSingleSession(
  uid: string,
  sessionId: string,
  onReplaced: () => void,
): Unsubscribe {
  return onSnapshot(doc(db, "activeSessions", uid), (snapshot) => {
    if (!snapshot.exists()) return

    const activeSessionId = snapshot.data().sessionId
    if (typeof activeSessionId === "string" && activeSessionId !== sessionId) {
      onReplaced()
    }
  })
}

export function isSingleSessionError(error: unknown) {
  return error instanceof SingleSessionError || (
    typeof error === "object" && error !== null && "code" in error && error.code === SINGLE_SESSION_REPLACED
  )
}

export function getSingleSessionError() {
  return new SingleSessionError()
}

export function getSessionReplacementMessage() {
  return "এই অ্যাকাউন্টটি অন্য ডিভাইস বা ব্রাউজারে লগইন করা হয়েছে। নিরাপত্তার জন্য এই জায়গা থেকে আপনাকে লগআউট করা হয়েছে।"
}

export function ignoreSessionListenerError(error: unknown) {
  console.error("Unable to monitor active session", error)
}
