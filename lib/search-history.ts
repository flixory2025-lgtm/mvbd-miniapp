/**
 * Search History Manager
 *
 * - localStorage-এ ৩ দিনের history রাখে (anonymous user)
 * - Login করলে Firestore-এও sync করে (logged-in user)
 * - Auto cleanup ৩ দিন পর
 * - Admin panel থেকে logged-in user-দের history দেখা যাবে
 */

import { db } from "@/firebase"
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore"

const STORAGE_KEY = "mvbd_search_history"
const MAX_ITEMS = 8
const MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000 // 3 days

export type SearchHistoryItem = {
  query: string
  timestamp: number
}

/* =========================================================
   LOCAL STORAGE
========================================================= */

export function getLocalHistory(): SearchHistoryItem[] {
  if (typeof window === "undefined") return []

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    const now = Date.now()
    const fresh = parsed.filter(
      (item) =>
        item &&
        typeof item.query === "string" &&
        typeof item.timestamp === "number" &&
        now - item.timestamp < MAX_AGE_MS
    )

    if (fresh.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh))
    }

    return fresh
  } catch {
    return []
  }
}

export function saveLocalHistory(items: SearchHistoryItem[]): void {
  if (typeof window === "undefined") return

  try {
    const now = Date.now()
    const fresh = items
      .filter((item) => now - item.timestamp < MAX_AGE_MS)
      .slice(0, MAX_ITEMS)

    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh))
  } catch {}
}

export function addToLocalHistory(query: string): SearchHistoryItem[] {
  const trimmed = query.trim()
  if (!trimmed) return getLocalHistory()

  const existing = getLocalHistory()

  const filtered = existing.filter(
    (item) => item.query.toLowerCase() !== trimmed.toLowerCase()
  )

  const updated: SearchHistoryItem[] = [
    { query: trimmed, timestamp: Date.now() },
    ...filtered,
  ].slice(0, MAX_ITEMS)

  saveLocalHistory(updated)
  return updated
}

export function removeFromLocalHistory(query: string): SearchHistoryItem[] {
  const existing = getLocalHistory()
  const updated = existing.filter(
    (item) => item.query.toLowerCase() !== query.toLowerCase()
  )
  saveLocalHistory(updated)
  return updated
}

export function clearLocalHistory(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {}
}

export function cleanupExpiredHistory(): void {
  if (typeof window === "undefined") return
  try {
    getLocalHistory()
  } catch {}
}

/* =========================================================
   FIRESTORE SYNC (logged-in user)
========================================================= */

/**
 * Logged-in user-এর history Firestore-এ save করে।
 * Document: searchHistory/{userId}
 * Admin panel এই collection থেকে সব user-এর history দেখতে পারবে।
 */
export async function saveHistoryToFirestore(
  userId: string,
  items: SearchHistoryItem[],
  userName?: string
): Promise<void> {
  if (!userId) return

  try {
    const now = Date.now()
    const fresh = items
      .filter((item) => now - item.timestamp < MAX_AGE_MS)
      .slice(0, MAX_ITEMS)

    const ref = doc(db, "searchHistory", userId)
    await setDoc(
      ref,
      {
        userId,
        userName: userName || null,
        items: fresh,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    )
  } catch (err) {
    console.error("Failed to save history to Firestore:", err)
  }
}

export async function loadHistoryFromFirestore(
  userId: string
): Promise<SearchHistoryItem[]> {
  if (!userId) return []

  try {
    const ref = doc(db, "searchHistory", userId)
    const snap = await getDoc(ref)

    if (!snap.exists()) return []

    const data = snap.data()
    const items = data.items

    if (!Array.isArray(items)) return []

    const now = Date.now()
    const fresh = items.filter(
      (item: any) =>
        item &&
        typeof item.query === "string" &&
        typeof item.timestamp === "number" &&
        now - item.timestamp < MAX_AGE_MS
    )

    return fresh as SearchHistoryItem[]
  } catch (err) {
    console.error("Failed to load history from Firestore:", err)
    return []
  }
}

/* =========================================================
   TIME FORMATTER — "২ মিনিট আগে", "১ ঘন্টা আগে", "২ দিন আগে"
========================================================= */

export function getTimeAgo(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 30) return "এইমাত্র"
  if (minutes < 1) return `${seconds} সেকেন্ড আগে`
  if (minutes < 60) return `${minutes} মিনিট আগে`
  if (hours === 1) return "১ ঘন্টা আগে"
  if (hours < 24) return `${hours} ঘন্টা আগে`
  if (days === 1) return "১ দিন আগে"
  return `${days} দিন আগে`
}
