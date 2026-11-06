"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import {
  ArrowLeft,
  Bell,
  Captions,
  Gauge,
  MonitorSmartphone,
  Palette,
  Play,
  RotateCcw,
  Sparkles,
  Trash2,
  Type,
  Vibrate,
  Volume2,
  Wifi,
  Zap,
} from "lucide-react"

import {
  ACCENTS,
  haptic,
  hexToRgb,
  useAppSettings,
  type Quality,
  type TextSize,
} from "@/lib/app-settings"

interface SettingsPageProps {
  onBack?: () => void
}

/*
 * =========================================
 * SETTINGS UI STYLES (profile page er same dark-glass look)
 * Accent colour user nijei settings theke change korbe
 * =========================================
 */
const SETTINGS_CSS = String.raw`
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");

.pf-root{
  --ac:#F2FF00;--ac-rgb:242,255,0;--ink:#12140a;
  position:relative;isolation:isolate;overflow:hidden;color:#fff;background:#0b0c0a;
  font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;
  -webkit-tap-highlight-color:transparent;-webkit-text-size-adjust:100%;text-size-adjust:100%}
.pf-root *,.pf-root *::before,.pf-root *::after{box-sizing:border-box}
.pf-root::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;
  background:
   radial-gradient(52% 30% at 100% 10%,rgba(var(--ac-rgb),.17),transparent 70%),
   radial-gradient(60% 32% at 0% 100%,rgba(var(--ac-rgb),.11),transparent 70%),
   linear-gradient(180deg,#1b1d18 0%,#10110e 45%,#0a0b09 100%)}
.pf-tabular{font-variant-numeric:tabular-nums;font-feature-settings:"tnum"}
.pf-wrap{width:100%;max-width:27rem;margin:0 auto}

@keyframes pfRise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.pf-rise{animation:pfRise .55s cubic-bezier(.2,.8,.2,1) both}
.pf-d1{animation-delay:.06s}.pf-d2{animation-delay:.12s}.pf-d3{animation-delay:.18s}

/* header */
.pf-head{display:grid;grid-template-columns:2.3rem 1fr 2.3rem;align-items:center;gap:.5rem}
.pf-head h1{margin:0;text-align:center;font-size:14px;font-weight:600;letter-spacing:.01em}
.pf-circle{display:grid;place-items:center;flex:none;width:2.3rem;height:2.3rem;border-radius:50%;color:rgba(255,255,255,.88);
  background:linear-gradient(145deg,rgba(255,255,255,.1),rgba(255,255,255,.03));
  border:1px solid rgba(255,255,255,.12);box-shadow:inset 0 1px 0 rgba(255,255,255,.12);
  transition:transform .2s ease,background .2s ease}
.pf-circle:active{transform:scale(.93)}
.pf-circle svg{width:15px;height:15px}
@media (hover:hover){.pf-circle:hover{background:linear-gradient(145deg,rgba(255,255,255,.16),rgba(255,255,255,.05))}}

/* intro card */
.pf-prem{position:relative;overflow:hidden;margin-top:1.15rem;padding:.95rem 1rem 1rem;border-radius:1.15rem;
  background:
   radial-gradient(90% 120% at 100% 100%,rgba(var(--ac-rgb),.14),transparent 62%),
   linear-gradient(135deg,rgba(255,255,255,.075),rgba(255,255,255,.02));
  border:1px solid rgba(var(--ac-rgb),.14);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 18px 36px -22px rgba(0,0,0,.9)}
.pf-prem-wm{position:absolute;right:.9rem;top:50%;width:3.9rem;height:3.9rem;transform:translateY(-50%) rotate(8deg);
  color:rgba(255,255,255,.3);filter:drop-shadow(0 0 14px rgba(var(--ac-rgb),.25));pointer-events:none}
.pf-prem-body{position:relative;z-index:1;max-width:72%}
.pf-prem-title{display:flex;align-items:center;gap:.4rem;margin:0;font-size:12px;font-weight:600}
.pf-prem-title svg{width:13px;height:13px;color:var(--ac)}
.pf-prem-desc{margin:.35rem 0 0;font-size:10px;line-height:1.5;color:rgba(255,255,255,.55)}

/* sections + rows */
.pf-sec{margin:1.35rem 0 .6rem;font-size:13px;font-weight:700;letter-spacing:.005em}
.pf-list{display:flex;flex-direction:column;gap:.5rem}
.pf-row{display:flex;align-items:center;gap:.7rem;width:100%;min-width:0;min-height:2.85rem;padding:.4rem .85rem .4rem .42rem;
  border-radius:1.5rem;text-align:left;font-size:12px;font-weight:500;color:rgba(255,255,255,.9);
  background:linear-gradient(145deg,rgba(255,255,255,.065),rgba(255,255,255,.025));
  border:1px solid rgba(255,255,255,.075);box-shadow:inset 0 1px 0 rgba(255,255,255,.07);
  -webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);
  transition:transform .2s ease,border-color .2s ease}
button.pf-row:active{transform:scale(.985)}
@media (hover:hover){button.pf-row:hover{border-color:rgba(var(--ac-rgb),.28)}}
.pf-ri{flex:none;display:grid;place-items:center;width:2.05rem;height:2.05rem;border-radius:50%;color:rgba(255,255,255,.72);
  background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12)}
.pf-ri svg{width:14px;height:14px}
.pf-row.on .pf-ri{color:var(--ink);background:var(--ac);border-color:transparent}
.pf-row.danger .pf-ri{color:#ff9d92;border-color:rgba(255,120,105,.28);background:rgba(255,120,105,.07)}
.pf-row.danger .st-t b{color:#ffb4ab}
.st-t{flex:1;min-width:0}
.st-t b{display:block;font-size:12px;font-weight:500}
.st-t small{display:block;margin-top:1px;font-size:10px;font-weight:400;line-height:1.35;color:rgba(255,255,255,.45)}
.pf-rv{flex:none;font-size:10.5px;font-weight:600;color:rgba(255,255,255,.55)}
.pf-rv.ac{color:var(--ac)}

/* switch */
.st-sw{flex:none;position:relative;width:2.5rem;height:1.45rem;border-radius:999px;
  background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.12);transition:background .25s ease}
.st-sw::after{content:"";position:absolute;top:2px;left:2px;width:1.05rem;height:1.05rem;border-radius:50%;
  background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.4);transition:transform .25s cubic-bezier(.2,.8,.2,1),background .25s}
.st-sw.on{background:var(--ac);border-color:transparent}
.st-sw.on::after{transform:translateX(1.05rem);background:var(--ink)}

/* block (row + segmented control) */
.st-block{padding:.4rem .6rem .6rem .42rem;border-radius:1.5rem;
  background:linear-gradient(145deg,rgba(255,255,255,.065),rgba(255,255,255,.025));
  border:1px solid rgba(255,255,255,.075);box-shadow:inset 0 1px 0 rgba(255,255,255,.07);
  -webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}
.st-bh{display:flex;align-items:center;gap:.7rem;min-height:2.05rem;font-size:12px;font-weight:500}
.st-seg{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:.3rem;margin:.55rem 0 0 .2rem}
.st-seg button{height:2rem;border-radius:999px;font-size:11px;font-weight:600;color:rgba(255,255,255,.7);
  background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);transition:transform .2s ease,background .2s ease}
.st-seg button:active{transform:scale(.95)}
.st-seg button.is-on{color:var(--ink);background:var(--ac);border-color:transparent;font-weight:700;
  box-shadow:0 6px 14px -8px rgba(var(--ac-rgb),.8)}

/* accent swatches */
.st-sw-row{display:flex;gap:.6rem;margin:.65rem 0 .15rem .2rem;flex-wrap:wrap}
.st-dot{width:1.7rem;height:1.7rem;border-radius:50%;border:2px solid transparent;
  box-shadow:inset 0 0 0 2px #12130f;transition:transform .2s ease}
.st-dot:active{transform:scale(.9)}
.st-dot.is-on{border-color:#fff}

.st-foot{margin:1.5rem 0 0;text-align:center;font-size:10px;line-height:1.7;color:rgba(255,255,255,.35)}

@media (prefers-reduced-motion:reduce){.pf-rise{animation:none!important}.pf-root *{transition:none!important}}
`

