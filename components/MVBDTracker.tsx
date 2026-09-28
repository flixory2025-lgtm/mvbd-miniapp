"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import {
  doc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"

export default function MVBDTracker() {
  const pathname = usePathname()
  const cleanupRef = useRef<null | (() => void)>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    let cancelled = false
    let currentUid: string | null = null

    // ---------- HELPERS ----------
    const getDeviceInfo = () => {
      const ua = navigator.userAgent
      const deviceName = /Android/i.test(ua)
        ? "Android Device"
        : /iPhone/i.test(ua)
        ? "iPhone"
        : /iPad/i.test(ua)
        ? "iPad"
        : /Windows/i.test(ua)
        ? "Windows PC"
        : /Mac/i.test(ua)
        ? "Mac"
        : /Linux/i.test(ua)
        ? "Linux"
        : "Unknown Device"

      const platform = /Android/i.test(ua)
        ? "Android"
        : /iPhone|iPad|iPod/i.test(ua)
        ? "iOS"
        : /Windows/i.test(ua)
        ? "Windows"
        : /Mac/i.test(ua)
        ? "macOS"
        : /Linux/i.test(ua)
        ? "Linux"
        : "Web"

      return { deviceName, platform, ua }
    }

    const getOrCreate = (key: string, generator: () => string) => {
      let val = localStorage.getItem(key)
      if (!val) {
        val = generator()
        localStorage.setItem(key, val)
      }
      return val
    }

    const setupForUser = async (uid: string) => {
      if (cancelled) return
      currentUid = uid

      const DEVICE_ID = getOrCreate(
        "mvbd_device_id",
        () => "dev_" + Math.random().toString(36).slice(2, 12) + "_" + Date.now()
      )

      const VISITOR_ID = getOrCreate(
        "mvbd_visitor_id",
        () => "v_" + Math.random().toString(36).slice(2, 12)
      )

      const { deviceName, platform, ua } = getDeviceInfo()

      const sessionId = uid + "_" + DEVICE_ID
      const sessionRef = doc(db, "sessions", sessionId)

      // ---- Session write (login) ----
      try {
        await setDoc(
          sessionRef,
          {
            uid,
            deviceId: DEVICE_ID,
            deviceName,
            platform,
            userAgent: ua,
            loginAt: serverTimestamp(),
            lastSeen: serverTimestamp(),
            revoked: false,
          },
          { merge: true }
        )
      } catch (e) {
        console.warn("[MVBD] session write failed", e)
      }

      // ---- User lastSeen write ----
      try {
        await setDoc(
          doc(db, "users", uid),
          { lastSeen: serverTimestamp() },
          { merge: true }
        )
      } catch (e) {
        // user doc না থাকলেও সমস্যা নেই
      }

      // ---- Heartbeat (প্রতি ৬০s) ----
      const heartbeat = setInterval(async () => {
        try {
          await setDoc(
            sessionRef,
            { lastSeen: serverTimestamp() },
            { merge: true }
          )
        } catch {}
        try {
          await setDoc(
            doc(db, "users", uid),
            { lastSeen: serverTimestamp() },
            { merge: true }
          )
        } catch {}
      }, 60000)

      // ---- Revoke listener ----
      const unsubSession = onSnapshot(
        sessionRef,
        (snap) => {
          if (snap.exists() && snap.data()?.revoked === true) {
            alert(
              "এই device থেকে session revoke করা হয়েছে। আপনাকে logout করা হচ্ছে।"
            )
            localStorage.removeItem("mvbd_device_id")
            auth.signOut().catch(() => {})
            setTimeout(() => location.reload(), 800)
          }
        },
        (err) => console.warn("[MVBD] session listener error", err)
      )

      // ---- View tracking (প্রতি page visit) ----
      try {
        await addDoc(collection(db, "views"), {
          uid,
          visitorId: VISITOR_ID,
          page: pathname,
          url: window.location.href,
          deviceId: DEVICE_ID,
          platform,
          createdAt: serverTimestamp(),
        })
      } catch (e) {
        console.warn("[MVBD] view write failed", e)
      }

      // ---- Cleanup function ----
      const cleanup = () => {
        clearInterval(heartbeat)
        unsubSession()
      }

      cleanupRef.current = cleanup
    }

    // ---------- Auth state listener ----------
    // Auth থাকলে আসল UID, না থাকলে guest UID
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (cancelled) return

      // আগের user-এর cleanup
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }

      if (user) {
        setupForUser(user.uid)
      } else {
        // Guest mode — localStorage UID
        const guestUid = getOrCreate(
          "mvbd_uid",
          () => "guest_" + Math.random().toString(36).slice(2, 10)
        )
        setupForUser(guestUid)
      }
    })

    return () => {
      cancelled = true
      unsubAuth()
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
    }
  }, [pathname])

  // Page change হলে শুধু view track করার জন্য আলাদা effect
  // (উপরের effect pathname change-এ re-run হবে, তাই এটা লাগবে না)

  return null
}
