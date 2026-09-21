"use client"

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react"

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
      getDoc: fsMod.getDoc,
      getDocs: fsMod.getDocs,
      addDoc: fsMod.addDoc,
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
CONSTANTS
============================================================ */

const CLOUD_NAME = "xtbkyhrl"
const UPLOAD_PRESET = "MeBook"

const LOGO_URL = "https://i.postimg.cc/g0pGNkxc/file-000000000bf482118c249820a099f2d4.png"
const HEADER_LOGO = "https://i.postimg.cc/rsBBsQWF/17832-removebg-preview.png"

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

async function cloudinaryUpload(file: File, onProgress?: (pct: number) => void): Promise<string> {
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`
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

/* ============ DARK MODE — LIQUID BLACK ============ */
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
.mebook-root.dark-mode .cmt-bubble{background:#141414;}
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
padding:80px 16px 0;
align-items:start;
min-height:100vh;
}
.mebook-root .mb-sidebar{
position:sticky;
top:80px;
align-self:start;
max-height:calc(100vh - 100px);
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
.mebook-root .mb-reacts{display:flex;align-items:center;gap:6px;}
.mebook-root .mb-react-pill{display:flex;align-items:center;gap:4px;background:linear-gradient(135deg,#ef4444,#f97316);color:#fff;font-size:11px;font-weight:700;padding:2px 8px 2px 4px;border-radius:12px;}
.mebook-root .mb-react-pill svg{width:13px;height:13px;fill:#fff;}
.mebook-root .mb-post-actions{display:flex;border-top:1px solid var(--border);margin:0 4px;padding:4px 0;}
.mebook-root .mb-action{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:9px;border-radius:8px;font-size:14.5px;font-weight:600;color:var(--text-muted);transition:background .18s,color .18s;}
.mebook-root .mb-action.liked{color:#ef4444;}
.mebook-root .mb-action svg{width:19px;height:19px;fill:currentColor;transition:transform .2s;}
.mebook-root .mb-action.liked svg{animation:likePop .4s ease;}
@keyframes likePop{0%{transform:scale(1);}50%{transform:scale(1.35);}100%{transform:scale(1);}}

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

/* ============ MESSAGES ============ */
.mebook-root .msgr-wrap{border-radius:12px;box-shadow:var(--shadow);height:calc(100vh - 160px);min-height:420px;display:flex;overflow:hidden;position:relative;}
.mebook-root .msgr-list{width:320px;border-right:1px solid var(--border);overflow-y:auto;flex-shrink:0;}
.mebook-root .msgr-list-head{padding:14px 16px 8px;font-size:20px;font-weight:800;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:var(--card);z-index:2;}
.mebook-root .msgr-section{font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.6px;padding:10px 16px 6px;}
.mebook-root .msgr-online-row{display:flex;gap:10px;overflow-x:auto;overflow-y:hidden;padding:4px 14px 12px;border-bottom:1px solid var(--border);scroll-behavior:smooth;-webkit-overflow-scrolling:touch;scrollbar-width:none;}
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
.mebook-root .msgr-head{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid var(--border);flex-shrink:0;}
.mebook-root .msgr-head-back{width:36px;height:36px;border-radius:50%;display:none;align-items:center;justify-content:center;color:var(--text);}
.mebook-root .msgr-head-back svg{width:22px;height:22px;fill:currentColor;}
.mebook-root .msgr-head img{width:40px;height:40px;border-radius:50%;object-fit:cover;background:#cbd5e1;}
.mebook-root .msgr-head-info{flex:1;min-width:0;}
.mebook-root .msgr-head-name{font-size:15px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.mebook-root .msgr-head-status{font-size:12.5px;color:#22c55e;display:flex;align-items:center;gap:5px;}
.mebook-root .msgr-head-status .dot{width:8px;height:8px;border-radius:50%;background:#22c55e;}
.mebook-root .msgr-head-btn{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--text-muted);}
.mebook-root .msgr-head-btn svg{width:20px;height:20px;fill:currentColor;}
.mebook-root .msgr-body{flex:1;overflow-y:auto;padding:14px 12px;background:var(--chat-body-bg);display:flex;flex-direction:column;gap:4px;}
.mebook-root .msgr-body::-webkit-scrollbar{width:6px;}
.mebook-root .msgr-body::-webkit-scrollbar-thumb{background:var(--border);border-radius:10px;}
.mebook-root .msgr-bubble-wrap{display:flex;align-items:flex-end;gap:6px;margin-top:2px;}
.mebook-root .msgr-bubble-wrap.me{justify-content:flex-end;}
.mebook-root .msgr-bubble-wrap.them{justify-content:flex-start;}
.mebook-root .msgr-bubble-avatar{width:28px;height:28px;border-radius:50%;object-fit:cover;flex-shrink:0;background:#cbd5e1;opacity:0;transition:opacity .2s;}
.mebook-root .msgr-bubble-wrap.show-avatar .msgr-bubble-avatar{opacity:1;}
.mebook-root .msgr-bubble{max-width:72%;padding:9px 14px;border-radius:20px;font-size:14.5px;line-height:1.4;word-wrap:break-word;white-space:pre-wrap;animation:bubbleIn .22s ease;}
@keyframes bubbleIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;}}
.mebook-root .msgr-bubble.me{background:linear-gradient(135deg,#16a34a,#22c55e);color:#fff;border-bottom-right-radius:6px;}
.mebook-root .msgr-bubble.them{color:var(--text);border-bottom-left-radius:6px;box-shadow:0 1px 2px rgba(0,0,0,.08);background:var(--bubble-them-bg);}
.mebook-root .msgr-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--text-muted);gap:10px;padding:24px;text-align:center;}
.mebook-root .msgr-empty svg{width:64px;height:64px;fill:var(--border);}
.mebook-root .msgr-empty b{font-size:16px;}
.mebook-root .msgr-input{display:flex;gap:8px;align-items:flex-end;padding:10px 12px 12px;border-top:1px solid var(--border);flex-shrink:0;}
.mebook-root .msgr-input-field{flex:1;border:none;border-radius:20px;padding:10px 14px;font-size:14.5px;outline:none;color:var(--text);resize:none;max-height:100px;font-family:inherit;line-height:1.4;background:var(--input-bg);}
.mebook-root .msgr-input-send{width:38px;height:38px;border-radius:50%;background:var(--green);color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:transform .12s;}
.mebook-root .msgr-input-send:active{transform:scale(.9);}
.mebook-root .msgr-input-send:disabled{opacity:.5;}
.mebook-root .msgr-input-send svg{width:18px;height:18px;fill:#fff;}
.mebook-root .msgr-wrap.mobile-on-window .msgr-list{display:none;}
.mebook-root .msgr-wrap.mobile-on-list .msgr-window{display:none;}
@media(max-width:820px){
.mebook-root .msgr-head-back{display:flex;}
.mebook-root .msgr-list{width:100%;border-right:none;}
.mebook-root .msgr-wrap{height:calc(100vh - 120px);border-radius:0;}
.mebook-root .msgr-wrap.mobile-on-window .msgr-window{display:flex;}
}

/* ============ COMMENTS PAGE ============ */
.mebook-root .cmt-page-wrap{border-radius:12px;box-shadow:var(--shadow);overflow:hidden;margin-bottom:16px;}
.mebook-root .cmt-page-head{padding:14px 16px;border-bottom:1px solid var(--border);font-size:16px;font-weight:700;}
.mebook-root .cmt-page-list{padding:14px 16px;max-height:480px;overflow-y:auto;}
.mebook-root .cmt-row{display:flex;gap:8px;margin-bottom:12px;animation:cmtIn .3s ease;}
@keyframes cmtIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;}}
.mebook-root .cmt-row-avatar{width:34px;height:34px;border-radius:50%;object-fit:cover;flex-shrink:0;background:#cbd5e1;}
.mebook-root .cmt-bubble{border-radius:16px 16px 16px 4px;padding:8px 12px;font-size:14px;line-height:1.42;color:var(--text);max-width:78%;word-wrap:break-word;white-space:pre-wrap;background:var(--input-bg);}
.mebook-root .cmt-bubble b{display:block;font-size:13px;font-weight:700;margin-bottom:2px;color:var(--text);}
.mebook-root .cmt-bubble .cmt-time{display:block;font-size:11px;color:var(--text-muted);margin-top:3px;font-weight:500;}
.mebook-root .cmt-empty{text-align:center;padding:40px 20px;color:var(--text-muted);font-size:14px;}
.mebook-root .cmt-input-wrap{display:flex;gap:8px;align-items:flex-end;padding:10px 14px 14px;border-top:1px solid var(--border);}
.mebook-root .cmt-input-avatar{width:34px;height:34px;border-radius:50%;object-fit:cover;flex-shrink:0;background:#cbd5e1;}
.mebook-root .cmt-input{flex:1;border:none;border-radius:20px;padding:10px 14px;font-size:14.5px;outline:none;color:var(--text);resize:none;max-height:120px;font-family:inherit;line-height:1.4;background:var(--input-bg);}
.mebook-root .cmt-send{width:38px;height:38px;border-radius:50%;background:var(--green);color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.mebook-root .cmt-send:disabled{opacity:.5;cursor:not-allowed;}
.mebook-root .cmt-send svg{width:18px;height:18px;fill:#fff;}

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
.mebook-root .notif-page-head{padding:16px;border-bottom:1px solid var(--border);font-size:18px;font-weight:800;display:flex;align-items:center;justify-content:space-between;}
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
.mebook-root .notif-dot{width:10px;height:10px;border-radius:50%;background:#22c55e;position:absolute;top:16px;right:16px;flex-shrink:0;}
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

/* ============================================================
   PROFILE PAGE — Facebook Style
   ============================================================ */
.mebook-root .mb-profile-head{
border-radius:12px;
box-shadow:var(--shadow);
margin-bottom:16px;
overflow:hidden;
position:relative;
}

.mebook-root .mb-profile-cover{
position:relative;
width:100%;
height:340px;
background:#0f172a;
cursor:pointer;
overflow:hidden;
}
.mebook-root .mb-profile-cover img{
width:100%;
height:100%;
object-fit:cover;
object-position:center;
display:block;
}
.mebook-root .mb-profile-cover::after{
content:'';
position:absolute;left:0;right:0;bottom:0;
height:55%;
pointer-events:none;
background:linear-gradient(
to bottom,
rgba(0,0,0,0) 0%,
rgba(0,0,0,0.10) 25%,
rgba(0,0,0,0.35) 55%,
rgba(0,0,0,0.65) 80%,
rgba(0,0,0,0.88) 100%
);
}
.mebook-root .mb-profile-cover-add{
position:absolute;inset:0;z-index:2;
display:flex;align-items:center;justify-content:center;
background:rgba(0,0,0,.35);color:#fff;font-weight:600;gap:8px;
opacity:0;transition:opacity .25s;
}
.mebook-root .mb-profile-cover:hover .mb-profile-cover-add{opacity:1;}
.mebook-root .mb-profile-cover-add svg{width:22px;height:22px;fill:#fff;}

.mebook-root .mb-profile-avatar-center{
position:relative;
display:flex;
justify-content:center;
margin-top:-90px;
z-index:3;
padding:0 20px;
}
.mebook-root .mb-profile-avatar-wrap{
position:relative;cursor:pointer;flex-shrink:0;
}
.mebook-root .mb-profile-avatar-wrap img{
width:180px;height:180px;
border-radius:50%;
object-fit:cover;
border:5px solid var(--card);
background:#cbd5e1;
box-shadow:0 6px 24px rgba(0,0,0,.45);
}
.mebook-root.dark-mode .mb-profile-avatar-wrap img{
border-color:#0a0a0a;
box-shadow:0 6px 28px rgba(0,0,0,.9);
}
.mebook-root .mb-profile-avatar-add{
position:absolute;inset:0;border-radius:50%;
display:flex;align-items:center;justify-content:center;
background:rgba(0,0,0,.45);
opacity:0;transition:opacity .25s;
}
.mebook-root .mb-profile-avatar-wrap:hover .mb-profile-avatar-add{opacity:1;}
.mebook-root .mb-profile-avatar-add svg{width:32px;height:32px;fill:#fff;}

.mebook-root .mb-profile-name-center{
text-align:center;
padding:16px 20px 4px;
}
.mebook-root .mb-profile-name{
font-size:32px;
font-weight:800;
line-height:1.2;
color:var(--text);
display:inline-flex;
align-items:center;
gap:8px;
flex-wrap:wrap;
justify-content:center;
}
.mebook-root .mb-profile-name svg{flex-shrink:0;}

.mebook-root .mb-profile-sub{
text-align:center;
font-size:15px;
color:var(--text-muted);
margin-top:6px;
font-weight:500;
letter-spacing:.2px;
}
.mebook-root .mb-profile-sub b{
color:var(--text);
font-weight:700;
}

.mebook-root .mb-profile-meta-row{
display:flex;
justify-content:center;
align-items:center;
gap:18px;
flex-wrap:wrap;
padding:10px 20px 4px;
font-size:14px;
color:var(--text-muted);
}
.mebook-root .mb-profile-meta-row span{
display:inline-flex;align-items:center;gap:5px;
}
.mebook-root .mb-profile-meta-row svg{
width:16px;height:16px;fill:currentColor;flex-shrink:0;
}

.mebook-root .mb-profile-friends-strip{
display:flex;
justify-content:center;
align-items:center;
gap:12px;
padding:14px 20px 6px;
flex-wrap:wrap;
}
.mebook-root .mb-profile-friends-avatars{
display:flex;
flex-shrink:0;
}
.mebook-root .mb-profile-friends-avatars img{
width:34px;height:34px;border-radius:50%;
object-fit:cover;background:#cbd5e1;
border:2px solid var(--card);
margin-left:-10px;
}
.mebook-root.dark-mode .mb-profile-friends-avatars img{border-color:#0a0a0a;}
.mebook-root .mb-profile-friends-avatars img:first-child{margin-left:0;}
.mebook-root .mb-profile-friends-text{
font-size:14px;
color:var(--text-muted);
text-align:left;
max-width:340px;
line-height:1.4;
}
.mebook-root .mb-profile-friends-text b{
color:var(--text);font-weight:700;
}

.mebook-root .mb-profile-actions{
display:flex;
justify-content:center;
gap:10px;
padding:16px 20px 18px;
flex-wrap:wrap;
}
.mebook-root .mb-profile-actions .mb-btn{
width:auto;
padding:11px 22px;
font-size:14.5px;
font-weight:700;
border-radius:10px;
display:inline-flex;
align-items:center;
gap:8px;
}
.mebook-root .mb-profile-actions .mb-btn svg{
width:18px;height:18px;fill:currentColor;
}
.mebook-root .mb-profile-btn-message{
background:#0084ff;color:#fff;
}
.mebook-root .mb-profile-btn-message:hover{filter:brightness(1.1);}
.mebook-root .mb-profile-btn-icon{
width:44px!important;padding:0!important;
justify-content:center;
background:var(--input-bg);
}

.mebook-root .mb-profile-things-common{
margin:0 20px 16px;
padding:14px 18px;
border-radius:12px;
background:var(--card);
border:1px solid var(--border);
}
.mebook-root.dark-mode .mb-profile-things-common{
background:#0a0a0a;
border-color:#1a1a1a;
}
.mebook-root .mb-profile-things-common-title{
font-size:15.5px;
font-weight:700;
color:var(--text);
display:flex;
align-items:center;
gap:10px;
margin-bottom:4px;
}
.mebook-root .mb-profile-things-common-title svg{
width:22px;height:22px;fill:var(--text);flex-shrink:0;
}
.mebook-root .mb-profile-things-common-body{
font-size:14px;color:var(--text-muted);margin-left:32px;
}

.mebook-root .mb-profile-tabs{
display:flex;
gap:6px;
padding:8px 20px 0;
border-top:1px solid var(--border);
}
.mebook-root .mb-profile-tab{
padding:12px 18px;
font-size:14.5px;
font-weight:600;
color:var(--text-muted);
border-radius:8px;
transition:background .18s,color .18s;
}
.mebook-root .mb-profile-tab:hover{background:var(--hover);}
.mebook-root .mb-profile-tab.active{
color:var(--green);
background:rgba(34,197,94,.10);
}

.mebook-root .mb-profile-section{
padding:16px 20px 8px;
}
.mebook-root .mb-profile-section h3{
font-size:16px;
font-weight:700;
color:var(--text);
margin-bottom:14px;
}
.mebook-root .mb-profile-detail{
display:flex;
align-items:center;
gap:14px;
padding:10px 0;
font-size:15px;
color:var(--text);
}
.mebook-root .mb-profile-detail svg{
width:22px;height:22px;
fill:var(--text-muted);
flex-shrink:0;
}
.mebook-root .mb-profile-detail span{
color:var(--text);
font-weight:500;
}

/* ============ PROFILE FRIENDS SECTION (NEW) ============ */
.mebook-root .mb-profile-friends-section{
padding:16px 20px 20px;
border-top:1px solid var(--border);
}
.mebook-root .mb-profile-friends-section-head{
display:flex;
align-items:center;
justify-content:space-between;
margin-bottom:14px;
}
.mebook-root .mb-profile-friends-section-head h3{
font-size:18px;
font-weight:800;
color:var(--text);
display:flex;
align-items:center;
gap:8px;
}
.mebook-root .mb-profile-friends-section-head .count{
font-size:13.5px;
font-weight:600;
color:var(--text-muted);
}
.mebook-root .mb-profile-friends-grid{
display:grid;
grid-template-columns:repeat(auto-fill,minmax(120px,1fr));
gap:12px;
}
.mebook-root .mb-profile-friend-card{
border-radius:12px;
overflow:hidden;
cursor:pointer;
transition:transform .2s,box-shadow .2s;
background:var(--input-bg);
}
.mebook-root .mb-profile-friend-card:hover{
transform:translateY(-3px);
box-shadow:var(--shadow-lg);
}
.mebook-root .mb-profile-friend-card img{
width:100%;
aspect-ratio:1;
object-fit:cover;
background:#cbd5e1;
display:block;
}
.mebook-root .mb-profile-friend-card-name{
padding:8px 10px 10px;
font-size:13.5px;
font-weight:700;
color:var(--text);
white-space:nowrap;
overflow:hidden;
text-overflow:ellipsis;
text-align:center;
}
.mebook-root .mb-profile-friends-empty{
text-align:center;
padding:30px 20px;
color:var(--text-muted);
font-size:14px;
}
.mebook-root .mb-profile-friends-loading{
text-align:center;
padding:30px 20px;
color:var(--text-muted);
font-size:14px;
}
@media(max-width:600px){
.mebook-root .mb-profile-friends-grid{
grid-template-columns:repeat(auto-fill,minmax(100px,1fr));
gap:10px;
}
}

/* ============ CARDS / SIDEBAR ============ */
.mebook-root .mb-right{position:sticky;top:80px;align-self:start;display:flex;flex-direction:column;gap:16px;max-height:calc(100vh - 100px);overflow-y:auto;scrollbar-width:none;}
.mebook-root .mb-right::-webkit-scrollbar{width:0;}
.mebook-root .mb-card{border-radius:12px;box-shadow:var(--shadow);padding:14px 16px;transition:background .3s;}
.mebook-root .mb-card-title{font-size:16px;font-weight:700;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;}
.mebook-root .mb-contact{display:flex;align-items:center;gap:10px;padding:8px;border-radius:8px;transition:background .18s;cursor:pointer;position:relative;}
.mebook-root .mb-contact img{width:36px;height:36px;border-radius:50%;object-fit:cover;background:#cbd5e1;}
.mebook-root .mb-contact-name{font-size:14.5px;font-weight:600;}
.mebook-root .mb-online{position:absolute;bottom:7px;left:34px;width:11px;height:11px;border-radius:50%;background:var(--green-light);border:2px solid var(--card);}
.mebook-root .mb-page-title{font-size:24px;font-weight:800;margin-bottom:16px;display:flex;align-items:center;gap:10px;color:var(--text);}
.mebook-root .mb-page-title svg{width:26px;height:26px;fill:var(--green);}
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
.mebook-root .mb-setting-row{display:flex;align-items:center;gap:14px;padding:14px 4px;border-bottom:1px solid var(--border);cursor:pointer;transition:background .18s;border-radius:8px;color:var(--text);}
.mebook-root .mb-setting-row:last-child{border-bottom:none;}
.mebook-root .mb-setting-ico{width:40px;height:40px;border-radius:50%;background:var(--input-bg);flex-shrink:0;display:flex;align-items:center;justify-content:center;}
.mebook-root .mb-setting-ico svg{width:20px;height:20px;fill:var(--text);}
.mebook-root .mb-setting-txt{flex:1;}
.mebook-root .mb-setting-txt h4{font-size:15px;font-weight:600;color:var(--text);}
.mebook-root .mb-setting-txt p{font-size:12.5px;color:var(--text-muted);margin-top:1px;}
.mebook-root .mb-setting-row .chev{width:18px;height:18px;fill:var(--text-muted);flex-shrink:0;}
.mebook-root .mb-theme-row{display:flex;align-items:center;justify-content:space-between;padding:14px 4px;color:var(--text);}
.mebook-root .mb-community-hero{background:linear-gradient(135deg,#0f172a 0%,#16a34a 100%);border-radius:12px;padding:26px 22px;color:#fff;margin-bottom:18px;box-shadow:var(--shadow);}
.mebook-root .mb-community-hero h2{font-size:23px;font-weight:800;}
.mebook-root .mb-community-hero p{font-size:14px;opacity:.85;margin-top:5px;}
.mebook-root .mb-mebook-hero{background:linear-gradient(135deg,#16a34a 0%,#0f172a 100%);border-radius:12px;padding:28px 22px;color:#fff;margin-bottom:18px;box-shadow:var(--shadow);position:relative;overflow:hidden;}
.mebook-root .mb-mebook-hero h2{font-size:24px;font-weight:800;position:relative;z-index:1;}
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
.mebook-root .mb-toast-container{position:fixed;top:80px;right:20px;z-index:6000;display:flex;flex-direction:column;gap:10px;pointer-events:none;max-width:360px;}
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
.mebook-root .mb-layout{grid-template-columns:minmax(0,1fr);padding:74px 10px 24px;}
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
}
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
  useEffect(() => {
    const timer = setTimeout(() => {
      setRemoving(true)
      setTimeout(() => onDone(toast.id), 350)
    }, 3000)
    return () => clearTimeout(timer)
  }, [toast.id, onDone])

  return (
    <div className={`mb-toast ${toast.type}${removing ? " removing" : ""}`}>
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
MAIN COMPONENT
============================================================ */

export default function MeBookPage() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

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
  const [communityFeed, setCommunityFeed] = useState<any[]>([])
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

  const [sentRequests, setSentRequests] = useState<Record<string, "sending" | "sent">>({})

  const [viewingUser, setViewingUser] = useState<any>(null)
  const [viewingUserPosts, setViewingUserPosts] = useState<any[]>([])
  // NEW: friends of the user whose profile is being viewed
  const [viewingUserFriends, setViewingUserFriends] = useState<any[]>([])
  const [viewingUserFriendsLoading, setViewingUserFriendsLoading] = useState(false)

  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadNotifCount, setUnreadNotifCount] = useState(0)

  const [friendsTab, setFriendsTab] = useState<"requests" | "sent" | "all" | "mutual">("requests")
  const [profileTab, setProfileTab] = useState<"all" | "photos" | "reels">("all")

  const [postText, setPostText] = useState("")
  const [postMovie, setPostMovie] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState("")
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [postBusy, setPostBusy] = useState(false)

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
  const [chatInput, setChatInput] = useState("")

  const [commentText, setCommentText] = useState("")
  const [commentBusy, setCommentBusy] = useState(false)
  const commentListRef = useRef<HTMLDivElement>(null)

  const [shareCaption, setShareCaption] = useState("")
  const [shareBusy, setShareBusy] = useState(false)

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

      const commQ = fb.query(fb.collection(fb.db, "posts"), fb.orderBy("createdAt", "desc"))
      unsubscribersRef.current.push(
        fb.onSnapshot(commQ, (snap: any) => {
          const arr: any[] = []
          snap.forEach((d: any) => arr.push({ id: d.id, ...d.data() }))
          setCommunityFeed(arr)
        })
      )

      const usersQ = fb.query(fb.collection(fb.db, "users"))
      unsubscribersRef.current.push(
        fb.onSnapshot(usersQ, (snap: any) => {
          const arr: any[] = []
          snap.forEach((d: any) => {
            if (d.id !== uid) arr.push({ uid: d.id, ...d.data() })
          })
          setFriends(arr)
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

      /* myFriends live listener — array-contains symmetric query */
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
              if (s.exists()) arr.push({ uid: s.id, ...s.data() })
            } catch {}
          }
          setMyFriends(arr)
        })
      )

      /* Legacy fallback — one-time migration */
      ;(async () => {
        try {
          const [s1, s2] = await Promise.all([
            fb.getDocs(fb.query(fb.collection(fb.db, "friends"), fb.where("a", "==", uid))),
            fb.getDocs(fb.query(fb.collection(fb.db, "friends"), fb.where("b", "==", uid))),
          ])

          const legacyDocs: any[] = []
          const legacyOtherIds = new Set<string>()

          const collect = (snap: any, otherField: "b" | "a") => {
            snap.forEach((d: any) => {
              const data = d.data()
              if (Array.isArray(data.members) && data.members.length > 0) return
              const otherId = data[otherField]
              if (!otherId) return
              legacyDocs.push({ id: d.id, a: data.a, b: data.b })
              legacyOtherIds.add(otherId)
            })
          }
          collect(s1, "b")
          collect(s2, "a")

          await Promise.all(
            legacyDocs.map((doc) =>
              fb.updateDoc(fb.doc(fb.db, "friends", doc.id), {
                members: [doc.a, doc.b].filter(Boolean),
              })
            )
          )

          if (legacyOtherIds.size > 0) {
            const arr: any[] = []
            for (const otherId of legacyOtherIds) {
              try {
                const s = await fb.getDoc(fb.doc(fb.db, "users", otherId))
                if (s.exists()) arr.push({ uid: s.id, ...s.data() })
              } catch {}
            }
            if (arr.length > 0) {
              setMyFriends((prev) => {
                const merged = new Map<string, any>()
                prev.forEach((f) => merged.set(f.uid, f))
                arr.forEach((f) => merged.set(f.uid, f))
                return Array.from(merged.values())
              })
            }
          }
        } catch (e) {
          console.warn("legacy friends migration skipped:", e)
        }
      })()

      const chatsQ = fb.query(fb.collection(fb.db, "chats"), fb.where("members", "array-contains", uid))
      unsubscribersRef.current.push(
        fb.onSnapshot(chatsQ, async (snap: any) => {
          const arr: any[] = []
          for (const d of snap.docs) {
            const data = d.data()
            const otherId = data.members.find((m: string) => m !== uid)
            if (!otherId) continue
            const s = await fb.getDoc(fb.doc(fb.db, "users", otherId))
            if (!s.exists()) continue
            arr.push({
              id: d.id,
              otherId,
              other: s.data(),
              last: data.lastMessage || "",
              lastAt: data.lastAt,
            })
          }
          arr.sort((a, b) => (b.lastAt?.seconds || 0) - (a.lastAt?.seconds || 0))
          setChats(arr)
        })
      )

      const notifQ = fb.query(
        fb.collection(fb.db, "notifications"),
        fb.where("uid", "==", uid)
      )
      unsubscribersRef.current.push(
        fb.onSnapshot(notifQ, (snap: any) => {
          const arr: any[] = []
          snap.forEach((d: any) => arr.push({ id: d.id, ...d.data() }))
          arr.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
          setNotifications(arr)
          setUnreadNotifCount(arr.filter((n) => !n.read).length)
        })
      )
    },
    [cleanupListeners]
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
            setUser(u)
            const p = snap.data()
            setProfile(p)
            setPrivacy(p.privacy || { info: true, posts: true, requests: true })
            setAuthBusy(false)

            const profileUnsub = fb.onSnapshot(userRef, (s: any) => {
              if (s.exists()) setProfile(s.data())
            })
            unsubscribersRef.current.push(profileUnsub)

            startAppListeners(u.uid)
          } else {
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
      if (e.key === "Escape") setMenuOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

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

  const goTo = (view: string, params: any = {}) => {
    setPageStack([{ view, params }])
    setDrawerOpen(false)
    setMenuOpen(false)
    if (view !== "messages") setMobileChatWindow(false)
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

  const handleLikePost = async (postId: string) => {
    try {
      const fb = await getFirebase()
      const ref = fb.doc(fb.db, "posts", postId)
      const snap = await fb.getDoc(ref)
      if (!snap.exists()) return
      const likes = snap.data().likes || []
      const has = likes.includes(user.uid)
      await fb.updateDoc(ref, {
        likes: has ? fb.arrayRemove(user.uid) : fb.arrayUnion(user.uid),
      })
      if (!has) {
        const post = snap.data()
        if (post.authorId && post.authorId !== user.uid && post.authorId !== "admin") {
          await fb.addDoc(fb.collection(fb.db, "notifications"), {
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

  const openComments = (post: any) => pushPage("comments", { postId: post.id })
  const openShare = (post: any) => pushPage("share", { postId: post.id })

  /* ============================================================
     UPDATED: openUserProfile
     Now ALSO loads the viewed user's friends list in real-time
     ============================================================ */
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
      setViewingUserFriends([])
      setViewingUserFriendsLoading(true)

      // Reset old subs
      if (viewingUserUnsubRef.current) {
        try { viewingUserUnsubRef.current() } catch {}
        viewingUserUnsubRef.current = null
      }
      if (viewingUserFriendsUnsubRef.current) {
        try { viewingUserFriendsUnsubRef.current() } catch {}
        viewingUserFriendsUnsubRef.current = null
      }

      // Load their posts
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

      // Load their friends (live)
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
      await fb.addDoc(fb.collection(fb.db, "posts"), {
        authorId: user.uid,
        authorName: profile.name,
        authorAvatar: profile.photoURL || "",
        verified: profile.verified === true,
        caption: text,
        movie,
        image: imageUrl,
        likes: [],
        comments: [],
        shares: 0,
        createdAt: fb.serverTimestamp(),
      })
      setPostText("")
      setPostMovie("")
      removePreview()
      setUploadProgress(null)
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
      const friendDocId = [user.uid, fromUid].sort().join("_")

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
    setActiveChat(chatId)
    setChatPartner({ ...other, uid: otherId })
    setMobileChatWindow(true)
    if (chatUnsubRef.current) {
      try { chatUnsubRef.current() } catch {}
      chatUnsubRef.current = null
    }
    const fb = await getFirebase()
    const q = fb.query(
      fb.collection(fb.db, "chats", chatId, "messages"),
      fb.orderBy("at", "asc")
    )
    chatUnsubRef.current = fb.onSnapshot(q, (snap: any) => {
      const arr: any[] = []
      snap.forEach((d: any) => arr.push({ id: d.id, ...d.data() }))
      setChatMessages(arr)
      setTimeout(() => {
        const body = document.getElementById("mebook-chat-body")
        if (body) body.scrollTop = body.scrollHeight
      }, 80)
    })
  }

  const handleSendMessage = async () => {
    const text = chatInput.trim()
    if (!text || !activeChat) return
    setChatInput("")
    try {
      const fb = await getFirebase()
      await fb.addDoc(fb.collection(fb.db, "chats", activeChat, "messages"), {
        from: user.uid,
        text,
        at: fb.serverTimestamp(),
      })
      await fb.updateDoc(fb.doc(fb.db, "chats", activeChat), {
        lastMessage: { text, from: user.uid },
        lastAt: fb.serverTimestamp(),
      })
    } catch (e: any) {
      showToast("Error", e.message, "error")
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

  const handleChangeProfilePhoto = () => {
    const inp = document.createElement("input")
    inp.type = "file"
    inp.accept = "image/*"
    inp.onchange = async () => {
      const f = inp.files?.[0]
      if (!f) return
      showToast("Uploading...", "Please wait", "info")
      try {
        const fb = await getFirebase()
        const url = await cloudinaryUpload(f)
        await fb.updateDoc(fb.doc(fb.db, "users", user.uid), { photoURL: url })
        setProfile({ ...profile, photoURL: url })
        showToast("Profile photo updated!", "Looking great", "success")
      } catch (e: any) {
        showToast("Upload failed", e.message, "error")
      }
    }
    inp.click()
  }

  const handleChangeCover = () => {
    const inp = document.createElement("input")
    inp.type = "file"
    inp.accept = "image/*"
    inp.onchange = async () => {
      const f = inp.files?.[0]
      if (!f) return
      showToast("Uploading...", "Please wait", "info")
      try {
        const fb = await getFirebase()
        const url = await cloudinaryUpload(f)
        await fb.updateDoc(fb.doc(fb.db, "users", user.uid), { coverURL: url })
        setProfile({ ...profile, coverURL: url })
        showToast("Cover photo updated!", "Your cover has been changed", "success")
      } catch (e: any) {
        showToast("Upload failed", e.message, "error")
      }
    }
    inp.click()
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

  const handleAddComment = async (postId: string) => {
    const text = commentText.trim()
    if (!text || commentBusy) return
    setCommentBusy(true)
    try {
      const fb = await getFirebase()
      const ref = fb.doc(fb.db, "posts", postId)
      const snap = await fb.getDoc(ref)
      await fb.updateDoc(ref, {
        comments: fb.arrayUnion({
          uid: user.uid,
          name: profile.name,
          avatar: profile.photoURL || "",
          text,
          at: Date.now(),
        }),
      })
      if (snap.exists()) {
        const post = snap.data()
        if (post.authorId && post.authorId !== user.uid && post.authorId !== "admin") {
          await fb.addDoc(fb.collection(fb.db, "notifications"), {
            uid: post.authorId,
            title: "New Comment",
            message: `${profile.name} commented on your post.`,
            type: "comment",
            read: false,
            createdAt: fb.serverTimestamp(),
          })
        }
      }
      setCommentText("")
      showToast("Comment added!", "Your comment is now visible", "success")
      setTimeout(() => {
        if (commentListRef.current) {
          commentListRef.current.scrollTop = commentListRef.current.scrollHeight
        }
      }, 100)
    } catch (e: any) {
      showToast("Error", e.message, "error")
    } finally {
      setCommentBusy(false)
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
        comments: [],
        shares: 0,
        createdAt: fb.serverTimestamp(),
      })
      await fb.updateDoc(fb.doc(fb.db, "posts", post.id), {
        shares: fb.increment(1),
      })
      if (post.authorId && post.authorId !== "admin") {
        await fb.addDoc(fb.collection(fb.db, "notifications"), {
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

  const avatarUrl = (u: any) =>
    u?.photoURL ||
    `https://ui-avatars.com/api/?background=16a34a&color=fff&name=${encodeURIComponent(u?.name || "User")}`

  const isVerified = (obj: any) => obj?.verified === true || obj?.isOfficial === true

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
  const renderPost = (post: any, isMine = false) => {
    const liked = Array.isArray(post.likes) && post.likes.includes(user?.uid)
    const likesCount = Array.isArray(post.likes) ? post.likes.length : 0
    const commentsCount = Array.isArray(post.comments) ? post.comments.length : 0
    const sharesCount = post.shares || 0
    const isOfficial = post.isOfficial === true
    const authorAvatar = isOfficial
      ? LOGO_URL
      : (post.authorAvatar ||
         `https://ui-avatars.com/api/?background=16a34a&color=fff&name=${encodeURIComponent(post.authorName || "User")}`)
    const timeText = post.timeText || timeAgo(post.createdAt)
    const postVerified = isVerified(post)

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
            <div className="mb-post-meta">
              {timeText}
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
          {isMine && (
            <button
              className="mb-post-more"
              onClick={() => handleDeletePost(post.id)}
              title="Delete"
            >
              <svg viewBox="0 0 24 24">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
              </svg>
            </button>
          )}
        </div>

        {post.caption && <div className="mb-post-caption">{post.caption}</div>}

        {post.image ? (
          <div className="mb-post-media">
            <span className="mb-movie-badge">
              <svg viewBox="0 0 24 24">
                <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
              </svg>
              {post.movie || "Movie"}
            </span>
            <img src={post.image} alt="post" loading="lazy" />
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
          <div className="mb-reacts">
            {likesCount ? (
              <span className="mb-react-pill">
                <svg viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                <span>{likesCount}</span>
              </span>
            ) : (
              <span style={{ fontSize: 13 }}>0 likes</span>
            )}
          </div>
          <div>
            {commentsCount} comments · {sharesCount} shares
          </div>
        </div>

        <div className="mb-post-actions">
          <button
            className={`mb-action${liked ? " liked" : ""}`}
            onClick={() => handleLikePost(post.id)}
          >
            <svg viewBox="0 0 24 24">
              <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91z" />
            </svg>
            Like
          </button>
          <button className="mb-action" onClick={() => openComments(post)}>
            <svg viewBox="0 0 24 24">
              <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z" />
            </svg>
            Comment
          </button>
          <button className="mb-action" onClick={() => openShare(post)}>
            <svg viewBox="0 0 24 24">
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
            </svg>
            Share
          </button>
        </div>
      </article>
    )
  }

  const unreadCount = chats.filter(
    (c) => c.last && (c.last as any).read === false && (c.last as any).from !== user.uid
  ).length

  const filteredFriends = friends.filter((f) => {
    const q = friendSearch.trim().toLowerCase()
    if (!q) return true
    return (
      (f.name || "").toLowerCase().includes(q) ||
      (f.email || "").toLowerCase().includes(q)
    )
  })

  const rootClass = `mebook-root ${theme === "dark" ? "dark-mode" : ""}`

  const findPost = (postId: string) =>
    feed.find((p) => p.id === postId) ||
    myPosts.find((p) => p.id === postId) ||
    viewingUserPosts.find((p) => p.id === postId)

  /* ============================================================
     UPDATED: renderProfilePage
     Now uses:
     - isOwn ? myFriends : viewingUserFriends  for friend count
     - Renders a "Friends" section at the bottom with a grid
     ============================================================ */
  const renderProfilePage = (
    u: any,
    posts: any[],
    isOwn: boolean,
    friendsList?: any[],
    friendsLoading?: boolean
  ) => {
    const photo = avatarUrl(u)
    // Pick correct friend list depending on whose profile this is
    const profileFriends = isOwn ? myFriends : (friendsList || [])
    const friendsCount = profileFriends.length
    const mutualCount = friendsCount
    const stripFriends = profileFriends.slice(0, 6)

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

        {/* ===== NEW: Friends section — visible to everyone ===== */}
        <div className="mb-profile-friends-section">
          <div className="mb-profile-friends-section-head">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
              Friends
            </h3>
            <span className="count">{friendsCount} total</span>
          </div>

          {friendsLoading ? (
            <div className="mb-profile-friends-loading">Loading friends...</div>
          ) : profileFriends.length === 0 ? (
            <div className="mb-profile-friends-empty">
              {isOwn ? "You don't have any friends yet" : "No friends to show"}
            </div>
          ) : (
            <div className="mb-profile-friends-grid">
              {profileFriends.map((f) => {
                const fPhoto = avatarUrl(f)
                return (
                  <div
                    className="mb-profile-friend-card"
                    key={f.uid}
                    onClick={() => openUserProfile(f.uid)}
                  >
                    <img src={fPhoto} alt={f.name} />
                    <div className="mb-profile-friend-card-name">
                      {f.name}
                      {isVerified(f) ? " ✓" : ""}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
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

      <header className="mb-header">
        <div className="mb-header-left" onClick={() => goTo("home")}>
          <img className="mb-header-logo" src={HEADER_LOGO} alt="MeBook" />
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

        <div className="mb-header-right">
          <button
            className="mb-icon-btn"
            title="Notifications"
            onClick={() => goTo("notifications")}
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
            className="mb-icon-btn"
            title="Messages"
            onClick={() => goTo("messages")}
          >
            <svg viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
            </svg>
            {unreadCount > 0 && <span className="mb-badge-dot">{unreadCount}</span>}
          </button>
          <button
            className="mb-icon-btn"
            title="Friends"
            onClick={() => goTo("friends")}
          >
            <svg viewBox="0 0 24 24">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
            {requests.length > 0 && (
              <span className="mb-badge-dot">{requests.length}</span>
            )}
          </button>
          <button
            className="mb-avatar-btn"
            title="Profile"
            onClick={() => goTo("profile")}
          >
            <img src={avatarUrl(profile)} alt="Profile" />
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
          <SideItem id="friends" label="Friends" active={currentView === "friends"} onClick={handleNavClick} badge={requests.length} />
          <SideItem id="messages" label="Messages" active={currentView === "messages"} onClick={handleNavClick} badge={unreadCount} />
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
              <div className="mb-composer">
                <div className="mb-composer-top">
                  <img className="mb-composer-avatar" src={avatarUrl(profile)} alt="You" />
                  <button className="mb-composer-input" onClick={openCreatePost}>
                    Share a movie screenshot or review...
                  </button>
                </div>
                <div className="mb-composer-actions">
                  <button className="mb-comp-action" onClick={openCreatePost}>
                    <svg viewBox="0 0 24 24" fill="#16a34a">
                      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                    </svg>
                    Photo
                  </button>
                  <button className="mb-comp-action" onClick={openCreatePost}>
                    <svg viewBox="0 0 24 24" fill="#f59e0b">
                      <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
                    </svg>
                    Movie Tag
                  </button>
                  <button className="mb-comp-action" onClick={openCreatePost}>
                    <svg viewBox="0 0 24 24" fill="#8b5cf6">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
                    </svg>
                    Review
                  </button>
                </div>
              </div>
              <div>
                {feed.length === 0 ? (
                  <div className="mb-loading">Loading feed...</div>
                ) : (
                  feed.map((p) => renderPost(p))
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
              <div className="notif-page-wrap">
                <div className="notif-page-head">
                  <span>{notifications.length} total</span>
                  {unreadNotifCount > 0 && (
                    <button className="notif-mark-all" onClick={markAllNotificationsRead}>
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="notif-list">
                  {notifications.length === 0 ? (
                    <div className="notif-empty">
                      <svg viewBox="0 0 24 24">
                        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                      </svg>
                      <b>No notifications yet</b>
                      <p>When someone likes, comments or sends a friend request, you'll see it here.</p>
                    </div>
                  ) : (
                    notifications.map((n) => {
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
                          onClick={() => !n.read && markNotificationRead(n.id)}
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
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
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
                      <div className="mb-search-box" style={{ marginBottom: 14 }}>
                        <svg viewBox="0 0 24 24">
                          <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                        </svg>
                        <input
                          type="text"
                          placeholder="Search your friends..."
                          value={friendSearch}
                          onChange={(e) => setFriendSearch(e.target.value)}
                        />
                      </div>
                      {myFriends.length === 0 ? (
                        <div className="mb-empty">
                          <b>No friends yet</b>
                          <p>Start sending friend requests to build your network!</p>
                        </div>
                      ) : (
                        <div className="fr-grid">
                          {myFriends.filter((f) => {
                            const q = friendSearch.trim().toLowerCase()
                            if (!q) return true
                            return (f.name || "").toLowerCase().includes(q)
                          }).map((f) => {
                            const photo = avatarUrl(f)
                            return (
                              <div className="fr-card" key={f.uid} onClick={() => openUserProfile(f.uid)}>
                                <img className="fr-card-img" src={photo} alt="" />
                                <div className="fr-card-info">
                                  <div className="fr-card-name">{f.name}{isVerified(f) && " ✓"}</div>
                                  <div className="fr-card-actions">
                                    <button
                                      className="mb-btn mb-btn-secondary"
                                      onClick={(e) => { e.stopPropagation(); startChat(f.uid, f.name, photo) }}
                                    >
                                      Message
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </>
                  )}

                  {friendsTab === "mutual" && (
                    <>
                      <div className="mb-search-box" style={{ marginBottom: 14 }}>
                        <svg viewBox="0 0 24 24">
                          <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                        </svg>
                        <input
                          type="text"
                          placeholder="Search all MeBook users..."
                          value={friendSearch}
                          onChange={(e) => setFriendSearch(e.target.value)}
                        />
                      </div>
                      {filteredFriends.length === 0 ? (
                        <div className="mb-empty"><b>No users found</b></div>
                      ) : (
                        <div className="fr-grid">
                          {filteredFriends.map((u) => {
                            const photo = avatarUrl(u)
                            const isFriend = myFriends.some((f) => f.uid === u.uid)
                            const hasPendingSent = sentFriendRequests.some((r) => r.to === u.uid && r.status === "pending")
                            return (
                              <div className="fr-card" key={u.uid} onClick={() => openUserProfile(u.uid)}>
                                <img className="fr-card-img" src={photo} alt="" />
                                <div className="fr-card-info">
                                  <div className="fr-card-name">{u.name}{isVerified(u) && " ✓"}</div>
                                  <div className="fr-card-actions">
                                    {isFriend ? (
                                      <button className="mb-btn mb-btn-primary" disabled>✓ Friends</button>
                                    ) : hasPendingSent ? (
                                      <button className="mb-btn mb-btn-secondary" disabled>Sent ✓</button>
                                    ) : (
                                      <button
                                        className="mb-btn mb-btn-primary"
                                        onClick={(e) => { e.stopPropagation(); handleSendRequest(u.uid) }}
                                      >
                                        Add Friend
                                      </button>
                                    )}
                                    <button
                                      className="mb-btn mb-btn-secondary"
                                      onClick={(e) => { e.stopPropagation(); startChat(u.uid, u.name, photo) }}
                                    >
                                      Message
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentView === "user-profile" && viewingUser && (
            <div className="mb-view active">
              <button className="mb-back-btn" onClick={goBack}>
                <svg viewBox="0 0 24 24">
                  <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                </svg>
                Back
              </button>
              {renderProfilePage(
                viewingUser,
                viewingUserPosts,
                false,
                viewingUserFriends,
                viewingUserFriendsLoading
              )}

              <div className="mb-card-title" style={{ fontSize: 18, marginBottom: 10, padding: "0 4px" }}>
                Posts ({viewingUserPosts.length})
              </div>
              <div>
                {viewingUserPosts.length === 0 ? (
                  <div className="mb-empty">
                    <b>No posts yet</b>
                    <p style={{ fontSize: 14, marginTop: 4 }}>This user hasn't posted anything</p>
                  </div>
                ) : (
                  viewingUserPosts.map((p) => renderPost(p))
                )}
              </div>
            </div>
          )}

          {currentView === "messages" && (
            <div className="mb-view active">
              <h1 className="mb-page-title" style={{ marginBottom: 12 }}>
                <svg viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                </svg>
                Messages
              </h1>
              <div className={`msgr-wrap ${mobileChatWindow && chatPartner ? "mobile-on-window" : "mobile-on-list"}`}>
                <div className="msgr-list">
                  <div className="msgr-list-head"><span>Chats</span></div>
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
                  <div className="msgr-section">Recent</div>
                  {chats.length === 0 ? (
                    <div style={{ padding: 20, color: "var(--text-muted)", fontSize: 14, textAlign: "center" }}>
                      No conversations yet. Start one from Friends page!
                    </div>
                  ) : (
                    chats.map((c) => {
                      const photo = avatarUrl(c.other)
                      const isActive = activeChat === c.id
                      return (
                        <div className={`msgr-item ${isActive ? "active" : ""}`} key={c.id} onClick={() => openChat(c.id, c.otherId, c.other)}>
                          <div className="msgr-item-avatar-wrap">
                            <img src={photo} alt="" />
                            <span className="msgr-item-dot" />
                          </div>
                          <div className="msgr-item-body">
                            <div className="msgr-item-name">{c.other.name}</div>
                            <div className={`msgr-item-last ${unreadCount > 0 ? "unread" : ""}`}>
                              {(c.last as any)?.text || "Say hi 👋"}
                            </div>
                          </div>
                          <div className="msgr-item-time">{c.lastAt ? timeShort(c.lastAt) : ""}</div>
                        </div>
                      )
                    })
                  )}
                </div>
                <div className="msgr-window">
                  {!activeChat || !chatPartner ? (
                    <div className="msgr-empty">
                      <svg viewBox="0 0 24 24">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                      </svg>
                      <b>Select a conversation</b>
                      <p>Choose someone from the list to start chatting</p>
                    </div>
                  ) : (
                    <>
                      <div className="msgr-head">
                        <button className="msgr-head-back" onClick={() => setMobileChatWindow(false)}>
                          <svg viewBox="0 0 24 24">
                            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                          </svg>
                        </button>
                        <img src={avatarUrl(chatPartner)} alt="" />
                        <div className="msgr-head-info">
                          <div className="msgr-head-name">{chatPartner.name}</div>
                          <div className="msgr-head-status"><span className="dot" /> Active now</div>
                        </div>
                        <button className="msgr-head-btn" onClick={() => openUserProfile(chatPartner.uid)}>
                          <svg viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                          </svg>
                        </button>
                      </div>
                      <div className="msgr-body" id="mebook-chat-body">
                        {chatMessages.length === 0 ? (
                          <div className="msgr-empty" style={{ padding: 40 }}>
                            <b>No messages yet</b>
                            <p>Say hi 👋</p>
                          </div>
                        ) : (
                          chatMessages.map((m, idx) => {
                            const mine = m.from === user.uid
                            const prevMsg = idx > 0 ? chatMessages[idx - 1] : null
                            const showAvatar = !mine && (!prevMsg || prevMsg.from !== m.from)
                            return (
                              <div key={m.id} className={`msgr-bubble-wrap ${mine ? "me" : "them"} ${showAvatar ? "show-avatar" : ""}`}>
                                {!mine && <img className="msgr-bubble-avatar" src={avatarUrl(chatPartner)} alt="" />}
                                <div className={`msgr-bubble ${mine ? "me" : "them"}`}>{m.text}</div>
                              </div>
                            )
                          })
                        )}
                      </div>
                      <div className="msgr-input">
                        <textarea
                          className="msgr-input-field"
                          placeholder="Aa"
                          rows={1}
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault()
                              handleSendMessage()
                            }
                          }}
                        />
                        <button className="msgr-input-send" onClick={handleSendMessage} disabled={!chatInput.trim()}>
                          <svg viewBox="0 0 24 24">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentView === "create-post" && (
            <div className="mb-view active">
              <button className="mb-back-btn" onClick={goBack}>
                <svg viewBox="0 0 24 24">
                  <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                </svg>
                Back
              </button>
              <div className="cp-page">
                <h1 className="mb-page-title">Create Post</h1>
                <div className="cp-card">
                  <div className="cp-user">
                    <img src={avatarUrl(profile)} alt="You" />
                    <div>
                      <b>{profile.name}</b>
                      <small style={{ display: "block" }}>Public</small>
                    </div>
                  </div>
                  <textarea
                    className="cp-textarea"
                    placeholder="What's your take on this movie? Share your review..."
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                    autoFocus
                  />
                  <div className="cp-movie-tag">
                    <svg viewBox="0 0 24 24">
                      <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Movie name (e.g. Interstellar)"
                      value={postMovie}
                      onChange={(e) => setPostMovie(e.target.value)}
                    />
                  </div>
                  {!previewUrl ? (
                    <div>
                      <div className="cp-upload-box" onClick={() => document.getElementById("mebook-file-input")?.click()}>
                        <svg viewBox="0 0 24 24">
                          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                        </svg>
                        <b>Add movie screenshot / photo</b>
                        <small>PNG, JPG up to 10MB</small>
                      </div>
                      <input
                        type="file"
                        id="mebook-file-input"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handlePreviewFile}
                      />
                    </div>
                  ) : (
                    <div className="cp-preview">
                      <img src={previewUrl} alt="preview" />
                      <button className="cp-preview-remove" onClick={removePreview}>
                        <svg viewBox="0 0 24 24">
                          <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                      </button>
                    </div>
                  )}
                  {uploadProgress !== null && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${uploadProgress}%`, background: "var(--green)", transition: "width .3s ease" }} />
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Uploading... {uploadProgress}%</div>
                    </div>
                  )}
                  <div className="cp-actions">
                    <button className="mb-btn mb-btn-secondary" onClick={goBack}>Cancel</button>
                    <button className="mb-btn mb-btn-primary" onClick={handleSubmitPost} disabled={postBusy}>
                      {postBusy ? "Posting..." : "Post"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
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
            return (
              <div className="mb-view active">
                <button className="mb-back-btn" onClick={goBack}>
                  <svg viewBox="0 0 24 24">
                    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                  </svg>
                  Back
                </button>
                <h1 className="mb-page-title">Comments</h1>
                {renderPost(post)}
                <div className="cmt-page-wrap">
                  <div className="cmt-page-head">{post.comments?.length || 0} Comments</div>
                  <div className="cmt-page-list" ref={commentListRef}>
                    {!post.comments?.length ? (
                      <div className="cmt-empty">
                        <b>No comments yet</b>
                        <p style={{ marginTop: 6 }}>Be the first to comment</p>
                      </div>
                    ) : (
                      post.comments.map((c: any, i: number) => {
                        const avatar = c.avatar || `https://ui-avatars.com/api/?background=16a34a&color=fff&name=${encodeURIComponent(c.name || "U")}`
                        return (
                          <div className="cmt-row" key={i}>
                            <img className="cmt-row-avatar" src={avatar} alt="" />
                            <div className="cmt-bubble">
                              <b>{c.name || "User"}</b>
                              {c.text || ""}
                              <span className="cmt-time">{timeAgo(c.at)}</span>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                  <div className="cmt-input-wrap">
                    <img className="cmt-input-avatar" src={avatarUrl(profile)} alt="" />
                    <textarea
                      className="cmt-input"
                      rows={1}
                      placeholder="Write a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleAddComment(post.id)
                        }
                      }}
                    />
                    <button className="cmt-send" onClick={() => handleAddComment(post.id)} disabled={!commentText.trim() || commentBusy}>
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
              {renderProfilePage(profile, myPosts, true)}

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

              <div className="mb-card-title" style={{ fontSize: 18, marginBottom: 10, padding: "0 4px" }}>
                My Posts
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
                  myPosts.map((p) => renderPost(p, true))
                )}
              </div>
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

          {currentView === "community" && (
            <div className="mb-view active">
              <div className="mb-community-hero">
                <h2>🎬 MeBook Community</h2>
                <p>Official posts, announcements and featured reviews from the MeBook team.</p>
              </div>
              <div>
                {communityFeed.filter((p) => p.isOfficial === true).length === 0 ? (
                  renderPost({
                    id: "comm-1",
                    authorId: "admin",
                    authorName: "MeBook Official",
                    authorAvatar: LOGO_URL,
                    verified: true,
                    isOfficial: true,
                    caption:
                      "🎉 Welcome to the MeBook Community! Share your favourite movie screenshots & reviews. Use #MeBookReview to get featured!",
                    movie: "Community Announcement",
                    image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=900&q=80",
                    likes: [],
                    comments: [],
                    shares: 0,
                    timeText: "just now",
                  })
                ) : (
                  communityFeed.filter((p) => p.isOfficial === true).map((p) => renderPost(p))
                )}
              </div>
            </div>
          )}
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
