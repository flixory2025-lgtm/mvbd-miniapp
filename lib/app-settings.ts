"use client"

import { useCallback, useEffect, useState } from "react"

/*
 * =========================================
 * MVBD APP SETTINGS (shared store)
 * File: lib/app-settings.ts
 * - localStorage e save hoy ("mvbd_settings")
 * - Je kono jaygay useAppSettings() use korle live update pabe
 * - Player e: getAppSettings() / canStream() use korun
 * =========================================
 */

export type TextSize = "sm" | "md" | "lg"
export type Quality = "auto" | "sd" | "hd" | "4k"

export interface AppSettings {
  notifications: boolean
  haptics: boolean
  accent: string
  textSize: TextSize
  reduceMotion: boolean
  keepAwake: boolean
  muted: boolean
  autoPlay: boolean
  subtitles: boolean
  quality: Quality
  speed: number
  wifiOnly: boolean
}

export const SETTINGS_KEY = "mvbd_settings"
const EVENT = "mvbd:settings-changed"

export const DEFAULT_SETTINGS: AppSettings = {
  notifications: false,
  haptics: true,
  accent: "#F2FF00",
  textSize: "md",
  reduceMotion: false,
  keepAwake: false,
  muted: false,
  autoPlay: true,
  subtitles: true,
  quality: "auto",
  speed: 1,
  wifiOnly: false,
}

export const ACCENTS = [
  "#F2FF00",
  "#20E000",
  "#00D1FF",
  "#FF4D8D",
  "#FF9F1C",
  "#A78BFA",
]

const TEXT_PX: Record<TextSize, string> = { sm: "14px", md: "16px", lg: "18px" }

export function hexToRgb(hex: string) {
  const h = hex.replace("#", "")
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, "$1$1") : h, 16)
  if (Number.isNaN(n)) return "242,255,0"
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`
}

export function getAppSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function writeSettings(next: AppSettings) {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
  } catch {
    /* storage full / blocked */
  }
  window.dispatchEvent(new CustomEvent(EVENT))
}

const MOTION_STYLE_ID = "mvbd-reduce-motion"

/** Settings gulo asholei page e apply kore (font size, accent, motion) */
export function applySettings(s: AppSettings) {
  if (typeof document === "undefined") return
  const root = document.documentElement

  root.style.fontSize = TEXT_PX[s.textSize]
  root.style.setProperty("--mvbd-accent", s.accent)
  root.style.setProperty("--mvbd-accent-rgb", hexToRgb(s.accent))
  root.dataset.reduceMotion = s.reduceMotion ? "true" : "false"

  if (!document.getElementById(MOTION_STYLE_ID)) {
    const style = document.createElement("style")
    style.id = MOTION_STYLE_ID
    style.textContent = `html[data-reduce-motion="true"] *,html[data-reduce-motion="true"] *::before,html[data-reduce-motion="true"] *::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;scroll-behavior:auto!important}`
    document.head.appendChild(style)
  }
}

/** Button press e halka vibration (Android Chrome e kaj kore) */
export function haptic(ms = 12) {
  if (typeof navigator === "undefined") return
  if (!getAppSettings().haptics) return
  if ("vibrate" in navigator) navigator.vibrate(ms)
}

/** WiFi only on thakle, cellular e video chalano jabe na */
export function canStream(): boolean {
  if (!getAppSettings().wifiOnly) return true
  const conn = (navigator as unknown as { connection?: { type?: string } })
    .connection
  // type support na korle (iOS / desktop Chrome) block kora hobe na
  return conn?.type !== "cellular"
}

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const sync = () => setSettings(getAppSettings())
    sync()
    setLoaded(true)

    window.addEventListener(EVENT, sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener("storage", sync)
    }
  }, [])

  // apply font size / accent / reduce motion
  useEffect(() => {
    if (loaded) applySettings(settings)
  }, [settings, loaded])

  // keep screen awake (Wake Lock API)
  useEffect(() => {
    if (!loaded || !settings.keepAwake) return
    type Lock = { release: () => Promise<void> }
    const wl = (
      navigator as unknown as {
        wakeLock?: { request: (t: "screen") => Promise<Lock> }
      }
    ).wakeLock
    if (!wl) return

    let lock: Lock | null = null
    const request = async () => {
      try {
        lock = await wl.request("screen")
      } catch {
        /* battery saver / not allowed */
      }
    }
    const onVisible = () => {
      if (document.visibilityState === "visible") void request()
    }

    void request()
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      document.removeEventListener("visibilitychange", onVisible)
      void lock?.release().catch(() => {})
    }
  }, [settings.keepAwake, loaded])

  const update = useCallback((patch: Partial<AppSettings>) => {
    writeSettings({ ...getAppSettings(), ...patch })
  }, [])

  const reset = useCallback(() => {
    writeSettings(DEFAULT_SETTINGS)
  }, [])

  return { settings, update, reset, loaded }
}