function SettingsStyles() {
  return <style>{SETTINGS_CSS}</style>
}

function ToggleRow({
  icon,
  title,
  desc,
  value,
  onToggle,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  value: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={onToggle}
      className={`pf-row${value ? " on" : ""}`}
    >
      <span className="pf-ri">{icon}</span>
      <span className="st-t">
        <b>{title}</b>
        <small>{desc}</small>
      </span>
      <span className={`st-sw${value ? " on" : ""}`} aria-hidden="true" />
    </button>
  )
}

function SegmentBlock<T extends string | number>({
  icon,
  title,
  desc,
  value,
  options,
  onChange,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div className="st-block">
      <div className="st-bh">
        <span className="pf-ri">{icon}</span>
        <span className="st-t">
          <b>{title}</b>
          <small>{desc}</small>
        </span>
      </div>

      <div className="st-seg" role="radiogroup" aria-label={title}>
        {options.map((option) => (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            className={value === option.value ? "is-on" : ""}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export default function SettingsPage({ onBack }: SettingsPageProps = {}) {
  const { settings, update, reset, loaded } = useAppSettings()

  const [usage, setUsage] = useState<number | null>(null)
  const [clearing, setClearing] = useState(false)
  const [connection, setConnection] = useState("")

  const refreshUsage = useCallback(async () => {
    try {
      const estimate = await navigator.storage?.estimate?.()
      setUsage(estimate?.usage ?? null)
    } catch {
      setUsage(null)
    }
  }, [])

  useEffect(() => {
    void refreshUsage()

    const conn = (
      navigator as unknown as {
        connection?: {
          type?: string
          effectiveType?: string
          addEventListener?: (e: string, cb: () => void) => void
          removeEventListener?: (e: string, cb: () => void) => void
        }
      }
    ).connection

    const read = () => {
      if (!conn) return setConnection("")
      setConnection(
        conn.type && conn.type !== "unknown"
          ? conn.type
          : conn.effectiveType || "",
      )
    }

    read()
    conn?.addEventListener?.("change", read)
    return () => conn?.removeEventListener?.("change", read)
  }, [refreshUsage])

  // Browser permission bondho korle toggle o off hoye jabe
  useEffect(() => {
    if (!loaded || !settings.notifications) return
    if (
      typeof Notification === "undefined" ||
      Notification.permission !== "granted"
    ) {
      update({ notifications: false })
    }
  }, [loaded, settings.notifications, update])

  const toggle = (
    key:
      | "haptics"
      | "reduceMotion"
      | "muted"
      | "autoPlay"
      | "subtitles"
      | "wifiOnly",
  ) => {
    update({ [key]: !settings[key] })
    haptic()
  }

  const toggleNotifications = async () => {
    if (settings.notifications) {
      update({ notifications: false })
      haptic()
      toast("Notifications turned off")
      return
    }

    if (typeof Notification === "undefined") {
      toast.error("This browser does not support notifications")
      return
    }

    let permission = Notification.permission

    if (permission === "default") {
      permission = await Notification.requestPermission()
    }

    if (permission !== "granted") {
      toast.error("Notifications are blocked. Allow them in browser settings.")
      return
    }

    update({ notifications: true })
    haptic()

    try {
      const reg = await navigator.serviceWorker?.getRegistration()
      const options = { body: "Notifications are now enabled." }

      if (reg) {
        await reg.showNotification("MVBD", options)
      } else {
        new Notification("MVBD", options)
      }
    } catch {
      /* test notification optional */
    }

    toast.success("Notifications enabled")
  }

  const toggleKeepAwake = () => {
    const supported = "wakeLock" in navigator

    if (!settings.keepAwake && !supported) {
      toast.error("Your browser does not support keeping the screen awake")
      return
    }

    update({ keepAwake: !settings.keepAwake })
    haptic()
  }

  const clearCache = async () => {
    setClearing(true)

    try {
      if ("caches" in window) {
        const keys = await caches.keys()
        await Promise.all(keys.map((key) => caches.delete(key)))
      }

      window.sessionStorage.clear()

      // shudhu cache key gulo muche, login/settings thakbe
      Object.keys(window.localStorage)
        .filter((key) => key.startsWith("mvbd_cache_"))
        .forEach((key) => window.localStorage.removeItem(key))

      await refreshUsage()
      haptic(20)
      toast.success("Cache cleared")
    } catch {
      toast.error("Could not clear cache")
    } finally {
      setClearing(false)
    }
  }

  const resetAll = () => {
    reset()
    haptic(20)
    toast.success("Settings reset to default")
  }

  const rootStyle = {
    "--ac": settings.accent,
    "--ac-rgb": hexToRgb(settings.accent),
  } as React.CSSProperties

  return (
    <main className="pf-root min-h-0 px-4 pb-24 pt-5 text-white" style={rootStyle}>
      <SettingsStyles />

      <div className="pf-wrap">
        {/* HEADER */}
        <header className="pf-head pf-rise">
          <button
            type="button"
            className="pf-circle"
            aria-label="Go back"
            onClick={() => (onBack ? onBack() : window.history.back())}
          >
            <ArrowLeft />
          </button>

          <h1>Settings</h1>

          <span aria-hidden="true" />
        </header>

        {/* INTRO */}
        <section className="pf-prem pf-rise pf-d1">
          <Sparkles className="pf-prem-wm" aria-hidden="true" />

          <div className="pf-prem-body">
            <p className="pf-prem-title">
              <Sparkles />
              Make MVBD yours
            </p>
            <p className="pf-prem-desc">
              Your changes are saved on this device and apply instantly.
            </p>
          </div>
        </section>

        {loaded && (
          <>
            {/* GENERAL */}
            <h2 className="pf-sec">General</h2>

            <div className="pf-list pf-rise pf-d2">
              <ToggleRow
                icon={<Bell />}
                title="Push notifications"
                desc="Get alerts about new movies and updates"
                value={settings.notifications}
                onToggle={() => void toggleNotifications()}
              />

              <ToggleRow
                icon={<Vibrate />}
                title="Haptic feedback"
                desc="Light vibration when you tap (Android)"
                value={settings.haptics}
                onToggle={() => toggle("haptics")}
              />

              <ToggleRow
                icon={<MonitorSmartphone />}
                title="Keep screen awake"
                desc="Stop the screen from sleeping while the app is open"
                value={settings.keepAwake}
                onToggle={toggleKeepAwake}
              />
            </div>

            {/* APPEARANCE */}
            <h2 className="pf-sec">Appearance</h2>

            <div className="pf-list pf-rise pf-d3">
              <div className="st-block">
                <div className="st-bh">
                  <span className="pf-ri">
                    <Palette />
                  </span>
                  <span className="st-t">
                    <b>Accent colour</b>
                    <small>Buttons, highlights and toggles</small>
                  </span>
                </div>

                <div className="st-sw-row" role="radiogroup" aria-label="Accent colour">
                  {ACCENTS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      role="radio"
                      aria-checked={settings.accent === color}
                      aria-label={`Accent ${color}`}
                      className={`st-dot${settings.accent === color ? " is-on" : ""}`}
                      style={{ background: color }}
                      onClick={() => {
                        update({ accent: color })
                        haptic()
                      }}
                    />
                  ))}
                </div>
              </div>

              <SegmentBlock<TextSize>
                icon={<Type />}
                title="Text size"
                desc="Makes text bigger or smaller across the app"
                value={settings.textSize}
                options={[
                  { value: "sm", label: "Small" },
                  { value: "md", label: "Medium" },
                  { value: "lg", label: "Large" },
                ]}
                onChange={(value) => {
                  update({ textSize: value })
                  haptic()
                }}
              />

              <ToggleRow
                icon={<Zap />}
                title="Reduce motion"
                desc="Turn off animations and transitions"
                value={settings.reduceMotion}
                onToggle={() => toggle("reduceMotion")}
              />
            </div>

            {/* PLAYBACK */}
            <h2 className="pf-sec">Playback</h2>

            <div className="pf-list">
              <ToggleRow
                icon={<Play />}
                title="Auto play"
                desc="Start the next episode automatically"
                value={settings.autoPlay}
                onToggle={() => toggle("autoPlay")}
              />

              <ToggleRow
                icon={<Captions />}
                title="Subtitles"
                desc="Show subtitles by default"
                value={settings.subtitles}
                onToggle={() => toggle("subtitles")}
              />

              <ToggleRow
                icon={<Volume2 />}
                title="Start muted"
                desc="Videos begin with the sound off"
                value={settings.muted}
                onToggle={() => toggle("muted")}
              />

              <ToggleRow
                icon={<Wifi />}
                title="Wi-Fi only streaming"
                desc={
                  connection
                    ? `Block streaming on mobile data · now: ${connection}`
                    : "Block streaming on mobile data"
                }
                value={settings.wifiOnly}
                onToggle={() => toggle("wifiOnly")}
              />

              <SegmentBlock<Quality>
                icon={<Gauge />}
                title="Video quality"
                desc="Higher quality uses more data"
                value={settings.quality}
                options={[
                  { value: "auto", label: "Auto" },
                  { value: "sd", label: "SD" },
                  { value: "hd", label: "HD" },
                  { value: "4k", label: "4K" },
                ]}
                onChange={(value) => {
                  update({ quality: value })
                  haptic()
                }}
              />

              <SegmentBlock<number>
                icon={<Gauge />}
                title="Playback speed"
                desc="Default speed for every video"
                value={settings.speed}
                options={[
                  { value: 0.75, label: "0.75x" },
                  { value: 1, label: "1x" },
                  { value: 1.25, label: "1.25x" },
                  { value: 1.5, label: "1.5x" },
                  { value: 2, label: "2x" },
                ]}
                onChange={(value) => {
                  update({ speed: value })
                  haptic()
                }}
              />
            </div>

            {/* STORAGE */}
            <h2 className="pf-sec">Storage</h2>

            <div className="pf-list">
              <button
                type="button"
                className="pf-row danger"
                onClick={() => void clearCache()}
                disabled={clearing}
              >
                <span className="pf-ri">
                  <Trash2 />
                </span>
                <span className="st-t">
                  <b>{clearing ? "Clearing…" : "Clear cache"}</b>
                  <small>Frees up space. You stay signed in.</small>
                </span>
                <span className="pf-rv ac pf-tabular">
                  {usage !== null ? formatBytes(usage) : ""}
                </span>
              </button>

              <button type="button" className="pf-row" onClick={resetAll}>
                <span className="pf-ri">
                  <RotateCcw />
                </span>
                <span className="st-t">
                  <b>Reset settings</b>
                  <small>Back to the default values</small>
                </span>
              </button>
            </div>

            <p className="st-foot">
              Movies Verse Bangladesh
              <br />
              Version 1.0.0
            </p>
          </>
        )}
      </div>
    </main>
  )
            }
