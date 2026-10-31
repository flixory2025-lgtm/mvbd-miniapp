"use client"

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react"
import { createPortal } from "react-dom"


/* ============================================================
FIREBASE
============================================================ */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBtBaUSIlXwJDWytaiOfal3ha7OmZEwuYM",
  authDomain: "mvbdminiapp.firebaseapp.com",
  projectId: "mvbdminiapp",
  storageBucket: "mvbdminiapp.firebasestorage.app",
  messagingSenderId: "668051748254",
  appId: "1:668051748254:web:d4804b68429d853a0c928f",
  measurementId: "G-HQZ9SL4RX8",
}

let _fb: any = null
let _fbPromise: Promise<any> | null = null

async function getFirebase() {
  if (_fb) return _fb
  if (_fbPromise) return _fbPromise

  _fbPromise = (async () => {
    const [appMod, authMod, fsMod] = await Promise.all([
      import(/* webpackIgnore: true */ "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js" as any),
      import(/* webpackIgnore: true */ "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js" as any),
      import(/* webpackIgnore: true */ "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js" as any),
    ])

    const app = appMod.initializeApp(FIREBASE_CONFIG)
    const auth = authMod.getAuth(app)
    const db = fsMod.getFirestore(app)

    _fb = {
      app, auth, db,
      createUserWithEmailAndPassword: authMod.createUserWithEmailAndPassword,
      signInWithEmailAndPassword: authMod.signInWithEmailAndPassword,
      signInWithPopup: authMod.signInWithPopup,
      GoogleAuthProvider: authMod.GoogleAuthProvider,
      signOut: authMod.signOut,
      onAuthStateChanged: authMod.onAuthStateChanged,
      sendPasswordResetEmail: authMod.sendPasswordResetEmail,
      updateProfile: authMod.updateProfile,
      collection: fsMod.collection,
      doc: fsMod.doc,
      setDoc: fsMod.setDoc,
      getDoc: async (ref: any) => {
        const snap = await fsMod.getDoc(ref)
        try {
          if (String(ref?.path || "").startsWith("users/")) {
            return {
              id: snap.id,
              ref: snap.ref,
              exists: () => snap.exists(),
              raw: () => snap.data(),
              data: () => normalizeUserData(snap.data()),
            }
          }
        } catch {}
        return snap
      },
      getDocs: fsMod.getDocs,
      // addDoc wrapper: নতুন notification / chat message তৈরি হলেই push পাঠায়
      addDoc: async (ref: any, data: any) => {
        const res = await fsMod.addDoc(ref, data)
        try { void pushAfterAddDoc(ref, data, fsMod) } catch {}
        return res
      },
      updateDoc: fsMod.updateDoc,
      deleteDoc: fsMod.deleteDoc,
      onSnapshot: fsMod.onSnapshot,
      query: fsMod.query,
      where: fsMod.where,
      orderBy: fsMod.orderBy,
      limit: fsMod.limit,
      serverTimestamp: fsMod.serverTimestamp,
      arrayUnion: fsMod.arrayUnion,
      arrayRemove: fsMod.arrayRemove,
      increment: fsMod.increment,
      Timestamp: fsMod.Timestamp,
    }
    return _fb
  })()

  return _fbPromise
}

/* ============================================================
PUSH NOTIFICATIONS  (OneSignal + Cloudflare Worker)
------------------------------------------------------------
1) ONESIGNAL_APP_ID  -> OneSignal dashboard > Settings > Keys & IDs
2) PUSH_WORKER_URL   -> তোমার Cloudflare Worker এর URL
============================================================ */

const ONESIGNAL_APP_ID = "535f3f99-e550-4fa3-98c6-38e440d51d07"
const PUSH_WORKER_URL = "https://mvbd-push.flixory2025.workers.dev/"

const PUSH_ENABLED = !ONESIGNAL_APP_ID.startsWith("PASTE")
const PUSH_SEND_ENABLED = PUSH_ENABLED && !PUSH_WORKER_URL.startsWith("PASTE")

let _pushSenderName = "Someone"
function setPushSenderName(name: string) {
  if (name) _pushSenderName = name
}

let _osPromise: Promise<any> | null = null
function loadOneSignal(): Promise<any> {
  if (typeof window === "undefined" || !PUSH_ENABLED) return Promise.resolve(null)
  if (_osPromise) return _osPromise

  _osPromise = new Promise((resolve) => {
    const w = window as any
    w.OneSignalDeferred = w.OneSignalDeferred || []
    w.OneSignalDeferred.push(async (OneSignal: any) => {
      try {
        await OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          serviceWorkerPath: "OneSignalSDKWorker.js",
          allowLocalhostAsSecureOrigin: true,
          notifyButton: { enable: false },
        })
        // সাইট খোলা ও দেখা অবস্থায় থাকলে system popup দেখাবে না (in-app toast আছে)
        OneSignal.Notifications.addEventListener("foregroundWillDisplay", (e: any) => {
          if (document.visibilityState === "visible") e.preventDefault()
        })
        // notification এ click করলে সঠিক জায়গায় নিয়ে যাবে
        OneSignal.Notifications.addEventListener("click", (e: any) => {
          try {
            const url = e?.notification?.launchURL || e?.result?.url
            if (url && url !== window.location.href) window.location.href = url
          } catch {}
        })
        resolve(OneSignal)
      } catch (err) {
        console.warn("OneSignal init failed:", err)
        resolve(null)
      }
    })

    if (!document.getElementById("onesignal-sdk")) {
      const s = document.createElement("script")
      s.id = "onesignal-sdk"
      s.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
      s.defer = true
      s.onerror = () => resolve(null)
      document.head.appendChild(s)
    }
  })

  return _osPromise
}

async function oneSignalLogin(uid: string) {
  try {
    const os = await loadOneSignal()
    if (os) await os.login(uid)
  } catch (e) {
    console.warn("OneSignal login failed:", e)
  }
}

async function oneSignalLogout() {
  try {
    const os = await loadOneSignal()
    if (os) await os.logout()
  } catch {}
}

function getPushPermission(): string {
  if (!PUSH_ENABLED) return "disabled"
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported"
  return Notification.permission // "default" | "granted" | "denied"
}

async function requestPush(): Promise<string> {
  try {
    const os = await loadOneSignal()
    if (!os) return getPushPermission()
    await os.Notifications.requestPermission()
  } catch (e) {
    console.warn("Push permission failed:", e)
  }
  return getPushPermission()
}

function pushBaseUrl() {
  return window.location.origin + window.location.pathname
}

function pushUrlFor(data: any) {
  const base = pushBaseUrl()
  const type = data?.type
  if (type === "friend") return `${base}?mb=friends`
  return `${base}?mb=notifications`
}

async function sendPush(payload: { uid: string; title: string; message: string; type?: string; url?: string }) {
  if (!PUSH_SEND_ENABLED || !payload.uid) return
  try {
    const fb = await getFirebase()
    const token = await fb.auth.currentUser?.getIdToken()
    if (!token) return
    await fetch(PUSH_WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      keepalive: true,
    })
  } catch (e) {
    console.warn("Push send failed:", e)
  }
}

async function pushAfterAddDoc(ref: any, data: any, fsMod: any) {
  if (!PUSH_SEND_ENABLED || !data) return
  const path: string = ref?.path || ""

  // 1) নতুন notification document
  if (path === "notifications") {
    if (!data.uid) return
    await sendPush({
      uid: data.uid,
      title: data.title || "MoviesVerseBD",
      message: data.message || "",
      type: data.type,
      url: pushUrlFor(data),
    })
    return
  }

  // 2) নতুন chat message
  const m = path.match(/^chats\/([^/]+)\/messages$/)
  if (m && _fb) {
    const chatSnap = await fsMod.getDoc(fsMod.doc(_fb.db, "chats", m[1]))
    const members: string[] = chatSnap.exists() ? chatSnap.data()?.members || [] : []
    const tos = members.filter((x) => x !== data.from)
    if (!tos.length) return
    const message =
      data.type === "image" ? "📷 Photo"
      : data.type === "voice" ? "🎤 Voice message"
      : data.text || "👍"
    for (const to of tos) {
      await sendPush({
        uid: to,
        title: _pushSenderName,
        message,
        type: "chat",
        url: `${pushBaseUrl()}?mb=messages`,
      })
    }
  }
}

/* ============================================================
CONSTANTS
============================================================ */

const CLOUD_NAME = "xtbkyhrl"
const UPLOAD_PRESET = "MeBook"

const LOGO_URL = "https://i.postimg.cc/g0pGNkxc/file-000000000bf482118c249820a099f2d4.png"
const HEADER_LOGO = "https://i.postimg.cc/rsBBsQWF/17832-removebg-preview.png"

const REACTIONS = [
  { key: "like", emoji: "👍", label: "Like", color: "#1877f2" },
  { key: "love", emoji: "❤️", label: "Love", color: "#f33e58" },
  { key: "care", emoji: "🥰", label: "Care", color: "#f7b125" },
  { key: "haha", emoji: "😂", label: "Haha", color: "#f7b125" },
  { key: "wow", emoji: "😮", label: "Wow", color: "#f7b125" },
  { key: "sad", emoji: "😢", label: "Sad", color: "#f7b125" },
  { key: "angry", emoji: "😡", label: "Angry", color: "#e9710f" },
]

const CHAT_REACTIONS = [
  { key: "like", emoji: "👍", label: "Like" },
  { key: "love", emoji: "❤️", label: "Love" },
  { key: "haha", emoji: "😂", label: "Haha" },
  { key: "wow", emoji: "😮", label: "Wow" },
  { key: "sad", emoji: "😢", label: "Sad" },
]

/* ============================================================
HELPERS
============================================================ */

function timeAgo(ts: any) {
  if (!ts) return "just now"
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 60) return "just now"
  if (s < 3600) return Math.floor(s / 60) + "m ago"
  if (s < 86400) return Math.floor(s / 3600) + "h ago"
  if (s < 604800) return Math.floor(s / 86400) + "d ago"
  return d.toLocaleDateString()
}

function timeShort(ts: any) {
  if (!ts) return ""
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const day = 86400000
  if (diff < day) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  if (diff < day * 7) return d.toLocaleDateString([], { weekday: "short" })
  return d.toLocaleDateString([], { month: "short", day: "numeric" })
}

function chatTime(ts: any) {
  if (!ts) return ""
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function dayKey(ts: any) {
  if (!ts) return ""
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toDateString()
}

function dayLabel(ts: any) {
  if (!ts) return ""
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  const today = new Date()
  const y = new Date()
  y.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return "Today"
  if (d.toDateString() === y.toDateString()) return "Yesterday"
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined })
}

function monthYear(ts: any) {
  if (!ts) return ""
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString([], { month: "long", year: "numeric" })
}

function friendlyErr(err: any): string {
  const code = String(err?.code || "")
  if (code.includes("invalid-credential") || code.includes("wrong-password")) return "Wrong email or password"
  if (code.includes("user-not-found")) return "No account found with this email"
  if (code.includes("email-already-in-use")) return "This email is already registered"
  if (code.includes("weak-password")) return "Password too weak (min 6 chars)"
  if (code.includes("invalid-email")) return "Invalid email address"
  if (code.includes("popup-closed")) return "Popup closed"
  if (code.includes("popup-blocked")) return "Popup blocked — please allow popups"
  if (code.includes("network")) return "Network error"
  if (code.includes("too-many-requests")) return "Too many attempts — try again later"
  return err?.message || "Something went wrong"
}

function chatIdFor(a: string, b: string) {
  return [a, b].sort().join("_")
}

function friendDocIdFor(a: string, b: string) {
  return [a, b].sort().join("_")
}

async function cloudinaryUpload(
  file: File | Blob,
  onProgress?: (pct: number) => void,
  resourceType: "image" | "video" | "auto" = "image"
): Promise<string> {
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType === "video" ? "video" : "image"}/upload`
  const fd = new FormData()
  fd.append("file", file)
  fd.append("upload_preset", UPLOAD_PRESET)
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("POST", url)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      try {
        const res = JSON.parse(xhr.responseText)
        if (res.secure_url) resolve(res.secure_url)
        else reject(new Error(res.error?.message || "Upload failed"))
      } catch (err) { reject(err) }
    }
    xhr.onerror = () => reject(new Error("Network error"))
    xhr.send(fd)
  })
}

function formatVoiceDuration(seconds: number) {
  const s = Math.max(0, Math.floor(seconds))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r < 10 ? "0" : ""}${r}`
}

/* ============================================================
STYLES
============================================================ */

const MEBOOK_CSS = `
.mebook-root{
--green:#16a34a; --green-dark:#15803d; --green-light:#22c55e;
--bg:#f0f2f5; --card:#ffffff; --text:#1c1e21; --text-muted:#65676b;
--border:#dddfe2; --hover:#f2f2f2;
--shadow:0 1px 2px rgba(0,0,0,.1),0 2px 8px rgba(0,0,0,.06);
--shadow-lg:0 12px 32px rgba(0,0,0,.15);
--input-bg:#f0f2f5;
--header-bg:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);
--chat-body-bg:#f7f8fa;
--bubble-them-bg:#ffffff;
background:var(--bg);color:var(--text);min-height:100vh;
transition:background .3s ease,color .3s ease;
font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
-webkit-font-smoothing:antialiased;
}

.mebook-root .mb-exit-overlay{position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.55);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:20px;animation:mbExitFade .18s ease;}
.mebook-root .mb-exit-dialog{width:min(88vw,340px);background:var(--card);color:var(--text);border-radius:20px;padding:26px 20px 18px;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,.35);animation:mbExitPop .22s cubic-bezier(.2,.9,.3,1.2);}
.mebook-root .mb-exit-icon{width:62px;height:62px;border-radius:50%;margin:0 auto 14px;display:flex;align-items:center;justify-content:center;background:rgba(239,68,68,.12);color:#ef4444;}
.mebook-root .mb-exit-title{font-size:19px;font-weight:800;margin-bottom:6px;}
.mebook-root .mb-exit-text{font-size:14px;color:var(--text-muted);line-height:1.45;margin-bottom:20px;}
.mebook-root .mb-exit-actions{display:flex;gap:10px;}
.mebook-root .mb-exit-btn{flex:1;padding:12px 10px;border-radius:12px;font-size:15px;font-weight:700;border:none;cursor:pointer;transition:filter .15s,transform .1s;}
.mebook-root .mb-exit-btn:active{transform:scale(.96);}
.mebook-root .mb-exit-btn.cancel{background:var(--input-bg);color:var(--text);}
.mebook-root .mb-exit-btn.exit{background:#ef4444;color:#fff;}
.mebook-root.dark-mode .mb-exit-dialog{background:#111;border:1px solid #1d1d1d;}
.mebook-root.dark-mode .mb-exit-btn.cancel{background:#1c1c1c;color:#fff;}
@keyframes mbExitFade{from{opacity:0}to{opacity:1}}
@keyframes mbExitPop{from{opacity:0;transform:scale(.88) translateY(10px)}to{opacity:1;transform:none}}
.mebook-root.dark-mode{
--green:#22c55e;--green-dark:#4ade80;--green-light:#86efac;
--bg:#000000;--card:#0a0a0a;--text:#f5f5f5;--text-muted:#8a8a8a;
--border:#1a1a1a;--hover:#141414;
--shadow:0 1px 2px rgba(0,0,0,.8),0 2px 8px rgba(0,0,0,.6);
--shadow-lg:0 12px 32px rgba(0,0,0,.9);
--input-bg:#141414;
--header-bg:linear-gradient(135deg,#000000 0%,#000000 100%);
--chat-body-bg:#000000;--bubble-them-bg:#141414;
background:#000000;
}
.mebook-root.dark-mode .mb-card{background:#0a0a0a;border:1px solid #151515;}
.mebook-root.dark-mode .mb-post{background:#0a0a0a;border:1px solid #151515;}
.mebook-root.dark-mode .mb-composer{background:#0a0a0a;border:1px solid #151515;}
.mebook-root.dark-mode .mb-profile-head{background:#0a0a0a;border:1px solid #151515;}
.mebook-root.dark-mode .fr-page{background:#0a0a0a;border:1px solid #151515;}
.mebook-root.dark-mode .fr-card{background:#141414;}
.mebook-root.dark-mode .notif-page-wrap{background:#0a0a0a;border:1px solid #151515;}
.mebook-root.dark-mode .cmt-page-wrap{background:#0a0a0a;border:1px solid #151515;}
.mebook-root.dark-mode .share-page-wrap{background:#0a0a0a;border:1px solid #151515;}
.mebook-root.dark-mode .msgr-wrap{background:#0a0a0a;border:1px solid #151515;}
.mebook-root.dark-mode .msgr-list{border-color:#151515;}
.mebook-root.dark-mode .msgr-window{background:#0a0a0a;}
.mebook-root.dark-mode .msgr-head{background:#0a0a0a;border-color:#151515;}
.mebook-root.dark-mode .msgr-input{background:#0a0a0a;border-color:#151515;}
.mebook-root.dark-mode .mb-right .mb-card{background:#0a0a0a;}
.mebook-root.dark-mode .cp-card{background:#0a0a0a;border:1px solid #151515;}
.mebook-root.dark-mode .cp-movie-tag{background:rgba(34,197,94,.08);border-color:rgba(34,197,94,.2);}
.mebook-root.dark-mode .cmt-bubble{background:#141414;}
.mebook-root.dark-mode .share-preview{background:#141414;}
.mebook-root.dark-mode .share-caption{background:#141414;}
.mebook-root.dark-mode .share-option{background:#141414;}
.mebook-root.dark-mode .share-option:hover{background:#1e1e1e;}
.mebook-root.dark-mode .mb-menu{background:#0a0a0a;border:1px solid #1a1a1a;}
.mebook-root.dark-mode .mb-menu-ico{background:#141414;}
.mebook-root.dark-mode .mb-menu-item:hover{background:#141414;}
.mebook-root.dark-mode .mb-toast{background:#0a0a0a;border:1px solid #1a1a1a;}
.mebook-root.dark-mode .mb-empty{background:#0a0a0a;border:1px solid #151515;}
.mebook-root.dark-mode .mb-setting-ico{background:#141414;}
.mebook-root.dark-mode .notif-item.unread{background:#0d150d;}
.mebook-root.dark-mode .notif-item:hover{background:#141414;}
.mebook-root.dark-mode .mb-contact:hover{background:#141414;}
.mebook-root.dark-mode .mb-side-item:hover{background:#141414;}
.mebook-root.dark-mode .mb-action:hover{background:#141414;}
.mebook-root.dark-mode .mb-comp-action:hover{background:#141414;}
.mebook-root.dark-mode .mb-post-more:hover{background:#141414;}
.mebook-root.dark-mode .fr-tab:hover{background:#141414;}
.mebook-root.dark-mode .fr-request-row:hover{background:#141414;}
.mebook-root.dark-mode .mb-menu-head:hover{background:#141414;}
.mebook-root.dark-mode .msgr-item:hover{background:#141414;}
.mebook-root.dark-mode .mb-composer-input{background:#141414;}
.mebook-root.dark-mode .mb-composer-input:hover{background:#1a1a1a;}
.mebook-root.dark-mode .cp-upload-box:hover{background:rgba(34,197,94,.05);}
.mebook-root.dark-mode .mb-back-btn{background:#0a0a0a;border:1px solid #1a1a1a;}
.mebook-root.dark-mode .mb-back-btn:hover{background:#141414;}
.mebook-root.dark-mode .mb-search-box{background:#0a0a0a;border:1px solid #151515;}
.mebook-root.dark-mode .msgr-input-field{background:#141414;}
.mebook-root.dark-mode .cmt-input{background:#141414;}
.mebook-root.dark-mode .mb-btn-secondary{background:#141414;}
.mebook-root.dark-mode .mb-btn-secondary:hover{background:#1e1e1e;}
.mebook-root.dark-mode .mb-btn-outline{border-color:#1a1a1a;}
.mebook-root.dark-mode .mb-btn-outline:hover{background:#141414;}
.mebook-root.dark-mode .mb-slider{background:#1a1a1a;}
.mebook-root.dark-mode .mb-privacy-toggle{border-color:#1a1a1a;}
.mebook-root.dark-mode .mb-setting-row{border-color:#1a1a1a;}
.mebook-root.dark-mode .mb-info-row{color:#e5e5e5;}
.mebook-root.dark-mode .notif-page-head{border-color:#1a1a1a;}
.mebook-root.dark-mode .notif-mark-all{background:#141414;}
.mebook-root.dark-mode .notif-mark-all:hover{background:#1e1e1e;}
.mebook-root.dark-mode .fl-item:hover{background:#141414;}
.mebook-root.dark-mode .fl-search{background:#141414;}
.mebook-root.dark-mode .fl-avatar-wrap{background:#141414;}
.mebook-root.dark-mode .fl-action-sheet{background:#0a0a0a;border-top:1px solid #1a1a1a;}
.mebook-root.dark-mode .fl-sheet-header{background:#0a0a0a;border-bottom:1px solid #1a1a1a;}
.mebook-root.dark-mode .fl-sheet-option:hover{background:#141414;}
.mebook-root.dark-mode .fl-sheet-option.danger{color:#f87171;}
.mebook-root.dark-mode .fl-sheet-option.danger .fl-sheet-ico svg{fill:#f87171;}

.mebook-root *{margin:0;padding:0;box-sizing:border-box;}
.mebook-root button{font-family:inherit;cursor:pointer;border:none;background:none;color:inherit;}
.mebook-root input,.mebook-root textarea{font-family:inherit;color:var(--text);}
.mebook-root img{display:block;}
.mebook-root a{text-decoration:none;color:inherit;}

/* ============ AUTH ============ */
.mebook-root .auth-wrap{
position:fixed;inset:0;z-index:5000;
background:linear-gradient(135deg,#020617 0%,#0f172a 40%,#052e16 100%);
display:flex;align-items:center;justify-content:center;padding:20px;overflow:hidden;
}
.mebook-root .auth-wrap::before{
content:'';position:absolute;width:200%;height:200%;top:-50%;left:-50%;
background:
radial-gradient(circle at 15% 25%,rgba(34,197,94,.28) 0%,transparent 45%),
radial-gradient(circle at 85% 20%,rgba(59,130,246,.22) 0%,transparent 45%),
radial-gradient(circle at 25% 85%,rgba(168,85,247,.18) 0%,transparent 45%),
radial-gradient(circle at 75% 75%,rgba(16,185,129,.22) 0%,transparent 45%);
animation:authGlow 16s ease-in-out infinite;z-index:0;filter:blur(60px);
}
@keyframes authGlow{0%,100%{transform:translate(0,0) scale(1) rotate(0deg);}33%{transform:translate(-4%,4%) scale(1.12) rotate(120deg);}66%{transform:translate(4%,-4%) scale(.95) rotate(240deg);}}
.mebook-root .auth-card{
position:relative;z-index:2;width:100%;max-width:440px;
padding:36px 32px 32px;border-radius:24px;
background:rgba(17,24,39,.72);
backdrop-filter:blur(28px) saturate(180%);-webkit-backdrop-filter:blur(28px) saturate(180%);
border:1px solid rgba(255,255,255,.08);
box-shadow:0 32px 80px rgba(0,0,0,.55),0 0 0 1px rgba(255,255,255,.04) inset,0 1px 0 rgba(255,255,255,.10) inset;
animation:cardFloat .7s cubic-bezier(.2,.8,.3,1);color:#f3f4f6;
}
@keyframes cardFloat{from{opacity:0;transform:translateY(28px) scale(.96);}to{opacity:1;transform:translateY(0) scale(1);}}
.mebook-root .auth-logo{display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:8px;}
.mebook-root .auth-logo img{width:52px;height:52px;object-fit:contain;filter:drop-shadow(0 4px 16px rgba(34,197,94,.5));}
.mebook-root .auth-logo .mb-logo-text{font-size:28px;font-weight:800;letter-spacing:-.8px;}
.mebook-root .auth-logo .me{background:linear-gradient(135deg,#22c55e,#4ade80);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;}
.mebook-root .auth-logo .book{background:linear-gradient(135deg,#f3f4f6,#9ca3af);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;}
.mebook-root .auth-sub{text-align:center;color:#94a3b8;font-size:13.5px;margin-bottom:26px;letter-spacing:.2px;}
.mebook-root .auth-tabs{display:flex;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:5px;margin-bottom:22px;}
.mebook-root .auth-tab{flex:1;padding:10px;border-radius:9px;font-size:14.5px;font-weight:600;color:#94a3b8;transition:all .25s cubic-bezier(.2,.8,.3,1);}
.mebook-root .auth-tab:hover{color:#e2e8f0;}
.mebook-root .auth-tab.active{background:linear-gradient(135deg,#16a34a,#22c55e);color:#fff;box-shadow:0 6px 18px rgba(34,197,94,.35),0 1px 0 rgba(255,255,255,.15) inset;}
.mebook-root .auth-field{margin-bottom:14px;animation:fieldIn .4s ease;}
@keyframes fieldIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;}}
.mebook-root .auth-field label{display:block;font-size:12.5px;font-weight:600;margin-bottom:6px;color:#94a3b8;letter-spacing:.3px;text-transform:uppercase;}
.mebook-root .auth-field input{width:100%;padding:13px 16px;border:1.5px solid rgba(255,255,255,.08);border-radius:12px;font-size:15px;outline:none;background:rgba(255,255,255,.04);color:#f3f4f6;transition:border-color .2s,box-shadow .2s,background .2s;}
.mebook-root .auth-field input::placeholder{color:#475569;}
.mebook-root .auth-field input:focus{border-color:#22c55e;background:rgba(34,197,94,.06);box-shadow:0 0 0 4px rgba(34,197,94,.12);}
.mebook-root .auth-btn{width:100%;padding:14px;border-radius:12px;font-size:15px;font-weight:700;color:#fff;margin-top:8px;background:linear-gradient(135deg,#16a34a,#22c55e);box-shadow:0 8px 24px rgba(34,197,94,.35),0 1px 0 rgba(255,255,255,.15) inset;transition:transform .15s,box-shadow .15s,filter .15s;letter-spacing:.3px;}
.mebook-root .auth-btn:hover:not(:disabled){filter:brightness(1.08);}
.mebook-root .auth-btn:active:not(:disabled){transform:scale(.985);}
.mebook-root .auth-btn:disabled{opacity:.6;cursor:not-allowed;}
.mebook-root .auth-divider{display:flex;align-items:center;gap:12px;margin:22px 0;color:#64748b;font-size:12px;font-weight:500;letter-spacing:1px;}
.mebook-root .auth-divider::before,.mebook-root .auth-divider::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent);}
.mebook-root .auth-google{width:100%;padding:13px;border-radius:12px;font-size:14.5px;font-weight:600;background:rgba(255,255,255,.05);color:#f3f4f6;border:1.5px solid rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;gap:10px;transition:background .18s,border-color .18s,transform .12s;}
.mebook-root .auth-google:hover{background:rgba(255,255,255,.09);border-color:rgba(255,255,255,.18);}
.mebook-root .auth-google svg{width:20px;height:20px;flex-shrink:0;}
.mebook-root .auth-err{background:rgba(220,38,38,.12);border:1px solid rgba(220,38,38,.25);color:#fca5a5;font-size:13px;padding:11px 14px;border-radius:10px;margin-top:12px;display:none;animation:shake .4s ease;}
.mebook-root .auth-err.show{display:block;}
@keyframes shake{0%,100%{transform:translateX(0);}25%{transform:translateX(-4px);}75%{transform:translateX(4px);}}

/* ============ HEADER ============ */
.mebook-root .mb-header{
position:fixed;top:0;left:0;right:0;height:60px;z-index:1000;
transition:transform .35s ease;will-change:transform;
background:var(--header-bg);
display:flex;align-items:center;justify-content:space-between;
padding:0 16px;
box-shadow:0 2px 12px rgba(0,0,0,.25);
}
.mebook-root.dark-mode .mb-header{
background:#000000;
box-shadow:0 2px 16px rgba(0,0,0,.9);
border-bottom:1px solid #151515;
}
.mebook-root .mb-header-left{display:flex;align-items:center;gap:6px;cursor:pointer;}
.mebook-root .mb-header-logo{
height:42px;width:auto;object-fit:contain;
filter:drop-shadow(0 2px 8px rgba(34,197,94,.35));
}
.mebook-root .mb-logo-stack{
display:flex;flex-direction:column;align-items:flex-start;
gap:1px;line-height:1;
}
.mebook-root .mb-logo-text{font-size:24px;font-weight:800;letter-spacing:-.6px;user-select:none;line-height:1;margin-left:-2px;}
.mebook-root .mb-logo-text .me{
background:linear-gradient(135deg,#22c55e,#4ade80 60%,#86efac);
-webkit-background-clip:text;background-clip:text;
-webkit-text-fill-color:transparent;
}
.mebook-root .mb-logo-text .book{color:#ffffff;}
.mebook-root .mb-beta-badge{
display:inline-flex;align-items:center;gap:4px;
font-size:9px;font-weight:800;letter-spacing:1.5px;
color:#22c55e;
background:linear-gradient(135deg,rgba(34,197,94,.15),rgba(134,239,172,.10));
border:1px solid rgba(34,197,94,.35);
padding:1px 6px;border-radius:6px;
text-transform:uppercase;margin-left:2px;
box-shadow:0 0 8px rgba(34,197,94,.15);
}
.mebook-root.dark-mode .mb-beta-badge{
color:#4ade80;
background:linear-gradient(135deg,rgba(34,197,94,.20),rgba(134,239,172,.12));
border-color:rgba(74,222,128,.45);
box-shadow:0 0 10px rgba(34,197,94,.25);
}
.mebook-root .mb-beta-dot{
width:4px;height:4px;border-radius:50%;
background:#22c55e;
animation:betaPulse 1.6s ease-in-out infinite;
}
@keyframes betaPulse{
0%,100%{opacity:1;transform:scale(1);}
50%{opacity:.4;transform:scale(1.3);}
}
.mebook-root .mb-header-right{display:flex;align-items:center;gap:8px;}
.mebook-root .mb-icon-btn{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.1);transition:background .2s,transform .15s;color:#e4e6eb;position:relative;}
.mebook-root .mb-icon-btn:hover{background:rgba(255,255,255,.2);}
.mebook-root .mb-icon-btn:active{transform:scale(.93);}
.mebook-root .mb-icon-btn svg{width:20px;height:20px;fill:currentColor;}
.mebook-root .mb-icon-btn.active{background:rgba(255,255,255,.25);}
.mebook-root .mb-badge-dot{position:absolute;top:6px;right:6px;min-width:16px;height:16px;background:#ef4444;color:#fff;font-size:10px;font-weight:700;border-radius:8px;display:flex;align-items:center;justify-content:center;padding:0 4px;border:2px solid #1e293b;}
.mebook-root.dark-mode .mb-badge-dot{border-color:#000000;}
.mebook-root .mb-avatar-btn{width:40px;height:40px;border-radius:50%;overflow:hidden;border:2px solid rgba(255,255,255,.3);transition:border-color .2s,transform .15s;padding:0;background:#334155;}
.mebook-root .mb-avatar-btn:hover{border-color:var(--green-light);}
.mebook-root .mb-avatar-btn:active{transform:scale(.93);}
.mebook-root .mb-avatar-btn img{width:100%;height:100%;object-fit:cover;}

/* ============ FACEBOOK-STYLE NAV BAR (below header, always visible) ============ */
.mebook-root .mb-navbar{
position:fixed;top:60px;left:0;right:0;height:48px;z-index:999;
display:flex;align-items:stretch;justify-content:center;
background:var(--header-bg);
border-top:1px solid rgba(255,255,255,.06);
box-shadow:0 2px 12px rgba(0,0,0,.25);
transition:transform .35s ease;will-change:transform;
}
.mebook-root.dark-mode .mb-navbar{background:#000000;border-top-color:#151515;border-bottom:1px solid #151515;box-shadow:0 2px 16px rgba(0,0,0,.9);}
.mebook-root .mb-navbar-inner{display:flex;align-items:stretch;width:100%;max-width:640px;}
.mebook-root .mb-nav-tab{
flex:1;position:relative;display:flex;align-items:center;justify-content:center;
color:#b0b3b8;background:transparent;border:none;cursor:pointer;padding:0;
-webkit-tap-highlight-color:transparent;
transition:color .2s,background .2s;
}
.mebook-root .mb-nav-tab:hover{background:rgba(255,255,255,.06);}
.mebook-root .mb-nav-tab:active{background:rgba(255,255,255,.1);}
.mebook-root .mb-nav-tab svg{width:26px;height:26px;fill:currentColor;}
.mebook-root .mb-nav-tab.active{color:#22c55e;}
.mebook-root .mb-nav-tab::after{
content:"";position:absolute;left:14%;right:14%;bottom:0;height:3px;border-radius:3px 3px 0 0;
background:#22c55e;transform:scaleX(0);transition:transform .22s ease;
}
.mebook-root .mb-nav-tab.active::after{transform:scaleX(1);}
.mebook-root .mb-nav-tab .mb-badge-dot{top:4px;right:calc(50% - 22px);}
.mebook-root .mb-nav-tab .mb-nav-avatar{
width:28px;height:28px;border-radius:50%;overflow:hidden;
border:2px solid transparent;background:#334155;display:block;
transition:border-color .2s;
}
.mebook-root .mb-nav-tab .mb-nav-avatar img{width:100%;height:100%;object-fit:cover;display:block;}
.mebook-root .mb-nav-tab.active .mb-nav-avatar{border-color:#22c55e;}
.mebook-root .mb-nav-tab.mb-nav-tab-avatar::after{display:block;}

/* ============ NAV BAR v2: clean filled icons (light = white bar + black active, dark = black bar + white active) ============ */
.mebook-root .mb-navbar{background:#ffffff;border-top:none;border-bottom:1px solid #e4e6eb;box-shadow:0 2px 10px rgba(0,0,0,.06);}
.mebook-root.dark-mode .mb-navbar{background:#000000;border-bottom:1px solid #1c1c1c;box-shadow:0 2px 14px rgba(0,0,0,.8);}
.mebook-root .mb-nav-tab{color:#a6a9ae;}
.mebook-root .mb-nav-tab:hover{background:rgba(0,0,0,.04);}
.mebook-root .mb-nav-tab:active{background:rgba(0,0,0,.08);}
.mebook-root.dark-mode .mb-nav-tab{color:#6b6f75;}
.mebook-root.dark-mode .mb-nav-tab:hover{background:rgba(255,255,255,.06);}
.mebook-root.dark-mode .mb-nav-tab:active{background:rgba(255,255,255,.1);}
.mebook-root .mb-nav-tab svg{width:24px;height:24px;transition:transform .2s ease,fill .2s ease;}
.mebook-root .mb-nav-tab.active{color:#0b0b0c;}
.mebook-root.dark-mode .mb-nav-tab.active{color:#ffffff;}
.mebook-root .mb-nav-tab.active svg{transform:scale(1.08);}
.mebook-root .mb-nav-tab::after{left:50%;right:auto;width:18px;margin-left:-9px;height:3px;bottom:3px;border-radius:3px;background:currentColor;transform:scaleX(0);opacity:0;transition:transform .22s ease,opacity .22s ease;}
.mebook-root .mb-nav-tab.active::after{transform:scaleX(1);opacity:1;}
.mebook-root .mb-nav-tab .mb-badge-dot{border-color:#ffffff;}
.mebook-root.dark-mode .mb-nav-tab .mb-badge-dot{border-color:#000000;}
.mebook-root .mb-nav-tab .mb-nav-avatar{width:26px;height:26px;opacity:.8;transition:border-color .2s,opacity .2s;}
.mebook-root .mb-nav-tab.active .mb-nav-avatar{border-color:currentColor;opacity:1;}

/* ============ SHORTS PAGE (Facebook Reels style) ============ */
.mebook-root .shp-root{position:fixed;left:0;right:0;top:108px;bottom:0;z-index:900;background:#000;color:#fff;overflow:hidden;}
.mebook-root .shp-wrap{position:absolute;inset:0;overflow-y:scroll;scroll-snap-type:y mandatory;overscroll-behavior:contain;scrollbar-width:none;-webkit-overflow-scrolling:touch;}
.mebook-root .shp-wrap::-webkit-scrollbar{display:none;}
.mebook-root .shp-item{position:relative;height:100%;scroll-snap-align:start;scroll-snap-stop:always;overflow:hidden;background:#000;}
.mebook-root .shp-box{position:absolute;inset:0;container-type:size;display:flex;align-items:center;justify-content:center;}
.mebook-root .shp-stage{position:relative;overflow:hidden;background:#000;width:min(100cqw,calc(100cqh * var(--ar,.5625)));height:min(100cqh,calc(100cqw / var(--ar,.5625)));}
.mebook-root .shp-frame{position:absolute;left:0;right:0;top:0;bottom:0;}
.mebook-root .shp-mount{position:absolute;inset:0;}
.mebook-root .shp-mount iframe{position:absolute;inset:0;width:100%;height:100%;border:0;pointer-events:none;}
.mebook-root .shp-thumb{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
.mebook-root .shp-tap{position:absolute;inset:0;z-index:3;cursor:pointer;}
.mebook-root .shp-shade{position:absolute;left:0;right:0;bottom:0;height:48%;background:linear-gradient(to top,rgba(0,0,0,.78),rgba(0,0,0,0));pointer-events:none;z-index:4;}
.mebook-root .shp-top{position:absolute;top:0;left:0;right:0;z-index:20;display:flex;align-items:center;justify-content:space-between;padding:10px 12px;pointer-events:none;background:linear-gradient(to bottom,rgba(0,0,0,.55),rgba(0,0,0,0));}
.mebook-root .shp-title{font-size:21px;font-weight:800;color:#fff;letter-spacing:-.3px;display:flex;align-items:center;gap:7px;text-shadow:0 1px 4px rgba(0,0,0,.6);}
.mebook-root .shp-title i{display:inline-block;width:0;height:0;border-left:9px solid #ff3b3b;border-top:6px solid transparent;border-bottom:6px solid transparent;}
.mebook-root .shp-mute{pointer-events:auto;width:38px;height:38px;border-radius:50%;background:rgba(0,0,0,.45);color:#fff;display:flex;align-items:center;justify-content:center;border:none;cursor:pointer;}
.mebook-root .shp-mute svg{width:22px;height:22px;fill:currentColor;}
.mebook-root .shp-acts{position:absolute;right:8px;bottom:calc(22px + env(safe-area-inset-bottom,0px));z-index:6;display:flex;flex-direction:column;align-items:center;gap:16px;}
.mebook-root .shp-act{display:flex;flex-direction:column;align-items:center;gap:3px;min-width:46px;color:#fff;background:none;border:none;padding:0;cursor:pointer;font-size:12.5px;font-weight:700;text-shadow:0 1px 4px rgba(0,0,0,.75);-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;}
.mebook-root .shp-act svg{width:30px;height:30px;fill:currentColor;filter:drop-shadow(0 1px 3px rgba(0,0,0,.6));}
.mebook-root .shp-act:active{transform:scale(.92);}
.mebook-root .shp-act.on{color:#22c55e;}
.mebook-root .shp-info{position:absolute;left:12px;right:74px;bottom:calc(24px + env(safe-area-inset-bottom,0px));z-index:6;display:flex;flex-direction:column;gap:8px;text-shadow:0 1px 4px rgba(0,0,0,.75);}
.mebook-root .shp-user{display:flex;align-items:center;gap:10px;min-width:0;}
.mebook-root .shp-user img{width:38px;height:38px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,.9);flex-shrink:0;background:#334155;cursor:pointer;}
.mebook-root .shp-uname{font-size:15px;font-weight:800;display:flex;align-items:center;gap:5px;min-width:0;cursor:pointer;}
.mebook-root .shp-uname span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.mebook-root .shp-utime{font-size:12px;opacity:.85;font-weight:600;}
.mebook-root .shp-cap{font-size:14px;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-word;white-space:pre-wrap;}
.mebook-root .shp-cap.open{display:block;max-height:32vh;overflow-y:auto;-webkit-line-clamp:unset;}
.mebook-root .shp-seek{position:absolute;left:0;right:0;bottom:0;width:100%;height:14px;margin:0;z-index:7;accent-color:#ffffff;cursor:pointer;opacity:.95;}
.mebook-root .shp-empty{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:#b0b3b8;text-align:center;padding:24px;font-size:15px;}
.mebook-root .shp-empty b{color:#fff;font-size:18px;}

/* ============ 3-DOTS MENU ============ */
.mebook-root .mb-menu-backdrop{
position:fixed;inset:0;z-index:1050;
background:transparent;
opacity:0;visibility:hidden;
transition:opacity .2s ease, visibility .2s ease;
}
.mebook-root .mb-menu-backdrop.open{opacity:1;visibility:visible;}
.mebook-root .mb-menu{
position:fixed;top:68px;right:16px;z-index:1060;
min-width:290px;max-width:calc(100vw - 32px);
background:var(--card);
border-radius:14px;
box-shadow:0 16px 48px rgba(0,0,0,.18), 0 0 0 1px rgba(0,0,0,.05);
padding:8px;
transform-origin:top right;
transform:scale(.9) translateY(-8px);
opacity:0;visibility:hidden;
transition:transform .22s cubic-bezier(.2,.8,.3,1), opacity .22s ease, visibility .22s ease;
max-height:calc(100vh - 80px);
overflow-y:auto;
overscroll-behavior:contain;
}
.mebook-root .mb-menu.open{transform:scale(1) translateY(0);opacity:1;visibility:visible;}
.mebook-root.dark-mode .mb-menu{box-shadow:0 16px 48px rgba(0,0,0,.9), 0 0 0 1px rgba(255,255,255,.04);}
.mebook-root .mb-menu-head{display:flex;align-items:center;gap:10px;padding:10px 10px 12px;border-bottom:1px solid var(--border);margin-bottom:6px;cursor:pointer;transition:background .15s;border-radius:8px;}
.mebook-root .mb-menu-head img{width:42px;height:42px;border-radius:50%;object-fit:cover;background:#cbd5e1;flex-shrink:0;}
.mebook-root .mb-menu-head-info{flex:1;min-width:0;}
.mebook-root .mb-menu-head-name{font-size:14.5px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.mebook-root .mb-menu-head-email{font-size:12px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px;}
.mebook-root .mb-menu-item{display:flex;align-items:center;gap:12px;width:100%;padding:10px 12px;border-radius:10px;font-size:14.5px;font-weight:500;color:var(--text);text-align:left;transition:background .15s ease, transform .12s ease;}
.mebook-root .mb-menu-item:active{transform:scale(.98);}
.mebook-root .mb-menu-item.danger{color:#dc2626;}
.mebook-root .mb-menu-item.danger .mb-menu-ico{background:rgba(220,38,38,.12);}
.mebook-root .mb-menu-item.danger .mb-menu-ico svg{fill:#dc2626;}
.mebook-root.dark-mode .mb-menu-item.danger{color:#f87171;}
.mebook-root.dark-mode .mb-menu-item.danger .mb-menu-ico{background:rgba(248,113,113,.14);}
.mebook-root.dark-mode .mb-menu-item.danger .mb-menu-ico svg{fill:#f87171;}
.mebook-root .mb-menu-ico{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--input-bg);flex-shrink:0;}
.mebook-root .mb-menu-ico svg{width:18px;height:18px;fill:var(--text);}
.mebook-root .mb-menu-ico.green{background:rgba(34,197,94,.15);}
.mebook-root .mb-menu-ico.green svg{fill:var(--green);}
.mebook-root .mb-menu-ico.red{background:rgba(239,68,68,.15);}
.mebook-root .mb-menu-ico.red svg{fill:#ef4444;}
.mebook-root .mb-menu-ico.blue{background:rgba(59,130,246,.15);}
.mebook-root .mb-menu-ico.blue svg{fill:#3b82f6;}
.mebook-root .mb-menu-badge{margin-left:auto;background:#ef4444;color:#fff;font-size:11px;font-weight:700;border-radius:10px;padding:2px 7px;min-width:20px;text-align:center;}
.mebook-root .mb-menu-divider{height:1px;background:var(--border);margin:6px 4px;}
.mebook-root .mb-menu-item .mb-menu-switch{margin-left:auto;flex-shrink:0;}

/* ============ LAYOUT ============ */
.mebook-root .mb-layout{
display:grid;
grid-template-columns:280px minmax(0,1fr) 300px;
gap:20px;max-width:1400px;margin:0 auto;
padding:128px 16px 0;
align-items:start;
min-height:100vh;
}
.mebook-root .mb-sidebar{
position:sticky;
top:128px;
align-self:start;
max-height:calc(100vh - 148px);
overflow-y:auto;
overflow-x:hidden;
padding-bottom:12px;
scrollbar-width:none;
}
.mebook-root .mb-sidebar::-webkit-scrollbar{width:0;}
.mebook-root .mb-side-item{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:10px;font-size:15px;font-weight:600;color:var(--text);transition:background .18s;width:100%;text-align:left;margin-bottom:2px;position:relative;}
.mebook-root .mb-side-item.active{background:var(--green);color:#fff;}
.mebook-root .mb-side-ico{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--border);flex-shrink:0;}
.mebook-root .mb-side-item.active .mb-side-ico{background:rgba(255,255,255,.2);}
.mebook-root .mb-side-ico svg{width:20px;height:20px;fill:var(--text);}
.mebook-root .mb-side-item.active .mb-side-ico svg{fill:#fff;}
.mebook-root .mb-side-badge{margin-left:auto;background:#ef4444;color:#fff;font-size:11px;font-weight:700;border-radius:10px;padding:2px 7px;min-width:20px;text-align:center;}
.mebook-root .mb-side-item.active .mb-side-badge{background:rgba(255,255,255,.3);}
.mebook-root .mb-side-divider{height:1px;background:var(--border);margin:8px 4px;}
.mebook-root .mb-main{min-width:0;padding-bottom:24px;}

/* ============ COMPOSER ============ */
.mebook-root .mb-composer{border-radius:12px;box-shadow:var(--shadow);padding:12px 16px 10px;margin-bottom:16px;transition:background .3s;}
.mebook-root .mb-composer-top{display:flex;gap:10px;align-items:center;}
.mebook-root .mb-composer-avatar{width:40px;height:40px;border-radius:50%;object-fit:cover;background:#cbd5e1;flex-shrink:0;}
.mebook-root .mb-composer-input{flex:1;border:none;border-radius:24px;padding:11px 16px;font-size:15px;color:var(--text);outline:none;cursor:pointer;transition:background .2s;text-align:left;background:var(--input-bg);}
.mebook-root .mb-composer-input::placeholder{color:var(--text-muted);}
.mebook-root .mb-composer-actions{display:flex;gap:6px;margin-top:10px;padding-top:10px;border-top:1px solid var(--border);}
.mebook-root .mb-comp-action{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:8px;border-radius:8px;font-size:14px;font-weight:600;color:var(--text-muted);transition:background .18s;}
.mebook-root .mb-comp-action svg{width:20px;height:20px;}

/* ============ POST ============ */
.mebook-root .mb-post{border-radius:12px;box-shadow:var(--shadow);margin-bottom:16px;overflow:hidden;animation:postIn .35s cubic-bezier(.2,.8,.3,1);transition:background .3s;}
@keyframes postIn{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:none;}}
.mebook-root .mb-post.official{border:1.5px solid rgba(34,197,94,.35);}
.mebook-root.dark-mode .mb-post.official{border-color:rgba(34,197,94,.4);}
.mebook-root .mb-post-head{display:flex;align-items:center;gap:10px;padding:12px 16px 8px;}
.mebook-root .mb-post-head-avatar{width:42px;height:42px;border-radius:50%;object-fit:cover;background:#cbd5e1;cursor:pointer;transition:transform .15s;}
.mebook-root .mb-post-head-avatar:hover{transform:scale(1.05);}
.mebook-root .mb-post-head-info{flex:1;min-width:0;}
.mebook-root .mb-post-author{font-size:15px;font-weight:700;cursor:pointer;line-height:1.3;display:flex;align-items:center;gap:5px;}
.mebook-root .mb-post-author:hover{text-decoration:underline;}
.mebook-root .mb-post-meta{font-size:12.5px;color:var(--text-muted);display:flex;align-items:center;gap:5px;margin-top:1px;}
.mebook-root .mb-post-meta .globe{width:12px;height:12px;fill:currentColor;}
.mebook-root .mb-post-more{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--text-muted);transition:background .18s;}
.mebook-root .mb-post-more svg{width:20px;height:20px;fill:currentColor;}
.mebook-root .mb-post-caption{padding:2px 16px 10px;font-size:15px;line-height:1.45;color:var(--text);white-space:pre-wrap;word-wrap:break-word;}
.mebook-root .mb-post-media{background:#000;position:relative;max-height:560px;overflow:hidden;}
.mebook-root .mb-post-media img{width:100%;max-height:560px;object-fit:contain;margin:0 auto;}
.mebook-root .mb-movie-badge{position:absolute;top:12px;left:12px;display:flex;align-items:center;gap:6px;background:rgba(0,0,0,.68);backdrop-filter:blur(6px);color:#fff;font-size:12px;font-weight:600;padding:5px 10px;border-radius:20px;}
.mebook-root .mb-movie-badge svg{width:14px;height:14px;fill:#fbbf24;}
.mebook-root .mb-post-stats{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;font-size:13.5px;color:var(--text-muted);}
.mebook-root .mb-reacts{display:flex;align-items:center;gap:6px;cursor:pointer;}
.mebook-root .mb-react-pill{display:flex;align-items:center;gap:2px;background:transparent;font-size:14px;}
.mebook-root .mb-react-pill span{font-size:13px;color:var(--text-muted);font-weight:600;margin-left:2px;}
.mebook-root .mb-post-actions{display:flex;border-top:1px solid var(--border);margin:0 4px;padding:4px 0;position:relative;}
.mebook-root .mb-action{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:9px;border-radius:8px;font-size:14.5px;font-weight:600;color:var(--text-muted);transition:background .18s,color .18s;position:relative;}
.mebook-root .mb-action.liked{color:#ef4444;}
.mebook-root .mb-action svg{width:19px;height:19px;fill:currentColor;transition:transform .2s;}
.mebook-root .mb-action.liked svg{animation:likePop .4s ease;}
@keyframes likePop{0%{transform:scale(1);}50%{transform:scale(1.35);}100%{transform:scale(1);}}

/* ============ Facebook-style reaction picker on posts ============ */
.mebook-root .post-reaction-picker{
position:fixed;z-index:3000;
background:var(--card);
border-radius:30px;
padding:6px 8px;
display:flex;gap:2px;
box-shadow:0 6px 24px rgba(0,0,0,.25), 0 0 0 1px rgba(0,0,0,.05);
transform:scale(.7) translateY(8px);
opacity:0;pointer-events:none;
transform-origin:bottom left;
transition:transform .22s cubic-bezier(.2,1.4,.4,1), opacity .18s ease;
}
.mebook-root.dark-mode .post-reaction-picker{
box-shadow:0 6px 28px rgba(0,0,0,.9), 0 0 0 1px rgba(255,255,255,.06);
}
.mebook-root .post-reaction-picker.open{
opacity:1;pointer-events:auto;
transform:scale(1) translateY(0);
}
.mebook-root .post-reaction-picker button{
width:42px;height:42px;border-radius:50%;
display:flex;align-items:center;justify-content:center;
font-size:26px;line-height:1;
transition:transform .18s ease, background .15s;
cursor:pointer;
}
.mebook-root .post-reaction-picker button:hover,
.mebook-root .post-reaction-picker button.swipe-active{
transform:scale(1.45) translateY(-8px);
background:var(--hover);
}

/* Fast like flyer animation */
@keyframes fastLikeFly{
0%{transform:scale(0.5);opacity:1;}
50%{transform:scale(1.6);opacity:1;}
100%{transform:scale(2.5) translateY(-40px);opacity:0;}
}
.mebook-root .fast-like-flyer{
position:fixed;z-index:3500;font-size:28px;
pointer-events:none;
animation:fastLikeFly .6s cubic-bezier(.2,.8,.3,1) forwards;
}

/* ============ Facebook-style reactions (rx-*) ============ */
.mebook-root .rx-badge{display:inline-flex;align-items:center;justify-content:center;border-radius:50%;flex-shrink:0;}
.mebook-root .rx-badge svg.rx-svg{width:58%;height:58%;fill:#fff;}
.mebook-root .rx-emoji{display:inline-flex;align-items:center;justify-content:center;line-height:1;flex-shrink:0;border-radius:50%;}
.mebook-root .rx-ring{box-shadow:0 0 0 2px var(--card);background:var(--card);}
.mebook-root .rx-stack{display:inline-flex;align-items:center;}
.mebook-root .rx-stack-item{display:inline-flex;position:relative;}
.mebook-root .rx-like-btn{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;}
.mebook-root .rx-btn-ico{display:inline-flex;align-items:center;justify-content:center;}
.mebook-root .rx-btn-ico.rx-land{animation:rxLand .5s cubic-bezier(.2,1.7,.4,1);}
@keyframes rxLand{0%{transform:scale(.2) rotate(-25deg);}55%{transform:scale(1.5) rotate(8deg);}100%{transform:scale(1) rotate(0);}}
.mebook-root .rx-count-link{cursor:pointer;}
.mebook-root .rx-count-link:hover{text-decoration:underline;}

.mebook-root .rx-picker{position:fixed;z-index:3000;display:flex;flex-direction:column;align-items:flex-start;pointer-events:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;}
.mebook-root .rx-picker.open{pointer-events:auto;}
.mebook-root .rx-bar{display:flex;align-items:flex-end;padding:6px 8px;background:var(--card);border-radius:36px;box-shadow:0 8px 28px rgba(0,0,0,.28),0 0 0 1px rgba(0,0,0,.06);transform-origin:bottom left;transform:scale(.3) translateY(10px);opacity:0;transition:transform .3s cubic-bezier(.2,1.4,.4,1),opacity .14s ease;}
.mebook-root.dark-mode .rx-bar{box-shadow:0 8px 30px rgba(0,0,0,.9),0 0 0 1px rgba(255,255,255,.08);}
.mebook-root .rx-picker.below .rx-bar{transform-origin:top left;}
.mebook-root .rx-picker.open .rx-bar{transform:scale(1) translateY(0);opacity:1;}
.mebook-root .rx-slot{position:relative;width:40px;height:44px;padding:0;display:flex;align-items:flex-end;justify-content:center;background:none;border:0;cursor:pointer;touch-action:none;-webkit-tap-highlight-color:transparent;}
.mebook-root .rx-pop{display:flex;}
.mebook-root .rx-picker.open .rx-pop{animation:rxIconIn .55s cubic-bezier(.2,1.5,.4,1) both;animation-delay:calc(var(--i) * 45ms + 70ms);}
@keyframes rxIconIn{0%{transform:translateY(26px) scale(.15);opacity:0;}55%{transform:translateY(-9px) scale(1.18);opacity:1;}100%{transform:translateY(0) scale(1);opacity:1;}}
.mebook-root .rx-item{display:flex;transform-origin:bottom center;transition:transform .2s cubic-bezier(.3,1.6,.5,1);}
.mebook-root .rx-slot.active .rx-item{transform:translateY(-14px) scale(1.55);}
.mebook-root .rx-picker.has-active .rx-slot:not(.active) .rx-item{transform:scale(.8);}
.mebook-root .rx-slot.active .rx-item{animation:rxWiggle .5s ease .1s;}
@keyframes rxWiggle{0%,100%{rotate:0deg;}30%{rotate:-8deg;}65%{rotate:7deg;}}
.mebook-root .rx-label{position:absolute;bottom:calc(100% + 26px);left:50%;transform:translateX(-50%) scale(.7);opacity:0;pointer-events:none;background:rgba(18,18,18,.88);color:#fff;font-size:11.5px;font-weight:700;padding:3px 9px;border-radius:12px;white-space:nowrap;transition:opacity .12s,transform .15s cubic-bezier(.3,1.6,.5,1);z-index:2;}
.mebook-root .rx-slot.active .rx-label{opacity:1;transform:translateX(-50%) scale(1);}
.mebook-root .rx-hint{margin:8px 0 0 10px;font-size:12px;font-weight:600;color:var(--text-muted);opacity:0;transition:opacity .2s .15s;text-shadow:0 0 6px var(--bg);}
.mebook-root .rx-picker.open .rx-hint{opacity:1;}
.mebook-root .rx-jump{position:fixed;left:0;top:0;z-index:3600;pointer-events:none;will-change:transform;}

/* ---- Reactions / Comments bottom sheet ---- */
.mebook-root .rx-sheet-backdrop{position:fixed;inset:0;z-index:2800;background:rgba(0,0,0,0);display:flex;align-items:flex-end;justify-content:center;transition:background .25s ease;}
.mebook-root .rx-sheet-backdrop.open{background:rgba(0,0,0,.55);}
.mebook-root .rx-sheet{width:100%;max-width:560px;height:84vh;height:84dvh;background:var(--card);color:var(--text);border-radius:18px 18px 0 0;display:flex;flex-direction:column;overflow:hidden;transform:translateY(100%);transition:transform .3s cubic-bezier(.2,.9,.3,1);box-shadow:0 -6px 30px rgba(0,0,0,.35);}
.mebook-root .rx-sheet-backdrop.open .rx-sheet{transform:translateY(0);}
.mebook-root .rx-sheet-top{flex-shrink:0;padding:6px 14px 4px;touch-action:none;}
.mebook-root .rx-sheet-grip{width:40px;height:4px;border-radius:4px;background:var(--border);margin:2px auto 10px;}
.mebook-root .rx-sheet-head{display:flex;align-items:center;gap:8px;}
.mebook-root .rx-head-pill{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:18px;font-size:14px;font-weight:700;color:var(--text);background:transparent;transition:background .15s;}
.mebook-root .rx-head-pill.active{background:rgba(24,119,242,.16);}
.mebook-root .rx-tabs{display:flex;gap:2px;overflow-x:auto;border-bottom:1px solid var(--border);padding:0 8px;flex-shrink:0;scrollbar-width:none;}
.mebook-root .rx-tabs::-webkit-scrollbar{display:none;}
.mebook-root .rx-tab{display:flex;align-items:center;gap:5px;padding:10px 12px;font-size:14px;font-weight:700;color:var(--text-muted);border-bottom:3px solid transparent;white-space:nowrap;background:none;}
.mebook-root .rx-tab.active{color:var(--text);}
.mebook-root .rx-list{flex:1;overflow-y:auto;overscroll-behavior:contain;padding:6px 0 18px;}
.mebook-root .rx-row{display:flex;align-items:center;gap:12px;padding:8px 16px;}
.mebook-root .rx-row-av{position:relative;width:44px;height:44px;flex-shrink:0;}
.mebook-root .rx-row-av img{width:44px;height:44px;border-radius:50%;object-fit:cover;display:block;background:var(--input-bg);}
.mebook-root .rx-row-badge{position:absolute;right:-3px;bottom:-3px;display:flex;}
.mebook-root .rx-row-name{flex:1;min-width:0;font-size:15px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;display:flex;flex-direction:column;}
.mebook-root .rx-row-name small{font-size:12.5px;font-weight:500;color:var(--text-muted);margin-top:1px;}
.mebook-root .rx-add-btn{padding:8px 14px;border-radius:8px;background:#1877f2;color:#fff;font-size:13.5px;font-weight:700;flex-shrink:0;transition:filter .15s,transform .1s;}
.mebook-root .rx-add-btn:active{transform:scale(.96);}
.mebook-root .rx-add-btn.sent{background:var(--input-bg);color:var(--text-muted);pointer-events:none;}
.mebook-root .rx-empty{padding:40px 20px;text-align:center;color:var(--text-muted);font-size:14px;}
.mebook-root .rx-sort{align-self:flex-start;margin:6px 16px 4px;font-size:14px;font-weight:700;color:var(--text);background:none;}
.mebook-root .rx-cmt{display:flex;gap:9px;padding:6px 16px;align-items:flex-start;}
.mebook-root .rx-cmt.reply{padding-left:56px;}
.mebook-root .rx-cmt-av{width:36px;height:36px;border-radius:50%;object-fit:cover;flex-shrink:0;cursor:pointer;background:var(--input-bg);}
.mebook-root .rx-cmt.reply .rx-cmt-av{width:28px;height:28px;}
.mebook-root .rx-cmt-main{min-width:0;max-width:calc(100% - 46px);}
.mebook-root .rx-cmt-bubble{position:relative;display:inline-block;max-width:100%;background:var(--input-bg);border-radius:18px;padding:8px 12px;font-size:14.5px;line-height:1.35;word-break:break-word;white-space:pre-wrap;}
.mebook-root .rx-cmt-bubble b{display:flex;align-items:center;gap:4px;font-size:13.5px;margin-bottom:1px;}
.mebook-root .rx-cmt-bubble img{display:block;max-width:100%;max-height:200px;border-radius:12px;margin-top:6px;}
.mebook-root .rx-cmt-react{position:absolute;right:-6px;bottom:-9px;display:flex;align-items:center;gap:3px;background:var(--card);border-radius:12px;padding:1px 5px 1px 2px;box-shadow:0 1px 4px rgba(0,0,0,.3);font-size:11.5px;font-weight:700;color:var(--text-muted);}
.mebook-root .rx-cmt-meta{display:flex;align-items:center;gap:14px;padding:3px 12px 0;font-size:12.5px;font-weight:700;color:var(--text-muted);}
.mebook-root .rx-cmt-meta span{font-weight:500;}
.mebook-root .rx-cmt-meta button{font-size:12.5px;font-weight:700;color:var(--text-muted);background:none;padding:2px 0;}
.mebook-root .rx-foot{flex-shrink:0;border-top:1px solid var(--border);padding:8px 12px calc(10px + env(safe-area-inset-bottom,0px));background:var(--card);}
.mebook-root .rx-quick{display:flex;justify-content:space-between;padding:2px 4px 8px;}
.mebook-root .rx-quick button{font-size:26px;line-height:1;padding:3px;background:none;transition:transform .15s cubic-bezier(.3,1.6,.5,1);}
.mebook-root .rx-quick button:active{transform:scale(1.35);}
.mebook-root .rx-replying{display:flex;align-items:center;justify-content:space-between;font-size:12.5px;color:var(--text-muted);padding:0 6px 6px;}
.mebook-root .rx-replying button{font-weight:700;color:var(--text);background:none;}
.mebook-root .rx-write{display:flex;align-items:center;gap:8px;background:var(--input-bg);border-radius:22px;padding:4px 6px 4px 14px;}
.mebook-root .rx-write input{flex:1;min-width:0;background:transparent;border:0;outline:0;color:var(--text);font-size:14.5px;padding:8px 0;}
.mebook-root .rx-send{width:34px;height:34px;border-radius:50%;background:#1877f2;color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.mebook-root .rx-send:disabled{opacity:.5;}
.mebook-root .rx-send svg{width:18px;height:18px;fill:currentColor;}

/* ---- Comments sheet v2: composer tools, stickers, edit ---- */
.mebook-root .rx-head-shares{margin-left:auto;font-size:13.5px;color:var(--text-muted);font-weight:600;padding-right:4px;}
.mebook-root .rx-write{padding:2px 14px;}
.mebook-root .rx-tools{display:flex;align-items:center;gap:6px;padding:8px 2px 0;}
.mebook-root .rx-tool{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#1877f2;background:none;transition:background .15s,transform .1s;}
.mebook-root .rx-tool svg{width:24px;height:24px;fill:currentColor;}
.mebook-root .rx-tool:active{transform:scale(.92);}
.mebook-root .rx-tool.on{background:rgba(24,119,242,.16);}
.mebook-root .rx-tool.send{margin-left:auto;}
.mebook-root .rx-tool.send:disabled{color:var(--text-muted);opacity:.55;}
.mebook-root .rx-img-prev{position:relative;display:inline-block;margin:0 0 8px 4px;}
.mebook-root .rx-img-prev img{height:84px;max-width:160px;border-radius:12px;object-fit:cover;display:block;}
.mebook-root .rx-img-prev button{position:absolute;top:-6px;right:-6px;width:22px;height:22px;border-radius:50%;background:rgba(0,0,0,.75);color:#fff;display:flex;align-items:center;justify-content:center;}
.mebook-root .rx-img-prev button svg{width:14px;height:14px;fill:currentColor;}
.mebook-root .rx-lock{padding:14px 10px;text-align:center;font-size:13.5px;color:var(--text-muted);font-weight:600;}
.mebook-root .rx-sticker-panel{margin:8px -12px calc(-10px - env(safe-area-inset-bottom,0px));border-top:1px solid var(--border);height:260px;display:flex;flex-direction:column;background:var(--card);}
.mebook-root .rx-sticker-cats{display:flex;gap:8px;overflow-x:auto;padding:10px 12px;scrollbar-width:none;flex-shrink:0;}
.mebook-root .rx-sticker-cats::-webkit-scrollbar{display:none;}
.mebook-root .rx-sticker-cats button{flex-shrink:0;padding:6px 12px;border-radius:18px;background:var(--input-bg);color:var(--text);font-size:13px;font-weight:700;}
.mebook-root .rx-sticker-cats button.on{background:#1877f2;color:#fff;}
.mebook-root .rx-sticker-grid{flex:1;overflow-y:auto;display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:4px 12px 12px;align-content:start;}
.mebook-root .rx-sticker-grid button{display:flex;align-items:center;justify-content:center;padding:6px;border-radius:12px;background:none;transition:background .15s,transform .12s;}
.mebook-root .rx-sticker-grid button:active{background:var(--hover);transform:scale(.92);}
.mebook-root .rx-cmt-sticker b{display:flex;align-items:center;gap:4px;font-size:13px;margin:0 0 2px 4px;}
.mebook-root .rx-edit-box{background:var(--input-bg);border-radius:14px;padding:8px;}
.mebook-root .rx-edit-box textarea{width:100%;min-height:54px;background:transparent;border:0;outline:0;color:var(--text);font-size:14.5px;resize:none;font-family:inherit;}
.mebook-root .rx-edit-actions{display:flex;justify-content:flex-end;gap:8px;}
.mebook-root .rx-edit-actions button{padding:6px 12px;border-radius:8px;font-size:13px;font-weight:700;background:var(--card);color:var(--text);}
.mebook-root .rx-edit-actions button.save{background:#1877f2;color:#fff;}
.mebook-root .rx-edit-actions button:disabled{opacity:.5;}

/* ---- Shared post embed ---- */
.mebook-root .rx-embed{margin:4px 12px 10px;border:1px solid var(--border);border-radius:12px;overflow:hidden;background:var(--card);}
.mebook-root .rx-embed-head{display:flex;align-items:center;gap:10px;padding:10px 12px 6px;}
.mebook-root .rx-embed-head img{width:36px;height:36px;border-radius:50%;object-fit:cover;cursor:pointer;}
.mebook-root .rx-embed-name{font-size:14.5px;font-weight:700;display:flex;align-items:center;gap:4px;cursor:pointer;}
.mebook-root .rx-embed .mb-post-media{margin:0;}
.mebook-root .rx-embed-unavail{padding:14px 12px;font-size:13.5px;color:var(--text-muted);}
.mebook-root .rx-product{display:flex;align-items:center;gap:8px;margin:0 12px 10px;padding:10px 14px;border-radius:10px;background:var(--input-bg);color:var(--text);font-size:14px;font-weight:700;text-decoration:none;}
.mebook-root .rx-product svg{width:20px;height:20px;fill:#1877f2;flex-shrink:0;}
.mebook-root .rx-post-tag{padding:8px 16px 0;font-size:12.5px;font-weight:700;color:var(--text-muted);}

/* ---- Share sheet ---- */
.mebook-root .sh-backdrop{position:fixed;inset:0;z-index:3000;background:rgba(0,0,0,0);display:flex;align-items:flex-end;justify-content:center;transition:background .25s ease;}
.mebook-root .sh-backdrop.open{background:rgba(0,0,0,.55);}
.mebook-root .sh-sheet{width:100%;max-width:560px;background:var(--bg);color:var(--text);border-radius:18px 18px 0 0;padding:0 0 calc(12px + env(safe-area-inset-bottom,0px));transform:translateY(100%);transition:transform .3s cubic-bezier(.2,.9,.3,1);box-shadow:0 -6px 30px rgba(0,0,0,.35);}
.mebook-root .sh-backdrop.open .sh-sheet{transform:translateY(0);}
.mebook-root .sh-top{padding:6px 0 0;touch-action:none;}
.mebook-root .sh-compose{background:var(--card);margin:2px 10px 10px;border-radius:14px;padding:12px;}
.mebook-root .sh-who{display:flex;gap:10px;align-items:center;}
.mebook-root .sh-who img{width:42px;height:42px;border-radius:50%;object-fit:cover;}
.mebook-root .sh-who-info b{display:flex;align-items:center;gap:4px;font-size:14.5px;}
.mebook-root .sh-chips{display:flex;gap:8px;margin-top:4px;}
.mebook-root .sh-chip{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:7px;background:var(--input-bg);color:var(--text);font-size:12.5px;font-weight:700;}
.mebook-root .sh-chip span{font-size:10px;}
.mebook-root .sh-text{width:100%;margin-top:10px;background:transparent;border:0;outline:0;color:var(--text);font-size:15.5px;resize:none;font-family:inherit;min-height:64px;}
.mebook-root .sh-emojis{display:flex;flex-wrap:wrap;gap:2px;padding:4px 0;}
.mebook-root .sh-emojis button{font-size:22px;padding:4px 6px;background:none;}
.mebook-root .sh-compose-foot{display:flex;align-items:center;justify-content:space-between;}
.mebook-root .sh-emoji-btn{width:34px;height:34px;display:flex;align-items:center;justify-content:center;color:var(--text-muted);background:none;}
.mebook-root .sh-emoji-btn svg{fill:currentColor;width:22px;height:22px;}
.mebook-root .sh-now{padding:9px 18px;border-radius:9px;background:#1877f2;color:#fff;font-size:14.5px;font-weight:700;transition:filter .15s,transform .1s;}
.mebook-root .sh-now:active{transform:scale(.97);}
.mebook-root .sh-now:disabled{opacity:.6;}
.mebook-root .sh-row{display:flex;gap:14px;overflow-x:auto;padding:6px 14px 10px;scrollbar-width:none;}
.mebook-root .sh-row::-webkit-scrollbar{display:none;}
.mebook-root .sh-friend{display:flex;flex-direction:column;align-items:center;gap:5px;width:62px;flex-shrink:0;background:none;color:var(--text);}
.mebook-root .sh-friend-av{position:relative;width:54px;height:54px;}
.mebook-root .sh-friend-av img{width:54px;height:54px;border-radius:50%;object-fit:cover;}
.mebook-root .sh-friend-av i{position:absolute;inset:0;border-radius:50%;background:rgba(0,0,0,.55);color:#fff;display:flex;align-items:center;justify-content:center;font-style:normal;font-size:18px;font-weight:800;}
.mebook-root .sh-friend-av i.ok{background:rgba(24,119,242,.85);}
.mebook-root .sh-friend-nm{font-size:11.5px;font-weight:600;text-align:center;line-height:1.15;max-height:27px;overflow:hidden;}
.mebook-root .sh-app{display:flex;flex-direction:column;align-items:center;gap:5px;width:62px;flex-shrink:0;background:none;color:var(--text);}
.mebook-root .sh-app-ic{width:54px;height:54px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:transform .12s;}
.mebook-root .sh-app:active .sh-app-ic{transform:scale(.92);}
.mebook-root .sh-app-ic svg{width:26px;height:26px;}
.mebook-root .sh-app-lb{font-size:11.5px;font-weight:600;text-align:center;line-height:1.15;}

/* ---- Post menu / choice sheets (pm-*) ---- */
.mebook-root .pm-backdrop{position:fixed;inset:0;z-index:3000;background:rgba(0,0,0,0);display:flex;align-items:flex-end;justify-content:center;transition:background .22s ease;}
.mebook-root .pm-backdrop.open{background:rgba(0,0,0,.55);}
.mebook-root .pm-sheet{width:100%;max-width:560px;background:var(--bg);color:var(--text);border-radius:18px 18px 0 0;padding:6px 10px calc(12px + env(safe-area-inset-bottom,0px));box-shadow:0 -6px 30px rgba(0,0,0,.35);transform:translateY(100%);transition:transform .28s cubic-bezier(.2,.9,.3,1);}
.mebook-root .pm-backdrop.open .pm-sheet{transform:translateY(0);}
.mebook-root .pm-sheet.pm-choice,.mebook-root .pm-sheet.pm-full{animation:sheetUp .25s cubic-bezier(.2,.9,.3,1);}
.mebook-root .pm-menu{max-height:90vh;max-height:90dvh;display:flex;flex-direction:column;}
.mebook-root .pm-menu-scroll{overflow-y:auto;overscroll-behavior:contain;padding-bottom:6px;}
.mebook-root .pm-card{background:var(--card);border-radius:14px;padding:6px 4px;margin-bottom:10px;}
.mebook-root .pm-row{width:100%;display:flex;align-items:center;gap:14px;padding:11px 12px;text-align:left;background:none;color:var(--text);border-radius:10px;}
.mebook-root .pm-row:active{background:var(--hover);}
.mebook-root .pm-row svg{width:24px;height:24px;fill:currentColor;flex-shrink:0;}
.mebook-root .pm-row-txt{display:flex;flex-direction:column;font-size:15px;font-weight:700;min-width:0;}
.mebook-root .pm-row-txt small{font-size:12.5px;font-weight:500;color:var(--text-muted);margin-top:1px;}
.mebook-root .pm-row.danger{color:#ef4444;}
.mebook-root .pm-choice{padding-top:10px;}
.mebook-root .pm-back{width:36px;height:36px;display:flex;align-items:center;justify-content:center;background:none;color:var(--text);}
.mebook-root .pm-back svg{width:26px;height:26px;fill:currentColor;}
.mebook-root .pm-choice-title{font-size:17px;font-weight:800;padding:2px 10px 4px;}
.mebook-root .pm-choice-sub{font-size:13px;color:var(--text-muted);padding:0 10px 8px;}
.mebook-root .pm-choice-list{padding:4px 0;}
.mebook-root .pm-choice-row{width:100%;display:flex;align-items:center;gap:14px;padding:12px 10px;background:none;color:var(--text);text-align:left;}
.mebook-root .pm-choice-ic{width:28px;display:flex;justify-content:center;}
.mebook-root .pm-choice-ic svg{width:24px;height:24px;fill:currentColor;}
.mebook-root .pm-choice-txt{flex:1;display:flex;flex-direction:column;font-size:15px;font-weight:700;}
.mebook-root .pm-choice-txt small{font-size:12px;font-weight:500;color:var(--text-muted);}
.mebook-root .pm-radio{width:22px;height:22px;border-radius:50%;border:2px solid var(--text-muted);flex-shrink:0;position:relative;transition:border-color .15s;}
.mebook-root .pm-radio.on{border-color:#1877f2;}
.mebook-root .pm-radio.on::after{content:"";position:absolute;inset:3px;border-radius:50%;background:#1877f2;}
.mebook-root .pm-default{display:flex;align-items:center;justify-content:space-between;padding:12px 10px;font-size:13.5px;color:var(--text-muted);}
.mebook-root .pm-default input{width:20px;height:20px;accent-color:#1877f2;}
.mebook-root .pm-done{width:100%;padding:12px;border-radius:10px;background:#1877f2;color:#fff;font-size:15px;font-weight:800;margin-top:4px;}
.mebook-root .pm-full{padding-top:8px;}
.mebook-root .pm-full-head{display:flex;align-items:center;gap:8px;padding:4px 4px 8px;font-size:17px;}
.mebook-root .pm-back.inline{width:34px;height:34px;}
.mebook-root .pm-dest{width:100%;display:flex;align-items:center;gap:14px;padding:14px 12px;font-size:15.5px;font-weight:700;background:none;color:var(--text);text-align:left;}
.mebook-root .pm-dest svg{width:24px;height:24px;fill:currentColor;}
.mebook-root .pm-dest .pm-radio{margin-left:auto;}
.mebook-root .pm-manage{height:80vh;height:80dvh;display:flex;flex-direction:column;}
.mebook-root .pm-manage-head{text-align:center;font-size:16px;font-weight:800;padding:2px 0 8px;}
.mebook-root .pm-manage-note{font-size:12.5px;color:var(--text-muted);padding:8px 10px 0;}
.mebook-root .pm-manage-list{flex:1;overflow-y:auto;padding:6px 0;}
.mebook-root .pm-manage-row{display:flex;align-items:center;gap:10px;padding:8px 6px;}
.mebook-root .pm-manage-row img,.mebook-root .pm-manage-ph{width:52px;height:52px;border-radius:10px;object-fit:cover;flex-shrink:0;background:var(--input-bg);display:flex;align-items:center;justify-content:center;font-size:22px;}
.mebook-root .pm-manage-info{flex:1;min-width:0;display:flex;flex-direction:column;}
.mebook-root .pm-manage-info b{font-size:14px;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;}
.mebook-root .pm-manage-info small{font-size:12px;color:var(--text-muted);}
.mebook-root .pm-manage-btn{padding:7px 12px;border-radius:8px;background:var(--input-bg);color:var(--text);font-size:13px;font-weight:700;flex-shrink:0;}
.mebook-root .pm-manage-btn.danger{color:#ef4444;}
.mebook-root .rx-manage-open{margin-left:auto;padding:7px 14px;border-radius:8px;background:var(--input-bg);color:var(--text);font-size:13.5px;font-weight:700;}

/* ============ BUTTONS ============ */
.mebook-root .mb-btn{width:100%;padding:9px;border-radius:9px;font-size:14.5px;font-weight:600;transition:filter .18s,transform .12s,background .2s;}
.mebook-root .mb-btn:active{transform:scale(.98);}
.mebook-root .mb-btn-primary{background:var(--green);color:#fff;}
.mebook-root .mb-btn-primary:hover{filter:brightness(1.08);}
.mebook-root .mb-btn-secondary{background:var(--input-bg);color:var(--text);}
.mebook-root .mb-btn-outline{background:transparent;color:var(--text);border:1px solid var(--border);}
.mebook-root .mb-btn:disabled{opacity:.65;cursor:not-allowed;}
.mebook-root .mb-friend-btn{position:relative;overflow:hidden;transition:all .3s cubic-bezier(.2,.8,.3,1);}
.mebook-root .mb-friend-btn.sending{background:var(--border)!important;color:var(--text-muted)!important;pointer-events:none;}
.mebook-root .mb-friend-btn-row{display:flex;gap:8px;margin-top:12px;}
.mebook-root .mb-friend-btn-row .mb-btn{flex:1;}

/* ============================================================
   MESSENGER — MeChat
   ============================================================ */
.mebook-root .msgr-wrap{
border-radius:12px;box-shadow:var(--shadow);
height:calc(100vh - 100px);min-height:460px;
display:flex;overflow:hidden;position:relative;
}
.mebook-root .msgr-list{
width:340px;border-right:1px solid var(--border);
overflow-y:auto;flex-shrink:0;
}
.mebook-root .msgr-list-head{
padding:14px 16px 8px;font-size:22px;font-weight:800;
display:flex;align-items:center;justify-content:space-between;
position:sticky;top:0;background:var(--card);z-index:2;
}
.mebook-root .msgr-section{font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.6px;padding:10px 16px 6px;}
.mebook-root .msgr-online-row{
display:flex;gap:10px;overflow-x:auto;overflow-y:hidden;
padding:4px 14px 12px;border-bottom:1px solid var(--border);
scroll-behavior:smooth;-webkit-overflow-scrolling:touch;scrollbar-width:none;
}
.mebook-root .msgr-online-row::-webkit-scrollbar{height:0;display:none;}
.mebook-root .msgr-online-item{flex-shrink:0;text-align:center;width:62px;cursor:pointer;}
.mebook-root .msgr-online-avatar-wrap{position:relative;width:52px;height:52px;margin:0 auto;}
.mebook-root .msgr-online-avatar-wrap img{width:52px;height:52px;border-radius:50%;object-fit:cover;background:#cbd5e1;border:2px solid transparent;}
.mebook-root .msgr-online-item:hover .msgr-online-avatar-wrap img{border-color:var(--green);}
.mebook-root .msgr-online-dot{position:absolute;right:2px;bottom:2px;width:13px;height:13px;border-radius:50%;background:#22c55e;border:2.5px solid var(--card);}
.mebook-root .msgr-online-name{font-size:11.5px;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--text-muted);}
.mebook-root .msgr-item{display:flex;gap:10px;padding:10px 14px;cursor:pointer;transition:background .15s;position:relative;}
.mebook-root .msgr-item.active{background:rgba(22,163,74,.12);}
.mebook-root .msgr-item-avatar-wrap{position:relative;width:48px;height:48px;flex-shrink:0;}
.mebook-root .msgr-item-avatar-wrap img{width:48px;height:48px;border-radius:50%;object-fit:cover;background:#cbd5e1;}
.mebook-root .msgr-item-dot{position:absolute;right:0;bottom:0;width:13px;height:13px;border-radius:50%;background:#22c55e;border:2.5px solid var(--card);}
.mebook-root .msgr-item-body{flex:1;min-width:0;}
.mebook-root .msgr-item-name{font-size:14.5px;font-weight:600;color:var(--text);margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.mebook-root .msgr-item-last{font-size:13px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.mebook-root .msgr-item-last.unread{color:var(--text);font-weight:600;}
.mebook-root .msgr-item-time{font-size:11px;color:var(--text-muted);flex-shrink:0;}
.mebook-root .msgr-window{flex:1;display:flex;flex-direction:column;min-width:0;}

/* MeChat fullpage header */
.mebook-root .mechat-page{
display:flex;flex-direction:column;
height:calc(100vh - 60px);
background:var(--card);
overflow:hidden;
}
.mebook-root .mechat-head{
display:flex;align-items:center;gap:10px;
padding:10px 12px;
border-bottom:1px solid var(--border);
flex-shrink:0;background:var(--card);
z-index:5;
}
.mebook-root .mechat-head-back{
width:36px;height:36px;border-radius:50%;
display:flex;align-items:center;justify-content:center;
color:var(--text);flex-shrink:0;
}
.mebook-root .mechat-head-back svg{width:22px;height:22px;fill:currentColor;}
.mebook-root .mechat-head-avatar-wrap{position:relative;flex-shrink:0;cursor:pointer;}
.mebook-root .mechat-head-avatar-wrap img{width:42px;height:42px;border-radius:50%;object-fit:cover;background:#cbd5e1;}
.mebook-root .mechat-head-online{position:absolute;right:0;bottom:0;width:12px;height:12px;border-radius:50%;background:#22c55e;border:2px solid var(--card);}
.mebook-root .mechat-head-info{flex:1;min-width:0;}
.mebook-root .mechat-head-name{font-size:16px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;align-items:center;gap:6px;}
.mebook-root .mechat-head-status{font-size:12px;color:var(--text-muted);margin-top:1px;}

/* ============================================================
   MECHAT — TYPING INDICATOR
   ============================================================ */
.mebook-root .mechat-typing-text{
  color:#16a34a;
  font-weight:600;
  font-size:12px;
}
.mebook-root.dark-mode .mechat-typing-text{
  color:#4ade80;
}
.mebook-root .mechat-typing-dots{
  display:inline-block;
  width:18px;
  overflow:hidden;
  vertical-align:bottom;
  animation:mechatTypingDots 1.2s steps(4,end) infinite;
}
@keyframes mechatTypingDots{
  0%{width:0;}
  100%{width:18px;}
}

.mebook-root .mechat-head-actions{display:flex;gap:4px;flex-shrink:0;}
.mebook-root .mechat-head-btn{
width:38px;height:38px;border-radius:50%;
display:flex;align-items:center;justify-content:center;
color:#0084ff;transition:background .15s;
}
.mebook-root .mechat-head-btn:hover{background:rgba(0,132,255,.08);}
.mebook-root .mechat-head-btn svg{width:22px;height:22px;fill:#0084ff;}
.mebook-root.dark-mode .mechat-head-btn,
.mebook-root.dark-mode .mechat-head-btn svg{color:#4ade80;fill:#4ade80;}

.mebook-root .mechat-body{
flex:1;overflow-y:auto;padding:12px 12px 8px;
background:var(--chat-body-bg);
display:flex;flex-direction:column;gap:2px;
scroll-behavior:smooth;
}
.mebook-root .mechat-body::-webkit-scrollbar{width:6px;}
.mebook-root .mechat-body::-webkit-scrollbar-thumb{background:var(--border);border-radius:10px;}

/* ===== MECHAT MESSAGE ROW ===== */
.mebook-root .mechat-bubble-wrap{
  width:100%;
  display:flex;
  align-items:flex-end;
  gap:6px;
  margin-top:2px;
  position:relative;
  user-select:none;
  box-sizing:border-box;
}

/* ===== MY MESSAGE — RIGHT SIDE ===== */
.mebook-root .mechat-bubble-wrap.me{
  justify-content:flex-end;
  flex-direction:row;
}

/* ===== OTHER PERSON — LEFT SIDE ===== */
.mebook-root .mechat-bubble-wrap.them{
  justify-content:flex-start;
  flex-direction:row;
}

/* Avatar */
.mebook-root .mechat-bubble-avatar{
  width:28px;
  height:28px;
  border-radius:50%;
  object-fit:cover;
  flex-shrink:0;
  background:#cbd5e1;
  opacity:0;
  transition:opacity .2s;
}

.mebook-root .mechat-bubble-wrap.show-avatar .mechat-bubble-avatar{
  opacity:1;
}

/* Message bubble */
.mebook-root .mechat-bubble{
  max-width:72%;
  padding:8px 12px 6px;
  border-radius:18px;
  font-size:14.5px;
  line-height:1.4;
  word-wrap:break-word;
  white-space:pre-wrap;
  animation:bubbleIn .22s ease;
  position:relative;
  display:flex;
  flex-direction:column;
  gap:2px;
  box-sizing:border-box;
}
.mebook-root .mechat-bubble-avatar{
width:28px;height:28px;border-radius:50%;
object-fit:cover;flex-shrink:0;background:#cbd5e1;
opacity:0;transition:opacity .2s;
}
.mebook-root .mechat-bubble-wrap.show-avatar .mechat-bubble-avatar{opacity:1;}
.mebook-root .mechat-bubble{
max-width:72%;padding:8px 12px 6px;
border-radius:18px;font-size:14.5px;line-height:1.4;
word-wrap:break-word;white-space:pre-wrap;
animation:bubbleIn .22s ease;
position:relative;
display:flex;flex-direction:column;gap:2px;
}
@keyframes bubbleIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;}}

/* ============================================================
   MECHAT — SEEN AVATAR
   ============================================================ */
.mebook-root .mechat-seen-avatar{
  width:18px;
  height:18px;
  min-width:18px;
  border-radius:50%;
  object-fit:cover;
  flex-shrink:0;
  align-self:flex-end;
  margin-bottom:2px;
  border:2px solid var(--card);
  box-sizing:border-box;
  animation:mechatSeenIn .2s ease;
}
@keyframes mechatSeenIn{
  from{opacity:0;transform:scale(.7);}
  to{opacity:1;transform:scale(1);}
}


/* ===== MY BUBBLE — GREEN LIQUID GLASS GRADIENT ===== */
.mebook-root .mechat-bubble.me{
background:linear-gradient(135deg,#16a34a 0%,#22c55e 40%,#4ade80 100%);
color:#fff;
border-bottom-right-radius:4px;
backdrop-filter:blur(20px) saturate(180%);
-webkit-backdrop-filter:blur(20px) saturate(180%);
box-shadow:
0 8px 32px rgba(22,163,74,.35),
inset 0 1px 0 rgba(255,255,255,.25),
inset 0 -1px 0 rgba(0,0,0,.1);
border:1px solid rgba(255,255,255,.12);
position:relative;
overflow:hidden;
}
.mebook-root .mechat-bubble.me::before{
content:'';
position:absolute;
top:-50%;left:-50%;
width:200%;height:200%;
background:
radial-gradient(circle at 30% 30%,rgba(255,255,255,.15) 0%,transparent 50%),
radial-gradient(circle at 70% 70%,rgba(134,239,172,.15) 0%,transparent 50%);
pointer-events:none;
animation:liquidShift 6s ease-in-out infinite;
}
@keyframes liquidShift{
0%,100%{transform:translate(0,0) rotate(0deg);}
50%{transform:translate(-5%,-5%) rotate(180deg);}
}

/* THEM BUBBLE */
.mebook-root .mechat-bubble.them{
color:var(--text);border-bottom-left-radius:4px;
box-shadow:0 1px 2px rgba(0,0,0,.08);
background:var(--bubble-them-bg);
backdrop-filter:blur(12px) saturate(160%);
-webkit-backdrop-filter:blur(12px) saturate(160%);
border:1px solid rgba(0,0,0,.04);
}
.mebook-root.dark-mode .mechat-bubble.them{
background:rgba(20,20,20,.85);
border:1px solid rgba(255,255,255,.06);
backdrop-filter:blur(12px) saturate(160%);
}

.mebook-root .mechat-bubble-time{
font-size:10.5px;opacity:.75;align-self:flex-end;margin-top:1px;
font-weight:500;
}
.mebook-root .mechat-bubble-time.them{color:var(--text-muted);}

/* reply quote inside bubble */
.mebook-root .mechat-reply-quote{
border-left:3px solid rgba(255,255,255,.6);
padding:4px 8px;border-radius:6px;
background:rgba(255,255,255,.15);
margin-bottom:4px;font-size:12.5px;
max-width:100%;overflow:hidden;
backdrop-filter:blur(8px);
}
.mebook-root .mechat-bubble.them .mechat-reply-quote{
border-left-color:#0084ff;
background:rgba(0,132,255,.08);
}
.mebook-root .mechat-reply-quote b{
display:block;font-weight:700;font-size:11.5px;
margin-bottom:1px;opacity:.95;
}
.mebook-root .mechat-reply-quote span{
display:block;opacity:.85;
white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}

/* Image bubble */
.mebook-root .mechat-bubble-image{
padding:3px;background:transparent;
max-width:72%;
}
.mebook-root .mechat-bubble-image img{
max-width:260px;max-height:340px;
border-radius:16px;display:block;
object-fit:cover;background:#000;
}
.mebook-root .mechat-bubble-image.me img{border-bottom-right-radius:6px;}
.mebook-root .mechat-bubble-image.them img{border-bottom-left-radius:6px;}
.mebook-root .mechat-image-time{
position:absolute;right:8px;bottom:6px;
background:rgba(0,0,0,.55);color:#fff;
font-size:10px;padding:1px 6px;border-radius:8px;
font-weight:600;
backdrop-filter:blur(4px);
}

/* Voice bubble */
.mebook-root .mechat-voice{
display:flex;align-items:center;gap:10px;
padding:6px 4px;min-width:180px;max-width:240px;
}
.mebook-root .mechat-voice-play{
width:32px;height:32px;border-radius:50%;
background:rgba(255,255,255,.25);
display:flex;align-items:center;justify-content:center;
flex-shrink:0;transition:transform .12s;
backdrop-filter:blur(6px);
}
.mebook-root .mechat-bubble.them .mechat-voice-play{background:rgba(0,132,255,.15);}
.mebook-root .mechat-voice-play:active{transform:scale(.9);}
.mebook-root .mechat-voice-play svg{
width:14px;height:14px;fill:#fff;
}
.mebook-root .mechat-bubble.them .mechat-voice-play svg{fill:#0084ff;}
.mebook-root .mechat-voice-wave{
display:flex;align-items:center;gap:2px;flex:1;height:24px;
}
.mebook-root .mechat-voice-wave span{
display:block;width:2px;border-radius:1px;
background:rgba(255,255,255,.7);
}
.mebook-root .mechat-bubble.them .mechat-voice-wave span{background:rgba(0,132,255,.5);}
.mebook-root .mechat-voice-duration{
font-size:11.5px;font-weight:600;opacity:.9;flex-shrink:0;
}

/* Reaction badge */
.mebook-root .mechat-reaction-badge{
position:absolute;bottom:-6px;
background:var(--card);border-radius:12px;
padding:1px 5px;font-size:13px;
box-shadow:0 1px 4px rgba(0,0,0,.15);
border:1px solid var(--border);
pointer-events:none;
z-index:3;
animation:bubbleIn .2s ease;
}
.mebook-root .mechat-bubble-wrap.me .mechat-reaction-badge{right:6px;}
.mebook-root .mechat-bubble-wrap.them .mechat-reaction-badge{left:6px;}

/* Empty state */
.mebook-root .mechat-empty{
flex:1;display:flex;flex-direction:column;
align-items:center;justify-content:center;
color:var(--text-muted);gap:10px;padding:24px;text-align:center;
}
.mebook-root .mechat-empty svg{width:64px;height:64px;fill:var(--border);}
.mebook-root .mechat-empty b{font-size:16px;}

/* Reply banner above input — LIQUID GLASS */
.mebook-root .mechat-reply-banner{
display:flex;align-items:center;gap:10px;
padding:8px 12px;
background:rgba(0,132,255,.08);
backdrop-filter:blur(20px) saturate(180%);
-webkit-backdrop-filter:blur(20px) saturate(180%);
border-top:1px solid rgba(255,255,255,.1);
border-bottom:1px solid rgba(255,255,255,.1);
flex-shrink:0;
animation:slideDown .2s ease;
}
@keyframes slideDown{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;}}
.mebook-root .mechat-reply-banner .bar{
width:3px;height:34px;border-radius:2px;background:#0084ff;flex-shrink:0;
}
.mebook-root .mechat-reply-banner-info{flex:1;min-width:0;}
.mebook-root .mechat-reply-banner-title{
font-size:12.5px;font-weight:700;color:#0084ff;margin-bottom:1px;
}
.mebook-root .mechat-reply-banner-text{
font-size:13px;color:var(--text-muted);
white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.mebook-root .mechat-reply-banner-close{
width:30px;height:30px;border-radius:50%;
display:flex;align-items:center;justify-content:center;
color:var(--text-muted);flex-shrink:0;
}
.mebook-root .mechat-reply-banner-close:hover{background:var(--hover);}
.mebook-root .mechat-reply-banner-close svg{width:18px;height:18px;fill:currentColor;}

/* Voice recording bar */
.mebook-root .mechat-recording-bar{
display:flex;align-items:center;gap:12px;
padding:10px 14px;
border-top:1px solid var(--border);
background:var(--card);
flex-shrink:0;
backdrop-filter:blur(12px);
}
.mebook-root .mechat-recording-dot{
width:10px;height:10px;border-radius:50%;
background:#ef4444;flex-shrink:0;
animation:recPulse 1s ease-in-out infinite;
}
@keyframes recPulse{
0%,100%{opacity:1;transform:scale(1);}
50%{opacity:.4;transform:scale(1.3);}
}
.mebook-root .mechat-recording-time{
font-size:15px;font-weight:700;color:#ef4444;
font-variant-numeric:tabular-nums;
min-width:48px;
}
.mebook-root .mechat-recording-hint{
font-size:13px;color:var(--text-muted);flex:1;
}
.mebook-root .mechat-recording-cancel,
.mebook-root .mechat-recording-send{
width:40px;height:40px;border-radius:50%;
display:flex;align-items:center;justify-content:center;
flex-shrink:0;transition:transform .12s;
}
.mebook-root .mechat-recording-cancel{
background:rgba(239,68,68,.12);color:#ef4444;
}
.mebook-root .mechat-recording-cancel svg{width:18px;height:18px;fill:#ef4444;}
.mebook-root .mechat-recording-send{
background:#0084ff;color:#fff;
}
.mebook-root .mechat-recording-send svg{width:18px;height:18px;fill:#fff;}
.mebook-root .mechat-recording-cancel:active,
.mebook-root .mechat-recording-send:active{transform:scale(.9);}

/* Input bar — LIQUID GLASS */
.mebook-root .mechat-input-bar{
display:flex;gap:8px;align-items:flex-end;
padding:10px 12px 12px;
border-top:1px solid rgba(255,255,255,.08);
flex-shrink:0;
background:rgba(255,255,255,.7);
backdrop-filter:blur(24px) saturate(180%);
-webkit-backdrop-filter:blur(24px) saturate(180%);
transition:padding-bottom .2s;
box-shadow:0 -4px 24px rgba(0,0,0,.04);
}
.mebook-root.dark-mode .mechat-input-bar{
background:rgba(10,10,10,.75);
border-top:1px solid rgba(255,255,255,.06);
box-shadow:0 -4px 24px rgba(0,0,0,.5);
}
.mebook-root .mechat-input-bar.kb-up{
padding-bottom:max(12px, env(safe-area-inset-bottom));
}
.mebook-root .mechat-input-actions{
display:flex;gap:4px;align-items:center;
flex-shrink:0;
}
.mebook-root .mechat-input-icon{
width:38px;height:38px;border-radius:50%;
display:flex;align-items:center;justify-content:center;
color:#0084ff;transition:transform .12s,background .15s;
flex-shrink:0;
}
.mebook-root .mechat-input-icon:hover{background:rgba(0,132,255,.08);}
.mebook-root .mechat-input-icon:active{transform:scale(.9);}
.mebook-root .mechat-input-icon svg{width:22px;height:22px;fill:#0084ff;}
.mebook-root.dark-mode .mechat-input-icon svg{fill:#4ade80;}
.mebook-root.dark-mode .mechat-input-icon{color:#4ade80;}

.mebook-root .mechat-input-field{
flex:1;border:none;border-radius:20px;
padding:10px 16px;font-size:15px;
outline:none;color:var(--text);
resize:none;max-height:120px;
font-family:inherit;line-height:1.4;
background:rgba(240,242,245,.9);
backdrop-filter:blur(12px);
-webkit-backdrop-filter:blur(12px);
min-height:40px;
border:1px solid rgba(255,255,255,.4);
transition:border-color .2s, box-shadow .2s;
}
.mebook-root.dark-mode .mechat-input-field{
background:rgba(20,20,20,.9);
border:1px solid rgba(255,255,255,.06);
}
.mebook-root .mechat-input-field:focus{
border-color:rgba(34,197,94,.4);
box-shadow:0 0 0 3px rgba(34,197,94,.1);
}
.mebook-root .mechat-input-field::placeholder{color:var(--text-muted);}

/* Send button — LIQUID GLASS */
.mebook-root .mechat-send-btn{
width:40px;height:40px;border-radius:50%;
background:linear-gradient(135deg,#16a34a,#22c55e);
color:#fff;
display:flex;align-items:center;justify-content:center;
flex-shrink:0;
transition:transform .12s, box-shadow .2s;
box-shadow:0 4px 16px rgba(22,163,74,.35), inset 0 1px 0 rgba(255,255,255,.3);
border:1px solid rgba(255,255,255,.15);
}
.mebook-root .mechat-send-btn:active{transform:scale(.9);}
.mebook-root .mechat-send-btn svg{width:20px;height:20px;fill:#fff;}

.mebook-root .mechat-like-btn{
width:40px;height:40px;border-radius:50%;
display:flex;align-items:center;justify-content:center;
flex-shrink:0;transition:transform .12s;
position:relative;
}
.mebook-root .mechat-like-btn:active{transform:scale(.9);}
.mebook-root .mechat-like-btn svg{
width:26px;height:26px;fill:#0084ff;
transition:fill .2s;
}
.mebook-root.dark-mode .mechat-like-btn svg{fill:#4ade80;}
.mebook-root .mechat-like-btn.my-liked svg{
fill:#f33e58;
animation:likePop .4s ease;
}

/* Chat reaction picker */
.mebook-root .chat-reaction-picker{
position:fixed;z-index:3100;
background:var(--card);
border-radius:30px;
padding:6px 8px;
display:flex;gap:2px;
box-shadow:0 6px 24px rgba(0,0,0,.25), 0 0 0 1px rgba(0,0,0,.05);
transform:scale(.7) translateY(8px);
opacity:0;pointer-events:none;
transform-origin:bottom center;
transition:transform .22s cubic-bezier(.2,1.4,.4,1), opacity .18s ease;
}
.mebook-root.dark-mode .chat-reaction-picker{
box-shadow:0 6px 28px rgba(0,0,0,.9), 0 0 0 1px rgba(255,255,255,.06);
}
.mebook-root .chat-reaction-picker.open{
opacity:1;pointer-events:auto;
transform:scale(1) translateY(0);
}
.mebook-root .chat-reaction-picker button{
width:40px;height:40px;border-radius:50%;
display:flex;align-items:center;justify-content:center;
font-size:24px;line-height:1;
transition:transform .18s ease, background .15s;
}
.mebook-root .chat-reaction-picker button:hover{
transform:scale(1.35) translateY(-6px);
background:var(--hover);
}

/* Flying animation */
@keyframes reactionFly{
0%{transform:scale(1) translateY(0);opacity:1;}
50%{transform:scale(1.8) translateY(-30px);opacity:1;}
100%{transform:scale(.3) translateY(-70px);opacity:0;}
}
.mebook-root .cmt-flying-reaction{
position:fixed;z-index:3500;font-size:26px;
pointer-events:none;
animation:reactionFly .7s cubic-bezier(.2,.8,.3,1) forwards;
}

@media(max-width:820px){
.mebook-root .msgr-wrap{height:calc(100vh - 60px);border-radius:0;flex-direction:column;}
.mebook-root .msgr-list{width:100%;border-right:none;border-bottom:1px solid var(--border);}
.mebook-root .msgr-list.hidden{display:none;}
.mebook-root .msgr-window.hidden{display:none;}
.mebook-root .msgr-list.full{flex:1;}
.mebook-root .msgr-window.full{flex:1;}
.mebook-root .mechat-page{height:calc(100vh - 60px);}
}

/* ============ COMMENTS PAGE ============ */
.mebook-root .cmt-page-wrap{
border-radius:12px;box-shadow:var(--shadow);overflow:hidden;margin-bottom:16px;
display:flex;flex-direction:column;
height:calc(100vh - 200px);
min-height:480px;
}
.mebook-root .cmt-page-head{
padding:14px 16px;border-bottom:1px solid var(--border);
font-size:16px;font-weight:700;flex-shrink:0;
display:flex;align-items:center;justify-content:space-between;
}
.mebook-root .cmt-page-list{
flex:1;overflow-y:auto;padding:14px 16px;
scroll-behavior:smooth;
}
.mebook-root .cmt-page-list::-webkit-scrollbar{width:6px;}
.mebook-root .cmt-page-list::-webkit-scrollbar-thumb{background:var(--border);border-radius:10px;}

.mebook-root .cmt-row{display:flex;gap:8px;margin-bottom:12px;animation:cmtIn .3s ease;}
@keyframes cmtIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;}}
.mebook-root .cmt-row-avatar{width:36px;height:36px;border-radius:50%;object-fit:cover;flex-shrink:0;background:#cbd5e1;cursor:pointer;}
.mebook-root .cmt-row-body{flex:1;min-width:0;}
.mebook-root .cmt-bubble{
border-radius:16px 16px 16px 4px;
padding:8px 12px;font-size:14px;line-height:1.42;
color:var(--text);max-width:88%;word-wrap:break-word;white-space:pre-wrap;
background:var(--input-bg);position:relative;
display:inline-block;
}
.mebook-root .cmt-bubble b{display:block;font-size:13px;font-weight:700;margin-bottom:2px;color:var(--text);}
.mebook-root .cmt-bubble .cmt-time{display:block;font-size:11px;color:var(--text-muted);margin-top:3px;font-weight:500;}
.mebook-root .cmt-bubble .cmt-reaction-badge{
position:absolute;bottom:-8px;right:-6px;
background:var(--card);border-radius:14px;
padding:1px 5px;display:flex;align-items:center;gap:2px;
box-shadow:0 1px 4px rgba(0,0,0,.15);
font-size:13px;border:1px solid var(--border);
}
.mebook-root .cmt-bubble .cmt-reaction-badge small{font-size:11px;color:var(--text-muted);font-weight:600;margin-left:2px;}

/* Comment image */
.mebook-root .cmt-bubble-image{
margin-top:6px;border-radius:12px;overflow:hidden;
max-width:240px;background:#000;
border:1px solid var(--border);
animation:imagePop .35s cubic-bezier(.2,.8,.3,1);
}
.mebook-root .cmt-bubble-image img{
width:100%;max-height:280px;object-fit:cover;display:block;
}
@keyframes imagePop{from{opacity:0;transform:scale(.85);}to{opacity:1;transform:scale(1);}}

/* Comment image preview (before send) */
.mebook-root .cmt-image-preview{
position:relative;padding:10px 14px 0;
display:flex;align-items:flex-start;gap:10px;
animation:slideDown .25s ease;
}
.mebook-root .cmt-image-preview-img-wrap{
position:relative;border-radius:12px;overflow:hidden;
max-width:140px;background:#000;flex-shrink:0;
box-shadow:0 4px 16px rgba(0,0,0,.15);
}
.mebook-root .cmt-image-preview-img-wrap img{
width:100%;max-height:140px;object-fit:cover;display:block;
}
.mebook-root .cmt-image-preview-remove{
position:absolute;top:4px;right:4px;
width:24px;height:24px;border-radius:50%;
background:rgba(0,0,0,.7);backdrop-filter:blur(4px);
display:flex;align-items:center;justify-content:center;
}
.mebook-root .cmt-image-preview-remove svg{width:12px;height:12px;fill:#fff;}
.mebook-root .cmt-image-preview-info{
flex:1;font-size:12.5px;color:var(--text-muted);
padding-top:8px;
}
.mebook-root .cmt-image-preview-info b{
display:block;color:var(--text);font-weight:600;margin-bottom:2px;
font-size:13px;
}

.mebook-root .cmt-actions-row{
display:flex;align-items:center;gap:14px;
margin-top:4px;padding:0 6px;
font-size:12.5px;font-weight:600;color:var(--text-muted);
}
.mebook-root .cmt-action-btn{
padding:2px 4px;border-radius:4px;transition:color .15s;
position:relative;
}
.mebook-root .cmt-action-btn:hover{color:var(--green);}
.mebook-root .cmt-action-btn.my-reaction{color:var(--green);}

.mebook-root .cmt-replies{
margin-left:44px;margin-top:6px;
padding-left:10px;
border-left:2px solid var(--border);
display:flex;flex-direction:column;gap:8px;
}
.mebook-root .cmt-reply-row{
display:flex;gap:8px;animation:cmtIn .3s ease;
}
.mebook-root .cmt-reply-row .cmt-row-avatar{
width:28px;height:28px;
}
.mebook-root .cmt-reply-row .cmt-bubble{
font-size:13.5px;padding:6px 10px;
}
.mebook-root .cmt-view-more-replies{
font-size:12.5px;font-weight:700;color:#3b82f6;
padding:3px 6px;cursor:pointer;display:inline-block;
border-radius:6px;transition:background .15s;
}
.mebook-root .cmt-view-more-replies:hover{background:rgba(59,130,246,.08);text-decoration:underline;}

.mebook-root .cmt-reply-indicator{
display:flex;align-items:center;gap:6px;
padding:8px 12px;background:var(--input-bg);
border-top:1px solid var(--border);
font-size:12.5px;color:var(--text-muted);
flex-shrink:0;
}
.mebook-root .cmt-reply-indicator b{color:var(--text);font-weight:700;}
.mebook-root .cmt-reply-indicator button{
margin-left:auto;color:#ef4444;font-weight:700;
padding:2px 8px;border-radius:6px;
}
.mebook-root .cmt-reply-indicator button:hover{background:rgba(239,68,68,.1);}

.mebook-root .cmt-empty{text-align:center;padding:60px 20px;color:var(--text-muted);font-size:14px;}
.mebook-root .cmt-empty svg{width:60px;height:60px;fill:var(--border);margin:0 auto 12px;}
.mebook-root .cmt-empty b{font-size:16px;display:block;margin-bottom:6px;color:var(--text);}

/* Comment input — LIQUID GLASS */
.mebook-root .cmt-input-wrap{
display:flex;gap:8px;align-items:flex-end;
padding:10px 14px 14px;border-top:1px solid rgba(255,255,255,.08);
flex-shrink:0;
background:rgba(255,255,255,.7);
backdrop-filter:blur(24px) saturate(180%);
-webkit-backdrop-filter:blur(24px) saturate(180%);
box-shadow:0 -4px 24px rgba(0,0,0,.04);
}
.mebook-root.dark-mode .cmt-input-wrap{
background:rgba(10,10,10,.75);
border-top:1px solid rgba(255,255,255,.06);
box-shadow:0 -4px 24px rgba(0,0,0,.5);
}
.mebook-root .cmt-input-avatar{width:36px;height:36px;border-radius:50%;object-fit:cover;flex-shrink:0;background:#cbd5e1;}
.mebook-root .cmt-input{flex:1;border:none;border-radius:20px;padding:10px 14px;font-size:14.5px;outline:none;color:var(--text);resize:none;max-height:120px;font-family:inherit;line-height:1.4;background:rgba(240,242,245,.9);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.4);}
.mebook-root.dark-mode .cmt-input{background:rgba(20,20,20,.9);border:1px solid rgba(255,255,255,.06);}
.mebook-root .cmt-input:focus{border-color:rgba(34,197,94,.4);box-shadow:0 0 0 3px rgba(34,197,94,.1);}

.mebook-root .cmt-img-btn{
width:36px;height:36px;border-radius:50%;
display:flex;align-items:center;justify-content:center;
flex-shrink:0;color:var(--green);transition:transform .12s, background .15s;
}
.mebook-root .cmt-img-btn:hover{background:rgba(34,197,94,.1);}
.mebook-root .cmt-img-btn:active{transform:scale(.9);}
.mebook-root .cmt-img-btn svg{width:20px;height:20px;fill:var(--green);}

.mebook-root .cmt-send{
width:38px;height:38px;border-radius:50%;
background:linear-gradient(135deg,#16a34a,#22c55e);
color:#fff;
display:flex;align-items:center;justify-content:center;
flex-shrink:0;
transition:transform .12s, box-shadow .2s;
box-shadow:0 4px 16px rgba(22,163,74,.35), inset 0 1px 0 rgba(255,255,255,.3);
border:1px solid rgba(255,255,255,.15);
}
.mebook-root .cmt-send:active{transform:scale(.9);}
.mebook-root .cmt-send:disabled{opacity:.5;cursor:not-allowed;}
.mebook-root .cmt-send svg{width:18px;height:18px;fill:#fff;}

.mebook-root .cmt-reaction-picker{
position:fixed;z-index:3000;
background:var(--card);
border-radius:30px;
padding:6px 8px;
display:flex;gap:2px;
box-shadow:0 6px 24px rgba(0,0,0,.25), 0 0 0 1px rgba(0,0,0,.05);
transform:scale(.7) translateY(8px);
opacity:0;pointer-events:none;
transform-origin:bottom left;
transition:transform .22s cubic-bezier(.2,1.4,.4,1), opacity .18s ease;
}
.mebook-root.dark-mode .cmt-reaction-picker{
box-shadow:0 6px 28px rgba(0,0,0,.9), 0 0 0 1px rgba(255,255,255,.06);
}
.mebook-root .cmt-reaction-picker.open{
opacity:1;pointer-events:auto;
transform:scale(1) translateY(0);
}
.mebook-root .cmt-reaction-picker button{
width:40px;height:40px;border-radius:50%;
display:flex;align-items:center;justify-content:center;
font-size:24px;line-height:1;
transition:transform .18s ease, background .15s;
}
.mebook-root .cmt-reaction-picker button:hover{
transform:scale(1.35) translateY(-4px);
background:var(--hover);
}

/* ============ SHARE PAGE ============ */
.mebook-root .share-page-wrap{border-radius:12px;box-shadow:var(--shadow);padding:16px;margin-bottom:16px;}
.mebook-root .share-preview{display:flex;gap:10px;align-items:center;padding:10px;border-radius:12px;background:var(--input-bg);margin-bottom:14px;}
.mebook-root .share-preview img{width:52px;height:52px;border-radius:8px;object-fit:cover;background:#cbd5e1;flex-shrink:0;}
.mebook-root .share-preview-info{flex:1;min-width:0;}
.mebook-root .share-preview-title{font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.mebook-root .share-preview-sub{font-size:12px;color:var(--text-muted);margin-top:2px;}
.mebook-root .share-caption{width:100%;min-height:64px;padding:12px 14px;border-radius:12px;background:var(--input-bg);color:var(--text);border:1px solid transparent;outline:none;font-size:14px;resize:vertical;margin-bottom:14px;font-family:inherit;}
.mebook-root .share-caption:focus{border-color:var(--green);box-shadow:0 0 0 3px rgba(22,163,74,.12);}
.mebook-root .share-options{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.mebook-root .share-option{display:flex;align-items:center;gap:10px;padding:12px;border-radius:12px;background:var(--input-bg);transition:background .18s,transform .12s;text-align:left;}
.mebook-root .share-option:active{transform:scale(.98);}
.mebook-root .share-option-icon{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.mebook-root .share-option-icon svg{width:20px;height:20px;}
.mebook-root .share-option-icon.fb{background:#1877f2;color:#fff;}
.mebook-root .share-option-icon.wa{background:#25d366;color:#fff;}
.mebook-root .share-option-icon.tg{background:#229ed9;color:#fff;}
.mebook-root .share-option-icon.link{background:var(--border);color:var(--text);}
.mebook-root .share-option-icon.profile{background:linear-gradient(135deg,#16a34a,#22c55e);color:#fff;}
.mebook-root .share-option-text{font-size:13.5px;font-weight:600;line-height:1.3;}
.mebook-root .share-option-text small{display:block;font-size:11.5px;color:var(--text-muted);font-weight:500;margin-top:2px;}

/* ============ NOTIFICATIONS PAGE ============ */
.mebook-root .notif-page-wrap{border-radius:12px;box-shadow:var(--shadow);overflow:hidden;margin-bottom:16px;}
.mebook-root .notif-page-head{padding:12px 16px;border-bottom:1px solid var(--border);font-size:17px;font-weight:800;display:flex;align-items:center;justify-content:space-between;}
.mebook-root .notif-mark-all{padding:6px 12px;border-radius:8px;font-size:12.5px;font-weight:600;background:var(--input-bg);color:var(--text-muted);transition:background .18s;}
.mebook-root .notif-list{padding:0;}
.mebook-root .notif-item{display:flex;gap:12px;padding:14px 16px;border-bottom:1px solid var(--border);transition:background .18s;cursor:pointer;position:relative;}
.mebook-root .notif-item:last-child{border-bottom:none;}
.mebook-root .notif-item.unread{background:rgba(22,163,74,.05);}
.mebook-root .notif-icon{width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative;}
.mebook-root .notif-icon svg{width:22px;height:22px;fill:#fff;}
.mebook-root .notif-icon.like{background:linear-gradient(135deg,#ef4444,#f97316);}
.mebook-root .notif-icon.comment{background:linear-gradient(135deg,#3b82f6,#6366f1);}
.mebook-root .notif-icon.share{background:linear-gradient(135deg,#10b981,#059669);}
.mebook-root .notif-icon.friend{background:linear-gradient(135deg,#8b5cf6,#a855f7);}
.mebook-root .notif-icon.verification{background:linear-gradient(135deg,#16a34a,#22c55e);}
.mebook-root .notif-icon.subscription{background:linear-gradient(135deg,#f59e0b,#eab308);}
.mebook-root .notif-icon.account{background:linear-gradient(135deg,#dc2626,#ef4444);}
.mebook-root .notif-icon.admin{background:linear-gradient(135deg,#0f172a,#334155);}
.mebook-root .notif-icon.post{background:linear-gradient(135deg,#0891b2,#06b6d4);}
.mebook-root .notif-avatar{width:48px;height:48px;border-radius:50%;object-fit:cover;flex-shrink:0;background:#cbd5e1;border:2px solid var(--border);}
.mebook-root .notif-body{flex:1;min-width:0;padding-right:8px;}
.mebook-root .notif-text{font-size:14.5px;line-height:1.45;color:var(--text);word-wrap:break-word;}
.mebook-root .notif-text b{font-weight:700;}
.mebook-root .notif-time{font-size:12px;color:var(--text-muted);margin-top:3px;font-weight:500;}
.mebook-root .notif-dot{width:10px;height:10px;border-radius:50%;background:#22c55e;position:absolute;bottom:16px;right:20px;flex-shrink:0;}
.mebook-root .notif-more{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--text-muted);align-self:flex-start;margin:-4px -6px 0 0;}
.mebook-root .notif-more:hover{background:var(--hover);}
.mebook-root .notif-more svg{width:22px;height:22px;fill:currentColor;}
.mebook-root .notif-sheet-head{display:flex;flex-direction:column;align-items:center;gap:8px;padding:8px 16px 12px;text-align:center;}
.mebook-root .notif-sheet-head img,.mebook-root .notif-sheet-head .notif-icon{width:56px;height:56px;}
.mebook-root .notif-sheet-head span{font-size:14px;color:var(--text-muted);line-height:1.4;}
.mebook-root .mb-sheet-item small{display:block;font-size:12.5px;font-weight:500;color:var(--text-muted);margin-top:2px;}
.mebook-root .mb-sheet-item .mb-sheet-txt{display:flex;flex-direction:column;}
.mebook-root .notif-empty{padding:60px 20px;text-align:center;color:var(--text-muted);}
.mebook-root .notif-empty svg{width:72px;height:72px;fill:var(--border);margin-bottom:12px;}
.mebook-root .notif-empty b{font-size:17px;display:block;margin-bottom:4px;color:var(--text);}
.mebook-root .notif-actions{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;}
.mebook-root .notif-action-btn{padding:7px 14px;border-radius:8px;font-size:13px;font-weight:600;transition:filter .18s,transform .12s;}
.mebook-root .notif-action-btn:active{transform:scale(.97);}
.mebook-root .notif-action-btn.accept{background:var(--green);color:#fff;}
.mebook-root .notif-action-btn.accept:hover{filter:brightness(1.08);}
.mebook-root .notif-action-btn.decline{background:var(--input-bg);color:var(--text);}

/* ============ FRIENDS PAGE ============ */
.mebook-root .fr-page{border-radius:12px;box-shadow:var(--shadow);overflow:hidden;margin-bottom:16px;}
.mebook-root .fr-tabs{display:flex;border-bottom:1px solid var(--border);padding:0 8px;overflow-x:auto;scrollbar-width:none;}
.mebook-root .fr-tabs::-webkit-scrollbar{height:0;}
.mebook-root .fr-tab{padding:14px 16px;font-size:14.5px;font-weight:600;color:var(--text-muted);border-bottom:3px solid transparent;transition:all .2s;position:relative;white-space:nowrap;}
.mebook-root .fr-tab.active{color:var(--green);border-bottom-color:var(--green);}
.mebook-root .fr-tab-badge{display:inline-flex;align-items:center;justify-content:center;background:#ef4444;color:#fff;font-size:11px;font-weight:700;border-radius:10px;padding:1px 7px;margin-left:6px;min-width:18px;}
.mebook-root .fr-body{padding:16px;}
.mebook-root .fr-request-row{display:flex;gap:12px;padding:12px;border-radius:12px;transition:background .18s;align-items:center;}
.mebook-root .fr-request-row img{width:72px;height:72px;border-radius:50%;object-fit:cover;background:#cbd5e1;flex-shrink:0;cursor:pointer;}
.mebook-root .fr-request-info{flex:1;min-width:0;}
.mebook-root .fr-request-name{font-size:15.5px;font-weight:700;color:var(--text);cursor:pointer;display:flex;align-items:center;gap:5px;}
.mebook-root .fr-request-mutual{font-size:12.5px;color:var(--text-muted);margin-top:3px;}
.mebook-root .fr-request-actions{display:flex;flex-direction:column;gap:6px;flex-shrink:0;}
.mebook-root .fr-request-actions .mb-btn{width:auto;padding:8px 18px;font-size:13.5px;white-space:nowrap;}
.mebook-root .fr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px;}
.mebook-root .fr-card{border-radius:12px;overflow:hidden;transition:transform .2s,box-shadow .2s;cursor:pointer;background:var(--input-bg);}
.mebook-root .fr-card:hover{transform:translateY(-3px);box-shadow:var(--shadow-lg);}
.mebook-root .fr-card-img{width:100%;aspect-ratio:1;object-fit:cover;background:#cbd5e1;}
.mebook-root .fr-card-info{padding:10px 12px 12px;}
.mebook-root .fr-card-name{font-size:14.5px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.mebook-root .fr-card-mutual{font-size:12px;color:var(--text-muted);margin-top:2px;}
.mebook-root .fr-card-actions{display:flex;gap:6px;margin-top:8px;}
.mebook-root .fr-card-actions .mb-btn{font-size:12.5px;padding:7px;}

/* ============ FRIENDS LIST ============ */
.mebook-root .fl-page{padding:4px 0 24px;}
.mebook-root .fl-head{display:flex;align-items:center;gap:12px;padding:10px 4px 14px;position:relative;}
.mebook-root .fl-head-back{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:transparent;color:var(--text);flex-shrink:0;transition:background .15s;}
.mebook-root .fl-head-back:hover{background:var(--hover);}
.mebook-root .fl-head-back svg{width:24px;height:24px;fill:currentColor;}
.mebook-root .fl-head-title{font-size:19px;font-weight:800;color:var(--text);flex:1;letter-spacing:-.4px;}
.mebook-root .fl-head-icon{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--text);flex-shrink:0;}
.mebook-root .fl-head-icon svg{width:22px;height:22px;fill:currentColor;}
.mebook-root .fl-search{display:flex;align-items:center;gap:10px;background:var(--input-bg);border-radius:22px;padding:11px 16px;margin-bottom:16px;}
.mebook-root .fl-search svg{width:20px;height:20px;fill:var(--text-muted);flex-shrink:0;}
.mebook-root .fl-search input{border:none;outline:none;background:transparent;flex:1;font-size:15px;color:var(--text);}
.mebook-root .fl-search input::placeholder{color:var(--text-muted);}
.mebook-root .fl-stats-row{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px;padding:0 4px;}
.mebook-root .fl-stats-title{font-size:17px;font-weight:800;color:var(--text);letter-spacing:-.3px;}
.mebook-root .fl-stats-sub{font-size:14px;color:var(--text-muted);margin-top:2px;font-weight:500;}
.mebook-root .fl-sort{font-size:14.5px;font-weight:700;color:#3b82f6;padding:6px 4px;flex-shrink:0;}
.mebook-root.dark-mode .fl-sort{color:#60a5fa;}
.mebook-root .fl-list{display:flex;flex-direction:column;}
.mebook-root .fl-item{display:flex;align-items:center;gap:14px;padding:10px 4px;cursor:pointer;transition:background .15s;border-radius:10px;}
.mebook-root .fl-avatar-wrap{position:relative;width:62px;height:62px;flex-shrink:0;}
.mebook-root .fl-avatar-wrap img{width:62px;height:62px;border-radius:50%;object-fit:cover;background:#cbd5e1;}
.mebook-root .fl-avatar-ring{position:absolute;inset:-3px;border-radius:50%;border:2.5px solid #3b82f6;pointer-events:none;}
.mebook-root .fl-online-dot{position:absolute;right:2px;bottom:2px;width:14px;height:14px;border-radius:50%;background:#22c55e;border:2.5px solid var(--card);}
.mebook-root .fl-info{flex:1;min-width:0;}
.mebook-root .fl-name{font-size:16.5px;font-weight:700;color:var(--text);line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.mebook-root .fl-mutual{font-size:13.5px;color:var(--text-muted);margin-top:3px;font-weight:500;}
.mebook-root .fl-more{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--text-muted);flex-shrink:0;transition:background .15s;}
.mebook-root .fl-more:hover{background:var(--hover);}
.mebook-root .fl-more svg{width:22px;height:22px;fill:currentColor;}
.mebook-root .fl-empty{text-align:center;padding:60px 20px;color:var(--text-muted);font-size:14px;}

/* ============ FRIEND ACTION SHEET ============ */
.mebook-root .fl-sheet-backdrop{position:fixed;inset:0;z-index:2000;background:rgba(0,0,0,.5);opacity:0;visibility:hidden;transition:opacity .25s ease, visibility .25s ease;display:flex;align-items:flex-end;justify-content:center;}
.mebook-root .fl-sheet-backdrop.open{opacity:1;visibility:visible;}
.mebook-root .fl-action-sheet{width:100%;max-width:520px;background:var(--card);border-radius:20px 20px 0 0;transform:translateY(100%);transition:transform .3s cubic-bezier(.2,.8,.3,1);max-height:85vh;overflow-y:auto;padding-bottom:env(safe-area-inset-bottom);}
.mebook-root .fl-sheet-backdrop.open .fl-action-sheet{transform:translateY(0);}
.mebook-root .fl-sheet-handle{width:40px;height:4px;border-radius:2px;background:var(--border);margin:8px auto 4px;}
.mebook-root .fl-sheet-header{display:flex;align-items:center;gap:12px;padding:14px 18px;border-bottom:1px solid var(--border);}
.mebook-root .fl-sheet-header img{width:48px;height:48px;border-radius:50%;object-fit:cover;background:#cbd5e1;flex-shrink:0;}
.mebook-root .fl-sheet-header-info{flex:1;min-width:0;}
.mebook-root .fl-sheet-header-name{font-size:16px;font-weight:800;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.mebook-root .fl-sheet-header-sub{font-size:13px;color:var(--text-muted);margin-top:2px;}
.mebook-root .fl-sheet-options{display:flex;flex-direction:column;padding:4px 0;}
.mebook-root .fl-sheet-option{display:flex;align-items:flex-start;gap:14px;padding:14px 18px;text-align:left;transition:background .15s;cursor:pointer;}
.mebook-root .fl-sheet-option:hover{background:var(--hover);}
.mebook-root .fl-sheet-ico{width:32px;height:32px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;}
.mebook-root .fl-sheet-ico svg{width:22px;height:22px;fill:var(--text);}
.mebook-root .fl-sheet-option.danger{color:#dc2626;}
.mebook-root .fl-sheet-option.danger .fl-sheet-ico svg{fill:#dc2626;}
.mebook-root .fl-sheet-text{flex:1;min-width:0;}
.mebook-root .fl-sheet-title{font-size:15px;font-weight:700;color:inherit;line-height:1.3;}
.mebook-root .fl-sheet-desc{font-size:12.5px;color:var(--text-muted);margin-top:3px;line-height:1.4;}

/* ============ PROFILE ============ */
.mebook-root .mb-profile-head{border-radius:12px;box-shadow:var(--shadow);margin-bottom:16px;overflow:hidden;position:relative;}
.mebook-root .mb-profile-cover{position:relative;width:100%;height:340px;background:#0f172a;cursor:pointer;overflow:hidden;}
.mebook-root .mb-profile-cover img{width:100%;height:100%;object-fit:cover;object-position:center;display:block;}
.mebook-root .mb-profile-cover::after{content:'';position:absolute;left:0;right:0;bottom:0;height:55%;pointer-events:none;background:linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,0.10) 25%,rgba(0,0,0,0.35) 55%,rgba(0,0,0,0.65) 80%,rgba(0,0,0,0.88) 100%);}
.mebook-root .mb-profile-cover-add{position:absolute;inset:0;z-index:2;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.35);color:#fff;font-weight:600;gap:8px;opacity:0;transition:opacity .25s;}
.mebook-root .mb-profile-cover:hover .mb-profile-cover-add{opacity:1;}
.mebook-root .mb-profile-cover-add svg{width:22px;height:22px;fill:#fff;}
.mebook-root .mb-profile-avatar-center{position:relative;display:flex;justify-content:center;margin-top:-90px;z-index:3;padding:0 20px;}
.mebook-root .mb-profile-avatar-wrap{position:relative;cursor:pointer;flex-shrink:0;}
.mebook-root .mb-profile-avatar-wrap img{width:180px;height:180px;border-radius:50%;object-fit:cover;border:5px solid var(--card);background:#cbd5e1;box-shadow:0 6px 24px rgba(0,0,0,.45);}
.mebook-root.dark-mode .mb-profile-avatar-wrap img{border-color:#0a0a0a;box-shadow:0 6px 28px rgba(0,0,0,.9);}
.mebook-root .mb-profile-avatar-add{position:absolute;inset:0;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.45);opacity:0;transition:opacity .25s;}
.mebook-root .mb-profile-avatar-wrap:hover .mb-profile-avatar-add{opacity:1;}
.mebook-root .mb-profile-avatar-add svg{width:32px;height:32px;fill:#fff;}
.mebook-root .mb-profile-name-center{text-align:center;padding:16px 20px 4px;}
.mebook-root .mb-profile-name{font-size:24px;font-weight:800;line-height:1.2;color:var(--text);display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center;}
.mebook-root .mb-profile-sub{text-align:center;font-size:15px;color:var(--text-muted);margin-top:6px;font-weight:500;letter-spacing:.2px;}
.mebook-root .mb-profile-sub b{color:var(--text);font-weight:700;}
.mebook-root .mb-profile-meta-row{display:flex;justify-content:center;align-items:center;gap:18px;flex-wrap:wrap;padding:10px 20px 4px;font-size:14px;color:var(--text-muted);}
.mebook-root .mb-profile-meta-row span{display:inline-flex;align-items:center;gap:5px;}
.mebook-root .mb-profile-meta-row svg{width:16px;height:16px;fill:currentColor;flex-shrink:0;}
.mebook-root .mb-profile-friends-strip{display:flex;justify-content:center;align-items:center;gap:12px;padding:14px 20px 6px;flex-wrap:wrap;}
.mebook-root .mb-profile-friends-avatars{display:flex;flex-shrink:0;}
.mebook-root .mb-profile-friends-avatars img{width:34px;height:34px;border-radius:50%;object-fit:cover;background:#cbd5e1;border:2px solid var(--card);margin-left:-10px;}
.mebook-root.dark-mode .mb-profile-friends-avatars img{border-color:#0a0a0a;}
.mebook-root .mb-profile-friends-avatars img:first-child{margin-left:0;}
.mebook-root .mb-profile-friends-text{font-size:14px;color:var(--text-muted);text-align:left;max-width:340px;line-height:1.4;}
.mebook-root .mb-profile-friends-text b{color:var(--text);font-weight:700;}
.mebook-root .mb-profile-actions{display:flex;justify-content:center;gap:10px;padding:16px 20px 18px;flex-wrap:wrap;}
.mebook-root .mb-profile-actions .mb-btn{width:auto;padding:11px 22px;font-size:14.5px;font-weight:700;border-radius:10px;display:inline-flex;align-items:center;gap:8px;}
.mebook-root .mb-profile-actions .mb-btn svg{width:18px;height:18px;fill:currentColor;}
.mebook-root .mb-profile-btn-message{background:#0084ff;color:#fff;}
.mebook-root .mb-profile-btn-message:hover{filter:brightness(1.1);}
.mebook-root .mb-profile-btn-icon{width:44px!important;padding:0!important;justify-content:center;background:var(--input-bg);}
.mebook-root .mb-profile-things-common{margin:0 20px 16px;padding:14px 18px;border-radius:12px;background:var(--card);border:1px solid var(--border);}
.mebook-root.dark-mode .mb-profile-things-common{background:#0a0a0a;border-color:#1a1a1a;}
.mebook-root .mb-profile-things-common-title{font-size:15.5px;font-weight:700;color:var(--text);display:flex;align-items:center;gap:10px;margin-bottom:4px;}
.mebook-root .mb-profile-things-common-title svg{width:22px;height:22px;fill:var(--text);flex-shrink:0;}
.mebook-root .mb-profile-things-common-body{font-size:14px;color:var(--text-muted);margin-left:32px;}
.mebook-root .mb-profile-tabs{display:flex;gap:6px;padding:8px 20px 0;border-top:1px solid var(--border);}
.mebook-root .mb-profile-tab{padding:12px 18px;font-size:14.5px;font-weight:600;color:var(--text-muted);border-radius:8px;transition:background .18s,color .18s;}
.mebook-root .mb-profile-tab:hover{background:var(--hover);}
.mebook-root .mb-profile-tab.active{color:var(--green);background:rgba(34,197,94,.10);}
.mebook-root .mb-profile-friends-section{padding:16px 20px 20px;border-top:1px solid var(--border);}
.mebook-root .mb-profile-friends-section-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}
.mebook-root .mb-profile-friends-section-head h3{font-size:18px;font-weight:800;color:var(--text);display:flex;align-items:center;gap:8px;}
.mebook-root .mb-profile-friends-section-head .count-link{font-size:14px;font-weight:700;color:var(--green);cursor:pointer;}
.mebook-root .mb-profile-friends-section-head .count-link:hover{text-decoration:underline;}
.mebook-root .mb-profile-friends-preview{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;}
.mebook-root .mb-profile-friend-preview-card{cursor:pointer;text-align:center;transition:transform .2s;}
.mebook-root .mb-profile-friend-preview-card:hover{transform:translateY(-2px);}
.mebook-root .mb-profile-friend-preview-card img,.mebook-root .mb-profile-friend-preview-card .view-all-avatar{width:100%;aspect-ratio:1;border-radius:12px;object-fit:cover;background:#cbd5e1;}
.mebook-root .mb-profile-friend-preview-card .view-all-avatar{display:flex;align-items:center;justify-content:center;background:var(--input-bg);color:var(--text-muted);font-size:13px;font-weight:700;border:1px solid var(--border);}
.mebook-root .mb-profile-friend-preview-card .view-all-avatar svg{width:26px;height:26px;fill:var(--text-muted);}
.mebook-root .mb-profile-friend-preview-name{font-size:12px;font-weight:600;color:var(--text);margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.mebook-root .mb-profile-friends-empty{text-align:center;padding:30px 20px;color:var(--text-muted);font-size:14px;}

@media(max-width:820px){
.mebook-root .mb-profile-friends-preview{grid-template-columns:repeat(3,1fr);}
.mebook-root .fl-avatar-wrap{width:56px;height:56px;}
.mebook-root .fl-avatar-wrap img{width:56px;height:56px;}
}

/* ============ CARDS ============ */
.mebook-root .mb-right{position:sticky;top:128px;align-self:start;display:flex;flex-direction:column;gap:16px;max-height:calc(100vh - 148px);overflow-y:auto;scrollbar-width:none;}
.mebook-root .mb-right::-webkit-scrollbar{width:0;}
.mebook-root .mb-card{border-radius:12px;box-shadow:var(--shadow);padding:14px 16px;transition:background .3s;}
.mebook-root .mb-card-title{font-size:16px;font-weight:700;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;}
.mebook-root .mb-contact{display:flex;align-items:center;gap:10px;padding:8px;border-radius:8px;transition:background .18s;cursor:pointer;position:relative;}
.mebook-root .mb-contact img{width:36px;height:36px;border-radius:50%;object-fit:cover;background:#cbd5e1;}
.mebook-root .mb-contact-name{font-size:14.5px;font-weight:600;}
.mebook-root .mb-online{position:absolute;bottom:7px;left:34px;width:11px;height:11px;border-radius:50%;background:var(--green-light);border:2px solid var(--card);}
.mebook-root .mb-page-title{font-size:20px;font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:10px;color:var(--text);}
.mebook-root .mb-page-title svg{width:22px;height:22px;fill:var(--green);}
.mebook-root .mb-search-box{display:flex;align-items:center;gap:10px;border-radius:24px;padding:10px 16px;box-shadow:var(--shadow);margin-bottom:18px;background:var(--card);}
.mebook-root .mb-search-box svg{width:20px;height:20px;fill:var(--text-muted);flex-shrink:0;}
.mebook-root .mb-search-box input{border:none;outline:none;flex:1;font-size:15px;background:transparent;color:var(--text);}
.mebook-root .mb-info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.mebook-root .mb-info-row{display:flex;align-items:center;gap:10px;font-size:14.5px;padding:6px 0;color:var(--text);}
.mebook-root .mb-info-row svg{width:18px;height:18px;fill:var(--green);flex-shrink:0;}
.mebook-root .mb-info-row b{font-weight:600;}
.mebook-root .mb-privacy-toggle{display:flex;align-items:center;justify-content:space-between;padding:10px 0;font-size:14.5px;border-bottom:1px solid var(--border);color:var(--text);}
.mebook-root .mb-privacy-toggle:last-child{border-bottom:none;}
.mebook-root .mb-switch{position:relative;width:44px;height:24px;flex-shrink:0;}
.mebook-root .mb-switch input{opacity:0;width:0;height:0;}
.mebook-root .mb-slider{position:absolute;inset:0;border-radius:24px;transition:.25s;background:var(--border);}
.mebook-root .mb-slider::before{content:"";position:absolute;width:18px;height:18px;left:3px;top:3px;background:#fff;border-radius:50%;transition:.25s;box-shadow:0 1px 3px rgba(0,0,0,.3);}
.mebook-root .mb-switch input:checked+.mb-slider{background:var(--green);}
.mebook-root .mb-switch input:checked+.mb-slider::before{transform:translateX(20px);}
.mebook-root .mb-settings-group{margin-bottom:16px;}
.mebook-root .mb-setting-row{display:flex;align-items:center;gap:12px;padding:10px 4px;border-bottom:1px solid var(--border);cursor:pointer;transition:background .18s;border-radius:8px;color:var(--text);}
.mebook-root .mb-setting-row:last-child{border-bottom:none;}
.mebook-root .mb-setting-ico{width:40px;height:40px;border-radius:50%;background:var(--input-bg);flex-shrink:0;display:flex;align-items:center;justify-content:center;}
.mebook-root .mb-setting-ico svg{width:20px;height:20px;fill:var(--text);}
.mebook-root .mb-setting-txt{flex:1;}
.mebook-root .mb-setting-txt h4{font-size:15px;font-weight:600;color:var(--text);}
.mebook-root .mb-setting-txt p{font-size:12.5px;color:var(--text-muted);margin-top:1px;}
.mebook-root .mb-setting-row .chev{width:18px;height:18px;fill:var(--text-muted);flex-shrink:0;}
.mebook-root .mb-theme-row{display:flex;align-items:center;justify-content:space-between;padding:14px 4px;color:var(--text);}
.mebook-root .mb-community-hero{background:linear-gradient(135deg,#0f172a 0%,#16a34a 100%);border-radius:12px;padding:26px 22px;color:#fff;margin-bottom:18px;box-shadow:var(--shadow);}
.mebook-root .mb-community-hero h2{font-size:20px;font-weight:800;}
.mebook-root .mb-community-hero p{font-size:14px;opacity:.85;margin-top:5px;}
.mebook-root .mb-mebook-hero{background:linear-gradient(135deg,#16a34a 0%,#0f172a 100%);border-radius:12px;padding:28px 22px;color:#fff;margin-bottom:18px;box-shadow:var(--shadow);position:relative;overflow:hidden;}
.mebook-root .mb-mebook-hero h2{font-size:20px;font-weight:800;position:relative;z-index:1;}
.mebook-root .mb-mebook-hero p{font-size:14px;opacity:.9;margin-top:6px;position:relative;z-index:1;}
.mebook-root .mb-mebook-badge{display:inline-block;background:rgba(255,255,255,.2);color:#fff;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;margin-top:12px;position:relative;z-index:1;backdrop-filter:blur(6px);}
.mebook-root .mb-mebook-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;}
.mebook-root .mb-mebook-stat{border-radius:12px;box-shadow:var(--shadow);padding:16px;text-align:center;transition:transform .2s;}
.mebook-root .mb-mebook-stat:hover{transform:translateY(-3px);}
.mebook-root .mb-mebook-stat .num{font-size:26px;font-weight:800;color:var(--green);}
.mebook-root .mb-mebook-stat .lbl{font-size:12.5px;color:var(--text-muted);margin-top:2px;}
.mebook-root .mb-mebook-list{display:flex;flex-direction:column;gap:10px;}
.mebook-root .mb-mebook-item{display:flex;gap:12px;padding:12px;border-radius:12px;box-shadow:var(--shadow);align-items:center;transition:transform .18s,box-shadow .18s;cursor:pointer;}
.mebook-root .mb-mebook-item:hover{transform:translateX(4px);box-shadow:var(--shadow-lg);}
.mebook-root .mb-mebook-item-body{flex:1;min-width:0;}
.mebook-root .mb-mebook-item-title{font-size:15px;font-weight:700;color:var(--text);}
.mebook-root .mb-mebook-item-desc{font-size:12.5px;color:var(--text-muted);margin-top:3px;line-height:1.4;}
.mebook-root .mb-mebook-item-meta{font-size:11.5px;color:var(--green);font-weight:600;margin-top:5px;}

/* ============ CREATE POST ============ */
.mebook-root .cp-page{max-width:600px;margin:0 auto;}
.mebook-root .cp-card{border-radius:12px;box-shadow:var(--shadow);padding:20px;margin-bottom:16px;}
.mebook-root .cp-user{display:flex;align-items:center;gap:10px;margin-bottom:14px;}
.mebook-root .cp-user img{width:44px;height:44px;border-radius:50%;object-fit:cover;background:#cbd5e1;}
.mebook-root .cp-user b{font-size:15px;color:var(--text);}
.mebook-root .cp-user small{font-size:12.5px;color:var(--text-muted);}
.mebook-root .cp-textarea{width:100%;min-height:130px;border:none;outline:none;resize:none;font-size:17px;line-height:1.4;padding:6px 0;background:transparent;color:var(--text);}
.mebook-root .cp-textarea::placeholder{color:#9ca3af;}
.mebook-root .cp-movie-tag{display:flex;align-items:center;gap:8px;background:rgba(22,163,74,.1);border:1px solid rgba(22,163,74,.3);border-radius:9px;padding:9px 12px;margin-bottom:10px;}
.mebook-root .cp-movie-tag svg{width:18px;height:18px;fill:var(--green);flex-shrink:0;}
.mebook-root .cp-movie-tag input{border:none;outline:none;background:transparent;flex:1;font-size:14px;font-weight:500;color:var(--text);}
.mebook-root .cp-upload-box{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;border:2px dashed var(--border);border-radius:12px;padding:26px;color:var(--text-muted);cursor:pointer;transition:border-color .2s,background .2s;text-align:center;}
.mebook-root .cp-upload-box:hover{border-color:var(--green);background:rgba(22,163,74,.05);}
.mebook-root .cp-upload-box svg{width:36px;height:36px;fill:var(--green);}
.mebook-root .cp-upload-box b{font-size:14.5px;color:var(--text);}
.mebook-root .cp-upload-box small{font-size:12.5px;}
.mebook-root .cp-preview{position:relative;border-radius:12px;overflow:hidden;margin-top:10px;background:#000;}
.mebook-root .cp-preview img{width:100%;max-height:340px;object-fit:contain;}
.mebook-root .cp-preview-remove{position:absolute;top:8px;right:8px;width:30px;height:30px;border-radius:50%;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;}
.mebook-root .cp-preview-remove svg{width:14px;height:14px;fill:#fff;}
.mebook-root .cp-actions{display:flex;gap:10px;margin-top:18px;}
.mebook-root .cp-actions .mb-btn{flex:1;padding:11px;}

/* ============ TOAST ============ */
.mebook-root .mb-toast-container{position:fixed;top:80px;right:20px;z-index:10050;display:flex;flex-direction:column;gap:10px;pointer-events:none;max-width:360px;}
.mebook-root .mb-toast{padding:12px 16px;border-radius:12px;font-size:14px;font-weight:500;box-shadow:0 8px 32px rgba(0,0,0,.18),0 0 0 1px rgba(0,0,0,.04);display:flex;align-items:center;gap:10px;pointer-events:auto;animation:toastIn .4s cubic-bezier(.2,.8,.3,1);min-width:240px;position:relative;overflow:hidden;background:var(--card);color:var(--text);}
.mebook-root .mb-toast.removing{animation:toastOut .35s cubic-bezier(.4,0,1,1) forwards;}
@keyframes toastIn{0%{opacity:0;transform:translateX(120%) scale(.9);}60%{opacity:1;transform:translateX(-6px) scale(1.02);}100%{opacity:1;transform:translateX(0) scale(1);}}
@keyframes toastOut{0%{opacity:1;transform:translateX(0) scale(1);}100%{opacity:0;transform:translateX(120%) scale(.9);}}
.mebook-root .mb-toast-icon{width:32px;height:32px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;}
.mebook-root .mb-toast-icon svg{width:18px;height:18px;fill:#fff;}
.mebook-root .mb-toast.success .mb-toast-icon{background:linear-gradient(135deg,#16a34a,#22c55e);}
.mebook-root .mb-toast.error .mb-toast-icon{background:linear-gradient(135deg,#dc2626,#ef4444);}
.mebook-root .mb-toast.info .mb-toast-icon{background:linear-gradient(135deg,#2563eb,#3b82f6);}
.mebook-root .mb-toast-body{flex:1;min-width:0;}
.mebook-root .mb-toast-title{font-size:14px;font-weight:700;margin-bottom:1px;}
.mebook-root .mb-toast-msg{font-size:13px;color:var(--text-muted);line-height:1.35;}
.mebook-root .mb-toast-progress{position:absolute;bottom:0;left:0;height:3px;background:linear-gradient(90deg,#16a34a,#22c55e);border-radius:0 0 12px 12px;animation:toastProgress 3s linear forwards;}
@keyframes toastProgress{from{width:100%;}to{width:0%;}}

.mebook-root .mb-empty{text-align:center;padding:50px 20px;color:var(--text-muted);border-radius:12px;box-shadow:var(--shadow);}
.mebook-root .mb-empty svg{width:52px;height:52px;fill:var(--border);margin:0 auto 12px;}
.mebook-root .mb-loading{text-align:center;padding:40px;color:var(--text-muted);}
.mebook-root .mb-back-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;box-shadow:var(--shadow);font-size:14px;font-weight:600;color:var(--text);margin-bottom:14px;transition:background .18s;background:var(--card);}
.mebook-root .mb-back-btn svg{width:18px;height:18px;fill:currentColor;}

.mebook-theme-ripple{position:fixed;z-index:9999;width:32px;height:32px;border-radius:50%;transform:translate(-50%,-50%) scale(0);pointer-events:none;animation:mebookRippleGrow .65s cubic-bezier(.2,.8,.2,1) forwards;}
@keyframes mebookRippleGrow{0%{transform:translate(-50%,-50%) scale(0);opacity:.85;}60%{opacity:.45;}100%{transform:translate(-50%,-50%) scale(80);opacity:0;}}

/* ============ RESPONSIVE ============ */
@media(max-width:1100px){
.mebook-root .mb-layout{grid-template-columns:240px minmax(0,1fr);}
.mebook-root .mb-right{display:none;}
}
@media(max-width:820px){
.mebook-root .mb-layout{grid-template-columns:minmax(0,1fr);padding:122px 10px 24px;}
.mebook-root .mb-sidebar{display:none;}
.mebook-root .mb-toast-container{left:10px;right:10px;max-width:none;top:70px;}
.mebook-root .mb-menu{top:66px;right:10px;left:10px;max-width:none;}
.mebook-root .fr-grid{grid-template-columns:repeat(auto-fill,minmax(160px,1fr));}
.mebook-root .fr-request-actions{flex-direction:row;}
.mebook-root .mb-profile-cover{height:240px;}
.mebook-root .mb-profile-avatar-center{margin-top:-70px;padding:0 14px;}
.mebook-root .mb-profile-avatar-wrap img{width:140px;height:140px;border-width:4px;}
.mebook-root .mb-profile-name{font-size:24px;}
.mebook-root .mb-profile-friends-strip{flex-direction:column;text-align:center;}
.mebook-root .mb-profile-friends-text{text-align:center;}
}
@media(max-width:600px){
.mebook-root .mb-logo-text{font-size:21px;}
.mebook-root .mb-header-logo{height:38px;}
.mebook-root .mb-profile-cover{height:180px;}
.mebook-root .mb-profile-avatar-center{margin-top:-56px;}
.mebook-root .mb-profile-avatar-wrap img{width:112px;height:112px;border-width:4px;}
.mebook-root .mb-profile-name{font-size:22px;}
.mebook-root .mb-profile-sub{font-size:13.5px;}
.mebook-root .mb-profile-actions .mb-btn{padding:10px 16px;font-size:13.5px;}
.mebook-root .mb-profile-btn-icon{width:40px!important;}
.mebook-root .auth-card{padding:28px 22px 24px;border-radius:20px;}
.mebook-root .share-options{grid-template-columns:1fr;}
.mebook-root .mb-info-grid{grid-template-columns:1fr;}
.mebook-root .fr-grid{grid-template-columns:1fr 1fr;}
.mebook-root .fl-head-title{font-size:20px;}
.mebook-root .fl-stats-title{font-size:18px;}
.mebook-root .fl-name{font-size:15.5px;}
.mebook-root .fl-mutual{font-size:12.5px;}
.mebook-root .fl-sheet-header-name{font-size:15px;}
.mebook-root .fl-sheet-title{font-size:14.5px;}
.mebook-root .fl-sheet-desc{font-size:12px;}
.mebook-root .cmt-replies{margin-left:36px;}
.mebook-root .cmt-row-avatar{width:32px;height:32px;}
.mebook-root .msgr-list{width:100%;}
}

/* ============================================================
   FACEBOOK-STYLE SPLASH SCREEN (1 · Classic Dots)
   ============================================================ */
.mebook-splash{
position:fixed;inset:0;z-index:9999;
background:#0b0f1a;
display:flex;flex-direction:column;
align-items:center;justify-content:center;
gap:28px;
padding:20px;
}
.mebook-splash::before{
content:'';position:absolute;inset:0;
background:
radial-gradient(circle at 30% 20%,rgba(34,197,94,.10) 0%,transparent 50%),
radial-gradient(circle at 70% 80%,rgba(34,197,94,.08) 0%,transparent 50%);
pointer-events:none;
}
.mebook-splash-logo-wrap{
display:flex;flex-direction:column;
align-items:center;gap:12px;
position:relative;z-index:2;
}
.mebook-splash-logo-img{
width:68px;height:68px;object-fit:contain;
filter:drop-shadow(0 4px 20px rgba(34,197,94,.55));
animation:splashFloat 3s ease-in-out infinite;
}
@keyframes splashFloat{
0%,100%{transform:translateY(0) scale(1);}
50%{transform:translateY(-4px) scale(1.03);}
}
.mebook-splash-logo-text{
font-size:34px;font-weight:900;
letter-spacing:-1.2px;line-height:1;
display:flex;align-items:baseline;
}
.mebook-splash-logo-text .me{
background:linear-gradient(135deg,#22c55e 0%,#86efac 50%,#4ade80 100%);
-webkit-background-clip:text;background-clip:text;
color:transparent;
text-shadow:0 0 30px rgba(34,197,94,.4);
}
.mebook-splash-logo-text .book{
color:#ffffff;
text-shadow:0 0 20px rgba(255,255,255,.3);
}
.mebook-splash-dots{
display:flex;gap:8px;
position:relative;z-index:2;
margin-top:8px;
}
.mebook-splash-dots span{
width:10px;height:10px;border-radius:50%;
background:#22c55e;
box-shadow:0 0 12px rgba(34,197,94,.7);
animation:splashBounce 1.4s ease-in-out infinite;
}
.mebook-splash-dots span:nth-child(1){animation-delay:0s;}
.mebook-splash-dots span:nth-child(2){animation-delay:.15s;}
.mebook-splash-dots span:nth-child(3){animation-delay:.3s;}
.mebook-splash-dots span:nth-child(4){animation-delay:.45s;}
@keyframes splashBounce{
0%,60%,100%{transform:translateY(0);opacity:.5;}
30%{transform:translateY(-12px);opacity:1;}
}
.mebook-splash-from{
position:absolute;bottom:28px;left:50%;
transform:translateX(-50%);
display:flex;flex-direction:column;
align-items:center;gap:4px;
z-index:2;
animation:splashFromFade 3s ease-in-out infinite;
}
@keyframes splashFromFade{
0%,100%{opacity:.85;}
50%{opacity:1;}
}
.mebook-splash-from .from-label{
font-size:10px;font-weight:500;
color:#94a3b8;letter-spacing:.12em;
text-transform:uppercase;
}
.mebook-splash-from .from-name{
font-size:14px;font-weight:800;
letter-spacing:.05em;
background:linear-gradient(135deg,#22c55e 0%,#86efac 100%);
-webkit-background-clip:text;background-clip:text;
color:transparent;
text-shadow:0 0 15px rgba(34,197,94,.35);
}

/* ============================================================
   YOUTUBE POSTS (Shorts + videos)
   ============================================================ */
.mebook-root .mb-yt{position:relative;background:#000;width:100%;display:flex;justify-content:center;align-items:center;overflow:hidden;}
.mebook-root .mb-yt.short{height:min(560px,78vh);}
.mebook-root .mb-yt-stage{position:relative;background:#000;overflow:hidden;}
.mebook-root .mb-yt.short .mb-yt-stage{height:100%;aspect-ratio:9/16;max-width:100%;}
.mebook-root .mb-yt.video .mb-yt-stage{width:100%;aspect-ratio:16/9;}
.mebook-root .mb-yt-frame{position:absolute;left:0;right:0;top:0;bottom:0;}
.mebook-root .mb-yt.short.cropped{height:auto;}
.mebook-root .mb-yt.short.cropped .mb-yt-stage{height:auto;width:min(100%,calc(min(560px,78vh) / var(--yt-r,1.7778)));}
.mebook-root .mb-yt-stage iframe{position:absolute;inset:0;width:100%;height:100%;border:0;pointer-events:none;}
.mebook-root .mb-yt-thumb{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
.mebook-root .mb-yt-shade{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,.25),rgba(0,0,0,.05) 40%,rgba(0,0,0,.35));}
.mebook-root .mb-yt-badge{
position:absolute;top:10px;left:10px;z-index:2;padding:4px 9px;border-radius:8px;
background:rgba(0,0,0,.6);color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;gap:5px;
}
.mebook-root .mb-yt-badge i{display:inline-block;width:0;height:0;border-left:7px solid #ff3b3b;border-top:5px solid transparent;border-bottom:5px solid transparent;}
.mebook-root .mb-yt-bigplay{
position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:2;
width:68px;height:68px;border-radius:50%;background:rgba(0,0,0,.55);
border:2px solid rgba(255,255,255,.85);display:flex;align-items:center;justify-content:center;
transition:transform .15s,background .15s;
}
.mebook-root .mb-yt-bigplay:hover{transform:translate(-50%,-50%) scale(1.08);background:rgba(0,0,0,.7);}
.mebook-root .mb-yt-bigplay svg{width:34px;height:34px;fill:#fff;margin-left:3px;}
.mebook-root .mb-yt-spinner{
position:absolute;left:50%;top:50%;z-index:2;width:38px;height:38px;margin:-19px 0 0 -19px;
border:3px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:ytSpin .8s linear infinite;
}
@keyframes ytSpin{to{transform:rotate(360deg);}}
.mebook-root .mb-yt-tap{position:absolute;inset:0;z-index:3;cursor:pointer;}
.mebook-root .mb-yt-flash{
position:absolute;left:50%;top:50%;z-index:4;pointer-events:none;
min-width:64px;height:64px;padding:0 14px;border-radius:32px;background:rgba(0,0,0,.6);color:#fff;
display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;
transform:translate(-50%,-50%);animation:ytFlash .6s ease forwards;
}
@keyframes ytFlash{0%{opacity:0;transform:translate(-50%,-50%) scale(.7);}25%{opacity:1;transform:translate(-50%,-50%) scale(1);}100%{opacity:0;transform:translate(-50%,-50%) scale(1.1);}}
.mebook-root .mb-yt-bar{
position:absolute;left:0;right:0;bottom:0;z-index:5;padding:22px 10px 8px;
background:linear-gradient(to top,rgba(0,0,0,.8),rgba(0,0,0,0));color:#fff;
}
.mebook-root .mb-yt-seek{width:100%;height:16px;margin:0;accent-color:#22c55e;cursor:pointer;display:block;}
.mebook-root .mb-yt-row{display:flex;align-items:center;gap:4px;margin-top:2px;}
.mebook-root .mb-yt-btn{
min-width:36px;height:36px;padding:0 6px;border-radius:50%;color:#fff;
display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;gap:2px;
}
.mebook-root .mb-yt-btn:hover{background:rgba(255,255,255,.18);}
.mebook-root .mb-yt-btn svg{width:22px;height:22px;fill:currentColor;}
.mebook-root .mb-yt-time{font-size:12px;font-weight:600;margin-left:auto;margin-right:4px;opacity:.9;white-space:nowrap;}
.mebook-root .mb-yt-err{
position:absolute;inset:0;z-index:6;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;
background:rgba(0,0,0,.85);color:#fff;font-size:14px;text-align:center;padding:20px;
}
.mebook-root .mb-yt-err a{padding:9px 16px;border-radius:10px;background:#ff3b3b;color:#fff;font-weight:700;text-decoration:none;}
.mebook-root .mb-yt:fullscreen{height:100vh;}
.mebook-root .mb-yt:fullscreen .mb-yt-stage{width:100%;height:auto;max-height:100vh;aspect-ratio:16/9;}

/* ============================================================
   EDIT / DELETE / SEE MORE / PHOTO VIEWER
   ============================================================ */
.mebook-root .mb-cap-text.clamp{
display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
}
.mebook-root .mb-see-more{
display:inline-block;margin-top:2px;padding:0;
font-size:14.5px;font-weight:700;color:var(--text-muted);
}
.mebook-root .mb-see-more:hover{text-decoration:underline;}
.mebook-root .mb-cap-text.expanded{cursor:pointer;}
.mebook-root .mb-post-media img{cursor:zoom-in;}
.mebook-root .mb-edited-tag{font-size:12px;color:var(--text-muted);}

/* Bottom sheet */
.mebook-root .mb-sheet-backdrop{
position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.45);
display:flex;align-items:flex-end;justify-content:center;
animation:sheetFade .18s ease;
}
@keyframes sheetFade{from{opacity:0;}to{opacity:1;}}
.mebook-root .mb-sheet{
width:100%;max-width:480px;background:var(--card);color:var(--text);
border-radius:18px 18px 0 0;padding:8px 8px calc(12px + env(safe-area-inset-bottom,0px));
box-shadow:var(--shadow-lg);animation:sheetUp .22s cubic-bezier(.2,.8,.3,1);
}
@keyframes sheetUp{from{transform:translateY(100%);}to{transform:none;}}
.mebook-root .mb-sheet-grip{width:38px;height:4px;border-radius:4px;background:var(--border);margin:4px auto 8px;}
.mebook-root .mb-sheet-item{
width:100%;display:flex;align-items:center;gap:14px;padding:14px 16px;
border-radius:12px;font-size:15.5px;font-weight:600;text-align:left;
}
.mebook-root .mb-sheet-item:hover{background:var(--hover);}
.mebook-root .mb-sheet-item svg{width:22px;height:22px;fill:currentColor;flex-shrink:0;}
.mebook-root .mb-sheet-item.danger{color:#ef4444;}
@media(min-width:640px){
.mebook-root .mb-sheet-backdrop{align-items:center;}
.mebook-root .mb-sheet{border-radius:18px;}
}

/* Edit post modal */
.mebook-root .mb-modal-backdrop{
position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.55);
display:flex;align-items:center;justify-content:center;padding:14px;
animation:sheetFade .18s ease;
}
.mebook-root .mb-modal{
width:100%;max-width:520px;max-height:92vh;overflow-y:auto;
background:var(--card);color:var(--text);border-radius:16px;
box-shadow:var(--shadow-lg);padding:0 0 14px;
}
.mebook-root .mb-modal-head{
display:flex;align-items:center;justify-content:space-between;
padding:14px 16px;border-bottom:1px solid var(--border);font-size:17px;
}
.mebook-root .mb-modal-x{
width:34px;height:34px;border-radius:50%;background:var(--hover);
display:flex;align-items:center;justify-content:center;
}
.mebook-root .mb-modal-x svg{width:18px;height:18px;fill:currentColor;}
.mebook-root .mb-modal-textarea{
width:calc(100% - 32px);margin:14px 16px 0;min-height:110px;resize:vertical;
border:1px solid var(--border);border-radius:12px;padding:10px 12px;
background:var(--input-bg);color:var(--text);font-size:15px;line-height:1.45;
font-family:inherit;outline:none;box-sizing:border-box;
}
.mebook-root .mb-modal-textarea:focus{border-color:var(--green);}
.mebook-root .mb-modal-img{position:relative;margin:12px 16px 0;border-radius:12px;overflow:hidden;background:#000;}
.mebook-root .mb-modal-img img{width:100%;max-height:320px;object-fit:contain;display:block;}
.mebook-root .mb-modal-img button{
position:absolute;top:8px;right:8px;width:32px;height:32px;border-radius:50%;
background:rgba(0,0,0,.65);color:#fff;display:flex;align-items:center;justify-content:center;
}
.mebook-root .mb-modal-img button svg{width:18px;height:18px;fill:currentColor;}
.mebook-root .mb-modal-photo{
display:flex;align-items:center;gap:8px;margin:12px 16px 0;padding:10px 14px;
border:1px dashed var(--border);border-radius:12px;font-size:14px;font-weight:600;color:var(--green);
width:calc(100% - 32px);justify-content:center;box-sizing:border-box;
}
.mebook-root .mb-modal-photo svg{width:20px;height:20px;fill:currentColor;}
.mebook-root .mb-modal-save{
display:block;width:calc(100% - 32px);margin:14px 16px 0;padding:12px;border-radius:12px;
background:var(--green);color:#fff;font-size:15px;font-weight:700;
}
.mebook-root .mb-modal-save:disabled{opacity:.5;cursor:not-allowed;}

/* Photo viewer (Facebook style) */
.mebook-root .mb-pv{position:fixed;inset:0;z-index:10001;background:#000;overflow:hidden;animation:sheetFade .18s ease;-webkit-tap-highlight-color:transparent;}
.mebook-root .mb-pv-stage{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;overflow:hidden;}
.mebook-root .mb-pv-stage img{max-width:100%;max-height:100%;object-fit:contain;display:block;transition:transform .22s ease;user-select:none;-webkit-user-drag:none;}
.mebook-root .mb-pv-top{position:absolute;top:0;left:0;right:0;z-index:2;display:flex;align-items:center;justify-content:space-between;padding:calc(12px + env(safe-area-inset-top,0px)) 12px 24px;background:linear-gradient(to bottom,rgba(0,0,0,.55),rgba(0,0,0,0));transition:opacity .2s ease,transform .2s ease;}
.mebook-root .mb-pv-icon{width:46px;height:46px;display:flex;align-items:center;justify-content:center;color:#fff;background:transparent;border-radius:50%;}
.mebook-root .mb-pv-icon:active{background:rgba(255,255,255,.14);}
.mebook-root .mb-pv-icon svg{width:30px;height:30px;}
.mebook-root .mb-pv-bottom{position:absolute;left:0;right:0;bottom:0;z-index:2;max-height:58vh;overflow-y:auto;padding:46px 18px calc(16px + env(safe-area-inset-bottom,0px));background:linear-gradient(to top,rgba(0,0,0,.88) 60%,rgba(0,0,0,0));color:#fff;transition:opacity .2s ease,transform .2s ease;}
.mebook-root .mb-pv.hide .mb-pv-top{opacity:0;pointer-events:none;transform:translateY(-14px);}
.mebook-root .mb-pv.hide .mb-pv-bottom{opacity:0;pointer-events:none;transform:translateY(14px);}
.mebook-root .mb-pv-name{font-size:17px;font-weight:700;letter-spacing:.2px;}
.mebook-root .mb-pv-time{display:flex;align-items:center;gap:6px;margin-top:4px;font-size:14px;color:#c4c8ce;}
.mebook-root .mb-pv-time svg{width:14px;height:14px;}
.mebook-root .mb-pv-caption{margin-top:14px;font-size:16px;line-height:1.55;color:#f1f2f4;white-space:pre-wrap;word-wrap:break-word;}
.mebook-root .mb-pv-more{color:#fff;font-weight:700;font-size:16px;padding:0;background:none;margin-left:2px;}
.mebook-root .mb-pv-stats{display:flex;align-items:center;justify-content:space-between;margin-top:18px;}
.mebook-root .mb-pv-stats-left{display:flex;align-items:center;gap:26px;}
.mebook-root .mb-pv-stat{display:inline-flex;align-items:center;gap:9px;color:#e4e6eb;font-size:16px;font-weight:600;background:none;padding:4px 0;}
.mebook-root .mb-pv-stat svg{width:30px;height:30px;}
.mebook-root .mb-pv-rx{display:flex;align-items:center;}
.mebook-root .mb-pv-rx>span{display:inline-flex;}
.mebook-root .mb-pv-dim{position:absolute;inset:0;z-index:3;background:rgba(0,0,0,.55);animation:sheetFade .18s ease;}
.mebook-root .mb-pv-sheet{position:absolute;left:0;right:0;bottom:0;z-index:4;background:#242526;border-radius:18px 18px 0 0;padding:10px 0 calc(14px + env(safe-area-inset-bottom,0px));animation:mbPvSlide .24s cubic-bezier(.2,.8,.2,1);}
.mebook-root .mb-pv-sheet-item{width:100%;display:flex;align-items:center;gap:16px;padding:14px 20px;color:#e4e6eb;font-size:15px;font-weight:500;background:none;text-align:left;}
.mebook-root .mb-pv-sheet-item:active{background:rgba(255,255,255,.07);}
.mebook-root .mb-pv-sheet-item svg{width:30px;height:30px;flex-shrink:0;}
@keyframes mbPvSlide{from{transform:translateY(100%)}to{transform:none}}

/* Comment edit / menu */
.mebook-root .cmt-more-btn{padding:2px 6px;letter-spacing:1px;font-weight:800;}
.mebook-root .cmt-edit-box{display:block;max-width:92%;}
.mebook-root .cmt-edit-input{
width:100%;min-height:44px;resize:vertical;border:1px solid var(--border);
border-radius:14px;padding:8px 12px;background:var(--input-bg);color:var(--text);
font-size:14px;line-height:1.42;font-family:inherit;outline:none;box-sizing:border-box;
}
.mebook-root .cmt-edit-input:focus{border-color:var(--green);}
.mebook-root .cmt-edit-actions{display:flex;align-items:center;gap:10px;margin-top:4px;padding:0 4px;font-size:12px;color:var(--text-muted);}
.mebook-root .cmt-edit-actions span{flex:1;}
.mebook-root .cmt-edit-actions button{font-size:12.5px;font-weight:700;padding:4px 10px;border-radius:8px;}
.mebook-root .cmt-edit-actions .cmt-edit-save{background:var(--green);color:#fff;}
.mebook-root .cmt-edit-actions .cmt-edit-save:disabled{opacity:.5;}
.mebook-root .cmt-edit-actions .cmt-edit-cancel{background:var(--hover);}

/* Chat message menu button + edit banner */
.mebook-root .mechat-msg-more{
width:28px;height:28px;border-radius:50%;flex-shrink:0;align-self:center;
display:flex;align-items:center;justify-content:center;color:var(--text-muted);
opacity:0;transition:opacity .15s,background .15s;
}
.mebook-root .mechat-msg-more svg{width:18px;height:18px;fill:currentColor;}
.mebook-root .mechat-msg-more:hover{background:var(--hover);}
.mebook-root .mechat-bubble-wrap:hover .mechat-msg-more{opacity:1;}
@media(hover:none){.mebook-root .mechat-msg-more{opacity:.55;}}

/* Auto-hide header on scroll (mobile) */
@media(max-width:860px){
.mebook-root .mb-header.hide{transform:translateY(-100%);box-shadow:none;}
/* nav bar slides up into the header's place and stays pinned */
.mebook-root .mb-navbar.hide{transform:translateY(-60px);}
}

/* ============================================================
   MECHAT FULL-SCREEN MESSENGER SHELL (header hidden, WhatsApp-style desktop)
   ============================================================ */
.mebook-root.mc-open .mb-header,.mebook-root.mc-open .mb-navbar{display:none;}
.mebook-root .mb-header-right .mb-plus-btn svg{width:22px;height:22px;}
.mebook-root .mc-shell{position:fixed;left:0;top:0;right:0;height:100vh;height:100dvh;z-index:1200;display:flex;background:var(--card);overflow:hidden;}
.mebook-root .mc-side{display:none;width:380px;max-width:38vw;min-width:300px;border-right:1px solid var(--border);flex-direction:column;background:var(--card);height:100%;}
.mebook-root .mc-side-head{display:flex;align-items:center;gap:8px;padding:12px 14px 6px;flex-shrink:0;}
.mebook-root .mc-side-head h2{font-size:20px;font-weight:800;flex:1;color:var(--text);}
.mebook-root .mc-side-back{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--text);}
.mebook-root .mc-side-back:hover{background:var(--hover);}
.mebook-root .mc-side-back svg{width:22px;height:22px;fill:currentColor;}
.mebook-root .mc-side-body{flex:1;min-height:0;overflow-y:auto;padding:0 10px 12px;overscroll-behavior:contain;}
.mebook-root .mc-side-body .mb-search-box{box-shadow:none;background:var(--input-bg);margin:6px 0 10px;}
.mebook-root .mc-side-body .msgr-wrap,.mebook-root .mc-list{box-shadow:none;height:auto;min-height:0;border-radius:0;background:transparent;border:none;}
.mebook-root .mc-list .msgr-list{overflow:visible;width:100%;border:none;}
.mebook-root .mc-side-body .msgr-item{border-radius:12px;}
.mebook-root .mc-main{flex:1;min-width:0;display:flex;flex-direction:column;height:100%;}
.mebook-root .mc-shell .mechat-page{height:100%;flex:1;min-height:0;position:relative;}
@media(min-width:821px){
.mebook-root .mc-side{display:flex;}
.mebook-root .mc-shell .mechat-head-back{display:none;}
}
.mebook-root .mechat-date-sep{display:flex;justify-content:center;margin:12px 0 6px;}
.mebook-root .mechat-date-sep span{font-size:11.5px;font-weight:700;color:var(--text-muted);background:rgba(128,128,128,.16);padding:3px 12px;border-radius:12px;}
.mebook-root .mechat-scrolldown{position:absolute;right:16px;bottom:88px;width:40px;height:40px;border-radius:50%;background:var(--card);box-shadow:0 4px 16px rgba(0,0,0,.25);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;z-index:6;animation:bubbleIn .2s ease;}
.mebook-root .mechat-scrolldown svg{width:22px;height:22px;fill:var(--green);}
.mebook-root .mechat-side-actions{display:flex;gap:2px;align-self:center;opacity:0;transition:opacity .15s;}
.mebook-root .mechat-bubble-wrap:hover .mechat-side-actions{opacity:1;}
.mebook-root .mechat-side-actions button{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--text-muted);}
.mebook-root .mechat-side-actions button:hover{background:var(--hover);}
.mebook-root .mechat-side-actions svg{width:16px;height:16px;fill:currentColor;}
@media(hover:none){.mebook-root .mechat-side-actions{display:none;}}
.mebook-root .mechat-reply-quote{cursor:pointer;}
.mebook-root .mechat-bubble-wrap.mc-flash .mechat-bubble{animation:mcFlash 1.4s ease;}
@keyframes mcFlash{0%,60%{box-shadow:0 0 0 3px rgba(34,197,94,.75);}100%{box-shadow:0 0 0 3px rgba(34,197,94,0);}}
.mebook-root .mechat-bubble-image img{cursor:zoom-in;}

/* ============================================================
   MECHAT — LIST SCROLL FIX + LONG-PRESS MENU + CHAT HEAD
   ============================================================ */
.mebook-root .msgr-wrap.mc-plain{height:auto;min-height:0;display:block;overflow:visible;padding-bottom:110px;}
.mebook-root .msgr-wrap.mc-plain .msgr-list{width:100%;overflow:visible;border:none;flex:none;}
.mebook-root .mc-pressable{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;}
.mebook-root .mc-pressable img{-webkit-user-drag:none;}
.mebook-root .mc-pressable:active{background:var(--hover);}
.mebook-root .mc-item-meta{display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0;min-width:34px;}
.mebook-root .mc-item-flags{display:flex;align-items:center;gap:6px;min-height:14px;color:var(--text-muted);}
.mebook-root .mc-flag{display:flex;}
.mebook-root .mc-flag svg{width:14px;height:14px;fill:currentColor;}
.mebook-root .mc-unread-dot{width:10px;height:10px;border-radius:50%;background:#0084ff;display:block;}
.mebook-root .msgr-item-name.mc-unread{font-weight:800;}
.mebook-root .mc-folder-row{display:flex;align-items:center;gap:14px;padding:12px 16px;cursor:pointer;color:var(--text);font-weight:600;font-size:14.5px;}
.mebook-root .mc-folder-row span{flex:1;}
.mebook-root .mc-folder-row b{font-size:12px;color:var(--text-muted);font-weight:700;}
.mebook-root .mc-folder-row:hover{background:var(--hover);}
.mebook-root .mc-folder-row svg{fill:currentColor;}

.mebook-root .mc-sheet-overlay{position:fixed;inset:0;z-index:3000;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center;animation:mcFade .18s ease;}
.mebook-root .mc-sheet-overlay.mc-center{align-items:center;padding:20px;}
.mebook-root .mc-sheet{width:100%;max-width:520px;background:var(--card);color:var(--text);border-radius:22px 22px 0 0;padding:8px 0 calc(14px + env(safe-area-inset-bottom,0px));max-height:92vh;max-height:92dvh;overflow-y:auto;animation:mcSlide .24s cubic-bezier(.2,.8,.2,1);}
.mebook-root .mc-sheet-handle{width:44px;height:5px;border-radius:3px;background:var(--border);margin:4px auto 8px;}
.mebook-root .mc-sheet-head{display:flex;align-items:center;gap:12px;padding:6px 22px 12px;border-bottom:1px solid var(--border);margin-bottom:4px;}
.mebook-root .mc-sheet-head img{width:40px;height:40px;border-radius:50%;object-fit:cover;}
.mebook-root .mc-sheet-head b{font-size:15.5px;}
.mebook-root .mc-sheet-row{display:flex;align-items:center;gap:22px;width:100%;padding:14px 24px;font-size:16.5px;font-weight:500;font-family:inherit;text-align:left;color:var(--text);cursor:pointer;background:none;border:none;}
.mebook-root .mc-sheet-row:hover,.mebook-root .mc-sheet-row:active{background:var(--hover);}
.mebook-root .mc-sheet-row svg{width:26px;height:26px;fill:currentColor;flex-shrink:0;}
.mebook-root .mc-sheet-row.danger{color:#ef4444;}
@keyframes mcFade{from{opacity:0;}to{opacity:1;}}
@keyframes mcSlide{from{transform:translateY(100%);}to{transform:translateY(0);}}

.mebook-root .mc-dialog{width:100%;max-width:340px;background:var(--card);color:var(--text);border-radius:16px;padding:20px;animation:mcFade .18s ease;}
.mebook-root .mc-dialog h3{font-size:18px;font-weight:800;margin:0 0 8px;}
.mebook-root .mc-dialog p{font-size:14px;color:var(--text-muted);margin:0 0 16px;line-height:1.45;}
.mebook-root .mc-dialog-actions{display:flex;justify-content:flex-end;gap:8px;}
.mebook-root .mc-dialog-actions button{padding:9px 16px;border-radius:10px;font-weight:700;font-size:14px;font-family:inherit;color:var(--text);background:var(--hover);border:none;cursor:pointer;}
.mebook-root .mc-dialog-actions button.danger{background:#ef4444;color:#fff;}

.mebook-root .mc-add{padding-left:16px;padding-right:16px;}
.mebook-root .mc-add-title{font-size:17px;font-weight:800;padding:4px 4px 10px;}
.mebook-root .mc-add-search{width:100%;padding:11px 14px;border-radius:12px;border:1px solid var(--border);background:var(--input-bg);color:var(--text);font-size:14.5px;font-family:inherit;outline:none;margin-bottom:8px;}
.mebook-root .mc-add-list{max-height:44vh;overflow-y:auto;}
.mebook-root .mc-add-row{display:flex;align-items:center;gap:12px;padding:9px 4px;cursor:pointer;border-radius:10px;}
.mebook-root .mc-add-row:hover{background:var(--hover);}
.mebook-root .mc-add-row img{width:40px;height:40px;border-radius:50%;object-fit:cover;}
.mebook-root .mc-add-row span{flex:1;font-weight:600;font-size:14.5px;}
.mebook-root .mc-add-row i{width:22px;height:22px;border-radius:50%;border:2px solid var(--border);display:flex;align-items:center;justify-content:center;}
.mebook-root .mc-add-row i.on{background:#0084ff;border-color:#0084ff;color:#fff;}
.mebook-root .mc-add-empty{padding:20px;text-align:center;color:var(--text-muted);font-size:14px;}
.mebook-root .mc-add-confirm{width:100%;margin-top:10px;padding:12px;border-radius:12px;background:#0084ff;color:#fff;font-weight:700;font-size:15px;font-family:inherit;border:none;cursor:pointer;}
.mebook-root .mc-add-confirm:disabled{opacity:.45;cursor:default;}

.mebook-root .mc-head{position:fixed;z-index:3200;width:58px;height:58px;border-radius:50%;box-shadow:0 6px 20px rgba(0,0,0,.45);touch-action:none;cursor:grab;background:var(--card);transition:left .18s ease;}
.mebook-root .mc-head img{width:100%;height:100%;border-radius:50%;object-fit:cover;border:2px solid #fff;pointer-events:none;}
.mebook-root .mc-head-x{position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;background:#333;color:#fff;font-size:14px;line-height:1;display:flex;align-items:center;justify-content:center;border:none;cursor:pointer;padding:0;}
.mebook-root .mc-sender-name{font-size:11.5px;font-weight:700;opacity:.75;margin-bottom:2px;}

.mebook-root .mc-vbadge{display:inline-block;vertical-align:-2px;margin-left:4px;}
.mebook-root .msgr-item-name.mc-has-badge{display:flex;align-items:center;gap:0;}
.mebook-root .msgr-item-name .mc-name-text{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;}
.mebook-root .msgr-item-name.mc-has-badge .mc-vbadge{margin-left:4px;}
.mebook-root .mc-sender-name .mc-vbadge{margin-left:3px;vertical-align:-1px;}

/* ============================================================
   MECHAT — FULL SCREEN LIST PAGE, GLASS BACK BUTTON, TITLE
   ============================================================ */
.mebook-root .mc-title{font-size:20px;font-weight:800;color:#fff;margin:0;letter-spacing:.2px;line-height:1.1;}
.mebook-root .mc-title span{color:#22c55e;}
.mebook-root .mc-listpage{position:fixed;left:0;top:0;right:0;height:100vh;height:100dvh;z-index:1200;display:flex;flex-direction:column;background:var(--bg);}
.mebook-root .mc-listpage-head{display:flex;align-items:center;gap:10px;padding:14px 16px 12px;padding-top:calc(14px + env(safe-area-inset-top,0px));background:var(--header-bg);flex-shrink:0;box-shadow:0 2px 12px rgba(0,0,0,.25);}
.mebook-root .mc-listpage-head svg{width:28px;height:28px;fill:#22c55e;flex-shrink:0;}
.mebook-root .mc-listpage-body{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:12px 12px 0;width:100%;max-width:760px;margin:0 auto;}
.mebook-root .mc-side-head{background:var(--header-bg);padding:12px 14px;margin-bottom:6px;}
.mebook-root .mc-side-head .mc-side-back{color:#fff;}
.mebook-root .mc-side-head .mc-side-back:hover{background:rgba(255,255,255,.14);}
.mebook-root .mc-side{position:relative;}
.mebook-root .mc-side-body{padding-bottom:90px;}
.mebook-root .mc-back-glass{position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:1300;display:flex;align-items:center;gap:10px;padding:13px 26px;border-radius:999px;font-family:inherit;font-weight:700;font-size:15px;white-space:nowrap;color:var(--text);cursor:pointer;overflow:hidden;
background:linear-gradient(135deg,rgba(34,197,94,.34) 0%,rgba(255,255,255,.14) 55%,rgba(34,197,94,.18) 100%);
-webkit-backdrop-filter:blur(18px) saturate(190%);backdrop-filter:blur(18px) saturate(190%);
border:1px solid rgba(255,255,255,.42);
box-shadow:0 10px 30px rgba(0,0,0,.30),inset 0 1.5px 1px rgba(255,255,255,.75),inset 0 -10px 20px rgba(255,255,255,.07),inset 0 0 0 1px rgba(255,255,255,.08);
transition:transform .15s ease,box-shadow .15s ease;-webkit-tap-highlight-color:transparent;}
.mebook-root .mc-back-glass::before{content:"";position:absolute;left:8%;right:8%;top:0;height:52%;border-radius:999px;background:linear-gradient(180deg,rgba(255,255,255,.5),rgba(255,255,255,0));opacity:.55;pointer-events:none;}
.mebook-root .mc-back-glass:active{transform:translateX(-50%) scale(.95);}
.mebook-root .mc-back-glass svg{width:20px;height:20px;fill:currentColor;position:relative;}
.mebook-root .mc-back-glass span{position:relative;}
.mebook-root .mc-back-glass.in-side{position:absolute;z-index:5;}

/* ============ HEADER: fixed logo size, no beta badge ============ */
.mebook-root .mb-header .mb-header-left{flex-shrink:0;gap:6px;}
.mebook-root .mb-header .mb-header-logo{height:38px;width:38px;flex:0 0 38px;}
.mebook-root .mb-header .mb-logo-text{font-size:26px;font-weight:800;letter-spacing:-.6px;white-space:nowrap;flex-shrink:0;margin-left:0;}
.mebook-root .mb-header .mb-logo-stack{flex-shrink:0;}
.mebook-root .mb-header .mb-header-right{flex-shrink:0;gap:8px;}

/* ============ FACEBOOK-STYLE SEARCH PAGE ============ */
.mebook-root.sr-open .mb-header,.mebook-root.sr-open .mb-navbar{display:none;}
.mebook-root .sr-page{position:fixed;inset:0;z-index:1300;background:var(--card);display:flex;flex-direction:column;padding-top:env(safe-area-inset-top,0px);}
.mebook-root .sr-top{display:flex;align-items:center;gap:8px;padding:10px 12px;flex-shrink:0;}
.mebook-root .sr-ibtn{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--text);flex-shrink:0;transition:background .15s;}
.mebook-root .sr-ibtn:hover{background:var(--hover);}
.mebook-root .sr-ibtn:active{transform:scale(.93);}
.mebook-root .sr-ibtn svg{width:24px;height:24px;fill:currentColor;}
.mebook-root .sr-box{flex:1;min-width:0;display:flex;align-items:center;gap:8px;background:var(--input-bg);border-radius:22px;padding:0 6px 0 14px;height:42px;}
.mebook-root .sr-box input{flex:1;min-width:0;border:none;outline:none;background:transparent;font-size:16px;color:var(--text);height:100%;}
.mebook-root .sr-box input::placeholder{color:var(--text-muted);}
.mebook-root .sr-clear{width:28px;height:28px;border-radius:50%;background:rgba(128,128,128,.35);color:var(--card);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.mebook-root .sr-clear svg{width:16px;height:16px;fill:currentColor;}
.mebook-root .sr-chips{display:flex;gap:8px;padding:2px 12px 8px;flex-shrink:0;overflow-x:auto;}
.mebook-root .sr-chip{padding:7px 16px;border-radius:18px;font-size:14px;font-weight:600;background:var(--input-bg);color:var(--text);white-space:nowrap;}
.mebook-root .sr-chip.on{background:var(--green);color:#fff;}
.mebook-root .sr-body{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding-bottom:calc(24px + env(safe-area-inset-bottom,0px));}
.mebook-root .sr-row{display:flex;align-items:center;gap:12px;padding:8px 8px 8px 14px;cursor:pointer;transition:background .12s;}
.mebook-root .sr-row:hover{background:var(--hover);}
.mebook-root .sr-av{width:48px;height:48px;border-radius:50%;object-fit:cover;flex-shrink:0;background:var(--input-bg);}
.mebook-root .sr-av.sm{width:40px;height:40px;}
.mebook-root .sr-av-ico{width:48px;height:48px;border-radius:50%;background:var(--input-bg);color:var(--text);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.mebook-root .sr-av-ico svg{width:24px;height:24px;fill:currentColor;}
.mebook-root .sr-info{flex:1;min-width:0;}
.mebook-root .sr-name{font-size:16px;font-weight:600;color:var(--text);display:flex;align-items:center;gap:5px;line-height:1.25;}
.mebook-root .sr-name span.t{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.mebook-root .sr-sub{font-size:13.5px;color:var(--text-muted);display:flex;align-items:center;gap:6px;margin-top:1px;line-height:1.3;}
.mebook-root .sr-sub .dot{width:9px;height:9px;border-radius:50%;background:#1877f2;flex-shrink:0;}
.mebook-root .sr-sub .pin{width:13px;height:13px;fill:currentColor;flex-shrink:0;}
.mebook-root .sr-more{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--text-muted);flex-shrink:0;}
.mebook-root .sr-more:hover{background:var(--hover);}
.mebook-root .sr-more svg{width:22px;height:22px;fill:currentColor;}
.mebook-root .sr-sec{display:flex;align-items:center;justify-content:space-between;padding:12px 14px 4px;font-size:15px;font-weight:700;color:var(--text);}
.mebook-root .sr-sec button{font-size:14px;font-weight:600;color:var(--green);}
.mebook-root .sr-post{display:flex;gap:12px;padding:10px 14px;cursor:pointer;transition:background .12s;}
.mebook-root .sr-post:hover{background:var(--hover);}
.mebook-root .sr-post-main{flex:1;min-width:0;}
.mebook-root .sr-post-head{display:flex;align-items:center;gap:5px;font-size:15px;font-weight:600;color:var(--text);cursor:pointer;}
.mebook-root .sr-post-head small{font-weight:400;color:var(--text-muted);font-size:12.5px;}
.mebook-root .sr-snip{font-size:14px;color:var(--text-muted);line-height:1.4;margin-top:2px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-word;}
.mebook-root .sr-snip mark{background:rgba(34,197,94,.22);color:var(--text);border-radius:3px;padding:0 1px;font-weight:600;}
.mebook-root .sr-movie{display:inline-block;margin-top:4px;font-size:12px;font-weight:600;color:var(--green);background:rgba(34,197,94,.1);padding:2px 8px;border-radius:10px;}
.mebook-root .sr-thumb{width:58px;height:58px;border-radius:10px;object-fit:cover;flex-shrink:0;align-self:center;}
.mebook-root .sr-empty{padding:48px 24px;text-align:center;color:var(--text-muted);font-size:15px;}
.mebook-root .sr-empty b{display:block;color:var(--text);font-size:17px;margin-bottom:4px;}
.mebook-root .sr-seemore{display:block;width:calc(100% - 28px);margin:8px 14px;padding:11px;border-radius:10px;background:var(--input-bg);font-size:14.5px;font-weight:600;color:var(--text);}
.mebook-root .sr-sheet-bd{position:fixed;inset:0;z-index:1400;background:rgba(0,0,0,.55);animation:srFade .18s ease;}
.mebook-root .sr-sheet{position:fixed;left:0;right:0;bottom:0;z-index:1401;background:var(--card);border-radius:18px 18px 0 0;padding:8px 0 calc(16px + env(safe-area-inset-bottom,0px));animation:srUp .22s cubic-bezier(.2,.8,.3,1);max-width:640px;margin:0 auto;}
.mebook-root .sr-grab{width:44px;height:5px;border-radius:3px;background:rgba(128,128,128,.5);margin:4px auto 14px;}
.mebook-root .sr-sheet-head{display:flex;align-items:center;gap:14px;padding:6px 18px 14px;border-bottom:1px solid var(--border);margin-bottom:6px;}
.mebook-root .sr-sheet-head .sr-av,.mebook-root .sr-sheet-head .sr-av-ico{width:56px;height:56px;}
.mebook-root .sr-opt{display:flex;align-items:center;gap:16px;width:100%;text-align:left;padding:10px 18px;}
.mebook-root .sr-opt:hover{background:var(--hover);}
.mebook-root .sr-opt:disabled{opacity:.5;cursor:not-allowed;}
.mebook-root .sr-opt-ico{width:50px;height:50px;border-radius:50%;background:var(--input-bg);color:var(--text);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.mebook-root .sr-opt-ico svg{width:24px;height:24px;fill:currentColor;}
.mebook-root .sr-opt b{display:block;font-size:15px;font-weight:600;color:var(--text);}
.mebook-root .sr-opt small{display:block;font-size:14px;color:var(--text-muted);margin-top:1px;}
@keyframes srFade{from{opacity:0}to{opacity:1}}
@keyframes srUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
.mebook-root .fbp{--fbp-bg:#ffffff;--fbp-chip:#e4e6eb;--fbp-sub:#65676b;background:var(--fbp-bg);color:var(--text);border-radius:14px;overflow:hidden;box-shadow:var(--shadow);}
.mebook-root.dark-mode .fbp{--fbp-bg:#0a0a0a;--fbp-chip:#1f1f1f;--fbp-sub:#9a9a9a;border:1px solid #151515;}
.mebook-root .fbp-cover{position:relative;height:210px;background:#111;overflow:hidden;cursor:pointer;}
.mebook-root .fbp-cover img{width:100%;height:100%;object-fit:cover;display:block;}
.mebook-root .fbp-cover-ph{width:100%;height:100%;background:linear-gradient(135deg,#0f172a,#1e293b 60%,#14532d);}
.mebook-root .fbp-top{position:relative;z-index:6;height:62px;margin-bottom:-62px;display:flex;align-items:center;gap:4px;padding:10px;background:linear-gradient(rgba(0,0,0,.55),transparent);transition:background .2s;}
.mebook-root .fbp-top-title{flex:1;min-width:0;text-align:center;font-size:16px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:0;transition:opacity .2s;}
.mebook-root .fbp-top.solid{background:var(--fbp-bg);border-bottom:1px solid var(--border);}
.mebook-root .fbp-top.solid .fbp-top-btn{color:var(--text);}
.mebook-root .fbp-top.solid .fbp-top-title{opacity:1;}
.mebook-root .fbp-top:not(.solid) .fbp-top-title{pointer-events:none;}
.mebook-root .fbp-top-right{display:flex;gap:2px;flex-shrink:0;}
.mebook-root .fbp-top-btn{width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;background:transparent;border:none;cursor:pointer;}
.mebook-root .fbp-top-btn:active{background:rgba(255,255,255,.2);}
.mebook-root .fbp-body{position:relative;margin-top:-26px;background:var(--fbp-bg);border-radius:26px 26px 0 0;padding:0 14px 14px;text-align:center;}
.mebook-root .fbp-av-wrap{position:relative;width:150px;margin:-96px auto 0;}
.mebook-root .fbp-av{width:150px;height:150px;border-radius:50%;object-fit:cover;border:4px solid var(--fbp-chip);position:relative;cursor:pointer;background:#222;display:block;}
.mebook-root .fbp-cam{position:absolute;display:flex;align-items:center;justify-content:center;border:none;cursor:pointer;color:#fff;}
.mebook-root .fbp-cam-av{right:2px;bottom:6px;width:38px;height:38px;border-radius:50%;background:#2a2a2a;border:2px solid var(--fbp-bg);}
.mebook-root .fbp-cam svg{display:block;width:22px;height:22px;fill:currentColor;flex:none;}
.mebook-root .fbp-cam-cover{z-index:4;right:14px;bottom:42px;width:44px;height:44px;border-radius:50%;background:rgba(0,0,0,.6);color:#fff;border:2px solid rgba(255,255,255,.85);box-shadow:0 2px 8px rgba(0,0,0,.4);}
.mebook-root .fbp-status{display:inline-block;margin-top:8px;padding:5px 14px;border-radius:16px;background:var(--fbp-chip);font-size:13.5px;font-weight:600;}
.mebook-root .fbp-btn-action{width:100%;margin-bottom:12px;}
.mebook-root .fbp-pen{background:none;border:none;color:var(--fbp-sub);cursor:pointer;padding:4px;}
.mebook-root .fbp-viewas{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 14px;margin-bottom:10px;border-radius:12px;background:rgba(8,102,255,.16);color:#2d88ff;font-weight:600;font-size:14px;}
.mebook-root .fbp-viewas button{background:#0866ff;color:#fff;border:none;border-radius:10px;padding:7px 16px;font-weight:700;cursor:pointer;}
.mebook-root .fbp-name{display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:nowrap;font-size:22px;font-weight:800;margin-top:10px;line-height:1.2;}
.mebook-root .fbp-name span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.mebook-root .fbp-name .fbp-tick{display:block;flex:none;}
.mebook-root .fbp-stats{font-size:14.5px;color:var(--fbp-sub);margin-top:4px;}
.mebook-root .fbp-stats b{color:var(--text);}
.mebook-root .fbp-bio{margin:14px 6px 4px;font-size:15.5px;line-height:1.45;}
.mebook-root .fbp-actions{display:flex;gap:10px;margin:16px 0 14px;}
.mebook-root .fbp-btn{height:46px;border-radius:12px;background:var(--fbp-chip);color:var(--text);font-weight:700;font-size:15.5px;display:flex;align-items:center;justify-content:center;gap:8px;border:none;cursor:pointer;transition:transform .1s,filter .15s;}
.mebook-root .fbp-btn:active{transform:scale(.97);}
.mebook-root .fbp-btn:disabled{opacity:.6;}
.mebook-root .fbp-btn-friends{flex:1;}
.mebook-root .fbp-btn-msg{flex:1.3;background:#0866ff;color:#fff;}
.mebook-root .fbp-btn-poke{flex:.6;}
.mebook-root .fbp-tabs{display:flex;gap:6px;margin:4px 0 8px;}
.mebook-root .fbp-tab{padding:10px 20px;border-radius:24px;font-weight:700;font-size:15.5px;color:var(--fbp-sub);background:transparent;border:none;cursor:pointer;}
.mebook-root .fbp-tab.active{background:rgba(8,102,255,.16);color:#2d88ff;}
.mebook-root .fbp-left{text-align:left;}
.mebook-root .fbp-sec-title{font-size:17px;font-weight:800;margin:18px 0 8px;}
.mebook-root .fbp-sec-head{display:flex;align-items:center;justify-content:space-between;margin:22px 0 10px;}
.mebook-root .fbp-seeall{color:#2d88ff;font-weight:600;font-size:16px;cursor:pointer;}
.mebook-root .fbp-row{display:flex;align-items:center;gap:14px;padding:9px 8px;font-size:15px;}
.mebook-root .fbp-fstrip{display:flex;gap:12px;overflow-x:auto;padding-bottom:6px;}
.mebook-root .fbp-fcard{flex:0 0 84px;text-align:center;cursor:pointer;font-size:13px;}
.mebook-root .fbp-fcard img{width:84px;height:84px;border-radius:50%;object-fit:cover;display:block;margin-bottom:6px;}
.mebook-root .fbp-empty{padding:22px 8px;text-align:center;color:var(--fbp-sub);font-size:15px;}
.mebook-root .fbp-posts{padding:8px 0 0;background:var(--bg);}
.mebook-root .fbp-photos{padding:0 0 14px;}
.mebook-root .fbp-chips{display:flex;gap:10px;overflow-x:auto;padding:6px 14px 12px;}
.mebook-root .fbp-chip{padding:11px 20px;border-radius:24px;background:var(--fbp-chip);color:var(--text);white-space:nowrap;font-weight:600;font-size:15.5px;border:2px solid transparent;cursor:pointer;}
.mebook-root .fbp-chip.on{border-color:#2d88ff;color:#2d88ff;}
.mebook-root .fbp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:3px;}
.mebook-root .fbp-gi{aspect-ratio:1/1;overflow:hidden;background:#111;cursor:pointer;}
.mebook-root .fbp-gi.big{grid-column:span 2;grid-row:span 2;}
.mebook-root .fbp-gi img{width:100%;height:100%;object-fit:cover;display:block;}
.mebook-root .fbp-albums{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;padding:4px 14px;}
.mebook-root .fbp-album{cursor:pointer;}
.mebook-root .fbp-album-th{aspect-ratio:1/1;border-radius:12px;background:var(--fbp-chip);overflow:hidden;margin-bottom:6px;}
.mebook-root .fbp-album-th img{width:100%;height:100%;object-fit:cover;display:block;}
.mebook-root .fbp-album b{display:block;font-size:15px;}
.mebook-root .fbp-album small{color:var(--fbp-sub);font-size:13px;}
.mebook-root .fbp-menu-head{display:flex;align-items:center;gap:6px;padding:10px 8px;border-bottom:1px solid var(--border);}
.mebook-root .fbp-menu-back{width:42px;height:42px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:none;border:none;color:var(--text);cursor:pointer;}
.mebook-root .fbp-menu-title{flex:1;text-align:center;font-size:17px;font-weight:700;padding-right:42px;}
.mebook-root .fbp-mi{display:flex;align-items:center;gap:14px;width:100%;text-align:left;padding:12px 16px;border:none;border-bottom:1px solid var(--border);background:none;color:var(--text);font-size:15px;font-weight:500;cursor:pointer;}
.mebook-root .fbp-mi:active{background:var(--hover);}
.mebook-root .fbp-mi.blue{color:#2d88ff;}
.mebook-root .fbp-linkcard{padding:20px 16px 22px;border-top:10px solid var(--bg);}
.mebook-root .fbp-link-title{font-size:19px;font-weight:800;}
.mebook-root .fbp-link-sub{color:var(--fbp-sub);font-size:16px;margin:4px 0 16px;padding-bottom:16px;border-bottom:1px solid var(--border);}
.mebook-root .fbp-link-url{font-size:16px;font-weight:600;word-break:break-all;margin-bottom:16px;}
.mebook-root .fbp-copy{width:100%;height:50px;border-radius:12px;background:var(--fbp-chip);color:var(--text);font-weight:700;font-size:16px;border:none;cursor:pointer;}
.mebook-root .fbp-sheet-bg{position:fixed;inset:0;z-index:3000;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center;animation:srFade .2s ease;}
.mebook-root .fbp-sheet{--fbp-bg:#ffffff;--fbp-chip:#e4e6eb;--fbp-sub:#65676b;width:100%;max-width:640px;background:var(--fbp-bg);color:var(--text);border-radius:22px 22px 0 0;padding:10px 16px calc(22px + env(safe-area-inset-bottom,0px));animation:srUp .25s ease;max-height:86vh;overflow-y:auto;}
.mebook-root.dark-mode .fbp-sheet{--fbp-bg:#0f0f0f;--fbp-chip:#1f1f1f;--fbp-sub:#9a9a9a;border-top:1px solid #1a1a1a;}
.mebook-root .fbp-sheet-handle{width:56px;height:5px;border-radius:3px;background:var(--fbp-chip);margin:2px auto 14px;}
.mebook-root .fbp-sheet-title{font-size:17px;font-weight:800;margin:4px 0 12px;}
.mebook-root .fbp-srow{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:8px 4px;background:none;border:none;color:var(--text);cursor:pointer;border-radius:12px;}
.mebook-root .fbp-srow:active{background:var(--hover);}
.mebook-root .fbp-srow.danger b{color:#ef4444;}
.mebook-root .fbp-srow-ico{width:40px;height:40px;border-radius:50%;background:var(--fbp-chip);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.mebook-root .fbp-srow-txt{flex:1;display:block;}
.mebook-root .fbp-srow-txt b{display:block;font-size:15px;font-weight:700;}
.mebook-root .fbp-srow-txt small{display:block;font-size:12.5px;color:var(--fbp-sub);margin-top:1px;}
.mebook-root .fbp-check{width:26px;height:26px;border-radius:50%;border:2px solid var(--fbp-sub);display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0;}
.mebook-root .fbp-check.on{background:#0866ff;border-color:#0866ff;}
.mebook-root .fbp-save{width:100%;height:42px;margin-top:10px;border-radius:8px;background:#0866ff;color:#fff;font-weight:600;font-size:15px;border:none;cursor:pointer;}
.mebook-root .fbp-save.secondary{background:var(--fbp-chip);color:var(--text);}
.mebook-root .fbp-info-avs{display:flex;justify-content:center;gap:-10px;margin:6px 0 10px;}
.mebook-root .fbp-info-avs img{width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid var(--fbp-bg);margin:0 -6px;}
.mebook-root .fbp-info-sub{text-align:center;color:var(--fbp-sub);font-size:15px;margin-bottom:8px;}
.mebook-root .fbp-info-line{text-align:center;font-size:15px;padding:4px 0;}

@media(max-width:820px){
.mebook-root.fbp-full .mb-header,.mebook-root.fbp-full .mb-navbar{display:none !important;}
.mebook-root.fbp-full .mb-layout{padding:0 0 24px;}
.mebook-root.fbp-full .mb-view .mb-profile-actions{padding-left:14px;padding-right:14px;}
.mebook-root .fbp{border-radius:0;overflow:visible;border:none;box-shadow:none;}
.mebook-root .fbp-prof{display:contents;}
.mebook-root.fbp-full .mb-view > :not(.fbp-prof){position:relative;z-index:2;}
.mebook-root.fbp-full .mb-view > div:not(.fbp-prof):not(.fbp-viewas):not(.mb-card){background:var(--bg);}
.mebook-root .fbp-top{position:sticky;top:0;}
.mebook-root .fbp-cover{position:sticky;top:0;z-index:0;border-radius:0;}
.mebook-root .fbp > :not(.fbp-cover):not(.fbp-top){position:relative;z-index:2;}
.mebook-root .fbp-photos{background:var(--fbp-bg);padding-top:4px;}
.mebook-root .fbp-posts{padding:8px 10px 0;}
.mebook-root .fbp-viewas{margin:8px 10px;}
}

/* ===================== STORIES ===================== */
.mebook-root .st-bar{display:flex;gap:8px;overflow-x:auto;padding:2px 2px 6px;margin:0 0 14px;scrollbar-width:none;-webkit-overflow-scrolling:touch;}
.mebook-root .st-bar::-webkit-scrollbar{display:none;}
.mebook-root .st-card{position:relative;flex:0 0 auto;width:108px;height:192px;border-radius:12px;overflow:hidden;cursor:pointer;background:#222;box-shadow:var(--shadow);transition:transform .15s;-webkit-tap-highlight-color:transparent;}
.mebook-root .st-card:active{transform:scale(.97);}
.mebook-root .st-card-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
.mebook-root .st-card-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.3) 0,transparent 32%,transparent 56%,rgba(0,0,0,.65) 100%);}
.mebook-root .st-ring{position:absolute;top:8px;left:8px;width:38px;height:38px;border-radius:50%;object-fit:cover;border:3px solid #8a8d91;background:#333;box-sizing:border-box;}
.mebook-root .st-ring.new{border-color:#0866ff;}
.mebook-root .st-card-name{position:absolute;left:8px;right:8px;bottom:8px;color:#fff;font-size:13px;font-weight:700;line-height:1.2;text-shadow:0 1px 3px rgba(0,0,0,.7);overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;}
.mebook-root .st-create{background:var(--card);border:1px solid var(--border);}
.mebook-root .st-create-img{position:absolute;left:0;right:0;top:0;height:72%;background-size:cover;background-position:center;background-color:#333;}
.mebook-root .st-create-foot{position:absolute;left:0;right:0;bottom:0;height:28%;background:var(--card);display:flex;align-items:flex-end;justify-content:center;padding-bottom:9px;font-size:13px;font-weight:700;color:var(--text);}
.mebook-root .st-plus{position:absolute;left:50%;top:72%;transform:translate(-50%,-50%);width:38px;height:38px;border-radius:50%;background:#0866ff;color:#fff;border:3px solid var(--card);display:flex;align-items:center;justify-content:center;}

/* layers */
.mebook-root .st-layer{position:fixed;inset:0;z-index:10002;background:#000;color:#fff;display:flex;flex-direction:column;font-family:inherit;animation:stFade .18s ease;}
@keyframes stFade{from{opacity:0}to{opacity:1}}
.mebook-root .st-col{flex:1;min-height:0;display:flex;flex-direction:column;}
.mebook-root .st-stagewrap{flex:1;min-height:0;container-type:size;display:flex;align-items:center;justify-content:center;}
.mebook-root .st-frame{position:relative;width:min(100cqw,56.25cqh);height:min(100cqh,177.78cqw);flex:0 0 auto;}
.mebook-root .st-stage{position:absolute;inset:0;overflow:hidden;background:#000;container-type:inline-size;}
@media(min-width:700px){.mebook-root .st-stage{border-radius:14px;}}
.mebook-root .st-bgblur{position:absolute;inset:-20px;background-size:cover;background-position:center;filter:blur(26px) brightness(.55);transform:scale(1.1);}
.mebook-root .st-img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;user-select:none;-webkit-user-drag:none;pointer-events:none;}

/* overlays on the photo */
.mebook-root .st-ov{position:absolute;max-width:86%;text-align:center;white-space:pre-wrap;word-break:break-word;user-select:none;-webkit-user-select:none;touch-action:none;line-height:1.15;}
.mebook-root .st-ov.edit{cursor:grab;outline:1px dashed rgba(255,255,255,.35);outline-offset:4px;}
.mebook-root .st-ov-text{font-size:7.4cqw;font-weight:800;padding:.1em .35em;border-radius:.3em;text-shadow:0 1px 6px rgba(0,0,0,.45);}
.mebook-root .st-ov-sticker{font-size:20cqw;}
.mebook-root .st-ov-mention{font-size:5cqw;font-weight:800;padding:.25em .7em;border-radius:.5em;background:#fff;color:#0866ff;box-shadow:0 2px 10px rgba(0,0,0,.35);cursor:pointer;}

/* creator */
.mebook-root .st-top{position:absolute;left:0;right:0;top:0;z-index:5;display:flex;align-items:center;gap:8px;padding:calc(10px + env(safe-area-inset-top,0px)) 10px 22px;background:linear-gradient(rgba(0,0,0,.55),transparent);}
.mebook-root .st-ibtn{width:40px;height:40px;border-radius:50%;border:none;background:transparent;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;flex:0 0 auto;-webkit-tap-highlight-color:transparent;}
.mebook-root .st-ibtn:active{background:rgba(255,255,255,.15);}
.mebook-root .st-musicpill{flex:1;min-width:0;display:flex;align-items:center;gap:8px;background:#5b1119;border-radius:999px;padding:5px 6px 5px 6px;}
.mebook-root .st-musicpill img,.mebook-root .st-musicpill .st-mcover{width:34px;height:34px;border-radius:50%;object-fit:cover;background:#2a2a2a;display:flex;align-items:center;justify-content:center;flex:0 0 auto;}
.mebook-root .st-mtxt{flex:1;min-width:0;line-height:1.15;}
.mebook-root .st-mtxt b,.mebook-root .st-mtxt span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.mebook-root .st-mtxt b{font-size:13px;font-weight:800;}
.mebook-root .st-mtxt span{font-size:12px;opacity:.8;}
.mebook-root .st-tools{position:absolute;left:0;right:0;bottom:10px;z-index:5;display:flex;gap:10px;overflow-x:auto;padding:0 12px;scrollbar-width:none;}
.mebook-root .st-tools::-webkit-scrollbar{display:none;}
.mebook-root .st-tool{flex:0 0 auto;width:62px;display:flex;flex-direction:column;align-items:center;gap:5px;background:none;border:none;color:#fff;font-size:12px;cursor:pointer;text-shadow:0 1px 3px rgba(0,0,0,.8);}
.mebook-root .st-tool i{font-style:normal;width:54px;height:54px;border-radius:50%;background:rgba(40,40,40,.8);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:19px;border:2px solid transparent;}
.mebook-root .st-tool.on i{border-color:#22c55e;}
.mebook-root .st-foot{flex:0 0 auto;display:flex;align-items:center;gap:8px;padding:10px 12px calc(12px + env(safe-area-inset-bottom,0px));background:#000;}
.mebook-root .st-chip{display:inline-flex;align-items:center;gap:8px;height:42px;padding:0 16px;border-radius:999px;background:#2a2b2d;color:#fff;border:none;font-size:15px;font-weight:700;cursor:pointer;}
.mebook-root .st-share{margin-left:auto;height:46px;padding:0 34px;border-radius:12px;border:none;background:#0866ff;color:#fff;font-size:16px;font-weight:800;cursor:pointer;}
.mebook-root .st-share:disabled{opacity:.6;}
.mebook-root .st-trash{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);z-index:6;width:54px;height:54px;border-radius:50%;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;transition:transform .15s,background .15s;}
.mebook-root .st-trash.over{background:#ef4444;transform:translateX(-50%) scale(1.25);}
.mebook-root .st-fx{position:absolute;left:0;right:0;bottom:96px;z-index:5;display:flex;gap:10px;overflow-x:auto;padding:0 12px;scrollbar-width:none;}
.mebook-root .st-fx::-webkit-scrollbar{display:none;}
.mebook-root .st-fxi{flex:0 0 auto;width:62px;text-align:center;color:#fff;font-size:12px;cursor:pointer;background:none;border:none;text-shadow:0 1px 3px rgba(0,0,0,.8);}
.mebook-root .st-fxi div{width:62px;height:62px;border-radius:12px;background-size:cover;background-position:center;border:2px solid transparent;margin-bottom:4px;}
.mebook-root .st-fxi.on div{border-color:#22c55e;}
.mebook-root .st-busy{position:absolute;inset:0;z-index:20;background:rgba(0,0,0,.65);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;font-weight:800;font-size:16px;}
.mebook-root .st-bar-p{width:60%;height:6px;border-radius:3px;background:rgba(255,255,255,.25);overflow:hidden;}
.mebook-root .st-bar-p i{display:block;height:100%;background:#22c55e;transition:width .2s;}

/* text editor */
.mebook-root .st-textedit{position:fixed;inset:0;z-index:10005;background:rgba(0,0,0,.84);display:flex;flex-direction:column;align-items:center;padding:calc(12px + env(safe-area-inset-top,0px)) 14px calc(14px + env(safe-area-inset-bottom,0px));}
.mebook-root .st-te-top{width:100%;max-width:520px;display:flex;justify-content:space-between;align-items:center;}
.mebook-root .st-te-top button{background:none;border:none;color:#fff;font-size:17px;font-weight:800;padding:8px 14px;cursor:pointer;}
.mebook-root .st-te-area{flex:1;width:100%;max-width:520px;display:flex;align-items:center;justify-content:center;}
.mebook-root .st-te-area textarea{width:100%;border:none;outline:none;resize:none;text-align:center;font-size:30px;font-weight:800;font-family:inherit;border-radius:12px;padding:8px 12px;max-height:50vh;}
.mebook-root .st-te-area textarea::placeholder{color:rgba(255,255,255,.5);}
.mebook-root .st-te-colors{display:flex;gap:10px;overflow-x:auto;padding:10px 4px;max-width:100%;}
.mebook-root .st-te-colors button{flex:0 0 auto;width:32px;height:32px;border-radius:50%;border:3px solid #fff;cursor:pointer;opacity:.9;}
.mebook-root .st-te-colors button.on{transform:scale(1.2);opacity:1;border-color:#22c55e;}

/* viewer */
.mebook-root .st-progress{position:absolute;left:10px;right:10px;top:calc(8px + env(safe-area-inset-top,0px));z-index:6;display:flex;gap:4px;pointer-events:none;}
.mebook-root .st-seg{flex:1;height:3px;border-radius:2px;background:rgba(255,255,255,.35);overflow:hidden;}
.mebook-root .st-seg i{display:block;height:100%;background:#fff;}
.mebook-root .st-vhead{position:absolute;left:0;right:0;top:calc(14px + env(safe-area-inset-top,0px));z-index:5;display:flex;align-items:center;gap:8px;padding:8px 6px 26px 12px;background:linear-gradient(rgba(0,0,0,.5),transparent);}
.mebook-root .st-vav{width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid #fff;cursor:pointer;background:#333;flex:0 0 auto;}
.mebook-root .st-vname{flex:1;min-width:0;font-weight:800;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 3px rgba(0,0,0,.6);}
.mebook-root .st-vtime{font-size:13px;opacity:.88;margin-left:8px;font-weight:500;}
.mebook-root .st-vmusic{position:absolute;left:12px;top:calc(80px + env(safe-area-inset-top,0px));z-index:5;display:inline-flex;align-items:center;gap:8px;background:#fff;color:#111;border-radius:999px;padding:7px 12px;font-size:14px;max-width:72%;}
.mebook-root .st-vmusic span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.mebook-root .st-vmusic button{background:none;border:none;color:#0866ff;font-weight:800;font-size:14px;cursor:pointer;flex:0 0 auto;padding:0;}
.mebook-root .st-aipill{position:absolute;right:12px;top:calc(84px + env(safe-area-inset-top,0px));z-index:5;background:rgba(0,0,0,.55);border-radius:999px;padding:5px 10px;font-size:12px;font-weight:700;}
.mebook-root .st-vfoot{flex:0 0 auto;display:flex;align-items:center;gap:8px;padding:10px 10px calc(10px + env(safe-area-inset-bottom,0px));background:#18191a;border-top:1px solid #2a2b2d;}
.mebook-root .st-rbtn{width:46px;height:46px;border-radius:50%;border:none;background:#3a3b3c;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;flex:0 0 auto;}
.mebook-root .st-input{flex:1;min-width:0;height:46px;border-radius:999px;border:none;outline:none;background:#3a3b3c;color:#fff;padding:0 18px;font-size:16px;font-family:inherit;}
.mebook-root .st-input::placeholder{color:#b0b3b8;}
.mebook-root .st-rx{width:46px;height:46px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex:0 0 auto;color:#fff;transition:transform .12s;-webkit-tap-highlight-color:transparent;}
.mebook-root .st-rx:active{transform:scale(.86);}
.mebook-root .st-rx.love{background:#f33e58;}
.mebook-root .st-rx.like{background:#0866ff;}
.mebook-root .st-rx.gem{background:#3a3b3c;}
.mebook-root .st-rx.on{box-shadow:0 0 0 3px rgba(255,255,255,.92);}
.mebook-root .st-viewbtn{display:flex;flex-direction:column;align-items:center;gap:0;background:none;border:none;color:#fff;font-size:15px;font-weight:700;cursor:pointer;padding:0 6px;}
.mebook-root .st-act{display:flex;flex-direction:column;align-items:center;gap:3px;background:none;border:none;color:#fff;font-size:13px;cursor:pointer;min-width:62px;}
.mebook-root .st-flash{position:absolute;left:50%;top:48%;z-index:7;font-size:84px;pointer-events:none;animation:stFlash .95s ease-out forwards;transform:translate(-50%,-50%);}
@keyframes stFlash{0%{transform:translate(-50%,-30%) scale(.4);opacity:0}25%{transform:translate(-50%,-60%) scale(1.15);opacity:1}100%{transform:translate(-50%,-160%) scale(1);opacity:0}}

/* sheets / rows */
.mebook-root .st-sheet-bg{position:fixed;inset:0;z-index:10004;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center;animation:stFade .15s ease;}
.mebook-root .st-sheet{width:100%;max-width:560px;max-height:84vh;overflow-y:auto;background:#242526;color:#e4e6eb;border-radius:18px 18px 0 0;padding:8px 12px calc(14px + env(safe-area-inset-bottom,0px));animation:stUp .22s cubic-bezier(.2,.8,.2,1);}
.mebook-root .st-sheet.tall{height:80vh;display:flex;flex-direction:column;overflow:hidden;}
@keyframes stUp{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}
.mebook-root .st-sheet-handle{width:44px;height:5px;border-radius:3px;background:#5a5c60;margin:2px auto 10px;flex:0 0 auto;}
.mebook-root .st-sheet-title{font-size:17px;font-weight:800;text-align:center;margin-bottom:10px;flex:0 0 auto;}
.mebook-root .st-group{background:#313233;border-radius:14px;padding:4px 0;margin-bottom:10px;flex:0 0 auto;}
.mebook-root .st-row{width:100%;display:flex;align-items:center;gap:14px;padding:12px 14px;background:none;border:none;color:#e4e6eb;text-align:left;cursor:pointer;font-size:16px;font-weight:700;font-family:inherit;}
.mebook-root .st-row small{display:block;font-weight:500;font-size:14px;color:#a8abaf;margin-top:2px;line-height:1.3;}
.mebook-root .st-row:active{background:rgba(255,255,255,.06);}
.mebook-root .st-row.danger{color:#ff6b6b;}
.mebook-root .st-user{display:flex;align-items:center;gap:12px;padding:8px 6px;}
.mebook-root .st-user img{width:46px;height:46px;border-radius:50%;object-fit:cover;background:#333;flex:0 0 auto;}
.mebook-root .st-un{flex:1;min-width:0;font-size:16px;font-weight:700;}
.mebook-root .st-un small{display:block;font-size:13px;color:#a8abaf;font-weight:500;}
.mebook-root .st-sbtn{background:#0866ff;color:#fff;border:none;border-radius:8px;padding:8px 16px;font-weight:700;font-size:14px;cursor:pointer;font-family:inherit;}
.mebook-root .st-sbtn.ghost{background:#3a3b3c;color:#e4e6eb;}
.mebook-root .st-sbtn:disabled{opacity:.7;cursor:default;}
.mebook-root .st-search{width:100%;box-sizing:border-box;height:42px;border-radius:999px;border:none;outline:none;background:#3a3b3c;color:#fff;padding:0 16px;font-size:15px;margin-bottom:10px;font-family:inherit;flex:0 0 auto;}
.mebook-root .st-search::placeholder{color:#b0b3b8;}
.mebook-root .st-chips{display:flex;gap:8px;overflow-x:auto;padding:0 0 10px;scrollbar-width:none;flex:0 0 auto;}
.mebook-root .st-chips::-webkit-scrollbar{display:none;}
.mebook-root .st-chipb{flex:0 0 auto;padding:8px 14px;border-radius:999px;background:#3a3b3c;color:#e4e6eb;border:none;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;}
.mebook-root .st-chipb.on{background:#16a34a;color:#fff;}
.mebook-root .st-musicscroll{flex:1;min-height:0;overflow-y:auto;}
.mebook-root .st-trk{display:flex;align-items:center;gap:12px;padding:8px 4px;cursor:pointer;border-radius:10px;}
.mebook-root .st-trk:active{background:rgba(255,255,255,.07);}
.mebook-root .st-trk img,.mebook-root .st-nocov{width:48px;height:48px;border-radius:8px;object-fit:cover;background:#3a3b3c;flex:0 0 auto;}
.mebook-root .st-tt{flex:1;min-width:0;}
.mebook-root .st-tt b{display:block;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.mebook-root .st-tt span{display:block;font-size:13px;color:#a8abaf;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.mebook-root .st-empty{padding:26px 10px;text-align:center;color:#a8abaf;font-size:14px;}
.mebook-root .st-emojis{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;max-height:50vh;overflow-y:auto;padding-bottom:6px;}
.mebook-root .st-emojis button{background:none;border:none;font-size:30px;padding:6px 0;cursor:pointer;border-radius:10px;}
.mebook-root .st-emojis button:active{background:rgba(255,255,255,.1);}
.mebook-root .st-dialog-bg{position:fixed;inset:0;z-index:10006;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:20px;animation:stFade .15s ease;}
.mebook-root .st-dialog{width:min(88vw,340px);background:#242526;color:#e4e6eb;border-radius:18px;padding:22px 18px 16px;text-align:center;}
.mebook-root .st-dialog b{font-size:18px;display:block;margin-bottom:6px;}
.mebook-root .st-dialog p{font-size:14px;color:#a8abaf;margin:0 0 16px;line-height:1.4;}
.mebook-root .st-dialog div{display:flex;gap:10px;justify-content:center;}
.mebook-root .st-dialog .st-sbtn{flex:1;padding:11px 10px;font-size:15px;}

/* viewers page */
.mebook-root .st-vpage{position:fixed;inset:0;z-index:10003;background:#18191a;color:#e4e6eb;overflow-y:auto;animation:stFade .15s ease;}
.mebook-root .st-vp-in{max-width:560px;margin:0 auto;padding:0 14px 30px;}
.mebook-root .st-vp-top{display:flex;justify-content:space-between;align-items:center;padding:calc(14px + env(safe-area-inset-top,0px)) 0 8px;}
.mebook-root .st-vp-top .gap{display:flex;gap:10px;}
.mebook-root .st-vp-thumb{position:relative;width:min(62vw,250px);aspect-ratio:9/16;border-radius:18px;overflow:hidden;margin:8px auto 14px;background:#000;}
.mebook-root .st-vp-thumb .st-stage{border-radius:18px;}
.mebook-root .st-info{position:relative;background:#2b2c2e;border-radius:14px;padding:14px 48px 14px 16px;margin-bottom:12px;}
.mebook-root .st-info b{display:block;font-size:20px;line-height:1.2;margin-bottom:6px;}
.mebook-root .st-info p{margin:0;font-size:16px;color:#c3c6cb;line-height:1.35;}
.mebook-root .st-info-x{position:absolute;right:10px;top:50%;transform:translateY(-50%);width:40px;height:40px;border-radius:50%;border:none;background:#3a3b3c;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;}
.mebook-root .st-stats{display:flex;justify-content:center;gap:34px;padding:12px 0;border-bottom:1px solid #2f3032;font-weight:700;font-size:17px;}
.mebook-root .st-stats span{display:inline-flex;align-items:center;gap:8px;}
.mebook-root .st-tabs{display:flex;align-items:center;gap:8px;padding:12px 0;border-bottom:1px solid #2f3032;margin-bottom:12px;}
.mebook-root .st-tab{padding:12px 22px;border-radius:999px;border:none;background:none;color:#e4e6eb;font-size:18px;font-weight:700;cursor:pointer;font-family:inherit;}
.mebook-root .st-tab.on{background:#263951;color:#6aa8ff;}
.mebook-root .st-insights{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:6px;}
.mebook-root .st-insights div{background:#2b2c2e;border-radius:14px;padding:14px;}
.mebook-root .st-insights b{display:block;font-size:24px;margin-bottom:2px;}
.mebook-root .st-insights span{font-size:13px;color:#a8abaf;}
.mebook-root .st-next{background:#2b2c2e;border-radius:16px;padding:18px;margin-top:16px;}
.mebook-root .st-next b{font-size:20px;}
.mebook-root .st-next p{margin:6px 0 0;font-size:15px;color:#c3c6cb;line-height:1.35;}
.mebook-root .st-nextbtn{width:100%;margin-top:14px;height:48px;border-radius:10px;border:none;background:#263951;color:#6aa8ff;font-weight:800;font-size:17px;cursor:pointer;font-family:inherit;}
.mebook-root .st-agrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}
.mebook-root .st-athumb{position:relative;aspect-ratio:9/16;border-radius:10px;overflow:hidden;background:#000;}
.mebook-root .st-athumb .st-stage{border-radius:10px;}
.mebook-root .st-abtns{display:flex;gap:6px;margin-top:6px;}
.mebook-root .st-abtns button{flex:1;border:none;border-radius:8px;background:#3a3b3c;color:#e4e6eb;font-size:13px;font-weight:700;padding:7px 0;cursor:pointer;font-family:inherit;}
@media(max-width:480px){.mebook-root .st-card{width:104px;height:186px;}}

/* ===================== MINI COMPOSER + NEW POST ===================== */
.mebook-root .mb-mini{display:flex;align-items:center;gap:10px;padding:10px 12px;margin-bottom:10px;background:var(--card);border-radius:12px;box-shadow:var(--shadow);}
.mebook-root .mb-mini-av{width:40px;height:40px;border-radius:50%;object-fit:cover;cursor:pointer;flex:0 0 auto;background:#cbd5e1;}
.mebook-root .mb-mini-input{flex:1;min-width:0;height:40px;border-radius:999px;border:1px solid var(--border);background:transparent;color:var(--text);text-align:left;padding:0 16px;font-size:15px;cursor:pointer;}
.mebook-root .mb-mini-ph{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex:0 0 auto;color:#22c55e;background:none;border:none;cursor:pointer;}
.mebook-root.dark-mode .mb-mini{background:#0a0a0a;border:1px solid #151515;}
.mebook-root.dark-mode .mb-mini-input{border-color:#2a2b2d;}

.mebook-root .cp2{position:fixed;inset:0;z-index:10001;background:#000;color:#fff;display:flex;flex-direction:column;font-family:inherit;}
.mebook-root .cp2-top{flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:calc(10px + env(safe-area-inset-top,0px)) 12px 10px;}
.mebook-root .cp2-top b{font-size:18px;font-weight:800;}
.mebook-root .cp2-x{width:44px;height:44px;border-radius:50%;background:none;border:none;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;}
.mebook-root .cp2-next{min-width:84px;height:44px;border-radius:12px;border:none;background:#0866ff;color:#fff;font-size:16px;font-weight:800;padding:0 20px;cursor:pointer;font-family:inherit;}
.mebook-root .cp2-next:disabled{background:#2a2b2d;color:#6b6e72;cursor:default;}
.mebook-root .cp2-body{flex:1;min-height:0;overflow-y:auto;padding:6px 14px 14px;}
.mebook-root .cp2-user{display:flex;align-items:center;gap:12px;margin-bottom:14px;}
.mebook-root .cp2-user img{width:56px;height:56px;border-radius:50%;object-fit:cover;background:#333;flex:0 0 auto;}
.mebook-root .cp2-user div{font-size:16px;line-height:1.35;min-width:0;}
.mebook-root .cp2-user div b{font-size:19px;font-weight:700;}
.mebook-root .cp2-user div span{color:#c3c6cb;}
.mebook-root .cp2-chips{display:flex;gap:10px;overflow-x:auto;padding-bottom:12px;scrollbar-width:none;}
.mebook-root .cp2-chips::-webkit-scrollbar{display:none;}
.mebook-root .cp2-chip{flex:0 0 auto;display:inline-flex;align-items:center;gap:8px;height:46px;padding:0 18px;border-radius:999px;background:#242526;color:#fff;border:1px solid transparent;font-size:16px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;}
.mebook-root .cp2-chip.on{border-color:#22c55e;}
.mebook-root .cp2-text{width:100%;min-height:200px;border:none;outline:none;resize:none;background:transparent;color:#fff;font-size:21px;line-height:1.4;padding:10px 0;font-family:inherit;}
.mebook-root .cp2-text::placeholder{color:#8a8d91;}
.mebook-root .cp2-movie{display:flex;align-items:center;gap:10px;background:#16241b;border:1px solid rgba(34,197,94,.35);border-radius:12px;padding:10px 14px;margin:8px 0;color:#22c55e;}
.mebook-root .cp2-movie input{flex:1;min-width:0;border:none;outline:none;background:transparent;color:#fff;font-size:15px;font-family:inherit;}
.mebook-root .cp2-musicline,.mebook-root .mb-view .cp2-musicline{display:flex;align-items:center;gap:8px;background:#242526;color:#e4e6eb;border-radius:999px;padding:8px 8px 8px 14px;margin:8px 0;font-size:14px;}
.mebook-root .cp2-musicline span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.mebook-root .cp2-musicline button{background:none;border:none;color:#6aa8ff;font-weight:800;font-size:14px;cursor:pointer;padding:6px 10px;font-family:inherit;}
.mebook-root .mb-post-music{padding:0 16px 8px;}
.mebook-root .cp2-preview{position:relative;border-radius:14px;overflow:hidden;margin-top:10px;background:#111;}
.mebook-root .cp2-preview img{width:100%;max-height:360px;object-fit:contain;}
.mebook-root .cp2-preview button{position:absolute;top:8px;right:8px;width:34px;height:34px;border-radius:50%;background:rgba(0,0,0,.7);border:none;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;}
.mebook-root .cp2-prog{height:6px;border-radius:3px;background:#2a2b2d;overflow:hidden;}
.mebook-root .cp2-prog i{display:block;height:100%;background:#22c55e;transition:width .3s ease;}
.mebook-root .cp2-tiles{flex:0 0 auto;display:flex;gap:12px;overflow-x:auto;padding:10px 14px 14px;scrollbar-width:none;}
.mebook-root .cp2-tiles::-webkit-scrollbar{display:none;}
.mebook-root .cp2-tiles button{flex:0 0 auto;width:86px;height:88px;border-radius:14px;background:#242526;border:none;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;}
.mebook-root .cp2-gif{display:inline-flex;align-items:center;justify-content:center;width:34px;height:30px;border:3px solid #fff;border-radius:8px;font-size:13px;font-weight:900;}
.mebook-root .cp2-foot{flex:0 0 auto;display:flex;gap:10px;padding:12px 14px calc(14px + env(safe-area-inset-bottom,0px));border-top:1px solid #1f2022;}
`

/* ============================================================
TOAST
============================================================ */

type ToastItem = {
  id: number
  title: string
  msg?: string
  type: "success" | "error" | "info"
}

function ToastStack({
  toasts,
  onDone,
}: {
  toasts: ToastItem[]
  onDone: (id: number) => void
}) {
  return (
    <div className="mb-toast-container">
      {toasts.map((t) => (
        <ToastRow key={t.id} toast={t} onDone={onDone} />
      ))}
    </div>
  )
}

function ToastRow({
  toast,
  onDone,
}: {
  toast: ToastItem
  onDone: (id: number) => void
}) {
  const [removing, setRemoving] = useState(false)
  const [dx, setDx] = useState(0)
  const [drag, setDrag] = useState(false)
  const [gone, setGone] = useState(false)
  const startXRef = useRef<number | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setRemoving(true)
      setTimeout(() => onDone(toast.id), 350)
    }, 3000)
    return () => clearTimeout(timer)
  }, [toast.id, onDone])

  // বাম/ডানে swipe করলে toast সরে যাবে
  const dismiss = (dir: number) => {
    setGone(true)
    setDrag(false)
    setDx(dir * (typeof window !== "undefined" ? window.innerWidth : 600))
    setTimeout(() => onDone(toast.id), 220)
  }

  const onPD = (e: React.PointerEvent<HTMLDivElement>) => {
    if (gone) return
    startXRef.current = e.clientX
    setDrag(true)
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch {}
  }
  const onPM = (e: React.PointerEvent<HTMLDivElement>) => {
    if (startXRef.current === null || gone) return
    setDx(e.clientX - startXRef.current)
  }
  const onPU = () => {
    if (startXRef.current === null || gone) return
    startXRef.current = null
    if (Math.abs(dx) > 70) dismiss(dx > 0 ? 1 : -1)
    else {
      setDrag(false)
      setDx(0)
    }
  }

  return (
    <div
      className={`mb-toast ${toast.type}${removing && !gone ? " removing" : ""}`}
      onPointerDown={onPD}
      onPointerMove={onPM}
      onPointerUp={onPU}
      onPointerCancel={onPU}
      style={{
        touchAction: "pan-y",
        cursor: "grab",
        userSelect: "none",
        transform: dx ? `translateX(${dx}px)` : undefined,
        opacity: gone ? 0 : dx ? Math.max(0.35, 1 - Math.abs(dx) / 320) : undefined,
        transition: drag ? "none" : "transform .22s ease, opacity .22s ease",
      }}
    >
      <span className="mb-toast-icon">
        {toast.type === "success" && (
          <svg viewBox="0 0 24 24">
            <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        )}
        {toast.type === "error" && (
          <svg viewBox="0 0 24 24">
            <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        )}
        {toast.type === "info" && (
          <svg viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
          </svg>
        )}
      </span>
      <div className="mb-toast-body">
        <div className="mb-toast-title">{toast.title}</div>
        {toast.msg && <div className="mb-toast-msg">{toast.msg}</div>}
      </div>
      <div className="mb-toast-progress" />
    </div>
  )
}

/* ============================================================
FRIEND ACTION SHEET
============================================================ */

function FriendActionSheet({
  friend,
  onClose,
  onMessage,
  onUnfollow,
  onBlock,
  onUnfriend,
  isUnfollowed,
}: {
  friend: any
  onClose: () => void
  onMessage: () => void
  onUnfollow: () => void
  onBlock: () => void
  onUnfriend: () => void
  isUnfollowed: boolean
}) {
  if (!friend) return null

  const photo =
    friend.photoURL ||
    `https://ui-avatars.com/api/?background=16a34a&color=fff&name=${encodeURIComponent(friend.name || "U")}`

  const friendshipTime = friend.friendsSince
    ? `Friends since ${monthYear(friend.friendsSince)}`
    : "Friends"

  return (
    <div className={`fl-sheet-backdrop open`} onClick={onClose}>
      <div className="fl-action-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="fl-sheet-handle" />

        <div className="fl-sheet-header">
          <img src={photo} alt={friend.name} />
          <div className="fl-sheet-header-info">
            <div className="fl-sheet-header-name">{friend.name}</div>
            <div className="fl-sheet-header-sub">{friendshipTime}</div>
          </div>
        </div>

        <div className="fl-sheet-options">
          <button className="fl-sheet-option" onClick={() => { onClose(); onMessage() }}>
            <span className="fl-sheet-ico">
              <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" /></svg>
            </span>
            <div className="fl-sheet-text">
              <div className="fl-sheet-title">Message {friend.name?.split(" ")[0]}</div>
            </div>
          </button>

          <button className="fl-sheet-option" onClick={() => { onClose(); onUnfollow() }}>
            <span className="fl-sheet-ico">
              <svg viewBox="0 0 24 24"><path d="M14 8c0-2.21-1.79-4-4-4S6 5.79 6 8s1.79 4 4 4 4-1.79 4-4zm-2 0c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zM2 18v2h16v-2c0-2.66-5.33-4-8-4s-8 1.34-8 4zm2 0c.22-.72 3.31-2 6-2 2.7 0 5.8 1.29 6 2H4zm15-9v3h-2V9h-3V7h3V4h2v3h3v2h-3z" /></svg>
            </span>
            <div className="fl-sheet-text">
              <div className="fl-sheet-title">
                {isUnfollowed ? `Follow ${friend.name?.split(" ")[0]} again` : `Unfollow ${friend.name?.split(" ")[0]}`}
              </div>
              <div className="fl-sheet-desc">
                {isUnfollowed
                  ? `Start seeing ${friend.name?.split(" ")[0]}'s posts again.`
                  : `Stop seeing posts but stay friends.`}
              </div>
            </div>
          </button>

          <button className="fl-sheet-option danger" onClick={() => { onClose(); onBlock() }}>
            <span className="fl-sheet-ico">
              <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9z" /></svg>
            </span>
            <div className="fl-sheet-text">
              <div className="fl-sheet-title">Block {friend.name?.split(" ")[0]}'s profile</div>
              <div className="fl-sheet-desc">They won't be able to see you or contact you.</div>
            </div>
          </button>

          <button className="fl-sheet-option danger" onClick={() => { onClose(); onUnfriend() }}>
            <span className="fl-sheet-ico">
              <svg viewBox="0 0 24 24"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
            </span>
            <div className="fl-sheet-text">
              <div className="fl-sheet-title">Unfriend {friend.name?.split(" ")[0]}</div>
              <div className="fl-sheet-desc">Remove {friend.name?.split(" ")[0]} as a friend.</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
USER NAME RESOLVER
Mvbd mini app এ signup এর সময় দেওয়া full name যেকোনো field এ থাকলে
(name / fullName / displayName / username ...) MeBook এ name হিসেবে দেখাবে
============================================================ */

function pickUserName(d: any, email?: string): string {
  if (!d) return ""
  const first = typeof d.firstName === "string" ? d.firstName.trim() : ""
  const last = typeof d.lastName === "string" ? d.lastName.trim() : ""
  const cands: any[] = [
    d.name,
    d.fullName,
    d.fullname,
    d.full_name,
    d.FullName,
    d.displayName,
    d.display_name,
    d.userName,
    d.username,
    d.signupName,
    d.profile?.name,
    d.profile?.fullName,
    d.profile?.displayName,
    first || last ? `${first} ${last}`.trim() : "",
  ]
  for (const c of cands) {
    if (typeof c === "string" && c.trim() && c.trim() !== "User") return c.trim()
  }
  const em = String(email || d.email || "")
  if (em.includes("@")) return em.split("@")[0]
  return typeof d.name === "string" ? d.name.trim() : ""
}

function normalizeUserData(d: any, fallbackEmail?: string) {
  if (!d) return d
  const n = pickUserName(d, d.email || fallbackEmail)
  if (n && d.name !== n) return { ...d, name: n }
  return d
}

/* ============================================================
FACEBOOK-STYLE PROFILE — friend sheet / info sheet
============================================================ */

const FBP_ICON = {
  back: "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z",
  search: "M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z",
  dots: "M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z",
  share: "M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z",
  people: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
  report: "M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 11h-2V7h2v6zm0 4h-2v-2h2v2z",
  heart: "M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z",
  block: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9z",
  invite: "M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
  following: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
  poke: "M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z",
  star: "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z",
  personCheck: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z",
  personRemove: "M14 8c0-2.21-1.79-4-4-4S6 5.79 6 8s1.79 4 4 4 4-1.79 4-4zm3 2v2h6v-2h-6zM2 18v2h16v-2c0-2.66-5.33-4-8-4s-8 1.34-8 4z",
  personEdit: "M10 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h10v-2.5l4-4c-1.5-.9-4.2-1.5-6-1.5zm10.7-.3l-1.4-1.4a1 1 0 0 0-1.4 0L16 14.2V17h2.8l1.9-1.9a1 1 0 0 0 0-1.4z",
  pause: "M6 19h4V5H6v14zm8-14v14h4V5h-4z",
  check: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
  menu: "M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z",
  edit: "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
  camera: "M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z",
  shield: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z",
  action: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5.5 14l-.9-2.6H9.4L8.5 17H6.7l3.4-9h1.8l3.4 9h-1.8zm-1.4-4.2L11 9.6l-1.1 3.2h2.2z",
  archive: "M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z",
  eye: "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z",
  info: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z",
  mega: "M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 1.08-1.2 1.61zM20.4 5.6c-.4-.53-.8-1.07-1.2-1.6-.99.74-2.24 1.68-3.2 2.4.4.53.8 1.07 1.2 1.6.96-.72 2.21-1.65 3.2-2.4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v4h2v-4h1l5 3V6L8 9H4z",
  list: "M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z",
  review: "M3 5v14h18V5H3zm16 12H5V7h14v10zM7 9h10v2H7V9zm0 4h7v2H7v-2z",
  lock: "M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z",
  gallery: "M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z",
  undo: "M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z",
}

function FbIco({ d, size = 24 }: { d: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
      <path d={d} />
    </svg>
  )
}

function FbFriendSheet({
  friend,
  following,
  favourite,
  breakActive,
  lists,
  onClose,
  onUnfollow,
  onBreakToggle,
  onFavourite,
  onSaveLists,
  onUnfriend,
}: {
  friend: any
  following: boolean
  favourite: boolean
  breakActive: boolean
  lists: string[]
  onClose: () => void
  onUnfollow: () => void
  onBreakToggle: () => void
  onFavourite: () => void
  onSaveLists: (l: string[]) => void
  onUnfriend: () => void
}) {
  const [view, setView] = useState<"main" | "lists">("main")
  const [sel, setSel] = useState<string[]>(lists || [])
  if (!friend) return null

  const LISTS = ["Close Friends", "Family", "Acquaintances", "Restricted"]

  const Row = ({ icon, label, sub, onClick }: { icon: string; label: string; sub?: string; onClick: () => void }) => (
    <button className="fbp-srow" onClick={onClick}>
      <span className="fbp-srow-ico"><FbIco d={icon} size={26} /></span>
      <span className="fbp-srow-txt">
        <b>{label}</b>
        {sub ? <small>{sub}</small> : null}
      </span>
    </button>
  )

  return (
    <div className="fbp-sheet-bg" onClick={onClose}>
      <div className="fbp-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="fbp-sheet-handle" />
        {view === "main" ? (
          <>
            <Row
              icon={FBP_ICON.following}
              label={following ? "Unfollow" : "Follow"}
              sub={following ? "Stop seeing posts but stay friends" : "See their posts in your feed again"}
              onClick={onUnfollow}
            />
            <Row
              icon={FBP_ICON.pause}
              label={breakActive ? "End break" : "Take a break"}
              sub={breakActive ? "Posts are hidden for now" : "Hide their posts for 30 days"}
              onClick={onBreakToggle}
            />
            <Row icon={FBP_ICON.personEdit} label="Edit Friend List" onClick={() => setView("lists")} />
            <Row
              icon={FBP_ICON.star}
              label={favourite ? "Remove from Favourites" : "Favourites"}
              onClick={onFavourite}
            />
            <Row icon={FBP_ICON.personRemove} label="Unfriend" onClick={onUnfriend} />
          </>
        ) : (
          <>
            <div className="fbp-sheet-title">Edit Friend List</div>
            {LISTS.map((l) => {
              const on = sel.includes(l)
              return (
                <button
                  key={l}
                  className="fbp-srow"
                  onClick={() => setSel((p) => (p.includes(l) ? p.filter((x) => x !== l) : [...p, l]))}
                >
                  <span className="fbp-srow-ico"><FbIco d={FBP_ICON.people} size={24} /></span>
                  <span className="fbp-srow-txt"><b>{l}</b></span>
                  <span className={`fbp-check${on ? " on" : ""}`}>{on && <FbIco d={FBP_ICON.check} size={18} />}</span>
                </button>
              )
            })}
            <button className="fbp-save" onClick={() => onSaveLists(sel)}>Save</button>
          </>
        )}
      </div>
    </div>
  )
}

function FbHighlightPicker({
  photos,
  selected,
  onSave,
  onClose,
}: {
  photos: string[]
  selected: string[]
  onSave: (l: string[]) => void
  onClose: () => void
}) {
  const [sel, setSel] = useState<string[]>(selected || [])
  return (
    <div className="fbp-sheet-bg" onClick={onClose}>
      <div className="fbp-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="fbp-sheet-handle" />
        <div className="fbp-sheet-title">Add highlights</div>
        <div className="fbp-info-sub" style={{ textAlign: "left" }}>Pick photos to show on your profile.</div>
        {photos.length === 0 ? (
          <div className="fbp-empty">Post a photo first to add highlights</div>
        ) : (
          <div className="fbp-grid" style={{ margin: "10px 0" }}>
            {photos.map((p, i) => {
              const on = sel.includes(p)
              return (
                <div
                  key={i}
                  className="fbp-gi"
                  style={{ position: "relative", outline: on ? "3px solid #0866ff" : "none", outlineOffset: -3 }}
                  onClick={() => setSel((x) => (x.includes(p) ? x.filter((y) => y !== p) : x.length >= 10 ? x : [...x, p]))}
                >
                  <img src={p} alt="" />
                  {on && <span className="fbp-check on" style={{ position: "absolute", top: 6, right: 6 }}><FbIco d={FBP_ICON.check} size={16} /></span>}
                </div>
              )
            })}
          </div>
        )}
        <button className="fbp-save" onClick={() => onSave(sel)}>Save</button>
        <button className="fbp-save secondary" onClick={onClose}>Cancel</button>
      </div>
    </div>
  )
}

function FbPhotoSheet({
  kind,
  hasCurrent,
  photos,
  busy,
  onSee,
  onUpload,
  onPick,
  onClose,
}: {
  kind: "cover" | "profile"
  hasCurrent: boolean
  photos: string[]
  busy: boolean
  onSee: () => void
  onUpload: () => void
  onPick: (url: string) => void
  onClose: () => void
}) {
  const [choosing, setChoosing] = useState(false)
  const label = kind === "cover" ? "cover photo" : "profile picture"
  return (
    <div className="fbp-sheet-bg" onClick={onClose}>
      <div className="fbp-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="fbp-sheet-handle" />
        {!choosing ? (
          <>
            {hasCurrent && (
              <button className="fbp-srow" onClick={onSee}>
                <span className="fbp-srow-ico"><FbIco d={FBP_ICON.eye} size={20} /></span>
                <span className="fbp-srow-txt"><b>See {label}</b></span>
              </button>
            )}
            <button className="fbp-srow" onClick={onUpload} disabled={busy}>
              <span className="fbp-srow-ico"><FbIco d={FBP_ICON.camera} size={20} /></span>
              <span className="fbp-srow-txt"><b>Upload Photo</b></span>
            </button>
            <button className="fbp-srow" onClick={() => setChoosing(true)}>
              <span className="fbp-srow-ico"><FbIco d={FBP_ICON.gallery} size={20} /></span>
              <span className="fbp-srow-txt"><b>Choose {kind === "cover" ? "cover photo" : "profile picture"}</b></span>
            </button>
          </>
        ) : (
          <>
            <div className="fbp-sheet-title">Choose from your photos</div>
            {photos.length === 0 ? (
              <div className="fbp-empty">Post a photo first, then you can choose it here</div>
            ) : (
              <div className="fbp-grid" style={{ margin: "10px 0" }}>
                {photos.map((p, i) => (
                  <div key={i} className="fbp-gi" onClick={() => onPick(p)}>
                    <img src={p} alt="" />
                  </div>
                ))}
              </div>
            )}
            <button className="fbp-save secondary" onClick={() => setChoosing(false)}>Back</button>
          </>
        )}
      </div>
    </div>
  )
}

type FbInfo = {
  title: string
  subtitle?: string
  avatars?: string[]
  lines?: string[]
  actions?: { label: string; danger?: boolean; onClick: () => void }[]
}

function FbInfoSheet({ info, onClose }: { info: FbInfo | null; onClose: () => void }) {
  if (!info) return null
  return (
    <div className="fbp-sheet-bg" onClick={onClose}>
      <div className="fbp-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="fbp-sheet-handle" />
        {info.avatars && info.avatars.length > 0 && (
          <div className="fbp-info-avs">
            {info.avatars.map((a, i) => (
              <img key={i} src={a} alt="" />
            ))}
          </div>
        )}
        <div className="fbp-sheet-title" style={{ textAlign: "center" }}>{info.title}</div>
        {info.subtitle && <div className="fbp-info-sub">{info.subtitle}</div>}
        {(info.lines || []).map((l, i) => (
          <div key={i} className="fbp-info-line">{l}</div>
        ))}
        {(info.actions || []).map((a, i) => (
          <button
            key={i}
            className={`fbp-srow${a.danger ? " danger" : ""}`}
            onClick={() => {
              onClose()
              a.onClick()
            }}
          >
            <span className="fbp-srow-txt"><b>{a.label}</b></span>
          </button>
        ))}
        <button className="fbp-save secondary" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}

/* ============================================================
REACTION PICKER (Comments)
============================================================ */

function ReactionPicker({
  anchorRect,
  open,
  onReact,
}: {
  anchorRect: { x: number; y: number; width: number } | null
  open: boolean
  onReact: (reactionKey: string, emoji: string) => void
}) {
  if (!anchorRect) return null
  return (
    <div
      className={`cmt-reaction-picker${open ? " open" : ""}`}
      style={{ left: anchorRect.x, top: anchorRect.y - 52 }}
      onClick={(e) => e.stopPropagation()}
    >
      {REACTIONS.map((r) => (
        <button key={r.key} type="button" title={r.label} onClick={() => onReact(r.key, r.emoji)}>
          {r.emoji}
        </button>
      ))}
    </div>
  )
}

/* ============================================================
FACEBOOK-STYLE REACTIONS — icon, picker, jump animation, sheet
============================================================ */

function ReactionIcon({ k, size = 20, ring = false }: { k: string; size?: number; ring?: boolean }) {
  const r = REACTIONS.find((x) => x.key === k)
  const ringCls = ring ? " rx-ring" : ""
  if (k === "like") {
    return (
      <span className={`rx-badge${ringCls}`} style={{ width: size, height: size, background: "linear-gradient(180deg,#5aaeff,#1877f2)" }}>
        <svg className="rx-svg" viewBox="0 0 24 24">
          <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91z" />
        </svg>
      </span>
    )
  }
  if (k === "love") {
    return (
      <span className={`rx-badge${ringCls}`} style={{ width: size, height: size, background: "linear-gradient(180deg,#ff6680,#f02849)" }}>
        <svg className="rx-svg" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </span>
    )
  }
  return (
    <span className={`rx-emoji${ringCls}`} style={{ width: size, height: size, fontSize: size * 0.92 }}>
      {r?.emoji}
    </span>
  )
}

function PostReactionPicker({
  anchorRect,
  open,
  onReact,
}: {
  anchorRect: { x: number; y: number; width: number; height?: number } | null
  open: boolean
  onReact: (reactionKey: string, emoji: string, from: { x: number; y: number }) => void
}) {
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [down, setDown] = useState(true)
  const activeRef = useRef<string | null>(null)
  const downRef = useRef(false)
  const barRef = useRef<HTMLDivElement>(null)
  const onReactRef = useRef(onReact)
  onReactRef.current = onReact

  const setActive = (k: string | null) => {
    activeRef.current = k
    setActiveKey(k)
  }

  const centerOf = (key: string) => {
    const el = barRef.current?.querySelector(`[data-rkey="${key}"] .rx-item`) as HTMLElement | null
    if (!el) return { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const r = el.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  }

  const choose = (key: string) => {
    const r = REACTIONS.find((x) => x.key === key)
    if (!r) return
    onReactRef.current(key, r.emoji, centerOf(key))
  }

  useEffect(() => {
    if (!open) {
      downRef.current = false
      setActive(null)
      return
    }
    downRef.current = true
    setDown(true)

    const hit = (cx: number, cy: number) => {
      const bar = barRef.current
      if (!bar) return
      const b = bar.getBoundingClientRect()
      let found = null as string | null
      if (cy >= b.top - 110 && cy <= b.bottom + 80) {
        for (const el of Array.from(bar.querySelectorAll("[data-rkey]"))) {
          const r = (el as HTMLElement).getBoundingClientRect()
          if (cx >= r.left && cx < r.right) {
            found = (el as HTMLElement).getAttribute("data-rkey")
            break
          }
        }
      }
      if (found !== activeRef.current) setActive(found)
    }

    const release = (cancel: boolean) => {
      if (!downRef.current) return
      downRef.current = false
      setDown(false)
      const k = activeRef.current
      if (k && !cancel) choose(k)
    }

    const onTM = (e: TouchEvent) => {
      if (!downRef.current) return
      if (e.cancelable) e.preventDefault()
      const t = e.touches[0]
      if (t) hit(t.clientX, t.clientY)
    }
    const onTE = (e: TouchEvent) => {
      if (downRef.current && activeRef.current && e.cancelable) e.preventDefault()
      release(false)
    }
    const onTC = () => release(true)
    const onMM = (e: MouseEvent) => {
      if (downRef.current) hit(e.clientX, e.clientY)
    }
    const onMU = () => release(false)

    window.addEventListener("touchmove", onTM, { passive: false })
    window.addEventListener("touchend", onTE, { passive: false })
    window.addEventListener("touchcancel", onTC)
    window.addEventListener("mousemove", onMM)
    window.addEventListener("mouseup", onMU)
    return () => {
      window.removeEventListener("touchmove", onTM)
      window.removeEventListener("touchend", onTE)
      window.removeEventListener("touchcancel", onTC)
      window.removeEventListener("mousemove", onMM)
      window.removeEventListener("mouseup", onMU)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!anchorRect) return null

  const barW = REACTIONS.length * 40 + 16
  const left = Math.max(8, Math.min(anchorRect.x, window.innerWidth - barW - 8))
  const below = anchorRect.y < 150
  const pos: React.CSSProperties = below
    ? { left, top: anchorRect.y + (anchorRect.height || 44) + 8 }
    : { left, bottom: window.innerHeight - anchorRect.y + 6 }

  return (
    <div
      className={`rx-picker${open ? " open" : ""}${below ? " below" : ""}${activeKey ? " has-active" : ""}`}
      style={pos}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="rx-bar" ref={barRef} onMouseLeave={() => setActive(null)}>
        {REACTIONS.map((r, i) => (
          <button
            key={r.key}
            type="button"
            data-rkey={r.key}
            title={r.label}
            className={`rx-slot${activeKey === r.key ? " active" : ""}`}
            style={{ ["--i" as any]: i } as React.CSSProperties}
            onMouseEnter={() => setActive(r.key)}
            onClick={() => choose(r.key)}
          >
            <span className="rx-label">{r.label}</span>
            <span className="rx-pop">
              <span className="rx-item">
                <ReactionIcon k={r.key} size={32} />
              </span>
            </span>
          </button>
        ))}
      </div>
      <div className="rx-hint">{down ? "Slide finger across" : "Tap to select"}</div>
    </div>
  )
}

/* Selected reaction jumps from the picker into the Like button */
function RxJump({
  k, fx, fy, tx, ty, onDone,
}: {
  k: string; fx: number; fy: number; tx: number; ty: number; onDone: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof (el as any).animate !== "function") {
      onDone()
      return
    }
    const mx = fx + (tx - fx) * 0.45
    const my = Math.min(fy, ty) - 80
    const t = (x: number, y: number, s: number) =>
      `translate(${x}px,${y}px) translate(-50%,-50%) scale(${s})`
    const anim = el.animate(
      [
        { transform: t(fx, fy, 1.5), opacity: 1, offset: 0, easing: "cubic-bezier(.2,.8,.4,1)" },
        { transform: t(mx, my, 1.9), opacity: 1, offset: 0.45, easing: "cubic-bezier(.5,0,.85,.55)" },
        { transform: t(tx, ty, 0.75), opacity: 1, offset: 0.92 },
        { transform: t(tx, ty, 0.5), opacity: 0, offset: 1 },
      ],
      { duration: 580, fill: "forwards" }
    )
    anim.onfinish = () => onDone()
    return () => anim.cancel()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div ref={ref} className="rx-jump">
      <ReactionIcon k={k} size={30} />
    </div>
  )
}

/* ---- Stickers (animated Noto emoji, falls back to plain emoji) ---- */
const STICKER_CATS: Array<{ key: string; icon: string; label: string; items: string[] }> = [
  { key: "happy", icon: "😀", label: "Happy", items: ["😀", "😁", "😂", "🤣", "😊", "😄", "🥳", "🤩", "😎", "🤗", "😇", "😜"] },
  { key: "love", icon: "😍", label: "In love", items: ["😍", "🥰", "😘", "😻", "💖", "💘", "😚", "🤩", "💕", "💞", "🌹", "💋"] },
  { key: "sad", icon: "😢", label: "Sad", items: ["😢", "😭", "😞", "😔", "😟", "🥺", "😩", "😡", "🤬", "😱", "😰", "😓"] },
  { key: "eating", icon: "🍕", label: "Eating", items: ["🍕", "🍔", "🍟", "🌭", "🍜", "🍣", "🍩", "🍰", "🍦", "🍿", "🥤", "☕"] },
  { key: "cool", icon: "👍", label: "Cool", items: ["👍", "👏", "🙌", "🙏", "💪", "🔥", "💯", "✨", "🤝", "👌", "✌", "🤞"] },
  { key: "party", icon: "🎉", label: "Party", items: ["🎉", "🎊", "🎂", "🎁", "🎈", "🥂", "🏆", "⚽", "🎮", "🎵", "🚀", "🌈"] },
]

function StickerImg({ emoji, size = 100 }: { emoji: string; size?: number }) {
  const [fail, setFail] = useState(false)
  const cp = Array.from(emoji)
    .map((c) => (c.codePointAt(0) || 0).toString(16))
    .join("_")
  if (fail) return <span style={{ fontSize: size * 0.8, lineHeight: 1, display: "inline-block" }}>{emoji}</span>
  return (
    <img
      src={`https://fonts.gstatic.com/s/e/notoemoji/latest/${cp}/512.webp`}
      width={size}
      height={size}
      alt={emoji}
      loading="lazy"
      style={{ display: "block", objectFit: "contain" }}
      onError={() => setFail(true)}
    />
  )
}

const PM_IC = {
  pin: "M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z",
  bookmark: "M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15-5-2.18L7 18V5h10v13z",
  edit: "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
  link: "M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z",
  comment: "M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z",
  globe: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z",
  archive: "M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z",
  trash: "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
  bellOff: "M20 18.69L7.84 6.14 5.27 3.49 4 4.76l2.8 2.8v.01c-.52.99-.8 2.16-.8 3.42v5l-2 2v1h13.73l2 2L21 19.72l-1-1.03zM12 22c1.11 0 2-.89 2-2h-4c0 1.11.89 2 2 2zm6-7.32V11c0-3.08-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68c-.15.03-.29.08-.42.12L18 14.68z",
  bell: "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z",
  people: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
  megaphone: "M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 1.08-1.2 1.61zM20.4 5.6c-.4-.53-.8-1.07-1.2-1.6-.99.74-2.24 1.68-3.2 2.4.4.53.8 1.07 1.2 1.6.96-.72 2.21-1.65 3.2-2.4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v4h2v-4h1l5 3V6L8 9H4zm11.5 3c0-1.33-.58-2.53-1.5-3.35v6.69c.92-.81 1.5-2.01 1.5-3.34z",
  lock: "M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z",
  back: "M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z",
  smile: "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-10c.83 0 1.5-.67 1.5-1.5S16.33 7 15.5 7 14 7.67 14 8.5s.67 1.5 1.5 1.5zm-7 0C9.33 10 10 9.33 10 8.5S9.33 7 8.5 7 7 7.67 7 8.5 7.67 10 8.5 10zm3.5 7.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z",
  camera: "M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zM9 2 7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z",
  plus: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
  send: "M2.01 21 23 12 2.01 3 2 10l15 2-15 2z",
  close: "M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
  more: "M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z",
  story: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z",
  feed: "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM4 9h16v3H4V9zm0 5h10v4H4v-4z",
  group: "M12 12.75c1.63 0 3.07.39 4.24.9 1.08.48 1.76 1.56 1.76 2.73V18H6v-1.61c0-1.18.68-2.26 1.76-2.73 1.17-.52 2.61-.91 4.24-.91zM4 13c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm1.13 1.1c-.37-.06-.74-.1-1.13-.1-.99 0-1.93.21-2.78.58C.48 14.9 0 15.62 0 16.43V18h4.5v-1.61c0-.83.23-1.61.63-2.29zM20 13c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm4 3.43c0-.81-.48-1.53-1.22-1.85-.85-.37-1.79-.58-2.78-.58-.39 0-.76.04-1.13.1.4.68.63 1.46.63 2.29V18H24v-1.57zM12 6c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z",
  person: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
  restore: "M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z",
}
function PmIcon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24">
      <path d={d} />
    </svg>
  )
}

/* ---- Reactors list + comments bottom sheet ---- */
function EngageSheet(props: {
  post: any
  mode: "reactions" | "comments"
  tab: string
  onMode: (m: "reactions" | "comments") => void
  onTab: (t: string) => void
  onClose: () => void
  me: any
  profile: any
  allUsers: any[]
  myFriends: any[]
  sentRequests: Record<string, string>
  sentFriendRequests: any[]
  onAddFriend: (uid: string) => void
  onOpenProfile: (uid: string) => void
  commentText: string
  setCommentText: (s: string) => void
  commentBusy: boolean
  commentImagePreview: string
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveImage: () => void
  replyTo: any
  setReplyTo: (r: any) => void
  onSend: () => void
  onQuickEmoji: (emoji: string) => void
  onSendSticker: (emoji: string) => void
  onLikeComment: (commentId: string) => void
  onCommentMenu: (commentId: string) => void
  editCommentId: string | null
  editCommentText: string
  setEditCommentText: (s: string) => void
  editBusy: boolean
  onSaveEdit: (commentId: string) => void
  onCancelEdit: () => void
  lockMsg: string
  isVerifiedUid: (uid: any, obj: any) => boolean
}) {
  const { post, mode, me } = props
  const [shown, setShown] = useState(false)
  const [sort, setSort] = useState<"relevant" | "newest" | "oldest">("relevant")
  const [panel, setPanel] = useState<"" | "sticker">("")
  const [stickerCat, setStickerCat] = useState("happy")
  const sheetRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const drag = useRef({ y0: 0, dy: 0 })

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true))
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      cancelAnimationFrame(id)
      document.body.style.overflow = prev
    }
  }, [])

  const close = () => {
    setShown(false)
    setTimeout(props.onClose, 240)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const avatarFor = (u: any) =>
    u?.photoURL ||
    u?.avatar ||
    `https://ui-avatars.com/api/?background=16a34a&color=fff&name=${encodeURIComponent(u?.name || "User")}`

  /* ---------- reactions data ---------- */
  const reactionMap: Record<string, string> = { ...(post.reactions || {}) }
  ;(Array.isArray(post.likes) ? post.likes : []).forEach((uid: string) => {
    if (!reactionMap[uid]) reactionMap[uid] = "like"
  })
  const entries = Object.entries(reactionMap)
  const counts: Record<string, number> = {}
  entries.forEach(([, k]) => {
    counts[k] = (counts[k] || 0) + 1
  })
  const total = entries.length
  const tabKeys = REACTIONS.map((r) => r.key)
    .filter((k) => counts[k])
    .sort((a, b) => counts[b] - counts[a])
  const topKeys = tabKeys.slice(0, 3)
  const tab = props.tab === "all" || counts[props.tab] ? props.tab : "all"
  const friendIds = new Set(props.myFriends.map((f: any) => f.uid))
  const pendingIds = new Set(
    props.sentFriendRequests.filter((r: any) => r.status === "pending").map((r: any) => r.to)
  )

  const userOf = (uid: string) => {
    if (uid === me.uid) return { uid, name: props.profile?.name || "You", photoURL: props.profile?.photoURL || "" }
    return props.allUsers.find((u: any) => u.uid === uid) || null
  }

  const rows = entries
    .filter(([, k]) => tab === "all" || k === tab)
    .map(([uid, k]) => ({ uid, k, u: userOf(uid) }))
    .sort((a, b) => {
      const w = (x: any) => (x.uid === me.uid ? 0 : friendIds.has(x.uid) ? 1 : 2)
      return w(a) - w(b)
    })

  /* ---------- comments data ---------- */
  const allComments: any[] = Array.isArray(post.comments) ? post.comments : []
  const tops = allComments.filter((c) => !c.parentId)
  const repliesMap: Record<string, any[]> = {}
  allComments.forEach((c) => {
    if (c.parentId) (repliesMap[c.parentId] = repliesMap[c.parentId] || []).push(c)
  })
  const rcount = (c: any) => Object.keys(c.reactions || {}).length
  const sortedTops = tops.slice().sort((a, b) => {
    if (sort === "newest") return (b.at || 0) - (a.at || 0)
    if (sort === "oldest") return (a.at || 0) - (b.at || 0)
    const sa = rcount(a) * 2 + (repliesMap[a.id]?.length || 0)
    const sb = rcount(b) * 2 + (repliesMap[b.id]?.length || 0)
    return sb - sa || (a.at || 0) - (b.at || 0)
  })
  const sortLabel = sort === "relevant" ? "Most relevant" : sort === "newest" ? "Newest" : "Oldest"
  const cycleSort = () => setSort((s) => (s === "relevant" ? "newest" : s === "newest" ? "oldest" : "relevant"))

  const renderComment = (c: any, isReply: boolean, parent?: any): React.ReactNode => {
    const myR = c.reactions?.[me.uid]
    const myDef = myR ? REACTIONS.find((r) => r.key === myR) : null
    const rEntries = Object.entries(c.reactions || {})
    const rKeys = Array.from(new Set(rEntries.map(([, k]) => k as string))).slice(0, 2)
    const editing = props.editCommentId === c.id
    const mine = c.uid === me.uid
    return (
      <React.Fragment key={c.id}>
        <div className={`rx-cmt${isReply ? " reply" : ""}`}>
          <img
            className="rx-cmt-av"
            src={avatarFor({ photoURL: c.avatar, name: c.name })}
            alt=""
            onClick={() => c.uid && props.onOpenProfile(c.uid)}
          />
          <div className="rx-cmt-main">
            {editing ? (
              <div className="rx-edit-box">
                <textarea
                  autoFocus
                  value={props.editCommentText}
                  onChange={(e) => props.setEditCommentText(e.target.value)}
                />
                <div className="rx-edit-actions">
                  <button onClick={props.onCancelEdit}>Cancel</button>
                  <button
                    className="save"
                    disabled={props.editBusy || (!props.editCommentText.trim() && !c.image && !c.sticker)}
                    onClick={() => props.onSaveEdit(c.id)}
                  >
                    {props.editBusy ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            ) : c.sticker && !c.text ? (
              <div className="rx-cmt-sticker">
                <b>
                  {c.name || "User"}
                  {props.isVerifiedUid(c.uid, c) && mcVerifiedBadge(13)}
                </b>
                <StickerImg emoji={c.sticker} size={104} />
              </div>
            ) : (
              <div className="rx-cmt-bubble" style={rEntries.length ? { marginBottom: 8 } : undefined}>
                <b>
                  {c.name || "User"}
                  {props.isVerifiedUid(c.uid, c) && mcVerifiedBadge(13)}
                </b>
                {c.text}
                {c.sticker && <StickerImg emoji={c.sticker} size={96} />}
                {c.image && <img src={c.image} alt="" />}
                {rEntries.length > 0 && (
                  <span className="rx-cmt-react">
                    {rKeys.map((k) => (
                      <ReactionIcon key={k} k={k} size={15} />
                    ))}
                    {rEntries.length}
                  </span>
                )}
              </div>
            )}
            {!editing && (
              <div className="rx-cmt-meta">
                <span>{timeAgo(c.at)}{c.edited ? " · Edited" : ""}</span>
                <button
                  style={myDef ? { color: myDef.color } : undefined}
                  onClick={() => props.onLikeComment(c.id)}
                >
                  {myDef ? myDef.label : "Like"}
                </button>
                <button
                  onClick={() => {
                    props.setReplyTo({
                      id: isReply && parent ? parent.id : c.id,
                      name: c.name,
                      uid: c.uid,
                    })
                    setPanel("")
                    setTimeout(() => inputRef.current?.focus(), 30)
                  }}
                >
                  Reply
                </button>
                {mine && (
                  <button title="Edit or delete" onClick={() => props.onCommentMenu(c.id)}>
                    •••
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        {!isReply && (repliesMap[c.id] || []).map((r) => renderComment(r, true, c))}
      </React.Fragment>
    )
  }

  /* ---------- drag to close ---------- */
  const onDragStart = (e: React.TouchEvent) => {
    drag.current.y0 = e.touches[0].clientY
    drag.current.dy = 0
    if (sheetRef.current) sheetRef.current.style.transition = "none"
  }
  const onDragMove = (e: React.TouchEvent) => {
    const dy = Math.max(0, e.touches[0].clientY - drag.current.y0)
    drag.current.dy = dy
    if (sheetRef.current) sheetRef.current.style.transform = `translateY(${dy}px)`
  }
  const onDragEnd = () => {
    const el = sheetRef.current
    if (el) {
      el.style.transition = ""
      el.style.transform = ""
    }
    if (drag.current.dy > 110) close()
    drag.current.dy = 0
  }

  const hasDraft = !!props.commentText.trim() || !!props.commentImagePreview
  const canSend = hasDraft && !props.commentBusy
  const pending = props.commentBusy && hasDraft
  const sharesCount = post.shares || 0
  const cat = STICKER_CATS.find((c) => c.key === stickerCat) || STICKER_CATS[0]

  return (
    <div className={`rx-sheet-backdrop${shown ? " open" : ""}`} onClick={close}>
      <div className="rx-sheet" ref={sheetRef} onClick={(e) => e.stopPropagation()}>
        <div
          className="rx-sheet-top"
          onTouchStart={onDragStart}
          onTouchMove={onDragMove}
          onTouchEnd={onDragEnd}
          onTouchCancel={onDragEnd}
        >
          <div className="rx-sheet-grip" />
          <div className="rx-sheet-head">
            {total > 0 && (
              <button
                className={`rx-head-pill${mode === "reactions" ? " active" : ""}`}
                onClick={() => props.onMode("reactions")}
              >
                <span className="rx-stack">
                  {topKeys.map((k, i) => (
                    <span key={k} className="rx-stack-item" style={{ marginLeft: i ? -5 : 0, zIndex: 5 - i }}>
                      <ReactionIcon k={k} size={20} ring />
                    </span>
                  ))}
                </span>
                {total}
              </button>
            )}
            <button
              className={`rx-head-pill${mode === "comments" ? " active" : ""}`}
              onClick={() => props.onMode("comments")}
            >
              {allComments.length} {allComments.length === 1 ? "comment" : "comments"}
            </button>
            <span className="rx-head-shares">
              {sharesCount} {sharesCount === 1 ? "share" : "shares"}
            </span>
          </div>
        </div>

        {mode === "reactions" ? (
          <>
            <div className="rx-tabs">
              <button
                className={`rx-tab${tab === "all" ? " active" : ""}`}
                style={{ borderBottomColor: tab === "all" ? "#1877f2" : "transparent" }}
                onClick={() => props.onTab("all")}
              >
                All {total}
              </button>
              {tabKeys.map((k) => {
                const def = REACTIONS.find((r) => r.key === k)
                return (
                  <button
                    key={k}
                    className={`rx-tab${tab === k ? " active" : ""}`}
                    style={{ borderBottomColor: tab === k ? def?.color : "transparent" }}
                    onClick={() => props.onTab(k)}
                  >
                    <ReactionIcon k={k} size={20} />
                    {counts[k]}
                  </button>
                )
              })}
            </div>
            <div className="rx-list">
              {rows.length === 0 ? (
                <div className="rx-empty">No reactions yet</div>
              ) : (
                rows.map(({ uid, k, u }) => {
                  const isMe = uid === me.uid
                  const isFriend = friendIds.has(uid)
                  const pend = pendingIds.has(uid) || !!props.sentRequests[uid]
                  return (
                    <div className="rx-row" key={uid}>
                      <div className="rx-row-av" onClick={() => props.onOpenProfile(uid)}>
                        <img src={avatarFor(u)} alt="" />
                        <span className="rx-row-badge">
                          <ReactionIcon k={k} size={19} ring />
                        </span>
                      </div>
                      <div className="rx-row-name" onClick={() => props.onOpenProfile(uid)}>
                        {u?.name || "Unknown user"}
                        {isMe && <small>You</small>}
                      </div>
                      {!isMe && !isFriend && u && (
                        <button
                          className={`rx-add-btn${pend ? " sent" : ""}`}
                          onClick={() => props.onAddFriend(uid)}
                        >
                          {pend ? "Requested" : "Add friend"}
                        </button>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </>
        ) : (
          <>
            <div className="rx-list" style={{ display: "flex", flexDirection: "column" }}>
              {allComments.length > 0 && (
                <button className="rx-sort" onClick={cycleSort}>
                  {sortLabel} ▾
                </button>
              )}
              {pending && (
                <div className="rx-cmt">
                  <img className="rx-cmt-av" src={avatarFor(props.profile)} alt="" />
                  <div className="rx-cmt-main">
                    <div className="rx-cmt-bubble">
                      <b>{props.profile?.name || "You"}</b>
                      {props.commentText}
                      {props.commentImagePreview && <img src={props.commentImagePreview} alt="" />}
                    </div>
                    <div className="rx-cmt-meta">
                      <span>Posting…</span>
                    </div>
                  </div>
                </div>
              )}
              {sortedTops.length === 0 && !pending ? (
                <div className="rx-empty">No comments yet. Be the first to comment.</div>
              ) : (
                sortedTops.map((c) => renderComment(c, false))
              )}
            </div>
            <div className="rx-foot">
              {props.lockMsg ? (
                <div className="rx-lock">{props.lockMsg}</div>
              ) : (
                <>
                  {props.replyTo && (
                    <div className="rx-replying">
                      <span>
                        Replying to <b>{props.replyTo.name}</b>
                      </span>
                      <button onClick={() => props.setReplyTo(null)}>Cancel</button>
                    </div>
                  )}
                  <div className="rx-quick">
                    {["❤️", "🙌", "🔥", "👏", "😢", "😍", "😮", "😂"].map((em) => (
                      <button key={em} type="button" onClick={() => props.onQuickEmoji(em)}>
                        {em}
                      </button>
                    ))}
                  </div>
                  {props.commentImagePreview && (
                    <div className="rx-img-prev">
                      <img src={props.commentImagePreview} alt="" />
                      <button onClick={props.onRemoveImage} title="Remove photo">
                        <PmIcon d={PM_IC.close} />
                      </button>
                    </div>
                  )}
                  <div className="rx-write">
                    <input
                      ref={inputRef}
                      value={props.commentText}
                      placeholder={props.replyTo ? `Reply to ${props.replyTo.name}…` : "Write a comment…"}
                      onFocus={() => setPanel("")}
                      onChange={(e) => props.setCommentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && canSend) props.onSend()
                      }}
                    />
                  </div>
                  <div className="rx-tools">
                    <button className="rx-tool" title="Photo" onClick={() => fileRef.current?.click()}>
                      <PmIcon d={PM_IC.camera} />
                    </button>
                    <button
                      className={`rx-tool${panel === "sticker" ? " on" : ""}`}
                      title="Stickers"
                      onClick={() => {
                        inputRef.current?.blur()
                        setPanel((p) => (p === "sticker" ? "" : "sticker"))
                      }}
                    >
                      <PmIcon d={PM_IC.plus} />
                    </button>
                    <button
                      className="rx-tool send"
                      title="Send"
                      disabled={!canSend}
                      onClick={props.onSend}
                    >
                      <PmIcon d={PM_IC.send} />
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={props.onImageSelect}
                    />
                  </div>
                  {panel === "sticker" && (
                    <div className="rx-sticker-panel">
                      <div className="rx-sticker-cats">
                        {STICKER_CATS.map((c) => (
                          <button
                            key={c.key}
                            className={stickerCat === c.key ? "on" : ""}
                            onClick={() => setStickerCat(c.key)}
                          >
                            <span>{c.icon}</span> {c.label}
                          </button>
                        ))}
                      </div>
                      <div className="rx-sticker-grid">
                        {cat.items.map((em) => (
                          <button
                            key={em}
                            onClick={() => {
                              setPanel("")
                              props.onSendSticker(em)
                            }}
                          >
                            <StickerImg emoji={em} size={64} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ---- Generic radio list sheet (privacy / who can comment) ---- */
function ChoiceSheet(props: {
  title: string
  subtitle?: string
  options: Array<{ value: string; label: string; sub?: string; icon: string }>
  value: string
  showDefault?: boolean
  defaultChecked?: boolean
  onDone: (value: string, setDefault: boolean) => void
  onBack: () => void
  zIndex?: number
}) {
  const [val, setVal] = useState(props.value)
  const [def, setDef] = useState(!!props.defaultChecked)
  return (
    <div className="pm-backdrop open" style={props.zIndex ? { zIndex: props.zIndex } : undefined} onClick={props.onBack}>
      <div className="pm-sheet pm-choice" onClick={(e) => e.stopPropagation()}>
        <button className="pm-back" onClick={props.onBack} title="Back">
          <PmIcon d={PM_IC.back} />
        </button>
        <div className="pm-choice-title">{props.title}</div>
        {props.subtitle && <div className="pm-choice-sub">{props.subtitle}</div>}
        <div className="pm-choice-list">
          {props.options.map((o) => (
            <button key={o.value} className="pm-choice-row" onClick={() => setVal(o.value)}>
              <span className="pm-choice-ic">
                <PmIcon d={o.icon} />
              </span>
              <span className="pm-choice-txt">
                {o.label}
                {o.sub && <small>{o.sub}</small>}
              </span>
              <span className={`pm-radio${val === o.value ? " on" : ""}`} />
            </button>
          ))}
        </div>
        {props.showDefault && (
          <label className="pm-default">
            <span>Set as default audience.</span>
            <input type="checkbox" checked={def} onChange={(e) => setDef(e.target.checked)} />
          </label>
        )}
        <button className="pm-done" onClick={() => props.onDone(val, def)}>
          Done
        </button>
      </div>
    </div>
  )
}

/* ---- Share bottom sheet (Facebook style) ---- */
function ShareSheet(props: {
  post: any
  profile: any
  friends: any[]
  busy: boolean
  defaultAudience: string
  onClose: () => void
  onShareNow: (caption: string, audience: string, setDefault: boolean) => Promise<boolean>
  onSendToFriend: (uid: string) => Promise<boolean>
  onCopy: () => void
  onWhatsApp: () => void
  onTelegram: () => void
  onFacebook: () => void
  onMore: () => void
  onUnavailable: (what: string) => void
}) {
  const [shown, setShown] = useState(false)
  const [caption, setCaption] = useState("")
  const [audience, setAudience] = useState(props.defaultAudience || "public")
  const [panel, setPanel] = useState<"" | "dest" | "aud">("")
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [sent, setSent] = useState<Record<string, "sending" | "sent">>({})
  const [setDefault, setSetDefault] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  const drag = useRef({ y0: 0, dy: 0 })

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const close = () => {
    setShown(false)
    setTimeout(props.onClose, 230)
  }

  const audMeta: Record<string, { label: string; ic: string }> = {
    public: { label: "Public", ic: PM_IC.globe },
    friends: { label: "Friends", ic: PM_IC.people },
    only_me: { label: "Only me", ic: PM_IC.lock },
  }
  const am = audMeta[audience] || audMeta.public
  const avatar =
    props.profile?.photoURL ||
    `https://ui-avatars.com/api/?background=16a34a&color=fff&name=${encodeURIComponent(props.profile?.name || "User")}`

  const onDragStart = (e: React.TouchEvent) => {
    drag.current.y0 = e.touches[0].clientY
    drag.current.dy = 0
    if (sheetRef.current) sheetRef.current.style.transition = "none"
  }
  const onDragMove = (e: React.TouchEvent) => {
    const dy = Math.max(0, e.touches[0].clientY - drag.current.y0)
    drag.current.dy = dy
    if (sheetRef.current) sheetRef.current.style.transform = `translateY(${dy}px)`
  }
  const onDragEnd = () => {
    const el = sheetRef.current
    if (el) {
      el.style.transition = ""
      el.style.transform = ""
    }
    if (drag.current.dy > 100) close()
    drag.current.dy = 0
  }

  const shareNow = async () => {
    const ok = await props.onShareNow(caption.trim(), audience, setDefault)
    if (ok) close()
  }

  const sendFriend = async (uid: string) => {
    if (sent[uid]) return
    setSent((s) => ({ ...s, [uid]: "sending" }))
    const ok = await props.onSendToFriend(uid)
    setSent((s) => {
      const c = { ...s }
      if (ok) c[uid] = "sent"
      else delete c[uid]
      return c
    })
  }

  const EMOJIS = ["😀", "😂", "😍", "🥰", "😎", "🤔", "😢", "😡", "👍", "🙏", "🔥", "🎉", "❤️", "💯", "👏", "✨"]

  const appBtn = (key: string, label: string, bg: string, path: string, onClick: () => void, color = "#fff") => (
    <button key={key} className="sh-app" onClick={onClick}>
      <span className="sh-app-ic" style={{ background: bg, color }}>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d={path} />
        </svg>
      </span>
      <span className="sh-app-lb">{label}</span>
    </button>
  )

  return (
    <>
      <div className={`sh-backdrop${shown ? " open" : ""}`} onClick={close}>
        <div className="sh-sheet" ref={sheetRef} onClick={(e) => e.stopPropagation()}>
          <div
            className="sh-top"
            onTouchStart={onDragStart}
            onTouchMove={onDragMove}
            onTouchEnd={onDragEnd}
            onTouchCancel={onDragEnd}
          >
            <div className="rx-sheet-grip" />
          </div>
          <div className="sh-compose">
            <div className="sh-who">
              <img src={avatar} alt="" />
              <div className="sh-who-info">
                <b>
                  {props.profile?.name || "You"}
                  {props.profile?.verified === true && mcVerifiedBadge(14)}
                </b>
                <div className="sh-chips">
                  <button className="sh-chip" onClick={() => setPanel("dest")}>
                    Feed <span>▾</span>
                  </button>
                  <button className="sh-chip" onClick={() => setPanel("aud")}>
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                      <path d={am.ic} />
                    </svg>
                    {am.label} <span>▾</span>
                  </button>
                </div>
              </div>
            </div>
            <textarea
              className="sh-text"
              rows={3}
              placeholder="Say something..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
            {emojiOpen && (
              <div className="sh-emojis">
                {EMOJIS.map((e) => (
                  <button key={e} onClick={() => setCaption((c) => c + e)}>
                    {e}
                  </button>
                ))}
              </div>
            )}
            <div className="sh-compose-foot">
              <button className="sh-emoji-btn" onClick={() => setEmojiOpen((v) => !v)} title="Emoji">
                <PmIcon d={PM_IC.smile} />
              </button>
              <button className="sh-now" disabled={props.busy} onClick={shareNow}>
                {props.busy ? "Sharing…" : "Share now"}
              </button>
            </div>
          </div>

          {props.friends.length > 0 && (
            <div className="sh-row sh-friends">
              {props.friends.slice(0, 20).map((f: any) => (
                <button key={f.uid} className="sh-friend" onClick={() => sendFriend(f.uid)}>
                  <span className="sh-friend-av">
                    <img
                      src={
                        f.photoURL ||
                        `https://ui-avatars.com/api/?background=16a34a&color=fff&name=${encodeURIComponent(f.name || "U")}`
                      }
                      alt=""
                    />
                    {sent[f.uid] && <i className={sent[f.uid] === "sent" ? "ok" : ""}>{sent[f.uid] === "sent" ? "✓" : "…"}</i>}
                  </span>
                  <span className="sh-friend-nm">{(f.name || "User").split(" ").slice(0, 2).join(" ")}</span>
                </button>
              ))}
            </div>
          )}

          <div className="sh-row sh-apps">
            {appBtn("story", "Your story", "var(--input-bg)", PM_IC.plus, () => props.onUnavailable("Stories"), "var(--text)")}
            {appBtn(
              "wa",
              "WhatsApp",
              "#25d366",
              "M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.48-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.65-1.58-.9-2.16-.24-.57-.48-.5-.66-.5-.17 0-.37-.02-.56-.02-.2 0-.5.07-.77.37-.27.3-1.02 1-1.02 2.42 0 1.43 1.04 2.81 1.19 3 .15.2 2.05 3.13 4.97 4.38.7.3 1.24.48 1.66.62.7.22 1.33.19 1.83.11.56-.08 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.56-.35zM12 0C5.4 0 0 5.4 0 12c0 2.11.55 4.11 1.51 5.84L0 24l6.32-1.66C8.02 23.15 9.96 24 12 24c6.6 0 12-5.4 12-12S18.6 0 12 0z",
              props.onWhatsApp
            )}
            {appBtn(
              "tg",
              "Telegram",
              "#229ed9",
              "M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z",
              props.onTelegram
            )}
            {appBtn(
              "fb",
              "Facebook",
              "#1877f2",
              "M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.96h-1.51c-1.49 0-1.95.93-1.95 1.88v2.27h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07z",
              props.onFacebook
            )}
            {appBtn("link", "Copy link", "var(--input-bg)", PM_IC.link, props.onCopy, "var(--text)")}
            {appBtn("more", "More", "var(--input-bg)", PM_IC.more, props.onMore, "var(--text)")}
          </div>
        </div>
      </div>

      {panel === "dest" && (
        <div className="pm-backdrop open" style={{ zIndex: 3100 }} onClick={() => setPanel("")}>
          <div className="pm-sheet pm-full" onClick={(e) => e.stopPropagation()}>
            <div className="pm-full-head">
              <button className="pm-back inline" onClick={() => setPanel("")}>
                <PmIcon d={PM_IC.back} />
              </button>
              <b>Select destination</b>
            </div>
            <button className="pm-dest on" onClick={() => setPanel("")}>
              <PmIcon d={PM_IC.feed} /> Share to Feed
              <span className="pm-radio on" />
            </button>
            <button className="pm-dest" onClick={() => props.onUnavailable("Sharing to stories")}>
              <PmIcon d={PM_IC.story} /> Your story
            </button>
            <button className="pm-dest" onClick={() => props.onUnavailable("Sharing on a friend's profile")}>
              <PmIcon d={PM_IC.people} /> On a friend&apos;s profile
            </button>
            <button className="pm-dest" onClick={() => props.onUnavailable("Sharing in a group")}>
              <PmIcon d={PM_IC.group} /> In a group
            </button>
          </div>
        </div>
      )}

      {panel === "aud" && (
        <ChoiceSheet
          zIndex={3100}
          title="Who can see your post?"
          subtitle="Your post will appear in Feed, on your profile and in search results."
          value={audience}
          showDefault
          defaultChecked={setDefault}
          options={[
            { value: "public", label: "Public", sub: "Anyone on or off MeBook", icon: PM_IC.globe },
            { value: "friends", label: "Friends", sub: "Your MeBook friends", icon: PM_IC.people },
            { value: "only_me", label: "Only me", sub: "Only you can see this", icon: PM_IC.lock },
          ]}
          onBack={() => setPanel("")}
          onDone={(v, d) => {
            setAudience(v)
            setSetDefault(d)
            setPanel("")
          }}
        />
      )}
    </>
  )
}

/* ---- Own-post "..." menu (Facebook style, grouped) ---- */
function PostMenuSheet(props: {
  post: any
  pinned: boolean
  saved: boolean
  archived: boolean
  muted: boolean
  onClose: () => void
  onAction: (key: string) => void
}) {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true))
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      cancelAnimationFrame(id)
      document.body.style.overflow = prev
    }
  }, [])
  const close = (after?: () => void) => {
    setShown(false)
    setTimeout(() => {
      props.onClose()
      if (after) after()
    }, 200)
  }
  type Row = { key: string; icon: string; label: string; sub?: string; danger?: boolean }
  const g1: Row[] = [
    { key: "pin", icon: PM_IC.pin, label: props.pinned ? "Unpin post" : "Pin post" },
    {
      key: "save",
      icon: PM_IC.bookmark,
      label: props.saved ? "Unsave post" : "Save post",
      sub: props.saved ? "Remove this from your saved items." : "Add this to your saved items.",
    },
    { key: "edit", icon: PM_IC.edit, label: "Edit post" },
    {
      key: "product",
      icon: PM_IC.link,
      label: "Manage product link",
      sub: "Add, update or remove an affiliate product link.",
    },
    { key: "comment", icon: PM_IC.comment, label: "Who can comment on your post?" },
    { key: "privacy", icon: PM_IC.globe, label: "Edit privacy" },
    { key: "archive", icon: PM_IC.archive, label: props.archived ? "Restore from archive" : "Move to archive" },
    {
      key: "bin",
      icon: PM_IC.trash,
      label: "Move to bin",
      sub: "Items in your bin are deleted after 30 days.",
    },
    {
      key: "notif",
      icon: props.muted ? PM_IC.bell : PM_IC.bellOff,
      label: props.muted ? "Turn on notifications for this post" : "Turn off notifications for this post",
    },
    { key: "copy", icon: PM_IC.link, label: "Copy link" },
  ]
  const g2: Row[] = [
    { key: "ad_code", icon: PM_IC.people, label: "Share partnership ad code" },
    { key: "ad", icon: PM_IC.megaphone, label: "Create ad" },
  ]
  const renderRow = (r: Row) => (
    <button
      key={r.key}
      className={`pm-row${r.danger ? " danger" : ""}`}
      onClick={() => close(() => props.onAction(r.key))}
    >
      <PmIcon d={r.icon} />
      <span className="pm-row-txt">
        {r.label}
        {r.sub && <small>{r.sub}</small>}
      </span>
    </button>
  )
  return (
    <div className={`pm-backdrop${shown ? " open" : ""}`} onClick={() => close()}>
      <div className="pm-sheet pm-menu" onClick={(e) => e.stopPropagation()}>
        <div className="rx-sheet-grip" />
        <div className="pm-menu-scroll">
          <div className="pm-card">{g1.map(renderRow)}</div>
          <div className="pm-card">{g2.map(renderRow)}</div>
        </div>
      </div>
    </div>
  )
}

/* ---- Manage posts: Archived + Bin ---- */
function ManageSheet(props: {
  posts: any[]
  onClose: () => void
  onRestore: (postId: string) => void
  onDeleteForever: (postId: string) => void
}) {
  const [shown, setShown] = useState(false)
  const [tab, setTab] = useState<"archived" | "bin">("archived")
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true))
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      cancelAnimationFrame(id)
      document.body.style.overflow = prev
    }
  }, [])
  const close = () => {
    setShown(false)
    setTimeout(props.onClose, 220)
  }
  const archived = props.posts.filter((p) => p.archived && !p.binnedAt)
  const bin = props.posts.filter((p) => !!p.binnedAt)
  const list = tab === "archived" ? archived : bin
  return (
    <div className={`pm-backdrop${shown ? " open" : ""}`} onClick={close}>
      <div className="pm-sheet pm-manage" onClick={(e) => e.stopPropagation()}>
        <div className="rx-sheet-grip" />
        <div className="pm-manage-head">Manage posts</div>
        <div className="rx-tabs">
          <button
            className={`rx-tab${tab === "archived" ? " active" : ""}`}
            style={{ borderBottomColor: tab === "archived" ? "#1877f2" : "transparent" }}
            onClick={() => setTab("archived")}
          >
            Archived {archived.length}
          </button>
          <button
            className={`rx-tab${tab === "bin" ? " active" : ""}`}
            style={{ borderBottomColor: tab === "bin" ? "#1877f2" : "transparent" }}
            onClick={() => setTab("bin")}
          >
            Bin {bin.length}
          </button>
        </div>
        {tab === "bin" && <div className="pm-manage-note">Items in your bin are deleted after 30 days.</div>}
        <div className="pm-manage-list">
          {list.length === 0 ? (
            <div className="rx-empty">{tab === "archived" ? "No archived posts" : "Bin is empty"}</div>
          ) : (
            list.map((p) => {
              const sp = p.sharedPost
              const thumb = p.image || sp?.image || ""
              const text = (p.caption || sp?.caption || p.movie || "Post").slice(0, 90)
              return (
                <div className="pm-manage-row" key={p.id}>
                  {thumb ? <img src={thumb} alt="" /> : <span className="pm-manage-ph">📝</span>}
                  <div className="pm-manage-info">
                    <b>{text}</b>
                    <small>{timeAgo(p.createdAt)}</small>
                  </div>
                  <button className="pm-manage-btn" onClick={() => props.onRestore(p.id)}>
                    Restore
                  </button>
                  {tab === "bin" && (
                    <button className="pm-manage-btn danger" onClick={() => props.onDeleteForever(p.id)}>
                      Delete
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

/* ---- Product link dialog ---- */
function LinkDialog(props: {
  value: string
  onSave: (v: string) => void
  onClose: () => void
}) {
  const [v, setV] = useState(props.value)
  return (
    <div className="mb-modal-backdrop" onClick={props.onClose}>
      <div className="mb-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mb-modal-head">
          <b>Product link</b>
          <button className="mb-modal-x" onClick={props.onClose} title="Close">
            <svg viewBox="0 0 24 24">
              <path d={PM_IC.close} />
            </svg>
          </button>
        </div>
        <div style={{ padding: "0 16px" }}>
          <input
            className="mb-modal-textarea"
            style={{ minHeight: 0, height: 46, resize: "none" }}
            placeholder="https://example.com/product"
            value={v}
            autoFocus
            onChange={(e) => setV(e.target.value)}
          />
          <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "8px 0 0" }}>
            Leave empty and save to remove the link.
          </p>
        </div>
        <button className="mb-modal-save" onClick={() => props.onSave(v.trim())}>
          Save
        </button>
      </div>
    </div>
  )
}

/* ============================================================
CHAT REACTION PICKER
============================================================ */

function ChatReactionPicker({
  anchorRect,
  open,
  onReact,
}: {
  anchorRect: { x: number; y: number; width: number } | null
  open: boolean
  onReact: (reactionKey: string, emoji: string) => void
}) {
  if (!anchorRect) return null
  return (
    <div
      className={`chat-reaction-picker${open ? " open" : ""}`}
      style={{
        left: Math.max(8, Math.min(anchorRect.x - 100, window.innerWidth - 260)),
        top: Math.max(70, anchorRect.y - 56),
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {CHAT_REACTIONS.map((r) => (
        <button key={r.key} type="button" title={r.label} onClick={() => onReact(r.key, r.emoji)}>
          {r.emoji}
        </button>
      ))}
    </div>
  )
}

/* ============================================================
   SPLASH SCREEN COMPONENT
   ============================================================ */


/* ============================================================
POST CAPTION (2 lines + See more), PHOTO VIEWER, ACTION SHEET
============================================================ */

function PostCaption({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)
  const [clamped, setClamped] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || expanded) return
    const check = () => setClamped(el.scrollHeight - el.clientHeight > 1)
    check()
    let ro: ResizeObserver | null = null
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(check)
      ro.observe(el)
    } else {
      window.addEventListener("resize", check)
    }
    return () => {
      if (ro) ro.disconnect()
      else window.removeEventListener("resize", check)
    }
  }, [text, expanded])

  return (
    <div className="mb-post-caption">
      <div
        ref={ref}
        className={`mb-cap-text${expanded ? " expanded" : " clamp"}`}
        onClick={() => {
          if (!expanded || !clamped) return
          const sel = typeof window !== "undefined" ? window.getSelection()?.toString() : ""
          if (sel) return
          setExpanded(false)
        }}
      >
        {text}
      </div>
      {!expanded && clamped && (
        <button className="mb-see-more" onClick={() => setExpanded(true)}>
          See more
        </button>
      )}
      {expanded && clamped && (
        <button className="mb-see-more" onClick={() => setExpanded(false)}>
          See less
        </button>
      )}
    </div>
  )
}

/* ===== Facebook-style time text: "Yesterday at 4:50 PM" ===== */
function fbPhotoTime(ts: any): string {
  if (!ts) return ""
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  if (isNaN(d.getTime())) return ""
  const t = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
  const now = new Date()
  const dayStart = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const days = Math.round((dayStart(now) - dayStart(d)) / 86400000)
  if (days === 0) return `Today at ${t}`
  if (days === 1) return `Yesterday at ${t}`
  const opts: any = { month: "short", day: "numeric" }
  if (d.getFullYear() !== now.getFullYear()) opts.year = "numeric"
  return `${d.toLocaleDateString([], opts)} at ${t}`
}

type PhotoStats = { likes: number; comments: number; shares: number; reactionKeys: string[] }

function PhotoViewer({
  src,
  caption,
  authorName,
  authorAvatar,
  time,
  stats,
  onLike,
  onComment,
  onShare,
  onReport,
  onToast,
  onClose,
}: {
  src: string
  caption?: string
  authorName?: string
  authorAvatar?: string
  time?: string
  stats?: PhotoStats
  onLike?: () => void
  onComment?: () => void
  onShare?: () => void
  onReport?: () => void
  onToast?: (title: string, msg?: string, type?: "success" | "error" | "info") => void
  onClose: () => void
}) {
  const [zoom, setZoom] = useState(false)
  const [uiHidden, setUiHidden] = useState(false)
  const [sheet, setSheet] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const sheetRef = useRef(false)
  sheetRef.current = sheet

  useEffect(() => {
    // Escape key ও phone back button — দুটোতেই: sheet খোলা থাকলে sheet বন্ধ, নাহলে viewer বন্ধ
    const back = () => {
      if (sheetRef.current) setSheet(false)
      else closeRef.current()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") back()
    }
    window.addEventListener("keydown", onKey)
    window.addEventListener("mb-viewer-back", back)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("mb-viewer-back", back)
      document.body.style.overflow = prevOverflow
    }
  }, [])

  const savePhoto = async () => {
    setSheet(false)
    try {
      const r = await fetch(src, { mode: "cors" })
      if (!r.ok) throw new Error("fetch failed")
      const b = await r.blob()
      const ext = (b.type.split("/")[1] || "jpg").split("+")[0]
      const url = URL.createObjectURL(b)
      const a = document.createElement("a")
      a.href = url
      a.download = `mebook-${Date.now()}.${ext}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 4000)
      onToast?.("Saved", "Photo saved to your phone", "success")
    } catch {
      try {
        const a = document.createElement("a")
        a.href = src
        a.download = `mebook-${Date.now()}.jpg`
        a.target = "_blank"
        a.rel = "noopener"
        document.body.appendChild(a)
        a.click()
        a.remove()
        onToast?.("Downloading", "If it doesn't start, long-press the photo to save", "info")
      } catch {
        onToast?.("Error", "Could not save this photo", "error")
      }
    }
  }

  const shareExternal = async () => {
    setSheet(false)
    try {
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share({
          title: authorName ? `${authorName} on MeBook` : "MeBook photo",
          text: caption ? caption.slice(0, 120) : undefined,
          url: src,
        })
        return
      }
    } catch (e: any) {
      if (e && e.name === "AbortError") return
    }
    try {
      await navigator.clipboard.writeText(src)
      onToast?.("Link copied", "Photo link copied to clipboard", "success")
    } catch {
      onToast?.("Error", "Sharing is not supported on this device", "error")
    }
  }

  const reportPhoto = () => {
    setSheet(false)
    if (onReport) onReport()
    else onToast?.("Reported", "Thanks! We'll review this photo", "success")
  }

  const cap = caption || ""
  const longCap = cap.length > 90 || (cap.match(/\n/g) || []).length >= 2
  const shownCap = !longCap || expanded ? cap : cap.slice(0, 90).split("\n")[0] + "… "

  return (
    <div className={"mb-pv" + (uiHidden ? " hide" : "")} role="dialog" aria-modal="true">
      <div className="mb-pv-stage" onClick={() => { if (!sheet) setUiHidden((h) => !h) }}>
        <img
          src={src}
          alt=""
          draggable={false}
          style={{ transform: zoom ? "scale(2.2)" : "none" }}
          onDoubleClick={(e) => { e.stopPropagation(); setZoom((z) => !z) }}
        />
      </div>

      {/* top bar: X (left) + 3 dots (right) */}
      <div className="mb-pv-top">
        <button className="mb-pv-icon" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
        <button className="mb-pv-icon" onClick={() => setSheet(true)} aria-label="More">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="4.5" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="19.5" r="2" />
          </svg>
        </button>
      </div>

      {/* bottom info: name, time, caption, like/comment/share */}
      {(authorName || cap || stats) && (
        <div className="mb-pv-bottom">
          {authorName ? <div className="mb-pv-name">{authorName}</div> : null}
          {time ? (
            <div className="mb-pv-time">
              <span>{time}</span>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54A1.99 1.99 0 0 0 16 16h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
              </svg>
            </div>
          ) : null}
          {cap ? (
            <div className="mb-pv-caption">
              {shownCap}
              {longCap && !expanded ? (
                <button className="mb-pv-more" onClick={() => setExpanded(true)}>See more</button>
              ) : null}
            </div>
          ) : null}

          {stats ? (
            <div className="mb-pv-stats">
              <div className="mb-pv-stats-left">
                <button className="mb-pv-stat" onClick={onLike}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
                    <path d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3zm0 0 4-7a2 2 0 0 1 2 2v3.5h5.2a2 2 0 0 1 1.96 2.4l-1.2 6A2 2 0 0 1 17 20H7" />
                  </svg>
                  <span>{stats.likes}</span>
                </button>
                <button className="mb-pv-stat" onClick={onComment}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
                    <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.6-.8L3 21l1.9-5.1A8.4 8.4 0 0 1 3.5 11.5 8.5 8.5 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5z" />
                  </svg>
                  <span>{stats.comments}</span>
                </button>
                <button className="mb-pv-stat" onClick={onShare}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
                    <path d="M14 9V5l7 7-7 7v-4.1c-5 0-8.5 1.6-11 5.1 1-5 4-10 11-11z" />
                  </svg>
                  <span>{stats.shares}</span>
                </button>
              </div>
              {stats.likes > 0 && stats.reactionKeys.length > 0 ? (
                <div className="mb-pv-rx" onClick={onLike}>
                  {stats.reactionKeys.slice(0, 3).map((k, i) => (
                    <span key={k} style={{ marginLeft: i ? -6 : 0, zIndex: 5 - i }}>
                      <ReactionIcon k={k} size={24} ring />
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      )}

      {/* 3-dot bottom sheet: Save to phone / Share external / Report photo */}
      {sheet && (
        <>
          <div className="mb-pv-dim" onClick={() => setSheet(false)} />
          <div className="mb-pv-sheet" role="menu">
            <button className="mb-pv-sheet-item" onClick={savePhoto}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v12m0 0-4.5-4.5M12 15l4.5-4.5M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
              </svg>
              <span>Save to phone</span>
            </button>
            <button className="mb-pv-sheet-item" onClick={shareExternal}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
                <path d="M14 9V5l7 7-7 7v-4.1c-5 0-8.5 1.6-11 5.1 1-5 4-10 11-11z" />
              </svg>
              <span>Share external</span>
            </button>
            <button className="mb-pv-sheet-item" onClick={reportPhoto}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
                <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.6-.8L3 21l1.9-5.1A8.4 8.4 0 0 1 3.5 11.5 8.5 8.5 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5z" />
                <path d="M12 8v4" />
                <circle cx="12" cy="15.2" r=".6" fill="currentColor" />
              </svg>
              <span>Report photo</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}

type SheetItem = {
  label: string
  icon: React.ReactNode
  danger?: boolean
  onClick: () => void
}

function ActionSheet({ items, onClose }: { items: SheetItem[]; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div className="mb-sheet-backdrop" onClick={onClose}>
      <div className="mb-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="mb-sheet-grip" />
        {items.map((it, i) => (
          <button
            key={i}
            className={`mb-sheet-item${it.danger ? " danger" : ""}`}
            onClick={() => {
              onClose()
              it.onClick()
            }}
          >
            {it.icon}
            {it.label}
          </button>
        ))}
      </div>
    </div>
  )
}

const ICON_EDIT = (
  <svg viewBox="0 0 24 24">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
  </svg>
)
const ICON_TRASH = (
  <svg viewBox="0 0 24 24">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
  </svg>
)
const ICON_REPLY = (
  <svg viewBox="0 0 24 24">
    <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z" />
  </svg>
)
const ICON_COPY = (
  <svg viewBox="0 0 24 24">
    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
  </svg>
)
const ICON_DOTS = (
  <svg viewBox="0 0 24 24">
    <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
  </svg>
)


/* ============================================================
YOUTUBE POST PLAYER (Shorts 9:16 / video 16:9, custom controls)
============================================================ */

let ytApiPromise: Promise<any> | null = null
function loadYouTubeApi(): Promise<any> {
  const w = window as any
  if (w.YT && w.YT.Player) return Promise.resolve(w.YT)
  if (ytApiPromise) return ytApiPromise
  ytApiPromise = new Promise((resolve, reject) => {
    const prev = w.onYouTubeIframeAPIReady
    w.onYouTubeIframeAPIReady = () => {
      try { prev && prev() } catch {}
      resolve(w.YT)
    }
    const tag = document.createElement("script")
    tag.src = "https://www.youtube.com/iframe_api"
    tag.async = true
    tag.onerror = () => {
      ytApiPromise = null
      reject(new Error("YouTube API failed to load"))
    }
    document.head.appendChild(tag)
  })
  return ytApiPromise
}

// Only one YouTube post plays at a time
let activeYTPause: (() => void) | null = null

function fmtYT(sec: number) {
  const s = Math.max(0, Math.floor(sec || 0))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}

// Detects black bars (top/bottom) baked into a Short's thumbnail so we can crop them away
let ytMutePref = false // user mute korle sob video mute, unmute korle sob video sound e
const ytCropCache = new Map<string, { t: number; b: number } | null>()
function detectShortCrop(src: string): Promise<{ t: number; b: number } | null> {
  return new Promise((resolve) => {
    try {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        try {
          const w = 200
          const h = Math.max(1, Math.round((w * img.naturalHeight) / img.naturalWidth))
          const c = document.createElement("canvas")
          c.width = w
          c.height = h
          const ctx = c.getContext("2d")
          if (!ctx) return resolve(null)
          ctx.drawImage(img, 0, 0, w, h)
          const d = ctx.getImageData(0, 0, w, h).data
          const rowLit = (y: number) => {
            let lit = 0
            for (let x = 0; x < w; x++) {
              const i = (y * w + x) * 4
              if (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2] > 38) lit++
            }
            return lit / w > 0.03
          }
          let t = 0
          while (t < h && !rowLit(t)) t++
          if (t >= h) return resolve(null)
          let b = h - 1
          while (b > t && !rowLit(b)) b--
          const ft = Math.max(0, (t - 1) / h)
          const fb = Math.min(1, (b + 2) / h)
          if (ft < 0.02 && fb > 0.98) return resolve(null)
          if (fb - ft < 0.2) return resolve(null)
          resolve({ t: ft, b: fb })
        } catch {
          resolve(null)
        }
      }
      img.onerror = () => resolve(null)
      img.src = src
    } catch {
      resolve(null)
    }
  })
}

function YouTubePost({
  videoId,
  isShort,
  thumb,
  url,
}: {
  videoId: string
  isShort: boolean
  thumb?: string
  url?: string
}) {
  const [active, setActive] = useState(false)
  const [started, setStarted] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [cur, setCur] = useState(0)
  const [dur, setDur] = useState(0)
  const [err, setErr] = useState(false)
  const [canFs, setCanFs] = useState(false)
  const [flash, setFlash] = useState<{ label: string; n: number } | null>(null)
  const [crop, setCrop] = useState<{ t: number; b: number } | null>(
    isShort ? ytCropCache.get(videoId) ?? null : null
  )

  const activeRef = useRef(false)
  const errRef = useRef(false)
  const userPausedRef = useRef(false)
  const wantMutedRef = useRef(ytMutePref)

  const rootRef = useRef<HTMLDivElement>(null)
  const mountRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)
  const flashTimer = useRef<any>(null)
  const shortRef = useRef(isShort)
  shortRef.current = isShort
  const pauseSelf = useRef(() => {
    try { playerRef.current?.pauseVideo() } catch {}
  }).current

  const thumbUrl = thumb || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
  const watchUrl = url || `https://www.youtube.com/watch?v=${videoId}`

  activeRef.current = active
  errRef.current = err

  // Short: find & crop the black bars (top/bottom)
  useEffect(() => {
    if (!isShort) {
      setCrop(null)
      return
    }
    if (ytCropCache.has(videoId)) {
      setCrop(ytCropCache.get(videoId) ?? null)
      return
    }
    let cancelled = false
    detectShortCrop(`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`).then((c) => {
      ytCropCache.set(videoId, c)
      if (!cancelled) setCrop(c)
    })
    return () => {
      cancelled = true
    }
  }, [isShort, videoId])

  // Auto play (muted) when the post is mostly visible, pause when it leaves the screen
  useEffect(() => {
    const el = rootRef.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0]
        const ratio = e.intersectionRatio
        if (e.isIntersecting && ratio >= 0.6) {
          if (errRef.current) return
          if (!activeRef.current) {
            setActive(true)
          } else if (!userPausedRef.current) {
            try { playerRef.current?.playVideo() } catch {}
          }
        } else if (ratio < 0.25) {
          pauseSelf()
        }
      },
      { threshold: [0, 0.25, 0.6, 0.8] }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [pauseSelf])

  useEffect(() => {
    setCanFs(!isShort && typeof document !== "undefined" && !!document.fullscreenEnabled)
  }, [isShort])

  // Create / destroy the YouTube player
  useEffect(() => {
    if (!active) return
    let cancelled = false
    let player: any = null
    let tick: any = null

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled || !mountRef.current) return
        const host = document.createElement("div")
        mountRef.current.appendChild(host)
        player = new YT.Player(host, {
          width: "100%",
          height: "100%",
          videoId,
          playerVars: {
            autoplay: 1,
            controls: 0,
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
            fs: 0,
            iv_load_policy: 3,
            disablekb: 1,
            mute: ytMutePref ? 1 : 0,
            origin: window.location.origin,
          },
          events: {
            onReady: (e: any) => {
              if (cancelled) return
              playerRef.current = e.target
              setDur(e.target.getDuration() || 0)
              try { e.target.playVideo() } catch {}
              // browser sound-autoplay block korle shudhu tokhon muted kore chalabe
              setTimeout(() => {
                if (cancelled || userPausedRef.current) return
                try {
                  const stt = e.target.getPlayerState()
                  if (stt !== 1 && stt !== 3) {
                    e.target.mute()
                    setMuted(true)
                    e.target.playVideo()
                  }
                } catch {}
              }, 1200)
            },
            onAutoplayBlocked: () => {
              if (cancelled) return
              try {
                player.mute()
                setMuted(true)
                player.playVideo()
              } catch {}
            },
            onStateChange: (e: any) => {
              if (cancelled) return
              const st = e.data
              if (st === YT.PlayerState.PLAYING) {
                setPlaying(true)
                setStarted(true)
                setMuted(!!player?.isMuted?.())
                setDur(player?.getDuration?.() || 0)
                if (activeYTPause && activeYTPause !== pauseSelf) activeYTPause()
                activeYTPause = pauseSelf
              } else if (st === YT.PlayerState.PAUSED) {
                setPlaying(false)
              } else if (st === YT.PlayerState.ENDED) {
                if (shortRef.current) {
                  try { player.seekTo(0, true); player.playVideo() } catch {}
                } else {
                  setPlaying(false)
                }
              }
            },
            onError: () => {
              if (!cancelled) setErr(true)
            },
          },
        })
        tick = setInterval(() => {
          const p = playerRef.current
          if (!p || !p.getCurrentTime) return
          try {
            setCur(p.getCurrentTime() || 0)
            const d = p.getDuration()
            if (d) setDur(d)
          } catch {}
        }, 250)
      })
      .catch(() => {
        if (!cancelled) setErr(true)
      })

    return () => {
      cancelled = true
      if (tick) clearInterval(tick)
      try { player?.destroy() } catch {}
      playerRef.current = null
      if (activeYTPause === pauseSelf) activeYTPause = null
      if (mountRef.current) mountRef.current.innerHTML = ""
      setStarted(false)
      setPlaying(false)
      setCur(0)
    }
  }, [active, videoId, pauseSelf])

  // Pause when scrolled mostly out of view; free the iframe when far away
  useEffect(() => {
    const el = rootRef.current
    if (!active || !el || typeof IntersectionObserver === "undefined") return
    const near = new IntersectionObserver(
      (entries) => {
        const e = entries[0]
        if (e.isIntersecting && e.intersectionRatio < 0.25) pauseSelf()
      },
      { threshold: [0, 0.25, 0.5] }
    )
    const far = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) setActive(false)
      },
      { rootMargin: "1400px 0px 1400px 0px" }
    )
    near.observe(el)
    far.observe(el)
    return () => {
      near.disconnect()
      far.disconnect()
    }
  }, [active, pauseSelf])

  const showFlash = (label: string) => {
    setFlash((f) => ({ label, n: (f?.n || 0) + 1 }))
    if (flashTimer.current) clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setFlash(null), 650)
  }
  useEffect(() => () => { if (flashTimer.current) clearTimeout(flashTimer.current) }, [])

  const togglePlay = () => {
    const p = playerRef.current
    if (!p) return
    try {
      if (p.getPlayerState() === 1) {
        userPausedRef.current = true
        p.pauseVideo()
        showFlash("❚❚")
      } else {
        userPausedRef.current = false
        p.playVideo()
        showFlash("▶")
      }
    } catch {}
  }

  const skip = (delta: number) => {
    const p = playerRef.current
    if (!p) return
    try {
      const d = p.getDuration() || dur || 0
      let t = (p.getCurrentTime() || 0) + delta
      t = Math.max(0, d ? Math.min(d - 0.3, t) : t)
      p.seekTo(t, true)
      setCur(t)
      showFlash(delta < 0 ? "⏪ 10s" : "10s ⏩")
    } catch {}
  }

  const toggleMute = () => {
    const p = playerRef.current
    if (!p) return
    try {
      if (p.isMuted()) { p.unMute(); setMuted(false); wantMutedRef.current = false; ytMutePref = false }
      else { p.mute(); setMuted(true); wantMutedRef.current = true; ytMutePref = true }
    } catch {}
  }

  const toggleFullscreen = () => {
    const el = rootRef.current as any
    if (!el) return
    try {
      if (document.fullscreenElement) document.exitFullscreen()
      else el.requestFullscreen && el.requestFullscreen()
    } catch {}
  }

  return (
    <div ref={rootRef} className={`mb-yt ${isShort ? "short" : "video"}${isShort && crop ? " cropped" : ""}`}>
      <div
        className="mb-yt-stage"
        style={
          isShort && crop
            ? ({
                ["--yt-r" as any]: ((crop.b - crop.t) * 16) / 9,
                aspectRatio: String(9 / 16 / (crop.b - crop.t)),
              } as React.CSSProperties)
            : undefined
        }
      >
        <div
          className="mb-yt-frame"
          style={
            isShort && crop
              ? {
                  height: `${100 / (crop.b - crop.t)}%`,
                  top: `${-(crop.t / (crop.b - crop.t)) * 100}%`,
                  bottom: "auto",
                }
              : undefined
          }
        >
          <div ref={mountRef} style={{ position: "absolute", inset: 0 }} />

          {!started && (
            <>
              <img className="mb-yt-thumb" src={thumbUrl} alt="" loading="lazy" />
              <div className="mb-yt-shade" />
            </>
          )}
        </div>

        <span className="mb-yt-badge">
          <i />
          {isShort ? "Shorts" : "Video"}
        </span>

        {!active && (
          <button
            className="mb-yt-bigplay"
            onClick={() => {
              userPausedRef.current = false
              setActive(true)
            }}
            title="Play"
          >
            <svg viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        )}

        {active && !started && !err && <div className="mb-yt-spinner" />}

        {active && !err && <div className="mb-yt-tap" onClick={togglePlay} />}

        {flash && (
          <div className="mb-yt-flash" key={flash.n}>
            {flash.label}
          </div>
        )}

        {active && started && !err && (
          <div className="mb-yt-bar" onClick={(e) => e.stopPropagation()}>
            <input
              className="mb-yt-seek"
              type="range"
              min={0}
              max={dur || 1}
              step={0.1}
              value={Math.min(cur, dur || 1)}
              onChange={(e) => {
                const t = Number(e.target.value)
                setCur(t)
                try { playerRef.current?.seekTo(t, true) } catch {}
              }}
            />
            <div className="mb-yt-row">
              <button className="mb-yt-btn" onClick={() => skip(-10)} title="Back 10 seconds">
                <svg viewBox="0 0 24 24">
                  <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                </svg>
                10
              </button>
              <button className="mb-yt-btn" onClick={togglePlay} title={playing ? "Pause" : "Play"}>
                <svg viewBox="0 0 24 24">
                  {playing ? <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /> : <path d="M8 5v14l11-7z" />}
                </svg>
              </button>
              <button className="mb-yt-btn" onClick={() => skip(10)} title="Forward 10 seconds">
                10
                <svg viewBox="0 0 24 24" style={{ transform: "scaleX(-1)" }}>
                  <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                </svg>
              </button>
              <span className="mb-yt-time">
                {fmtYT(cur)} / {fmtYT(dur)}
              </span>
              <button className="mb-yt-btn" onClick={toggleMute} title={muted ? "Unmute" : "Mute"}>
                <svg viewBox="0 0 24 24">
                  {muted ? (
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.8 8.8 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                  ) : (
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  )}
                </svg>
              </button>
              {canFs && (
                <button className="mb-yt-btn" onClick={toggleFullscreen} title="Fullscreen">
                  <svg viewBox="0 0 24 24">
                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {err && (
          <div className="mb-yt-err">
            <span>This video can’t be played here.</span>
            <a href={watchUrl} target="_blank" rel="noopener noreferrer">
              Watch on YouTube
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

/* ============================================================
SHORTS PAGE (Facebook Reels style: YouTube Shorts shared on MeBook)
============================================================ */

let shActivePlayer: any = null // sync mute/unmute from the click handler (browser autoplay rules)

function shFmt(n: number) {
  if (!n || n < 0) return "0"
  if (n >= 1000000) return (n / 1000000).toFixed(n >= 10000000 ? 0 : 1).replace(/\.0$/, "") + "M"
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "k"
  return String(n)
}

function ShortItem(props: {
  post: any
  active: boolean
  paused: boolean
  muted: boolean
  setMuted: (m: boolean) => void
  myReaction?: string
  likesCount: number
  commentsCount: number
  sharesCount: number
  saved: boolean
  verified: boolean
  likeProps: any
  onComment: () => void
  onShare: () => void
  onSave: () => void
  onMore: () => void
  onOpenProfile: () => void
}) {
  const { post, active } = props
  const videoId: string = post.youtube?.videoId || ""

  const [started, setStarted] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [cur, setCur] = useState(0)
  const [dur, setDur] = useState(0)
  const [err, setErr] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [flash, setFlash] = useState<{ label: string; n: number } | null>(null)
  const [crop, setCrop] = useState<{ t: number; b: number } | null>(ytCropCache.get(videoId) ?? null)

  const mountRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)
  const userPausedRef = useRef(false)
  const pausedRef = useRef(props.paused)
  const mutedRef = useRef(props.muted)
  const setMutedRef = useRef(props.setMuted)
  const flashTimer = useRef<any>(null)
  pausedRef.current = props.paused
  mutedRef.current = props.muted
  setMutedRef.current = props.setMuted
  const pauseSelf = useRef(() => {
    try { playerRef.current?.pauseVideo() } catch {}
  }).current

  const thumbUrl: string = post.image || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`

  // black bars (top/bottom) baked into the video are cropped away
  useEffect(() => {
    if (!videoId) return
    if (ytCropCache.has(videoId)) {
      setCrop(ytCropCache.get(videoId) ?? null)
      return
    }
    let cancelled = false
    detectShortCrop(`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`).then((c) => {
      ytCropCache.set(videoId, c)
      if (!cancelled) setCrop(c)
    })
    return () => {
      cancelled = true
    }
  }, [videoId])

  // create the player only for the visible short, destroy it when scrolled away
  useEffect(() => {
    if (!active || !videoId) return
    let cancelled = false
    let player: any = null
    let tick: any = null
    userPausedRef.current = false
    setErr(false)

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled || !mountRef.current) return
        const host = document.createElement("div")
        mountRef.current.appendChild(host)
        player = new YT.Player(host, {
          width: "100%",
          height: "100%",
          videoId,
          playerVars: {
            autoplay: 1,
            controls: 0,
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
            fs: 0,
            iv_load_policy: 3,
            disablekb: 1,
            mute: mutedRef.current ? 1 : 0,
            origin: window.location.origin,
          },
          events: {
            onReady: (e: any) => {
              if (cancelled) return
              playerRef.current = e.target
              shActivePlayer = e.target
              setDur(e.target.getDuration() || 0)
              if (!pausedRef.current) {
                try { e.target.playVideo() } catch {}
              }
              setTimeout(() => {
                if (cancelled || userPausedRef.current || pausedRef.current) return
                try {
                  const stt = e.target.getPlayerState()
                  if (stt !== 1 && stt !== 3) {
                    e.target.mute()
                    setMutedRef.current(true)
                    e.target.playVideo()
                  }
                } catch {}
              }, 1200)
            },
            onAutoplayBlocked: () => {
              if (cancelled) return
              try {
                player.mute()
                setMutedRef.current(true)
                player.playVideo()
              } catch {}
            },
            onStateChange: (e: any) => {
              if (cancelled) return
              const st = e.data
              if (st === YT.PlayerState.PLAYING) {
                setPlaying(true)
                setStarted(true)
                setMutedRef.current(!!player?.isMuted?.())
                setDur(player?.getDuration?.() || 0)
                if (activeYTPause && activeYTPause !== pauseSelf) activeYTPause()
                activeYTPause = pauseSelf
              } else if (st === YT.PlayerState.PAUSED) {
                setPlaying(false)
              } else if (st === YT.PlayerState.ENDED) {
                try { player.seekTo(0, true); player.playVideo() } catch {}
              }
            },
            onError: () => {
              if (!cancelled) setErr(true)
            },
          },
        })
        tick = setInterval(() => {
          const p = playerRef.current
          if (!p || !p.getCurrentTime) return
          try {
            setCur(p.getCurrentTime() || 0)
            const d = p.getDuration()
            if (d) setDur(d)
          } catch {}
        }, 250)
      })
      .catch(() => {
        if (!cancelled) setErr(true)
      })

    return () => {
      cancelled = true
      if (tick) clearInterval(tick)
      try { player?.destroy() } catch {}
      if (shActivePlayer === playerRef.current) shActivePlayer = null
      playerRef.current = null
      if (activeYTPause === pauseSelf) activeYTPause = null
      if (mountRef.current) mountRef.current.innerHTML = ""
      setStarted(false)
      setPlaying(false)
      setCur(0)
    }
  }, [active, videoId, pauseSelf])

  // pause while a popup (comments / share / menu) is open
  useEffect(() => {
    const p = playerRef.current
    if (!p) return
    try {
      if (props.paused) p.pauseVideo()
      else if (active && !userPausedRef.current) p.playVideo()
    } catch {}
  }, [props.paused, active])

  useEffect(() => {
    const p = playerRef.current
    if (!p) return
    try {
      if (props.muted) p.mute()
      else p.unMute()
    } catch {}
  }, [props.muted])

  // pause when the browser tab is hidden
  useEffect(() => {
    if (!active) return
    const onVis = () => {
      const p = playerRef.current
      if (!p) return
      try {
        if (document.hidden) p.pauseVideo()
        else if (!userPausedRef.current && !pausedRef.current) p.playVideo()
      } catch {}
    }
    document.addEventListener("visibilitychange", onVis)
    return () => document.removeEventListener("visibilitychange", onVis)
  }, [active])

  useEffect(() => () => { if (flashTimer.current) clearTimeout(flashTimer.current) }, [])

  const showFlash = (label: string) => {
    setFlash((f) => ({ label, n: (f?.n || 0) + 1 }))
    if (flashTimer.current) clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setFlash(null), 650)
  }

  const togglePlay = () => {
    const p = playerRef.current
    if (!p) return
    try {
      if (p.getPlayerState() === 1) {
        userPausedRef.current = true
        p.pauseVideo()
        showFlash("❚❚")
      } else {
        userPausedRef.current = false
        p.playVideo()
        showFlash("▶")
      }
    } catch {}
  }

  const ar = crop ? 9 / 16 / (crop.b - crop.t) : 9 / 16
  const frameStyle: React.CSSProperties | undefined = crop
    ? {
        height: `${100 / (crop.b - crop.t)}%`,
        top: `${-(crop.t / (crop.b - crop.t)) * 100}%`,
        bottom: "auto",
      }
    : undefined

  const isOfficial = post.isOfficial === true
  const avatar: string = isOfficial
    ? LOGO_URL
    : post.authorAvatar ||
      `https://ui-avatars.com/api/?background=16a34a&color=fff&name=${encodeURIComponent(post.authorName || "User")}`
  const cap: string = post.caption || ""
  const longCap = cap.length > 70 || cap.indexOf("\n") >= 0
  const reactColor = props.myReaction ? REACTIONS.find((r) => r.key === props.myReaction)?.color : undefined

  return (
    <div className="shp-box">
      <div className="shp-stage" style={{ ["--ar" as any]: ar } as React.CSSProperties}>
        <div className="shp-frame" style={frameStyle}>
          <div ref={mountRef} className="shp-mount" />
          {!started && <img className="shp-thumb" src={thumbUrl} alt="" />}
        </div>

        {active && !err && <div className="shp-tap" onClick={togglePlay} />}
        {active && !started && !err && <div className="mb-yt-spinner" />}
        {flash && (
          <div className="mb-yt-flash" key={flash.n}>
            {flash.label}
          </div>
        )}
        {err && (
          <div className="mb-yt-err">
            <span>This video can’t be played here.</span>
            <a href={post.youtube?.url || `https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noopener noreferrer">
              Watch on YouTube
            </a>
          </div>
        )}

        <div className="shp-shade" />

        <div className="shp-info">
          <div className="shp-user">
            <img src={avatar} alt="" onClick={props.onOpenProfile} />
            <div style={{ minWidth: 0 }}>
              <div className="shp-uname" onClick={props.onOpenProfile}>
                <span>{post.authorName || "User"}</span>
                {props.verified && (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="#22c55e" style={{ flexShrink: 0 }}>
                    <path d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69l-3.61.82.34 3.69L1 12l2.44 2.79-.34 3.7 3.61.82L8.6 22.5l3.4-1.47 3.4 1.46 1.89-3.19 3.61-.82-.34-3.69L23 12zm-12.91 4.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z" />
                  </svg>
                )}
              </div>
              <div className="shp-utime">{post.timeText || timeAgo(post.createdAt)}</div>
            </div>
          </div>
          {cap && (
            <div className={`shp-cap${expanded ? " open" : ""}`} onClick={() => longCap && setExpanded((v) => !v)}>
              {cap}
            </div>
          )}
        </div>

        <div className="shp-acts">
          <button
            className="shp-act"
            data-like-btn={post.id}
            style={reactColor ? { color: reactColor } : undefined}
            title="Tap to like, hold for reactions"
            {...(props.likeProps as any)}
          >
            {props.myReaction ? (
              <ReactionIcon k={props.myReaction} size={30} />
            ) : (
              <svg viewBox="0 0 24 24">
                <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91z" />
              </svg>
            )}
            <span>{shFmt(props.likesCount)}</span>
          </button>
          <button className="shp-act" onClick={props.onComment} title="Comments">
            <svg viewBox="0 0 24 24">
              <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z" />
            </svg>
            <span>{shFmt(props.commentsCount)}</span>
          </button>
          <button className="shp-act" onClick={props.onShare} title="Share">
            <svg viewBox="0 0 24 24">
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
            </svg>
            <span>{shFmt(props.sharesCount)}</span>
          </button>
          <button className={`shp-act${props.saved ? " on" : ""}`} onClick={props.onSave} title={props.saved ? "Unsave" : "Save"}>
            <svg viewBox="0 0 24 24">
              {props.saved ? (
                <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
              ) : (
                <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z" />
              )}
            </svg>
            <span>{props.saved ? "Saved" : "Save"}</span>
          </button>
          <button className="shp-act" onClick={props.onMore} title="More">
            <svg viewBox="0 0 24 24">
              <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </button>
        </div>

        {active && started && !err && (
          <input
            className="shp-seek"
            type="range"
            min={0}
            max={dur || 1}
            step={0.1}
            value={Math.min(cur, dur || 1)}
            onChange={(e) => {
              const t = Number(e.target.value)
              setCur(t)
              try { playerRef.current?.seekTo(t, true) } catch {}
            }}
          />
        )}
      </div>
    </div>
  )
}

function ShortsPage(props: {
  posts: any[]
  me: any
  postReactions: Record<string, Record<string, string>>
  savedIds: string[]
  paused: boolean
  startPostId?: string
  likeBtnProps: (postId: string) => any
  isVerifiedPost: (p: any) => boolean
  onComment: (postId: string) => void
  onShare: (postId: string) => void
  onSave: (postId: string) => void
  onCopy: (post: any) => void
  onOpenProfile: (uid: string) => void
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [order, setOrder] = useState<string[]>([])
  const [active, setActive] = useState(0)
  const [muted, setMutedState] = useState<boolean>(ytMutePref)
  const [moreFor, setMoreFor] = useState<any>(null)
  const rafRef = useRef(0)
  const commitRef = useRef<any>(null)
  const initRef = useRef(false)
  const pausedRef = useRef(props.paused)
  pausedRef.current = props.paused

  // the order is frozen when the page opens so new posts never shuffle what you are watching
  useEffect(() => {
    if (order.length === 0 && props.posts.length > 0) setOrder(props.posts.map((p: any) => p.id))
  }, [props.posts, order.length])

  const byId: Record<string, any> = {}
  props.posts.forEach((p: any) => { byId[p.id] = p })
  const list = order.map((id) => byId[id]).filter(Boolean)

  useEffect(() => {
    if (initRef.current || list.length === 0) return
    initRef.current = true
    const i = props.startPostId ? list.findIndex((p: any) => p.id === props.startPostId) : -1
    if (i > 0) {
      requestAnimationFrame(() => {
        const el = wrapRef.current
        if (el) {
          el.scrollTop = i * el.clientHeight
          setActive(i)
        }
      })
    }
  }, [list.length, props.startPostId])

  // lock page scroll behind the shorts
  useEffect(() => {
    const prevBody = document.body.style.overflow
    const prevHtml = document.documentElement.style.overflow
    document.body.style.overflow = "hidden"
    document.documentElement.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prevBody
      document.documentElement.style.overflow = prevHtml
    }
  }, [])

  // keyboard: arrow up / down
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return
      if (pausedRef.current) return
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return
      const el = wrapRef.current
      if (!el) return
      e.preventDefault()
      el.scrollBy({ top: (e.key === "ArrowDown" ? 1 : -1) * el.clientHeight, behavior: "smooth" })
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (commitRef.current) clearTimeout(commitRef.current)
  }, [])

  const onScroll = () => {
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0
      const el = wrapRef.current
      if (!el) return
      const h = el.clientHeight || 1
      const i = Math.max(0, Math.min(Math.max(0, list.length - 1), Math.round(el.scrollTop / h)))
      if (commitRef.current) clearTimeout(commitRef.current)
      commitRef.current = setTimeout(() => setActive(i), 110)
    })
  }

  const userToggleMute = () => {
    const m = !muted
    ytMutePref = m
    try {
      if (m) shActivePlayer?.mute()
      else shActivePlayer?.unMute()
    } catch {}
    setMutedState(m)
  }

  const anyPaused = props.paused || !!moreFor

  return (
    <div className="shp-root">
      <div className="shp-top">
        <div className="shp-title">
          <i />
          Shorts
        </div>
        <button className="shp-mute" onClick={userToggleMute} title={muted ? "Unmute" : "Mute"} aria-label={muted ? "Unmute" : "Mute"}>
          <svg viewBox="0 0 24 24">
            {muted ? (
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.8 8.8 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
            ) : (
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            )}
          </svg>
        </button>
      </div>

      <div className="shp-wrap" ref={wrapRef} onScroll={onScroll}>
        {list.length === 0 ? (
          <div className="shp-empty">
            <b>No shorts yet</b>
            <span>YouTube Shorts shared on MeBook will show up here.</span>
          </div>
        ) : (
          list.map((p: any, i: number) => {
            const reacts: Record<string, string> = p.reactions || props.postReactions[p.id] || {}
            const myReaction = props.me?.uid ? reacts[props.me.uid] : undefined
            const likesCount = Object.keys(reacts).length || (Array.isArray(p.likes) ? p.likes.length : 0)
            return (
              <div className="shp-item" key={p.id}>
                {Math.abs(i - active) <= 1 && (
                  <ShortItem
                    post={p}
                    active={i === active}
                    paused={anyPaused}
                    muted={muted}
                    setMuted={setMutedState}
                    myReaction={myReaction}
                    likesCount={likesCount}
                    commentsCount={Array.isArray(p.comments) ? p.comments.length : 0}
                    sharesCount={p.shares || 0}
                    saved={props.savedIds.includes(p.id)}
                    verified={props.isVerifiedPost(p)}
                    likeProps={props.likeBtnProps(p.id)}
                    onComment={() => props.onComment(p.id)}
                    onShare={() => props.onShare(p.id)}
                    onSave={() => props.onSave(p.id)}
                    onMore={() => setMoreFor(p)}
                    onOpenProfile={() => p.authorId && props.onOpenProfile(p.authorId)}
                  />
                )}
              </div>
            )
          })
        )}
      </div>

      {moreFor && (
        <div className="mb-sheet-backdrop" onClick={() => setMoreFor(null)}>
          <div className="mb-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mb-sheet-grip" />
            <button className="mb-sheet-item" onClick={() => { props.onSave(moreFor.id); setMoreFor(null) }}>
              <svg viewBox="0 0 24 24">
                <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z" />
              </svg>
              {props.savedIds.includes(moreFor.id) ? "Unsave video" : "Save video"}
            </button>
            <button className="mb-sheet-item" onClick={() => { const id = moreFor.id; setMoreFor(null); props.onShare(id) }}>
              <svg viewBox="0 0 24 24">
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
              </svg>
              Share
            </button>
            <button className="mb-sheet-item" onClick={() => { props.onCopy(moreFor); setMoreFor(null) }}>
              <svg viewBox="0 0 24 24">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
              </svg>
              Copy link
            </button>
            <a
              className="mb-sheet-item"
              style={{ textDecoration: "none", color: "inherit" }}
              href={moreFor.youtube?.url || `https://www.youtube.com/watch?v=${moreFor.youtube?.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMoreFor(null)}
            >
              <svg viewBox="0 0 24 24">
                <path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
              </svg>
              Open on YouTube
            </a>
            {moreFor.authorId && (
              <button className="mb-sheet-item" onClick={() => { const uid = moreFor.authorId; setMoreFor(null); props.onOpenProfile(uid) }}>
                <svg viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
                View profile
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function MeBookSplash() {
  return (
    <div className="mebook-splash">
      <div className="mebook-splash-logo-wrap">
        <img
          className="mebook-splash-logo-img"
          src="https://i.postimg.cc/rsBBsQWF/17832-removebg-preview.png"
          alt="MeBook"
        />
        <div className="mebook-splash-logo-text">
          <span className="me">Me</span>
          <span className="book">Book</span>
        </div>
      </div>

      <div className="mebook-splash-dots">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>

      <div className="mebook-splash-from">
        <span className="from-label">from</span>
        <span className="from-name">ELIX INDUSTRY</span>
      </div>
    </div>
  )
}

/* ============================================================
MAIN COMPONENT
============================================================ */



/* ============ PUSH PERMISSION BANNER ============ */
function PushPrompt({ perm, onEnable }: { perm: string; onEnable: () => void }) {
  if (perm !== "default" && perm !== "denied") return null
  const denied = perm === "denied"
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
        margin: "0 0 14px",
        padding: "12px 14px",
        borderRadius: 14,
        background: denied ? "rgba(255,89,105,.10)" : "rgba(24,119,242,.10)",
        border: `1px solid ${denied ? "rgba(255,89,105,.30)" : "rgba(24,119,242,.30)"}`,
        fontSize: 13.5,
        lineHeight: 1.45,
      }}
    >
      <div style={{ flex: 1, minWidth: 200 }}>
        <b>🔔 {denied ? "Notification বন্ধ আছে" : "Push notification চালু করুন"}</b>
        <div style={{ opacity: 0.8, marginTop: 2 }}>
          {denied
            ? "Browser/site settings থেকে Notifications → Allow করুন, তারপর page reload দিন।"
            : "নতুন like, comment, message বা update এলে সাথে সাথে জানতে পারবেন — সাইট বন্ধ থাকলেও।"}
        </div>
      </div>
      {!denied && (
        <button
          onClick={onEnable}
          style={{
            border: 0,
            borderRadius: 12,
            padding: "9px 16px",
            background: "#1877f2",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Enable
        </button>
      )}
    </div>
  )
}

/* ============================================================
STORIES — Facebook-style stories
(create + edit, view, reactions, viewers, 3-dots menus)
Firestore collection: "stories"
============================================================ */

const STORY_MS = 10000 // প্রতিটি story 10 seconds
const STORY_TTL = 24 * 60 * 60 * 1000 // 24 ঘন্টা পর expire

const ST_IC: Record<string, string> = {
  back: "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z",
  close: "M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
  more: "M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z",
  down: "M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z",
  up: "M7.41 15.41 12 10.83l4.59 4.58L18 14l-6-6-6 6z",
  music: "M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z",
  sticker: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-4 8c.83 0 1.5.67 1.5 1.5S8.83 13 8 13s-1.5-.67-1.5-1.5S7.17 10 8 10zm8 0c.83 0 1.5.67 1.5 1.5S16.83 13 16 13s-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zm-4 8c-2.03 0-3.8-1.21-4.58-2.95h9.16C15.8 16.79 14.03 18 12 18z",
  sparkle: "M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z",
  mention: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10h5v-2h-5c-4.34 0-8-3.66-8-8s3.66-8 8-8 8 3.66 8 8v1.43c0 .79-.71 1.57-1.5 1.57s-1.5-.78-1.5-1.57V12c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5c1.38 0 2.64-.56 3.54-1.47.65.89 1.77 1.47 2.96 1.47 1.97 0 3.5-1.6 3.5-3.57V12c0-5.52-4.48-10-10-10zm0 13c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z",
  lock: "M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z",
  chat: "M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z",
  download: "M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z",
  history: "M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z",
  trash: "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
  link: "M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z",
  phone: "M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z",
  bug: "M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5s-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z",
  plusCircle: "M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z",
  minusCircle: "M7 11v2h10v-2H7zm5-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z",
  share: "M14 9V5l7 7-7 7v-4.1c-5 0-8.5 1.6-11 5.1 1-5 4-10 11-11z",
  muteBox: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2.4 12L15 16.6l-3-3-3 3L7.4 15l3-3-3-3L9 7.4l3 3 3-3L16.6 9l-3 3 3 3z",
  report: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-6 14h-2v-2h2v2zm0-4h-2V7h2v6z",
  globe: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z",
  friends: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
  gear: "M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z",
  search: "M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z",
  heart: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  like: "M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z",
  play: "M8 5v14l11-7z",
  pause: "M6 19h4V5H6v14zm8-14v14h4V5h-4z",
  repost: "M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z",
  check: "M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
  image: "M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z",
  send: "M2.01 21 23 12 2.01 3 2 10l15 2-15 2z",
  phoneDev: "M17 1.01 7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-1.99-1.99zM17 19H7V5h10v14z",
}

const ST_RX: Record<string, string> = { gem: "💖", love: "❤️", like: "👍" }

const STORY_FILTERS = [
  { id: "none", name: "Normal", css: "none" },
  { id: "vivid", name: "Vivid", css: "saturate(1.45) contrast(1.08)" },
  { id: "warm", name: "Warm", css: "sepia(.28) saturate(1.3) hue-rotate(-8deg)" },
  { id: "cool", name: "Cool", css: "hue-rotate(14deg) saturate(1.1) brightness(1.04)" },
  { id: "mono", name: "B&W", css: "grayscale(1) contrast(1.05)" },
  { id: "fade", name: "Fade", css: "contrast(.88) brightness(1.1) saturate(.8)" },
  { id: "drama", name: "Drama", css: "contrast(1.3) saturate(1.2) brightness(.94)" },
  { id: "vintage", name: "Vintage", css: "sepia(.5) contrast(1.1) brightness(.98)" },
]
function storyFilterCss(id: any): string {
  const f = STORY_FILTERS.find((x) => x.id === id) || STORY_FILTERS[0]
  return f.css
}

const STORY_EMOJIS = "😀 😂 🥰 😍 😎 🤩 😭 😡 🥳 🤔 🙌 👍 👏 🔥 💯 ❤️ 💖 💎 ✨ 🎉 🎬 🍿 🎵 🎧 📸 🌙 ☀️ 🌈 🌹 🦋 👑 💀 👻 😈 🙏 💪 🍕 ☕ ⚽ 🚀 🇧🇩".split(" ")
const STORY_TEXT_COLORS = ["#ffffff", "#111111", "#22c55e", "#facc15", "#f97316", "#ef4444", "#ec4899", "#3b82f6", "#a855f7"]
const STORY_REPORT_REASONS = [
  "Nudity or sexual content",
  "Violence or harmful content",
  "Harassment or bullying",
  "Spam or scam",
  "False information",
  "Something else",
]

function StIco({ d, size = 22 }: { d: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" style={{ flexShrink: 0 }}>
      <path d={d} />
    </svg>
  )
}

function StGem({ size = 30 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size}>
      <defs>
        <linearGradient id="stGemG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7ee0ff" />
          <stop offset=".5" stopColor="#b48cff" />
          <stop offset="1" stopColor="#ff7ac8" />
        </linearGradient>
      </defs>
      <path
        d="M16 29 3.6 16.2C.6 12.9 1.9 7.4 6.2 5.8c2.8-1 5.6.2 7.3 2.4L16 11l2.5-2.8c1.7-2.2 4.5-3.4 7.3-2.4 4.3 1.6 5.6 7.1 2.6 10.4z"
        fill="url(#stGemG)"
      />
      <path d="M8 9l4 3 4-3 4 3 4-3M12 12l4 13 4-13" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="1.1" strokeLinejoin="round" />
    </svg>
  )
}

function stId() {
  return Math.random().toString(36).slice(2, 10)
}

function stAgo(ms: number) {
  const s = Math.max(0, Math.floor((Date.now() - (ms || Date.now())) / 1000))
  if (s < 60) return "Just now"
  if (s < 3600) return Math.floor(s / 60) + " min"
  if (s < 86400) {
    const h = Math.floor(s / 3600)
    return h + (h === 1 ? " hr" : " hrs")
  }
  return Math.floor(s / 86400) + " d"
}

function stContrast(hex: any) {
  return hex === "#ffffff" || hex === "#facc15" || hex === "#22c55e" ? "#111111" : "#ffffff"
}

function stLoadPrefs(uid: string): any {
  const base: any = { muted: {}, interested: {}, notInterested: {}, privacy: "public", archive: true, hideInfo: false }
  try {
    const p = JSON.parse(localStorage.getItem("mebook_story_prefs_" + uid) || "{}")
    return { ...base, ...p }
  } catch {
    return base
  }
}
function stSavePrefs(uid: string, p: any) {
  try { localStorage.setItem("mebook_story_prefs_" + uid, JSON.stringify(p)) } catch {}
}

async function stShrink(file: File, max = 1440): Promise<Blob | File> {
  try {
    const url = URL.createObjectURL(file)
    const img: HTMLImageElement = await new Promise((res, rej) => {
      const i = new Image()
      i.onload = () => res(i)
      i.onerror = rej
      i.src = url
    })
    URL.revokeObjectURL(url)
    const sc = Math.min(1, max / Math.max(img.width, img.height))
    if (sc >= 1 && file.size < 1.5 * 1024 * 1024) return file
    const c = document.createElement("canvas")
    c.width = Math.round(img.width * sc)
    c.height = Math.round(img.height * sc)
    const ctx = c.getContext("2d")
    if (!ctx) return file
    ctx.drawImage(img, 0, 0, c.width, c.height)
    const blob: Blob | null = await new Promise((res) => c.toBlob(res, "image/jpeg", 0.88))
    return blob || file
  } catch {
    return file
  }
}

/* ---------- Music (online trending via iTunes API + device) ---------- */

const ST_MUSIC_CHIPS: Record<string, string> = {
  Trending: "",
  Hindi: "bollywood hits",
  Bangla: "bangla songs",
  English: "pop hits",
  Phonk: "phonk",
  "Lo-fi": "lofi chill",
  Islamic: "nasheed",
}

function stMapTrack(x: any) {
  return {
    title: x.trackName || "Unknown",
    artist: x.artistName || "",
    cover: String(x.artworkUrl100 || "").replace("100x100", "200x200"),
    url: x.previewUrl,
  }
}

async function stItunesSearch(term: string): Promise<any[]> {
  const r = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=30`)
  const j = await r.json()
  return (j.results || []).filter((x: any) => x.previewUrl).map(stMapTrack)
}

async function stItunesTrending(): Promise<any[]> {
  try {
    const r = await fetch("https://rss.applemarketingtools.com/api/v2/us/music/most-played/25/songs.json")
    const j = await r.json()
    const items: any[] = (j && j.feed && j.feed.results) || []
    const ids = items.map((x: any) => x.id).join(",")
    if (ids) {
      const r2 = await fetch(`https://itunes.apple.com/lookup?id=${ids}`)
      const j2 = await r2.json()
      const map = new Map<string, any>()
      ;(j2.results || []).forEach((x: any) => {
        if (x.trackId && x.previewUrl) map.set(String(x.trackId), x)
      })
      const out = items.map((x: any) => map.get(String(x.id))).filter(Boolean).map(stMapTrack)
      if (out.length) return out
    }
  } catch {}
  return stItunesSearch("top hits")
}

/* ---------- Stage (photo + filter + draggable overlays) ---------- */

function StoryStage(props: {
  image: string
  filter?: string
  overlays?: any[]
  editable?: boolean
  onChange?: (id: string, patch: any) => void
  onTap?: (ov: any) => void
  onDelete?: (id: string) => void
  onDrag?: (dragging: boolean, over: boolean) => void
  onMention?: (uid: string) => void
  onLoad?: () => void
  children?: any
}) {
  const ref = useRef<HTMLDivElement>(null)
  const drag = useRef<any>(null)

  const down = (e: any, ov: any) => {
    if (!props.editable) return
    e.stopPropagation()
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch {}
    drag.current = { id: ov.id, sx: e.clientX, sy: e.clientY, ox: ov.x, oy: ov.y, moved: false, y: ov.y }
  }
  const move = (e: any) => {
    const d = drag.current
    if (!d || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const dx = e.clientX - d.sx
    const dy = e.clientY - d.sy
    if (!d.moved && Math.abs(dx) + Math.abs(dy) < 6) return
    d.moved = true
    const x = Math.max(4, Math.min(96, d.ox + (dx / r.width) * 100))
    const y = Math.max(4, Math.min(96, d.oy + (dy / r.height) * 100))
    d.y = y
    if (props.onChange) props.onChange(d.id, { x, y })
    if (props.onDrag) props.onDrag(true, y > 86)
  }
  const up = (ov: any) => {
    const d = drag.current
    drag.current = null
    if (!d) return
    if (props.onDrag) props.onDrag(false, false)
    if (!d.moved) {
      if (props.onTap) props.onTap(ov)
      return
    }
    if (d.y > 86 && props.onDelete) props.onDelete(d.id)
  }

  return (
    <div className="st-stage" ref={ref}>
      <div className="st-bgblur" style={{ backgroundImage: `url("${props.image}")` }} />
      <img
        className="st-img"
        src={props.image}
        alt=""
        draggable={false}
        style={{ filter: storyFilterCss(props.filter) }}
        onLoad={props.onLoad}
        onError={props.onLoad}
      />
      {(props.overlays || []).map((ov: any) => {
        const st: any = {
          left: ov.x + "%",
          top: ov.y + "%",
          transform: `translate(-50%,-50%) scale(${ov.scale || 1})`,
        }
        if (ov.kind === "text") {
          if (ov.bg) {
            st.background = ov.color || "#ffffff"
            st.color = stContrast(ov.color)
          } else {
            st.color = ov.color || "#ffffff"
          }
        }
        return (
          <div
            key={ov.id}
            className={`st-ov st-ov-${ov.kind}${props.editable ? " edit" : ""}`}
            style={st}
            data-nav-stop={ov.kind === "mention" && !props.editable ? "1" : undefined}
            onPointerDown={(e) => down(e, ov)}
            onPointerMove={move}
            onPointerUp={() => up(ov)}
            onPointerCancel={() => {
              drag.current = null
              if (props.onDrag) props.onDrag(false, false)
            }}
            onClick={() => {
              if (!props.editable && ov.kind === "mention" && ov.uid && props.onMention) props.onMention(ov.uid)
            }}
          >
            {ov.text}
          </div>
        )
      })}
      {props.children}
    </div>
  )
}

/* ---------- generic bottom sheet + user row ---------- */

function StSheet(props: { title?: string; onClose: () => void; children: any; tall?: boolean }) {
  return (
    <div className="st-sheet-bg" onClick={props.onClose}>
      <div className={`st-sheet${props.tall ? " tall" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className="st-sheet-handle" />
        {props.title && <div className="st-sheet-title">{props.title}</div>}
        {props.children}
      </div>
    </div>
  )
}

function StUser(props: { u: any; sub?: string; right?: any; onClick?: () => void; avatarUrl: (u: any) => string }) {
  return (
    <div className="st-user" onClick={props.onClick} style={props.onClick ? { cursor: "pointer" } : undefined}>
      <img src={props.avatarUrl(props.u)} alt="" />
      <div className="st-un">
        {props.u.name || "MeBook user"}
        {props.sub ? <small>{props.sub}</small> : null}
      </div>
      {props.right}
    </div>
  )
}

function StUserPicker(props: {
  users: any[]
  avatarUrl: (u: any) => string
  searchable?: boolean
  empty: string
  action: string
  doneIds?: string[]
  doneLabel?: string
  onPick: (u: any) => void
}) {
  const [q, setQ] = useState("")
  const list = props.users.filter((u: any) => !q.trim() || String(u.name || "").toLowerCase().includes(q.trim().toLowerCase()))
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }}>
      {props.searchable !== false && (
        <input className="st-search" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
      )}
      <div className="st-musicscroll">
        {list.length === 0 && <div className="st-empty">{props.empty}</div>}
        {list.map((u: any) => {
          const done = (props.doneIds || []).includes(u.uid)
          return (
            <StUser
              key={u.uid}
              u={u}
              avatarUrl={props.avatarUrl}
              right={
                <button className={`st-sbtn${done ? " ghost" : ""}`} disabled={done} onClick={() => props.onPick(u)}>
                  {done ? props.doneLabel || "Sent" : props.action}
                </button>
              }
            />
          )
        })}
      </div>
    </div>
  )
}

/* ---------- Music picker sheet ---------- */

function StoryMusicSheet(props: { onPick: (m: any) => void; onClose: () => void; onError: (m: string) => void }) {
  const [q, setQ] = useState("")
  const [chip, setChip] = useState("Trending")
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState("")
  const [playing, setPlaying] = useState("")
  const audio = useRef<HTMLAudioElement | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const req = useRef(0)

  useEffect(() => {
    const id = ++req.current
    const term = q.trim()
    const t = setTimeout(async () => {
      setLoading(true)
      setErr("")
      try {
        const res = term
          ? await stItunesSearch(term)
          : chip === "Trending"
          ? await stItunesTrending()
          : await stItunesSearch(ST_MUSIC_CHIPS[chip])
        if (id !== req.current) return
        setList(res)
        if (!res.length) setErr("No songs found")
      } catch {
        if (id === req.current) {
          setList([])
          setErr("Couldn't load music. Check your internet connection.")
        }
      } finally {
        if (id === req.current) setLoading(false)
      }
    }, term ? 450 : 0)
    return () => clearTimeout(t)
  }, [q, chip])

  useEffect(() => {
    return () => {
      try { if (audio.current) audio.current.pause() } catch {}
    }
  }, [])

  const toggle = (e: any, t: any) => {
    e.stopPropagation()
    const a = audio.current
    if (!a) return
    if (playing === t.url) {
      a.pause()
      setPlaying("")
      return
    }
    a.src = t.url
    a.play().then(() => setPlaying(t.url)).catch(() => setPlaying(""))
  }

  const pickFile = (e: any) => {
    const f = e.target.files && e.target.files[0]
    e.target.value = ""
    if (!f) return
    if (f.size > 20 * 1024 * 1024) {
      props.onError("Audio file too large (max 20 MB)")
      return
    }
    props.onPick({
      title: f.name.replace(/\.[^.]+$/, "").slice(0, 60),
      artist: "From device",
      cover: "",
      url: URL.createObjectURL(f),
      file: f,
    })
  }

  return (
    <StSheet title="Music" onClose={props.onClose} tall>
      <audio ref={audio} onEnded={() => setPlaying("")} />
      <input className="st-search" placeholder="Search music" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="st-chips">
        {Object.keys(ST_MUSIC_CHIPS).map((c) => (
          <button
            key={c}
            className={`st-chipb${!q.trim() && chip === c ? " on" : ""}`}
            onClick={() => {
              setQ("")
              setChip(c)
            }}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="st-group" style={{ marginBottom: 8 }}>
        <button className="st-row" onClick={() => fileRef.current && fileRef.current.click()}>
          <StIco d={ST_IC.phoneDev} />
          <span>
            From your device
            <small>Choose an audio file from your phone</small>
          </span>
        </button>
      </div>
      <input ref={fileRef} type="file" accept="audio/*" style={{ display: "none" }} onChange={pickFile} />
      <div className="st-musicscroll">
        {loading && <div className="st-empty">Loading music...</div>}
        {!loading && err && <div className="st-empty">{err}</div>}
        {!loading &&
          list.map((t: any, i: number) => (
            <div className="st-trk" key={t.url + i} onClick={() => props.onPick(t)}>
              {t.cover ? <img src={t.cover} alt="" /> : <div className="st-nocov" />}
              <div className="st-tt">
                <b>{t.title}</b>
                <span>{t.artist}</span>
              </div>
              <button className="st-rbtn" style={{ width: 38, height: 38 }} onClick={(e) => toggle(e, t)}>
                <StIco d={playing === t.url ? ST_IC.pause : ST_IC.play} size={20} />
              </button>
            </div>
          ))}
      </div>
    </StSheet>
  )
}

/* ---------- Creator / editor ---------- */

function StoryCreator(props: {
  file: File
  initialMusic: any
  me: any
  allUsers: any[]
  defaultPrivacy: string
  archive: boolean
  avatarUrl: (u: any) => string
  onClose: () => void
  onPosted: (id: string, wa: boolean) => void
  showToast: (title: string, msg?: string, type?: "success" | "error" | "info") => void
}) {
  const me = props.me
  const [file, setFile] = useState<File>(props.file)
  const [src, setSrc] = useState("")
  const [filter, setFilter] = useState("none")
  const [ovs, setOvs] = useState<any[]>([])
  const [music, setMusic] = useState<any>(props.initialMusic || null)
  const [ai, setAi] = useState(false)
  const [privacy, setPrivacy] = useState(props.defaultPrivacy || "public")
  const [wa, setWa] = useState(false)
  const [panel, setPanel] = useState<string | null>(null)
  const [textEdit, setTextEdit] = useState<any>(null)
  const [trash, setTrash] = useState({ on: false, over: false })
  const [busy, setBusy] = useState(false)
  const [pct, setPct] = useState(0)
  const [menu, setMenu] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const u = URL.createObjectURL(file)
    setSrc(u)
    return () => URL.revokeObjectURL(u)
  }, [file])

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    if (music && music.url) {
      a.src = music.url
      a.currentTime = 0
      a.play().catch(() => {})
    } else {
      a.pause()
    }
  }, [music && music.url])

  useEffect(() => {
    return () => {
      try { if (audioRef.current) audioRef.current.pause() } catch {}
    }
  }, [])

  const dirty = ovs.length > 0 || !!music || filter !== "none" || ai
  const back = () => {
    if (busy) return
    if (dirty && !confirm("Discard this story?")) return
    props.onClose()
  }

  const openText = (ov?: any) =>
    setTextEdit(
      ov
        ? { id: ov.id, text: ov.text, color: ov.color || "#ffffff", bg: !!ov.bg }
        : { id: "", text: "", color: "#ffffff", bg: false }
    )
  const doneText = () => {
    const t = textEdit
    setTextEdit(null)
    if (!t) return
    const txt = String(t.text || "").trim()
    if (t.id) {
      setOvs((o) =>
        txt ? o.map((x) => (x.id === t.id ? { ...x, text: txt, color: t.color, bg: t.bg } : x)) : o.filter((x) => x.id !== t.id)
      )
    } else if (txt) {
      setOvs((o) => [...o, { id: stId(), kind: "text", text: txt, color: t.color, bg: t.bg, x: 50, y: 42, scale: 1 }])
    }
  }

  const tapOv = (ov: any) => {
    if (ov.kind === "text") openText(ov)
    else
      setOvs((o) =>
        o.map((x) => (x.id === ov.id ? { ...x, scale: (x.scale || 1) >= 2 ? 0.7 : (x.scale || 1) + 0.5 } : x))
      )
  }

  const toolClick = (k: string) => {
    if (k === "text") return openText()
    if (k === "ai") {
      setAi((v) => !v)
      props.showToast(ai ? "AI label removed" : "AI label added", "", "info")
      return
    }
    setPanel(panel === k && k === "effects" ? null : k)
  }

  const onPickFile = (e: any) => {
    const f = e.target.files && e.target.files[0]
    e.target.value = ""
    if (f && /^image\//.test(f.type)) setFile(f)
  }

  const share = async () => {
    if (busy) return
    setBusy(true)
    setPct(2)
    try {
      const fb = await getFirebase()
      const blob = await stShrink(file)
      const image = await cloudinaryUpload(blob, (p) => setPct(Math.max(2, Math.min(90, Math.round(p * 0.9)))), "image")
      let mus: any = null
      if (music) {
        let url = music.url
        if (music.file) url = await cloudinaryUpload(music.file, undefined, "video")
        mus = { title: music.title || "", artist: music.artist || "", cover: music.cover || "", url }
      }
      setPct(95)
      const now = Date.now()
      const mentions = Array.from(new Set(ovs.filter((o) => o.kind === "mention" && o.uid).map((o) => o.uid)))
      const ref = await fb.addDoc(fb.collection(fb.db, "stories"), {
        uid: me.uid,
        name: me.name || "",
        photoURL: me.photoURL || "",
        verified: me.verified === true,
        image,
        filter,
        overlays: ovs.map((o) => ({
          id: o.id,
          kind: o.kind,
          text: o.text || "",
          color: o.color || "",
          bg: !!o.bg,
          x: o.x,
          y: o.y,
          scale: o.scale || 1,
          uid: o.uid || "",
        })),
        music: mus,
        aiLabel: ai,
        privacy,
        mentions,
        viewers: {},
        reactions: {},
        rewatches: 0,
        archived: false,
        noArchive: !props.archive,
        createdAt: fb.serverTimestamp(),
        createdMs: now,
        expiresAt: now + STORY_TTL,
      })
      for (const mu of mentions) {
        if (mu === me.uid) continue
        try {
          await fb.addDoc(fb.collection(fb.db, "notifications"), {
            uid: mu,
            fromUid: me.uid,
            fromName: me.name || "",
            fromAvatar: me.photoURL || "",
            title: "Story mention",
            message: `${me.name || "Someone"} mentioned you in their story.`,
            type: "post",
            read: false,
            createdAt: fb.serverTimestamp(),
          })
        } catch {}
      }
      props.onPosted(ref.id, wa)
    } catch (e: any) {
      setBusy(false)
      props.showToast("Couldn't share story", e && e.message ? e.message : "Try again", "error")
    }
  }

  const tools = [
    { k: "music", label: "Music", icon: <StIco d={ST_IC.music} size={26} />, on: !!music },
    { k: "stickers", label: "Stickers", icon: <StIco d={ST_IC.sticker} size={26} />, on: false },
    { k: "text", label: "Text", icon: "Aa", on: false },
    { k: "effects", label: "Effects", icon: <StIco d={ST_IC.sparkle} size={26} />, on: filter !== "none" || panel === "effects" },
    { k: "mention", label: "Mention", icon: <StIco d={ST_IC.mention} size={26} />, on: false },
    { k: "ai", label: "AI label", icon: "AI", on: ai },
  ]

  return (
    <div className="st-layer">
      <audio ref={audioRef} loop />
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onPickFile} />
      <div className="st-col">
        <div className="st-stagewrap">
          <div className="st-frame">
            {src && (
              <StoryStage
                image={src}
                filter={filter}
                overlays={ovs}
                editable
                onChange={(id, patch) => setOvs((o) => o.map((x) => (x.id === id ? { ...x, ...patch } : x)))}
                onTap={tapOv}
                onDelete={(id) => setOvs((o) => o.filter((x) => x.id !== id))}
                onDrag={(on, over) => setTrash({ on, over })}
              />
            )}

            <div className="st-top">
              <button className="st-ibtn" onClick={back}>
                <StIco d={ST_IC.back} />
              </button>
              {music ? (
                <div className="st-musicpill">
                  {music.cover ? (
                    <img src={music.cover} alt="" />
                  ) : (
                    <div className="st-mcover">
                      <StIco d={ST_IC.music} size={18} />
                    </div>
                  )}
                  <div className="st-mtxt">
                    <b>{music.title}</b>
                    <span>{music.artist}</span>
                  </div>
                  <button className="st-ibtn" style={{ width: 34, height: 34 }} onClick={() => setMusic(null)}>
                    <StIco d={ST_IC.close} size={20} />
                  </button>
                </div>
              ) : (
                <div style={{ flex: 1 }} />
              )}
              <button className="st-ibtn" onClick={() => setMenu(true)}>
                <StIco d={ST_IC.more} />
              </button>
            </div>

            {ai && <div className="st-aipill" style={{ top: "calc(68px + env(safe-area-inset-top,0px))" }}>AI info</div>}
            {trash.on && (
              <div className={`st-trash${trash.over ? " over" : ""}`}>
                <StIco d={ST_IC.trash} size={26} />
              </div>
            )}

            {panel === "effects" && (
              <div className="st-fx">
                {STORY_FILTERS.map((f) => (
                  <button key={f.id} className={`st-fxi${filter === f.id ? " on" : ""}`} onClick={() => setFilter(f.id)}>
                    <div style={{ backgroundImage: `url("${src}")`, filter: f.css }} />
                    {f.name}
                  </button>
                ))}
              </div>
            )}

            <div className="st-tools">
              {tools.map((t) => (
                <button key={t.k} className={`st-tool${t.on ? " on" : ""}`} onClick={() => toolClick(t.k)}>
                  <i>{t.icon}</i>
                  {t.label}
                </button>
              ))}
            </div>

            {busy && (
              <div className="st-busy">
                <div>Sharing story... {pct}%</div>
                <div className="st-bar-p">
                  <i style={{ width: pct + "%" }} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="st-foot">
          <button className="st-chip" onClick={() => setPanel("privacy")}>
            <StIco d={privacy === "friends" ? ST_IC.friends : ST_IC.globe} size={20} />
            {privacy === "friends" ? "Friends" : "Public"}
          </button>
          <button className="st-chip" onClick={() => setWa((v) => !v)}>
            <StIco d={ST_IC.phone} size={20} />
            {wa ? "On" : "Off"}
          </button>
          <button className="st-share" disabled={busy} onClick={share}>
            Share
          </button>
        </div>
      </div>

      {panel === "music" && (
        <StoryMusicSheet
          onClose={() => setPanel(null)}
          onError={(m) => props.showToast("Music", m, "error")}
          onPick={(m) => {
            setMusic(m)
            setPanel(null)
          }}
        />
      )}

      {panel === "stickers" && (
        <StSheet title="Stickers" onClose={() => setPanel(null)}>
          <div className="st-emojis">
            {STORY_EMOJIS.map((em) => (
              <button
                key={em}
                onClick={() => {
                  setOvs((o) => [...o, { id: stId(), kind: "sticker", text: em, x: 50, y: 45, scale: 1 }])
                  setPanel(null)
                }}
              >
                {em}
              </button>
            ))}
          </div>
        </StSheet>
      )}

      {panel === "mention" && (
        <StSheet title="Mention" onClose={() => setPanel(null)} tall>
          <StUserPicker
            users={props.allUsers}
            avatarUrl={props.avatarUrl}
            empty="No people found"
            action="Mention"
            onPick={(u) => {
              setOvs((o) => [
                ...o,
                { id: stId(), kind: "mention", text: "@" + (u.name || "user"), uid: u.uid, x: 50, y: 72 - Math.min(o.length, 6) * 3, scale: 1 },
              ])
              setPanel(null)
            }}
          />
        </StSheet>
      )}

      {panel === "privacy" && (
        <StSheet title="Who can see your story?" onClose={() => setPanel(null)}>
          <div className="st-group">
            {[
              { k: "public", t: "Public", s: "Anyone on MeBook", ic: ST_IC.globe },
              { k: "friends", t: "Friends", s: "Only your friends", ic: ST_IC.friends },
            ].map((o) => (
              <button
                key={o.k}
                className="st-row"
                onClick={() => {
                  setPrivacy(o.k)
                  setPanel(null)
                }}
              >
                <StIco d={o.ic} />
                <span style={{ flex: 1 }}>
                  {o.t}
                  <small>{o.s}</small>
                </span>
                {privacy === o.k && <StIco d={ST_IC.check} />}
              </button>
            ))}
          </div>
        </StSheet>
      )}

      {menu && (
        <StSheet onClose={() => setMenu(false)}>
          <div className="st-group">
            <button
              className="st-row"
              onClick={() => {
                setMenu(false)
                fileRef.current && fileRef.current.click()
              }}
            >
              <StIco d={ST_IC.image} />
              Change photo
            </button>
            <button
              className="st-row danger"
              onClick={() => {
                setMenu(false)
                props.onClose()
              }}
            >
              <StIco d={ST_IC.trash} />
              Discard story
            </button>
          </div>
        </StSheet>
      )}

      {textEdit && (
        <div className="st-textedit">
          <div className="st-te-top">
            <button
              onClick={() => setTextEdit({ ...textEdit, bg: !textEdit.bg })}
              style={{ background: textEdit.bg ? "#fff" : "transparent", color: textEdit.bg ? "#111" : "#fff", borderRadius: 10 }}
            >
              Aa
            </button>
            <button onClick={doneText}>Done</button>
          </div>
          <div className="st-te-area">
            <textarea
              autoFocus
              rows={3}
              maxLength={120}
              placeholder="Type something..."
              value={textEdit.text}
              onChange={(e) => setTextEdit({ ...textEdit, text: e.target.value })}
              style={{
                color: textEdit.bg ? stContrast(textEdit.color) : textEdit.color,
                background: textEdit.bg ? textEdit.color : "transparent",
              }}
            />
          </div>
          <div className="st-te-colors">
            {STORY_TEXT_COLORS.map((c) => (
              <button
                key={c}
                className={textEdit.color === c ? "on" : ""}
                style={{ background: c }}
                onClick={() => setTextEdit({ ...textEdit, color: c })}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- Viewers page (own story) ---------- */

function StoryViewersPage(props: {
  story: any
  allUsers: any[]
  friendSet: Set<string>
  hideInfo: boolean
  avatarUrl: (u: any) => string
  onHideInfo: () => void
  onClose: () => void
  onSettings: () => void
  onAdd: () => void
  onArchive: () => void
}) {
  const s = props.story
  const [tab, setTab] = useState<"viewers" | "insights">("viewers")
  const [q, setQ] = useState("")
  const viewers = Object.keys(s.viewers || {})
    .map((uid) => {
      const u = props.allUsers.find((x: any) => x.uid === uid)
      return {
        uid,
        t: Number(s.viewers[uid]) || 0,
        name: (u && u.name) || "MeBook user",
        photoURL: (u && u.photoURL) || "",
        rx: s.reactions ? s.reactions[uid] : "",
      }
    })
    .sort((a, b) => b.t - a.t)
  const shown = viewers.filter((v) => !q.trim() || v.name.toLowerCase().includes(q.trim().toLowerCase()))
  const rxCount = Object.keys(s.reactions || {}).filter((k) => s.reactions[k]).length
  const friendViews = viewers.filter((v) => props.friendSet.has(v.uid)).length

  return (
    <div className="st-vpage">
      <div className="st-vp-in">
        <div className="st-vp-top">
          <button className="st-ibtn" onClick={props.onSettings}>
            <StIco d={ST_IC.gear} size={26} />
          </button>
          <div className="gap">
            <button className="st-ibtn" onClick={props.onAdd}>
              <StIco d={ST_IC.plusCircle} size={28} />
            </button>
            <button className="st-ibtn" onClick={props.onClose}>
              <StIco d={ST_IC.close} size={28} />
            </button>
          </div>
        </div>

        <div className="st-vp-thumb">
          <StoryStage image={s.image} filter={s.filter} overlays={s.overlays} />
        </div>

        {!props.hideInfo && (
          <div className="st-info">
            <b>Your stories will be saved to the archive</b>
            <p>When a story expires, it's saved to your private archive. You can turn this off in settings.</p>
            <button className="st-info-x" onClick={props.onHideInfo}>
              <StIco d={ST_IC.close} size={22} />
            </button>
          </div>
        )}

        <div className="st-stats">
          <span>
            <StIco d={ST_IC.friends} size={22} /> {viewers.length} {viewers.length === 1 ? "view" : "views"}
          </span>
          <span>
            <StIco d={ST_IC.history} size={22} /> {s.rewatches || 0} rewatches
          </span>
        </div>

        <div className="st-tabs">
          <button className={`st-tab${tab === "viewers" ? " on" : ""}`} onClick={() => setTab("viewers")}>
            Viewers
          </button>
          <button className={`st-tab${tab === "insights" ? " on" : ""}`} onClick={() => setTab("insights")}>
            Insights
          </button>
          <button className="st-ibtn" style={{ marginLeft: "auto" }} onClick={props.onArchive}>
            <StIco d={ST_IC.history} size={28} />
          </button>
        </div>

        {tab === "viewers" ? (
          <>
            <input className="st-search" style={{ height: 50, fontSize: 17 }} placeholder="Search viewers" value={q} onChange={(e) => setQ(e.target.value)} />
            {shown.length === 0 && <div className="st-empty">{viewers.length ? "No viewers found" : "No one has viewed this story yet"}</div>}
            {shown.map((v) => (
              <StUser
                key={v.uid}
                u={v}
                avatarUrl={props.avatarUrl}
                sub={props.friendSet.has(v.uid) ? "Friend" : "Non-friend"}
                right={v.rx ? <span style={{ fontSize: 24 }}>{ST_RX[v.rx] || "👍"}</span> : null}
              />
            ))}
          </>
        ) : (
          <div className="st-insights">
            <div><b>{viewers.length}</b><span>Views</span></div>
            <div><b>{rxCount}</b><span>Reactions</span></div>
            <div><b>{s.rewatches || 0}</b><span>Rewatches</span></div>
            <div><b>{friendViews}</b><span>Friends viewed</span></div>
            <div><b>{viewers.length - friendViews}</b><span>Non-friends viewed</span></div>
            <div><b>{stAgo(s.createdMs)}</b><span>Posted</span></div>
          </div>
        )}

        <div className="st-next">
          <b>Share your next update ✌️</b>
          <p>Your friends are loving your updates. Share another story and keep connecting.</p>
          <button className="st-nextbtn" onClick={props.onAdd}>
            Create a new story
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------- Viewer (full-screen story player) ---------- */

function StoryViewer(props: {
  order: string[]
  startUid: string
  startIndex: number
  getGroup: (uid: string) => any
  me: any
  friendSet: Set<string>
  allUsers: any[]
  myFriends: any[]
  archived: any[]
  prefs: any
  api: any
  avatarUrl: (u: any) => string
  onClose: () => void
  onOpenProfile: (uid: string) => void
  onCreate: (music?: any) => void
}) {
  const P = useRef(props)
  P.current = props
  const me = props.me
  const [uid, setUid] = useState(props.startUid)
  const [si, setSi] = useState(props.startIndex)
  const [prog, setProg] = useState(0)
  const progRef = useRef(0)
  const [hold, setHold] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [menu, setMenu] = useState<string | null>(null)
  const [sheet, setSheet] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [replyFocus, setReplyFocus] = useState(false)
  const [flash, setFlash] = useState<any>(null)
  const [sentTo, setSentTo] = useState<string[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const seenRef = useRef<Set<string>>(new Set())
  const gest = useRef<any>(null)
  const prevRef = useRef<any>(null)

  const g = props.getGroup(uid)
  const stories: any[] = g ? g.stories : []
  const idx = Math.max(0, Math.min(si, stories.length - 1))
  const cur: any = stories[idx]
  const isMine = !!cur && cur.uid === me.uid
  const sRef = useRef({ uid, si: idx })
  sRef.current = { uid, si: idx }

  const startOf = (gr: any) => {
    if (!gr || gr.uid === me.uid) return 0
    const i = gr.stories.findIndex((s: any) => !(s.viewers && s.viewers[me.uid]))
    return i < 0 ? 0 : i
  }

  const nextGroup = () => {
    const s = sRef.current
    const ord = P.current.order
    for (let i = ord.indexOf(s.uid) + 1; i < ord.length; i++) {
      const ng = P.current.getGroup(ord[i])
      if (ng && ng.stories.length) {
        setUid(ng.uid)
        setSi(startOf(ng))
        return
      }
    }
    P.current.onClose()
  }

  const advance = () => {
    const s = sRef.current
    const gr = P.current.getGroup(s.uid)
    if (gr && s.si < gr.stories.length - 1) {
      setSi(s.si + 1)
      return
    }
    nextGroup()
  }

  const retreat = () => {
    const s = sRef.current
    if (s.si > 0) {
      setSi(s.si - 1)
      return
    }
    const ord = P.current.order
    for (let i = ord.indexOf(s.uid) - 1; i >= 0; i--) {
      const pg = P.current.getGroup(ord[i])
      if (pg && pg.stories.length) {
        setUid(pg.uid)
        setSi(pg.stories.length - 1)
        return
      }
    }
    progRef.current = 0
    setProg(0)
  }

  const curId = cur ? cur.id : ""

  // story বদলালে progress reset
  useEffect(() => {
    progRef.current = 0
    setProg(0)
    setLoaded(false)
    const t = setTimeout(() => setLoaded(true), 4000)
    return () => clearTimeout(t)
  }, [curId])

  // current story না থাকলে (delete/archive হলে) পরেরটায় যাও
  useEffect(() => {
    if (!cur) advance()
  }, [curId])

  // শেষ story delete হলে clamp হয়ে আগেরটা দেখাবে — তখন পরের group এ যাও
  useEffect(() => {
    const prev = prevRef.current
    if (prev && cur && prev.uid === uid && prev.id !== cur.id && !stories.some((s: any) => s.id === prev.id) && prev.i >= stories.length) {
      advance()
    }
    prevRef.current = cur ? { id: cur.id, uid, i: idx } : null
  })

  const paused = hold || !!menu || !!sheet || replyFocus || !loaded

  useEffect(() => {
    if (paused || !curId) return
    const t = setInterval(() => {
      progRef.current += 50 / STORY_MS
      if (progRef.current >= 1) {
        progRef.current = 1
        setProg(1)
        clearInterval(t)
        advance()
        return
      }
      setProg(progRef.current)
    }, 50)
    return () => clearInterval(t)
  }, [paused, curId])

  // view mark
  useEffect(() => {
    if (!cur || cur.uid === me.uid) return
    if (seenRef.current.has(cur.id)) return
    seenRef.current.add(cur.id)
    P.current.api.markViewed(cur)
  }, [curId])

  // music
  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    const url = cur && cur.music && cur.music.url ? cur.music.url : ""
    if (!url) {
      a.pause()
      return
    }
    if (a.src !== url) a.src = url
    a.currentTime = 0
    a.play().catch(() => {})
  }, [curId])
  useEffect(() => {
    const a = audioRef.current
    if (!a || !(cur && cur.music && cur.music.url)) return
    if (paused) a.pause()
    else a.play().catch(() => {})
  }, [paused])
  useEffect(() => {
    return () => {
      try { if (audioRef.current) audioRef.current.pause() } catch {}
    }
  }, [])

  // keyboard
  useEffect(() => {
    const onKey = (e: any) => {
      if (e.key === "Escape") P.current.onClose()
      else if (e.key === "ArrowRight") advance()
      else if (e.key === "ArrowLeft") retreat()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const onPD = (e: any) => {
    if (e.target && e.target.closest && e.target.closest("[data-nav-stop]")) return
    const gs: any = { x: e.clientX, y: e.clientY, hold: false, timer: null }
    gs.timer = setTimeout(() => {
      gs.hold = true
      setHold(true)
    }, 220)
    gest.current = gs
  }
  const onPU = (e: any) => {
    const gs = gest.current
    if (!gs) return
    clearTimeout(gs.timer)
    gest.current = null
    if (gs.hold) {
      setHold(false)
      return
    }
    const dx = e.clientX - gs.x
    const dy = e.clientY - gs.y
    if (dy > 90 && Math.abs(dx) < 70) {
      P.current.onClose()
      return
    }
    if (Math.abs(dx) > 40 || Math.abs(dy) > 40) return
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    if (e.clientX - r.left < r.width * 0.3) retreat()
    else advance()
  }
  const onPC = () => {
    const gs = gest.current
    if (!gs) return
    clearTimeout(gs.timer)
    if (gs.hold) setHold(false)
    gest.current = null
  }

  const api = props.api
  const react = (key: string) => {
    if (!cur) return
    api.react(cur, key)
    setFlash({ k: key, n: Date.now() })
  }
  const sendReply = async () => {
    const t = replyText.trim()
    if (!t || !cur) return
    setReplyText("")
    try { (document.activeElement as any).blur() } catch {}
    await api.reply(cur, t)
  }

  const firstName = (cur && cur.name ? String(cur.name).split(" ")[0] : "User") || "User"
  const menuClose = () => setMenu(null)
  const pick = (fn: () => void) => () => {
    setMenu(null)
    fn()
  }

  const ownItems: any[] = cur
    ? [
        { ic: ST_IC.mention, t: "Mention people", on: () => setSheet("mention") },
        { ic: ST_IC.lock, t: "Edit story privacy", on: () => setSheet("privacy") },
        { ic: ST_IC.chat, t: "Send in MeChat", on: () => setSheet("chat") },
        { ic: ST_IC.download, t: "Save photo", on: () => api.savePhoto(cur) },
        { ic: ST_IC.history, t: "Archive story", s: "Remove story from your profile and save to archive.", on: () => api.archive(cur) },
        { ic: ST_IC.trash, t: "Delete story", on: () => setSheet("delete") },
        { ic: ST_IC.link, t: "Copy link to share this story", s: `Stories are visible to ${firstName}'s audience for 24 hours.`, on: () => api.copyLink(cur) },
        { ic: ST_IC.phone, t: "Share to WhatsApp", on: () => api.shareWA(cur) },
        { ic: ST_IC.bug, t: "Something went wrong", on: () => api.bug(cur) },
      ]
    : []

  const interested = cur && props.prefs.interested && props.prefs.interested[cur.uid]
  const notInterested = cur && props.prefs.notInterested && props.prefs.notInterested[cur.uid]
  const otherTop: any[] = cur
    ? [
        { ic: ST_IC.plusCircle, t: "Interested", s: interested ? "You'll see more stories like this." : "More of your stories will be like this.", on: () => api.setInterest(cur.uid, "yes") },
        { ic: ST_IC.minusCircle, t: "Not interested", s: notInterested ? "You'll see fewer stories like this." : "Fewer of your stories will be like this.", on: () => api.setInterest(cur.uid, "no") },
      ]
    : []
  const otherItems: any[] = cur
    ? [
        { ic: ST_IC.share, t: "Share this story", on: () => setSheet("share") },
        { ic: ST_IC.muteBox, t: `Mute ${firstName}'s stories`, s: `Stop seeing ${firstName}'s stories on MeBook.`, on: () => { api.mute(cur.uid); nextGroup() } },
        { ic: ST_IC.muteBox, t: `Unfollow ${firstName}`, s: "Stop seeing stories and posts from this person.", on: () => { api.unfollow(cur.uid); nextGroup() } },
        { ic: ST_IC.report, t: "Find support or report", on: () => setSheet("report") },
        { ic: ST_IC.link, t: "Copy link to share this story", s: `Stories are visible to ${firstName}'s audience for 24 hours.`, on: () => api.copyLink(cur) },
        { ic: ST_IC.bug, t: "Something went wrong", on: () => api.bug(cur) },
        { ic: ST_IC.plusCircle, t: "Create a story", on: () => props.onCreate() },
      ]
    : []

  const renderItems = (items: any[]) =>
    items.map((it: any, i: number) => (
      <button key={i} className="st-row" onClick={pick(it.on)}>
        <StIco d={it.ic} />
        <span style={{ flex: 1 }}>
          {it.t}
          {it.s ? <small>{it.s}</small> : null}
        </span>
      </button>
    ))

  const viewerCount = cur ? Object.keys(cur.viewers || {}).length : 0
  const myRx = cur && cur.reactions ? cur.reactions[me.uid] : ""

  return (
    <div className="st-layer">
      <audio ref={audioRef} />
      <div className="st-col">
        <div className="st-stagewrap">
          {cur && (
            <div className="st-frame" style={{ touchAction: "none" }} onPointerDown={onPD} onPointerUp={onPU} onPointerCancel={onPC}>
              <StoryStage
                key={cur.id}
                image={cur.image}
                filter={cur.filter}
                overlays={cur.overlays}
                onLoad={() => setLoaded(true)}
                onMention={(u) => {
                  props.onClose()
                  props.onOpenProfile(u)
                }}
              >
                {flash && (
                  <div className="st-flash" key={flash.n}>
                    {ST_RX[flash.k]}
                  </div>
                )}
              </StoryStage>

              <div className="st-progress">
                {stories.map((s: any, i: number) => (
                  <div className="st-seg" key={s.id}>
                    <i style={{ width: (i < idx ? 100 : i === idx ? prog * 100 : 0) + "%" }} />
                  </div>
                ))}
              </div>

              <div className="st-vhead" data-nav-stop="1">
                <img
                  className="st-vav"
                  src={props.avatarUrl({ photoURL: g.photoURL, name: g.name })}
                  alt=""
                  onClick={() => {
                    props.onClose()
                    props.onOpenProfile(g.uid)
                  }}
                />
                <div className="st-vname">
                  {isMine ? "Your story" : g.name}
                  <span className="st-vtime">{stAgo(cur.createdMs)}</span>
                </div>
                <button className="st-ibtn" onClick={props.onClose}>
                  <StIco d={ST_IC.down} size={28} />
                </button>
                <button className="st-ibtn" onClick={() => setMenu(isMine ? "own" : "other")}>
                  <StIco d={ST_IC.more} size={26} />
                </button>
              </div>

              {cur.music && cur.music.url && (
                <div className="st-vmusic" data-nav-stop="1">
                  <StIco d={ST_IC.music} size={18} />
                  <span>
                    {cur.music.title}
                    {cur.music.artist ? " · " + cur.music.artist : ""}
                  </span>
                  <button onClick={() => props.onCreate({ title: cur.music.title, artist: cur.music.artist, cover: cur.music.cover || "", url: cur.music.url })}>
                    Try it
                  </button>
                </div>
              )}
              {cur.aiLabel && <div className="st-aipill">AI info</div>}
            </div>
          )}
        </div>

        {cur && !isMine && (
          <div className="st-vfoot">
            <button className="st-rbtn" onClick={() => setSheet("share")} aria-label="Share">
              <StIco d={ST_IC.repost} size={24} />
            </button>
            <input
              className="st-input"
              placeholder="Send message..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onFocus={() => setReplyFocus(true)}
              onBlur={() => setReplyFocus(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendReply()
              }}
            />
            {replyText.trim() ? (
              <button className="st-rx like" onClick={sendReply} aria-label="Send">
                <StIco d={ST_IC.send} size={22} />
              </button>
            ) : (
              <>
                <button className={`st-rx gem${myRx === "gem" ? " on" : ""}`} onClick={() => react("gem")} aria-label="Care">
                  <StGem size={30} />
                </button>
                <button className={`st-rx love${myRx === "love" ? " on" : ""}`} onClick={() => react("love")} aria-label="Love">
                  <StIco d={ST_IC.heart} size={24} />
                </button>
                <button className={`st-rx like${myRx === "like" ? " on" : ""}`} onClick={() => react("like")} aria-label="Like">
                  <StIco d={ST_IC.like} size={24} />
                </button>
              </>
            )}
          </div>
        )}

        {cur && isMine && (
          <div className="st-vfoot" style={{ justifyContent: "space-between", padding: "8px 12px calc(10px + env(safe-area-inset-bottom,0px))" }}>
            <button className="st-viewbtn" onClick={() => setSheet("viewers")}>
              <StIco d={ST_IC.up} size={26} />
              {viewerCount} {viewerCount === 1 ? "viewer" : "viewers"}
            </button>
            <div style={{ display: "flex", gap: 4 }}>
              <button className="st-act" onClick={() => props.onCreate()}>
                <StIco d={ST_IC.plusCircle} size={30} />
                Add New
              </button>
              <button className="st-act" onClick={() => api.highlight(cur)}>
                <StIco d={ST_IC.heart} size={30} />
                Highlight
              </button>
              <button className="st-act" onClick={() => setSheet("share")}>
                <StIco d={ST_IC.share} size={30} />
                Share
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3-dots menus */}
      {menu === "own" && (
        <StSheet onClose={menuClose}>
          <div className="st-group">{renderItems(ownItems)}</div>
        </StSheet>
      )}
      {menu === "other" && (
        <StSheet onClose={menuClose}>
          <div className="st-group">{renderItems(otherTop)}</div>
          <div className="st-group">{renderItems(otherItems)}</div>
        </StSheet>
      )}

      {/* share */}
      {sheet === "share" && cur && (
        <StSheet title="Share story" onClose={() => setSheet(null)}>
          <div className="st-group">
            <button className="st-row" onClick={() => { setSheet(null); api.nativeShare(cur) }}>
              <StIco d={ST_IC.share} />Share link
            </button>
            <button className="st-row" onClick={() => setSheet("chat")}>
              <StIco d={ST_IC.chat} />Send in MeChat
            </button>
            <button className="st-row" onClick={() => { setSheet(null); api.shareWA(cur) }}>
              <StIco d={ST_IC.phone} />Share to WhatsApp
            </button>
            <button className="st-row" onClick={() => { setSheet(null); api.copyLink(cur) }}>
              <StIco d={ST_IC.link} />Copy link
            </button>
          </div>
        </StSheet>
      )}

      {sheet === "chat" && cur && (
        <StSheet title="Send in MeChat" onClose={() => setSheet(null)} tall>
          <StUserPicker
            users={props.myFriends}
            avatarUrl={props.avatarUrl}
            empty="Add friends to send stories in MeChat"
            action="Send"
            doneIds={sentTo}
            onPick={async (u) => {
              const ok = await api.sendToChat(cur, u.uid)
              if (ok) setSentTo((a) => [...a, u.uid])
            }}
          />
        </StSheet>
      )}

      {sheet === "mention" && cur && (
        <StSheet title="Mention people" onClose={() => setSheet(null)} tall>
          <StUserPicker
            users={props.allUsers}
            avatarUrl={props.avatarUrl}
            empty="No people found"
            action="Mention"
            onPick={(u) => {
              setSheet(null)
              api.addMention(cur, u)
            }}
          />
        </StSheet>
      )}

      {sheet === "privacy" && cur && (
        <StSheet title="Edit story privacy" onClose={() => setSheet(null)}>
          <div className="st-group">
            {[
              { k: "public", t: "Public", s: "Anyone on MeBook", ic: ST_IC.globe },
              { k: "friends", t: "Friends", s: "Only your friends", ic: ST_IC.friends },
            ].map((o) => (
              <button
                key={o.k}
                className="st-row"
                onClick={() => {
                  setSheet(null)
                  api.setPrivacy(cur, o.k)
                }}
              >
                <StIco d={o.ic} />
                <span style={{ flex: 1 }}>
                  {o.t}
                  <small>{o.s}</small>
                </span>
                {(cur.privacy || "public") === o.k && <StIco d={ST_IC.check} />}
              </button>
            ))}
          </div>
        </StSheet>
      )}

      {sheet === "report" && cur && (
        <StSheet title="Find support or report" onClose={() => setSheet(null)}>
          <div className="st-group">
            {STORY_REPORT_REASONS.map((r) => (
              <button
                key={r}
                className="st-row"
                onClick={() => {
                  setSheet(null)
                  api.report(cur, r)
                }}
              >
                <StIco d={ST_IC.report} />
                {r}
              </button>
            ))}
          </div>
        </StSheet>
      )}

      {sheet === "delete" && cur && (
        <div className="st-dialog-bg" onClick={() => setSheet(null)}>
          <div className="st-dialog" onClick={(e) => e.stopPropagation()}>
            <b>Delete story?</b>
            <p>This story will be permanently deleted. You can't undo this.</p>
            <div>
              <button className="st-sbtn ghost" onClick={() => setSheet(null)}>Cancel</button>
              <button
                className="st-sbtn"
                style={{ background: "#ef4444" }}
                onClick={() => {
                  setSheet(null)
                  api.remove(cur)
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {sheet === "viewers" && cur && isMine && (
        <StoryViewersPage
          story={cur}
          allUsers={props.allUsers}
          friendSet={props.friendSet}
          hideInfo={!!props.prefs.hideInfo}
          avatarUrl={props.avatarUrl}
          onHideInfo={() => api.setPrefs({ hideInfo: true })}
          onClose={() => setSheet(null)}
          onSettings={() => setSheet("settings")}
          onAdd={() => props.onCreate()}
          onArchive={() => setSheet("archive")}
        />
      )}

      {sheet === "archive" && (
        <StSheet title="Story archive" onClose={() => setSheet("viewers")} tall>
          <div className="st-musicscroll">
            {props.archived.length === 0 && <div className="st-empty">Your archive is empty</div>}
            <div className="st-agrid">
              {props.archived.map((s: any) => (
                <div key={s.id}>
                  <div className="st-athumb">
                    <StoryStage image={s.image} filter={s.filter} overlays={s.overlays} />
                  </div>
                  <div className="st-abtns">
                    <button onClick={() => api.repost(s)}>Share</button>
                    <button onClick={() => api.removeArchived(s)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </StSheet>
      )}

      {sheet === "settings" && (
        <StSheet title="Story settings" onClose={() => setSheet("viewers")} tall>
          <div className="st-musicscroll">
            <div className="st-group">
              {[
                { k: "public", t: "Public", ic: ST_IC.globe },
                { k: "friends", t: "Friends", ic: ST_IC.friends },
              ].map((o) => (
                <button key={o.k} className="st-row" onClick={() => api.setPrefs({ privacy: o.k })}>
                  <StIco d={o.ic} />
                  <span style={{ flex: 1 }}>
                    {o.t}
                    <small>{o.k === "public" ? "Default privacy for new stories" : "Only friends see new stories"}</small>
                  </span>
                  {(props.prefs.privacy || "public") === o.k && <StIco d={ST_IC.check} />}
                </button>
              ))}
            </div>
            <div className="st-group">
              <button className="st-row" onClick={() => api.setPrefs({ archive: !props.prefs.archive })}>
                <StIco d={ST_IC.history} />
                <span style={{ flex: 1 }}>
                  Save to archive
                  <small>Expired stories are saved to your private archive.</small>
                </span>
                <b style={{ color: props.prefs.archive ? "#22c55e" : "#a8abaf" }}>{props.prefs.archive ? "On" : "Off"}</b>
              </button>
            </div>
            <div className="st-sheet-title" style={{ textAlign: "left", fontSize: 15 }}>Muted stories</div>
            {Object.keys(props.prefs.muted || {}).length === 0 && <div className="st-empty">You haven't muted anyone's stories</div>}
            {Object.keys(props.prefs.muted || {}).map((mu) => {
              const u = props.allUsers.find((x: any) => x.uid === mu) || { uid: mu, name: "MeBook user" }
              return (
                <StUser
                  key={mu}
                  u={u}
                  avatarUrl={props.avatarUrl}
                  right={<button className="st-sbtn" onClick={() => api.unmute(mu)}>Unmute</button>}
                />
              )
            })}
          </div>
        </StSheet>
      )}
    </div>
  )
}

/* ---------- Main section: stories bar + all story logic ---------- */

function StoriesSection(props: {
  user: any
  profile: any
  allUsers: any[]
  myFriends: any[]
  hiddenAuthors: Set<string>
  avatarUrl: (u: any) => string
  showToast: (title: string, msg?: string, type?: "success" | "error" | "info") => void
  onUnfollow: (uid: string) => void
  onOpenProfile: (uid: string) => void
}) {
  const user = props.user
  const profile = props.profile
  const uidNow = user && user.uid ? user.uid : ""
  const me = {
    uid: uidNow,
    name: (profile && profile.name) || (user && user.displayName) || "User",
    photoURL: (profile && profile.photoURL) || "",
    verified: !!(profile && profile.verified === true),
  }

  const [others, setOthers] = useState<any[]>([])
  const [mine, setMine] = useState<any[]>([])
  const [loadedFlags, setLoadedFlags] = useState({ o: false, m: false })
  const [now, setNow] = useState(Date.now())
  const [prefs, setPrefsState] = useState<any>(() => stLoadPrefs(uidNow))
  const [viewer, setViewer] = useState<any>(null)
  const [creating, setCreating] = useState<any>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const pendingMusic = useRef<any>(null)
  const prefsRef = useRef<any>(prefs)
  prefsRef.current = prefs
  const deepDone = useRef(false)

  useEffect(() => {
    if (uidNow) setPrefsState(stLoadPrefs(uidNow))
  }, [uidNow])

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!uidNow) return
    let dead = false
    let off1: any = null
    let off2: any = null
    ;(async () => {
      try {
        const fb = await getFirebase()
        if (dead) return
        const q1 = fb.query(fb.collection(fb.db, "stories"), fb.where("expiresAt", ">", Date.now()))
        off1 = fb.onSnapshot(
          q1,
          (snap: any) => {
            const a: any[] = []
            snap.forEach((d: any) => a.push({ id: d.id, ...d.data() }))
            setOthers(a.filter((x) => x.uid !== uidNow))
            setLoadedFlags((f) => ({ ...f, o: true }))
          },
          () => setLoadedFlags((f) => ({ ...f, o: true }))
        )
        const q2 = fb.query(fb.collection(fb.db, "stories"), fb.where("uid", "==", uidNow))
        off2 = fb.onSnapshot(
          q2,
          (snap: any) => {
            const a: any[] = []
            snap.forEach((d: any) => a.push({ id: d.id, ...d.data() }))
            setMine(a)
            setLoadedFlags((f) => ({ ...f, m: true }))
          },
          () => setLoadedFlags((f) => ({ ...f, m: true }))
        )
      } catch {}
    })()
    return () => {
      dead = true
      if (off1) off1()
      if (off2) off2()
    }
  }, [uidNow])

  useEffect(() => {
    if (!viewer && !creating) return
    const o = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = o
    }
  }, [!!viewer, !!creating])

  /* ----- build groups ----- */
  const friendSet = new Set<string>((props.myFriends || []).map((f: any) => f.uid))
  const friendUsers = (props.myFriends || []).map((f: any) => props.allUsers.find((u: any) => u.uid === f.uid) || f)
  const isActive = (s: any) => !s.archived && Number(s.expiresAt || 0) > now
  const visibleOthers = others.filter(
    (s) =>
      isActive(s) &&
      (s.privacy !== "friends" || friendSet.has(s.uid)) &&
      !props.hiddenAuthors.has(s.uid) &&
      !(prefs.muted && prefs.muted[s.uid])
  )
  const mkGroups = (arr: any[]) => {
    const m = new Map<string, any>()
    arr.forEach((s) => {
      if (!m.has(s.uid)) {
        const u = props.allUsers.find((x: any) => x.uid === s.uid)
        m.set(s.uid, { uid: s.uid, name: (u && u.name) || s.name || "User", photoURL: (u && u.photoURL) || s.photoURL || "", stories: [] })
      }
      m.get(s.uid).stories.push(s)
    })
    const out = Array.from(m.values())
    out.forEach((gr: any) => {
      gr.stories.sort((a: any, b: any) => (a.createdMs || 0) - (b.createdMs || 0))
      gr.unseen = gr.stories.some((s: any) => !(s.viewers && s.viewers[uidNow]))
      gr.last = gr.stories[gr.stories.length - 1]
    })
    return out
  }
  const rank = (gr: any) =>
    prefs.interested && prefs.interested[gr.uid] ? 0 : prefs.notInterested && prefs.notInterested[gr.uid] ? 3 : gr.unseen ? 1 : 2
  const otherGroups = mkGroups(visibleOthers).sort((a: any, b: any) => rank(a) - rank(b) || (b.last.createdMs || 0) - (a.last.createdMs || 0))
  const ownGroup: any = mkGroups(mine.filter(isActive).map((s) => ({ ...s, uid: uidNow })))[0] || null
  if (ownGroup) {
    ownGroup.name = me.name
    ownGroup.photoURL = me.photoURL
  }
  const getGroup = (u: string) => (ownGroup && ownGroup.uid === u ? ownGroup : otherGroups.find((x: any) => x.uid === u) || null)
  const archived = mine
    .filter((s) => (s.archived || Number(s.expiresAt || 0) <= now) && !s.noArchive)
    .sort((a, b) => (b.createdMs || 0) - (a.createdMs || 0))

  const openGroup = (gr: any, storyId?: string) => {
    const order = [ownGroup, ...otherGroups].filter(Boolean).map((x: any) => x.uid)
    let start = gr.uid === uidNow ? 0 : Math.max(0, gr.stories.findIndex((s: any) => !(s.viewers && s.viewers[uidNow])))
    if (storyId) {
      const i = gr.stories.findIndex((s: any) => s.id === storyId)
      if (i >= 0) start = i
    }
    setViewer({ order, uid: gr.uid, si: start })
  }

  // shared link (#story-ID) খোলা
  useEffect(() => {
    if (deepDone.current) return
    if (typeof location === "undefined") return
    const h = location.hash || ""
    if (h.indexOf("#story-") !== 0) {
      deepDone.current = true
      return
    }
    if (!loadedFlags.o || !loadedFlags.m) return
    deepDone.current = true
    const id = h.slice(7)
    const all = [ownGroup, ...otherGroups].filter(Boolean)
    const gr: any = all.find((x: any) => x.stories.some((s: any) => s.id === id))
    if (gr) openGroup(gr, id)
    else props.showToast("Story unavailable", "This story has expired or was removed", "info")
    try { history.replaceState(null, "", location.pathname + location.search) } catch {}
  })

  /* ----- helpers / api ----- */
  const toast = props.showToast
  const storyUrl = (s: any) => `${location.origin}${location.pathname}#story-${s.id}`
  const setPrefs = (patch: any) => {
    const next = { ...prefsRef.current, ...patch }
    prefsRef.current = next
    setPrefsState(next)
    stSavePrefs(uidNow, next)
  }
  const refOf = async (s: any) => {
    const fb = await getFirebase()
    return { fb, ref: fb.doc(fb.db, "stories", s.id) }
  }
  const sendChat = async (toUid: string, text: string, preview: string) => {
    try {
      const fb = await getFirebase()
      const cid = chatIdFor(uidNow, toUid)
      const cref = fb.doc(fb.db, "chats", cid)
      const snap = await fb.getDoc(cref)
      if (!snap.exists()) {
        await fb.setDoc(cref, {
          members: [uidNow, toUid],
          createdAt: fb.serverTimestamp(),
          lastMessage: null,
          lastAt: fb.serverTimestamp(),
        })
      }
      await fb.addDoc(fb.collection(fb.db, "chats", cid, "messages"), {
        from: uidNow,
        text,
        at: fb.serverTimestamp(),
      })
      await fb.updateDoc(cref, { lastMessage: { text: preview, from: uidNow }, lastAt: fb.serverTimestamp() })
      return true
    } catch (e: any) {
      toast("Couldn't send", e && e.message ? e.message : "", "error")
      return false
    }
  }
  const copyText = async (t: string) => {
    try {
      await navigator.clipboard.writeText(t)
      return true
    } catch {
      try {
        const ta = document.createElement("textarea")
        ta.value = t
        document.body.appendChild(ta)
        ta.select()
        document.execCommand("copy")
        ta.remove()
        return true
      } catch {
        return false
      }
    }
  }

  const api: any = {
    markViewed: async (s: any) => {
      try {
        const { fb, ref } = await refOf(s)
        if (s.viewers && s.viewers[uidNow]) await fb.updateDoc(ref, { rewatches: fb.increment(1) })
        else await fb.updateDoc(ref, { ["viewers." + uidNow]: Date.now() })
      } catch {}
    },
    react: async (s: any, key: string) => {
      const had = s.reactions && s.reactions[uidNow] === key
      try {
        const { fb, ref } = await refOf(s)
        await fb.updateDoc(ref, { ["reactions." + uidNow]: had ? "" : key })
      } catch (e: any) {
        toast("Couldn't react", e && e.message ? e.message : "", "error")
      }
    },
    reply: async (s: any, text: string) => {
      const ok = await sendChat(s.uid, `📖 Replied to your story: ${text}`, "📖 Replied to your story")
      if (ok) toast("Reply sent", "", "success")
    },
    sendToChat: async (s: any, friendUid: string) => {
      const ok = await sendChat(friendUid, `📖 ${s.name || "A"}'s story\n${storyUrl(s)}`, "📖 Shared a story")
      if (ok) toast("Sent", "", "success")
      return ok
    },
    copyLink: async (s: any) => {
      const ok = await copyText(storyUrl(s))
      toast(ok ? "Link copied" : "Couldn't copy", "", ok ? "success" : "error")
    },
    shareWA: (s: any) => {
      try {
        window.open("https://wa.me/?text=" + encodeURIComponent(`${s.name || "A"}'s story on MeBook: ${storyUrl(s)}`), "_blank")
      } catch {}
    },
    nativeShare: async (s: any) => {
      try {
        if ((navigator as any).share) await (navigator as any).share({ title: `${s.name || "MeBook"}'s story`, url: storyUrl(s) })
        else api.copyLink(s)
      } catch {}
    },
    savePhoto: async (s: any) => {
      try {
        const r = await fetch(s.image)
        const b = await r.blob()
        const a = document.createElement("a")
        a.href = URL.createObjectURL(b)
        a.download = "mebook-story-" + s.id + ".jpg"
        document.body.appendChild(a)
        a.click()
        a.remove()
        setTimeout(() => URL.revokeObjectURL(a.href), 4000)
        toast("Photo saved", "", "success")
      } catch {
        try { window.open(s.image, "_blank") } catch {}
      }
    },
    archive: async (s: any) => {
      try {
        const { fb, ref } = await refOf(s)
        await fb.updateDoc(ref, { archived: true })
        toast("Story archived", "Saved to your private archive", "success")
      } catch (e: any) {
        toast("Error", e && e.message ? e.message : "", "error")
      }
    },
    remove: async (s: any) => {
      try {
        const { fb, ref } = await refOf(s)
        await fb.deleteDoc(ref)
        toast("Story deleted", "", "success")
      } catch (e: any) {
        toast("Error", e && e.message ? e.message : "", "error")
      }
    },
    removeArchived: async (s: any) => {
      if (!confirm("Delete this story from your archive?")) return
      api.remove(s)
    },
    repost: async (s: any) => {
      try {
        const fb = await getFirebase()
        const t = Date.now()
        await fb.addDoc(fb.collection(fb.db, "stories"), {
          uid: uidNow,
          name: me.name,
          photoURL: me.photoURL,
          verified: me.verified,
          image: s.image,
          filter: s.filter || "none",
          overlays: s.overlays || [],
          music: s.music || null,
          aiLabel: !!s.aiLabel,
          privacy: s.privacy || prefsRef.current.privacy || "public",
          mentions: s.mentions || [],
          viewers: {},
          reactions: {},
          rewatches: 0,
          archived: false,
          noArchive: !prefsRef.current.archive,
          createdAt: fb.serverTimestamp(),
          createdMs: t,
          expiresAt: t + STORY_TTL,
        })
        toast("Story shared again", "Visible for 24 hours", "success")
      } catch (e: any) {
        toast("Error", e && e.message ? e.message : "", "error")
      }
    },
    setPrivacy: async (s: any, p: string) => {
      try {
        const { fb, ref } = await refOf(s)
        await fb.updateDoc(ref, { privacy: p })
        toast("Privacy updated", p === "friends" ? "Only your friends can see this story" : "Anyone on MeBook can see this story", "success")
      } catch (e: any) {
        toast("Error", e && e.message ? e.message : "", "error")
      }
    },
    addMention: async (s: any, u: any) => {
      try {
        const { fb, ref } = await refOf(s)
        const ov = {
          id: stId(),
          kind: "mention",
          text: "@" + (u.name || "user"),
          color: "",
          bg: false,
          x: 50,
          y: Math.min(88, 72 + (s.overlays || []).filter((o: any) => o.kind === "mention").length * 6),
          scale: 1,
          uid: u.uid,
        }
        await fb.updateDoc(ref, { overlays: fb.arrayUnion(ov), mentions: fb.arrayUnion(u.uid) })
        if (u.uid !== uidNow) {
          try {
            await fb.addDoc(fb.collection(fb.db, "notifications"), {
              uid: u.uid,
              fromUid: uidNow,
              fromName: me.name,
              fromAvatar: me.photoURL,
              title: "Story mention",
              message: `${me.name} mentioned you in their story.`,
              type: "post",
              read: false,
              createdAt: fb.serverTimestamp(),
            })
          } catch {}
        }
        toast("Mentioned", u.name || "", "success")
      } catch (e: any) {
        toast("Error", e && e.message ? e.message : "", "error")
      }
    },
    highlight: async (s: any) => {
      const list: string[] = Array.isArray(profile && profile.highlights) ? profile.highlights : []
      if (list.includes(s.image)) {
        toast("Already in highlights", "", "info")
        return
      }
      if (list.length >= 10) {
        toast("Highlights full", "You can add up to 10 highlights", "info")
        return
      }
      try {
        const fb = await getFirebase()
        await fb.updateDoc(fb.doc(fb.db, "users", uidNow), { highlights: fb.arrayUnion(s.image) })
        toast("Added to highlights", "Shown on your profile", "success")
      } catch (e: any) {
        toast("Error", e && e.message ? e.message : "", "error")
      }
    },
    report: async (s: any, reason: string) => {
      try {
        const fb = await getFirebase()
        await fb.addDoc(fb.collection(fb.db, "story_reports"), {
          uid: uidNow,
          storyId: s.id,
          storyUid: s.uid,
          reason,
          createdAt: fb.serverTimestamp(),
        })
        toast("Reported", "Thanks! We'll review this story", "success")
      } catch (e: any) {
        toast("Error", e && e.message ? e.message : "Report failed", "error")
      }
    },
    bug: async (s: any) => {
      api.report(s, "Something went wrong")
    },
    setInterest: (u: string, kind: string) => {
      const p = prefsRef.current
      const interested = { ...(p.interested || {}) }
      const notInterested = { ...(p.notInterested || {}) }
      if (kind === "yes") {
        delete notInterested[u]
        interested[u] = 1
        toast("Marked as interested", "You'll see more stories like this", "success")
      } else {
        delete interested[u]
        notInterested[u] = 1
        toast("Marked as not interested", "You'll see fewer stories like this", "info")
      }
      setPrefs({ interested, notInterested })
    },
    mute: (u: string) => {
      setPrefs({ muted: { ...(prefsRef.current.muted || {}), [u]: 1 } })
      toast("Stories muted", "You won't see their stories anymore", "info")
    },
    unmute: (u: string) => {
      const m = { ...(prefsRef.current.muted || {}) }
      delete m[u]
      setPrefs({ muted: m })
      toast("Unmuted", "", "success")
    },
    unfollow: (u: string) => {
      props.onUnfollow(u)
    },
    setPrefs,
  }

  /* ----- create flow ----- */
  const openPicker = (music?: any) => {
    pendingMusic.current = music || null
    setViewer(null)
    if (fileRef.current) fileRef.current.click()
  }
  const onFile = (e: any) => {
    const f = e.target.files && e.target.files[0]
    e.target.value = ""
    if (!f) return
    if (!/^image\//.test(f.type)) {
      toast("Photos only", "Choose an image for your story", "info")
      return
    }
    setCreating({ file: f, music: pendingMusic.current })
  }

  const host = typeof document !== "undefined" ? (document.querySelector(".mebook-root") as HTMLElement | null) : null
  const portal = (node: any) => (host ? createPortal(node, host) : null)

  const card = (gr: any, own: boolean) => {
    const last = gr.last
    return (
      <div key={gr.uid} className="st-card" onClick={() => openGroup(gr)}>
        <img className="st-card-bg" src={last.image} alt="" style={{ filter: storyFilterCss(last.filter) }} loading="lazy" />
        <div className="st-card-shade" />
        <img className={`st-ring${own || gr.unseen ? " new" : ""}`} src={props.avatarUrl({ photoURL: gr.photoURL, name: gr.name })} alt="" />
        <div className="st-card-name">{own ? "Your story" : gr.name}</div>
      </div>
    )
  }

  if (!uidNow) return null

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onFile} />
      <div className="st-bar">
        <div className="st-card st-create" onClick={() => openPicker()}>
          <div className="st-create-img" style={{ backgroundImage: `url("${props.avatarUrl(profile)}")` }} />
          <div className="st-create-foot">Create story</div>
          <div className="st-plus">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
          </div>
        </div>
        {ownGroup && card(ownGroup, true)}
        {otherGroups.map((gr: any) => card(gr, false))}
      </div>

      {viewer &&
        portal(
          <StoryViewer
            order={viewer.order}
            startUid={viewer.uid}
            startIndex={viewer.si}
            getGroup={getGroup}
            me={me}
            friendSet={friendSet}
            allUsers={props.allUsers}
            myFriends={friendUsers}
            archived={archived}
            prefs={prefs}
            api={api}
            avatarUrl={props.avatarUrl}
            onClose={() => setViewer(null)}
            onOpenProfile={props.onOpenProfile}
            onCreate={openPicker}
          />
        )}

      {creating &&
        portal(
          <StoryCreator
            file={creating.file}
            initialMusic={creating.music}
            me={me}
            allUsers={props.allUsers}
            defaultPrivacy={prefs.privacy || "public"}
            archive={prefs.archive !== false}
            avatarUrl={props.avatarUrl}
            onClose={() => setCreating(null)}
            showToast={toast}
            onPosted={(id, wa) => {
              setCreating(null)
              toast("Story shared", "Visible for 24 hours", "success")
              if (wa) {
                try {
                  window.open(
                    "https://wa.me/?text=" + encodeURIComponent(`${me.name}'s story on MeBook: ${location.origin}${location.pathname}#story-${id}`),
                    "_blank"
                  )
                } catch {}
              }
            }}
          />
        )}
    </>
  )
}

/* ============================================================
CREATE POST SCREEN (dark, Facebook-style "New post")
============================================================ */

const CP_FEELINGS: string[][] = [
  ["😀", "Happy"], ["🥰", "Loved"], ["😍", "Excited"], ["😎", "Cool"], ["🤩", "Amazing"], ["🥳", "Celebrating"],
  ["😭", "Sad"], ["😡", "Angry"], ["🤔", "Thoughtful"], ["😴", "Tired"], ["🙏", "Blessed"], ["💪", "Motivated"],
  ["🍿", "Watching a movie"], ["🎬", "Inspired"],
]

function PostMusicChip({ music }: { music: any }) {
  const a = useRef<HTMLAudioElement | null>(null)
  const [on, setOn] = useState(false)
  useEffect(() => {
    return () => {
      try { if (a.current) a.current.pause() } catch {}
    }
  }, [])
  const toggle = () => {
    const el = a.current
    if (!el) return
    if (on) {
      el.pause()
      setOn(false)
    } else {
      el.play().then(() => setOn(true)).catch(() => setOn(false))
    }
  }
  return (
    <div className="cp2-musicline">
      <StIco d={ST_IC.music} size={18} />
      <span>
        {music.title}
        {music.artist ? " · " + music.artist : ""}
      </span>
      <button onClick={toggle}>{on ? "Pause" : "Play"}</button>
      <audio ref={a} src={music.url} onEnded={() => setOn(false)} />
    </div>
  )
}

function CreatePostScreen(props: {
  profile: any
  avatarUrl: (u: any) => string
  allUsers: any[]
  text: string
  setText: (v: string) => void
  movie: string
  setMovie: (v: string) => void
  previewUrl: string
  hasFile: boolean
  onPickFile: (e: any) => void
  onRemove: () => void
  progress: number | null
  busy: boolean
  onClose: () => void
  onSubmit: () => void
  audience: string
  setAudience: (v: string) => void
  feeling: string
  setFeeling: (v: string) => void
  location: string
  setLocation: (v: string) => void
  music: any
  setMusic: (m: any) => void
  tagged: any[]
  setTagged: (t: any[]) => void
  showToast: (title: string, msg?: string, type?: "success" | "error" | "info") => void
}) {
  const [sheet, setSheet] = useState<string | null>(null)
  const [locDraft, setLocDraft] = useState(props.location)
  const [movieOpen, setMovieOpen] = useState(!!props.movie)
  const fileInput = useRef<HTMLInputElement>(null)
  const canPost = !!(props.text.trim() || props.hasFile) && !props.busy

  const audMeta: Record<string, { t: string; s: string; ic: string }> = {
    public: { t: "Public", s: "Anyone on MeBook", ic: ST_IC.globe },
    friends: { t: "Friends", s: "Only your friends", ic: ST_IC.friends },
    only_me: { t: "Only me", s: "Only you can see this post", ic: ST_IC.lock },
  }
  const am = audMeta[props.audience] || audMeta.public
  const soon = (w: string) => props.showToast(w + " isn't available yet", "", "info")

  const sub: string[] = []
  if (props.feeling) sub.push("is feeling " + props.feeling)
  if (props.tagged.length) sub.push("with " + props.tagged.map((t: any) => t.name || "user").join(", "))
  if (props.location) sub.push("at " + props.location)

  const pinPath = "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"
  const filmPath = "M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"
  const camPath = "M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"

  return (
    <div className="cp2">
      <input ref={fileInput} type="file" accept="image/*" style={{ display: "none" }} onChange={props.onPickFile} />

      <div className="cp2-top">
        <button className="cp2-x" onClick={props.onClose} aria-label="Close">
          <StIco d={ST_IC.close} size={28} />
        </button>
        <b>New post</b>
        <button className="cp2-next" disabled={!canPost} onClick={props.onSubmit}>
          {props.busy ? "Posting..." : "Post"}
        </button>
      </div>

      <div className="cp2-body">
        <div className="cp2-user">
          <img src={props.avatarUrl(props.profile)} alt="" />
          <div>
            <b>{props.profile.name}</b>
            {sub.length > 0 && <span> {sub.join(" · ")}</span>}
          </div>
        </div>

        <div className="cp2-chips">
          <button className={`cp2-chip${props.music ? " on" : ""}`} onClick={() => setSheet("music")}>
            <StIco d={ST_IC.music} size={22} />
            Music
          </button>
          <button className={`cp2-chip${props.tagged.length ? " on" : ""}`} onClick={() => setSheet("tag")}>
            <StIco d={ST_IC.friends} size={22} />
            Tag/collaborate
          </button>
          <button className={`cp2-chip${props.location ? " on" : ""}`} onClick={() => { setLocDraft(props.location); setSheet("loc") }}>
            <StIco d={pinPath} size={22} />
            Location
          </button>
          <button className={`cp2-chip${props.feeling ? " on" : ""}`} onClick={() => setSheet("feel")}>
            <StIco d={ST_IC.sticker} size={22} />
            Feeling
          </button>
          <button className={`cp2-chip${movieOpen || props.movie ? " on" : ""}`} onClick={() => setMovieOpen((v) => !v)}>
            <StIco d={filmPath} size={22} />
            Movie
          </button>
        </div>

        <textarea
          className="cp2-text"
          placeholder="What's on your mind?"
          value={props.text}
          onChange={(e) => props.setText(e.target.value)}
          autoFocus
        />

        {movieOpen && (
          <div className="cp2-movie">
            <StIco d={filmPath} size={20} />
            <input
              type="text"
              placeholder="Movie name (e.g. Interstellar)"
              value={props.movie}
              onChange={(e) => props.setMovie(e.target.value)}
            />
          </div>
        )}

        {props.music && (
          <div className="cp2-musicline">
            <StIco d={ST_IC.music} size={18} />
            <span>
              {props.music.title}
              {props.music.artist ? " · " + props.music.artist : ""}
            </span>
            <button onClick={() => props.setMusic(null)}>Remove</button>
          </div>
        )}

        {props.previewUrl && (
          <div className="cp2-preview">
            <img src={props.previewUrl} alt="preview" />
            <button onClick={props.onRemove} aria-label="Remove photo">
              <StIco d={ST_IC.close} size={18} />
            </button>
          </div>
        )}

        {props.progress !== null && (
          <div style={{ marginTop: 12 }}>
            <div className="cp2-prog">
              <i style={{ width: props.progress + "%" }} />
            </div>
            <div style={{ fontSize: 12, color: "#9a9da1", marginTop: 4 }}>Uploading... {props.progress}%</div>
          </div>
        )}
      </div>

      <div className="cp2-tiles">
        <button onClick={() => fileInput.current && fileInput.current.click()}>
          <StIco d={ST_IC.image} size={34} />
          Gallery
        </button>
        <button onClick={() => soon("GIF")}>
          <span className="cp2-gif">GIF</span>
          GIF
        </button>
        <button onClick={() => soon("Live")}>
          <StIco d={camPath} size={34} />
          Live
        </button>
        <button onClick={() => soon("Background")}>
          <StIco d={ST_IC.sparkle} size={34} />
          Background
        </button>
      </div>

      <div className="cp2-foot">
        <button className="cp2-chip" onClick={() => setSheet("aud")}>
          <StIco d={am.ic} size={22} />
          {am.t}
        </button>
        <button className="cp2-chip" onClick={() => soon("Cross-posting")}>
          <StIco d={ST_IC.share} size={22} />
          Off
        </button>
      </div>

      {sheet === "music" && (
        <StoryMusicSheet
          onClose={() => setSheet(null)}
          onError={(m) => props.showToast("Music", m, "error")}
          onPick={(m) => {
            props.setMusic(m)
            setSheet(null)
          }}
        />
      )}

      {sheet === "tag" && (
        <StSheet title="Tag people" onClose={() => setSheet(null)} tall>
          {props.tagged.length > 0 && (
            <button className="st-sbtn ghost" style={{ marginBottom: 10, alignSelf: "flex-start" }} onClick={() => props.setTagged([])}>
              Clear tags ({props.tagged.length})
            </button>
          )}
          <StUserPicker
            users={props.allUsers}
            avatarUrl={props.avatarUrl}
            empty="No people found"
            action="Tag"
            doneLabel="Tagged"
            doneIds={props.tagged.map((t: any) => t.uid)}
            onPick={(u) => props.setTagged([...props.tagged, { uid: u.uid, name: u.name || "user" }])}
          />
        </StSheet>
      )}

      {sheet === "loc" && (
        <StSheet title="Add location" onClose={() => setSheet(null)}>
          <input
            className="st-search"
            placeholder="Where are you? (e.g. Dhaka)"
            value={locDraft}
            maxLength={60}
            autoFocus
            onChange={(e) => setLocDraft(e.target.value)}
          />
          <div style={{ display: "flex", gap: 10 }}>
            <button
              className="st-sbtn ghost"
              style={{ flex: 1, padding: "11px 10px" }}
              onClick={() => {
                props.setLocation("")
                setSheet(null)
              }}
            >
              Remove
            </button>
            <button
              className="st-sbtn"
              style={{ flex: 1, padding: "11px 10px" }}
              onClick={() => {
                props.setLocation(locDraft.trim())
                setSheet(null)
              }}
            >
              Done
            </button>
          </div>
        </StSheet>
      )}

      {sheet === "feel" && (
        <StSheet title="How are you feeling?" onClose={() => setSheet(null)} tall>
          <div className="st-musicscroll">
            {props.feeling && (
              <button
                className="st-row"
                onClick={() => {
                  props.setFeeling("")
                  setSheet(null)
                }}
              >
                <StIco d={ST_IC.close} />
                Remove feeling
              </button>
            )}
            {CP_FEELINGS.map((f) => (
              <button
                key={f[1]}
                className="st-row"
                onClick={() => {
                  props.setFeeling(f[0] + " " + f[1])
                  setSheet(null)
                }}
              >
                <span style={{ fontSize: 26 }}>{f[0]}</span>
                {f[1]}
              </button>
            ))}
          </div>
        </StSheet>
      )}

      {sheet === "aud" && (
        <StSheet title="Who can see your post?" onClose={() => setSheet(null)}>
          <div className="st-group">
            {Object.keys(audMeta).map((k) => (
              <button
                key={k}
                className="st-row"
                onClick={() => {
                  props.setAudience(k)
                  setSheet(null)
                }}
              >
                <StIco d={audMeta[k].ic} />
                <span style={{ flex: 1 }}>
                  {audMeta[k].t}
                  <small>{audMeta[k].s}</small>
                </span>
                {props.audience === k && <StIco d={ST_IC.check} />}
              </button>
            ))}
          </div>
        </StSheet>
      )}
    </div>
  )
}

interface MeBookPageProps {
  onExit: () => void
}

/* ============================================================
MECHAT — CHAT LIST EXTRAS (long-press menu, pin/archive/ignore/mute/
unread/chat-head/delete, groups: add members + leave)
============================================================ */
const MC_IC: any = {
  pin: "M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z",
  archive: "M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z",
  ignore: "M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z",
  addUser: "M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
  bell: "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z",
  bellOff: "M20 18.69L7.84 6.14 5.27 3.49 4 4.76l2.8 2.8v.01c-.52.99-.8 2.16-.8 3.42v5l-2 2v1h13.73l2 2L21 19.72l-1-1.03zM12 22c1.11 0 2-.89 2-2h-4c0 1.11.89 2 2 2zm6-7.32V11c0-3.08-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68c-.15.03-.29.08-.42.12L18 14.68z",
  head: "M9 3a6 6 0 100 12A6 6 0 009 3zm8.5 6.2A7.97 7.97 0 0117 12.9 8 8 0 019.1 20c-.3 0-.6 0-.9-.1A6 6 0 0018 15.9a6 6 0 00-.5-6.7z",
  unread: "M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z",
  leave: "M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z",
  trash: "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
  back: "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z",
  folder: "M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z",
  check: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
}

function mcVerifiedBadge(size: any) {
  return React.createElement("svg", { className: "mc-vbadge", width: size, height: size, viewBox: "0 0 24 24", fill: "#22c55e", style: { flexShrink: 0 } },
    React.createElement("path", { d: "M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69l-3.61.82.34 3.69L1 12l2.44 2.79-.34 3.7 3.61.82L8.6 22.5l3.4-1.47 3.4 1.46 1.89-3.19 3.61-.82-.34-3.69L23 12zm-12.91 4.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z" }))
}

function mcIcon(d: any, size: any) {
  return React.createElement("svg", { viewBox: "0 0 24 24", width: size, height: size, fill: "currentColor" },
    React.createElement("path", { d: d }))
}

const mcEmptyPrefs = (): any => ({ pinned: {}, archived: {}, ignored: {}, muted: {}, unread: {}, deleted: {} })

function mcLoadPrefs(uid: any): any {
  try {
    const raw = localStorage.getItem("mebook-chatprefs-" + uid)
    if (!raw) return mcEmptyPrefs()
    return Object.assign(mcEmptyPrefs(), JSON.parse(raw))
  } catch (e) {
    return mcEmptyPrefs()
  }
}

function mcSavePrefs(uid: any, p: any) {
  try { localStorage.setItem("mebook-chatprefs-" + uid, JSON.stringify(p)) } catch (e) {}
}

function mcDropDeleted(arr: any, del: any) {
  if (!del) return
  for (let i = arr.length - 1; i >= 0; i--) {
    const s = arr[i].at && arr[i].at.seconds
    if (s && s <= del) arr.splice(i, 1)
  }
}

/* ---- Bottom sheet (long press menu) ---- */
function McChatSheet(props: any) {
  const chat = props.chat
  const prefs = props.prefs
  const mountedAt = React.useRef(Date.now())
  const id = chat.id
  const isGroup = !!chat.isGroup
  const rows: any[] = [
    { k: "pin", icon: MC_IC.pin, label: prefs.pinned[id] ? "Unpin" : "Pin" },
    { k: "archive", icon: MC_IC.archive, label: prefs.archived[id] ? "Unarchive" : "Archive" },
    { k: "ignore", icon: MC_IC.ignore, label: prefs.ignored[id] ? "Unignore" : "Ignore" },
    { k: "addMembers", icon: MC_IC.addUser, label: "Add members" },
    { k: "mute", icon: prefs.muted[id] ? MC_IC.bellOff : MC_IC.bell, label: prefs.muted[id] ? "Unmute" : "Mute" },
    { k: "chatHead", icon: MC_IC.head, label: "Open chat head" },
    { k: "unread", icon: MC_IC.unread, label: prefs.unread[id] ? "Mark as read" : "Mark as unread" },
  ]
  if (isGroup) rows.push({ k: "leave", icon: MC_IC.leave, label: "Leave group", danger: true })
  rows.push({ k: "delete", icon: MC_IC.trash, label: "Delete", danger: true })
  const guard = () => Date.now() - mountedAt.current < 450
  return React.createElement("div", { className: "mc-sheet-overlay", onClick: () => { if (!guard()) props.onClose() } },
    React.createElement("div", { className: "mc-sheet", onClick: (e: any) => e.stopPropagation() },
      React.createElement("div", { className: "mc-sheet-handle" }),
      React.createElement("div", { className: "mc-sheet-head" },
        React.createElement("img", { src: props.avatar, alt: "" }),
        React.createElement("b", null, chat.other.name, props.verified ? mcVerifiedBadge(15) : null)),
      rows.map((r: any) =>
        React.createElement("button", {
          key: r.k,
          className: "mc-sheet-row" + (r.danger ? " danger" : ""),
          onClick: () => { if (!guard()) props.onAction(r.k) },
        }, mcIcon(r.icon, 26), React.createElement("span", null, r.label)))))
}

/* ---- Confirm dialog ---- */
function McConfirm(props: any) {
  return React.createElement("div", { className: "mc-sheet-overlay mc-center", onClick: props.onNo },
    React.createElement("div", { className: "mc-dialog", onClick: (e: any) => e.stopPropagation() },
      React.createElement("h3", null, props.title),
      React.createElement("p", null, props.text),
      React.createElement("div", { className: "mc-dialog-actions" },
        React.createElement("button", { onClick: props.onNo }, "Cancel"),
        React.createElement("button", { className: "danger", onClick: props.onYes }, props.label))))
}

/* ---- Add members picker ---- */
function McAddMembers(props: any) {
  const chat = props.chat
  const [q, setQ] = React.useState("")
  const [sel, setSel] = React.useState([] as any)
  const exclude: any = {}
  exclude[props.me] = 1
  ;(chat.members || [chat.otherId]).forEach((m: any) => { exclude[m] = 1 })
  const ql = q.trim().toLowerCase()
  const list = props.users
    .filter((u: any) => u && u.uid && !exclude[u.uid] && (!ql || (u.name || "").toLowerCase().includes(ql)))
    .slice(0, 60)
  const toggle = (uid: any) => setSel((s: any) => s.includes(uid) ? s.filter((x: any) => x !== uid) : s.concat([uid]))
  return React.createElement("div", { className: "mc-sheet-overlay", onClick: props.onClose },
    React.createElement("div", { className: "mc-sheet mc-add", onClick: (e: any) => e.stopPropagation() },
      React.createElement("div", { className: "mc-sheet-handle" }),
      React.createElement("div", { className: "mc-add-title" }, chat.isGroup ? "Add members" : "Create group with " + chat.other.name),
      React.createElement("input", { className: "mc-add-search", placeholder: "Search people", value: q, onChange: (e: any) => setQ(e.target.value) }),
      React.createElement("div", { className: "mc-add-list" },
        list.length === 0
          ? React.createElement("div", { className: "mc-add-empty" }, "No people found")
          : list.map((u: any) => {
              const on = sel.includes(u.uid)
              return React.createElement("div", { key: u.uid, className: "mc-add-row", onClick: () => toggle(u.uid) },
                React.createElement("img", { src: props.avatarOf(u), alt: "" }),
                React.createElement("span", null, u.name, props.isVer && props.isVer(u) ? mcVerifiedBadge(14) : null),
                React.createElement("i", { className: on ? "on" : "" }, on ? mcIcon(MC_IC.check, 16) : null))
            })),
      React.createElement("button", {
        className: "mc-add-confirm",
        disabled: sel.length === 0,
        onClick: () => props.onConfirm(sel),
      }, (chat.isGroup ? "Add" : "Create group") + (sel.length ? " (" + sel.length + ")" : ""))))
}

/* ---- Floating chat head ---- */
function McChatHead(props: any) {
  const [pos, setPos] = React.useState({
    x: Math.max(0, window.innerWidth - 70),
    y: Math.max(90, Math.round(window.innerHeight * 0.55) - props.index * 72),
  })
  const st = React.useRef({ down: false, moved: false, sx: 0, sy: 0, ox: 0, oy: 0 })
  const onDown = (e: any) => {
    const s = st.current
    s.down = true; s.moved = false; s.sx = e.clientX; s.sy = e.clientY; s.ox = pos.x; s.oy = pos.y
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch (er) {}
  }
  const onMove = (e: any) => {
    const s = st.current
    if (!s.down) return
    const dx = e.clientX - s.sx
    const dy = e.clientY - s.sy
    if (Math.abs(dx) + Math.abs(dy) > 6) s.moved = true
    if (s.moved) setPos({
      x: Math.min(window.innerWidth - 58, Math.max(0, s.ox + dx)),
      y: Math.min(window.innerHeight - 70, Math.max(0, s.oy + dy)),
    })
  }
  const onUp = () => {
    const s = st.current
    if (!s.down) return
    s.down = false
    if (!s.moved) { props.onOpen(props.head); return }
    setPos((p: any) => ({ x: p.x + 29 < window.innerWidth / 2 ? 6 : window.innerWidth - 64, y: p.y }))
  }
  return React.createElement("div", {
    className: "mc-head",
    style: { left: pos.x, top: pos.y },
    onPointerDown: onDown, onPointerMove: onMove, onPointerUp: onUp, onPointerCancel: onUp,
  },
    React.createElement("img", { src: props.avatar, alt: "", draggable: false }),
    React.createElement("button", {
      className: "mc-head-x",
      onPointerDown: (e: any) => e.stopPropagation(),
      onClick: (e: any) => { e.stopPropagation(); props.onClose(props.head) },
    }, "\u00d7"))
}

/* ============================================================
   FACEBOOK-STYLE SEARCH PAGE (history, pin, advanced search)
   ============================================================ */

const SR_ICON = {
  back: "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z",
  search: "M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z",
  clock: "M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z",
  close: "M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
  dots: "M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z",
  trash: "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
  pin: "M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z",
  verified: "M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69l-3.61.82.34 3.69L1 12l2.44 2.79-.34 3.7 3.61.82L8.6 22.5l3.4-1.47 3.4 1.46 1.89-3.19 3.61-.82-.34-3.69L23 12zm-12.91 4.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z",
}

function SrIco({ d, size }: { d: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" style={size ? { width: size, height: size } : undefined}>
      <path d={d} />
    </svg>
  )
}

function srNorm(s: any): string {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function srLev(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1
  const prev = new Array(b.length + 1)
  for (let j = 0; j <= b.length; j++) prev[j] = j
  for (let i = 1; i <= a.length; i++) {
    let cur = [i]
    let rowMin = i
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      cur[j] = v
      if (v < rowMin) rowMin = v
    }
    if (rowMin > max) return max + 1
    for (let j = 0; j <= b.length; j++) prev[j] = cur[j]
  }
  return prev[b.length]
}

// score one token against a list of words (0 = no match)
function srTokenScore(tok: string, words: string[]): number {
  let best = 0
  for (const w of words) {
    let s = 0
    if (w === tok) s = 100
    else if (w.startsWith(tok)) s = 82
    else if (tok.length >= 2 && w.includes(tok)) s = 55
    else if (tok.length >= 4) {
      const allow = tok.length >= 7 ? 2 : 1
      const d = Math.min(
        srLev(tok, w, allow),
        w.length > tok.length ? srLev(tok, w.slice(0, tok.length), allow) : allow + 1
      )
      if (d <= allow) s = 42 - d * 8
    }
    if (s > best) best = s
    if (best === 100) break
  }
  return best
}

// all tokens must match (AND). returns total score or 0
function srScoreText(tokens: string[], text: string): number {
  const n = srNorm(text)
  if (!n) return 0
  const words = n.split(" ")
  let total = 0
  for (const t of tokens) {
    const s = srTokenScore(t, words)
    if (!s) return 0
    total += s
  }
  total /= tokens.length
  const phrase = tokens.join(" ")
  if (n === phrase) total += 60
  else if (n.startsWith(phrase)) total += 35
  else if (n.includes(phrase)) total += 20
  return total
}

function srEsc(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function srSnippet(caption: string, tokens: string[]) {
  const clean = String(caption || "")
    .replace(/\n+🔁 Shared from.*$/s, "")
    .replace(/\s+/g, " ")
    .trim()
  if (!clean) return null
  const low = clean.toLowerCase()
  let at = -1
  for (const t of tokens) {
    const i = low.indexOf(t)
    if (i !== -1 && (at === -1 || i < at)) at = i
  }
  const MAX = 110
  let start = 0
  if (at > 40) start = Math.max(0, at - 30)
  let part = clean.slice(start, start + MAX)
  const pre = start > 0 ? "…" : ""
  const post = start + MAX < clean.length ? "…" : ""
  if (!tokens.length) return <>{pre + part + post}</>
  const re = new RegExp("(" + tokens.filter((t) => t.length > 0).map(srEsc).join("|") + ")", "giu")
  const pieces = part.split(re)
  return (
    <>
      {pre}
      {pieces.map((p, i) =>
        i % 2 === 1 ? <mark key={i}>{p}</mark> : <React.Fragment key={i}>{p}</React.Fragment>
      )}
      {post}
    </>
  )
}

type SrHistItem = {
  key: string
  type: "user" | "query"
  uid?: string
  name: string
  photo?: string
  pinned?: boolean
  t: number
}

function SearchPage(props: {
  me: string
  query: string
  setQuery: (q: string) => void
  users: any[]
  posts: any[]
  avatarOf: (u: any) => string
  isVerUid: (uid: any, obj: any) => boolean
  onBack: () => void
  onOpenUser: (uid: string) => void
  onOpenPost: (post: any) => void
}) {
  const { me, query, setQuery, users, posts, avatarOf, isVerUid, onBack, onOpenUser, onOpenPost } = props
  const HKEY = "mebook_search_history_" + me
  const inputRef = useRef<HTMLInputElement>(null)

  const [hist, setHist] = useState<SrHistItem[]>([])
  const [hidden, setHidden] = useState<string[]>([])
  const [sheet, setSheet] = useState<{ item: SrHistItem; fromHistory: boolean } | null>(null)
  const [tab, setTab] = useState<"all" | "people" | "posts">("all")
  const [showHistory, setShowHistory] = useState(false)
  const [postLimit, setPostLimit] = useState(8)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HKEY)
      if (raw) setHist(JSON.parse(raw))
    } catch {}
    const t = setTimeout(() => inputRef.current?.focus(), 120)
    return () => clearTimeout(t)
  }, [HKEY])

  const saveHist = (next: SrHistItem[]) => {
    setHist(next)
    try {
      localStorage.setItem(HKEY, JSON.stringify(next.slice(0, 40)))
    } catch {}
  }

  const addHist = (item: Omit<SrHistItem, "t">) => {
    const old = hist.find((h) => h.key === item.key)
    const rest = hist.filter((h) => h.key !== item.key)
    saveHist([{ ...item, pinned: old?.pinned, t: Date.now() }, ...rest])
  }

  const pinCount = hist.filter((h) => h.pinned).length

  const togglePin = (item: SrHistItem) => {
    const exists = hist.find((h) => h.key === item.key)
    if (exists) {
      if (!exists.pinned && pinCount >= 3) return
      saveHist(hist.map((h) => (h.key === item.key ? { ...h, pinned: !h.pinned } : h)))
    } else if (pinCount < 3) {
      saveHist([{ ...item, pinned: true, t: Date.now() }, ...hist])
    }
    setSheet(null)
  }

  const removeItem = (item: SrHistItem, fromHistory: boolean) => {
    if (fromHistory) saveHist(hist.filter((h) => h.key !== item.key))
    else setHidden((h) => [...h, item.key])
    setSheet(null)
  }

  const userMap = React.useMemo(() => {
    const m: Record<string, any> = {}
    users.forEach((u) => (m[u.uid] = u))
    return m
  }, [users])

  // suggested = authors of the latest posts (newest first, unique)
  const suggested = React.useMemo(() => {
    const seen = new Set<string>()
    const out: Array<{ item: SrHistItem; post: any }> = []
    for (const p of posts) {
      const uid = p.authorId
      if (!uid || uid === me || seen.has(uid)) continue
      seen.add(uid)
      const u = userMap[uid]
      out.push({
        item: {
          key: "u:" + uid,
          type: "user",
          uid,
          name: u?.name || p.authorName || "User",
          photo: u ? avatarOf(u) : p.authorAvatar || "",
          t: 0,
        },
        post: p,
      })
      if (out.length >= 15) break
    }
    return out
  }, [posts, userMap, me])

  const latestPostOf = (uid?: string) => (uid ? posts.find((p) => p.authorId === uid) : null)

  const postAgeMs = (p: any) => {
    const ts = p?.createdAt
    if (!ts) return 0
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return Date.now() - d.getTime()
  }

  /* ---------- the search engine ---------- */
  const deferred = React.useDeferredValue(query)
  const tokens = React.useMemo(() => srNorm(deferred).split(" ").filter(Boolean), [deferred])

  const results = React.useMemo(() => {
    if (!tokens.length) return { people: [] as any[], posts: [] as any[] }

    const people = users
      .map((u) => {
        let s = srScoreText(tokens, u.name || "")
        if (!s && u.email) s = srScoreText(tokens, String(u.email).split("@")[0]) * 0.6
        if (s && u.uid === me) s *= 0.8
        if (s && isVerUid(u.uid, u)) s += 6
        return { u, s }
      })
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s || String(a.u.name).localeCompare(String(b.u.name)))
      .slice(0, 12)
      .map((x) => x.u)

    const found = posts
      .map((p) => {
        const cap = srScoreText(tokens, p.caption || "")
        const mov = srScoreText(tokens, p.movie || "") * 1.25
        const au = srScoreText(tokens, p.authorName || "") * 0.8
        // also allow tokens split across caption + movie + author
        const all = srScoreText(tokens, `${p.caption || ""} ${p.movie || ""} ${p.authorName || ""}`) * 0.7
        let s = Math.max(cap, mov, au, all)
        if (s) {
          const age = postAgeMs(p) / 86400000
          s += Math.max(0, 15 - age) // fresh posts float up
          s += Math.min(8, ((p.likes?.length || 0) + (p.comments?.length || 0)) * 0.5)
        }
        return { p, s }
      })
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((x) => x.p)

    return { people, posts: found }
  }, [tokens, users, posts, me])

  const rememberQuery = () => {
    const q = query.trim()
    if (!q) return
    addHist({ key: "q:" + srNorm(q), type: "query", name: q })
  }

  const openUserFromItem = (it: SrHistItem) => {
    if (!it.uid) return
    addHist({ key: it.key, type: "user", uid: it.uid, name: it.name, photo: it.photo })
    onOpenUser(it.uid)
  }

  const onItemClick = (it: SrHistItem) => {
    if (it.type === "user") openUserFromItem(it)
    else {
      setQuery(it.name)
      addHist({ key: it.key, type: "query", name: it.name })
      inputRef.current?.focus()
    }
  }

  const verified = (uid: any, obj?: any) =>
    isVerUid(uid, obj) ? (
      <svg viewBox="0 0 24 24" width="15" height="15" fill="#22c55e" style={{ flexShrink: 0 }}>
        <path d={SR_ICON.verified} />
      </svg>
    ) : null

  const renderItemRow = (it: SrHistItem, fromHistory: boolean) => {
    const lp = it.type === "user" ? (latestPostOf(it.uid) as any) : null
    const age = lp ? postAgeMs(lp) : Infinity
    const fresh = age < 86400000 * 2
    return (
      <div className="sr-row" key={(fromHistory ? "h" : "s") + it.key} onClick={() => onItemClick(it)}>
        {it.type === "user" ? (
          <img className="sr-av" src={it.photo || avatarOf({ name: it.name })} alt="" />
        ) : (
          <div className="sr-av-ico">
            <SrIco d={SR_ICON.clock} />
          </div>
        )}
        <div className="sr-info">
          <div className="sr-name">
            <span className="t">{it.name}</span>
            {it.type === "user" ? verified(it.uid) : null}
          </div>
          {(it.pinned || fresh) && (
            <div className="sr-sub">
              {it.pinned && (
                <svg className="pin" viewBox="0 0 24 24">
                  <path d={SR_ICON.pin} />
                </svg>
              )}
              {fresh && <span className="dot" />}
              <span>{fresh ? `New post · ${timeAgo(lp.createdAt)}` : "Pinned"}</span>
            </div>
          )}
        </div>
        <button
          className="sr-more"
          aria-label="More"
          onClick={(e) => {
            e.stopPropagation()
            setSheet({ item: it, fromHistory })
          }}
        >
          <SrIco d={SR_ICON.dots} />
        </button>
      </div>
    )
  }

  /* ---------- views ---------- */
  const q = query.trim()

  const sortedHist = [...hist].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.t - a.t)
  const histKeys = new Set(hist.map((h) => h.key))
  const suggestedItems = suggested.filter((s) => !histKeys.has(s.item.key) && !hidden.includes(s.item.key))

  const renderIdle = () => {
    if (showHistory) {
      return (
        <>
          <div className="sr-sec">
            <span>Search history</span>
            {hist.length > 0 && <button onClick={() => saveHist([])}>Clear all</button>}
          </div>
          {sortedHist.length === 0 ? (
            <div className="sr-empty">No recent searches</div>
          ) : (
            sortedHist.map((h) => renderItemRow(h, true))
          )}
        </>
      )
    }
    return (
      <>
        {sortedHist.slice(0, 10).map((h) => renderItemRow(h, true))}
        {suggestedItems.length > 0 && (
          <>
            <div className="sr-sec">
              <span>Suggested</span>
            </div>
            {suggestedItems.map((s) => renderItemRow(s.item, false))}
          </>
        )}
        {sortedHist.length === 0 && suggestedItems.length === 0 && (
          <div className="sr-empty">
            <b>Search MeBook</b>
            Find people, posts, captions and movies
          </div>
        )}
      </>
    )
  }

  const renderPostRow = (p: any) => {
    const u = userMap[p.authorId]
    const name = u?.name || p.authorName || "User"
    const photo = u ? avatarOf(u) : p.authorAvatar || avatarOf({ name })
    const snip = srSnippet(p.caption || "", tokens)
    return (
      <div
        className="sr-post"
        key={p.id}
        onClick={() => {
          rememberQuery()
          onOpenPost(p)
        }}
      >
        <img
          className="sr-av sm"
          src={photo}
          alt=""
          onClick={(e) => {
            e.stopPropagation()
            rememberQuery()
            if (p.authorId) onOpenUser(p.authorId)
          }}
        />
        <div className="sr-post-main">
          <div
            className="sr-post-head"
            onClick={(e) => {
              e.stopPropagation()
              rememberQuery()
              if (p.authorId) onOpenUser(p.authorId)
            }}
          >
            <span>{name}</span>
            {verified(p.authorId, p)}
            <small>· {timeAgo(p.createdAt)}</small>
          </div>
          {snip && <div className="sr-snip">{snip}</div>}
          {p.movie ? <span className="sr-movie">🎬 {p.movie}</span> : null}
        </div>
        {p.image ? <img className="sr-thumb" src={p.image} alt="" /> : null}
      </div>
    )
  }

  const renderResults = () => {
    const showPeople = tab !== "posts"
    const showPosts = tab !== "people"
    const people = results.people
    const plist = results.posts
    const nothing = (!showPeople || people.length === 0) && (!showPosts || plist.length === 0)
    const limit = tab === "posts" ? postLimit + 12 : postLimit

    return (
      <>
        <div
          className="sr-row"
          onClick={() => {
            rememberQuery()
            inputRef.current?.blur()
          }}
        >
          <div className="sr-av-ico">
            <SrIco d={SR_ICON.search} />
          </div>
          <div className="sr-info">
            <div className="sr-name">
              <span className="t">{q}</span>
            </div>
          </div>
        </div>

        {showPeople && people.length > 0 && (
          <>
            <div className="sr-sec">
              <span>People</span>
            </div>
            {(tab === "people" ? people : people.slice(0, 5)).map((u) => (
              <div
                className="sr-row"
                key={u.uid}
                onClick={() =>
                  openUserFromItem({
                    key: "u:" + u.uid,
                    type: "user",
                    uid: u.uid,
                    name: u.name || "User",
                    photo: avatarOf(u),
                    t: 0,
                  })
                }
              >
                <img className="sr-av" src={avatarOf(u)} alt="" />
                <div className="sr-info">
                  <div className="sr-name">
                    <span className="t">{u.name}</span>
                    {verified(u.uid, u)}
                  </div>
                  {latestPostOf(u.uid) && (
                    <div className="sr-sub">Last post · {timeAgo((latestPostOf(u.uid) as any).createdAt)}</div>
                  )}
                </div>
              </div>
            ))}
            {tab === "all" && people.length > 5 && (
              <button className="sr-seemore" onClick={() => setTab("people")}>
                See all people
              </button>
            )}
          </>
        )}

        {showPosts && plist.length > 0 && (
          <>
            <div className="sr-sec">
              <span>Posts</span>
            </div>
            {plist.slice(0, limit).map(renderPostRow)}
            {plist.length > limit && (
              <button
                className="sr-seemore"
                onClick={() => {
                  if (tab === "all") setTab("posts")
                  else setPostLimit((n) => n + 12)
                }}
              >
                See more posts
              </button>
            )}
          </>
        )}

        {nothing && (
          <div className="sr-empty">
            <b>No results for “{q}”</b>
            Check the spelling or try a different name, caption or movie
          </div>
        )}
      </>
    )
  }

  return (
    <div className="sr-page">
      <div className="sr-top">
        <button className="sr-ibtn" onClick={onBack} aria-label="Back">
          <SrIco d={SR_ICON.back} />
        </button>
        <div className="sr-box">
          <input
            ref={inputRef}
            type="text"
            value={query}
            placeholder="Search"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            onChange={(e) => {
              setQuery(e.target.value)
              setPostLimit(8)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                rememberQuery()
                inputRef.current?.blur()
              }
            }}
          />
          {query && (
            <button
              className="sr-clear"
              aria-label="Clear"
              onClick={() => {
                setQuery("")
                inputRef.current?.focus()
              }}
            >
              <SrIco d={SR_ICON.close} />
            </button>
          )}
        </div>
        {!query && (
          <button
            className="sr-ibtn"
            aria-label="Search history"
            onClick={() => setShowHistory((v) => !v)}
            style={showHistory ? { color: "var(--green)" } : undefined}
          >
            <SrIco d={SR_ICON.clock} />
          </button>
        )}
      </div>

      {q && (
        <div className="sr-chips">
          {(["all", "people", "posts"] as const).map((t) => (
            <button key={t} className={`sr-chip${tab === t ? " on" : ""}`} onClick={() => setTab(t)}>
              {t === "all" ? "All" : t === "people" ? "People" : "Posts"}
            </button>
          ))}
        </div>
      )}

      <div className="sr-body">{q ? renderResults() : renderIdle()}</div>

      {sheet && (
        <>
          <div className="sr-sheet-bd" onClick={() => setSheet(null)} />
          <div className="sr-sheet" role="dialog">
            <div className="sr-grab" />
            <div className="sr-sheet-head">
              {sheet.item.type === "user" ? (
                <img className="sr-av" src={sheet.item.photo || avatarOf({ name: sheet.item.name })} alt="" />
              ) : (
                <div className="sr-av-ico">
                  <SrIco d={SR_ICON.clock} />
                </div>
              )}
              <div className="sr-info">
                <div className="sr-name">
                  <span className="t">{sheet.item.name}</span>
                </div>
              </div>
            </div>
            <button className="sr-opt" onClick={() => removeItem(sheet.item, sheet.fromHistory)}>
              <span className="sr-opt-ico">
                <SrIco d={SR_ICON.trash} />
              </span>
              <span>
                <b>{sheet.fromHistory ? "Delete" : "Remove"}</b>
                <small>{sheet.fromHistory ? "Remove this from your search history." : "Hide this suggestion."}</small>
              </span>
            </button>
            {(() => {
              const cur = hist.find((h) => h.key === sheet.item.key)
              const isPinned = !!cur?.pinned
              const blocked = !isPinned && pinCount >= 3
              return (
                <button className="sr-opt" disabled={blocked} onClick={() => togglePin(sheet.item)}>
                  <span className="sr-opt-ico">
                    <SrIco d={SR_ICON.pin} />
                  </span>
                  <span>
                    <b>{isPinned ? "Unpin this search" : "Pin this search"}</b>
                    <small>You can only pin 3 searches at a time.</small>
                  </span>
                </button>
              )
            })()}
          </div>
        </>
      )}
    </div>
  )
}

export default function MeBookPage({ onExit }: MeBookPageProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [showSplash, setShowSplash] = useState(true)

  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin")
  const [authErr, setAuthErr] = useState<{ si: string; su: string }>({ si: "", su: "" })
  const [authBusy, setAuthBusy] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  const [pageStack, setPageStack] = useState<Array<{ view: string; params?: any }>>([
    { view: "home" },
  ])
  const currentPage = pageStack[pageStack.length - 1]
  const currentView = currentPage.view
  const currentParams = currentPage.params || {}

  const [drawerOpen, setDrawerOpen] = useState(false)
  const popupPointRef = useRef({ x: 0, y: 0 })
  const [themeRipple, setThemeRipple] = useState<{ x: number; y: number; color: string } | null>(null)

  const [menuOpen, setMenuOpen] = useState(false)
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false)
  const [srQuery, setSrQuery] = useState("")

  const [toasts, setToasts] = useState<ToastItem[]>([])
  const toastIdRef = useRef(0)
  const showToast = useCallback(
    (title: string, msg = "", type: "success" | "error" | "info" = "success") => {
      const id = ++toastIdRef.current
      setToasts((t) => [...t, { id, title, msg, type }])
    },
    []
  )
  const removeToast = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const [feed, setFeed] = useState<any[]>([])
const [myPosts, setMyPosts] = useState<any[]>([])
  const [extraPosts, setExtraPosts] = useState<any[]>([])
  const [notifMenu, setNotifMenu] = useState<any | null>(null)
  const [notifPrefs, setNotifPrefs] = useState<{ less: string[]; muted: string[] }>({ less: [], muted: [] })
  const notifPrefsLoaded = useRef(false)
// communityFeed line টা পুরো delete করে দিন
const [friends, setFriends] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [myFriends, setMyFriends] = useState<any[]>([])
  const [sentFriendRequests, setSentFriendRequests] = useState<any[]>([])
  const [chats, setChats] = useState<any[]>([])
  const [onlineList, setOnlineList] = useState<any[]>([])
  const [activeChat, setActiveChat] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [chatPartner, setChatPartner] = useState<any>(null)
  const [mobileChatWindow, setMobileChatWindow] = useState(false)
  const [chatView, setChatView] = useState<"list" | "window">("list")
  const [allUsers, setAllUsers] = useState<any[]>([])

  /* ===== MeChat list extras: state, prefs & actions ===== */
  const [chatPrefs, setChatPrefs] = useState(mcEmptyPrefs() as any)
  const chatPrefsRef = useRef(mcEmptyPrefs() as any)
  const [chatMenu, setChatMenu] = useState(null as any)
  const [chatConfirm, setChatConfirm] = useState(null as any)
  const [addMembersFor, setAddMembersFor] = useState(null as any)
  const [chatHeads, setChatHeads] = useState([] as any)
  const [chatListMode, setChatListMode] = useState("main")
  const lpTimerRef = useRef(null as any)
  const lpFiredRef = useRef(false)
  const lpStartRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (!user || !user.uid) return
    const p = mcLoadPrefs(user.uid)
    chatPrefsRef.current = p
    setChatPrefs(p)
  }, [user?.uid])

  const updateChatPrefs = (fn: any) => {
    const next = fn(JSON.parse(JSON.stringify(chatPrefsRef.current)))
    chatPrefsRef.current = next
    setChatPrefs(next)
    if (user && user.uid) mcSavePrefs(user.uid, next)
  }

  const chatAction = async (key: any, c: any) => {
    setChatMenu(null)
    const id = c.id
    const pr = chatPrefsRef.current
    const nm = c.other && c.other.name ? c.other.name : "Chat"
    if (key === "pin") {
      const was = !!pr.pinned[id]
      if (!was && Object.keys(pr.pinned).length >= 5) {
        showToast("Pin limit", "You can pin up to 5 chats", "info")
        return
      }
      updateChatPrefs((p: any) => { if (was) delete p.pinned[id]; else p.pinned[id] = Date.now(); return p })
      showToast(was ? "Unpinned" : "Pinned", nm, "success")
    } else if (key === "archive") {
      const was = !!pr.archived[id]
      updateChatPrefs((p: any) => { if (was) delete p.archived[id]; else { p.archived[id] = 1; delete p.pinned[id]; delete p.ignored[id] } return p })
      if (!was && activeChat === id) closeChat()
      showToast(was ? "Unarchived" : "Chat archived", nm, "success")
    } else if (key === "ignore") {
      const was = !!pr.ignored[id]
      updateChatPrefs((p: any) => { if (was) delete p.ignored[id]; else { p.ignored[id] = 1; delete p.pinned[id]; delete p.archived[id] } return p })
      if (!was && activeChat === id) closeChat()
      showToast(was ? "Chat un-ignored" : "Chat ignored", nm, "success")
    } else if (key === "mute") {
      const was = !!pr.muted[id]
      updateChatPrefs((p: any) => { if (was) delete p.muted[id]; else p.muted[id] = 1; return p })
      showToast(was ? "Unmuted" : "Muted", nm, "success")
    } else if (key === "unread") {
      const was = !!pr.unread[id]
      updateChatPrefs((p: any) => { if (was) delete p.unread[id]; else p.unread[id] = 1; return p })
      if (!was && activeChat === id) closeChat()
    } else if (key === "chatHead") {
      setChatHeads((hs: any) => (hs.some((h: any) => h.id === id) ? hs : hs.concat([c]).slice(-3)))
      showToast("Chat head added", "Tap the bubble to open " + nm, "success")
    } else if (key === "addMembers") {
      setAddMembersFor(c)
    } else if (key === "leave") {
      setChatConfirm({ kind: "leave", chat: c })
    } else if (key === "delete") {
      setChatConfirm({ kind: "delete", chat: c })
    }
  }

  const runChatConfirm = async () => {
    const cf = chatConfirm
    setChatConfirm(null)
    if (!cf) return
    const c = cf.chat
    if (cf.kind === "delete") {
      const sec = c.lastAt && c.lastAt.seconds ? c.lastAt.seconds : Math.floor(Date.now() / 1000)
      updateChatPrefs((p: any) => {
        p.deleted[c.id] = sec
        delete p.pinned[c.id]; delete p.archived[c.id]; delete p.ignored[c.id]; delete p.muted[c.id]; delete p.unread[c.id]
        return p
      })
      setChatHeads((hs: any) => hs.filter((h: any) => h.id !== c.id))
      if (activeChat === c.id) closeChat()
      showToast("Chat deleted", "", "success")
    } else if (cf.kind === "leave") {
      try {
        const fb = await getFirebase()
        await fb.updateDoc(fb.doc(fb.db, "chats", c.id), { members: fb.arrayRemove(user.uid) })
        setChatHeads((hs: any) => hs.filter((h: any) => h.id !== c.id))
        if (activeChat === c.id) closeChat()
        showToast("You left the group", c.other.name, "success")
      } catch (e: any) {
        showToast("Error", e.message, "error")
      }
    }
  }

  const confirmAddMembers = async (c: any, uids: any) => {
    setAddMembersFor(null)
    if (!uids || !uids.length) return
    try {
      const fb = await getFirebase()
      if (c.isGroup) {
        await fb.updateDoc(fb.doc(fb.db, "chats", c.id), { members: fb.arrayUnion(...uids) })
        showToast("Members added", uids.length + " added to " + c.other.name, "success")
      } else {
        const names = [c.other.name].concat(uids.map((u: any) => {
          const f = allUsers.find((x: any) => x.uid === u)
          return f && f.name ? f.name.split(" ")[0] : "User"
        }))
        const gname = names.join(", ").slice(0, 60)
        const members = [user.uid, c.otherId].concat(uids)
        const ref = await fb.addDoc(fb.collection(fb.db, "chats"), {
          members: members,
          isGroup: true,
          name: gname,
          createdBy: user.uid,
          createdAt: fb.serverTimestamp(),
          lastMessage: null,
          lastAt: fb.serverTimestamp(),
        })
        showToast("Group created", gname, "success")
        goTo("messages")
        setTimeout(() => {
          openChat(ref.id, ref.id, { uid: ref.id, name: gname, photoURL: "", isGroup: true })
        }, 120)
      }
    } catch (e: any) {
      showToast("Error", e.message, "error")
    }
  }

  const openPartnerOrGroup = () => {
    if (!chatPartner) return
    if (chatPartner.isGroup) {
      const gc = chats.find((x: any) => x.id === activeChat)
      if (gc) setAddMembersFor(gc)
      return
    }
    openUserProfile(chatPartner.uid)
  }

  const mcSenderAvatar = (m: any) => {
    if (chatPartner && chatPartner.isGroup) {
      const f = allUsers.find((u: any) => u.uid === m.from)
      return avatarUrl(f || { name: "User" })
    }
    return chatPartner ? avatarUrl(chatPartner) : ""
  }
  const mcSenderName = (m: any) => {
    const f = allUsers.find((u: any) => u.uid === m.from)
    return f && f.name ? f.name : "User"
  }

  const [sentRequests, setSentRequests] = useState<Record<string, "sending" | "sent">>({})

  const [viewingUser, setViewingUser] = useState<any>(null)
  const [viewingUserPosts, setViewingUserPosts] = useState<any[]>([])
  const [viewingUserFriends, setViewingUserFriends] = useState<any[]>([])
  const [viewingUserFriendsLoading, setViewingUserFriendsLoading] = useState(false)

  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadNotifCount, setUnreadNotifCount] = useState(0)

  /* push permission state */
  const [pushPerm, setPushPerm] = useState<string>("disabled")
  useEffect(() => {
    setPushPerm(getPushPermission())
  }, [user])
  const enablePush = async () => {
    const r = await requestPush()
    setPushPerm(r)
    if (r === "granted") showToast("Notifications ON 🔔", "এখন থেকে নতুন কিছু হলেই notification পাবেন", "success")
    else if (r === "denied") showToast("Blocked", "Browser settings থেকে notification Allow করুন", "error")
  }

  const [friendsTab, setFriendsTab] = useState<"requests" | "sent" | "all" | "mutual">("requests")
  const [profileTab, setProfileTab] = useState<"all" | "photos" | "reels" | "events">("all")

  const [postText, setPostText] = useState("")
  const [postMovie, setPostMovie] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState("")
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [postBusy, setPostBusy] = useState(false)
  const [postAudience, setPostAudience] = useState("public")
  const [postFeeling, setPostFeeling] = useState("")
  const [postLocation, setPostLocation] = useState("")
  const [postMusic, setPostMusic] = useState<any>(null)
  const [postTagged, setPostTagged] = useState<any[]>([])

  const [editName, setEditName] = useState("")
  const [editBio, setEditBio] = useState("")
  const [editLoc, setEditLoc] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [editBirthday, setEditBirthday] = useState("")
  const [editHandle, setEditHandle] = useState("")
  const [privacy, setPrivacy] = useState({ info: true, posts: true, requests: true })
  const [editBusy, setEditBusy] = useState(false)

  const [siEmail, setSiEmail] = useState("")
  const [siPass, setSiPass] = useState("")
  const [suName, setSuName] = useState("")
  const [suEmail, setSuEmail] = useState("")
  const [suPass, setSuPass] = useState("")

  const [friendSearch, setFriendSearch] = useState("")
  const [chatSearch, setChatSearch] = useState("")
  const [chatInput, setChatInput] = useState("")
  // ============================================================
// MECHAT — TYPING + SEEN STATE
// ============================================================
const [partnerTyping, setPartnerTyping] = useState(false)
const [partnerLastSeenMessageId, setPartnerLastSeenMessageId] = useState<string | null>(null)

const typingTimeoutRef = useRef<any>(null)
const lastMarkedSeenRef = useRef<string | null>(null)

  // Post reactions
  const [postReactionPicker, setPostReactionPicker] = useState<{
    open: boolean
    postId: string | null
    anchorRect: { x: number; y: number; width: number; height?: number } | null
  }>({ open: false, postId: null, anchorRect: null })
  const [postReactions, setPostReactions] = useState<Record<string, Record<string, string>>>({})
  const [fastLikeFlyers, setFastLikeFlyers] = useState<Array<{ id: number; x: number; y: number; emoji: string }>>([])
  const fastLikeIdRef = useRef(0)

  // Facebook-style reactions: jump animation, landing pop, reactors/comments sheet
  const [rxJumps, setRxJumps] = useState<
    Array<{ id: number; postId: string; k: string; fx: number; fy: number; tx: number; ty: number }>
  >([])
  const [rxLand, setRxLand] = useState<{ postId: string | null }>({ postId: null })
  const [engageSheet, setEngageSheet] = useState<{
    postId: string
    mode: "reactions" | "comments"
    tab: string
  } | null>(null)
  const jumpIdRef = useRef(0)
  const reactLockRef = useRef(0)
  const likePressRef = useRef<any>({ timer: null, fired: false, sx: 0, sy: 0, lastTouch: 0 })

  // Share sheet, post menu extras, manage posts, saved posts
  const [shareSheetPostId, setShareSheetPostId] = useState<string | null>(null)
  const [choiceFor, setChoiceFor] = useState<{ kind: "comment" | "privacy"; postId: string } | null>(null)
  const [linkDialogPostId, setLinkDialogPostId] = useState<string | null>(null)
  const [manageOpen, setManageOpen] = useState(false)
  const [savedIds, setSavedIds] = useState<string[]>([])

  useEffect(() => {
    setSavedIds(Array.isArray(profile?.savedPosts) ? profile.savedPosts : [])
  }, [profile])

  // Bin items are deleted after 30 days
  useEffect(() => {
    if (!user) return
    const old = myPosts.filter((p: any) => p.binnedAt && Date.now() - p.binnedAt > 30 * 86400000)
    if (!old.length) return
    ;(async () => {
      try {
        const fb = await getFirebase()
        for (const p of old) {
          try { await fb.deleteDoc(fb.doc(fb.db, "posts", p.id)) } catch {}
        }
      } catch {}
    })()
  }, [myPosts, user])

  // Comment reactions
  const [commentText, setCommentText] = useState("")
  const [commentBusy, setCommentBusy] = useState(false)
  const [replyTo, setReplyTo] = useState<any>(null)
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())

  // Edit / delete (posts, comments, chat messages) + photo viewer
  const [actionMenu, setActionMenu] = useState<{
    kind: "post" | "comment" | "msg"
    id: string
    postId?: string
  } | null>(null)
  const [photoViewer, setPhotoViewer] = useState<{
    src: string
    caption?: string
    name?: string
    avatar?: string
    time?: string
    postId?: string
    stats?: PhotoStats
  } | null>(null)
  const [editPostId, setEditPostId] = useState<string | null>(null)
  const [editPostText, setEditPostText] = useState("")
  const [editPostImage, setEditPostImage] = useState("")
  const [editPostFile, setEditPostFile] = useState<File | null>(null)
  const [editPostPreview, setEditPostPreview] = useState("")
  const [editPostBusy, setEditPostBusy] = useState(false)
  const editPostFileRef = useRef<HTMLInputElement>(null)
  const [editCommentId, setEditCommentId] = useState<string | null>(null)
  const [editCommentText, setEditCommentText] = useState("")
  const [editCommentBusy, setEditCommentBusy] = useState(false)
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null)
  const commentListRef = useRef<HTMLDivElement>(null)
  const commentInputRef = useRef<HTMLTextAreaElement>(null)
  const commentImgInputRef = useRef<HTMLInputElement>(null)
  const [commentImageFile, setCommentImageFile] = useState<File | null>(null)
  const [commentImagePreview, setCommentImagePreview] = useState("")
  const [commentUploading, setCommentUploading] = useState(false)

  const [reactionPicker, setReactionPicker] = useState<{
    open: boolean
    commentKey: string | null
    anchorRect: { x: number; y: number; width: number } | null
  }>({ open: false, commentKey: null, anchorRect: null })

  // Chat reactions & reply
  const [chatReactionPicker, setChatReactionPicker] = useState<{
    open: boolean
    msgId: string | null
    anchorRect: { x: number; y: number; width: number } | null
  }>({ open: false, msgId: null, anchorRect: null })
  const [chatReplyTo, setChatReplyTo] = useState<any>(null)
  const [chatLikeActive, setChatLikeActive] = useState(false)
  const [flyingReactions, setFlyingReactions] = useState<
    Array<{ id: number; x: number; y: number; emoji: string }>
  >([])
  const flyingIdRef = useRef(0)
  const chatBodyRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLTextAreaElement>(null)
  // ============================================================
// MECHAT — TYPING STATE
// ============================================================

const updateTypingState = async (
  chatId: string | null,
  isTyping: boolean
) => {
  if (!chatId || !user?.uid) return

  try {
    const fb = await getFirebase()

    await fb.setDoc(
      fb.doc(fb.db, "chats", chatId, "typing", user.uid),
      {
        typing: isTyping,
        updatedAt: fb.serverTimestamp(),
      },
      { merge: true }
    )
  } catch {
    // Typing indicator fail করলে chat বন্ধ হবে না
  }
}

const handleChatTyping = (value: string) => {
  setChatInput(value)

  if (!activeChat) return

  // Empty input হলে typing বন্ধ
  if (!value.trim()) {
    void updateTypingState(activeChat, false)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }

    return
  }

  // Typing শুরু
  void updateTypingState(activeChat, true)

  // আগের timeout cancel
  if (typingTimeoutRef.current) {
    clearTimeout(typingTimeoutRef.current)
  }

  // 1.5 sec কিছু না লিখলে typing বন্ধ
  typingTimeoutRef.current = setTimeout(() => {
    void updateTypingState(activeChat, false)
    typingTimeoutRef.current = null
  }, 1500)
}

  // Image upload for chat
  const chatFileInputRef = useRef<HTMLInputElement>(null)
  const chatCameraInputRef = useRef<HTMLInputElement>(null)

  // Voice recording
  const [recording, setRecording] = useState(false)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordChunksRef = useRef<Blob[]>([])
  const recordTimerRef = useRef<any>(null)
  const recordStartRef = useRef(0)

  // Keyboard handling for mobile
  const [kbUp, setKbUp] = useState(false)
  const [vvh, setVvh] = useState(0)
  const [showScrollDown, setShowScrollDown] = useState(false)
  useEffect(() => {
    if (typeof window === "undefined") return
    const vv = (window as any).visualViewport
    if (!vv) return
    const handleResize = () => {
      const isKbOpen = window.innerHeight - vv.height > 120
      setKbUp(isKbOpen)
      setVvh(vv.height)
      setTimeout(() => {
        if (chatBodyRef.current) {
          chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight
        }
      }, 50)
    }
    vv.addEventListener("resize", handleResize)
    vv.addEventListener("scroll", handleResize)
    return () => {
      vv.removeEventListener("resize", handleResize)
      vv.removeEventListener("scroll", handleResize)
    }
  }, [])

  // ============================================================
  // MECHAT — LISTEN TO PARTNER TYPING
  // Only the other user's typing document is listened to, so the
  // person who is typing never sees their own typing indicator.
  // ============================================================
  useEffect(() => {
    if (!activeChat || !chatPartner?.uid) {
      setPartnerTyping(false)
      return
    }

    let unsub: (() => void) | null = null
    let cancelled = false

    ;(async () => {
      try {
        const fb = await getFirebase()
        if (cancelled) return

        const typingRef = fb.doc(
          fb.db,
          "chats",
          activeChat,
          "typing",
          chatPartner.uid
        )

        unsub = fb.onSnapshot(typingRef, (snap: any) => {
          const data = snap.exists() ? snap.data() : null
          setPartnerTyping(data?.typing === true)
        })
      } catch {
        setPartnerTyping(false)
      }
    })()

    return () => {
      cancelled = true
      if (unsub) {
        try { unsub() } catch {}
      }
      setPartnerTyping(false)
    }
  }, [activeChat, chatPartner?.uid])

  // ============================================================
  // MECHAT — LISTEN TO PARTNER SEEN STATE
  // ============================================================
  useEffect(() => {
    if (!activeChat || !chatPartner?.uid) {
      setPartnerLastSeenMessageId(null)
      return
    }

    let unsub: (() => void) | null = null
    let cancelled = false

    ;(async () => {
      try {
        const fb = await getFirebase()
        if (cancelled) return

        const readRef = fb.doc(
          fb.db,
          "chats",
          activeChat,
          "readState",
          chatPartner.uid
        )

        unsub = fb.onSnapshot(readRef, (snap: any) => {
          const data = snap.exists() ? snap.data() : null
          setPartnerLastSeenMessageId(data?.lastSeenMessageId || null)
        })
      } catch {
        setPartnerLastSeenMessageId(null)
      }
    })()

    return () => {
      cancelled = true
      if (unsub) {
        try { unsub() } catch {}
      }
      setPartnerLastSeenMessageId(null)
    }
  }, [activeChat, chatPartner?.uid])

  // ============================================================
  // MECHAT — MARK PARTNER MESSAGES AS SEEN
  // The latest visible message from the other person is written
  // to this user's own readState document.
  // ============================================================
  useEffect(() => {
    const root = chatBodyRef.current

    if (
      !root ||
      !activeChat ||
      !user?.uid ||
      chatMessages.length === 0
    ) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleIds = new Set<string>()

        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const id = entry.target.getAttribute("data-message-id")
            if (id) visibleIds.add(id)
          }
        })

        if (visibleIds.size === 0) return

        const latestVisiblePartnerMessage = [...chatMessages]
          .reverse()
          .find((m) => m.id && visibleIds.has(String(m.id)) && m.from !== user.uid)

        if (!latestVisiblePartnerMessage?.id) return

        const messageId = String(latestVisiblePartnerMessage.id)

        if (lastMarkedSeenRef.current === messageId) return
        lastMarkedSeenRef.current = messageId

        void (async () => {
          try {
            const fb = await getFirebase()
            await fb.setDoc(
              fb.doc(
                fb.db,
                "chats",
                activeChat,
                "readState",
                user.uid
              ),
              {
                lastSeenMessageId: messageId,
                updatedAt: fb.serverTimestamp(),
              },
              { merge: true }
            )
          } catch {
            // Seen update fail হলেও chat চলবে
          }
        })()
      },
      { root, threshold: [0.5] }
    )

    const messageElements = root.querySelectorAll(
      "[data-mechat-message='true']"
    )

    messageElements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [chatMessages, activeChat, user?.uid])

  // Turn my own typing state off when switching chats or leaving MeBook.
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }

      if (activeChat && user?.uid) {
        void updateTypingState(activeChat, false)
      }
    }
  }, [activeChat, user?.uid])

  const [shareCaption, setShareCaption] = useState("")
  const [shareBusy, setShareBusy] = useState(false)

  const [actionSheetFriend, setActionSheetFriend] = useState<any>(null)
  const [unfollowedSet, setUnfollowedSet] = useState<Set<string>>(new Set())
  const [fbSheetUser, setFbSheetUser] = useState<any>(null)
  const [fbInfo, setFbInfo] = useState<FbInfo | null>(null)
  const [fbHlOpen, setFbHlOpen] = useState(false)
  const [photoSheet, setPhotoSheet] = useState<"" | "cover" | "profile">("")
  const [photoBusy, setPhotoBusy] = useState(false)
  const [fbpScrolled, setFbpScrolled] = useState(false)

  // profile page: scroll করলে top bar solid হবে (cover জায়গায় থাকে, content উপরে উঠে)
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop || 0
      setFbpScrolled((p) => {
        const n = y > 150
        return p === n ? p : n
      })
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])
  const [fbPhotoSub, setFbPhotoSub] = useState<"" | "profile" | "cover" | "albums">("")
  const pendingProfileRef = useRef<string | null>(null)

  // unfollow list Firestore (own user doc) থেকে sync
  useEffect(() => {
    setUnfollowedSet(new Set<string>(Array.isArray(profile?.unfollowed) ? profile.unfollowed : []))
  }, [profile?.unfollowed])

  const unsubscribersRef = useRef<Array<() => void>>([])
  const chatUnsubRef = useRef<(() => void) | null>(null)
  const viewingUserUnsubRef = useRef<(() => void) | null>(null)
  const viewingUserFriendsUnsubRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const styleId = "mebook-styles"
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement("style")
      styleEl.id = styleId
      styleEl.innerHTML = MEBOOK_CSS
      document.head.appendChild(styleEl)
    }
    setReady(true)
  }, [])

  /* ============================================================
     SPLASH SCREEN — show for 2 seconds
     ============================================================ */
  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => setShowSplash(false), 2000)
    return () => clearTimeout(t)
  }, [ready])

  useEffect(() => {
    const saved = localStorage.getItem("mebook-theme")
    const isDark = saved ? saved === "dark" : false
    setTheme(isDark ? "dark" : "light")
  }, [])

  const toggleTheme = (isDark: boolean) => {
    const pos = popupPointRef.current
    setThemeRipple({
      x: pos.x || window.innerWidth / 2,
      y: pos.y || window.innerHeight / 2,
      color: isDark ? "#000000" : "#f0f2f5",
    })
    setTheme(isDark ? "dark" : "light")
    localStorage.setItem("mebook-theme", isDark ? "dark" : "light")
    setTimeout(() => setThemeRipple(null), 680)
  }

  const cleanupListeners = useCallback(() => {
    unsubscribersRef.current.forEach((u) => {
      try { u() } catch {}
    })
    unsubscribersRef.current = []
    if (chatUnsubRef.current) {
      try { chatUnsubRef.current() } catch {}
      chatUnsubRef.current = null
    }
    if (viewingUserUnsubRef.current) {
      try { viewingUserUnsubRef.current() } catch {}
      viewingUserUnsubRef.current = null
    }
    if (viewingUserFriendsUnsubRef.current) {
      try { viewingUserFriendsUnsubRef.current() } catch {}
      viewingUserFriendsUnsubRef.current = null
    }
  }, [])

  const startAppListeners = useCallback(
    async (uid: string) => {
      cleanupListeners()
      const fb = await getFirebase()

      const feedQ = fb.query(fb.collection(fb.db, "posts"), fb.orderBy("createdAt", "desc"))
      unsubscribersRef.current.push(
        fb.onSnapshot(feedQ, (snap: any) => {
          const arr: any[] = []
          snap.forEach((d: any) => arr.push({ id: d.id, ...d.data() }))
          arr.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
          setFeed(arr)
        })
      )

      const myQ = fb.query(fb.collection(fb.db, "posts"), fb.where("authorId", "==", uid))
      unsubscribersRef.current.push(
        fb.onSnapshot(myQ, (snap: any) => {
          const arr: any[] = []
          snap.forEach((d: any) => arr.push({ id: d.id, ...d.data() }))
          arr.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
          setMyPosts(arr)
        })
      )

    
      const usersQ = fb.query(fb.collection(fb.db, "users"))
      unsubscribersRef.current.push(
        fb.onSnapshot(usersQ, (snap: any) => {
          const arr: any[] = []
          snap.forEach((d: any) => {
            if (d.id !== uid) arr.push({ uid: d.id, ...normalizeUserData(d.data()) })
          })
          setFriends(arr)
          setAllUsers(arr)
          setOnlineList(arr.slice(0, 12))
        })
      )

      const reqQ = fb.query(
        fb.collection(fb.db, "friendRequests"),
        fb.where("to", "==", uid),
        fb.where("status", "==", "pending")
      )
      unsubscribersRef.current.push(
        fb.onSnapshot(reqQ, async (snap: any) => {
          const arr: any[] = []
          for (const d of snap.docs) {
            const data = d.data()
            const fromSnap = await fb.getDoc(fb.doc(fb.db, "users", data.from))
            arr.push({
              id: d.id,
              from: data.from,
              fromUser: fromSnap.exists() ? fromSnap.data() : { name: "User", photoURL: "" },
            })
          }
          setRequests(arr)
        })
      )

      const sentQ = fb.query(
        fb.collection(fb.db, "friendRequests"),
        fb.where("from", "==", uid)
      )
      unsubscribersRef.current.push(
        fb.onSnapshot(sentQ, async (snap: any) => {
          const arr: any[] = []
          for (const d of snap.docs) {
            const data = d.data()
            const toSnap = await fb.getDoc(fb.doc(fb.db, "users", data.to))
            arr.push({
              id: d.id,
              to: data.to,
              status: data.status,
              toUser: toSnap.exists() ? toSnap.data() : { name: "User", photoURL: "" },
            })
          }
          setSentFriendRequests(arr)
        })
      )

      const myFriendsQ = fb.query(
        fb.collection(fb.db, "friends"),
        fb.where("members", "array-contains", uid)
      )

      unsubscribersRef.current.push(
        fb.onSnapshot(myFriendsQ, async (snap: any) => {
          const arr: any[] = []
          const seen = new Set<string>()
          for (const d of snap.docs) {
            const data = d.data()
            const otherId = (data.members || []).find((m: string) => m !== uid)
            if (!otherId || seen.has(otherId)) continue
            seen.add(otherId)
            try {
              const s = await fb.getDoc(fb.doc(fb.db, "users", otherId))
              if (s.exists()) {
                arr.push({
                  uid: s.id,
                  ...s.data(),
                  friendsSince: data.createdAt || null,
                })
              }
            } catch {}
          }
          setMyFriends(arr)
        })
      )

      const chatsQ = fb.query(fb.collection(fb.db, "chats"), fb.where("members", "array-contains", uid))
      unsubscribersRef.current.push(
        fb.onSnapshot(chatsQ, async (snap: any) => {
          const results = await Promise.all(
            snap.docs.map(async (d: any) => {
              try {
                const data = d.data()
                if (data.isGroup || (data.members && data.members.length > 2)) {
                  return {
                    id: d.id,
                    otherId: d.id,
                    other: { uid: d.id, name: data.name || "Group chat", photoURL: data.photoURL || "", isGroup: true },
                    last: data.lastMessage || "",
                    lastAt: data.lastAt,
                    isGroup: true,
                    members: data.members,
                  }
                }
                const otherId = data.members.find((m: any) => m !== uid)
                if (!otherId) return null
                const s = await fb.getDoc(fb.doc(fb.db, "users", otherId))
                if (!s.exists()) return null
                return {
                  id: d.id,
                  otherId,
                  other: s.data(),
                  last: data.lastMessage || "",
                  lastAt: data.lastAt,
                  members: data.members,
                }
              } catch (e) {
                return null
              }
            })
          )
          const arr: any[] = results.filter(Boolean)
          arr.sort((a, b) => (b.lastAt?.seconds || 0) - (a.lastAt?.seconds || 0))
          setChats(arr)
        })
      )

      const notifQ = fb.query(
        fb.collection(fb.db, "notifications"),
        fb.where("uid", "==", uid)
      )
      let firstNotifSnap = true
      unsubscribersRef.current.push(
        fb.onSnapshot(notifQ, (snap: any) => {
          // সাইট খোলা অবস্থায় নতুন notification এলে in-app toast
          if (!firstNotifSnap) {
            snap.docChanges().forEach((c: any) => {
              if (c.type === "added" && !c.doc.metadata.hasPendingWrites) {
                const d = c.doc.data()
                if (d && !d.read) showToast(d.title || "New notification", d.message || "", "info")
              }
            })
          }
          firstNotifSnap = false
          const arr: any[] = []
          snap.forEach((d: any) => arr.push({ id: d.id, ...d.data() }))
          arr.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
          setNotifications(arr)
          setUnreadNotifCount(arr.filter((n) => !n.read).length)
        })
      )
    },
    [cleanupListeners, showToast]
  )

  useEffect(() => {
    if (!ready) return
    let cancelled = false
    let unsubAuth: (() => void) | null = null

    ;(async () => {
      try {
        const fb = await getFirebase()
        if (cancelled) return

        unsubAuth = fb.onAuthStateChanged(fb.auth, async (u: any) => {
          if (cancelled) return
          if (u) {
            const userRef = fb.doc(fb.db, "users", u.uid)
            let snap = await fb.getDoc(userRef)
            if (!snap.exists()) {
              await fb.setDoc(userRef, {
                uid: u.uid,
                name: u.displayName || "User",
                email: u.email,
                photoURL: u.photoURL || "",
                coverURL: "",
                bio: "Movie lover 🎬",
                location: "",
                phone: "",
                birthday: "",
                handle: "",
                verified: false,
                createdAt: fb.serverTimestamp(),
                privacy: { info: true, posts: true, requests: true },
              })
              snap = await fb.getDoc(userRef)
            }
            // Mvbd mini app signup এর full name খালি থাকলে এখানে ঠিক করে Firestore এ save করা হবে
            try {
              const rawD = typeof snap.raw === "function" ? snap.raw() : snap.data()
              const rawName = String(rawD?.name || "").trim()
              if (!rawName || (rawName === "User" && u.displayName)) {
                const fixed = pickUserName(
                  { ...rawD, name: "", displayName: rawD?.displayName || u.displayName },
                  u.email
                )
                if (fixed) {
                  await fb.updateDoc(userRef, { name: fixed })
                  snap = await fb.getDoc(userRef)
                }
              }
            } catch (e) {
              console.warn("name sync failed", e)
            }
            setUser(u)
            const p = snap.data()
            setProfile(p)
            setPrivacy(p.privacy || { info: true, posts: true, requests: true })
            setAuthBusy(false)

            setPushSenderName(p.name || u.displayName || "Someone")
            const profileUnsub = fb.onSnapshot(userRef, (s: any) => {
              if (s.exists()) {
                const nd = normalizeUserData(s.data(), u.email)
                setProfile(nd)
                setPushSenderName(nd.name)
              }
            })
            unsubscribersRef.current.push(profileUnsub)

            startAppListeners(u.uid)

            // push: এই user কে OneSignal এ তার uid দিয়ে connect করা
            void oneSignalLogin(u.uid)

            // notification এ click করে এলে সঠিক page খোলা (?mb=notifications ইত্যাদি)
            try {
              const sp = new URLSearchParams(window.location.search)
              const pu = sp.get("u")
              if (sp.get("mb") === "profile" && pu) {
                pendingProfileRef.current = pu
                window.history.replaceState({}, "", window.location.pathname)
              }
              const target = sp.get("mb")
              const allowed = ["home", "shorts", "notifications", "messages", "friends", "profile"]
              if (target && allowed.includes(target) && !pendingProfileRef.current) {
                setPageStack([{ view: target }])
                window.history.replaceState({}, "", window.location.pathname)
              }
            } catch {}
          } else {
            void oneSignalLogout()
            setUser(null)
            setProfile(null)
            cleanupListeners()
            setAuthBusy(false)
            setPageStack([{ view: "home" }])
          }
        })
      } catch (e) {
        console.error("Firebase init failed:", e)
        showToast("Firebase error", "Init failed", "error")
        setAuthBusy(false)
      }
    })()

    return () => {
      cancelled = true
      if (unsubAuth) unsubAuth()
      cleanupListeners()
    }
  }, [ready, startAppListeners, cleanupListeners, showToast])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false)
        setActionSheetFriend(null)
        setReactionPicker({ open: false, commentKey: null, anchorRect: null })
        setPostReactionPicker({ open: false, postId: null, anchorRect: null })
        setChatReactionPicker({ open: false, msgId: null, anchorRect: null })
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  /* ============================================================
     MECHAT FULL-SCREEN: lock page scroll + Esc handling
     ============================================================ */
  const mcOpen = currentView === "messages" && !!activeChat
  const mcPage = currentView === "messages"

  useEffect(() => {
    if (!mcPage) return
    const prevBody = document.body.style.overflow
    const prevHtml = document.documentElement.style.overflow
    document.body.style.overflow = "hidden"
    document.documentElement.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prevBody
      document.documentElement.style.overflow = prevHtml
    }
  }, [mcPage])

  /* ============================================================
     HEADER AUTO-HIDE ON SCROLL (down = hide, up = show)
     ============================================================ */
  const lastScrollYRef = useRef(0)
  const menuOpenRef = useRef(false)
  menuOpenRef.current = menuOpen

  useEffect(() => {
    const onScroll = () => {
      const hd = document.querySelector(".mebook-root .mb-header") as HTMLElement | null
      const nb = document.querySelector(".mebook-root .mb-navbar") as HTMLElement | null
      if (!hd) return
      const y = window.scrollY
      const ly = lastScrollYRef.current
      const setHide = (hide: boolean) => {
        hd.classList.toggle("hide", hide)
        if (nb) nb.classList.toggle("hide", hide)
      }
      if (window.innerWidth <= 860 && !menuOpenRef.current) {
        if (y > ly + 8 && y > 120) setHide(true)
        else if (y < ly - 8 || y < 60) setHide(false)
      } else {
        setHide(false)
      }
      lastScrollYRef.current = y
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Show header again when page/view changes or menu opens
  useEffect(() => {
    const hd = document.querySelector(".mebook-root .mb-header")
    if (hd) hd.classList.remove("hide")
    const nb = document.querySelector(".mebook-root .mb-navbar")
    if (nb) nb.classList.remove("hide")
    lastScrollYRef.current = window.scrollY
  }, [currentView, menuOpen, user])

  useEffect(() => {
    if (!reactionPicker.open && !postReactionPicker.open && !chatReactionPicker.open) return
    const handler = () => {
      setReactionPicker({ open: false, commentKey: null, anchorRect: null })
      setPostReactionPicker({ open: false, postId: null, anchorRect: null })
      setChatReactionPicker({ open: false, msgId: null, anchorRect: null })
    }
    setTimeout(() => {
      document.addEventListener("click", handler)
    }, 10)
    return () => document.removeEventListener("click", handler)
  }, [reactionPicker.open, postReactionPicker.open, chatReactionPicker.open])

  /* ============================================================
     POST REACTIONS
     ============================================================ */

  const handlePostReact = async (
    postId: string,
    reactionKey: string,
    emoji: string,
    evt?: { clientX: number; clientY: number }
  ) => {
    try {
      const fb = await getFirebase()
      const ref = fb.doc(fb.db, "posts", postId)
      const snap = await fb.getDoc(ref)
      if (!snap.exists()) return
      const post = snap.data()
      const likes: string[] = post.likes || []
      const reactions: Record<string, string> = post.reactions || {}

      const myCurrent = reactions[user.uid]
      const has = likes.includes(user.uid)

      let newReactions = { ...reactions }
      let newLikes = [...likes]

      if (myCurrent === reactionKey) {
        delete newReactions[user.uid]
        newLikes = newLikes.filter((id) => id !== user.uid)
      } else {
        newReactions[user.uid] = reactionKey
        if (!has) newLikes.push(user.uid)
      }

      await fb.updateDoc(ref, {
        reactions: newReactions,
        likes: newLikes,
      })

      setPostReactions((prev) => ({
        ...prev,
        [postId]: newReactions,
      }))

      if (evt) {
        const id = ++flyingIdRef.current
        setFlyingReactions((prev) => [
          ...prev,
          { id, x: evt.clientX, y: evt.clientY, emoji },
        ])
        setTimeout(() => {
          setFlyingReactions((prev) => prev.filter((r) => r.id !== id))
        }, 750)
      }

      if (!myCurrent && post.authorId && post.authorId !== user.uid && post.authorId !== "admin" && !post.muteNotifs) {
        await fb.addDoc(fb.collection(fb.db, "notifications"), {
          postId,
          fromUid: user.uid,
          fromName: profile?.name || "",
          fromAvatar: profile?.photoURL || "",
          uid: post.authorId,
          title: "New Reaction",
          message: `${profile.name} reacted ${emoji} to your post.`,
          type: "like",
          read: false,
          createdAt: fb.serverTimestamp(),
        })
      }
    } catch (e: any) {
      showToast("Error", e.message, "error")
    } finally {
      setPostReactionPicker({ open: false, postId: null, anchorRect: null })
    }
  }

  const openPostReactionPicker = (
    evt: React.MouseEvent | React.TouchEvent,
    postId: string
  ) => {
    const target = evt.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    setPostReactionPicker({
      open: true,
      postId,
      anchorRect: { x: rect.left, y: rect.top, width: rect.width },
    })
  }

  const openPostReactionPickerAt = (el: HTMLElement, postId: string) => {
    const rect = el.getBoundingClientRect()
    setPostReactionPicker({
      open: true,
      postId,
      anchorRect: { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
    })
  }

  // Tap = like, long press = Facebook-style reaction picker (slide finger + release to pick)
  const likeBtnProps = (postId: string) => {
    const st = likePressRef.current
    const cancelTimer = () => {
      if (st.timer) {
        clearTimeout(st.timer)
        st.timer = null
      }
    }
    const startPress = (el: HTMLElement, x: number, y: number) => {
      st.fired = false
      st.sx = x
      st.sy = y
      cancelTimer()
      st.timer = setTimeout(() => {
        st.timer = null
        st.fired = true
        try { if (navigator.vibrate) navigator.vibrate(15) } catch {}
        openPostReactionPickerAt(el, postId)
      }, 380)
    }
    const finish = (x: number, y: number) => {
      const wasFired = st.fired
      const hadTimer = !!st.timer
      cancelTimer()
      if (wasFired) {
        setTimeout(() => { st.fired = false }, 60)
        return
      }
      if (!hadTimer) return
      handleFastLike(postId, { clientX: x, clientY: y })
    }
    return {
      onTouchStart: (e: any) => {
        st.lastTouch = Date.now()
        const t = e.touches[0]
        startPress(e.currentTarget, t.clientX, t.clientY)
      },
      onTouchMove: (e: any) => {
        if (st.fired) return
        const t = e.touches[0]
        if (Math.abs(t.clientX - st.sx) > 10 || Math.abs(t.clientY - st.sy) > 10) cancelTimer()
      },
      onTouchEnd: (e: any) => {
        st.lastTouch = Date.now()
        const t = e.changedTouches[0]
        if (e.cancelable) e.preventDefault()
        finish(t.clientX, t.clientY)
      },
      onTouchCancel: () => cancelTimer(),
      onMouseDown: (e: any) => {
        if (Date.now() - st.lastTouch < 800 || e.button !== 0) return
        startPress(e.currentTarget, e.clientX, e.clientY)
      },
      onMouseUp: (e: any) => {
        if (Date.now() - st.lastTouch < 800) return
        finish(e.clientX, e.clientY)
      },
      onMouseLeave: () => {
        if (!st.fired) cancelTimer()
      },
      onContextMenu: (e: any) => {
        e.preventDefault()
        if (!st.fired) {
          cancelTimer()
          st.fired = true
          openPostReactionPickerAt(e.currentTarget, postId)
        }
      },
    }
  }

  /* ============================================================
     FAST LIKE (single tap)
     ============================================================ */

  const handleFastLike = async (
    postId: string,
    evt?: { clientX: number; clientY: number }
  ) => {
    try {
      const fb = await getFirebase()
      const ref = fb.doc(fb.db, "posts", postId)
      const snap = await fb.getDoc(ref)
      if (!snap.exists()) return
      const post = snap.data()
      const likes: string[] = post.likes || []
      const reactions: Record<string, string> = post.reactions || {}
      const has = likes.includes(user.uid)

      if (has && reactions[user.uid] === "like") {
        delete reactions[user.uid]
        await fb.updateDoc(ref, {
          likes: fb.arrayRemove(user.uid),
          reactions,
        })
      } else {
        reactions[user.uid] = "like"
        await fb.updateDoc(ref, {
          likes: fb.arrayUnion(user.uid),
          reactions,
        })

        if (evt) {
          const id = ++fastLikeIdRef.current
          setFastLikeFlyers((prev) => [
            ...prev,
            { id, x: evt.clientX - 14, y: evt.clientY - 14, emoji: "👍" },
          ])
          setTimeout(() => {
            setFastLikeFlyers((prev) => prev.filter((r) => r.id !== id))
          }, 650)
        }

        if (post.authorId && post.authorId !== user.uid && post.authorId !== "admin" && !post.muteNotifs) {
          await fb.addDoc(fb.collection(fb.db, "notifications"), {
            postId,
            fromUid: user.uid,
            fromName: profile?.name || "",
            fromAvatar: profile?.photoURL || "",
            uid: post.authorId,
            title: "New Like",
            message: `${profile.name} liked your post.`,
            type: "like",
            read: false,
            createdAt: fb.serverTimestamp(),
          })
        }
      }
    } catch (e: any) {
      showToast("Error", e.message, "error")
    }
  }

  /* ============================================================
     COMMENT / REACTION HELPERS
     ============================================================ */

  const buildCommentId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  const handleCommentImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setCommentImageFile(f)
    setCommentImagePreview(URL.createObjectURL(f))
    e.target.value = ""
  }

  const removeCommentImage = () => {
    setCommentImageFile(null)
    setCommentImagePreview("")
  }

  const handleAddComment = async (postId: string) => {
    const text = commentText.trim()
    if ((!text && !commentImageFile) || commentBusy) return
    setCommentBusy(true)
    setCommentUploading(!!commentImageFile)
    try {
      const fb = await getFirebase()
      const ref = fb.doc(fb.db, "posts", postId)
      const snap = await fb.getDoc(ref)
      if (!snap.exists()) {
        showToast("Error", "Post not found", "error")
        return
      }
      const existing = snap.data().comments || []

      let imageUrl = ""
      if (commentImageFile) {
        imageUrl = await cloudinaryUpload(commentImageFile)
      }

      const newComment: any = {
        id: buildCommentId(),
        uid: user.uid,
        name: profile.name,
        avatar: profile.photoURL || "",
        text,
        image: imageUrl,
        at: Date.now(),
        reactions: {},
      }
      if (replyTo && replyTo.id) {
        newComment.parentId = replyTo.id
      }
      const updated = [...existing, newComment]
      await fb.updateDoc(ref, { comments: updated })

      const post = snap.data()
      if (post.authorId && post.authorId !== user.uid && post.authorId !== "admin" && !post.muteNotifs) {
        await fb.addDoc(fb.collection(fb.db, "notifications"), {
          postId,
          fromUid: user.uid,
          fromName: profile?.name || "",
          fromAvatar: profile?.photoURL || "",
          uid: post.authorId,
          title: replyTo ? "New Reply" : "New Comment",
          message: `${profile.name} ${replyTo ? "replied to a comment" : "commented"} on your post.`,
          type: "comment",
          read: false,
          createdAt: fb.serverTimestamp(),
        })
      }

      if (replyTo && replyTo.uid && replyTo.uid !== user.uid && replyTo.uid !== post.authorId) {
        await fb.addDoc(fb.collection(fb.db, "notifications"), {
          postId,
          fromUid: user.uid,
          fromName: profile?.name || "",
          fromAvatar: profile?.photoURL || "",
          uid: replyTo.uid,
          title: "New Reply",
          message: `${profile.name} replied to your comment.`,
          type: "comment",
          read: false,
          createdAt: fb.serverTimestamp(),
        })
      }

      setCommentText("")
      setCommentImageFile(null)
      setCommentImagePreview("")
      setReplyTo(null)
      showToast(replyTo ? "Reply added!" : "Comment added!", "", "success")

      if (replyTo && replyTo.id) {
        setExpandedReplies((s) => {
          const c = new Set(s)
          c.add(replyTo.id)
          return c
        })
      }
    } catch (e: any) {
      showToast("Error", e.message, "error")
    } finally {
      setCommentBusy(false)
      setCommentUploading(false)
    }
  }

  const handleQuickComment = async (postId: string, text: string, sticker = "") => {
    if (commentBusy || (!text && !sticker)) return
    setCommentBusy(true)
    try {
      const fb = await getFirebase()
      const ref = fb.doc(fb.db, "posts", postId)
      const snap = await fb.getDoc(ref)
      if (!snap.exists()) return
      const post = snap.data()
      const newComment: any = {
        id: buildCommentId(),
        uid: user.uid,
        name: profile.name,
        avatar: profile.photoURL || "",
        text,
        sticker,
        image: "",
        at: Date.now(),
        reactions: {},
      }
      if (replyTo && replyTo.id) newComment.parentId = replyTo.id
      await fb.updateDoc(ref, { comments: [...(post.comments || []), newComment] })
      if (post.authorId && post.authorId !== user.uid && post.authorId !== "admin" && !post.muteNotifs) {
        await fb.addDoc(fb.collection(fb.db, "notifications"), {
          postId,
          fromUid: user.uid,
          fromName: profile?.name || "",
          fromAvatar: profile?.photoURL || "",
          uid: post.authorId,
          title: replyTo ? "New Reply" : "New Comment",
          message: `${profile.name} ${replyTo ? "replied to a comment" : "commented"} on your post.`,
          type: "comment",
          read: false,
          createdAt: fb.serverTimestamp(),
        })
      }
      setReplyTo(null)
    } catch (e: any) {
      showToast("Error", e.message, "error")
    } finally {
      setCommentBusy(false)
    }
  }

  const handleReactToComment = async (
    postId: string,
    commentId: string,
    reactionKey: string,
    emoji: string,
    evt?: { clientX: number; clientY: number }
  ) => {
    try {
      const fb = await getFirebase()
      const ref = fb.doc(fb.db, "posts", postId)
      const snap = await fb.getDoc(ref)
      if (!snap.exists()) return
      const comments = snap.data().comments || []
      const updated = comments.map((c: any) => {
        if (c.id === commentId) {
          const reactions = { ...(c.reactions || {}) }
          if (reactions[user.uid] === reactionKey) {
            delete reactions[user.uid]
          } else {
            reactions[user.uid] = reactionKey
          }
          return { ...c, reactions }
        }
        return c
      })
      await fb.updateDoc(ref, { comments: updated })

      if (evt) {
        const id = ++flyingIdRef.current
        setFlyingReactions((prev) => [
          ...prev,
          { id, x: evt.clientX, y: evt.clientY, emoji },
        ])
        setTimeout(() => {
          setFlyingReactions((prev) => prev.filter((r) => r.id !== id))
        }, 750)
      }

      const targetComment = comments.find((c: any) => c.id === commentId)
      if (targetComment && targetComment.uid && targetComment.uid !== user.uid) {
        await fb.addDoc(fb.collection(fb.db, "notifications"), {
          postId,
          fromUid: user.uid,
          fromName: profile?.name || "",
          fromAvatar: profile?.photoURL || "",
          uid: targetComment.uid,
          title: "New Reaction",
          message: `${profile.name} reacted ${emoji} to your comment.`,
          type: "like",
          read: false,
          createdAt: fb.serverTimestamp(),
        })
      }
    } catch (e: any) {
      showToast("Error", e.message, "error")
    } finally {
      setReactionPicker({ open: false, commentKey: null, anchorRect: null })
    }
  }

  const handleLongPressReaction = (
    evt: React.MouseEvent | React.TouchEvent,
    commentKey: string
  ) => {
    const target = evt.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    setReactionPicker({
      open: true,
      commentKey,
      anchorRect: { x: rect.left, y: rect.top, width: rect.width },
    })
  }

  const buildCommentTree = (comments: any[]) => {
    const tops: any[] = []
    const repliesMap: Record<string, any[]> = {}
    for (const c of comments) {
      if (c.parentId) {
        if (!repliesMap[c.parentId]) repliesMap[c.parentId] = []
        repliesMap[c.parentId].push(c)
      } else {
        tops.push(c)
      }
    }
    return { tops, repliesMap }
  }

  /* ============================================================
     EDIT / DELETE — COMMENTS
     ============================================================ */

  const startEditComment = (c: any) => {
    setEditCommentId(c.id)
    setEditCommentText(c.text || "")
  }

  const cancelEditComment = () => {
    setEditCommentId(null)
    setEditCommentText("")
  }

  const handleSaveEditComment = async (postId: string, commentId: string) => {
    if (editCommentBusy) return
    const text = editCommentText.trim()
    setEditCommentBusy(true)
    try {
      const fb = await getFirebase()
      const ref = fb.doc(fb.db, "posts", postId)
      const snap = await fb.getDoc(ref)
      if (!snap.exists()) return
      const comments = snap.data().comments || []
      const target = comments.find((c: any) => c.id === commentId)
      if (!target || target.uid !== user.uid) {
        showToast("Error", "You can only edit your own comment", "error")
        return
      }
      if (!text && !target.image) {
        showToast("Empty comment", "Write something or delete the comment", "error")
        return
      }
      if (text === (target.text || "")) {
        cancelEditComment()
        return
      }
      const updated = comments.map((c: any) =>
        c.id === commentId ? { ...c, text, edited: true, editedAt: Date.now() } : c
      )
      await fb.updateDoc(ref, { comments: updated })
      cancelEditComment()
      showToast("Comment updated", "", "success")
    } catch (e: any) {
      showToast("Error", e.message, "error")
    } finally {
      setEditCommentBusy(false)
    }
  }

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!confirm("Delete this comment?")) return
    try {
      const fb = await getFirebase()
      const ref = fb.doc(fb.db, "posts", postId)
      const snap = await fb.getDoc(ref)
      if (!snap.exists()) return
      const comments = snap.data().comments || []
      const target = comments.find((c: any) => c.id === commentId)
      if (!target || target.uid !== user.uid) {
        showToast("Error", "You can only delete your own comment", "error")
        return
      }
      // Remove the comment and any replies under it
      const updated = comments.filter(
        (c: any) => c.id !== commentId && c.parentId !== commentId
      )
      await fb.updateDoc(ref, { comments: updated })
      if (editCommentId === commentId) cancelEditComment()
      showToast("Comment deleted", "", "success")
    } catch (e: any) {
      showToast("Error", e.message, "error")
    }
  }

  /* ============================================================
     EDIT — POSTS (caption + photo)
     ============================================================ */

  const openEditPost = (post: any) => {
    setEditPostId(post.id)
    setEditPostText(post.caption || "")
    setEditPostImage(post.image || "")
    setEditPostFile(null)
    setEditPostPreview("")
  }

  const closeEditPost = () => {
    if (editPostBusy) return
    setEditPostId(null)
    setEditPostText("")
    setEditPostImage("")
    setEditPostFile(null)
    setEditPostPreview("")
  }

  const handleEditPostFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setEditPostFile(f)
    setEditPostPreview(URL.createObjectURL(f))
    e.target.value = ""
  }

  const removeEditPostPhoto = () => {
    setEditPostFile(null)
    setEditPostPreview("")
    setEditPostImage("")
  }

  const handleSaveEditPost = async () => {
    if (!editPostId || editPostBusy) return
    const text = editPostText.trim()
    const hasImage = !!editPostFile || !!editPostImage
    if (!text && !hasImage) {
      showToast("Empty post", "Write something or add a photo", "error")
      return
    }
    setEditPostBusy(true)
    try {
      const fb = await getFirebase()
      const ref = fb.doc(fb.db, "posts", editPostId)
      const snap = await fb.getDoc(ref)
      if (!snap.exists()) {
        showToast("Error", "Post not found", "error")
        return
      }
      if (snap.data().authorId !== user.uid) {
        showToast("Error", "You can only edit your own post", "error")
        return
      }
      let imageUrl = editPostImage
      if (editPostFile) {
        imageUrl = await cloudinaryUpload(editPostFile)
      }
      await fb.updateDoc(ref, {
        caption: text,
        image: imageUrl,
        edited: true,
        editedAt: fb.serverTimestamp(),
      })
      setEditPostBusy(false)
      setEditPostId(null)
      setEditPostText("")
      setEditPostImage("")
      setEditPostFile(null)
      setEditPostPreview("")
      showToast("Post updated", "Your changes are saved", "success")
    } catch (e: any) {
      showToast("Error", e.message, "error")
    } finally {
      setEditPostBusy(false)
    }
  }

  /* ============================================================
     EDIT / UNSEND — CHAT MESSAGES
     ============================================================ */

  const chatMsgSummary = (m: any) =>
    m.type === "image"
      ? "📷 Photo"
      : m.type === "voice"
      ? "🎤 Voice message"
      : m.type === "like"
      ? "👍"
      : m.text || ""

  const startEditMessage = (m: any) => {
    setEditingMsgId(m.id)
    setChatReplyTo(null)
    setChatInput(m.text || "")
    setTimeout(() => chatInputRef.current?.focus(), 50)
  }

  const cancelEditMessage = () => {
    setEditingMsgId(null)
    setChatInput("")
  }

  const handleSaveEditMessage = async (text: string) => {
    const msgId = editingMsgId
    if (!msgId || !activeChat) return
    const msg = chatMessages.find((m) => m.id === msgId)
    if (!msg || msg.from !== user.uid) {
      cancelEditMessage()
      return
    }
    if (text === (msg.text || "")) {
      cancelEditMessage()
      return
    }
    void updateTypingState(activeChat, false)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
    const isLast = chatMessages[chatMessages.length - 1]?.id === msgId
    setEditingMsgId(null)
    setChatInput("")
    try {
      const fb = await getFirebase()
      await fb.updateDoc(fb.doc(fb.db, "chats", activeChat, "messages", msgId), {
        text,
        edited: true,
        editedAt: fb.serverTimestamp(),
      })
      if (isLast) {
        await fb.updateDoc(fb.doc(fb.db, "chats", activeChat), {
          "lastMessage.text": text,
        })
      }
    } catch (e: any) {
      showToast("Error", e.message, "error")
    }
  }

  const handleDeleteMessage = async (msgId: string) => {
    if (!activeChat) return
    const idx = chatMessages.findIndex((m) => m.id === msgId)
    const msg = chatMessages[idx]
    if (!msg || msg.from !== user.uid) return
    if (!confirm("Unsend this message? It will be removed for everyone.")) return
    const wasLast = idx === chatMessages.length - 1
    const prev = idx > 0 ? chatMessages[idx - 1] : null
    try {
      const fb = await getFirebase()
      await fb.deleteDoc(fb.doc(fb.db, "chats", activeChat, "messages", msgId))
      if (editingMsgId === msgId) cancelEditMessage()
      if (chatReplyTo && chatReplyTo.id === msgId) setChatReplyTo(null)
      if (wasLast) {
        await fb.updateDoc(fb.doc(fb.db, "chats", activeChat), {
          lastMessage: prev ? { text: chatMsgSummary(prev), from: prev.from } : null,
        })
      }
      showToast("Message unsent", "", "success")
    } catch (e: any) {
      showToast("Error", e.message, "error")
    }
  }

  /* ============================================================
     CHAT REACTIONS
     ============================================================ */

  const handleReactToMessage = async (
    msgId: string,
    reactionKey: string,
    emoji: string,
    evt?: { clientX: number; clientY: number }
  ) => {
    if (!activeChat) return
    try {
      const fb = await getFirebase()
      const ref = fb.doc(fb.db, "chats", activeChat, "messages", msgId)
      const snap = await fb.getDoc(ref)
      if (!snap.exists()) return
      const data = snap.data()
      const reactions = { ...(data.reactions || {}) }
      if (reactions[user.uid] === reactionKey) {
        delete reactions[user.uid]
      } else {
        reactions[user.uid] = reactionKey
      }
      await fb.updateDoc(ref, { reactions })

      if (evt) {
        const id = ++flyingIdRef.current
        setFlyingReactions((prev) => [
          ...prev,
          { id, x: evt.clientX, y: evt.clientY, emoji },
        ])
        setTimeout(() => {
          setFlyingReactions((prev) => prev.filter((r) => r.id !== id))
        }, 750)
      }

      if (data.from && data.from !== user.uid) {
        await fb.addDoc(fb.collection(fb.db, "notifications"), {
          chatId: activeChat,
          fromUid: user.uid,
          fromName: profile?.name || "",
          fromAvatar: profile?.photoURL || "",
          uid: data.from,
          title: "New Reaction",
          message: `${profile.name} reacted ${emoji} to your message.`,
          type: "like",
          read: false,
          createdAt: fb.serverTimestamp(),
        })
      }
    } catch (e: any) {
      showToast("Error", e.message, "error")
    } finally {
      setChatReactionPicker({ open: false, msgId: null, anchorRect: null })
    }
  }

  const openChatReactionPicker = (
    evt: React.MouseEvent | React.TouchEvent,
    msgId: string
  ) => {
    const target = evt.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    setChatReactionPicker({
      open: true,
      msgId,
      anchorRect: { x: rect.left + rect.width / 2, y: rect.top, width: rect.width },
    })
  }

  /* ============================================================
     FRIEND ACTIONS
     ============================================================ */

  const handleUnfollow = async (friendUid: string) => {
    const already = unfollowedSet.has(friendUid)
    try {
      const fb = await getFirebase()
      await fb.updateDoc(fb.doc(fb.db, "users", user.uid), {
        unfollowed: already ? fb.arrayRemove(friendUid) : fb.arrayUnion(friendUid),
      })
      setUnfollowedSet((prev) => {
        const copy = new Set(prev)
        if (already) copy.delete(friendUid)
        else copy.add(friendUid)
        return copy
      })
      if (already) showToast("Following again", "You'll see their posts in your feed", "success")
      else showToast("Unfollowed", "You won't see their posts. They weren't notified.", "info")
    } catch (e: any) {
      showToast("Error", e.message, "error")
    }
  }

  const handleBlockUser = async (friendUid: string) => {
    if (!confirm("Block this user? They won't be able to see or contact you.")) return
    try {
      const fb = await getFirebase()
      const fid = friendDocIdFor(user.uid, friendUid)
      try {
        await fb.deleteDoc(fb.doc(fb.db, "friends", fid))
      } catch {}
      const blockId = `${user.uid}_${friendUid}`
      await fb.setDoc(fb.doc(fb.db, "blocks", blockId), {
        blocker: user.uid,
        blocked: friendUid,
        createdAt: fb.serverTimestamp(),
      })
      setMyFriends((prev) => prev.filter((f) => f.uid !== friendUid))
      showToast("Blocked", "User has been blocked", "success")
    } catch (e: any) {
      showToast("Error", e.message, "error")
    }
  }

  const handleUnfriend = async (friendUid: string, friendName: string) => {
    if (!confirm(`Remove ${friendName} as a friend?`)) return
    try {
      const fb = await getFirebase()
      const fid = friendDocIdFor(user.uid, friendUid)
      await fb.deleteDoc(fb.doc(fb.db, "friends", fid))
      setMyFriends((prev) => prev.filter((f) => f.uid !== friendUid))
      showToast("Unfriended", `${friendName} has been removed from your friends`, "info")
    } catch (e: any) {
      showToast("Error", e.message, "error")
    }
  }

  const handleToggleFavourite = async (f: any) => {
    const isFav = (profile?.favourites || []).includes(f.uid)
    try {
      const fb = await getFirebase()
      await fb.updateDoc(fb.doc(fb.db, "users", user.uid), {
        favourites: isFav ? fb.arrayRemove(f.uid) : fb.arrayUnion(f.uid),
      })
      showToast(
        isFav ? "Removed" : "Added to Favourites",
        isFav ? `${f.name} removed from Favourites` : `${f.name} is now in your Favourites`,
        "success"
      )
    } catch (e: any) {
      showToast("Error", e.message, "error")
    }
  }

  const handleTakeBreak = async (f: any) => {
    const active = Number(profile?.breaks?.[f.uid] || 0) > Date.now()
    try {
      const fb = await getFirebase()
      await fb.updateDoc(fb.doc(fb.db, "users", user.uid), {
        [`breaks.${f.uid}`]: active ? 0 : Date.now() + 30 * 24 * 60 * 60 * 1000,
      })
      showToast(
        active ? "Break ended" : "Taking a break",
        active ? `You'll see ${f.name}'s posts again` : `${f.name}'s posts are hidden for 30 days`,
        "info"
      )
    } catch (e: any) {
      showToast("Error", e.message, "error")
    }
  }

  const handleSaveFriendLists = async (f: any, lists: string[]) => {
    try {
      const fb = await getFirebase()
      await fb.updateDoc(fb.doc(fb.db, "users", user.uid), {
        [`friendLists.${f.uid}`]: lists,
      })
      showToast("Saved", "Friend list updated", "success")
    } catch (e: any) {
      showToast("Error", e.message, "error")
    }
  }

  /* ============================================================
     AUTH HANDLERS
     ============================================================ */

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (authBusy) return
    setAuthBusy(true)
    setAuthErr((prev) => ({ ...prev, si: "" }))
    try {
      const fb = await getFirebase()
      await fb.signInWithEmailAndPassword(fb.auth, siEmail.trim(), siPass)
      showToast("Welcome back!", "Signed in successfully", "success")
    } catch (err: any) {
      console.error(err)
      setAuthErr((prev) => ({ ...prev, si: friendlyErr(err) }))
      setAuthBusy(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (authBusy) return
    setAuthBusy(true)
    setAuthErr((prev) => ({ ...prev, su: "" }))
    try {
      const fb = await getFirebase()
      const cred = await fb.createUserWithEmailAndPassword(fb.auth, suEmail.trim(), suPass)
      await fb.updateProfile(cred.user, { displayName: suName.trim() })
      await fb.setDoc(fb.doc(fb.db, "users", cred.user.uid), {
        uid: cred.user.uid,
        name: suName.trim(),
        email: cred.user.email,
        photoURL: "",
        coverURL: "",
        bio: "Movie lover 🎬",
        location: "",
        phone: "",
        birthday: "",
        handle: "",
        verified: false,
        createdAt: fb.serverTimestamp(),
        privacy: { info: true, posts: true, requests: true },
      })
      showToast("Account created!", "Welcome to MeBook", "success")
    } catch (err: any) {
      console.error(err)
      setAuthErr((prev) => ({ ...prev, su: friendlyErr(err) }))
      setAuthBusy(false)
    }
  }

  const handleGoogleSignIn = async () => {
    if (authBusy) return
    setAuthBusy(true)
    try {
      const fb = await getFirebase()
      const provider = new fb.GoogleAuthProvider()
      const cred = await fb.signInWithPopup(fb.auth, provider)
      const ref = fb.doc(fb.db, "users", cred.user.uid)
      const snap = await fb.getDoc(ref)
      if (!snap.exists()) {
        await fb.setDoc(ref, {
          uid: cred.user.uid,
          name: cred.user.displayName || "User",
          email: cred.user.email,
          photoURL: cred.user.photoURL || "",
          coverURL: "",
          bio: "Movie lover 🎬",
          location: "",
          phone: "",
          birthday: "",
          handle: "",
          verified: false,
          createdAt: fb.serverTimestamp(),
          privacy: { info: true, posts: true, requests: true },
        })
      }
      showToast("Signed in with Google", "Welcome!", "success")
    } catch (err: any) {
      console.error(err)
      showToast("Google sign-in failed", friendlyErr(err), "error")
      setAuthBusy(false)
    }
  }

  const handleSignOut = async () => {
    if (!confirm("Log out of MeBook?")) return
    try {
      const fb = await getFirebase()
      cleanupListeners()
      await fb.signOut(fb.auth)
      showToast("Signed out", "See you soon!", "info")
    } catch (e: any) {
      showToast("Error", e.message, "error")
    }
  }

  const handleResetPassword = async () => {
    if (!user?.email) return
    try {
      const fb = await getFirebase()
      await fb.sendPasswordResetEmail(fb.auth, user.email)
      showToast("Email sent", "Password reset link sent to your email", "success")
    } catch (e: any) {
      showToast("Error", e.message, "error")
    }
  }

  /* ============================================================
     NAVIGATION
     ============================================================ */

  const goTo = (view: string, params: any = {}) => {
    setPageStack([{ view, params }])
    setDrawerOpen(false)
    setMenuOpen(false)
    if (view !== "messages") setMobileChatWindow(false)
    if (view !== "comments") {
      setReplyTo(null)
      setCommentText("")
      setCommentImageFile(null)
      setCommentImagePreview("")
    }
    if (view !== "messages") {
      setChatView("list")
      setActiveChat(null)
      setChatPartner(null)
      setChatMessages([])
    }
    window.scrollTo({ top: 0, behavior: "auto" })
  }

  const pushPage = (view: string, params: any = {}) => {
    setPageStack((s) => [...s, { view, params }])
    setDrawerOpen(false)
    setMenuOpen(false)
    window.scrollTo({ top: 0, behavior: "auto" })
  }

  const goBack = () => {
    setPageStack((s) => (s.length > 1 ? s.slice(0, -1) : [{ view: "home" }]))
    setReplyTo(null)
    setCommentText("")
    setCommentImageFile(null)
    setCommentImagePreview("")
    if (currentView === "messages") {
      setChatView("list")
      setActiveChat(null)
      setChatPartner(null)
    }
    window.scrollTo({ top: 0, behavior: "auto" })
  }

  const handleNavClick = (view: string) => {
    if (currentView === view) {
      window.scrollTo({ top: 0, behavior: "smooth" })
      setDrawerOpen(false)
    } else {
      goTo(view)
    }
  }

  const openComments = (post: any) => {
    setReplyTo(null)
    setCommentText("")
    setCommentImageFile(null)
    setCommentImagePreview("")
    pushPage("comments", { postId: post.id })
    setTimeout(() => {
      try {
        commentInputRef.current?.focus()
      } catch {}
      if (commentListRef.current) {
        commentListRef.current.scrollTop = commentListRef.current.scrollHeight
      }
    }, 220)
  }

  const openShare = (post: any) => pushPage("share", { postId: post.id })

  const openSearch = () => {
    setSrQuery("")
    pushPage("search")
  }

  const openUserProfile = async (uid: string) => {
    if (uid === user.uid) {
      goTo("profile")
      return
    }
    if (uid === "admin") {
      goTo("community")
      return
    }
    try {
      const fb = await getFirebase()
      const snap = await fb.getDoc(fb.doc(fb.db, "users", uid))
      if (!snap.exists()) {
        showToast("Not found", "User does not exist", "error")
        return
      }
      const userData = { uid, ...snap.data() }
      setViewingUser(userData)
      setProfileTab("all")
      setFbPhotoSub("")
      setViewingUserFriends([])
      setViewingUserFriendsLoading(true)

      if (viewingUserUnsubRef.current) {
        try { viewingUserUnsubRef.current() } catch {}
        viewingUserUnsubRef.current = null
      }
      if (viewingUserFriendsUnsubRef.current) {
        try { viewingUserFriendsUnsubRef.current() } catch {}
        viewingUserFriendsUnsubRef.current = null
      }

      const postsQ = fb.query(
        fb.collection(fb.db, "posts"),
        fb.where("authorId", "==", uid)
      )
      viewingUserUnsubRef.current = fb.onSnapshot(postsQ, (s: any) => {
        const arr: any[] = []
        s.forEach((d: any) => arr.push({ id: d.id, ...d.data() }))
        arr.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
        setViewingUserPosts(arr)
      })

      const theirFriendsQ = fb.query(
        fb.collection(fb.db, "friends"),
        fb.where("members", "array-contains", uid)
      )
      viewingUserFriendsUnsubRef.current = fb.onSnapshot(
        theirFriendsQ,
        async (s: any) => {
          const arr: any[] = []
          const seen = new Set<string>()
          for (const d of s.docs) {
            const data = d.data()
            const otherId = (data.members || []).find((m: string) => m !== uid)
            if (!otherId || seen.has(otherId)) continue
            seen.add(otherId)
            try {
              const us = await fb.getDoc(fb.doc(fb.db, "users", otherId))
              if (us.exists()) arr.push({ uid: us.id, ...us.data() })
            } catch {}
          }
          setViewingUserFriends(arr)
          setViewingUserFriendsLoading(false)
        }
      )

      pushPage("user-profile", { uid })
    } catch (e: any) {
      showToast("Error", e.message, "error")
      setViewingUserFriendsLoading(false)
    }
  }

  const openFriendsList = (uid: string, name: string) => {
    pushPage("friends-list", { uid, name })
  }

  // profile link (?mb=profile&u=UID) দিয়ে এলে সেই user এর profile খুলবে
  useEffect(() => {
    if (!user || !pendingProfileRef.current) return
    const pu = pendingProfileRef.current
    pendingProfileRef.current = null
    void openUserProfile(pu)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fbProfileLink = (uid: string) => {
    try {
      return `${window.location.origin}${window.location.pathname}?mb=profile&u=${uid}`
    } catch {
      return ""
    }
  }

  const fbCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement("textarea")
      ta.value = text
      ta.style.position = "fixed"
      ta.style.opacity = "0"
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand("copy") } catch {}
      document.body.removeChild(ta)
    }
    showToast("Link copied", "Profile link copied to clipboard", "success")
  }

  const fbShareLink = async (title: string, text: string, url: string) => {
    try {
      if ((navigator as any).share) {
        await (navigator as any).share({ title, text, url })
        return
      }
    } catch (e: any) {
      if (e?.name === "AbortError") return
    }
    await fbCopyText(url)
  }

  const fbPoke = async (u: any) => {
    try {
      const fb = await getFirebase()
      await fb.addDoc(fb.collection(fb.db, "notifications"), {
        fromUid: user.uid,
        fromName: profile?.name || "",
        fromAvatar: profile?.photoURL || "",
        uid: u.uid,
        title: "Poke",
        message: `${profile?.name || "Someone"} poked you.`,
        type: "poke",
        read: false,
        createdAt: fb.serverTimestamp(),
      })
      showToast("Poked", `You poked ${u.name}`, "success")
    } catch (e: any) {
      showToast("Error", e.message, "error")
    }
  }

  const fbReportProfile = async (u: any, reason: string) => {
    try {
      const fb = await getFirebase()
      await fb.addDoc(fb.collection(fb.db, "profile_reports"), {
        uid: user.uid,
        reportedUid: u.uid,
        reportedName: u.name || "",
        reason,
        createdAt: fb.serverTimestamp(),
      })
      showToast("Reported", "Thanks! We'll review this profile", "success")
    } catch (e: any) {
      showToast("Error", e.message || "Report failed", "error")
    }
  }

  /* ============================================================
     POST MENU / SHARE / MANAGE POSTS (Facebook style)
     ============================================================ */

  const updatePostDoc = async (postId: string, patch: any, okTitle?: string, okMsg = "") => {
    try {
      const fb = await getFirebase()
      await fb.updateDoc(fb.doc(fb.db, "posts", postId), patch)
      if (okTitle) showToast(okTitle, okMsg, "success")
      return true
    } catch (e: any) {
      showToast("Error", e.message, "error")
      return false
    }
  }

  const getShareDefaultAudience = () => {
    try {
      return localStorage.getItem("mebook_share_audience") || "public"
    } catch {
      return "public"
    }
  }

  const canSeePost = (post: any, isMine = false) => {
    if (!post) return false
    if (post.binnedAt) return false
    if (post.archived) return !!isMine
    if (user && post.authorId === user.uid) return true
    if (post.audience === "only_me") return false
    if (post.audience === "friends") return myFriends.some((f: any) => f.uid === post.authorId)
    return true
  }

  const commentLockMsg = (post: any) => {
    if (!post || !user || post.authorId === user.uid) return ""
    if (post.commentPermission === "none") return "Comments are turned off for this post."
    if (post.commentPermission === "friends" && !myFriends.some((f: any) => f.uid === post.authorId)) {
      return `Only ${post.authorName || "the author"}'s friends can comment on this post.`
    }
    return ""
  }

  const handlePostMenuAction = async (key: string, postId: string) => {
    const post: any = findPost(postId)
    if (!post) return
    switch (key) {
      case "pin": {
        const willPin = !post.pinned
        if (willPin) {
          for (const p of myPosts) {
            if (p.pinned && p.id !== postId) await updatePostDoc(p.id, { pinned: false })
          }
        }
        await updatePostDoc(
          postId,
          { pinned: willPin, pinnedAt: willPin ? Date.now() : 0 },
          willPin ? "Post pinned" : "Post unpinned",
          willPin ? "It now shows at the top of your profile." : ""
        )
        break
      }
      case "save": {
        try {
          const fb = await getFirebase()
          const has = savedIds.includes(postId)
          await fb.updateDoc(fb.doc(fb.db, "users", user.uid), {
            savedPosts: has ? fb.arrayRemove(postId) : fb.arrayUnion(postId),
          })
          setSavedIds((s) => (has ? s.filter((x) => x !== postId) : [...s, postId]))
          showToast(has ? "Removed from saved" : "Post saved", "", "success")
        } catch (e: any) {
          showToast("Error", e.message, "error")
        }
        break
      }
      case "edit":
        openEditPost(post)
        break
      case "product":
        setLinkDialogPostId(postId)
        break
      case "comment":
        setChoiceFor({ kind: "comment", postId })
        break
      case "privacy":
        setChoiceFor({ kind: "privacy", postId })
        break
      case "archive":
        await updatePostDoc(
          postId,
          { archived: !post.archived, pinned: false },
          post.archived ? "Restored from archive" : "Moved to archive",
          post.archived ? "" : "Only you can see it now. Manage it from your profile."
        )
        break
      case "bin":
        await updatePostDoc(
          postId,
          { binnedAt: Date.now(), pinned: false },
          "Moved to bin",
          "Items in your bin are deleted after 30 days."
        )
        break
      case "notif":
        await updatePostDoc(
          postId,
          { muteNotifs: !post.muteNotifs },
          post.muteNotifs ? "Notifications turned on" : "Notifications turned off",
          "For this post"
        )
        break
      case "copy":
        copyLink(post)
        break
      case "ad_code": {
        const code = `MB-${String(postId).slice(0, 8).toUpperCase()}`
        try {
          await navigator.clipboard.writeText(code)
          showToast("Ad code copied", code, "success")
        } catch {
          showToast("Ad code", code, "info")
        }
        break
      }
      case "ad":
        showToast("Ads aren't available yet", "Creating ads isn't supported on MeBook right now.", "info")
        break
    }
  }

  const restorePost = async (postId: string) => {
    const p: any = findPost(postId)
    if (!p) return
    await updatePostDoc(postId, p.binnedAt ? { binnedAt: 0 } : { archived: false }, "Post restored")
  }

  const deleteForever = async (postId: string) => {
    if (!confirm("Delete this post permanently?")) return
    try {
      const fb = await getFirebase()
      await fb.deleteDoc(fb.doc(fb.db, "posts", postId))
      showToast("Post deleted", "", "success")
    } catch (e: any) {
      showToast("Error", e.message, "error")
    }
  }

  const shareNow = async (post: any, caption: string, audience: string, setDefault: boolean) => {
    if (!post || shareBusy) return false
    setShareBusy(true)
    try {
      const fb = await getFirebase()
      const root: any = post.sharedPost
        ? post.sharedPost
        : {
            id: post.id,
            authorId: post.authorId || "",
            authorName: post.authorName || "User",
            authorAvatar: post.isOfficial ? LOGO_URL : post.authorAvatar || "",
            verified: isVerified(post),
            caption: post.caption || "",
            image: post.image || "",
            movie: post.movie || "",
            type: post.type || "",
            youtube: post.youtube || null,
            createdMs: post.createdAt?.toMillis
              ? post.createdAt.toMillis()
              : post.createdAt?.seconds
              ? post.createdAt.seconds * 1000
              : Date.now(),
          }
      await fb.addDoc(fb.collection(fb.db, "posts"), {
        authorId: user.uid,
        authorName: profile.name,
        authorAvatar: profile.photoURL || "",
        verified: profile.verified === true,
        caption,
        movie: "",
        image: "",
        sharedPost: root,
        originalPostId: root.id,
        originalAuthor: root.authorName || "",
        audience,
        likes: [],
        reactions: {},
        comments: [],
        shares: 0,
        createdAt: fb.serverTimestamp(),
      })
      await fb.updateDoc(fb.doc(fb.db, "posts", post.id), { shares: fb.increment(1) })
      if (setDefault) {
        try { localStorage.setItem("mebook_share_audience", audience) } catch {}
      }
      if (post.authorId && post.authorId !== user.uid && post.authorId !== "admin" && !post.muteNotifs) {
        await fb.addDoc(fb.collection(fb.db, "notifications"), {
          postId: post.id,
          fromUid: user.uid,
          fromName: profile?.name || "",
          fromAvatar: profile?.photoURL || "",
          uid: post.authorId,
          title: "Post Shared",
          message: `${profile.name} shared your post.`,
          type: "share",
          read: false,
          createdAt: fb.serverTimestamp(),
        })
      }
      showToast("You shared this post.", "", "success")
      return true
    } catch (e: any) {
      console.error(e)
      showToast("Share failed", e.message, "error")
      return false
    } finally {
      setShareBusy(false)
    }
  }

  const sendPostToFriend = async (post: any, friendUid: string) => {
    try {
      const fb = await getFirebase()
      const cid = chatIdFor(user.uid, friendUid)
      const cref = fb.doc(fb.db, "chats", cid)
      const snap = await fb.getDoc(cref)
      if (!snap.exists()) {
        await fb.setDoc(cref, {
          members: [user.uid, friendUid],
          createdAt: fb.serverTimestamp(),
          lastMessage: null,
          lastAt: fb.serverTimestamp(),
        })
      }
      const text = `📎 ${post.authorName || "A"}'s post\n${buildShareUrl(post.id)}`
      await fb.addDoc(fb.collection(fb.db, "chats", cid, "messages"), {
        from: user.uid,
        text,
        at: fb.serverTimestamp(),
      })
      await fb.updateDoc(cref, {
        lastMessage: { text: "📎 Shared a post", from: user.uid },
        lastAt: fb.serverTimestamp(),
      })
      return true
    } catch (e: any) {
      showToast("Couldn't send", e.message, "error")
      return false
    }
  }

  const nativeShare = async (post: any) => {
    const url = buildShareUrl(post.id)
    try {
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share({ title: `${post.authorName || "MeBook"} on MeBook`, url })
      } else {
        copyLink(post)
      }
    } catch {}
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Delete this post?")) return
    try {
      const fb = await getFirebase()
      await fb.deleteDoc(fb.doc(fb.db, "posts", postId))
      showToast("Post deleted", "Your post has been removed", "success")
    } catch (e: any) {
      showToast("Error", e.message, "error")
    }
  }

  const openCreatePost = () => {
    setPostText("")
    setPostMovie("")
    setSelectedFile(null)
    setPreviewUrl("")
    setUploadProgress(null)
    setPostAudience("public")
    setPostFeeling("")
    setPostLocation("")
    setPostMusic(null)
    setPostTagged([])
    pushPage("create-post")
  }

  const handlePreviewFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const removePreview = () => {
    setSelectedFile(null)
    setPreviewUrl("")
  }

  const handleSubmitPost = async () => {
    const text = postText.trim()
    const movie = postMovie.trim() || "Movie"
    if (!text && !selectedFile) {
      showToast("Empty post", "Write something or add a photo", "error")
      return
    }
    if (postBusy) return
    setPostBusy(true)
    try {
      const fb = await getFirebase()
      let imageUrl = ""
      if (selectedFile) {
        setUploadProgress(0)
        imageUrl = await cloudinaryUpload(selectedFile, (pct) => setUploadProgress(pct))
      }
      let musicData: any = null
      if (postMusic) {
        let mu = postMusic.url
        if (postMusic.file) mu = await cloudinaryUpload(postMusic.file, undefined, "video")
        musicData = { title: postMusic.title || "", artist: postMusic.artist || "", cover: postMusic.cover || "", url: mu }
      }
      await fb.addDoc(fb.collection(fb.db, "posts"), {
        authorId: user.uid,
        authorName: profile.name,
        authorAvatar: profile.photoURL || "",
        verified: profile.verified === true,
        caption: text,
        movie,
        image: imageUrl,
        audience: postAudience,
        ...(postFeeling ? { feeling: postFeeling } : {}),
        ...(postLocation ? { location: postLocation } : {}),
        ...(postTagged.length ? { tagged: postTagged.map((t: any) => t.uid), taggedNames: postTagged.map((t: any) => t.name) } : {}),
        ...(musicData ? { music: musicData } : {}),
        likes: [],
        reactions: {},
        comments: [],
        shares: 0,
        createdAt: fb.serverTimestamp(),
      })
      setPostText("")
      setPostMovie("")
      removePreview()
      setUploadProgress(null)
      setPostAudience("public")
      setPostFeeling("")
      setPostLocation("")
      setPostMusic(null)
      setPostTagged([])
      showToast("Post published!", "Your post is now live", "success")
      goTo("home")
    } catch (err: any) {
      console.error(err)
      showToast("Failed to publish", err.message || "Try again", "error")
    } finally {
      setPostBusy(false)
    }
  }

  const handleSendRequest = async (toUid: string) => {
    if (toUid === user.uid) return
    if (sentRequests[toUid]) return
    setSentRequests((s) => ({ ...s, [toUid]: "sending" }))

    try {
      const fb = await getFirebase()
      const q1 = fb.query(
        fb.collection(fb.db, "friendRequests"),
        fb.where("from", "==", user.uid),
        fb.where("to", "==", toUid)
      )
      const s1 = await fb.getDocs(q1)
      const q2 = fb.query(
        fb.collection(fb.db, "friendRequests"),
        fb.where("from", "==", toUid),
        fb.where("to", "==", user.uid)
      )
      const s2 = await fb.getDocs(q2)
      if (!s1.empty || !s2.empty) {
        showToast("Already exists", "Request already pending", "info")
        setSentRequests((s) => {
          const copy = { ...s }
          delete copy[toUid]
          return copy
        })
        return
      }
      await fb.addDoc(fb.collection(fb.db, "friendRequests"), {
        from: user.uid,
        to: toUid,
        status: "pending",
        createdAt: fb.serverTimestamp(),
      })
      await fb.addDoc(fb.collection(fb.db, "notifications"), {
        uid: toUid,
        title: "New Friend Request",
        message: `${profile.name} sent you a friend request.`,
        type: "friend",
        fromUid: user.uid,
        fromName: profile.name,
        fromAvatar: profile.photoURL || "",
        requestId: toUid + "_" + user.uid,
        read: false,
        createdAt: fb.serverTimestamp(),
      })
      setTimeout(() => {
        setSentRequests((s) => ({ ...s, [toUid]: "sent" }))
        showToast("Request sent!", "Friend request has been sent", "success")
      }, 500)
    } catch (e: any) {
      setSentRequests((s) => {
        const copy = { ...s }
        delete copy[toUid]
        return copy
      })
      showToast("Error", e.message, "error")
    }
  }

  const handleCancelRequest = async (toUid: string) => {
    try {
      const fb = await getFirebase()
      const q = fb.query(
        fb.collection(fb.db, "friendRequests"),
        fb.where("from", "==", user.uid),
        fb.where("to", "==", toUid),
        fb.where("status", "==", "pending")
      )
      const snap = await fb.getDocs(q)
      for (const d of snap.docs) {
        await fb.deleteDoc(fb.doc(fb.db, "friendRequests", d.id))
      }
      setSentRequests((s) => {
        const copy = { ...s }
        delete copy[toUid]
        return copy
      })
      showToast("Cancelled", "Friend request cancelled", "info")
    } catch (e: any) {
      showToast("Error", e.message, "error")
    }
  }

  const handleAcceptRequest = async (reqId: string, fromUid: string) => {
    if (!user?.uid || !fromUid) return
    try {
      const fb = await getFirebase()
      const friendDocId = friendDocIdFor(user.uid, fromUid)

      try {
        await fb.updateDoc(fb.doc(fb.db, "friendRequests", reqId), {
          status: "accepted",
        })
      } catch (err) {
        const q = fb.query(
          fb.collection(fb.db, "friendRequests"),
          fb.where("from", "==", fromUid),
          fb.where("to", "==", user.uid),
          fb.where("status", "==", "pending")
        )
        const snap = await fb.getDocs(q)
        for (const d of snap.docs) {
          await fb.updateDoc(fb.doc(fb.db, "friendRequests", d.id), {
            status: "accepted",
          })
        }
      }

      await fb.setDoc(
        fb.doc(fb.db, "friends", friendDocId),
        {
          a: user.uid,
          b: fromUid,
          members: [user.uid, fromUid],
          createdAt: fb.serverTimestamp(),
        },
        { merge: true }
      )

      try {
        await fb.addDoc(fb.collection(fb.db, "notifications"), {
          fromUid: user.uid,
          fromName: profile?.name || "",
          fromAvatar: profile?.photoURL || "",
          uid: fromUid,
          title: "Friend Request Accepted",
          message: `${profile?.name || "Someone"} accepted your friend request.`,
          type: "friend",
          read: false,
          createdAt: fb.serverTimestamp(),
        })
      } catch {}

      showToast("You are now friends!", "Start chatting with them", "success")
    } catch (e: any) {
      console.error("accept failed:", e)
      showToast("Error", e.message || "Failed to accept request", "error")
    }
  }

  const handleDeclineRequest = async (reqId: string) => {
    try {
      const fb = await getFirebase()
      await fb.updateDoc(fb.doc(fb.db, "friendRequests", reqId), { status: "declined" })
      showToast("Declined", "Request declined", "info")
    } catch (e: any) {
      showToast("Error", e.message, "error")
    }
  }

  const markAllNotificationsRead = async () => {
    try {
      const fb = await getFirebase()
      const unread = notifications.filter((n) => !n.read)
      await Promise.all(
        unread.map((n) => fb.updateDoc(fb.doc(fb.db, "notifications", n.id), { read: true }))
      )
      showToast("Marked as read", "All notifications marked as read", "success")
    } catch (e: any) {
      showToast("Error", e.message, "error")
    }
  }

  const markNotificationRead = async (notifId: string) => {
    try {
      const fb = await getFirebase()
      await fb.updateDoc(fb.doc(fb.db, "notifications", notifId), { read: true })
    } catch {}
  }

  // load saved notification preferences once
  useEffect(() => {
    if (!profile || notifPrefsLoaded.current) return
    notifPrefsLoaded.current = true
    const np = (profile as any).notifPrefs
    if (np) setNotifPrefs({ less: np.less || [], muted: np.muted || [] })
  }, [profile])

  const saveNotifPrefs = async (next: { less: string[]; muted: string[] }) => {
    setNotifPrefs(next)
    try {
      const fb = await getFirebase()
      await fb.updateDoc(fb.doc(fb.db, "users", user.uid), { notifPrefs: next })
    } catch {}
  }

  const visibleNotifications = notifications.filter(
    (n) =>
      !(n.fromUid && notifPrefs.muted.includes(n.fromUid)) &&
      !(n.read && n.type && notifPrefs.less.includes(n.type))
  )

  // notification এ click করলে সংশ্লিষ্ট জায়গায় নিয়ে যাবে
  const openNotification = async (n: any) => {
    if (!n.read) markNotificationRead(n.id)
    const type = n.type
    try {
      if (n.postId) {
        if (!findPost(n.postId)) {
          const fb = await getFirebase()
          const snap = await fb.getDoc(fb.doc(fb.db, "posts", n.postId))
          if (!snap.exists()) {
            showToast("Not found", "This post is no longer available", "info")
            return
          }
          setExtraPosts((prev) => [...prev.filter((x) => x.id !== n.postId), { id: snap.id, ...snap.data() }])
        }
        pushPage("comments", { postId: n.postId })
        return
      }
      if (n.chatId && n.fromUid) {
        await startChat(n.fromUid, n.fromName || "User", n.fromAvatar || "")
        return
      }
      if (type === "friend") {
        if (n.fromUid) await openUserProfile(n.fromUid)
        else goTo("friends")
        return
      }
      if (type === "verification" || type === "subscription" || type === "account") {
        goTo("profile")
        return
      }
      if (type === "like" || type === "comment" || type === "share" || type === "post") {
        goTo("home")
      }
    } catch (e: any) {
      showToast("Error", e.message || "Could not open", "error")
    }
  }

  const deleteNotification = async (n: any) => {
    try {
      const fb = await getFirebase()
      await fb.deleteDoc(fb.doc(fb.db, "notifications", n.id))
      showToast("Deleted", "Notification removed", "success")
    } catch (e: any) {
      showToast("Error", e.message || "Delete failed", "error")
    }
  }

  const reportPhoto = async (pv: any) => {
    try {
      const fb = await getFirebase()
      await fb.addDoc(fb.collection(fb.db, "photo_reports"), {
        uid: user?.uid || "",
        postId: pv?.postId || "",
        src: pv?.src || "",
        authorName: pv?.name || "",
        createdAt: fb.serverTimestamp(),
      })
      showToast("Reported", "Thanks! We'll review this photo", "success")
    } catch (e: any) {
      showToast("Error", e.message || "Report failed", "error")
    }
  }

  const reportNotificationIssue = async (n: any) => {
    try {
      const fb = await getFirebase()
      await fb.addDoc(fb.collection(fb.db, "notification_reports"), {
        uid: user.uid,
        notificationId: n.id,
        type: n.type || "",
        title: n.title || "",
        message: n.message || "",
        createdAt: fb.serverTimestamp(),
      })
      showToast("Reported", "Thanks! Notifications team will look into it", "success")
    } catch (e: any) {
      showToast("Error", e.message || "Report failed", "error")
    }
  }

  const startChat = async (otherId: string, otherName: string, otherPhoto: string) => {
    if (otherId === user.uid) {
      showToast("Wait!", "You can't chat with yourself", "info")
      return
    }
    const cid = chatIdFor(user.uid, otherId)
    try {
      const fb = await getFirebase()
      const ref = fb.doc(fb.db, "chats", cid)
      const snap = await fb.getDoc(ref)
      if (!snap.exists()) {
        await fb.setDoc(ref, {
          members: [user.uid, otherId],
          createdAt: fb.serverTimestamp(),
          lastMessage: null,
          lastAt: fb.serverTimestamp(),
        })
      }
      goTo("messages")
      setTimeout(() => {
        openChat(cid, otherId, { uid: otherId, name: otherName, photoURL: otherPhoto })
      }, 80)
    } catch (e: any) {
      showToast("Error", e.message, "error")
    }
  }

  const openChat = async (chatId: string, otherId: string, other: any) => {
    if (chatPrefsRef.current.unread[chatId]) {
      updateChatPrefs((p: any) => { delete p.unread[chatId]; return p })
    }
    // If another chat was open, stop its typing state before switching.
    if (activeChat && activeChat !== chatId) {
      void updateTypingState(activeChat, false)
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }

    lastMarkedSeenRef.current = null
    if (editingMsgId) {
      setEditingMsgId(null)
      setChatInput("")
    }
    setPartnerTyping(false)
    setPartnerLastSeenMessageId(null)
    if (activeChat !== chatId) {
      setChatMessages([])
      setChatReplyTo(null)
      setChatInput("")
      setShowScrollDown(false)
    }
    setActiveChat(chatId)
    setChatPartner({ ...other, uid: otherId })
    setMobileChatWindow(true)
    setChatView("window")
    if (chatUnsubRef.current) {
      try { chatUnsubRef.current() } catch {}
      chatUnsubRef.current = null
    }
    const fb = await getFirebase()
    const q = fb.query(
      fb.collection(fb.db, "chats", chatId, "messages"),
      fb.orderBy("at", "asc")
    )
    let firstLoad = true
    chatUnsubRef.current = fb.onSnapshot(q, (snap: any) => {
      const arr: any[] = []
      snap.forEach((d: any) => arr.push({ id: d.id, ...d.data() }))
      mcDropDeleted(arr, chatPrefsRef.current.deleted[chatId])
      const el = chatBodyRef.current
      const near = !el || el.scrollHeight - el.scrollTop - el.clientHeight < 180
      const lastM = arr[arr.length - 1]
      setChatMessages(arr)
      if (firstLoad || near || (lastM && lastM.from === user.uid)) {
        setTimeout(() => {
          if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight
          }
        }, 80)
      }
      if (firstLoad) {
        firstLoad = false
        // Desktop: focus message box right away (mobile: keyboard opens on tap)
        setTimeout(() => {
          if (window.innerWidth > 820) chatInputRef.current?.focus()
        }, 200)
      }
    })
  }

  const closeChat = () => {
  // Chat বন্ধ করার আগে নিজের typing OFF
  if (activeChat) {
    void updateTypingState(activeChat, false)
  }

  if (typingTimeoutRef.current) {
    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = null
  }

  setPartnerTyping(false)
  setPartnerLastSeenMessageId(null)
  lastMarkedSeenRef.current = null

  setChatView("list")
  setActiveChat(null)
    setChatPartner(null)
    setChatMessages([])
    setChatReplyTo(null)
    setEditingMsgId(null)
    if (chatUnsubRef.current) {
      try { chatUnsubRef.current() } catch {}
      chatUnsubRef.current = null
    }
  }

  /* ============================================================
     PHONE BACK BUTTON (Facebook style)
     - overlay/sheet/drawer খোলা থাকলে -> সেটা বন্ধ হবে
     - অন্য page এ থাকলে -> আগের page এ যাবে (শেষে Home)
     - Home এ নিচে scroll করা থাকলে -> আগে top এ যাবে
     - Home এর top এ থাকলে -> "Exit MeBook?" popup
     (history entry site এর page.tsx manage করে, MeBook শুধু window.__mebookBack দেয়)
     ============================================================ */
  const exitingRef = useRef(false)
  const backRef = useRef<any>({})
  backRef.current = {
    exitConfirmOpen,
    drawerOpen,
    menuOpen,
    mcOpen,
    currentView,
    stackLen: pageStack.length,
    hasPhotoViewer: !!photoViewer,
    hasEngageSheet: !!engageSheet,
    hasShareSheet: !!shareSheetPostId,
    hasFriendSheet: !!actionSheetFriend,
    hasFbSheet: !!fbSheetUser || !!fbInfo || fbHlOpen || !!photoSheet,
    goBack,
    closeChat,
  }

  // MeBook থেকে বের হওয়া: site এর history model এ MeBook tab এর entry টা pop করা,
  // site এর popstate handler তখন আগের tab এ ফিরিয়ে দেবে
  const doExit = () => {
    exitingRef.current = true
    setExitConfirmOpen(false)
    try { window.history.back() } catch { onExit() }
    setTimeout(() => { exitingRef.current = false }, 800)
  }

  // Site (page.tsx) এর popstate handler এটাকে ডাকে (window.__mebookBack).
  // return true  = MeBook নিজেই back handle করেছে, MeBook এই tab এই থাকবে
  // return false = MeBook ছেড়ে আগের tab এ যেতে হবে
  useEffect(() => {
    if (typeof window === "undefined") return
    const w = window as any

    const handler = (): boolean => {
      if (exitingRef.current) return false

      const s = backRef.current

      if (s.exitConfirmOpen) { setExitConfirmOpen(false); return true }
      if (s.hasPhotoViewer) { window.dispatchEvent(new Event("mb-viewer-back")); return true }
      if (s.hasEngageSheet) { setEngageSheet(null); return true }
      if (s.hasShareSheet) { setShareSheetPostId(null); return true }
      if (s.hasFbSheet) { setFbSheetUser(null); setFbInfo(null); setFbHlOpen(false); setPhotoSheet(""); return true }
      if (s.hasFriendSheet) { setActionSheetFriend(null); return true }
      if (s.drawerOpen) { setDrawerOpen(false); return true }
      if (s.menuOpen) { setMenuOpen(false); return true }
      if (s.mcOpen) { s.closeChat(); return true }

      // অন্য page এ থাকলে আগের page এ (শেষে Home)
      if (s.currentView !== "home" || s.stackLen > 1) {
        s.goBack()
        return true
      }

      // Home এ কিন্তু নিচে scroll করা -> আগে top এ
      const y = Math.max(window.scrollY || 0, document.documentElement.scrollTop || 0)
      if (y > 80) {
        window.scrollTo({ top: 0, behavior: "smooth" })
        return true
      }

      // Home এর top এ -> exit popup
      setExitConfirmOpen(true)
      return true
    }

    w.__mebookBack = handler
    return () => {
      if (w.__mebookBack === handler) delete w.__mebookBack
    }
  }, [])

  useEffect(() => {
    if (!mcOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      if (photoViewer || actionMenu || chatReactionPicker.open) return
      if (chatReplyTo) { setChatReplyTo(null); return }
      if (editingMsgId) { cancelEditMessage(); return }
      if (window.innerWidth > 820) closeChat()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  const handleSendMessage = async () => {
  const text = chatInput.trim()
  if (!text || !activeChat) return
  if (editingMsgId) {
    await handleSaveEditMessage(text)
    return
  }
  const reply = chatReplyTo

  // Message send করার সাথে সাথে typing OFF
  void updateTypingState(activeChat, false)

  if (typingTimeoutRef.current) {
    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = null
  }
    setChatInput("")
    setChatReplyTo(null)
    if (chatInputRef.current) {
      chatInputRef.current.style.height = "auto"
      chatInputRef.current.focus()
    }
    try {
      const fb = await getFirebase()
      const payload: any = {
        from: user.uid,
        text,
        at: fb.serverTimestamp(),
      }
      if (reply) {
        payload.replyTo = {
          id: reply.id,
          from: reply.from,
          name: reply.from === user.uid ? profile.name : (chatPartner?.name || ""),
          text: reply.text || "",
        }
      }
      await fb.addDoc(fb.collection(fb.db, "chats", activeChat, "messages"), payload)
      await fb.updateDoc(fb.doc(fb.db, "chats", activeChat), {
        lastMessage: { text, from: user.uid },
        lastAt: fb.serverTimestamp(),
      })
    } catch (e: any) {
      showToast("Error", e.message, "error")
    }
  }

  const handleSendLike = async () => {
    if (!activeChat) return
    try {
      const fb = await getFirebase()
      await fb.addDoc(fb.collection(fb.db, "chats", activeChat, "messages"), {
        from: user.uid,
        text: "",
        type: "like",
        at: fb.serverTimestamp(),
      })
      await fb.updateDoc(fb.doc(fb.db, "chats", activeChat), {
        lastMessage: { text: "👍", from: user.uid },
        lastAt: fb.serverTimestamp(),
      })
    } catch (e: any) {
      showToast("Error", e.message, "error")
    }
  }

  /* ============================================================
     CHAT MEDIA (Photos / Camera / Voice)
     ============================================================ */

  const handleChatImageUpload = async (file: File) => {
    if (!activeChat) return
    try {
      showToast("Uploading...", "Sending photo", "info")
      const url = await cloudinaryUpload(file)
      const fb = await getFirebase()
      await fb.addDoc(fb.collection(fb.db, "chats", activeChat, "messages"), {
        from: user.uid,
        text: "",
        type: "image",
        imageUrl: url,
        at: fb.serverTimestamp(),
      })
      await fb.updateDoc(fb.doc(fb.db, "chats", activeChat), {
        lastMessage: { text: "📷 Photo", from: user.uid },
        lastAt: fb.serverTimestamp(),
      })
      showToast("Sent!", "Photo sent", "success")
    } catch (e: any) {
      showToast("Failed", e.message, "error")
    }
  }

  const startVoiceRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showToast("Not supported", "Voice recording not supported", "error")
        return
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      recordChunksRef.current = []

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) recordChunksRef.current.push(e.data)
      }

      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
      }

      mr.start()
      recordStartRef.current = Date.now()
      setRecording(true)
      setRecordSeconds(0)
      recordTimerRef.current = setInterval(() => {
        setRecordSeconds(Math.floor((Date.now() - recordStartRef.current) / 1000))
      }, 200)
    } catch (e: any) {
      showToast("Permission denied", "Please allow microphone access", "error")
    }
  }

  const cancelVoiceRecording = () => {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current)
    recordTimerRef.current = null
    const mr = mediaRecorderRef.current
    if (mr && mr.state !== "inactive") {
      try { mr.stop() } catch {}
    }
    mediaRecorderRef.current = null
    recordChunksRef.current = []
    setRecording(false)
    setRecordSeconds(0)
  }

  const sendVoiceRecording = async () => {
    if (!activeChat) return
    if (recordTimerRef.current) clearInterval(recordTimerRef.current)
    recordTimerRef.current = null

    const mr = mediaRecorderRef.current
    const duration = Math.max(1, Math.floor((Date.now() - recordStartRef.current) / 1000))

    if (!mr) return
    const chunks = recordChunksRef.current

    const finished = new Promise<Blob>((resolve) => {
      mr.onstop = () => {
        try {
          mr.stream.getTracks().forEach((t) => t.stop())
        } catch {}
        resolve(new Blob(chunks, { type: "audio/webm" }))
      }
    })

    try { mr.stop() } catch {}

    const blob = await finished
    mediaRecorderRef.current = null
    recordChunksRef.current = []
    setRecording(false)
    setRecordSeconds(0)

    if (blob.size < 500) {
      showToast("Too short", "Please record a longer message", "error")
      return
    }

    try {
      showToast("Uploading voice...", "Please wait", "info")
      const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" })
      const url = await cloudinaryUpload(file, undefined, "video")
      const fb = await getFirebase()
      await fb.addDoc(fb.collection(fb.db, "chats", activeChat, "messages"), {
        from: user.uid,
        text: "",
        type: "voice",
        voiceUrl: url,
        duration,
        at: fb.serverTimestamp(),
      })
      await fb.updateDoc(fb.doc(fb.db, "chats", activeChat), {
        lastMessage: { text: "🎤 Voice message", from: user.uid },
        lastAt: fb.serverTimestamp(),
      })
      showToast("Sent!", "Voice message sent", "success")
    } catch (e: any) {
      showToast("Failed", e.message, "error")
    }
  }

  const openEditProfile = () => {
    setEditName(profile.name || "")
    setEditBio(profile.bio || "")
    setEditLoc(profile.location || "")
    setEditPhone(profile.phone || "")
    setEditBirthday(profile.birthday || "")
    setEditHandle(profile.handle || "")
    pushPage("edit-profile")
  }

  const handleSaveProfile = async () => {
    if (editBusy) return
    setEditBusy(true)
    try {
      const fb = await getFirebase()
      const updates = {
        name: editName.trim() || profile.name,
        bio: editBio.trim(),
        location: editLoc.trim(),
        phone: editPhone.trim(),
        birthday: editBirthday.trim(),
        handle: editHandle.trim(),
      }
      await fb.updateDoc(fb.doc(fb.db, "users", user.uid), updates)
      setProfile({ ...profile, ...updates })
      showToast("Profile updated!", "Your changes have been saved", "success")
      goBack()
    } catch (e: any) {
      showToast("Error", e.message, "error")
    } finally {
      setEditBusy(false)
    }
  }

  const applyProfileImage = async (kind: "cover" | "profile", url: string) => {
    const field = kind === "cover" ? "coverURL" : "photoURL"
    const fb = await getFirebase()
    await fb.updateDoc(fb.doc(fb.db, "users", user.uid), { [field]: url })
    setProfile((p: any) => ({ ...(p || {}), [field]: url }))
    if (kind === "cover") showToast("Cover photo updated!", "Your cover has been changed", "success")
    else showToast("Profile photo updated!", "Looking great", "success")
  }

  const pickAndUploadImage = (kind: "cover" | "profile") => {
    setPhotoSheet("")
    const inp = document.createElement("input")
    inp.type = "file"
    inp.accept = "image/*"
    inp.onchange = async () => {
      const f = inp.files?.[0]
      if (!f) return
      setPhotoBusy(true)
      showToast("Uploading...", "Please wait", "info")
      try {
        const url = await cloudinaryUpload(f)
        await applyProfileImage(kind, url)
      } catch (e: any) {
        showToast("Upload failed", e?.message || "Try again", "error")
      } finally {
        setPhotoBusy(false)
      }
    }
    inp.click()
  }

  const handleChangeProfilePhoto = () => pickAndUploadImage("profile")
  const handleChangeCover = () => pickAndUploadImage("cover")

  const handlePickOwnPhoto = async (kind: "cover" | "profile", url: string) => {
    setPhotoSheet("")
    try {
      await applyProfileImage(kind, url)
    } catch (e: any) {
      showToast("Error", e?.message || "Try again", "error")
    }
  }

  const handleSavePrivacy = async () => {
    try {
      const fb = await getFirebase()
      await fb.updateDoc(fb.doc(fb.db, "users", user.uid), { privacy })
      showToast("Privacy updated", "Your preferences have been saved", "success")
    } catch (e: any) {
      showToast("Error", e.message, "error")
    }
  }

  const buildShareUrl = (postId: string) =>
    `${location.origin}${location.pathname}#post-${postId}`

  const shareToProfile = async (post: any) => {
    if (!post || shareBusy) return
    setShareBusy(true)
    try {
      const fb = await getFirebase()
      const caption = shareCaption.trim()
      await fb.addDoc(fb.collection(fb.db, "posts"), {
        authorId: user.uid,
        authorName: profile.name,
        authorAvatar: profile.photoURL || "",
        verified: profile.verified === true,
        caption:
          (caption ? caption + "\n\n" : "") +
          `🔁 Shared from ${post.authorName || "MeBook"}${post.movie ? " · 🎬 " + post.movie : ""}`,
        movie: post.movie || "",
        image: post.image || "",
        originalPostId: post.id,
        originalAuthor: post.authorName || "",
        likes: [],
        reactions: {},
        comments: [],
        shares: 0,
        createdAt: fb.serverTimestamp(),
      })
      await fb.updateDoc(fb.doc(fb.db, "posts", post.id), {
        shares: fb.increment(1),
      })
      if (post.authorId && post.authorId !== "admin") {
        await fb.addDoc(fb.collection(fb.db, "notifications"), {
          postId: post.id,
          fromUid: user.uid,
          fromName: profile?.name || "",
          fromAvatar: profile?.photoURL || "",
          uid: post.authorId,
          title: "Post Shared",
          message: `${profile.name} shared your post on their profile.`,
          type: "share",
          read: false,
          createdAt: fb.serverTimestamp(),
        })
      }
      setShareCaption("")
      showToast("Shared!", "Post shared to your profile", "success")
      goTo("home")
    } catch (e: any) {
      console.error(e)
      showToast("Share failed", e.message, "error")
    } finally {
      setShareBusy(false)
    }
  }

  const shareToFacebook = (post: any) => {
    if (!post) return
    const url = encodeURIComponent(buildShareUrl(post.id))
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank", "width=640,height=480")
    showToast("Opening Facebook", "Complete sharing there", "info")
  }

  const shareToWhatsApp = (post: any) => {
    if (!post) return
    const url = encodeURIComponent(buildShareUrl(post.id))
    const text = encodeURIComponent(`${post.authorName} on MeBook: ${post.movie || "Movie"}`)
    window.open(`https://wa.me/?text=${text}%20${url}`, "_blank")
    showToast("Opening WhatsApp", "Complete sharing there", "info")
  }

  const shareToTelegram = (post: any) => {
    if (!post) return
    const url = encodeURIComponent(buildShareUrl(post.id))
    window.open(`https://t.me/share/url?url=${url}`, "_blank")
    showToast("Opening Telegram", "Complete sharing there", "info")
  }

  const copyLink = async (post: any) => {
    if (!post) return
    const url = buildShareUrl(post.id)
    try {
      await navigator.clipboard.writeText(url)
      showToast("Link copied!", "You can now paste it anywhere", "success")
    } catch {
      showToast("Could not copy", "Please try again", "error")
    }
  }

  if (!ready) return null

  // ============================================================
  // SPLASH SCREEN — show first, then auto-hide
  // ============================================================
  if (showSplash) {
    return (
      <div className="mebook-root dark-mode" ref={rootRef}>
        <MeBookSplash />
      </div>
    )
  }

  const avatarUrl = (u: any) =>
    u?.photoURL ||
    `https://ui-avatars.com/api/?background=16a34a&color=fff&name=${encodeURIComponent(u?.name || "User")}`

  // Unfollow / Take a break করা friend দের post feed এ লুকানো থাকবে
  const hiddenAuthors = new Set<string>([
    ...(Array.isArray(profile?.unfollowed) ? profile.unfollowed : []),
    ...Object.entries(profile?.breaks || {})
      .filter(([, t]: any) => Number(t) > Date.now())
      .map(([k]) => k),
  ])

  const isVerified = (obj: any) => obj?.verified === true || obj?.isOfficial === true

  // Live verified lookup by uid (so old comments/chats also show the badge)
  const isVerifiedUid = (uid: any, obj: any) => {
    if (obj && (obj.verified === true || obj.isOfficial === true)) return true
    if (!uid) return false
    if (user && uid === user.uid) return isVerified(profile)
    return isVerified(allUsers.find((u: any) => u.uid === uid))
  }

  /* ============================================================
  AUTH SCREEN
  ============================================================ */
  if (!user) {
    return (
      <div className="mebook-root dark-mode" ref={rootRef}>
        <div className="auth-wrap">
          <div className="auth-card">
            <div className="auth-logo">
              <img src={HEADER_LOGO} alt="MeBook" />
              <div className="mb-logo-stack">
                <div className="mb-logo-text">
                  <span className="me">Me</span>
                  <span className="book">Book</span>
                </div>
                <span className="mb-beta-badge">
                  <span className="mb-beta-dot" />
                  BETA
                </span>
              </div>
            </div>
            <p className="auth-sub">Movie lovers' social network 🎬</p>

            <div className="auth-tabs">
              <button
                type="button"
                className={`auth-tab ${authMode === "signin" ? "active" : ""}`}
                onClick={() => {
                  setAuthMode("signin")
                  setAuthErr({ si: "", su: "" })
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`auth-tab ${authMode === "signup" ? "active" : ""}`}
                onClick={() => {
                  setAuthMode("signup")
                  setAuthErr({ si: "", su: "" })
                }}
              >
                Sign Up
              </button>
            </div>

            {authMode === "signin" ? (
              <form onSubmit={handleSignIn}>
                <div className="auth-field">
                  <label>Email</label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={siEmail}
                    onChange={(e) => setSiEmail(e.target.value)}
                  />
                </div>
                <div className="auth-field">
                  <label>Password</label>
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    minLength={6}
                    value={siPass}
                    onChange={(e) => setSiPass(e.target.value)}
                  />
                </div>
                <button type="submit" className="auth-btn" disabled={authBusy}>
                  {authBusy ? "Signing in..." : "Sign In"}
                </button>
                {authErr.si && <div className="auth-err show">{authErr.si}</div>}
              </form>
            ) : (
              <form onSubmit={handleSignUp}>
                <div className="auth-field">
                  <label>Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Your name"
                    minLength={2}
                    value={suName}
                    onChange={(e) => setSuName(e.target.value)}
                  />
                </div>
                <div className="auth-field">
                  <label>Email</label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={suEmail}
                    onChange={(e) => setSuEmail(e.target.value)}
                  />
                </div>
                <div className="auth-field">
                  <label>Password (min 6 chars)</label>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                    minLength={6}
                    value={suPass}
                    onChange={(e) => setSuPass(e.target.value)}
                  />
                </div>
                <button type="submit" className="auth-btn" disabled={authBusy}>
                  {authBusy ? "Creating..." : "Create Account"}
                </button>
                {authErr.su && <div className="auth-err show">{authErr.su}</div>}
              </form>
            )}

            <div className="auth-divider">OR</div>

            <button
              type="button"
              className="auth-google"
              onClick={handleGoogleSignIn}
              disabled={authBusy}
            >
              <svg viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z" />
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2C41 35.4 44 30.1 44 24c0-1.2-.1-2.4-.4-3.5z" />
              </svg>
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ============================================================
  RENDER POST
  ============================================================ */
  const renderSharedEmbed = (sp: any) => {
    const av =
      sp.authorAvatar ||
      `https://ui-avatars.com/api/?background=16a34a&color=fff&name=${encodeURIComponent(sp.authorName || "User")}`
    const goAuthor = () => {
      if (sp.authorId && sp.authorId !== "admin") openUserProfile(sp.authorId)
    }
    return (
      <div className="rx-embed">
        <div className="rx-embed-head">
          <img src={av} alt="" onClick={goAuthor} />
          <div>
            <div className="rx-embed-name" onClick={goAuthor}>
              {sp.authorName || "User"}
              {sp.verified === true && mcVerifiedBadge(14)}
            </div>
            <div className="mb-post-meta">
              {timeAgo(sp.createdMs)}
              {" · "}
              <svg className="globe" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              </svg>
            </div>
          </div>
        </div>
        {sp.caption && <PostCaption text={sp.caption} />}
        {sp.type === "youtube" && sp.youtube?.videoId ? (
          <YouTubePost
            videoId={sp.youtube.videoId}
            isShort={sp.youtube.isShort === true}
            thumb={sp.image}
            url={sp.youtube.url}
          />
        ) : sp.image ? (
          <div className="mb-post-media">
            <img
              src={sp.image}
              alt="post"
              loading="lazy"
              onClick={() =>
                setPhotoViewer({
                  src: sp.image,
                  caption: sp.caption || "",
                  name: sp.authorName || "User",
                  avatar: av,
                  time: fbPhotoTime(sp.createdMs),
                })
              }
            />
          </div>
        ) : null}
      </div>
    )
  }

  const renderPost = (post: any, isMine = false) => {
    if (!canSeePost(post, isMine)) return null
    const postReacts = post.reactions || postReactions[post.id] || {}
    const myReaction = postReacts[user.uid]
    const reactionEntries = Object.entries(postReacts)
    const reactionCounts: Record<string, number> = {}
    reactionEntries.forEach(([, k]) => {
      reactionCounts[k as string] = (reactionCounts[k as string] || 0) + 1
    })
    const sortedReactionKeys = Object.keys(reactionCounts).sort((a, b) => reactionCounts[b] - reactionCounts[a])
    const topReactionKeys = sortedReactionKeys.length ? sortedReactionKeys.slice(0, 3) : ["like"]
    const totalLikes = reactionEntries.length

    const liked = Array.isArray(post.likes) && post.likes.includes(user?.uid)
    const likesCount = totalLikes || (Array.isArray(post.likes) ? post.likes.length : 0)
    const commentsCount = Array.isArray(post.comments) ? post.comments.length : 0
    const sharesCount = post.shares || 0
    const isOfficial = post.isOfficial === true
    const authorAvatar = isOfficial
      ? LOGO_URL
      : (post.authorAvatar ||
         `https://ui-avatars.com/api/?background=16a34a&color=fff&name=${encodeURIComponent(post.authorName || "User")}`)
    const timeText = post.timeText || timeAgo(post.createdAt)
    const postVerified = isVerified(post)

    const myReactionEmoji = myReaction
      ? REACTIONS.find((r) => r.key === myReaction)?.emoji
      : null
    const canManage = isMine || (!!user && !!post.authorId && post.authorId === user.uid)

    const myReactionColor = myReaction
      ? REACTIONS.find((r) => r.key === myReaction)?.color
      : undefined

    return (
      <article className={`mb-post${isOfficial ? " official" : ""}`} key={post.id}>
        <div className="mb-post-head">
          <img
            className="mb-post-head-avatar"
            src={authorAvatar}
            alt={post.authorName}
            onClick={() => openUserProfile(post.authorId)}
          />
          <div className="mb-post-head-info">
            <div className="mb-post-author" onClick={() => openUserProfile(post.authorId)}>
              {post.authorName || "User"}
              {postVerified && (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#22c55e" style={{ flexShrink: 0 }}>
                  <path d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69l-3.61.82.34 3.69L1 12l2.44 2.79-.34 3.7 3.61.82L8.6 22.5l3.4-1.47 3.4 1.46 1.89-3.19 3.61-.82-.34-3.69L23 12zm-12.91 4.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z" />
                </svg>
              )}
            </div>
            {(post.feeling || post.location || (Array.isArray(post.taggedNames) && post.taggedNames.length > 0)) && (
              <div className="mb-post-meta" style={{ marginBottom: 1 }}>
                {[
                  post.feeling ? "feeling " + post.feeling : "",
                  Array.isArray(post.taggedNames) && post.taggedNames.length ? "with " + post.taggedNames.join(", ") : "",
                  post.location ? "at " + post.location : "",
                ].filter(Boolean).join(" · ")}
              </div>
            )}
            <div className="mb-post-meta">
              {timeText}
              {post.edited && <span className="mb-edited-tag">{" · Edited"}</span>}
              {isOfficial && (
                <>
                  {" · "}
                  <span style={{ color: "#22c55e", fontWeight: 700, fontSize: 11.5 }}>OFFICIAL</span>
                </>
              )}
              {" · "}
              <svg className="globe" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              </svg>
            </div>
          </div>
          {canManage && (
            <button
              className="mb-post-more"
              onClick={() => setActionMenu({ kind: "post", id: post.id })}
              title="More options"
            >
              {ICON_DOTS}
            </button>
          )}
        </div>

        {post.pinned && <div className="rx-post-tag">📌 Pinned post</div>}
        {post.archived && isMine && <div className="rx-post-tag">🗄 Archived · only you can see this</div>}
        {post.caption && <PostCaption text={post.caption} />}
        {post.music && post.music.url && (
          <div className="mb-post-music">
            <PostMusicChip music={post.music} />
          </div>
        )}
        {post.sharedPost && renderSharedEmbed(post.sharedPost)}
        {post.productLink && (
          <a className="rx-product" href={post.productLink} target="_blank" rel="noopener noreferrer nofollow">
            <svg viewBox="0 0 24 24">
              <path d={PM_IC.link} />
            </svg>
            View product
          </a>
        )}

        {post.type === "youtube" && post.youtube?.videoId ? (
          <YouTubePost
            videoId={post.youtube.videoId}
            isShort={post.youtube.isShort === true}
            thumb={post.image}
            url={post.youtube.url}
          />
        ) : post.image ? (
          <div className="mb-post-media">
            <span className="mb-movie-badge">
              <svg viewBox="0 0 24 24">
                <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
              </svg>
              {post.movie || "Movie"}
            </span>
            <img
              src={post.image}
              alt="post"
              loading="lazy"
              onClick={() =>
                setPhotoViewer({
                  src: post.image,
                  caption: post.caption || "",
                  name: post.authorName || "User",
                  avatar: authorAvatar,
                  time: post.timeText || fbPhotoTime(post.createdAt),
                  postId: post.id,
                  stats: {
                    likes: likesCount,
                    comments: commentsCount,
                    shares: sharesCount,
                    reactionKeys: sortedReactionKeys.length ? sortedReactionKeys : [],
                  },
                })
              }
            />
          </div>
        ) : post.movie ? (
          <div style={{ padding: "0 16px 8px" }}>
            <span className="mb-movie-badge" style={{ position: "static" }}>
              <svg viewBox="0 0 24 24">
                <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
              </svg>
              {post.movie}
            </span>
          </div>
        ) : null}

        <div className="mb-post-stats">
          <div
            className="mb-reacts"
            onClick={() => likesCount > 0 && setEngageSheet({ postId: post.id, mode: "reactions", tab: "all" })}
          >
            {likesCount ? (
              <span className="mb-react-pill">
                <span className="rx-stack">
                  {topReactionKeys.map((k, i) => (
                    <span key={k} className="rx-stack-item" style={{ marginLeft: i ? -5 : 0, zIndex: 5 - i }}>
                      <ReactionIcon k={k} size={18} ring />
                    </span>
                  ))}
                </span>
                <span>{likesCount}</span>
              </span>
            ) : (
              <span style={{ fontSize: 13 }}>0 likes</span>
            )}
          </div>
          <div>
            <span
              className="rx-count-link"
              onClick={() =>
                setEngageSheet({ postId: post.id, mode: "comments", tab: "all" })
              }
            >
              {commentsCount} comments
            </span>
            {" · "}
            {sharesCount} shares
          </div>
        </div>

        <div className="mb-post-actions">
          <button
            className={`mb-action rx-like-btn${liked || myReaction ? " liked" : ""}`}
            data-like-btn={post.id}
            style={myReaction ? { color: myReactionColor } : undefined}
            {...(likeBtnProps(post.id) as any)}
            title="Tap to like, hold for reactions"
          >
            <span
              key={myReaction || "none"}
              className={`rx-btn-ico${rxLand.postId === post.id ? " rx-land" : ""}`}
            >
              {myReaction ? (
                <ReactionIcon k={myReaction} size={22} />
              ) : (
                <svg viewBox="0 0 24 24">
                  <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91z" />
                </svg>
              )}
            </span>
            {myReaction
              ? (REACTIONS.find((r) => r.key === myReaction)?.label || "Like")
              : "Like"}
          </button>
          <button className="mb-action" onClick={() => setEngageSheet({ postId: post.id, mode: "comments", tab: "all" })}>
            <svg viewBox="0 0 24 24">
              <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z" />
            </svg>
            Comment
          </button>
          <button className="mb-action" onClick={() => setShareSheetPostId(post.id)}>
            <svg viewBox="0 0 24 24">
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
            </svg>
            Share
          </button>
        </div>
      </article>
    )
  }

  const unreadCount = chats.filter((c: any) => {
    const pr: any = chatPrefs
    if (pr.archived[c.id] || pr.ignored[c.id] || pr.muted[c.id]) return false
    const del = pr.deleted[c.id]
    if (del && (c.lastAt && c.lastAt.seconds ? c.lastAt.seconds : 0) <= del) return false
    return !!pr.unread[c.id] || !!(c.last && c.last.read === false && c.last.from !== user.uid)
  }).length

  const filteredFriends = friends.filter((f) => {
    const q = friendSearch.trim().toLowerCase()
    if (!q) return true
    return (
      (f.name || "").toLowerCase().includes(q) ||
      (f.email || "").toLowerCase().includes(q)
    )
  })

  const mcPrefs: any = chatPrefs
  const mcIsDeleted = (c: any) => {
    const d = mcPrefs.deleted[c.id]
    return !!d && (c.lastAt && c.lastAt.seconds ? c.lastAt.seconds : 0) <= d
  }
  const mcBase = chats.filter((c: any) => !mcIsDeleted(c))
  const mcArchivedList = mcBase.filter((c: any) => mcPrefs.archived[c.id])
  const mcIgnoredList = mcBase.filter((c: any) => mcPrefs.ignored[c.id] && !mcPrefs.archived[c.id])
  const mcMainList = mcBase.filter((c: any) => !mcPrefs.archived[c.id] && !mcPrefs.ignored[c.id])
  const mcModeList = chatListMode === "archived" ? mcArchivedList : chatListMode === "ignored" ? mcIgnoredList : mcMainList
  const filteredChats = mcModeList
    .filter((c: any) => {
      const q = chatSearch.trim().toLowerCase()
      if (!q) return true
      return ((c.other && c.other.name) || "").toLowerCase().includes(q)
    })
    .slice()
    .sort((a: any, b: any) => (mcPrefs.pinned[b.id] || 0) - (mcPrefs.pinned[a.id] || 0))

  const searchedUsersForChat = chatSearch.trim()
    ? allUsers
        .filter((u) => (u.name || "").toLowerCase().includes(chatSearch.trim().toLowerCase()))
        .slice(0, 6)
    : []

  const fbFull = ["profile", "user-profile", "fb-profile-menu", "fb-own-menu", "fb-view-as", "fb-activity"].includes(currentView)
  const rootClass = `mebook-root ${theme === "dark" ? "dark-mode" : ""}${fbFull ? " fbp-full" : ""}${currentView === "messages" ? " mc-open" : ""}${currentView === "search" ? " sr-open" : ""}`

  const findPost = (postId: string) =>
    feed.find((p) => p.id === postId) ||
    myPosts.find((p) => p.id === postId) ||
    viewingUserPosts.find((p) => p.id === postId) ||
    extraPosts.find((p) => p.id === postId)

  /* ============================================================
  renderProfilePage
  ============================================================ */
  /* ===== MeChat list extras: long-press + rows + overlays ===== */
  const mcPress = (c: any) => ({
    onTouchStart: (e: any) => {
      lpFiredRef.current = false
      const t = e.touches[0]
      lpStartRef.current = { x: t.clientX, y: t.clientY }
      clearTimeout(lpTimerRef.current)
      lpTimerRef.current = setTimeout(() => {
        lpFiredRef.current = true
        try { if (navigator.vibrate) navigator.vibrate(18) } catch (er) {}
        setChatMenu(c)
      }, 450)
    },
    onTouchMove: (e: any) => {
      const t = e.touches[0]
      if (Math.abs(t.clientX - lpStartRef.current.x) > 10 || Math.abs(t.clientY - lpStartRef.current.y) > 10) {
        clearTimeout(lpTimerRef.current)
      }
    },
    onTouchEnd: () => clearTimeout(lpTimerRef.current),
    onTouchCancel: () => clearTimeout(lpTimerRef.current),
    onContextMenu: (e: any) => {
      e.preventDefault()
      clearTimeout(lpTimerRef.current)
      setChatMenu(c)
    },
    onClick: () => {
      if (lpFiredRef.current) { lpFiredRef.current = false; return }
      openChat(c.id, c.otherId, c.other)
    },
  })

  const mcRenderChatRow = (c: any) => {
    const photo = avatarUrl(c.other)
    const pr: any = chatPrefs
    const lastObj: any = c.last
    const unread = !!pr.unread[c.id] || (!!lastObj && lastObj.read === false && lastObj.from !== user.uid)
    const flags: any[] = []
    if (pr.pinned[c.id]) flags.push(React.createElement("span", { key: "p", className: "mc-flag" }, mcIcon(MC_IC.pin, 14)))
    if (pr.muted[c.id]) flags.push(React.createElement("span", { key: "m", className: "mc-flag" }, mcIcon(MC_IC.bellOff, 14)))
    if (unread) flags.push(React.createElement("span", { key: "u", className: "mc-unread-dot" }))
    return React.createElement("div", Object.assign({
      key: c.id,
      className: "msgr-item mc-pressable" + (c.id === activeChat ? " active" : ""),
    }, mcPress(c)),
      React.createElement("div", { className: "msgr-item-avatar-wrap" },
        React.createElement("img", { src: photo, alt: "", draggable: false }),
        c.isGroup ? null : React.createElement("span", { className: "msgr-item-dot" })),
      React.createElement("div", { className: "msgr-item-body" },
        React.createElement("div", { className: "msgr-item-name mc-has-badge" + (unread ? " mc-unread" : "") },
          React.createElement("span", { className: "mc-name-text" }, c.other.name),
          !c.isGroup && isVerifiedUid(c.otherId, c.other) ? mcVerifiedBadge(14) : null),
        React.createElement("div", { className: "msgr-item-last" + (unread ? " unread" : "") }, (lastObj && lastObj.text) || "Say hi 👋")),
      React.createElement("div", { className: "mc-item-meta" },
        React.createElement("div", { className: "msgr-item-time" }, c.lastAt ? timeShort(c.lastAt) : ""),
        React.createElement("div", { className: "mc-item-flags" }, flags)))
  }

  const mcFolderRow = (mode: any, label: any, count: any, icon: any) =>
    React.createElement("div", { key: mode, className: "mc-folder-row", onClick: () => setChatListMode(mode) },
      mcIcon(icon, 22), React.createElement("span", null, label), React.createElement("b", null, count))

  const mcFolderRows = chatListMode === "main"
    ? React.createElement(React.Fragment, null,
        mcArchivedList.length > 0 ? mcFolderRow("archived", "Archived chats", mcArchivedList.length, MC_IC.archive) : null,
        mcIgnoredList.length > 0 ? mcFolderRow("ignored", "Ignored chats", mcIgnoredList.length, MC_IC.ignore) : null)
    : React.createElement("div", { className: "mc-folder-row", onClick: () => setChatListMode("main") },
        mcIcon(MC_IC.back, 22),
        React.createElement("span", null, chatListMode === "archived" ? "Archived chats" : "Ignored chats"),
        React.createElement("b", null, "Back"))
  const recentTitle = chatListMode === "main" ? "Recent" : (chatListMode === "archived" ? "Archived" : "Ignored")

  const mcBackBtn = (extra: any) =>
    React.createElement("button", { className: "mc-back-glass " + extra, onClick: () => goTo("home"), title: "Back to MeBook" },
      mcIcon(MC_IC.back, 20), React.createElement("span", null, "Back to MeBook"))

  const mcOverlays = React.createElement(React.Fragment, null,
    chatMenu ? React.createElement(McChatSheet, {
      chat: chatMenu, prefs: chatPrefs, avatar: avatarUrl(chatMenu.other),
      verified: !chatMenu.isGroup && isVerifiedUid(chatMenu.otherId, chatMenu.other),
      onClose: () => setChatMenu(null), onAction: (k: any) => chatAction(k, chatMenu),
    }) : null,
    chatConfirm ? React.createElement(McConfirm, {
      title: chatConfirm.kind === "delete" ? "Delete chat?" : "Leave group?",
      text: chatConfirm.kind === "delete"
        ? "This chat will be removed from your list. It comes back only if someone sends a new message."
        : "You will no longer get messages from " + chatConfirm.chat.other.name + ".",
      label: chatConfirm.kind === "delete" ? "Delete" : "Leave",
      onNo: () => setChatConfirm(null), onYes: runChatConfirm,
    }) : null,
    addMembersFor ? React.createElement(McAddMembers, {
      chat: addMembersFor, users: allUsers, me: user.uid, avatarOf: avatarUrl,
      isVer: (u: any) => isVerifiedUid(u.uid, u),
      onClose: () => setAddMembersFor(null),
      onConfirm: (ids: any) => confirmAddMembers(addMembersFor, ids),
    }) : null,
    chatHeads
      .filter((h: any) => !(currentView === "messages" && activeChat === h.id))
      .map((h: any, i: any) => React.createElement(McChatHead, {
        key: h.id, head: h, index: i, avatar: avatarUrl(h.other),
        onOpen: (hh: any) => {
          goTo("messages")
          setTimeout(() => openChat(hh.id, hh.otherId, hh.other), 80)
        },
        onClose: (hh: any) => setChatHeads((hs: any) => hs.filter((x: any) => x.id !== hh.id)),
      })))

  const renderChatListPanel = (inShell: boolean) => (
    <>
                  <div className="mb-search-box">
                    <svg viewBox="0 0 24 24">
                      <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search people or chats"
                      value={chatSearch}
                      onChange={(e) => setChatSearch(e.target.value)}
                    />
                  </div>

                  {searchedUsersForChat.length > 0 && (
                    <div className="msgr-wrap" style={{ height: "auto", marginBottom: 16 }}>
                      <div style={{ padding: "14px 16px 8px", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                        People
                      </div>
                      {searchedUsersForChat.map((u) => {
                        const photo = avatarUrl(u)
                        return (
                          <div className="msgr-item" key={u.uid} onClick={() => startChat(u.uid, u.name, photo)}>
                            <div className="msgr-item-avatar-wrap">
                              <img src={photo} alt="" />
                              <span className="msgr-item-dot" />
                            </div>
                            <div className="msgr-item-body">
                              <div className="msgr-item-name">{u.name}{isVerifiedUid(u.uid, u) && mcVerifiedBadge(14)}</div>
                              <div className="msgr-item-last">Tap to start chatting</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <div className={inShell ? "mc-list" : "msgr-wrap mc-plain"}>
                    <div className="msgr-list" style={{ width: "100%", borderRight: "none" }}>
                      {onlineList.length > 0 && (
                        <>
                          <div className="msgr-section">Online now</div>
                          <div className="msgr-online-row">
                            {onlineList.map((u) => {
                              const photo = avatarUrl(u)
                              return (
                                <div key={u.uid} className="msgr-online-item" onClick={() => startChat(u.uid, u.name, photo)}>
                                  <div className="msgr-online-avatar-wrap">
                                    <img src={photo} alt="" />
                                    <span className="msgr-online-dot" />
                                  </div>
                                  <div className="msgr-online-name">{u.name?.split(" ")[0]}</div>
                                </div>
                              )
                            })}
                          </div>
                        </>
                      )}
                      {mcFolderRows}
                      <div className="msgr-section">{recentTitle}</div>
                      {filteredChats.length === 0 ? (
                        <div style={{ padding: 20, color: "var(--text-muted)", fontSize: 14, textAlign: "center" }}>
                          No conversations yet. Start one!
                        </div>
                      ) : (
                        filteredChats.map((c: any) => mcRenderChatRow(c))
                      )}
                    </div>
                  </div>
    </>
  )

  const renderProfilePage = (
    u: any,
    posts: any[],
    isOwn: boolean,
    friendsList?: any[],
    friendsLoading?: boolean
  ) => {
    const photo = avatarUrl(u)
    const profileFriends = isOwn ? myFriends : (friendsList || [])
    const friendsCount = profileFriends.length
    const mutualCount = friendsCount

    const stripFriends = profileFriends.slice(0, 6)
    const previewFriends = profileFriends.slice(0, 5)
    const showViewAll = friendsCount > 5

    return (
      <div className="mb-profile-head">
        <div
          className="mb-profile-cover"
          onClick={isOwn ? handleChangeCover : undefined}
        >
          <img
            src={
              u.coverURL ||
              "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&q=80"
            }
            alt="Cover"
          />
          {isOwn && (
            <div className="mb-profile-cover-add">
              <svg viewBox="0 0 24 24">
                <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
              </svg>
              Change Cover
            </div>
          )}
        </div>

        <div className="mb-profile-avatar-center">
          <div
            className="mb-profile-avatar-wrap"
            onClick={isOwn ? handleChangeProfilePhoto : undefined}
          >
            <img src={photo} alt="Profile" />
            {isOwn && (
              <div className="mb-profile-avatar-add">
                <svg viewBox="0 0 24 24">
                  <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        <div className="mb-profile-name-center">
          <div className="mb-profile-name">
            {u.name}
            {isVerified(u) && (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#22c55e">
                <path d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69l-3.61.82.34 3.69L1 12l2.44 2.79-.34 3.7 3.61.82L8.6 22.5l3.4-1.47 3.4 1.46 1.89-3.19 3.61-.82-.34-3.69L23 12zm-12.91 4.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z" />
              </svg>
            )}
          </div>

          <div className="mb-profile-sub">
            <b>{friendsCount}</b> friends
            {mutualCount > 0 && <> · <b>{mutualCount}</b> mutual</>}
            {" · "}<b>{posts.length}</b> posts
          </div>
        </div>

        {(u.location || u.handle) && (
          <div className="mb-profile-meta-row">
            {u.location && (
              <span>
                <svg viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                {u.location}
              </span>
            )}
            {u.handle && (
              <span>
                <svg viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
                {u.handle}
              </span>
            )}
          </div>
        )}

        {stripFriends.length > 0 && (
          <div className="mb-profile-friends-strip">
            <div className="mb-profile-friends-avatars">
              {stripFriends.map((f) => (
                <img key={f.uid} src={avatarUrl(f)} alt={f.name} />
              ))}
            </div>
            <div className="mb-profile-friends-text">
              Friends with <b>{stripFriends.slice(0, 3).map((f) => f.name).join(", ")}</b>
              {stripFriends.length > 3 && <> and {stripFriends.length - 3} others</>}
            </div>
          </div>
        )}

        <div className="mb-profile-actions">
          {isOwn ? (
            <>
              <button className="mb-btn mb-btn-primary" onClick={openCreatePost}>
                <svg viewBox="0 0 24 24">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
                Create Post
              </button>
              <button className="mb-btn mb-btn-secondary" onClick={openEditProfile}>
                <svg viewBox="0 0 24 24">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                </svg>
                Edit Profile
              </button>
            </>
          ) : (
            <>
              {myFriends.some((f) => f.uid === u.uid) ? (
                <button className="mb-btn mb-btn-secondary" disabled>
                  <svg viewBox="0 0 24 24">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                  </svg>
                  Friends
                </button>
              ) : sentRequests[u.uid] === "sending" ? (
                <button className="mb-btn mb-friend-btn sending" disabled>
                  Sending...
                </button>
              ) : sentFriendRequests.some(
                  (r) => r.to === u.uid && r.status === "pending"
                ) ? (
                <button
                  className="mb-btn mb-btn-secondary"
                  onClick={() => handleCancelRequest(u.uid)}
                >
                  Cancel Request
                </button>
              ) : (
                <button
                  className="mb-btn mb-btn-primary"
                  onClick={() => handleSendRequest(u.uid)}
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                  Add Friend
                </button>
              )}
              <button
                className="mb-btn mb-profile-btn-message"
                onClick={() => startChat(u.uid, u.name, photo)}
              >
                <svg viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                </svg>
                Message
              </button>
              <button className="mb-btn mb-btn-secondary mb-profile-btn-icon" title="More">
                <svg viewBox="0 0 24 24">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </button>
            </>
          )}
        </div>

        {!isOwn && (
          <div className="mb-profile-things-common">
            <div className="mb-profile-things-common-title">
              <svg viewBox="0 0 24 24">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
              Things in common
            </div>
            <div className="mb-profile-things-common-body">
              You share a birthday.
            </div>
          </div>
        )}

        <div className="mb-profile-tabs">
          <button
            className={`mb-profile-tab${profileTab === "all" ? " active" : ""}`}
            onClick={() => setProfileTab("all")}
          >
            All
          </button>
          <button
            className={`mb-profile-tab${profileTab === "photos" ? " active" : ""}`}
            onClick={() => setProfileTab("photos")}
          >
            Photos
          </button>
          <button
            className={`mb-profile-tab${profileTab === "reels" ? " active" : ""}`}
            onClick={() => setProfileTab("reels")}
          >
            Reels
          </button>
        </div>

        <div className="mb-profile-friends-section">
          <div className="mb-profile-friends-section-head">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
              Friends
            </h3>
            {friendsCount > 0 && (
              <span
                className="count-link"
                onClick={() => openFriendsList(u.uid, u.name)}
              >
                See all
              </span>
            )}
          </div>

          {friendsLoading ? (
            <div className="mb-profile-friends-empty">Loading friends...</div>
          ) : profileFriends.length === 0 ? (
            <div className="mb-profile-friends-empty">
              {isOwn ? "You don't have any friends yet" : "No friends to show"}
            </div>
          ) : (
            <div className="mb-profile-friends-preview">
              {previewFriends.map((f) => (
                <div
                  className="mb-profile-friend-preview-card"
                  key={f.uid}
                  onClick={() => openUserProfile(f.uid)}
                >
                  <img src={avatarUrl(f)} alt={f.name} />
                  <div className="mb-profile-friend-preview-name">{f.name?.split(" ")[0]}</div>
                </div>
              ))}

              {showViewAll && (
                <div
                  className="mb-profile-friend-preview-card"
                  onClick={() => openFriendsList(u.uid, u.name)}
                >
                  <div className="view-all-avatar">
                    <svg viewBox="0 0 24 24">
                      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                    </svg>
                  </div>
                  <div className="mb-profile-friend-preview-name">View all</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  /* ============================================================
  FACEBOOK-STYLE PROFILE (other users)
  ============================================================ */
  const fbPostStats = (p: any) => {
    const r = p.reactions || postReactions[p.id] || {}
    const vals = Object.values(r) as string[]
    const counts: Record<string, number> = {}
    vals.forEach((k) => { counts[k] = (counts[k] || 0) + 1 })
    const keys = Object.keys(counts).sort((a, b) => counts[b] - counts[a])
    return {
      likes: vals.length || (Array.isArray(p.likes) ? p.likes.length : 0),
      comments: Array.isArray(p.comments) ? p.comments.length : 0,
      shares: p.shares || 0,
      reactionKeys: keys,
    }
  }

  const fbSaveField = async (patch: any, title: string, msg: string) => {
    try {
      const fb = await getFirebase()
      await fb.updateDoc(fb.doc(fb.db, "users", user.uid), patch)
      showToast(title, msg, "success")
    } catch (e: any) {
      showToast("Error", e.message, "error")
    }
  }

  const FB_ACTION_LABELS: Record<string, string> = {
    message: "Message me",
    follow: "Follow me",
    contact: "Contact me",
    shop: "Shop now",
  }

  const renderFbProfileCore = (
    mode: "other" | "own" | "preview",
    u: any,
    postsIn: any[],
    theirFriends: any[],
    friendsLoading: boolean
  ) => {
    const isOwnMode = mode === "own"
    const isPreview = mode === "preview"
    const photo = avatarUrl(u)
    const isFriend = myFriends.some((f) => f.uid === u.uid)
    const friendObj = myFriends.find((f) => f.uid === u.uid)
    const pending = sentFriendRequests.some((r) => r.to === u.uid && r.status === "pending")
    const sending = sentRequests[u.uid] === "sending"
    const visiblePosts = postsIn.filter((p: any) => canSeePost(p, isOwnMode))
    const photoPosts = visiblePosts.filter((p: any) => p.image && !p.youtube)
    const reelPosts = visiblePosts.filter((p: any) => p.youtube?.isShort === true)
    const showInfo = isOwnMode || isPreview ? true : u.privacy?.info !== false
    const highlights: string[] = Array.isArray(u.highlights) ? u.highlights : []
    const proOn = u.proMode !== false

    const viewer = (src: string, extra: any = {}) =>
      setPhotoViewer({
        src,
        caption: "",
        name: u.name || "User",
        avatar: photo,
        time: "",
        stats: { likes: 0, comments: 0, shares: 0, reactionKeys: [] },
        ...extra,
      })

    const openPostPhoto = (p: any) =>
      viewer(p.image, {
        caption: p.caption || "",
        name: p.authorName || u.name || "User",
        time: p.timeText || fbPhotoTime(p.createdAt),
        postId: p.id,
        stats: fbPostStats(p),
      })
    const openProfilePic = () => viewer(u.photoURL || photo)
    const openCoverPic = () => { if (u.coverURL) viewer(u.coverURL) }

    let bday = ""
    if (u.birthday) {
      const d = new Date(u.birthday)
      bday = isNaN(d.getTime())
        ? String(u.birthday)
        : d.toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" })
    }

    const Grid = ({ items }: { items: { src: string; onClick: () => void }[] }) =>
      items.length === 0 ? (
        <div className="fbp-empty">No photos to show</div>
      ) : (
        <div className="fbp-grid">
          {items.map((it, i) => (
            <div key={i} className={`fbp-gi${i % 9 === 0 ? " big" : ""}`} onClick={it.onClick}>
              <img src={it.src} alt="" loading="lazy" />
            </div>
          ))}
        </div>
      )

    const noop = () => {}
    const tabs: ("all" | "reels" | "photos" | "events")[] = isOwnMode ? ["all", "reels", "photos", "events"] : ["all", "reels", "photos"]
    const postList = (list: any[]) => list.map((p: any) => renderPost(p, isOwnMode))

    return (
      <div className="mb-view active">
        {isPreview && (
          <div className="fbp-viewas">
            <span>Viewing your profile as the public</span>
            <button onClick={goBack}>Exit</button>
          </div>
        )}
        <div className="fbp fbp-prof">
            <div className={`fbp-top${fbpScrolled ? " solid" : ""}`} onClick={(e) => e.stopPropagation()}>
              <button className="fbp-top-btn" onClick={goBack} aria-label="Back">
                <FbIco d={FBP_ICON.back} size={26} />
              </button>
              <div className="fbp-top-title">{u.name}</div>
              <div className="fbp-top-right">
                {isOwnMode && (
                  <button className="fbp-top-btn" onClick={() => setDrawerOpen(true)} aria-label="Menu">
                    <FbIco d={FBP_ICON.menu} size={26} />
                  </button>
                )}
                {isOwnMode && (
                  <button className="fbp-top-btn" onClick={openEditProfile} aria-label="Edit">
                    <FbIco d={FBP_ICON.edit} size={24} />
                  </button>
                )}
                <button className="fbp-top-btn" onClick={isPreview ? noop : openSearch} aria-label="Search">
                  <FbIco d={FBP_ICON.search} size={26} />
                </button>
                <button
                  className="fbp-top-btn"
                  onClick={() =>
                    isPreview ? noop() : isOwnMode ? pushPage("fb-own-menu") : pushPage("fb-profile-menu", { uid: u.uid })
                  }
                  aria-label="More"
                >
                  <FbIco d={FBP_ICON.dots} size={26} />
                </button>
                {!isOwnMode && (
                  <button
                    className="fbp-top-btn"
                    onClick={() => (isPreview ? noop() : fbShareLink(u.name, `${u.name} on MeBook`, fbProfileLink(u.uid)))}
                    aria-label="Share"
                  >
                    <FbIco d={FBP_ICON.share} size={26} />
                  </button>
                )}
              </div>
            </div>
          <div className="fbp-cover" onClick={() => (isOwnMode ? setPhotoSheet("cover") : openCoverPic())}>
            {u.coverURL ? <img src={u.coverURL} alt="Cover" /> : <div className="fbp-cover-ph" />}
            {isOwnMode && (
              <button
                className="fbp-cam fbp-cam-cover"
                onClick={(e) => {
                  e.stopPropagation()
                  setPhotoSheet("cover")
                }}
                aria-label="Change cover"
              >
                <FbIco d={FBP_ICON.camera} size={22} />
              </button>
            )}
          </div>

          <div className="fbp-body">
            <div className="fbp-av-wrap">
              <img className="fbp-av" src={photo} alt="Profile" onClick={() => (isOwnMode ? setPhotoSheet("profile") : openProfilePic())} />
              {isOwnMode && (
                <button className="fbp-cam fbp-cam-av" onClick={() => setPhotoSheet("profile")} aria-label="Change photo">
                  <FbIco d={FBP_ICON.camera} size={22} />
                </button>
              )}
            </div>
            <div className="fbp-name">
              <span>{u.name}</span>
              {isVerified(u) && (
                <svg className="fbp-tick" width="22" height="22" viewBox="0 0 24 24" fill="#22c55e">
                  <path d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69l-3.61.82.34 3.69L1 12l2.44 2.79-.34 3.7 3.61.82L8.6 22.5l3.4-1.47 3.4 1.46 1.89-3.19 3.61-.82-.34-3.69L23 12zm-12.91 4.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z" />
                </svg>
              )}
            </div>
            {(!isOwnMode || proOn) && (
              <div className="fbp-stats">
                <b>{friendsLoading ? "…" : theirFriends.length}</b> friends · <b>{visiblePosts.length}</b> posts
              </div>
            )}
            {u.profileStatus ? <div className="fbp-status">{u.profileStatus}</div> : null}
            {u.bio ? <div className="fbp-bio">{u.bio}</div> : null}

            {isOwnMode ? (
              <div className="mb-profile-actions">
                <button className="mb-btn mb-btn-primary" onClick={openCreatePost}>
                  <svg viewBox="0 0 24 24">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                  Create Post
                </button>
                <button className="mb-btn mb-btn-secondary" onClick={openEditProfile}>
                  <svg viewBox="0 0 24 24">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                  </svg>
                  Edit Profile
                </button>
              </div>
            ) : (
              <div className="fbp-actions">
                {isFriend ? (
                  <button className="fbp-btn fbp-btn-friends" onClick={() => (isPreview ? noop() : setFbSheetUser(friendObj || u))}>
                    <FbIco d={FBP_ICON.personCheck} size={22} /> Friends
                  </button>
                ) : sending ? (
                  <button className="fbp-btn fbp-btn-friends" disabled>Sending...</button>
                ) : pending ? (
                  <button className="fbp-btn fbp-btn-friends" onClick={() => (isPreview ? noop() : handleCancelRequest(u.uid))}>
                    Cancel Request
                  </button>
                ) : (
                  <button className="fbp-btn fbp-btn-friends" onClick={() => (isPreview ? noop() : handleSendRequest(u.uid))}>
                    <FbIco d={FBP_ICON.invite} size={22} /> Add friend
                  </button>
                )}
                <button className="fbp-btn fbp-btn-msg" onClick={() => (isPreview ? noop() : startChat(u.uid, u.name, photo))}>
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                    <path d="M12 2C6.5 2 2 6.14 2 11.25c0 2.88 1.41 5.45 3.62 7.16.12 1.1-.28 2.62-1.05 3.59-.13.16-.02.4.18.38 2.34-.19 4.05-1.25 4.85-1.85.77.16 1.58.25 2.4.25 5.5 0 10-4.14 10-9.25S17.5 2 12 2z" />
                  </svg>
                  Message
                </button>
                <button className="fbp-btn fbp-btn-poke" onClick={() => (isPreview ? noop() : fbPoke(u))} aria-label="Poke">
                  <FbIco d={FBP_ICON.poke} size={22} />
                </button>
              </div>
            )}

            {u.actionButton && FB_ACTION_LABELS[u.actionButton] && !isOwnMode && (
              <button
                className="fbp-btn fbp-btn-action"
                onClick={() => (isPreview ? noop() : startChat(u.uid, u.name, photo))}
              >
                {FB_ACTION_LABELS[u.actionButton]}
              </button>
            )}
            {u.actionButton && FB_ACTION_LABELS[u.actionButton] && isOwnMode && (
              <div className="fbp-status">Action button: {FB_ACTION_LABELS[u.actionButton]}</div>
            )}

            <div className="fbp-tabs">
              {tabs.map((t) => (
                <button
                  key={t}
                  className={`fbp-tab${profileTab === t ? " active" : ""}`}
                  onClick={() => {
                    setProfileTab(t)
                    setFbPhotoSub("")
                  }}
                >
                  {t === "all" ? "All" : t === "reels" ? "Reels" : t === "photos" ? "Photos" : "Events"}
                </button>
              ))}
            </div>

            {profileTab === "all" && (
              <div className="fbp-left">
                {highlights.length > 0 && (
                  <>
                    <div className="fbp-sec-title">Highlights</div>
                    <div className="fbp-fstrip">
                      {highlights.map((h, i) => (
                        <div className="fbp-fcard" key={i} onClick={() => viewer(h)}>
                          <img src={h} alt="" />
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {showInfo && (
                  <>
                    <div className="fbp-sec-head">
                      <div className="fbp-sec-title" style={{ margin: 0 }}>Personal details</div>
                      {isOwnMode && (
                        <button className="fbp-pen" onClick={openEditProfile} aria-label="Edit details">
                          <FbIco d={FBP_ICON.edit} size={24} />
                        </button>
                      )}
                    </div>
                    {bday && (
                      <div className="fbp-row">
                        <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
                          <path d="M12 6c1.11 0 2-.9 2-2 0-.38-.1-.73-.29-1.03L12 0l-1.71 2.97c-.19.3-.29.65-.29 1.03 0 1.1.9 2 2 2zm4.6 9.99l-1.07-1.07-1.08 1.07c-1.3 1.3-3.58 1.31-4.89 0l-1.07-1.07-1.09 1.07C6.75 16.64 5.88 17 4.96 17c-.73 0-1.4-.23-1.96-.61V21c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-4.61c-.56.38-1.23.61-1.96.61-.92 0-1.79-.36-2.44-1.01zM18 9h-5V7h-2v2H6c-1.66 0-3 1.34-3 3v1.54c0 1.08.88 1.96 1.96 1.96.52 0 1.02-.2 1.38-.57l2.14-2.13 2.13 2.13c.74.74 2.03.74 2.77 0l2.14-2.13 2.13 2.13c.37.37.86.57 1.38.57 1.08 0 1.96-.88 1.96-1.96V12C21 10.34 19.66 9 18 9z" />
                        </svg>
                        <span>{bday}</span>
                      </div>
                    )}
                    {u.location && (
                      <div className="fbp-row">
                        <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                        <span>{u.location}</span>
                      </div>
                    )}
                    {u.handle && (
                      <div className="fbp-row">
                        <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
                          <path d="M12 2a10 10 0 1 0 5 18.66l-1-1.73A8 8 0 1 1 20 12v1a2 2 0 0 1-4 0V7h-2v1.1A4 4 0 1 0 14 15a4 4 0 0 0 6-2v-1A10 10 0 0 0 12 2zm0 11a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
                        </svg>
                        <span>{u.handle}</span>
                      </div>
                    )}
                    {!bday && !u.location && !u.handle && (
                      <div className="fbp-empty">{isOwnMode ? "Add your details with the pencil" : "No details to show"}</div>
                    )}
                  </>
                )}

                <div className="fbp-sec-head">
                  <div className="fbp-sec-title" style={{ margin: 0 }}>Friends</div>
                  {theirFriends.length > 0 && (
                    <span className="fbp-seeall" onClick={() => (isPreview ? noop() : openFriendsList(u.uid, u.name))}>See all</span>
                  )}
                </div>
                {friendsLoading ? (
                  <div className="fbp-empty">Loading friends...</div>
                ) : theirFriends.length === 0 ? (
                  <div className="fbp-empty">{isOwnMode ? "You don't have any friends yet" : "No friends to show"}</div>
                ) : (
                  <div className="fbp-fstrip">
                    {theirFriends.slice(0, 8).map((f: any) => (
                      <div className="fbp-fcard" key={f.uid} onClick={() => (isPreview ? noop() : openUserProfile(f.uid))}>
                        <img src={avatarUrl(f)} alt={f.name} />
                        <div>{f.name?.split(" ")[0]}</div>
                      </div>
                    ))}
                  </div>
                )}

                {!isOwnMode && <div className="fbp-sec-title">Posts ({visiblePosts.length})</div>}
              </div>
            )}
          </div>

          {profileTab === "all" && !isOwnMode && (
            <div className="fbp-posts">
              {visiblePosts.length === 0 ? (
                <div className="mb-empty">
                  <b>No posts yet</b>
                  <p style={{ fontSize: 14, marginTop: 4 }}>This user hasn't posted anything</p>
                </div>
              ) : (
                postList(visiblePosts.slice().sort((a: any, b: any) => Number(!!b.pinned) - Number(!!a.pinned)))
              )}
            </div>
          )}

          {profileTab === "reels" && (
            <div className="fbp-posts">
              {reelPosts.length === 0 ? <div className="mb-empty"><b>No reels yet</b></div> : postList(reelPosts)}
            </div>
          )}

          {profileTab === "events" && (
            <div className="fbp-posts">
              <div className="mb-empty"><b>No events yet</b></div>
            </div>
          )}

          {profileTab === "photos" && (
            <div className="fbp-photos">
              <div className="fbp-chips">
                {([
                  ["profile", "Profile pictures"],
                  ["cover", "Cover photos"],
                  ["albums", "All albums"],
                ] as const).map(([k, label]) => (
                  <button
                    key={k}
                    className={`fbp-chip${fbPhotoSub === k ? " on" : ""}`}
                    onClick={() => setFbPhotoSub(fbPhotoSub === k ? "" : k)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {fbPhotoSub === "profile" ? (
                u.photoURL ? <Grid items={[{ src: u.photoURL, onClick: openProfilePic }]} /> : <div className="fbp-empty">No profile pictures</div>
              ) : fbPhotoSub === "cover" ? (
                u.coverURL ? <Grid items={[{ src: u.coverURL, onClick: openCoverPic }]} /> : <div className="fbp-empty">No cover photos</div>
              ) : fbPhotoSub === "albums" ? (
                <div className="fbp-albums">
                  <div className="fbp-album" onClick={() => setFbPhotoSub("")}>
                    <div className="fbp-album-th">{photoPosts[0] ? <img src={photoPosts[0].image} alt="" /> : null}</div>
                    <b>Timeline photos</b>
                    <small>{photoPosts.length} items</small>
                  </div>
                  <div className="fbp-album" onClick={() => setFbPhotoSub("profile")}>
                    <div className="fbp-album-th">{u.photoURL ? <img src={u.photoURL} alt="" /> : null}</div>
                    <b>Profile pictures</b>
                    <small>{u.photoURL ? 1 : 0} items</small>
                  </div>
                  <div className="fbp-album" onClick={() => setFbPhotoSub("cover")}>
                    <div className="fbp-album-th">{u.coverURL ? <img src={u.coverURL} alt="" /> : null}</div>
                    <b>Cover photos</b>
                    <small>{u.coverURL ? 1 : 0} items</small>
                  </div>
                </div>
              ) : (
                <Grid items={photoPosts.map((p: any) => ({ src: p.image, onClick: () => openPostPhoto(p) }))} />
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderFbProfile = () =>
    renderFbProfileCore("other", viewingUser, viewingUserPosts, viewingUserFriends, viewingUserFriendsLoading)

  /* ---- Own profile: Profile settings page ---- */
  const renderFbOwnMenu = () => {
    const Item = ({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) => (
      <button className="fbp-mi" onClick={onClick}>
        <FbIco d={icon} size={28} />
        <span>{label}</span>
      </button>
    )
    const photoUrls: string[] = myPosts.filter((p: any) => p.image && !p.youtube && !p.binnedAt).map((p: any) => p.image)
    const proOn = profile?.proMode !== false
    const soon = (title: string, line: string) => setFbInfo({ title, lines: [line] })

    return (
      <div className="mb-view active">
        <div className="fbp fbp-menu">
          <div className="fbp-menu-head">
            <button className="fbp-menu-back" onClick={goBack} aria-label="Back">
              <FbIco d={FBP_ICON.back} size={26} />
            </button>
            <div className="fbp-menu-title">Profile settings</div>
          </div>

          <Item icon={FBP_ICON.edit} label="Edit" onClick={openEditProfile} />
          <Item icon={FBP_ICON.heart} label="Add highlights" onClick={() => setFbHlOpen(true)} />
          <Item
            icon={FBP_ICON.shield}
            label="Profile status"
            onClick={() =>
              setFbInfo({
                title: "Profile status",
                subtitle: profile?.profileStatus ? `Current: ${profile.profileStatus}` : "Show a status on your profile",
                actions: [
                  ...["Available", "Busy", "Away", "Do not disturb"].map((st) => ({
                    label: st,
                    onClick: () => fbSaveField({ profileStatus: st }, "Status updated", st),
                  })),
                  { label: "Clear status", danger: true, onClick: () => fbSaveField({ profileStatus: "" }, "Status cleared", "") },
                ],
              })
            }
          />
          <Item
            icon={FBP_ICON.action}
            label="Add action button"
            onClick={() =>
              setFbInfo({
                title: "Add action button",
                subtitle: "Visitors will see this button on your profile.",
                actions: [
                  ...Object.entries(FB_ACTION_LABELS).map(([k, label]) => ({
                    label,
                    onClick: () => fbSaveField({ actionButton: k }, "Action button added", label),
                  })),
                  { label: "Remove button", danger: true, onClick: () => fbSaveField({ actionButton: "" }, "Removed", "") },
                ],
              })
            }
          />
          <Item icon={FBP_ICON.archive} label="Archive" onClick={() => setManageOpen(true)} />
          <Item icon={FBP_ICON.eye} label="View as" onClick={() => pushPage("fb-view-as")} />
          <Item icon={FBP_ICON.info} label="Meta One" onClick={() => soon("Meta One", "Meta One isn't available in MeBook yet.")} />
          <Item icon={FBP_ICON.mega} label="Advertise" onClick={() => soon("Advertise", "Ads aren't available in MeBook yet.")} />
          <Item icon={FBP_ICON.list} label="Activity log" onClick={() => pushPage("fb-activity")} />
          <Item
            icon={FBP_ICON.review}
            label="Review posts and tags"
            onClick={() => soon("Review posts and tags", "Nothing to review right now.")}
          />
          <Item icon={FBP_ICON.lock} label="Privacy Centre" onClick={() => pushPage("settings")} />
          <Item icon={FBP_ICON.search} label="Search" onClick={openSearch} />
          <Item
            icon={FBP_ICON.undo}
            label={proOn ? "Turn off pro mode" : "Turn on pro mode"}
            onClick={() =>
              fbSaveField(
                { proMode: !proOn },
                proOn ? "Pro mode off" : "Pro mode on",
                proOn ? "Friend & post counts are hidden on your profile" : "Friend & post counts are visible again"
              )
            }
          />
          <Item
            icon={FBP_ICON.share}
            label="Share profile"
            onClick={() => fbShareLink(profile.name, `${profile.name} on MeBook`, fbProfileLink(user.uid))}
          />
          <Item
            icon={FBP_ICON.invite}
            label="Invite people to connect"
            onClick={() =>
              fbShareLink("MeBook", "Join me on MeBook!", (() => {
                try { return window.location.origin + window.location.pathname } catch { return "" }
              })())
            }
          />
        </div>
        {fbHlOpen && (
          <FbHighlightPicker
            photos={photoUrls}
            selected={Array.isArray(profile?.highlights) ? profile.highlights : []}
            onClose={() => setFbHlOpen(false)}
            onSave={(l) => {
              setFbHlOpen(false)
              fbSaveField({ highlights: l }, "Highlights saved", `${l.length} photo${l.length === 1 ? "" : "s"} on your profile`)
            }}
          />
        )}
      </div>
    )
  }

  const renderFbActivity = () => (
    <div className="mb-view active">
      <div className="fbp fbp-menu">
        <div className="fbp-menu-head">
          <button className="fbp-menu-back" onClick={goBack} aria-label="Back">
            <FbIco d={FBP_ICON.back} size={26} />
          </button>
          <div className="fbp-menu-title">Activity log</div>
        </div>
        {myPosts.length === 0 ? (
          <div className="fbp-empty">No activity yet</div>
        ) : (
          myPosts.map((p: any) => (
            <div
              key={p.id}
              className="fbp-mi"
              style={{ cursor: "default" }}
            >
              {p.image ? (
                <img src={p.image} alt="" style={{ width: 52, height: 52, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <FbIco d={FBP_ICON.list} size={28} />
              )}
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 16, fontWeight: 600 }}>
                  You posted{p.binnedAt ? " (in bin)" : p.archived ? " (archived)" : ""}
                </span>
                <span style={{ display: "block", fontSize: 13.5, opacity: 0.7, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {p.caption || p.movie || "Photo"} · {p.timeText || timeAgo(p.createdAt)}
                </span>
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )

  const renderFbMenu = () => {
    const uid = currentParams.uid
    const u: any =
      (viewingUser && viewingUser.uid === uid ? viewingUser : null) ||
      allUsers.find((x: any) => x.uid === uid) ||
      myFriends.find((x: any) => x.uid === uid)
    if (!u) {
      return (
        <div className="mb-view active">
          <button className="mb-back-btn" onClick={goBack}>Back</button>
          <div className="mb-empty"><b>User not found</b></div>
        </div>
      )
    }
    const first = (u.name || "User").split(" ")[0]
    const link = fbProfileLink(u.uid)
    const isFriend = myFriends.some((f) => f.uid === u.uid)
    const friendObj = myFriends.find((f) => f.uid === u.uid)
    const following = !unfollowedSet.has(u.uid)

    const Item = ({ icon, label, onClick, blue }: { icon: string; label: string; onClick: () => void; blue?: boolean }) => (
      <button className={`fbp-mi${blue ? " blue" : ""}`} onClick={onClick}>
        <FbIco d={icon} size={28} />
        <span>{label}</span>
      </button>
    )

    const mutual = (() => {
      if (!isFriend) return 0
      const mine = new Set(myFriends.map((f) => f.uid))
      return viewingUserFriends.filter((f: any) => mine.has(f.uid)).length
    })()

    return (
      <div className="mb-view active">
        <div className="fbp fbp-menu">
          <div className="fbp-menu-head">
            <button className="fbp-menu-back" onClick={goBack} aria-label="Back">
              <FbIco d={FBP_ICON.back} size={26} />
            </button>
            <div className="fbp-menu-title">{u.name}</div>
          </div>

          <Item
            icon={FBP_ICON.people}
            label="See friendship"
            onClick={() =>
              setFbInfo({
                title: `You and ${first}`,
                avatars: [avatarUrl(profile), avatarUrl(u)],
                subtitle: isFriend
                  ? friendObj?.friendsSince
                    ? `Friends since ${monthYear(friendObj.friendsSince)}`
                    : "You are friends"
                  : "You are not friends yet",
                lines: isFriend ? [`${mutual} mutual friend${mutual === 1 ? "" : "s"}`] : [],
              })
            }
          />
          <Item
            icon={FBP_ICON.report}
            label="Report profile"
            onClick={() =>
              setFbInfo({
                title: `Report ${first}'s profile`,
                subtitle: "Why are you reporting this profile?",
                actions: ["Fake account", "Harassment or bullying", "Spam or scam", "Inappropriate content", "Something else"].map(
                  (r) => ({ label: r, onClick: () => fbReportProfile(u, r) })
                ),
              })
            }
          />
          <Item
            icon={FBP_ICON.heart}
            label={`Help ${first}.`}
            onClick={() =>
              setFbInfo({
                title: `Help ${first}`,
                subtitle: "Check in with them or let us know if something is wrong.",
                actions: [
                  { label: `Message ${first}`, onClick: () => startChat(u.uid, u.name, avatarUrl(u)) },
                  { label: "Report a problem", danger: true, onClick: () => fbReportProfile(u, "Needs help") },
                ],
              })
            }
          />
          <Item icon={FBP_ICON.block} label="Block" onClick={() => handleBlockUser(u.uid)} />
          <Item
            icon={FBP_ICON.search}
            label="Search"
            onClick={() => {
              setSrQuery(u.name || "")
              pushPage("search")
            }}
          />
          <Item
            icon={FBP_ICON.invite}
            label="Invite friends"
            onClick={() =>
              fbShareLink("MeBook", "Join me on MeBook!", (() => {
                try { return window.location.origin + window.location.pathname } catch { return "" }
              })())
            }
          />
          <Item
            icon={FBP_ICON.following}
            label={following ? "Following" : "Follow"}
            blue={following}
            onClick={() => handleUnfollow(u.uid)}
          />
          <Item
            icon={FBP_ICON.share}
            label="Share profile"
            onClick={() => fbShareLink(u.name, `${u.name} on MeBook`, link)}
          />

          <div className="fbp-linkcard">
            <div className="fbp-link-title">{u.name}'s profile link</div>
            <div className="fbp-link-sub">{u.name}'s personalised link on MeBook.</div>
            <div className="fbp-link-url">{link}</div>
            <button className="fbp-copy" onClick={() => fbCopyText(link)}>Copy link</button>
          </div>
        </div>
      </div>
    )
  }

  /* ============================================================
  MAIN RENDER
  ============================================================ */
  return (
    <div
      className={rootClass}
      ref={rootRef}
      onPointerDown={(e) => {
        popupPointRef.current = { x: e.clientX, y: e.clientY }
      }}
    >
      {themeRipple && (
        <div
          className="mebook-theme-ripple"
          style={{
            left: themeRipple.x,
            top: themeRipple.y,
            background: themeRipple.color,
          }}
        />
      )}

      <ToastStack toasts={toasts} onDone={removeToast} />

      {exitConfirmOpen && (
        <div className="mb-exit-overlay" onClick={() => setExitConfirmOpen(false)}>
          <div
            className="mb-exit-dialog"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-exit-icon">
              <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
              </svg>
            </div>
            <div className="mb-exit-title">Exit MeBook?</div>
            <div className="mb-exit-text">Are you sure you want to exit MeBook?</div>
            <div className="mb-exit-actions">
              <button type="button" className="mb-exit-btn cancel" onClick={() => setExitConfirmOpen(false)}>
                Cancel
              </button>
              <button type="button" className="mb-exit-btn exit" onClick={doExit}>
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
      {mcOverlays}

      {/* Flying reactions */}
      {flyingReactions.map((r) => (
        <div
          key={r.id}
          className="cmt-flying-reaction"
          style={{ left: r.x, top: r.y }}
        >
          {r.emoji}
        </div>
      ))}

      {/* Fast like flyers */}
      {fastLikeFlyers.map((r) => (
        <div
          key={r.id}
          className="fast-like-flyer"
          style={{ left: r.x, top: r.y }}
        >
          {r.emoji}
        </div>
      ))}

      {/* Post reaction picker (Facebook style) */}
      <PostReactionPicker
        anchorRect={postReactionPicker.anchorRect}
        open={postReactionPicker.open}
        onReact={(key, emoji, from) => {
          const pid = postReactionPicker.postId
          if (!pid) return
          const now = Date.now()
          if (now - reactLockRef.current < 700) return
          reactLockRef.current = now
          setPostReactionPicker((p) => ({ ...p, open: false }))
          const cur = (findPost(pid) as any)?.reactions?.[user.uid]
          const tgt = document.querySelector(`[data-like-btn="${pid}"] .rx-btn-ico`) as HTMLElement | null
          if (tgt && cur !== key) {
            const r = tgt.getBoundingClientRect()
            const id = ++jumpIdRef.current
            setRxJumps((p) => [
              ...p,
              { id, postId: pid, k: key, fx: from.x, fy: from.y, tx: r.left + r.width / 2, ty: r.top + r.height / 2 },
            ])
          }
          try { if (navigator.vibrate) navigator.vibrate(10) } catch {}
          handlePostReact(pid, key, emoji)
        }}
      />

      {/* Reaction jump into Like button */}
      {rxJumps.map((j) => (
        <RxJump
          key={j.id}
          k={j.k}
          fx={j.fx}
          fy={j.fy}
          tx={j.tx}
          ty={j.ty}
          onDone={() => {
            setRxJumps((p) => p.filter((x) => x.id !== j.id))
            setRxLand({ postId: j.postId })
            setTimeout(() => setRxLand((p) => (p.postId === j.postId ? { postId: null } : p)), 1600)
          }}
        />
      ))}

      {/* Reactors + comments sheet */}
      {engageSheet && (() => {
        const sp: any = findPost(engageSheet.postId)
        if (!sp) return null
        return (
          <EngageSheet
            key={engageSheet.postId}
            post={sp}
            mode={engageSheet.mode}
            tab={engageSheet.tab}
            onMode={(m) => setEngageSheet((s) => (s ? { ...s, mode: m } : s))}
            onTab={(t) => setEngageSheet((s) => (s ? { ...s, tab: t } : s))}
            onClose={() => {
              setEngageSheet(null)
              setReplyTo(null)
              setCommentText("")
              setCommentImageFile(null)
              setCommentImagePreview("")
              cancelEditComment()
            }}
            me={user}
            profile={profile}
            allUsers={allUsers}
            myFriends={myFriends}
            sentRequests={sentRequests}
            sentFriendRequests={sentFriendRequests}
            onAddFriend={(uid) => handleSendRequest(uid)}
            onOpenProfile={(uid) => {
              setEngageSheet(null)
              openUserProfile(uid)
            }}
            commentText={commentText}
            setCommentText={setCommentText}
            commentBusy={commentBusy}
            commentImagePreview={commentImagePreview}
            onImageSelect={handleCommentImageSelect}
            onRemoveImage={removeCommentImage}
            replyTo={replyTo}
            setReplyTo={setReplyTo}
            onSend={() => handleAddComment(sp.id)}
            onQuickEmoji={(em) => handleQuickComment(sp.id, em)}
            onSendSticker={(em) => handleQuickComment(sp.id, "", em)}
            onLikeComment={(cid) => handleReactToComment(sp.id, cid, "like", "👍")}
            onCommentMenu={(cid) => setActionMenu({ kind: "comment", id: cid, postId: sp.id })}
            editCommentId={editCommentId}
            editCommentText={editCommentText}
            setEditCommentText={setEditCommentText}
            editBusy={editCommentBusy}
            onSaveEdit={(cid) => handleSaveEditComment(sp.id, cid)}
            onCancelEdit={cancelEditComment}
            lockMsg={commentLockMsg(sp)}
            isVerifiedUid={isVerifiedUid}
          />
        )
      })()}

      {/* Share sheet */}
      {shareSheetPostId && (() => {
        const sp: any = findPost(shareSheetPostId)
        if (!sp) return null
        return (
          <ShareSheet
            key={shareSheetPostId}
            post={sp}
            profile={profile}
            friends={myFriends}
            busy={shareBusy}
            defaultAudience={getShareDefaultAudience()}
            onClose={() => setShareSheetPostId(null)}
            onShareNow={(c, a, d) => shareNow(sp, c, a, d)}
            onSendToFriend={(uid) => sendPostToFriend(sp, uid)}
            onCopy={() => copyLink(sp)}
            onWhatsApp={() => shareToWhatsApp(sp)}
            onTelegram={() => shareToTelegram(sp)}
            onFacebook={() => shareToFacebook(sp)}
            onMore={() => nativeShare(sp)}
            onUnavailable={(w) => showToast(`${w} isn't available yet`, "", "info")}
          />
        )
      })()}

      {/* Who can comment / Edit privacy */}
      {choiceFor && (() => {
        const cp: any = findPost(choiceFor.postId)
        if (!cp) return null
        if (choiceFor.kind === "comment") {
          return (
            <ChoiceSheet
              title="Who can comment on your post?"
              value={cp.commentPermission || "everyone"}
              options={[
                { value: "everyone", label: "Everyone", sub: "Anyone who can see your post", icon: PM_IC.globe },
                { value: "friends", label: "Friends", sub: "Only your friends", icon: PM_IC.people },
                { value: "none", label: "No one", sub: "Turn off commenting", icon: PM_IC.lock },
              ]}
              onBack={() => setChoiceFor(null)}
              onDone={(v) => {
                updatePostDoc(cp.id, { commentPermission: v }, "Comment settings saved")
                setChoiceFor(null)
              }}
            />
          )
        }
        return (
          <ChoiceSheet
            title="Who can see your post?"
            subtitle="Your post will appear in Feed, on your profile and in search results."
            value={cp.audience || "public"}
            options={[
              { value: "public", label: "Public", sub: "Anyone on or off MeBook", icon: PM_IC.globe },
              { value: "friends", label: "Friends", sub: "Your MeBook friends", icon: PM_IC.people },
              { value: "only_me", label: "Only me", sub: "Only you can see this", icon: PM_IC.lock },
            ]}
            onBack={() => setChoiceFor(null)}
            onDone={(v) => {
              updatePostDoc(cp.id, { audience: v }, "Privacy updated")
              setChoiceFor(null)
            }}
          />
        )
      })()}

      {/* Product link */}
      {linkDialogPostId && (() => {
        const lp: any = findPost(linkDialogPostId)
        if (!lp) return null
        return (
          <LinkDialog
            value={lp.productLink || ""}
            onClose={() => setLinkDialogPostId(null)}
            onSave={(v) => {
              let url = v
              if (url && !/^https?:\/\//i.test(url)) url = "https://" + url
              updatePostDoc(lp.id, { productLink: url }, url ? "Product link saved" : "Product link removed")
              setLinkDialogPostId(null)
            }}
          />
        )
      })()}

      {/* Manage posts (archive + bin) */}
      {manageOpen && (
        <ManageSheet
          posts={myPosts}
          onClose={() => setManageOpen(false)}
          onRestore={restorePost}
          onDeleteForever={deleteForever}
        />
      )}

      {/* Notification options sheet */}
      {notifMenu && (() => {
        const n = notifMenu
        const close = () => setNotifMenu(null)
        const ty = n.type || "admin"
        const who = n.fromName || "this user"
        const isLess = notifPrefs.less.includes(ty)
        const mk = (path: string) => (
          <svg viewBox="0 0 24 24">
            <path d={path} />
          </svg>
        )
        const rows: { label: string; sub?: string; icon: React.ReactNode; danger?: boolean; onClick: () => void }[] = [
          {
            label: "Show more",
            sub: "More of your notifications will be like this.",
            icon: mk("M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z"),
            onClick: () => {
              saveNotifPrefs({ ...notifPrefs, less: notifPrefs.less.filter((x) => x !== ty) })
              showToast("Done", "You'll see more notifications like this", "success")
            },
          },
          {
            label: "Show less",
            sub: "Fewer of your notifications will be like this.",
            icon: mk("M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z"),
            onClick: () => {
              if (!isLess) saveNotifPrefs({ ...notifPrefs, less: [...notifPrefs.less, ty] })
              showToast("Done", "You'll see fewer notifications like this", "success")
            },
          },
          {
            label: "Delete this notification",
            icon: mk("M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3.3 11.3l-1.4 1.4L12 13.4l-2.3 2.3-1.4-1.4L10.6 12 8.3 9.7l1.4-1.4L12 10.6l2.3-2.3 1.4 1.4L13.4 12l2.3 2.3z"),
            onClick: () => deleteNotification(n),
          },
          {
            label: `Turn off notifications about ${who}'s updates`,
            icon: mk("M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"),
            onClick: () => {
              if (!n.fromUid) {
                showToast("Not available", "This notification has no sender", "info")
                return
              }
              if (!notifPrefs.muted.includes(n.fromUid))
                saveNotifPrefs({ ...notifPrefs, muted: [...notifPrefs.muted, n.fromUid] })
              showToast("Turned off", `You won't see notifications about ${who}`, "success")
            },
          },
          {
            label: "Report issue to notifications team",
            icon: mk("M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 12h-2v-2h2v2zm0-4h-2V6h2v4z"),
            onClick: () => reportNotificationIssue(n),
          },
        ]
        return (
          <div className="mb-sheet-backdrop" onClick={close}>
            <div className="mb-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="mb-sheet-grip" />
              <div className="notif-sheet-head">
                {n.fromAvatar ? <img className="notif-avatar" src={n.fromAvatar} alt="" /> : null}
                <span>
                  {n.title}
                  {n.message ? ` — ${n.message}` : ""}
                </span>
              </div>
              {rows.map((r, i) => (
                <button
                  key={i}
                  className={`mb-sheet-item${r.danger ? " danger" : ""}`}
                  onClick={() => {
                    close()
                    r.onClick()
                  }}
                >
                  {r.icon}
                  <span className="mb-sheet-txt">
                    {r.label}
                    {r.sub && <small>{r.sub}</small>}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Action sheets: post / comment / chat message */}
      {actionMenu && (() => {
        const close = () => setActionMenu(null)
        if (actionMenu.kind === "post") {
          const target: any = findPost(actionMenu.id)
          if (!target) return null
          return (
            <PostMenuSheet
              post={target}
              pinned={!!target.pinned}
              saved={savedIds.includes(target.id)}
              archived={!!target.archived}
              muted={!!target.muteNotifs}
              onClose={close}
              onAction={(k) => handlePostMenuAction(k, target.id)}
            />
          )
        }
        if (actionMenu.kind === "comment") {
          const postId = actionMenu.postId || ""
          const cPost = findPost(postId)
          const target = (cPost?.comments || []).find((c: any) => c.id === actionMenu.id)
          return (
            <ActionSheet
              onClose={close}
              items={[
                { label: "Edit comment", icon: ICON_EDIT, onClick: () => target && startEditComment(target) },
                { label: "Delete comment", icon: ICON_TRASH, danger: true, onClick: () => handleDeleteComment(postId, actionMenu.id) },
              ]}
            />
          )
        }
        const m = chatMessages.find((x) => x.id === actionMenu.id)
        const canEditMsg = !!m && !m.type && !!m.text
        const items: SheetItem[] = []
        if (m && canEditMsg) {
          items.push({ label: "Edit message", icon: ICON_EDIT, onClick: () => startEditMessage(m) })
        }
        if (m) {
          items.push({
            label: "Reply",
            icon: ICON_REPLY,
            onClick: () => {
              setChatReplyTo({ id: m.id, from: m.from, text: m.type === "image" ? "📷 Photo" : m.type === "voice" ? "🎤 Voice" : m.type === "like" ? "👍" : (m.text || "") })
              setTimeout(() => chatInputRef.current?.focus(), 50)
            },
          })
          if (m.text) {
            items.push({
              label: "Copy text",
              icon: ICON_COPY,
              onClick: async () => {
                try { await navigator.clipboard.writeText(m.text); showToast("Copied", "", "success") } catch { showToast("Could not copy", "", "error") }
              },
            })
          }
        }
        items.push({ label: "Unsend message", icon: ICON_TRASH, danger: true, onClick: () => handleDeleteMessage(actionMenu.id) })
        return <ActionSheet onClose={close} items={items} />
      })()}

      {/* Edit post modal */}
      {editPostId && (
        <div className="mb-modal-backdrop" onClick={closeEditPost}>
          <div className="mb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mb-modal-head">
              <b>Edit post</b>
              <button className="mb-modal-x" onClick={closeEditPost} title="Close">
                <svg viewBox="0 0 24 24">
                  <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
            <textarea
              className="mb-modal-textarea"
              rows={5}
              placeholder="What's on your mind?"
              value={editPostText}
              onChange={(e) => setEditPostText(e.target.value)}
            />
            {(editPostPreview || editPostImage) && (
              <div className="mb-modal-img">
                <img src={editPostPreview || editPostImage} alt="" />
                <button onClick={removeEditPostPhoto} title="Remove photo">
                  <svg viewBox="0 0 24 24">
                    <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              </div>
            )}
            <button className="mb-modal-photo" onClick={() => editPostFileRef.current?.click()}>
              <svg viewBox="0 0 24 24">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
              </svg>
              {editPostPreview || editPostImage ? "Change photo" : "Add photo"}
            </button>
            <input
              ref={editPostFileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleEditPostFile}
            />
            <button
              className="mb-modal-save"
              onClick={handleSaveEditPost}
              disabled={editPostBusy || (!editPostText.trim() && !editPostPreview && !editPostImage)}
            >
              {editPostBusy ? (editPostFile ? "Uploading..." : "Saving...") : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* Photo viewer */}
      {photoViewer && (
        <PhotoViewer
          src={photoViewer.src}
          caption={photoViewer.caption}
          authorName={photoViewer.name}
          authorAvatar={photoViewer.avatar}
          time={photoViewer.time}
          stats={photoViewer.stats}
          onLike={() => {
            const id = photoViewer.postId
            setPhotoViewer(null)
            if (id) setEngageSheet({ postId: id, mode: "reactions", tab: "all" })
          }}
          onComment={() => {
            const id = photoViewer.postId
            setPhotoViewer(null)
            if (id) setEngageSheet({ postId: id, mode: "comments", tab: "all" })
          }}
          onShare={() => {
            const id = photoViewer.postId
            setPhotoViewer(null)
            if (id) setShareSheetPostId(id)
          }}
          onReport={() => reportPhoto(photoViewer)}
          onToast={showToast}
          onClose={() => setPhotoViewer(null)}
        />
      )}

      {/* Comment reaction picker */}
      <ReactionPicker
        anchorRect={reactionPicker.anchorRect}
        open={reactionPicker.open}
        onReact={(key, emoji) => {
          const postId = currentParams.postId
          if (!postId || !reactionPicker.commentKey) return
          const pos = { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 }
          if (reactionPicker.anchorRect) {
            pos.clientX = reactionPicker.anchorRect.x + reactionPicker.anchorRect.width / 2
            pos.clientY = reactionPicker.anchorRect.y
          }
          handleReactToComment(postId, reactionPicker.commentKey, key, emoji, pos)
        }}
      />

      {/* Chat reaction picker */}
      <ChatReactionPicker
        anchorRect={chatReactionPicker.anchorRect}
        open={chatReactionPicker.open}
        onReact={(key, emoji) => {
          if (!chatReactionPicker.msgId) return
          if (chatReactionPicker.msgId === "__send_reaction__") {
            setChatLikeActive(true)
            setTimeout(() => setChatLikeActive(false), 600)
            handleSendLike()
            setChatReactionPicker({ open: false, msgId: null, anchorRect: null })
            return
          }
          const pos = { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 }
          if (chatReactionPicker.anchorRect) {
            pos.clientX = chatReactionPicker.anchorRect.x
            pos.clientY = chatReactionPicker.anchorRect.y
          }
          handleReactToMessage(chatReactionPicker.msgId, key, emoji, pos)
        }}
      />

      {/* Facebook-style friend sheet + info sheet */}
      {fbSheetUser && (
        <FbFriendSheet
          friend={fbSheetUser}
          following={!unfollowedSet.has(fbSheetUser.uid)}
          favourite={(profile?.favourites || []).includes(fbSheetUser.uid)}
          breakActive={Number(profile?.breaks?.[fbSheetUser.uid] || 0) > Date.now()}
          lists={profile?.friendLists?.[fbSheetUser.uid] || []}
          onClose={() => setFbSheetUser(null)}
          onUnfollow={() => {
            const f = fbSheetUser
            setFbSheetUser(null)
            handleUnfollow(f.uid)
          }}
          onBreakToggle={() => {
            const f = fbSheetUser
            setFbSheetUser(null)
            handleTakeBreak(f)
          }}
          onFavourite={() => {
            const f = fbSheetUser
            setFbSheetUser(null)
            handleToggleFavourite(f)
          }}
          onSaveLists={(l) => {
            const f = fbSheetUser
            setFbSheetUser(null)
            handleSaveFriendLists(f, l)
          }}
          onUnfriend={() => {
            const f = fbSheetUser
            setFbSheetUser(null)
            handleUnfriend(f.uid, f.name)
          }}
        />
      )}
      <FbInfoSheet info={fbInfo} onClose={() => setFbInfo(null)} />
      {photoSheet && (
        <FbPhotoSheet
          kind={photoSheet}
          hasCurrent={photoSheet === "cover" ? !!profile?.coverURL : true}
          photos={myPosts.filter((p: any) => p.image && !p.youtube && !p.binnedAt).map((p: any) => p.image)}
          busy={photoBusy}
          onClose={() => setPhotoSheet("")}
          onSee={() => {
            const myAv = avatarUrl(profile)
            const src = photoSheet === "cover" ? profile?.coverURL : myAv
            setPhotoSheet("")
            if (src)
              setPhotoViewer({
                src,
                caption: "",
                name: profile?.name || "User",
                avatar: myAv,
                time: "",
                stats: { likes: 0, comments: 0, shares: 0, reactionKeys: [] },
              })
          }}
          onUpload={() => pickAndUploadImage(photoSheet)}
          onPick={(url) => handlePickOwnPhoto(photoSheet, url)}
        />
      )}

      {/* Friend action sheet */}
      {actionSheetFriend && (
        <FriendActionSheet
          friend={actionSheetFriend}
          onClose={() => setActionSheetFriend(null)}
          isUnfollowed={unfollowedSet.has(actionSheetFriend.uid)}
          onMessage={() => {
            const f = actionSheetFriend
            setActionSheetFriend(null)
            startChat(f.uid, f.name, f.photoURL || "")
          }}
          onUnfollow={() => {
            const f = actionSheetFriend
            setActionSheetFriend(null)
            handleUnfollow(f.uid)
          }}
          onBlock={() => {
            const f = actionSheetFriend
            setActionSheetFriend(null)
            handleBlockUser(f.uid)
          }}
          onUnfriend={() => {
            const f = actionSheetFriend
            setActionSheetFriend(null)
            handleUnfriend(f.uid, f.name)
          }}
        />
      )}

      <header className="mb-header">
        <div className="mb-header-left" onClick={() => goTo("home")}>
          <img className="mb-header-logo" src={HEADER_LOGO} alt="MeBook" />
          <div className="mb-logo-stack">
            <div className="mb-logo-text">
              <span className="me">Me</span>
              <span className="book">Book</span>
            </div>
          </div>
        </div>

        <div className="mb-header-right">
          <button
            className="mb-icon-btn mb-plus-btn"
            title="Create post"
            aria-label="Create post"
            onClick={openCreatePost}
          >
            <svg viewBox="0 0 24 24">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
          </button>
          <button
            className="mb-icon-btn"
            title="Search"
            aria-label="Search"
            onClick={openSearch}
          >
            <svg viewBox="0 0 24 24">
              <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
          </button>
          <button
            className={`mb-icon-btn${menuOpen ? " active" : ""}`}
            title="Menu"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
          >
            <svg viewBox="0 0 24 24">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </button>
        </div>
      </header>

      <nav className="mb-navbar" aria-label="Main navigation">
        <div className="mb-navbar-inner">
          <button
            className={`mb-nav-tab${currentView === "home" ? " active" : ""}`}
            title="Home"
            aria-label="Home"
            onClick={() => handleNavClick("home")}
          >
            <svg viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
          </button>
          <button
            className={`mb-nav-tab${currentView === "shorts" ? " active" : ""}`}
            title="Shorts"
            aria-label="Shorts"
            onClick={() => handleNavClick("shorts")}
          >
            <svg viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M7 2h10a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3zm3 5.5v9l7.5-4.5L10 7.5z" />
            </svg>
          </button>
          <button
            className={`mb-nav-tab${currentView === "friends" || currentView === "friends-list" ? " active" : ""}`}
            title="Friends"
            aria-label="Friends"
            onClick={() => handleNavClick("friends")}
          >
            <svg viewBox="0 0 24 24">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
            {requests.length > 0 && (
              <span className="mb-badge-dot">{requests.length}</span>
            )}
          </button>
          <button
            className={`mb-nav-tab${currentView === "messages" ? " active" : ""}`}
            title="MeChat"
            aria-label="MeChat"
            onClick={() => handleNavClick("messages")}
          >
            <svg viewBox="0 0 24 24">
              <path d="M12 2C6.5 2 2 6.14 2 11.25c0 2.88 1.41 5.45 3.62 7.16.12 1.1-.28 2.62-1.05 3.59-.13.16-.02.4.18.38 2.34-.19 4.05-1.25 4.85-1.85.77.16 1.58.25 2.4.25 5.5 0 10-4.14 10-9.25S17.5 2 12 2z" />
            </svg>
            {unreadCount > 0 && <span className="mb-badge-dot">{unreadCount}</span>}
          </button>
          <button
            className={`mb-nav-tab${currentView === "notifications" ? " active" : ""}`}
            title="Notifications"
            aria-label="Notifications"
            onClick={() => handleNavClick("notifications")}
          >
            <svg viewBox="0 0 24 24">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
            </svg>
            {unreadNotifCount > 0 && (
              <span className="mb-badge-dot">
                {unreadNotifCount > 99 ? "99+" : unreadNotifCount}
              </span>
            )}
          </button>
          <button
            className={`mb-nav-tab mb-nav-tab-avatar${currentView === "profile" ? " active" : ""}`}
            title="Profile"
            aria-label="Profile"
            onClick={() => handleNavClick("profile")}
          >
            <span className="mb-nav-avatar">
              <img src={avatarUrl(profile)} alt="Profile" />
            </span>
          </button>
        </div>
      </nav>

      <div
        className={`mb-menu-backdrop${menuOpen ? " open" : ""}`}
        onClick={() => setMenuOpen(false)}
      />
      <div className={`mb-menu${menuOpen ? " open" : ""}`} role="menu">
        <div
          className="mb-menu-head"
          onClick={() => {
            setMenuOpen(false)
            goTo("profile")
          }}
        >
          <img src={avatarUrl(profile)} alt="" />
          <div className="mb-menu-head-info">
            <div className="mb-menu-head-name">{profile.name}</div>
            <div className="mb-menu-head-email">{profile.email}</div>
          </div>
        </div>

        <button className="mb-menu-item" onClick={() => { setMenuOpen(false); goTo("friends") }}>
          <span className="mb-menu-ico blue">
            <svg viewBox="0 0 24 24">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
          </span>
          Friends
          {requests.length > 0 && <span className="mb-menu-badge">{requests.length}</span>}
        </button>

        <button className="mb-menu-item" onClick={() => { setMenuOpen(false); goTo("notifications") }}>
          <span className="mb-menu-ico green">
            <svg viewBox="0 0 24 24">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
            </svg>
          </span>
          Notifications
          {unreadNotifCount > 0 && <span className="mb-menu-badge">{unreadNotifCount}</span>}
        </button>

        <button className="mb-menu-item" onClick={() => { setMenuOpen(false); goTo("messages") }}>
          <span className="mb-menu-ico green">
            <svg viewBox="0 0 24 24">
              <path d="M12 2C6.5 2 2 6.14 2 11.25c0 2.88 1.41 5.45 3.62 7.16.12 1.1-.28 2.62-1.05 3.59-.13.16-.02.4.18.38 2.34-.19 4.05-1.25 4.85-1.85.77.16 1.58.25 2.4.25 5.5 0 10-4.14 10-9.25S17.5 2 12 2z" />
            </svg>
          </span>
          MeChat
          {unreadCount > 0 && <span className="mb-menu-badge">{unreadCount}</span>}
        </button>

        <div className="mb-menu-divider" />

        <button className="mb-menu-item" onClick={() => { setMenuOpen(false); goTo("profile") }}>
          <span className="mb-menu-ico">
            <svg viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </span>
          View Profile
        </button>

        <button className="mb-menu-item" onClick={() => { setMenuOpen(false); openEditProfile() }}>
          <span className="mb-menu-ico">
            <svg viewBox="0 0 24 24">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
            </svg>
          </span>
          Edit Profile
        </button>

        <button className="mb-menu-item" onClick={() => { setMenuOpen(false); goTo("settings") }}>
          <span className="mb-menu-ico">
            <svg viewBox="0 0 24 24">
              <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
            </svg>
          </span>
          Settings
        </button>

        <div className="mb-menu-divider" />

        <div className="mb-menu-item" style={{ cursor: "default" }}>
          <span className="mb-menu-ico">
            <svg viewBox="0 0 24 24">
              <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
            </svg>
          </span>
          Dark Mode
          <label className="mb-switch mb-menu-switch">
            <input
              type="checkbox"
              checked={theme === "dark"}
              onChange={(e) => toggleTheme(e.target.checked)}
            />
            <span className="mb-slider" />
          </label>
        </div>

        <div className="mb-menu-divider" />

        <button className="mb-menu-item" onClick={() => { setMenuOpen(false); goTo("mebook") }}>
          <span className="mb-menu-ico green">
            <svg viewBox="0 0 24 24">
              <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1z" />
            </svg>
          </span>
          My MeBook
        </button>

        <button className="mb-menu-item" onClick={() => { setMenuOpen(false); goTo("community") }}>
          <span className="mb-menu-ico blue">
            <svg viewBox="0 0 24 24">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
          </span>
          Community
        </button>

        <div className="mb-menu-divider" />

        <button className="mb-menu-item danger" onClick={() => { setMenuOpen(false); handleSignOut() }}>
          <span className="mb-menu-ico red">
            <svg viewBox="0 0 24 24">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
            </svg>
          </span>
          Log Out
        </button>
      </div>

      <div className="mb-layout">
        <aside className="mb-sidebar">
          <SideItem id="home" label="Home" active={currentView === "home"} onClick={handleNavClick} />
          <SideItem
            id="shorts"
            label="Shorts"
            active={currentView === "shorts"}
            onClick={handleNavClick}
            icon={
              <svg viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M7 2h10a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3zm3 5.5v9l7.5-4.5L10 7.5z" />
              </svg>
            }
          />
          <SideItem id="friends" label="Friends" active={currentView === "friends"} onClick={handleNavClick} badge={requests.length} />
          <SideItem id="messages" label="MeChat" active={currentView === "messages"} onClick={handleNavClick} badge={unreadCount} />
          <SideItem id="notifications" label="Notifications" active={currentView === "notifications"} onClick={handleNavClick} badge={unreadNotifCount} />
          <div className="mb-side-divider" />
          <SideItem id="mebook" label="MeBook" active={currentView === "mebook"} onClick={handleNavClick} />
          <SideItem id="community" label="Community" active={currentView === "community"} onClick={handleNavClick} />
          <SideItem id="profile" label="Profile" active={currentView === "profile"} onClick={handleNavClick} />
          <SideItem id="settings" label="Settings" active={currentView === "settings"} onClick={handleNavClick} />
        </aside>

        <main className="mb-main">
          {currentView === "home" && (
  <div className="mb-view active">

    <PushPrompt perm={pushPerm} onEnable={enablePush} />

    {/* Exit MeBook */}
    <button
      onClick={doExit}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "14px",
        padding: "10px 16px",
        borderRadius: "14px",
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.06)",
        color: "inherit",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: 600,
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="currentColor"
      >
        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
      </svg>
      Exit MeBook
    </button>

    <div className="mb-mini">
      <img className="mb-mini-av" src={avatarUrl(profile)} alt="You" onClick={() => openUserProfile(user.uid)} />
      <button className="mb-mini-input" onClick={openCreatePost}>
        What&apos;s on your mind?
      </button>
      <button className="mb-mini-ph" onClick={openCreatePost} aria-label="Add photo">
        <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
        </svg>
      </button>
    </div>
              <StoriesSection
                user={user}
                profile={profile}
                allUsers={allUsers}
                myFriends={myFriends}
                hiddenAuthors={hiddenAuthors}
                avatarUrl={avatarUrl}
                showToast={showToast}
                onUnfollow={(uid: string) => handleUnfollow(uid)}
                onOpenProfile={(uid: string) => openUserProfile(uid)}
              />
              <div>
                {feed.length === 0 ? (
                  <div className="mb-loading">Loading feed...</div>
                ) : (
                  feed.filter((p) => !hiddenAuthors.has(p.authorId)).map((p) => renderPost(p))
                )}
              </div>
            </div>
          )}

          {currentView === "notifications" && (
            <div className="mb-view active">
              <h1 className="mb-page-title">
                <svg viewBox="0 0 24 24">
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                </svg>
                Notifications
              </h1>
              <PushPrompt perm={pushPerm} onEnable={enablePush} />
              <div className="notif-page-wrap">
                <div className="notif-page-head">
                  <span>{visibleNotifications.length} total</span>
                  {unreadNotifCount > 0 && (
                    <button className="notif-mark-all" onClick={markAllNotificationsRead}>
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="notif-list">
                  {visibleNotifications.length === 0 ? (
                    <div className="notif-empty">
                      <svg viewBox="0 0 24 24">
                        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                      </svg>
                      <b>No notifications yet</b>
                      <p>When someone likes, comments or sends a friend request, you'll see it here.</p>
                    </div>
                  ) : (
                    visibleNotifications.map((n) => {
                      const type = n.type || "admin"
                      const iconClass =
                        type === "like" ? "like"
                        : type === "comment" ? "comment"
                        : type === "share" ? "share"
                        : type === "friend" ? "friend"
                        : type === "verification" ? "verification"
                        : type === "subscription" ? "subscription"
                        : type === "account" ? "account"
                        : type === "post" ? "post"
                        : "admin"
                      const isFriendRequest = type === "friend" && n.requestId && !n.read
                      return (
                        <div
                          className={`notif-item${!n.read ? " unread" : ""}`}
                          key={n.id}
                          onClick={() => openNotification(n)}
                        >
                          {n.fromAvatar ? (
                            <img className="notif-avatar" src={n.fromAvatar} alt="" />
                          ) : (
                            <div className={`notif-icon ${iconClass}`}>
                              {type === "like" && (
                                <svg viewBox="0 0 24 24">
                                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                </svg>
                              )}
                              {type === "comment" && (
                                <svg viewBox="0 0 24 24">
                                  <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z" />
                                </svg>
                              )}
                              {type === "share" && (
                                <svg viewBox="0 0 24 24">
                                  <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
                                </svg>
                              )}
                              {type === "friend" && (
                                <svg viewBox="0 0 24 24">
                                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                                </svg>
                              )}
                              {type === "verification" && (
                                <svg viewBox="0 0 24 24">
                                  <path d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69l-3.61.82.34 3.69L1 12l2.44 2.79-.34 3.7 3.61.82L8.6 22.5l3.4-1.47 3.4 1.46 1.89-3.19 3.61-.82-.34-3.69L23 12zm-12.91 4.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z" />
                                </svg>
                              )}
                              {type === "admin" && (
                                <svg viewBox="0 0 24 24">
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                                </svg>
                              )}
                              {type === "post" && (
                                <svg viewBox="0 0 24 24">
                                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                                </svg>
                              )}
                            </div>
                          )}
                          <div className="notif-body">
                            <div className="notif-text">
                              <b>{n.title}</b>
                              {n.message && <> — {n.message}</>}
                            </div>
                            <div className="notif-time">{timeAgo(n.createdAt)}</div>
                            {isFriendRequest && (
                              <div className="notif-actions">
                                <button
                                  className="notif-action-btn accept"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleAcceptRequest(n.requestId, n.fromUid)
                                    markNotificationRead(n.id)
                                  }}
                                >
                                  Accept
                                </button>
                                <button
                                  className="notif-action-btn decline"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeclineRequest(n.requestId)
                                    markNotificationRead(n.id)
                                  }}
                                >
                                  Decline
                                </button>
                              </div>
                            )}
                          </div>
                          {!n.read && <span className="notif-dot" />}
                          <button
                            className="notif-more"
                            aria-label="More options"
                            onClick={(e) => {
                              e.stopPropagation()
                              setNotifMenu(n)
                            }}
                          >
                            <svg viewBox="0 0 24 24">
                              <circle cx="5" cy="12" r="2" />
                              <circle cx="12" cy="12" r="2" />
                              <circle cx="19" cy="12" r="2" />
                            </svg>
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {currentView === "shorts" && (
            <ShortsPage
              posts={feed.filter(
                (p: any) =>
                  p &&
                  p.type === "youtube" &&
                  p.youtube?.videoId &&
                  p.youtube.isShort === true &&
                  !p.sharedPost &&
                  canSeePost(p, false)
              )}
              me={user}
              postReactions={postReactions}
              savedIds={savedIds}
              paused={!!engageSheet || !!shareSheetPostId || menuOpen || !!actionMenu}
              startPostId={currentParams.postId}
              likeBtnProps={likeBtnProps}
              isVerifiedPost={(p: any) => isVerified(p)}
              onComment={(id: string) => setEngageSheet({ postId: id, mode: "comments", tab: "all" })}
              onShare={(id: string) => setShareSheetPostId(id)}
              onSave={(id: string) => handlePostMenuAction("save", id)}
              onCopy={(p: any) => copyLink(p)}
              onOpenProfile={(uid: string) => openUserProfile(uid)}
            />
          )}

          {currentView === "friends" && (
            <div className="mb-view active">
              <h1 className="mb-page-title">
                <svg viewBox="0 0 24 24">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                </svg>
                Friends
              </h1>

              <div className="fr-page">
                <div className="fr-tabs">
                  <button className={`fr-tab${friendsTab === "requests" ? " active" : ""}`} onClick={() => setFriendsTab("requests")}>
                    Requests
                    {requests.length > 0 && <span className="fr-tab-badge">{requests.length}</span>}
                  </button>
                  <button className={`fr-tab${friendsTab === "sent" ? " active" : ""}`} onClick={() => setFriendsTab("sent")}>
                    Sent
                  </button>
                  <button className={`fr-tab${friendsTab === "all" ? " active" : ""}`} onClick={() => setFriendsTab("all")}>
                    My Friends ({myFriends.length})
                  </button>
                  <button className={`fr-tab${friendsTab === "mutual" ? " active" : ""}`} onClick={() => setFriendsTab("mutual")}>
                    Find Friends
                  </button>
                </div>

                <div className="fr-body">
                  {friendsTab === "requests" && (
                    <>
                      {requests.length === 0 ? (
                        <div className="mb-empty">
                          <svg viewBox="0 0 24 24">
                            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                          </svg>
                          <b>No pending friend requests</b>
                          <p>When someone sends you a request, it'll show up here.</p>
                        </div>
                      ) : (
                        requests.map((r) => {
                          const photo = avatarUrl(r.fromUser)
                          return (
                            <div className="fr-request-row" key={r.id}>
                              <img src={photo} alt="" onClick={() => openUserProfile(r.from)} />
                              <div className="fr-request-info">
                                <div className="fr-request-name" onClick={() => openUserProfile(r.from)}>
                                  {r.fromUser.name}
                                </div>
                                <div className="fr-request-mutual">Wants to be your friend</div>
                              </div>
                              <div className="fr-request-actions">
                                <button className="mb-btn mb-btn-primary" onClick={() => handleAcceptRequest(r.id, r.from)}>Confirm</button>
                                <button className="mb-btn mb-btn-secondary" onClick={() => handleDeclineRequest(r.id)}>Delete</button>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </>
                  )}

                  {friendsTab === "sent" && (
                    <>
                      {sentFriendRequests.length === 0 ? (
                        <div className="mb-empty">
                          <svg viewBox="0 0 24 24">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                          </svg>
                          <b>No sent requests</b>
                          <p>Requests you send will appear here.</p>
                        </div>
                      ) : (
                        sentFriendRequests.map((r) => {
                          const photo = avatarUrl(r.toUser)
                          return (
                            <div className="fr-request-row" key={r.id}>
                              <img src={photo} alt="" onClick={() => openUserProfile(r.to)} />
                              <div className="fr-request-info">
                                <div className="fr-request-name" onClick={() => openUserProfile(r.to)}>
                                  {r.toUser.name}
                                </div>
                                <div className="fr-request-mutual">
                                  Status: {r.status === "pending" ? "Pending" : r.status === "accepted" ? "Accepted ✓" : "Declined"}
                                </div>
                              </div>
                              <div className="fr-request-actions">
                                {r.status === "pending" && (
                                  <button className="mb-btn mb-btn-secondary" onClick={() => handleCancelRequest(r.to)}>Cancel</button>
                                )}
                              </div>
                            </div>
                          )
                        })
                      )}
                    </>
                  )}

                  {friendsTab === "all" && (
                    <>
                      <div className="fl-page">
                        <div className="fl-search">
                          <svg viewBox="0 0 24 24">
                            <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                          </svg>
                          <input
                            type="text"
                            placeholder="Search friends"
                            value={friendSearch}
                            onChange={(e) => setFriendSearch(e.target.value)}
                          />
                        </div>

                        <div className="fl-stats-row">
                          <div className="fl-stats-left">
                            <div className="fl-stats-title">{myFriends.length} friends</div>
                            <div className="fl-stats-sub">{Math.min(myFriends.length, 20)} online</div>
                          </div>
                          <button className="fl-sort">Sort</button>
                        </div>

                        {myFriends.length === 0 ? (
                          <div className="fl-empty">
                            No friends yet — start sending friend requests!
                          </div>
                        ) : (
                          <div className="fl-list">
                            {myFriends
                              .filter((f) => {
                                const q = friendSearch.trim().toLowerCase()
                                if (!q) return true
                                return (f.name || "").toLowerCase().includes(q)
                              })
                              .map((f, idx) => {
                                const fPhoto = avatarUrl(f)
                                return (
                                  <div
                                    className="fl-item"
                                    key={f.uid}
                                    onClick={() => openUserProfile(f.uid)}
                                  >
                                    <div className="fl-avatar-wrap">
                                      <img src={fPhoto} alt={f.name} />
                                      {idx % 5 === 0 && <div className="fl-avatar-ring" />}
                                      {idx % 3 === 0 && <span className="fl-online-dot" />}
                                    </div>
                                    <div className="fl-info">
                                      <div className="fl-name">
                                        {f.name}
                                        {isVerified(f) ? " ✓" : ""}
                                      </div>
                                      <div className="fl-mutual">
                                        {Math.max(1, ((idx * 7) % 50) + 1)} mutual friends
                                      </div>
                                    </div>
                                    <button
                                      className="fl-more"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setActionSheetFriend(f)
                                      }}
                                      title="More options"
                                    >
                                      <svg viewBox="0 0 24 24">
                                        <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                                      </svg>
                                    </button>
                                  </div>
                                )
                              })}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {friendsTab === "mutual" && (
                    <>
                      <div className="fl-page">
                        <div className="fl-search">
                          <svg viewBox="0 0 24 24">
                            <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                          </svg>
                          <input
                            type="text"
                            placeholder="Search all MeBook users"
                            value={friendSearch}
                            onChange={(e) => setFriendSearch(e.target.value)}
                          />
                        </div>

                        <div className="fl-stats-row">
                          <div className="fl-stats-left">
                            <div className="fl-stats-title">{filteredFriends.length} people</div>
                            <div className="fl-stats-sub">
                              {filteredFriends.filter((_, i) => i % 3 === 0).length} online
                            </div>
                          </div>
                          <button className="fl-sort">Sort</button>
                        </div>

                        {filteredFriends.length === 0 ? (
                          <div className="fl-empty">No users found</div>
                        ) : (
                          <div className="fl-list">
                            {filteredFriends.map((u, idx) => {
                              const photo = avatarUrl(u)
                              const isFriend = myFriends.some((f) => f.uid === u.uid)
                              const hasPendingSent = sentFriendRequests.some(
                                (r) => r.to === u.uid && r.status === "pending"
                              )
                              const isOnline = idx % 3 === 0
                              const showRing = idx % 5 === 0

                              return (
                                <div
                                  className="fl-item"
                                  key={u.uid}
                                  onClick={() => openUserProfile(u.uid)}
                                >
                                  <div className="fl-avatar-wrap">
                                    <img src={photo} alt={u.name} />
                                    {showRing && <div className="fl-avatar-ring" />}
                                    {isOnline && <span className="fl-online-dot" />}
                                  </div>
                                  <div className="fl-info">
                                    <div className="fl-name">
                                      {u.name}
                                      {isVerified(u) ? " ✓" : ""}
                                    </div>
                                    <div className="fl-mutual">
                                      {isFriend
                                        ? "Already friends"
                                        : hasPendingSent
                                        ? "Request pending"
                                        : `${Math.max(1, ((idx * 7) % 50) + 1)} mutual friends`}
                                    </div>
                                  </div>

                                  {isFriend ? (
                                    <button
                                      className="fl-more"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        startChat(u.uid, u.name, photo)
                                      }}
                                      title="Message"
                                    >
                                      <svg viewBox="0 0 24 24">
                                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                                      </svg>
                                    </button>
                                  ) : hasPendingSent ? (
                                    <button
                                      className="fl-more"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleCancelRequest(u.uid)
                                      }}
                                      title="Cancel request"
                                    >
                                      <svg viewBox="0 0 24 24">
                                        <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                      </svg>
                                    </button>
                                  ) : (
                                    <button
                                      className="fl-more"
                                      style={{ color: "#22c55e" }}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleSendRequest(u.uid)
                                      }}
                                      title="Add friend"
                                    >
                                      <svg viewBox="0 0 24 24">
                                        <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentView === "friends-list" && (() => {
            const targetUid = currentParams.uid || user.uid
            const targetName = currentParams.name || profile.name
            const isOwnList = targetUid === user.uid
            const listFriends = isOwnList ? myFriends : viewingUserFriends
            const listLoading = !isOwnList && viewingUserFriendsLoading

            return (
              <div className="mb-view active">
                <div className="fl-page">
                  <div className="fl-head">
                    <button className="fl-head-back" onClick={goBack}>
                      <svg viewBox="0 0 24 24">
                        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                      </svg>
                    </button>
                    <div className="fl-head-title">
                      {isOwnList ? "Your friends" : `${targetName}'s friends`}
                    </div>
                    <button className="fl-head-icon" title="Search">
                      <svg viewBox="0 0 24 24">
                        <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                      </svg>
                    </button>
                  </div>

                  <div className="fl-search">
                    <svg viewBox="0 0 24 24">
                      <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search friends"
                      value={friendSearch}
                      onChange={(e) => setFriendSearch(e.target.value)}
                    />
                  </div>

                  <div className="fl-stats-row">
                    <div className="fl-stats-left">
                      <div className="fl-stats-title">{listFriends.length} friends</div>
                      <div className="fl-stats-sub">
                        {Math.min(listFriends.length, 20)} online
                      </div>
                    </div>
                    <button className="fl-sort">Sort</button>
                  </div>

                  {listLoading ? (
                    <div className="fl-empty">Loading friends...</div>
                  ) : listFriends.length === 0 ? (
                    <div className="fl-empty">No friends to show</div>
                  ) : (
                    <div className="fl-list">
                      {listFriends
                        .filter((f) => {
                          const q = friendSearch.trim().toLowerCase()
                          if (!q) return true
                          return (f.name || "").toLowerCase().includes(q)
                        })
                        .map((f, idx) => {
                          const fPhoto = avatarUrl(f)
                          const isOnline = idx % 3 === 0
                          const showRing = idx % 5 === 0
                          const isOwnFriend = myFriends.some((mf) => mf.uid === f.uid)

                          return (
                            <div
                              className="fl-item"
                              key={f.uid}
                              onClick={() => openUserProfile(f.uid)}
                            >
                              <div className="fl-avatar-wrap">
                                <img src={fPhoto} alt={f.name} />
                                {showRing && <div className="fl-avatar-ring" />}
                                {isOnline && <span className="fl-online-dot" />}
                              </div>
                              <div className="fl-info">
                                <div className="fl-name">
                                  {f.name}
                                  {isVerified(f) ? " ✓" : ""}
                                </div>
                                <div className="fl-mutual">
                                  {Math.max(1, ((idx * 7) % 50) + 1)} mutual friends
                                </div>
                              </div>
                              <button
                                className="fl-more"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (isOwnFriend) {
                                    setActionSheetFriend(f)
                                  } else {
                                    startChat(f.uid, f.name, fPhoto)
                                  }
                                }}
                                title={isOwnFriend ? "More options" : "Message"}
                              >
                                {isOwnFriend ? (
                                  <svg viewBox="0 0 24 24">
                                    <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                                  </svg>
                                ) : (
                                  <svg viewBox="0 0 24 24">
                                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          )
                        })}
                    </div>
                  )}
                </div>
              </div>
            )
          })()}

          {currentView === "user-profile" && viewingUser && renderFbProfile()}

          {currentView === "fb-profile-menu" && renderFbMenu()}

          {currentView === "fb-own-menu" && renderFbOwnMenu()}

          {currentView === "fb-view-as" && renderFbProfileCore("preview", profile, myPosts, myFriends, false)}

          {currentView === "fb-activity" && renderFbActivity()}

          {/* ============================================================
              MESSAGES — MeChat (screenshot 2 style: own right, other left)
              ============================================================ */}
          {currentView === "messages" && (
            <div className="mb-view active">
              {!activeChat ? (
                <div className="mc-listpage">
                  <div className="mc-listpage-head">
                    <svg viewBox="0 0 24 24">
                      <path d="M12 2C6.5 2 2 6.14 2 11.25c0 2.88 1.41 5.45 3.62 7.16.12 1.1-.28 2.62-1.05 3.59-.13.16-.02.4.18.38 2.34-.19 4.05-1.25 4.85-1.85.77.16 1.58.25 2.4.25 5.5 0 10-4.14 10-9.25S17.5 2 12 2z" />
                    </svg>
                    <h1 className="mc-title"><span>Me</span>Chat</h1>
                  </div>
                  <div className="mc-listpage-body">{renderChatListPanel(false)}</div>
                  {mcBackBtn("")}
                </div>
              ) : (
                <div className="mc-shell" style={kbUp && vvh ? { height: vvh } : undefined}>
                  <aside className="mc-side">
                    <div className="mc-side-head">
                      <button className="mc-side-back" onClick={() => goTo("home")} title="Back to MeBook">
                        <svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
                      </button>
                      <h2 className="mc-title"><span>Me</span>Chat</h2>
                    </div>
                    <div className="mc-side-body">{renderChatListPanel(true)}</div>
                    {mcBackBtn("in-side")}
                  </aside>
                  <section className="mc-main">
                <div className="mechat-page">
                  <div className="mechat-head">
                    <button className="mechat-head-back" onClick={closeChat}>
                      <svg viewBox="0 0 24 24">
                        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                      </svg>
                    </button>
                    <div className="mechat-head-avatar-wrap" onClick={openPartnerOrGroup}>
                      <img src={chatPartner ? avatarUrl(chatPartner) : ""} alt="" />
                      <span className="mechat-head-online" />
                    </div>
                    <div className="mechat-head-info">
                      <div className="mechat-head-name">
                        {chatPartner?.name}
                        {isVerified(chatPartner) && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="#0084ff">
                            <path d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69l-3.61.82.34 3.69L1 12l2.44 2.79-.34 3.7 3.61.82L8.6 22.5l3.4-1.47 3.4 1.46 1.89-3.19 3.61-.82-.34-3.69L23 12zm-12.91 4.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z" />
                          </svg>
                        )}
                      </div>
                      <div className="mechat-head-status">
                        {partnerTyping ? (
                          <span className="mechat-typing-text">
                            typing<span className="mechat-typing-dots">...</span>
                          </span>
                        ) : (
                          "Active now"
                        )}
                      </div>
                    </div>
                    <div className="mechat-head-actions">
                      <button className="mechat-head-btn" title="Audio call">
                        <svg viewBox="0 0 24 24">
                          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                        </svg>
                      </button>
                      <button className="mechat-head-btn" title="Video call">
                        <svg viewBox="0 0 24 24">
                          <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                        </svg>
                      </button>
                      <button className="mechat-head-btn" title="Info" onClick={openPartnerOrGroup}>
                        <svg viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div
                    className="mechat-body"
                    ref={chatBodyRef}
                    onScroll={(e) => {
                      const el = e.currentTarget
                      const far = el.scrollHeight - el.scrollTop - el.clientHeight > 300
                      setShowScrollDown((v) => (v === far ? v : far))
                    }}
                  >
                    {chatMessages.length === 0 ? (
                      <div className="mechat-empty">
                        <svg viewBox="0 0 24 24">
                          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                        </svg>
                        <b>No messages yet</b>
                        <p>Say hi 👋</p>
                      </div>
                    ) : (
                      chatMessages.map((m, idx) => {
                        const mine = m.from === user.uid
                        const prevMsg = idx > 0 ? chatMessages[idx - 1] : null
                        const showAvatar = !mine && (!prevMsg || prevMsg.from !== m.from)
                        const isSeenByPartner =
                          mine && String(m.id) === String(partnerLastSeenMessageId || "")
                        const reactions = m.reactions || {}
                        const reactionKeys = Object.values(reactions) as string[]
                        const uniqueReactions = Array.from(new Set(reactionKeys))
                        const reactionEmojis = uniqueReactions
                          .map((k) => CHAT_REACTIONS.find((r) => r.key === k)?.emoji || REACTIONS.find((r) => r.key === k)?.emoji)
                          .filter(Boolean) as string[]
                        const myReaction = reactions[user.uid]
                        const isLikeMsg = m.type === "like"
                        const isImageMsg = m.type === "image"
                        const isVoiceMsg = m.type === "voice"

                        const curDay = dayKey(m.at)
                        const prevDay = prevMsg ? dayKey(prevMsg.at) : ""
                        const dateSep =
                          curDay && curDay !== prevDay ? (
                            <div className="mechat-date-sep"><span>{dayLabel(m.at)}</span></div>
                          ) : null

                        let touchStartX = 0
                        let touchCurrentX = 0
                        const onTouchStart = (e: React.TouchEvent) => {
                          touchStartX = e.touches[0].clientX
                          touchCurrentX = touchStartX
                        }
                        const onTouchMove = (e: React.TouchEvent) => {
                          touchCurrentX = e.touches[0].clientX
                          const diff = touchCurrentX - touchStartX
                          const el = e.currentTarget as HTMLElement
                          if (diff > 0 && diff < 100) {
                            el.style.transform = `translateX(${diff}px)`
                            el.style.transition = "none"
                          }
                        }
                        const onTouchEnd = (e: React.TouchEvent) => {
                          const el = e.currentTarget as HTMLElement
                          const diff = touchCurrentX - touchStartX
                          el.style.transition = "transform .2s ease"
                          el.style.transform = "translateX(0)"
                          if (diff > 60) {
                            setChatReplyTo({
                              id: m.id,
                              from: m.from,
                              text: isImageMsg ? "📷 Photo" : isVoiceMsg ? "🎤 Voice" : isLikeMsg ? "👍" : (m.text || ""),
                            })
                            setTimeout(() => chatInputRef.current?.focus(), 50)
                          }
                        }

                        let bubbleContent: React.ReactNode = null
                        if (isImageMsg && m.imageUrl) {
                          bubbleContent = (
                            <div className="mechat-bubble-image">
                              <img
                                src={m.imageUrl}
                                alt=""
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setPhotoViewer({
                                    src: m.imageUrl,
                                    name: mine ? profile.name : chatPartner?.name,
                                    time: fbPhotoTime(m.at),
                                    avatar: mine ? avatarUrl(profile) : chatPartner ? avatarUrl(chatPartner) : "",
                                  })
                                }}
                              />
                              <span className="mechat-image-time">{chatTime(m.at)}</span>
                            </div>
                          )
                        } else if (isVoiceMsg && m.voiceUrl) {
                          bubbleContent = (
                            <div className="mechat-voice">
                              <button
                                className="mechat-voice-play"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const audio = new Audio(m.voiceUrl)
                                  audio.play()
                                }}
                              >
                                <svg viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </button>
                              <div className="mechat-voice-wave">
                                {Array.from({ length: 22 }).map((_, i) => (
                                  <span
                                    key={i}
                                    style={{
                                      height: `${8 + Math.abs(Math.sin(i * 0.7 + (m.id?.length || 0))) * 16}px`,
                                      opacity: 0.5 + Math.abs(Math.sin(i * 0.5)) * 0.5,
                                    }}
                                  />
                                ))}
                              </div>
                              <span className="mechat-voice-duration">{formatVoiceDuration(m.duration || 0)}</span>
                            </div>
                          )
                        } else if (isLikeMsg) {
                          bubbleContent = (
                            <div style={{ fontSize: 40, lineHeight: 1, padding: "2px 4px" }}>👍</div>
                          )
                        } else {
                          bubbleContent = (
                            <>
                              {m.replyTo && (
                                <div
                                  className="mechat-reply-quote"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    const target = chatBodyRef.current?.querySelector(
                                      `[data-message-id="${m.replyTo.id}"]`
                                    ) as HTMLElement | null
                                    if (target) {
                                      target.scrollIntoView({ behavior: "smooth", block: "center" })
                                      target.classList.add("mc-flash")
                                      setTimeout(() => target.classList.remove("mc-flash"), 1400)
                                    }
                                  }}
                                >
                                  <b>{m.replyTo.from === user.uid ? "You" : m.replyTo.name}</b>
                                  <span>{m.replyTo.text}</span>
                                </div>
                              )}
                              <span>{m.text}</span>
                              <span className={`mechat-bubble-time ${mine ? "me" : "them"}`}>
                                {m.edited ? "Edited · " : ""}
                                {chatTime(m.at)}
                              </span>
                            </>
                          )
                        }

                        return (
                          <React.Fragment key={m.id}>
                          {dateSep}
                          <div
                            data-mechat-message="true"
                            data-message-id={String(m.id)}
                            className={`mechat-bubble-wrap ${mine ? "me" : "them"} ${showAvatar ? "show-avatar" : ""}`}
                            onTouchStart={onTouchStart}
                            onTouchMove={onTouchMove}
                            onTouchEnd={onTouchEnd}
                            onContextMenu={(e) => {
                              e.preventDefault()
                              openChatReactionPicker(e, m.id)
                            }}
                            onDoubleClick={(e) => openChatReactionPicker(e, m.id)}
                          >
                            {!mine && <img className="mechat-bubble-avatar" src={mcSenderAvatar(m)} alt="" />}
                            {mine && (
                              <button
                                className="mechat-msg-more"
                                title="Edit or unsend"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setActionMenu({ kind: "msg", id: m.id })
                                }}
                                onDoubleClick={(e) => e.stopPropagation()}
                                onTouchStart={(e) => e.stopPropagation()}
                                onTouchMove={(e) => e.stopPropagation()}
                                onTouchEnd={(e) => e.stopPropagation()}
                              >
                                {ICON_DOTS}
                              </button>
                            )}
                            <div
                              className={`mechat-bubble ${mine ? "me" : "them"} ${isImageMsg ? "mechat-bubble-image" : ""}`}
                              style={isImageMsg ? { padding: 3, background: "transparent", maxWidth: "72%" } : undefined}
                            >
                              {chatPartner?.isGroup && !mine && <div className="mc-sender-name">{mcSenderName(m)}{isVerifiedUid(m.from, null) && mcVerifiedBadge(12)}</div>}
                              {bubbleContent}
                            </div>
                            {!mine && !isLikeMsg && (
                              <div
                                className="mechat-side-actions"
                                onTouchStart={(e) => e.stopPropagation()}
                                onTouchMove={(e) => e.stopPropagation()}
                                onTouchEnd={(e) => e.stopPropagation()}
                                onDoubleClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  title="React"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openChatReactionPicker(e, m.id)
                                  }}
                                >
                                  <svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" /></svg>
                                </button>
                                <button
                                  title="Reply"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setChatReplyTo({
                                      id: m.id,
                                      from: m.from,
                                      text: isImageMsg ? "📷 Photo" : isVoiceMsg ? "🎤 Voice" : (m.text || ""),
                                    })
                                    setTimeout(() => chatInputRef.current?.focus(), 50)
                                  }}
                                >
                                  <svg viewBox="0 0 24 24"><path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z" /></svg>
                                </button>
                              </div>
                            )}
                            {isSeenByPartner && (
                              <img
                                className="mechat-seen-avatar"
                                src={chatPartner ? avatarUrl(chatPartner) : ""}
                                alt=""
                              />
                            )}
                            {reactionEmojis.length > 0 && (
                              <span className="mechat-reaction-badge">
                                {reactionEmojis.slice(0, 3).join("")}
                                {reactionKeys.length > 1 && ` ${reactionKeys.length}`}
                              </span>
                            )}
                          </div>
                          </React.Fragment>
                        )
                      })
                    )}
                  </div>

                  {showScrollDown && (
                    <button
                      className="mechat-scrolldown"
                      title="Latest messages"
                      onClick={() => {
                        const el = chatBodyRef.current
                        if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
                      }}
                    >
                      <svg viewBox="0 0 24 24"><path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z" /></svg>
                    </button>
                  )}

                  {recording && (
                    <div className="mechat-recording-bar">
                      <span className="mechat-recording-dot" />
                      <span className="mechat-recording-time">{formatVoiceDuration(recordSeconds)}</span>
                      <span className="mechat-recording-hint">Recording voice message...</span>
                      <button className="mechat-recording-cancel" onClick={cancelVoiceRecording} title="Cancel">
                        <svg viewBox="0 0 24 24">
                          <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                      </button>
                      <button className="mechat-recording-send" onClick={sendVoiceRecording} title="Send">
                        <svg viewBox="0 0 24 24">
                          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {editingMsgId && !recording && (
                    <div className="mechat-reply-banner">
                      <div className="bar" />
                      <div className="mechat-reply-banner-info">
                        <div className="mechat-reply-banner-title">Editing message</div>
                        <div className="mechat-reply-banner-text">
                          {chatMessages.find((x) => x.id === editingMsgId)?.text || ""}
                        </div>
                      </div>
                      <button className="mechat-reply-banner-close" onClick={cancelEditMessage}>
                        <svg viewBox="0 0 24 24">
                          <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {chatReplyTo && !recording && (
                    <div className="mechat-reply-banner">
                      <div className="bar" />
                      <div className="mechat-reply-banner-info">
                        <div className="mechat-reply-banner-title">
                          Replying to {chatReplyTo.from === user.uid ? "yourself" : (chatPartner?.name || "")}
                        </div>
                        <div className="mechat-reply-banner-text">{chatReplyTo.text}</div>
                      </div>
                      <button className="mechat-reply-banner-close" onClick={() => setChatReplyTo(null)}>
                        <svg viewBox="0 0 24 24">
                          <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {!recording && (
                    <div className={`mechat-input-bar${kbUp ? " kb-up" : ""}`}>
                      <div className="mechat-input-actions">
                        <button
                          className="mechat-input-icon"
                          title="Add photo"
                          onClick={() => chatFileInputRef.current?.click()}
                        >
                          <svg viewBox="0 0 24 24">
                            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                          </svg>
                        </button>
                        <button
                          className="mechat-input-icon"
                          title="Camera"
                          onClick={() => chatCameraInputRef.current?.click()}
                        >
                          <svg viewBox="0 0 24 24">
                            <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
                          </svg>
                        </button>
                        <button
                          className="mechat-input-icon"
                          title="Voice"
                          onClick={startVoiceRecording}
                        >
                          <svg viewBox="0 0 24 24">
                            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                          </svg>
                        </button>
                      </div>

                      <textarea
                        ref={chatInputRef}
                        className="mechat-input-field"
                        placeholder="Aa"
                        rows={1}
                        value={chatInput}
                        onChange={(e) => {
                          handleChatTyping(e.target.value)
                          e.target.style.height = "auto"
                          e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            handleSendMessage()
                          } else if (e.key === "Escape" && editingMsgId) {
                            cancelEditMessage()
                          }
                        }}
                      />

                      {chatInput.trim() ? (
                        <button className="mechat-send-btn" onClick={handleSendMessage} title="Send">
                          <svg viewBox="0 0 24 24">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                          </svg>
                        </button>
                      ) : (
                        <button
                          className={`mechat-like-btn${chatLikeActive ? " my-liked" : ""}`}
                          onClick={handleSendLike}
                          onContextMenu={(e) => {
                            e.preventDefault()
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                            setChatReactionPicker({
                              open: true,
                              msgId: "__send_reaction__",
                              anchorRect: { x: rect.left + rect.width / 2, y: rect.top, width: rect.width },
                            })
                          }}
                          title="Send like (hold for reactions)"
                        >
                          <svg viewBox="0 0 24 24">
                            <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}

                  <input
                    ref={chatFileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={async (e) => {
                      const f = e.target.files?.[0]
                      e.target.value = ""
                      if (f) await handleChatImageUpload(f)
                    }}
                  />
                  <input
                    ref={chatCameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: "none" }}
                    onChange={async (e) => {
                      const f = e.target.files?.[0]
                      e.target.value = ""
                      if (f) await handleChatImageUpload(f)
                    }}
                  />
                </div>
                  </section>
                </div>
              )}
            </div>
          )}

          {currentView === "search" && (
            <SearchPage
              me={user.uid}
              query={srQuery}
              setQuery={setSrQuery}
              users={allUsers}
              posts={Array.from(
                new Map(
                  [...feed, ...extraPosts, ...myPosts].map((p: any) => [p.id, p])
                ).values()
              ).sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))}
              avatarOf={avatarUrl}
              isVerUid={isVerifiedUid}
              onBack={goBack}
              onOpenUser={(uid: string) => openUserProfile(uid)}
              onOpenPost={(post: any) => openComments(post)}
            />
          )}

          {currentView === "create-post" && (
            <CreatePostScreen
              profile={profile}
              avatarUrl={avatarUrl}
              allUsers={allUsers.filter((u: any) => u.uid !== user.uid)}
              text={postText}
              setText={setPostText}
              movie={postMovie}
              setMovie={setPostMovie}
              previewUrl={previewUrl}
              hasFile={!!selectedFile}
              onPickFile={handlePreviewFile}
              onRemove={removePreview}
              progress={uploadProgress}
              busy={postBusy}
              onClose={goBack}
              onSubmit={handleSubmitPost}
              audience={postAudience}
              setAudience={setPostAudience}
              feeling={postFeeling}
              setFeeling={setPostFeeling}
              location={postLocation}
              setLocation={setPostLocation}
              music={postMusic}
              setMusic={setPostMusic}
              tagged={postTagged}
              setTagged={setPostTagged}
              showToast={showToast}
            />
          )}

          {currentView === "comments" && (() => {
            const post = findPost(currentParams.postId)
            if (!post) {
              return (
                <div className="mb-view active">
                  <button className="mb-back-btn" onClick={goBack}>Back</button>
                  <div className="mb-empty">Post not found</div>
                </div>
              )
            }

            const allComments = post.comments || []
            const { tops, repliesMap } = buildCommentTree(allComments)
            const totalCount = allComments.length

            const renderReactionBadge = (reactions: Record<string, string>) => {
              const entries = Object.entries(reactions || {})
              if (entries.length === 0) return null
              const counts: Record<string, number> = {}
              for (const [, key] of entries) {
                counts[key] = (counts[key] || 0) + 1
              }
              const keys = Object.keys(counts)
              const top = keys.slice(0, 3)
              const emojis = top
                .map((k) => REACTIONS.find((r) => r.key === k)?.emoji || "👍")
                .join("")
              return (
                <span className="cmt-reaction-badge">
                  {emojis}
                  <small>{entries.length}</small>
                </span>
              )
            }

            const renderCommentRow = (
              c: any,
              isReply: boolean,
              parentComment?: any
            ) => {
              const cAvatar =
                c.avatar ||
                `https://ui-avatars.com/api/?background=16a34a&color=fff&name=${encodeURIComponent(c.name || "U")}`
              const myReaction = c.reactions?.[user.uid]
              const commentKey = c.id
              const isMyComment = c.uid === user.uid
              const isEditingThis = editCommentId === c.id

              return (
                <div className={isReply ? "cmt-reply-row" : "cmt-row"} key={c.id}>
                  <img
                    className="cmt-row-avatar"
                    src={cAvatar}
                    alt=""
                    onClick={() => c.uid && openUserProfile(c.uid)}
                  />
                  <div className="cmt-row-body">
                    {isEditingThis ? (
                      <div className="cmt-edit-box">
                        <textarea
                          className="cmt-edit-input"
                          autoFocus
                          value={editCommentText}
                          onChange={(e) => setEditCommentText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault()
                              handleSaveEditComment(post.id, c.id)
                            } else if (e.key === "Escape") {
                              cancelEditComment()
                            }
                          }}
                        />
                        <div className="cmt-edit-actions">
                          <span>Enter to save · Esc to cancel</span>
                          <button className="cmt-edit-cancel" onClick={cancelEditComment}>
                            Cancel
                          </button>
                          <button
                            className="cmt-edit-save"
                            onClick={() => handleSaveEditComment(post.id, c.id)}
                            disabled={editCommentBusy || (!editCommentText.trim() && !c.image)}
                          >
                            {editCommentBusy ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </div>
                    ) : (
                    <div
                      className="cmt-bubble"
                      onDoubleClick={(evt) => handleLongPressReaction(evt, commentKey)}
                      onContextMenu={(evt) => {
                        evt.preventDefault()
                        handleLongPressReaction(evt, commentKey)
                      }}
                    >
                      <b>{c.name || "User"}{isVerifiedUid(c.uid, c) && mcVerifiedBadge(14)}</b>
                      {c.text}
                      {c.sticker && <StickerImg emoji={c.sticker} size={96} />}
                      {c.image && (
                        <div className="cmt-bubble-image">
                          <img src={c.image} alt="" />
                        </div>
                      )}
                      <span className="cmt-time">
                        {timeAgo(c.at)}
                        {c.edited ? " · Edited" : ""}
                      </span>
                      {renderReactionBadge(c.reactions || {})}
                    </div>
                    )}
                    {!isEditingThis && (
                    <div className="cmt-actions-row">
                      <button
                        className={`cmt-action-btn${myReaction ? " my-reaction" : ""}`}
                        onClick={(evt) => handleLongPressReaction(evt, commentKey)}
                        title="React"
                      >
                        {myReaction ? (
                          <>
                            {REACTIONS.find((r) => r.key === myReaction)?.emoji}{" "}
                            {REACTIONS.find((r) => r.key === myReaction)?.label}
                          </>
                        ) : (
                          "Like"
                        )}
                      </button>
                      <button
                        className="cmt-action-btn"
                        onClick={() => {
                          setReplyTo({
                            id: isReply && parentComment ? parentComment.id : c.id,
                            name: c.name,
                            uid: c.uid,
                          })
                          setTimeout(() => commentInputRef.current?.focus(), 30)
                        }}
                      >
                        Reply
                      </button>
                      {isMyComment && (
                        <button
                          className="cmt-action-btn cmt-more-btn"
                          title="Edit or delete"
                          onClick={() =>
                            setActionMenu({ kind: "comment", id: c.id, postId: post.id })
                          }
                        >
                          •••
                        </button>
                      )}
                    </div>
                    )}

                    {!isReply && repliesMap[c.id] && repliesMap[c.id].length > 0 && (
                      <div className="cmt-replies">
                        {(() => {
                          const replies = repliesMap[c.id]
                          const expanded = expandedReplies.has(c.id)
                          const visible = expanded ? replies : replies.slice(0, 2)
                          const hidden = replies.length - visible.length
                          return (
                            <>
                              {visible.map((r) => renderCommentRow(r, true, c))}
                              {!expanded && hidden > 0 && (
                                <span
                                  className="cmt-view-more-replies"
                                  onClick={() => {
                                    setExpandedReplies((s) => {
                                      const copy = new Set(s)
                                      copy.add(c.id)
                                      return copy
                                    })
                                  }}
                                >
                                  View {hidden} more {hidden === 1 ? "reply" : "replies"}
                                </span>
                              )}
                              {expanded && replies.length > 2 && (
                                <span
                                  className="cmt-view-more-replies"
                                  onClick={() => {
                                    setExpandedReplies((s) => {
                                      const copy = new Set(s)
                                      copy.delete(c.id)
                                      return copy
                                    })
                                  }}
                                >
                                  Hide replies
                                </span>
                              )}
                            </>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              )
            }

            return (
              <div className="mb-view active">
                <button className="mb-back-btn" onClick={goBack}>
                  <svg viewBox="0 0 24 24">
                    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                  </svg>
                  Back
                </button>

                <div className="cmt-page-wrap">
                  <div className="cmt-page-head">
                    <span>💬 Comments ({totalCount})</span>
                    <span style={{ fontSize: 12.5, color: "var(--text-muted)", fontWeight: 500 }}>
                      Double-click a comment to react
                    </span>
                  </div>

                  <div className="cmt-page-list" ref={commentListRef}>
                    {tops.length === 0 ? (
                      <div className="cmt-empty">
                        <svg viewBox="0 0 24 24">
                          <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z" />
                        </svg>
                        <b>No comments yet</b>
                        <p style={{ marginTop: 6 }}>Be the first to comment</p>
                      </div>
                    ) : (
                      tops.map((c: any) => renderCommentRow(c, false))
                    )}
                  </div>

                  {replyTo && (
                    <div className="cmt-reply-indicator">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z" />
                      </svg>
                      Replying to <b>{replyTo.name}</b>
                      <button onClick={() => setReplyTo(null)}>Cancel</button>
                    </div>
                  )}

                  {commentImagePreview && (
                    <div className="cmt-image-preview">
                      <div className="cmt-image-preview-img-wrap">
                        <img src={commentImagePreview} alt="" />
                        <button className="cmt-image-preview-remove" onClick={removeCommentImage}>
                          <svg viewBox="0 0 24 24">
                            <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                          </svg>
                        </button>
                      </div>
                      <div className="cmt-image-preview-info">
                        <b>{commentUploading ? "Uploading..." : "Ready to send"}</b>
                        Image will be sent with your comment
                      </div>
                    </div>
                  )}

                  <div className="cmt-input-wrap">
                    <img className="cmt-input-avatar" src={avatarUrl(profile)} alt="" />
                    <button
                      className="cmt-img-btn"
                      onClick={() => commentImgInputRef.current?.click()}
                      title="Add image"
                    >
                      <svg viewBox="0 0 24 24">
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                      </svg>
                    </button>
                    <input
                      ref={commentImgInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleCommentImageSelect}
                    />
                    <textarea
                      ref={commentInputRef}
                      className="cmt-input"
                      rows={1}
                      placeholder={replyTo ? `Reply to ${replyTo.name}...` : "Write a comment..."}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleAddComment(post.id)
                        }
                      }}
                    />
                    <button
                      className="cmt-send"
                      onClick={() => handleAddComment(post.id)}
                      disabled={(!commentText.trim() && !commentImageFile) || commentBusy}
                    >
                      <svg viewBox="0 0 24 24">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )
          })()}

          {currentView === "share" && (() => {
            const post = findPost(currentParams.postId)
            if (!post) {
              return (
                <div className="mb-view active">
                  <button className="mb-back-btn" onClick={goBack}>Back</button>
                  <div className="mb-empty">Post not found</div>
                </div>
              )
            }
            return (
              <div className="mb-view active">
                <button className="mb-back-btn" onClick={goBack}>
                  <svg viewBox="0 0 24 24">
                    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                  </svg>
                  Back
                </button>
                <h1 className="mb-page-title">Share Post</h1>
                <div className="share-page-wrap">
                  <div className="share-preview">
                    <img src={post.image || post.authorAvatar || LOGO_URL} alt="" />
                    <div className="share-preview-info">
                      <div className="share-preview-title">{post.movie || "Movie Review"}</div>
                      <div className="share-preview-sub">by {post.authorName || "MeBook User"}</div>
                    </div>
                  </div>
                  <textarea
                    className="share-caption"
                    placeholder="Say something about this..."
                    value={shareCaption}
                    onChange={(e) => setShareCaption(e.target.value)}
                  />
                  <div className="share-options">
                    <button className="share-option" onClick={() => shareToProfile(post)} disabled={shareBusy}>
                      <span className="share-option-icon profile">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      </span>
                      <div className="share-option-text">
                        Your Profile
                        <small>{shareBusy ? "Sharing..." : "Share to MeBook"}</small>
                      </div>
                    </button>
                    <button className="share-option" onClick={() => shareToFacebook(post)}>
                      <span className="share-option-icon fb">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.96h-1.51c-1.49 0-1.95.93-1.95 1.88v2.27h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07z" />
                        </svg>
                      </span>
                      <div className="share-option-text">Facebook<small>Share to feed</small></div>
                    </button>
                    <button className="share-option" onClick={() => shareToWhatsApp(post)}>
                      <span className="share-option-icon wa">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.48-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.65-1.58-.9-2.16-.24-.57-.48-.5-.66-.5-.17 0-.37-.02-.56-.02-.2 0-.5.07-.77.37-.27.3-1.02 1-1.02 2.42 0 1.43 1.04 2.81 1.19 3 .15.2 2.05 3.13 4.97 4.38.7.3 1.24.48 1.66.62.7.22 1.33.19 1.83.11.56-.08 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.56-.35zM12 0C5.4 0 0 5.4 0 12c0 2.11.55 4.11 1.51 5.84L0 24l6.32-1.66C8.02 23.15 9.96 24 12 24c6.6 0 12-5.4 12-12S18.6 0 12 0z" />
                        </svg>
                      </span>
                      <div className="share-option-text">WhatsApp<small>Send to chat</small></div>
                    </button>
                    <button className="share-option" onClick={() => shareToTelegram(post)}>
                      <span className="share-option-icon tg">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
                        </svg>
                      </span>
                      <div className="share-option-text">Telegram<small>Share to chat</small></div>
                    </button>
                    <button className="share-option" onClick={() => copyLink(post)}>
                      <span className="share-option-icon link">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
                        </svg>
                      </span>
                      <div className="share-option-text">Copy Link<small>Share anywhere</small></div>
                    </button>
                  </div>
                </div>
              </div>
            )
          })()}

          {currentView === "profile" && (
            <div className="mb-view active">
              {renderFbProfileCore("own", profile, myPosts, myFriends, false)}

              {profileTab === "all" && (<>

              <div className="mb-card" style={{ marginBottom: 16 }}>
                <div className="mb-card-title">Privacy</div>
                <div className="mb-privacy-toggle">
                  <span>Personal information visible to others</span>
                  <label className="mb-switch">
                    <input
                      type="checkbox"
                      checked={privacy.info}
                      onChange={(e) => {
                        setPrivacy({ ...privacy, info: e.target.checked })
                        setTimeout(handleSavePrivacy, 0)
                      }}
                    />
                    <span className="mb-slider" />
                  </label>
                </div>
                <div className="mb-privacy-toggle">
                  <span>Show my posts on my profile</span>
                  <label className="mb-switch">
                    <input
                      type="checkbox"
                      checked={privacy.posts}
                      onChange={(e) => {
                        setPrivacy({ ...privacy, posts: e.target.checked })
                        setTimeout(handleSavePrivacy, 0)
                      }}
                    />
                    <span className="mb-slider" />
                  </label>
                </div>
                <div className="mb-privacy-toggle">
                  <span>Allow friend requests from anyone</span>
                  <label className="mb-switch">
                    <input
                      type="checkbox"
                      checked={privacy.requests}
                      onChange={(e) => {
                        setPrivacy({ ...privacy, requests: e.target.checked })
                        setTimeout(handleSavePrivacy, 0)
                      }}
                    />
                    <span className="mb-slider" />
                  </label>
                </div>
              </div>

              <div
                className="mb-card-title"
                style={{ fontSize: 16, marginBottom: 10, padding: "0 4px", display: "flex", alignItems: "center" }}
              >
                My Posts
                <button className="rx-manage-open" onClick={() => setManageOpen(true)}>
                  Manage posts
                </button>
              </div>
              <div>
                {myPosts.length === 0 ? (
                  <div className="mb-empty">
                    <svg viewBox="0 0 24 24">
                      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                    </svg>
                    <b>No posts yet</b>
                    <p style={{ fontSize: 14, marginTop: 4 }}>Create your first movie review!</p>
                  </div>
                ) : (
                  myPosts.slice().sort((a: any, b: any) => Number(!!b.pinned) - Number(!!a.pinned)).map((p) => renderPost(p, true))
                )}
              </div>
              </>)}
            </div>
          )}

          {currentView === "edit-profile" && (
            <div className="mb-view active">
              <button className="mb-back-btn" onClick={goBack}>
                <svg viewBox="0 0 24 24">
                  <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                </svg>
                Back
              </button>
              <h1 className="mb-page-title">Edit Profile</h1>
              <div className="cp-card">
                <div className="auth-field">
                  <label>Full Name</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} />
                </div>
                <div className="auth-field">
                  <label>Bio</label>
                  <input
                    type="text"
                    placeholder="Movie lover..."
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                  />
                </div>
                <div className="auth-field">
                  <label>Location</label>
                  <input
                    type="text"
                    placeholder="Chaumuhani, Chittagong, Bangladesh"
                    value={editLoc}
                    onChange={(e) => setEditLoc(e.target.value)}
                  />
                </div>
                <div className="auth-field">
                  <label>Birthday</label>
                  <input
                    type="text"
                    placeholder="5 December 2004"
                    value={editBirthday}
                    onChange={(e) => setEditBirthday(e.target.value)}
                  />
                </div>
                <div className="auth-field">
                  <label>Instagram / Handle</label>
                  <input
                    type="text"
                    placeholder="mvbdstudio"
                    value={editHandle}
                    onChange={(e) => setEditHandle(e.target.value)}
                  />
                </div>
                <div className="auth-field">
                  <label>Phone</label>
                  <input
                    type="text"
                    placeholder="+880 ..."
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                  />
                </div>
                <div className="cp-actions">
                  <button className="mb-btn mb-btn-secondary" onClick={goBack}>Cancel</button>
                  <button className="mb-btn mb-btn-primary" onClick={handleSaveProfile} disabled={editBusy}>
                    {editBusy ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentView === "settings" && (
            <div className="mb-view active">
              <h1 className="mb-page-title">
                <svg viewBox="0 0 24 24">
                  <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
                </svg>
                Settings
              </h1>
              <div className="mb-card mb-settings-group">
                <div className="mb-card-title">Account</div>
                <div className="mb-setting-row" onClick={openEditProfile}>
                  <span className="mb-setting-ico">
                    <svg viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </span>
                  <div className="mb-setting-txt">
                    <h4>Edit Profile</h4>
                    <p>Name, bio, profile & cover photo</p>
                  </div>
                  <svg className="chev" viewBox="0 0 24 24">
                    <path d="M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6z" />
                  </svg>
                </div>
                <div className="mb-setting-row" onClick={handleResetPassword}>
                  <span className="mb-setting-ico">
                    <svg viewBox="0 0 24 24">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM9 8V6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9z" />
                    </svg>
                  </span>
                  <div className="mb-setting-txt">
                    <h4>Password & Security</h4>
                    <p>Reset password via email</p>
                  </div>
                  <svg className="chev" viewBox="0 0 24 24">
                    <path d="M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6z" />
                  </svg>
                </div>
              </div>
              <div className="mb-card mb-settings-group">
                <div className="mb-card-title">Preferences</div>
                <div className="mb-theme-row">
                  <div className="mb-setting-txt">
                    <h4>Dark Mode</h4>
                    <p>Switch between light and dark theme</p>
                  </div>
                  <label className="mb-switch">
                    <input
                      type="checkbox"
                      checked={theme === "dark"}
                      onChange={(e) => toggleTheme(e.target.checked)}
                    />
                    <span className="mb-slider" />
                  </label>
                </div>
              </div>
              <div className="mb-card mb-settings-group">
                <div className="mb-card-title">Support</div>
                <div className="mb-setting-row" onClick={handleSignOut}>
                  <span className="mb-setting-ico" style={{ background: "#fee2e2" }}>
                    <svg viewBox="0 0 24 24" fill="#dc2626">
                      <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                    </svg>
                  </span>
                  <div className="mb-setting-txt">
                    <h4 style={{ color: "#dc2626" }}>Log Out</h4>
                    <p>Sign out of your MeBook account</p>
                  </div>
                  <svg className="chev" viewBox="0 0 24 24">
                    <path d="M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6z" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {currentView === "mebook" && (
            <div className="mb-view active">
              <div className="mb-mebook-hero">
                <h2>📖 Welcome to MeBook</h2>
                <p>Your personal movie library, watchlist, and review hub.</p>
                <span className="mb-mebook-badge">🎬 Powered by MeBook Community</span>
              </div>
              <div className="mb-mebook-grid">
                <div className="mb-mebook-stat">
                  <div className="num">{myPosts.length}</div>
                  <div className="lbl">My Posts</div>
                </div>
                <div className="mb-mebook-stat">
                  <div className="num">{myFriends.length}</div>
                  <div className="lbl">Friends</div>
                </div>
                <div className="mb-mebook-stat">
                  <div className="num">{feed.length}</div>
                  <div className="lbl">Feed Posts</div>
                </div>
                <div className="mb-mebook-stat">
                  <div className="num">{requests.length}</div>
                  <div className="lbl">Pending Requests</div>
                </div>
              </div>
              <div className="mb-card" style={{ marginBottom: 16 }}>
                <div className="mb-card-title">🎬 Quick Actions</div>
                <div className="mb-mebook-list">
                  <div className="mb-mebook-item" onClick={openCreatePost}>
                    <div
                      style={{
                        width: 64, height: 84,
                        background: "linear-gradient(135deg,#16a34a,#0f172a)",
                        borderRadius: 8, display: "flex",
                        alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                      </svg>
                    </div>
                    <div className="mb-mebook-item-body">
                      <div className="mb-mebook-item-title">Add New Review</div>
                      <div className="mb-mebook-item-desc">
                        Share your thoughts on a movie you just watched.
                      </div>
                      <div className="mb-mebook-item-meta">Tap to create →</div>
                    </div>
                  </div>
                  <div className="mb-mebook-item" onClick={() => goTo("community")}>
                    <div
                      style={{
                        width: 64, height: 84,
                        background: "linear-gradient(135deg,#8b5cf6,#0f172a)",
                        borderRadius: 8, display: "flex",
                        alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
                        <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z" />
                      </svg>
                    </div>
                    <div className="mb-mebook-item-body">
                      <div className="mb-mebook-item-title">Visit Community</div>
                      <div className="mb-mebook-item-desc">
                        See what other movie lovers are talking about.
                      </div>
                      <div className="mb-mebook-item-meta">Explore →</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentView === "community" && (() => {
  // feed state থেকে official post filter করছি
  const officialPosts = feed.filter(
    (p) => p.isOfficial === true || p.authorId === "admin"
  )
  return (
    <div className="mb-view active">
      <div className="mb-community-hero">
        <h2>🎬 MeBook Community</h2>
        <p>Official posts, announcements and featured reviews from the MeBook team.</p>
      </div>
      <div>
        {officialPosts.length === 0 ? (
          <div className="mb-empty">
            <svg viewBox="0 0 24 24">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
            </svg>
            <b>No official posts yet</b>
            <p style={{ fontSize: 14, marginTop: 4 }}>
              Admin panel থেকে official post publish করলে এখানে দেখা যাবে।
            </p>
          </div>
        ) : (
          officialPosts.map((p) => renderPost(p))
        )}
      </div>
    </div>
  )
})()}
        </main>

        <aside className="mb-right">
          <div className="mb-card">
            <div className="mb-card-title">🔥 Trending Now</div>
            {[
              { img: "https://image.tmdb.org/t/p/w92/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg", seed: "m1", name: "Dune: Part Two", meta: "⭐ 8.7 • Sci-Fi" },
              { img: "https://image.tmdb.org/t/p/w92/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg", seed: "m2", name: "Oppenheimer", meta: "⭐ 8.5 • Biography" },
              { img: "https://image.tmdb.org/t/p/w92/1E5baAaEse26fej7uHcjOgEE2t2.jpg", seed: "m3", name: "Interstellar", meta: "⭐ 8.7 • Adventure" },
            ].map((m) => (
              <div className="mb-contact" key={m.name}>
                <img
                  src={m.img}
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = `https://picsum.photos/seed/${m.seed}/80`
                  }}
                />
                <div>
                  <div className="mb-contact-name">{m.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{m.meta}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mb-card">
            <div className="mb-card-title">👥 Online Friends</div>
            {onlineList.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--text-muted)", padding: 6 }}>
                No other users yet
              </div>
            ) : (
              onlineList.map((u) => {
                const photo = avatarUrl(u)
                return (
                  <div className="mb-contact" key={u.uid} onClick={() => startChat(u.uid, u.name, photo)}>
                    <img src={photo} alt="" />
                    <span className="mb-online" />
                    <div className="mb-contact-name">{u.name}</div>
                  </div>
                )
              })
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

/* ============================================================
SUB-COMPONENTS
============================================================ */

function SideItem({
  id,
  label,
  active,
  onClick,
  icon,
  badge,
}: {
  id: string
  label: string
  active: boolean
  onClick: (id: string) => void
  icon?: React.ReactNode
  badge?: number
}) {
  return (
    <button
      className={`mb-side-item${active ? " active" : ""}`}
      onClick={() => onClick(id)}
    >
      <span className="mb-side-ico">
        {icon || (
          <svg viewBox="0 0 24 24">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
        )}
      </span>
      {label}
      {badge && badge > 0 ? <span className="mb-side-badge">{badge}</span> : null}
    </button>
  )
    }
