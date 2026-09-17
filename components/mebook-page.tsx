"use client"

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react"

/* ============================================================
   FIREBASE (client-only)
============================================================ */

let firebaseInitialized = false
let app: any = null
let auth: any = null
let db: any = null
let fbMods: any = null

async function initFirebase() {
  if (firebaseInitialized) return { app, auth, db, fbMods }

  const appMod = await import(
    "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js" as any
  )
  const authMod = await import(
    "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js" as any
  )
  const fsMod = await import(
    "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js" as any
  )

  const firebaseConfig = {
    apiKey: "AIzaSyBtBaUSIlXwJDWytaiOfal3ha7OmZEwuYM",
    authDomain: "mvbdminiapp.firebaseapp.com",
    projectId: "mvbdminiapp",
    storageBucket: "mvbdminiapp.firebasestorage.app",
    messagingSenderId: "668051748254",
    appId: "1:668051748254:web:d4804b68429d853a0c928f",
    measurementId: "G-HQZ9SL4RX8",
  }

  app = appMod.initializeApp(firebaseConfig)
  auth = authMod.getAuth(app)
  db = fsMod.getFirestore(app)
  fbMods = { ...authMod, ...fsMod }

  firebaseInitialized = true
  return { app, auth, db, fbMods }
}

/* ============================================================
   CONSTANTS
============================================================ */

const CLOUD_NAME = "xtbkyhrl"
const UPLOAD_PRESET = "MeBook"

const LOGO_URL =
  "https://i.postimg.cc/1XQQ8qRK/file-00000000b2708211900200b56e0579e1.png"

/* ============================================================
   HELPERS
============================================================ */

function esc(s: any) {
  return String(s || "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[c] as string)
  )
}

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

function friendlyErr(err: any) {
  const m = err?.code || ""
  if (m.includes("invalid-credential") || m.includes("wrong-password"))
    return "Wrong email or password"
  if (m.includes("user-not-found"))
    return "No account found with this email"
  if (m.includes("email-already-in-use"))
    return "This email is already registered"
  if (m.includes("weak-password")) return "Password too weak (min 6 chars)"
  if (m.includes("invalid-email")) return "Invalid email address"
  if (m.includes("popup-closed")) return "Popup closed"
  if (m.includes("network")) return "Network error"
  return err?.message || "Something went wrong"
}

function chatIdFor(uid1: string, uid2: string) {
  return [uid1, uid2].sort().join("_")
}

async function cloudinaryUpload(
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> {
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`
  const fd = new FormData()
  fd.append("file", file)
  fd.append("upload_preset", UPLOAD_PRESET)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("POST", url)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress)
        onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      try {
        const res = JSON.parse(xhr.responseText)
        if (res.secure_url) resolve(res.secure_url)
        else reject(new Error(res.error?.message || "Upload failed"))
      } catch (err) {
        reject(err)
      }
    }
    xhr.onerror = () => reject(new Error("Network error"))
    xhr.send(fd)
  })
}

/* ============================================================
   CSS — everything scoped under .mebook-root
============================================================ */

const MEBOOK_CSS = `
  .mebook-root {
    --green:#16a34a;
    --green-dark:#15803d;
    --green-light:#22c55e;
    --bg:#f0f2f5;
    --card:#ffffff;
    --text:#1c1e21;
    --text-muted:#65676b;
    --border:#dddfe2;
    --hover:#f2f2f2;
    --shadow:0 1px 2px rgba(0,0,0,.1), 0 2px 8px rgba(0,0,0,.06);
    --shadow-lg:0 12px 32px rgba(0,0,0,.15);
    --input-bg:#f0f2f5;
    --header-bg:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);
    --drawer-bg:rgba(255,255,255,.62);
    --nav-item-bg:rgba(255,255,255,.35);
    --nav-item-hover:rgba(255,255,255,.75);
    --modal-bg:#ffffff;
    --chat-body-bg:#f7f8fa;
    --bubble-them-bg:#ffffff;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    transition: background .3s ease, color .3s ease;
    font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
    -webkit-font-smoothing:antialiased;
    position: relative;
  }

  .mebook-root.dark-mode {
    --green:#22c55e;
    --green-dark:#4ade80;
    --green-light:#86efac;
    --bg:#0a0f1a;
    --card:#111827;
    --text:#f3f4f6;
    --text-muted:#9ca3af;
    --border:#2d3748;
    --hover:#1f2937;
    --shadow:0 1px 2px rgba(0,0,0,.4), 0 2px 8px rgba(0,0,0,.3);
    --shadow-lg:0 12px 32px rgba(0,0,0,.5);
    --input-bg:#1f2937;
    --header-bg:linear-gradient(135deg,#020617 0%,#0f172a 100%);
    --drawer-bg:rgba(17,24,39,.7);
    --nav-item-bg:rgba(255,255,255,.08);
    --nav-item-hover:rgba(255,255,255,.15);
    --modal-bg:#111827;
    --chat-body-bg:#0f172a;
    --bubble-them-bg:#1f2937;
  }

  .mebook-root *{margin:0;padding:0;box-sizing:border-box;}
  .mebook-root button{font-family:inherit;cursor:pointer;border:none;background:none;}
  .mebook-root input,.mebook-root textarea{font-family:inherit;color:var(--text);}
  .mebook-root img{display:block;}
  .mebook-root a{text-decoration:none;color:inherit;}

  /* AUTH */
  .mebook-root .auth-wrap{
    position:fixed;inset:0;z-index:5000;
    background:linear-gradient(135deg,#0f172a 0%,#1e293b 60%,#16a34a 140%);
    display:flex;align-items:center;justify-content:center;padding:20px;
    overflow:hidden;
  }
  .mebook-root .auth-wrap::before{
    content:'';position:absolute;width:200%;height:200%;top:-50%;left:-50%;
    background: radial-gradient(circle at 20% 30%, rgba(22,163,74,.25) 0%, transparent 50%),
                radial-gradient(circle at 80% 70%, rgba(59,130,246,.2) 0%, transparent 50%),
                radial-gradient(circle at 50% 50%, rgba(168,85,247,.15) 0%, transparent 50%);
    animation: authGlow 12s ease-in-out infinite;z-index:0;
  }
  @keyframes authGlow{
    0%,100%{transform:translate(0,0) scale(1);}
    33%{transform:translate(-5%,5%) scale(1.1);}
    66%{transform:translate(5%,-5%) scale(.95);}
  }
  .mebook-root .auth-wrap::after{
    content:'';position:absolute;inset:0;
    background-image:
      radial-gradient(2px 2px at 20% 30%, rgba(255,255,255,.3), transparent),
      radial-gradient(2px 2px at 40% 70%, rgba(255,255,255,.2), transparent),
      radial-gradient(2px 2px at 60% 20%, rgba(255,255,255,.3), transparent),
      radial-gradient(2px 2px at 80% 80%, rgba(255,255,255,.2), transparent),
      radial-gradient(2px 2px at 10% 90%, rgba(255,255,255,.25), transparent),
      radial-gradient(2px 2px at 90% 10%, rgba(255,255,255,.3), transparent);
    background-size:200% 200%;animation:starDrift 20s linear infinite;z-index:0;pointer-events:none;
  }
  @keyframes starDrift{0%{background-position:0% 0%;}100%{background-position:100% 100%;}}
  .mebook-root .auth-card{
    background:#fff;border-radius:16px;box-shadow:var(--shadow-lg);
    width:100%;max-width:420px;padding:32px 28px;position:relative;z-index:1;
    animation:cardFloat .8s ease-out;background:rgba(255,255,255,.98);
    backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.3);
  }
  @keyframes cardFloat{from{opacity:0;transform:translateY(30px) scale(.96);}to{opacity:1;transform:translateY(0) scale(1);}}
  .mebook-root .auth-logo{display:flex;align-items:center;gap:10px;justify-content:center;margin-bottom:6px;}
  .mebook-root .auth-logo img{width:44px;height:44px;object-fit:contain;}
  .mebook-root .auth-logo .mb-logo-text{font-size:26px;}
  .mebook-root .auth-logo .me{color:var(--green);}
  .mebook-root .auth-logo .book{color:#0f172a;}
  .mebook-root .auth-sub{text-align:center;color:var(--text-muted);font-size:13.5px;margin-bottom:22px;}
  .mebook-root .auth-tabs{display:flex;background:#f0f2f5;border-radius:10px;padding:4px;margin-bottom:18px;}
  .mebook-root .auth-tab{flex:1;padding:9px;border-radius:8px;font-size:14.5px;font-weight:600;color:var(--text-muted);transition:all .2s ease;}
  .mebook-root .auth-tab.active{background:#fff;color:var(--green-dark);box-shadow:0 1px 3px rgba(0,0,0,.08);}
  .mebook-root .auth-field{margin-bottom:12px;}
  .mebook-root .auth-field label{display:block;font-size:13px;font-weight:600;margin-bottom:5px;color:#374151;}
  .mebook-root .auth-field input{width:100%;padding:11px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:14.5px;outline:none;transition:border-color .2s ease,box-shadow .2s ease;background:var(--input-bg);color:var(--text);}
  .mebook-root .auth-field input:focus{border-color:var(--green);box-shadow:0 0 0 3px rgba(22,163,74,.12);}
  .mebook-root .auth-btn{width:100%;padding:12px;border-radius:10px;font-size:15px;font-weight:700;background:var(--green);color:#fff;margin-top:6px;transition:filter .2s ease;}
  .mebook-root .auth-btn:hover{filter:brightness(1.08);}
  .mebook-root .auth-btn:disabled{opacity:.65;cursor:not-allowed;}
  .mebook-root .auth-divider{display:flex;align-items:center;gap:10px;margin:18px 0;color:#9ca3af;font-size:12.5px;}
  .mebook-root .auth-divider::before,.mebook-root .auth-divider::after{content:"";flex:1;height:1px;background:var(--border);}
  .mebook-root .auth-google{width:100%;padding:11px;border-radius:10px;font-size:14.5px;font-weight:600;background:#fff;color:#374151;border:1.5px solid var(--border);display:flex;align-items:center;justify-content:center;gap:10px;transition:background .18s ease;}
  .mebook-root .auth-google:hover{background:#f9fafb;}
  .mebook-root .auth-google svg{width:19px;height:19px;}
  .mebook-root .auth-err{background:#fef2f2;color:#dc2626;font-size:13px;padding:9px 12px;border-radius:8px;margin-top:10px;display:none;}
  .mebook-root .auth-err.show{display:block;}

  /* HEADER */
  .mebook-root .mb-header{
    position:sticky;top:0;left:0;right:0;height:60px;z-index:1000;
    background:var(--header-bg);
    display:flex;align-items:center;justify-content:space-between;
    padding:0 16px;box-shadow:0 2px 12px rgba(0,0,0,.18);
    transition:background .3s ease;
  }
  .mebook-root .mb-header-left{display:flex;align-items:center;gap:10px;}
  .mebook-root .mb-logo-img{width:38px;height:38px;object-fit:contain;border-radius:9px;background:rgba(255,255,255,.08);padding:4px;}
  .mebook-root .mb-logo-text{font-size:22px;font-weight:800;letter-spacing:-.5px;user-select:none;}
  .mebook-root .mb-logo-text .me{color:var(--green-light);}
  .mebook-root .mb-logo-text .book{color:#ffffff;}
  .mebook-root .mb-header-right{display:flex;align-items:center;gap:8px;}
  .mebook-root .mb-icon-btn{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.1);transition:background .2s ease,transform .15s ease;color:#e4e6eb;position:relative;}
  .mebook-root .mb-icon-btn:hover{background:rgba(255,255,255,.2);}
  .mebook-root .mb-icon-btn:active{transform:scale(.93);}
  .mebook-root .mb-icon-btn svg{width:20px;height:20px;fill:currentColor;}
  .mebook-root .mb-badge-dot{position:absolute;top:6px;right:6px;min-width:16px;height:16px;background:#ef4444;color:#fff;font-size:10px;font-weight:700;border-radius:8px;display:flex;align-items:center;justify-content:center;padding:0 4px;border:2px solid #1e293b;}
  .mebook-root .mb-avatar-btn{width:40px;height:40px;border-radius:50%;overflow:hidden;border:2px solid rgba(255,255,255,.3);transition:border-color .2s ease,transform .15s ease;padding:0;background:#334155;}
  .mebook-root .mb-avatar-btn:hover{border-color:var(--green-light);}
  .mebook-root .mb-avatar-btn:active{transform:scale(.93);}
  .mebook-root .mb-avatar-btn img{width:100%;height:100%;object-fit:cover;}

  /* LAYOUT */
  .mebook-root .mb-layout{display:grid;grid-template-columns:280px minmax(0,1fr) 300px;gap:20px;max-width:1400px;margin:0 auto;padding:20px 16px 40px;align-items:start;}
  .mebook-root .mb-layout.full{grid-template-columns:280px minmax(0,1fr);}
  .mebook-root .mb-sidebar{position:sticky;top:80px;}
  .mebook-root .mb-side-item{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:10px;font-size:15px;font-weight:600;color:var(--text);transition:background .18s ease;width:100%;text-align:left;}
  .mebook-root .mb-side-item:hover{background:var(--hover);}
  .mebook-root .mb-side-item.active{background:var(--green);color:#fff;}
  .mebook-root .mb-side-ico{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--border);flex-shrink:0;}
  .mebook-root .mb-side-item.active .mb-side-ico{background:rgba(255,255,255,.2);}
  .mebook-root .mb-side-ico svg{width:20px;height:20px;fill:var(--text);}
  .mebook-root .mb-side-item.active .mb-side-ico svg{fill:#fff;}
  .mebook-root .mb-side-divider{height:1px;background:var(--border);margin:8px 4px;}
  .mebook-root .mb-main{min-width:0;}

  /* COMPOSER */
  .mebook-root .mb-composer{background:var(--card);border-radius:12px;box-shadow:var(--shadow);padding:12px 16px 10px;margin-bottom:16px;transition:background .3s ease;}
  .mebook-root .mb-composer-top{display:flex;gap:10px;align-items:center;}
  .mebook-root .mb-composer-avatar{width:40px;height:40px;border-radius:50%;object-fit:cover;background:#cbd5e1;flex-shrink:0;}
  .mebook-root .mb-composer-input{flex:1;background:var(--input-bg);border:none;border-radius:24px;padding:11px 16px;font-size:15px;color:var(--text);outline:none;cursor:pointer;transition:background .2s ease;text-align:left;}
  .mebook-root .mb-composer-input:hover{background:var(--border);}
  .mebook-root .mb-composer-input::placeholder{color:var(--text-muted);}
  .mebook-root .mb-composer-actions{display:flex;gap:6px;margin-top:10px;padding-top:10px;border-top:1px solid var(--border);}
  .mebook-root .mb-comp-action{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:8px;border-radius:8px;font-size:14px;font-weight:600;color:var(--text-muted);transition:background .18s ease;}
  .mebook-root .mb-comp-action:hover{background:var(--hover);}
  .mebook-root .mb-comp-action svg{width:20px;height:20px;}

  /* POST */
  .mebook-root .mb-post{background:var(--card);border-radius:12px;box-shadow:var(--shadow);margin-bottom:16px;overflow:hidden;animation:postIn .35s cubic-bezier(.2,.8,.3,1);transition:background .3s ease;}
  @keyframes postIn{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:none;}}
  .mebook-root .mb-post-head{display:flex;align-items:center;gap:10px;padding:12px 16px 8px;}
  .mebook-root .mb-post-head-avatar{width:42px;height:42px;border-radius:50%;object-fit:cover;background:#cbd5e1;cursor:pointer;transition:transform .15s ease;}
  .mebook-root .mb-post-head-avatar:hover{transform:scale(1.05);}
  .mebook-root .mb-post-head-info{flex:1;min-width:0;}
  .mebook-root .mb-post-author{font-size:15px;font-weight:700;cursor:pointer;line-height:1.3;display:flex;align-items:center;gap:5px;}
  .mebook-root .mb-post-author:hover{text-decoration:underline;}
  .mebook-root .mb-post-meta{font-size:12.5px;color:var(--text-muted);display:flex;align-items:center;gap:5px;margin-top:1px;}
  .mebook-root .mb-post-meta .globe{width:12px;height:12px;fill:currentColor;}
  .mebook-root .mb-post-more{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--text-muted);transition:background .18s ease;}
  .mebook-root .mb-post-more:hover{background:var(--hover);}
  .mebook-root .mb-post-more svg{width:20px;height:20px;fill:currentColor;}
  .mebook-root .mb-post-caption{padding:2px 16px 10px;font-size:15px;line-height:1.45;color:var(--text);}
  .mebook-root .mb-post-media{background:#000;position:relative;max-height:560px;overflow:hidden;}
  .mebook-root .mb-post-media img{width:100%;max-height:560px;object-fit:contain;margin:0 auto;}
  .mebook-root .mb-movie-badge{position:absolute;top:12px;left:12px;display:flex;align-items:center;gap:6px;background:rgba(0,0,0,.68);backdrop-filter:blur(6px);color:#fff;font-size:12px;font-weight:600;padding:5px 10px;border-radius:20px;letter-spacing:.2px;}
  .mebook-root .mb-movie-badge svg{width:14px;height:14px;fill:#fbbf24;}
  .mebook-root .mb-post-stats{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;font-size:13.5px;color:var(--text-muted);}
  .mebook-root .mb-reacts{display:flex;align-items:center;gap:6px;}
  .mebook-root .mb-react-pill{display:flex;align-items:center;gap:4px;background:linear-gradient(135deg,#ef4444,#f97316);color:#fff;font-size:11px;font-weight:700;padding:2px 8px 2px 4px;border-radius:12px;}
  .mebook-root .mb-react-pill svg{width:13px;height:13px;fill:#fff;}
  .mebook-root .mb-post-actions{display:flex;border-top:1px solid var(--border);margin:0 4px;padding:4px 0;}
  .mebook-root .mb-action{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:9px;border-radius:8px;font-size:14.5px;font-weight:600;color:var(--text-muted);transition:background .18s ease,color .18s ease;}
  .mebook-root .mb-action:hover{background:var(--hover);}
  .mebook-root .mb-action.liked{color:#ef4444;}
  .mebook-root .mb-action svg{width:19px;height:19px;fill:currentColor;}

  /* COMMENTS */
  .mebook-root .mb-comments{padding:0 16px 12px;border-top:1px solid var(--border);margin-top:4px;display:none;}
  .mebook-root .mb-comments.open{display:block;}
  .mebook-root .mb-comment{display:flex;gap:8px;margin-top:10px;}
  .mebook-root .mb-comment img{width:32px;height:32px;border-radius:50%;object-fit:cover;background:#cbd5e1;flex-shrink:0;}
  .mebook-root .mb-comment-body{background:var(--input-bg);border-radius:14px;padding:8px 12px;font-size:14px;line-height:1.4;color:var(--text);}
  .mebook-root .mb-comment-body b{font-weight:700;display:block;font-size:13.5px;margin-bottom:2px;}
  .mebook-root .mb-comment-input{display:flex;gap:8px;margin-top:12px;align-items:center;}
  .mebook-root .mb-comment-input img{width:32px;height:32px;border-radius:50%;object-fit:cover;background:#cbd5e1;}
  .mebook-root .mb-comment-input input{flex:1;background:var(--input-bg);border:none;border-radius:20px;padding:9px 14px;font-size:14px;outline:none;color:var(--text);}

  /* RIGHT SIDEBAR */
  .mebook-root .mb-right{position:sticky;top:80px;display:flex;flex-direction:column;gap:16px;}
  .mebook-root .mb-card{background:var(--card);border-radius:12px;box-shadow:var(--shadow);padding:14px 16px;transition:background .3s ease;}
  .mebook-root .mb-card-title{font-size:16px;font-weight:700;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;}
  .mebook-root .mb-card-title button{font-size:13px;color:var(--green-dark);font-weight:600;}
  .mebook-root .mb-card-title button:hover{text-decoration:underline;}
  .mebook-root .mb-contact{display:flex;align-items:center;gap:10px;padding:8px;border-radius:8px;transition:background .18s ease;cursor:pointer;position:relative;}
  .mebook-root .mb-contact:hover{background:var(--hover);}
  .mebook-root .mb-contact img{width:36px;height:36px;border-radius:50%;object-fit:cover;background:#cbd5e1;}
  .mebook-root .mb-contact-name{font-size:14.5px;font-weight:600;}
  .mebook-root .mb-online{position:absolute;bottom:7px;left:34px;width:11px;height:11px;border-radius:50%;background:var(--green-light);border:2px solid var(--card);}

  /* OVERLAY / DRAWER */
  .mebook-root .mb-overlay{position:fixed;inset:0;background:rgba(15,23,42,.35);backdrop-filter:blur(2px);z-index:1100;opacity:0;visibility:hidden;transition:opacity .3s ease,visibility .3s ease;}
  .mebook-root .mb-overlay.open{opacity:1;visibility:visible;}
  .mebook-root .mb-drawer{position:fixed;top:0;right:0;height:100%;width:330px;max-width:88vw;z-index:1200;transform:translateX(105%);transition:transform .42s cubic-bezier(.16,1,.3,1);background:var(--drawer-bg);backdrop-filter:blur(26px) saturate(180%);-webkit-backdrop-filter:blur(26px) saturate(180%);border-left:1px solid var(--border);box-shadow:-16px 0 44px rgba(0,0,0,.22);display:flex;flex-direction:column;border-radius:24px 0 0 24px;}
  .mebook-root .mb-drawer.open{transform:translateX(0);}
  .mebook-root .mb-drawer-head{display:flex;align-items:center;gap:10px;padding:18px 18px 14px;}
  .mebook-root .mb-drawer-head img{width:34px;height:34px;object-fit:contain;border-radius:8px;}
  .mebook-root .mb-drawer-head .mb-logo-text{font-size:19px;}
  .mebook-root .mb-drawer-head .me{color:var(--green-dark);}
  .mebook-root .mb-drawer-head .book{color:var(--text);}
  .mebook-root .mb-drawer-close{margin-left:auto;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.06);transition:background .2s ease,transform .2s ease;}
  .mebook-root .mb-drawer-close:hover{background:rgba(0,0,0,.12);transform:rotate(90deg);}
  .mebook-root .mb-drawer-close svg{width:16px;height:16px;fill:var(--text);}
  .mebook-root .mb-drawer-divider{height:1px;background:var(--border);margin:0 18px;}
  .mebook-root .mb-drawer-nav{padding:12px;overflow-y:auto;flex:1;}
  .mebook-root .mb-drawer-nav::-webkit-scrollbar{width:6px;}
  .mebook-root .mb-drawer-nav::-webkit-scrollbar-thumb{background:var(--border);border-radius:10px;}
  .mebook-root .mb-nav-item{display:flex;align-items:center;gap:14px;width:100%;padding:12px 14px;border-radius:14px;font-size:15.5px;font-weight:600;color:var(--text);transition:background .22s ease,transform .18s ease;text-align:left;position:relative;background:var(--nav-item-bg);border:1px solid var(--border);margin-bottom:8px;}
  .mebook-root .mb-nav-item:hover{background:var(--nav-item-hover);transform:translateX(-3px);}
  .mebook-root .mb-nav-item.active{background:linear-gradient(135deg,rgba(22,163,74,.95),rgba(34,197,94,.95));color:#fff;border-color:transparent;box-shadow:0 6px 18px rgba(22,163,74,.35);}
  .mebook-root .mb-nav-item.active .mb-nav-ico svg{fill:#fff;}
  .mebook-root .mb-nav-ico{width:38px;height:38px;border-radius:12px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:var(--input-bg);border:1px solid var(--border);}
  .mebook-root .mb-nav-item.active .mb-nav-ico{background:rgba(255,255,255,.22);border-color:rgba(255,255,255,.3);}
  .mebook-root .mb-nav-ico svg{width:20px;height:20px;fill:var(--text);}
  .mebook-root .mb-nav-badge{margin-left:auto;background:#ef4444;color:#fff;font-size:11px;font-weight:700;min-width:20px;height:20px;border-radius:10px;display:flex;align-items:center;justify-content:center;padding:0 6px;}
  .mebook-root .mb-nav-item.active .mb-nav-badge{background:rgba(255,255,255,.3);}
  .mebook-root .mb-drawer-foot{padding:12px 18px 18px;font-size:12px;color:var(--text-muted);display:flex;align-items:center;gap:6px;}
  .mebook-root .mb-drawer-foot .dot{width:4px;height:4px;border-radius:50%;background:var(--text-muted);}

  /* VIEWS */
  .mebook-root .mb-view{display:none;animation:viewIn .3s ease;}
  .mebook-root .mb-view.active{display:block;}
  @keyframes viewIn{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}
  .mebook-root .mb-page-title{font-size:24px;font-weight:800;margin-bottom:16px;display:flex;align-items:center;gap:10px;color:var(--text);}
  .mebook-root .mb-page-title svg{width:26px;height:26px;fill:var(--green);}

  /* FRIENDS */
  .mebook-root .mb-friends-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
  .mebook-root .mb-friend-card{background:var(--card);border-radius:12px;box-shadow:var(--shadow);overflow:hidden;transition:transform .2s ease,box-shadow .2s ease;}
  .mebook-root .mb-friend-card:hover{transform:translateY(-2px);box-shadow:var(--shadow-lg);}
  .mebook-root .mb-friend-cover{height:100px;background:linear-gradient(135deg,#16a34a,#0f172a);}
  .mebook-root .mb-friend-body{padding:0 14px 14px;text-align:center;margin-top:-38px;}
  .mebook-root .mb-friend-body img{width:76px;height:76px;border-radius:50%;object-fit:cover;border:4px solid var(--card);margin:0 auto 8px;background:#cbd5e1;}
  .mebook-root .mb-friend-name{font-size:16px;font-weight:700;color:var(--text);}
  .mebook-root .mb-friend-mutual{font-size:12.5px;color:var(--text-muted);margin-top:2px;}
  .mebook-root .mb-friend-btns{display:flex;flex-direction:column;gap:8px;margin-top:12px;}
  .mebook-root .mb-btn{width:100%;padding:9px;border-radius:9px;font-size:14.5px;font-weight:600;transition:filter .18s ease,transform .12s ease;}
  .mebook-root .mb-btn:active{transform:scale(.98);}
  .mebook-root .mb-btn-primary{background:var(--green);color:#fff;}
  .mebook-root .mb-btn-primary:hover{filter:brightness(1.08);}
  .mebook-root .mb-btn-secondary{background:var(--input-bg);color:var(--text);}
  .mebook-root .mb-btn-secondary:hover{background:var(--border);}
  .mebook-root .mb-btn-outline{background:transparent;color:var(--text);border:1px solid var(--border);}
  .mebook-root .mb-btn-outline:hover{background:var(--hover);}
  .mebook-root .mb-btn-danger{background:#dc2626;color:#fff;}
  .mebook-root .mb-btn-danger:hover{filter:brightness(1.1);}
  .mebook-root .mb-search-box{display:flex;align-items:center;gap:10px;background:var(--card);border-radius:24px;padding:10px 16px;box-shadow:var(--shadow);margin-bottom:18px;}
  .mebook-root .mb-search-box svg{width:20px;height:20px;fill:var(--text-muted);flex-shrink:0;}
  .mebook-root .mb-search-box input{border:none;outline:none;flex:1;font-size:15px;background:transparent;color:var(--text);}

  /* PROFILE */
  .mebook-root .mb-profile-head{background:var(--card);border-radius:12px;box-shadow:var(--shadow);overflow:hidden;margin-bottom:16px;}
  .mebook-root .mb-profile-cover{height:220px;background:linear-gradient(135deg,#0f172a,#16a34a);position:relative;cursor:pointer;overflow:hidden;}
  .mebook-root .mb-profile-cover img{width:100%;height:100%;object-fit:cover;}
  .mebook-root .mb-profile-cover-add{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.35);color:#fff;font-weight:600;gap:8px;opacity:0;transition:opacity .25s ease;}
  .mebook-root .mb-profile-cover:hover .mb-profile-cover-add{opacity:1;}
  .mebook-root .mb-profile-cover-add svg{width:22px;height:22px;fill:#fff;}
  .mebook-root .mb-profile-info{padding:0 20px 16px;display:flex;align-items:flex-end;gap:18px;margin-top:-58px;position:relative;flex-wrap:wrap;}
  .mebook-root .mb-profile-avatar-wrap{position:relative;cursor:pointer;}
  .mebook-root .mb-profile-avatar-wrap img{width:130px;height:130px;border-radius:50%;object-fit:cover;border:4px solid var(--card);background:#cbd5e1;}
  .mebook-root .mb-profile-avatar-add{position:absolute;inset:0;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.4);opacity:0;transition:opacity .25s ease;}
  .mebook-root .mb-profile-avatar-wrap:hover .mb-profile-avatar-add{opacity:1;}
  .mebook-root .mb-profile-avatar-add svg{width:26px;height:26px;fill:#fff;}
  .mebook-root .mb-profile-text{flex:1;min-width:200px;padding-bottom:8px;}
  .mebook-root .mb-profile-name{font-size:26px;font-weight:800;line-height:1.2;color:var(--text);}
  .mebook-root .mb-profile-bio{font-size:14.5px;color:var(--text-muted);margin-top:4px;}
  .mebook-root .mb-profile-actions{display:flex;gap:8px;padding:0 20px 18px;flex-wrap:wrap;}
  .mebook-root .mb-profile-actions .mb-btn{width:auto;padding:9px 18px;}
  .mebook-root .mb-info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
  .mebook-root .mb-info-row{display:flex;align-items:center;gap:10px;font-size:14.5px;padding:6px 0;color:var(--text);}
  .mebook-root .mb-info-row svg{width:18px;height:18px;fill:var(--green);flex-shrink:0;}
  .mebook-root .mb-info-row b{font-weight:600;}
  .mebook-root .mb-privacy-toggle{display:flex;align-items:center;justify-content:space-between;padding:10px 0;font-size:14.5px;border-bottom:1px solid var(--border);color:var(--text);}
  .mebook-root .mb-privacy-toggle:last-child{border-bottom:none;}
  .mebook-root .mb-switch{position:relative;width:44px;height:24px;flex-shrink:0;}
  .mebook-root .mb-switch input{opacity:0;width:0;height:0;}
  .mebook-root .mb-slider{position:absolute;inset:0;background:var(--border);border-radius:24px;transition:.25s;}
  .mebook-root .mb-slider::before{content:"";position:absolute;width:18px;height:18px;left:3px;top:3px;background:#fff;border-radius:50%;transition:.25s;box-shadow:0 1px 3px rgba(0,0,0,.3);}
  .mebook-root .mb-switch input:checked + .mb-slider{background:var(--green);}
  .mebook-root .mb-switch input:checked + .mb-slider::before{transform:translateX(20px);}

  /* SETTINGS */
  .mebook-root .mb-settings-group{margin-bottom:16px;}
  .mebook-root .mb-setting-row{display:flex;align-items:center;gap:14px;padding:14px 4px;border-bottom:1px solid var(--border);cursor:pointer;transition:background .18s ease;border-radius:8px;color:var(--text);}
  .mebook-root .mb-setting-row:hover{background:var(--hover);}
  .mebook-root .mb-setting-row:last-child{border-bottom:none;}
  .mebook-root .mb-setting-ico{width:40px;height:40px;border-radius:50%;background:var(--input-bg);flex-shrink:0;display:flex;align-items:center;justify-content:center;}
  .mebook-root .mb-setting-ico svg{width:20px;height:20px;fill:var(--text);}
  .mebook-root .mb-setting-txt{flex:1;}
  .mebook-root .mb-setting-txt h4{font-size:15px;font-weight:600;color:var(--text);}
  .mebook-root .mb-setting-txt p{font-size:12.5px;color:var(--text-muted);margin-top:1px;}
  .mebook-root .mb-setting-row .chev{width:18px;height:18px;fill:var(--text-muted);flex-shrink:0;}

  /* COMMUNITY / MEBOOK HERO */
  .mebook-root .mb-community-hero{background:linear-gradient(135deg,#0f172a 0%,#16a34a 100%);border-radius:12px;padding:26px 22px;color:#fff;margin-bottom:18px;box-shadow:var(--shadow);}
  .mebook-root .mb-community-hero h2{font-size:23px;font-weight:800;}
  .mebook-root .mb-community-hero p{font-size:14px;opacity:.85;margin-top:5px;}
  .mebook-root .mb-mebook-hero{background:linear-gradient(135deg,#16a34a 0%,#0f172a 100%);border-radius:12px;padding:28px 22px;color:#fff;margin-bottom:18px;box-shadow:var(--shadow);position:relative;overflow:hidden;}
  .mebook-root .mb-mebook-hero::before{content:'';position:absolute;top:-50%;right:-20%;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.15) 0%,transparent 70%);animation:floatBubble 8s ease-in-out infinite;}
  @keyframes floatBubble{0%,100%{transform:translate(0,0) scale(1);}50%{transform:translate(-20px,20px) scale(1.15);}}
  .mebook-root .mb-mebook-hero h2{font-size:24px;font-weight:800;position:relative;z-index:1;}
  .mebook-root .mb-mebook-hero p{font-size:14px;opacity:.9;margin-top:6px;position:relative;z-index:1;}
  .mebook-root .mb-mebook-badge{display:inline-block;background:rgba(255,255,255,.2);color:#fff;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;margin-top:12px;position:relative;z-index:1;backdrop-filter:blur(6px);}
  .mebook-root .mb-mebook-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;}
  .mebook-root .mb-mebook-stat{background:var(--card);border-radius:12px;box-shadow:var(--shadow);padding:16px;text-align:center;transition:transform .2s ease;}
  .mebook-root .mb-mebook-stat:hover{transform:translateY(-3px);}
  .mebook-root .mb-mebook-stat .num{font-size:26px;font-weight:800;color:var(--green);}
  .mebook-root .mb-mebook-stat .lbl{font-size:12.5px;color:var(--text-muted);margin-top:2px;}
  .mebook-root .mb-mebook-list{display:flex;flex-direction:column;gap:10px;}
  .mebook-root .mb-mebook-item{display:flex;gap:12px;padding:12px;background:var(--card);border-radius:12px;box-shadow:var(--shadow);align-items:center;transition:transform .18s ease,box-shadow .18s ease;cursor:pointer;}
  .mebook-root .mb-mebook-item:hover{transform:translateX(4px);box-shadow:var(--shadow-lg);}
  .mebook-root .mb-mebook-item img{width:64px;height:84px;object-fit:cover;border-radius:8px;flex-shrink:0;background:#cbd5e1;}
  .mebook-root .mb-mebook-item-body{flex:1;min-width:0;}
  .mebook-root .mb-mebook-item-title{font-size:15px;font-weight:700;color:var(--text);}
  .mebook-root .mb-mebook-item-desc{font-size:12.5px;color:var(--text-muted);margin-top:3px;line-height:1.4;}
  .mebook-root .mb-mebook-item-meta{font-size:11.5px;color:var(--green);font-weight:600;margin-top:5px;}
  .mebook-root .mb-mebook-tabs{display:flex;gap:6px;margin-bottom:14px;overflow-x:auto;padding-bottom:4px;}
  .mebook-root .mb-mebook-tabs::-webkit-scrollbar{height:0;}
  .mebook-root .mb-mebook-tab{padding:7px 14px;border-radius:20px;font-size:13.5px;font-weight:600;background:var(--card);color:var(--text-muted);white-space:nowrap;border:1px solid var(--border);transition:all .2s ease;}
  .mebook-root .mb-mebook-tab.active{background:var(--green);color:#fff;border-color:var(--green);}
  .mebook-root .mb-mebook-tab:hover:not(.active){background:var(--hover);}

  /* MODAL */
  .mebook-root .mb-modal-overlay{position:fixed;inset:0;background:rgba(15,23,42,.5);backdrop-filter:blur(3px);z-index:1300;display:flex;align-items:center;justify-content:center;padding:16px;opacity:0;visibility:hidden;transition:opacity .28s ease,visibility .28s ease;}
  .mebook-root .mb-modal-overlay.open{opacity:1;visibility:visible;}
  .mebook-root .mb-modal{background:var(--modal-bg);border-radius:14px;width:100%;max-width:520px;box-shadow:var(--shadow-lg);transform:scale(.94);transition:transform .28s cubic-bezier(.2,.8,.3,1);max-height:90vh;overflow-y:auto;}
  .mebook-root .mb-modal-overlay.open .mb-modal{transform:scale(1);}
  .mebook-root .mb-modal-head{display:flex;align-items:center;justify-content:center;position:relative;padding:14px;border-bottom:1px solid var(--border);font-size:18px;font-weight:700;color:var(--text);}
  .mebook-root .mb-modal-close{position:absolute;right:12px;top:50%;transform:translateY(-50%);width:34px;height:34px;border-radius:50%;background:var(--input-bg);display:flex;align-items:center;justify-content:center;}
  .mebook-root .mb-modal-close:hover{background:var(--border);}
  .mebook-root .mb-modal-close svg{width:15px;height:15px;fill:var(--text);}
  .mebook-root .mb-modal-body{padding:16px;}
  .mebook-root .mb-modal-user{display:flex;align-items:center;gap:10px;margin-bottom:10px;}
  .mebook-root .mb-modal-user img{width:42px;height:42px;border-radius:50%;object-fit:cover;background:#cbd5e1;}
  .mebook-root .mb-modal-user b{font-size:15px;color:var(--text);}
  .mebook-root .mb-modal-textarea{width:100%;min-height:110px;border:none;outline:none;resize:none;font-size:17px;line-height:1.4;padding:6px 0;background:transparent;color:var(--text);}
  .mebook-root .mb-modal-textarea::placeholder{color:#9ca3af;}
  .mebook-root .mb-movie-tag{display:flex;align-items:center;gap:8px;background:rgba(22,163,74,.1);border:1px solid rgba(22,163,74,.3);border-radius:9px;padding:9px 12px;margin-bottom:10px;}
  .mebook-root .mb-movie-tag svg{width:18px;height:18px;fill:var(--green);flex-shrink:0;}
  .mebook-root .mb-movie-tag input{border:none;outline:none;background:transparent;flex:1;font-size:14px;font-weight:500;color:var(--text);}
  .mebook-root .mb-upload-box{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;border:2px dashed var(--border);border-radius:12px;padding:26px;color:var(--text-muted);cursor:pointer;transition:border-color .2s ease,background .2s ease;text-align:center;}
  .mebook-root .mb-upload-box:hover{border-color:var(--green);background:rgba(22,163,74,.05);}
  .mebook-root .mb-upload-box svg{width:36px;height:36px;fill:var(--green);}
  .mebook-root .mb-upload-box b{font-size:14.5px;color:var(--text);}
  .mebook-root .mb-upload-box small{font-size:12.5px;}
  .mebook-root .mb-modal-foot{padding:12px 16px 16px;display:flex;gap:10px;}
  .mebook-root .mb-modal-foot .mb-btn{flex:1;padding:11px;}
  .mebook-root .mb-preview{position:relative;border-radius:12px;overflow:hidden;margin-top:10px;background:#000;}
  .mebook-root .mb-preview img{width:100%;max-height:280px;object-fit:contain;}
  .mebook-root .mb-preview-remove{position:absolute;top:8px;right:8px;width:30px;height:30px;border-radius:50%;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;}
  .mebook-root .mb-preview-remove svg{width:14px;height:14px;fill:#fff;}

  /* CHAT */
  .mebook-root .mb-chat-wrap{background:var(--card);border-radius:12px;box-shadow:var(--shadow);height:calc(100vh - 160px);display:flex;overflow:hidden;}
  .mebook-root .mb-chat-list{width:300px;border-right:1px solid var(--border);overflow-y:auto;flex-shrink:0;}
  .mebook-root .mb-chat-item{display:flex;gap:10px;padding:12px 14px;cursor:pointer;transition:background .18s ease;border-bottom:1px solid var(--border);position:relative;}
  .mebook-root .mb-chat-item:hover{background:var(--hover);}
  .mebook-root .mb-chat-item.active{background:rgba(22,163,74,.12);}
  .mebook-root .mb-chat-item img{width:44px;height:44px;border-radius:50%;object-fit:cover;background:#cbd5e1;flex-shrink:0;}
  .mebook-root .mb-chat-item-body{flex:1;min-width:0;}
  .mebook-root .mb-chat-item-name{font-size:14.5px;font-weight:600;margin-bottom:2px;color:var(--text);}
  .mebook-root .mb-chat-item-last{font-size:13px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .mebook-root .mb-chat-item-time{font-size:11px;color:var(--text-muted);flex-shrink:0;}
  .mebook-root .mb-chat-window{flex:1;display:flex;flex-direction:column;min-width:0;}
  .mebook-root .mb-chat-head{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid var(--border);flex-shrink:0;}
  .mebook-root .mb-chat-head img{width:40px;height:40px;border-radius:50%;object-fit:cover;background:#cbd5e1;}
  .mebook-root .mb-chat-head-info{flex:1;}
  .mebook-root .mb-chat-head-name{font-size:15px;font-weight:700;color:var(--text);}
  .mebook-root .mb-chat-head-status{font-size:12.5px;color:var(--green);}
  .mebook-root .mb-chat-body{flex:1;overflow-y:auto;padding:16px;background:var(--chat-body-bg);display:flex;flex-direction:column;gap:8px;}
  .mebook-root .mb-chat-body::-webkit-scrollbar{width:6px;}
  .mebook-root .mb-chat-body::-webkit-scrollbar-thumb{background:var(--border);border-radius:10px;}
  .mebook-root .mb-bubble{max-width:65%;padding:9px 14px;border-radius:18px;font-size:14.5px;line-height:1.4;word-wrap:break-word;animation:bubbleIn .22s ease;}
  @keyframes bubbleIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;}}
  .mebook-root .mb-bubble.me{align-self:flex-end;background:var(--green);color:#fff;border-bottom-right-radius:5px;}
  .mebook-root .mb-bubble.them{align-self:flex-start;background:var(--bubble-them-bg);color:var(--text);border-bottom-left-radius:5px;box-shadow:0 1px 2px rgba(0,0,0,.08);}
  .mebook-root .mb-bubble-time{font-size:10.5px;opacity:.7;margin-top:3px;display:block;text-align:right;}
  .mebook-root .mb-chat-input{display:flex;gap:10px;padding:12px 16px;border-top:1px solid var(--border);background:var(--card);flex-shrink:0;}
  .mebook-root .mb-chat-input input{flex:1;background:var(--input-bg);border:none;border-radius:22px;padding:11px 16px;font-size:14.5px;outline:none;color:var(--text);}
  .mebook-root .mb-chat-input button{width:44px;height:44px;border-radius:50%;background:var(--green);color:#fff;display:flex;align-items:center;justify-content:center;transition:filter .18s ease;}
  .mebook-root .mb-chat-input button:hover{filter:brightness(1.1);}
  .mebook-root .mb-chat-input button svg{width:20px;height:20px;fill:#fff;}
  .mebook-root .mb-chat-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--text-muted);gap:10px;}
  .mebook-root .mb-chat-empty svg{width:60px;height:60px;fill:var(--border);}

  /* TOAST */
  .mebook-root .mb-toast{position:fixed;bottom:80px;left:50%;transform:translate(-50%,80px);background:#0f172a;color:#fff;padding:12px 22px;border-radius:10px;font-size:14px;font-weight:500;z-index:6000;opacity:0;transition:transform .35s cubic-bezier(.2,.8,.3,1),opacity .35s ease;box-shadow:var(--shadow-lg);display:flex;align-items:center;gap:8px;max-width:90vw;}
  .mebook-root .mb-toast.show{transform:translate(-50%,0);opacity:1;}
  .mebook-root .mb-toast svg{width:17px;height:17px;fill:#22c55e;flex-shrink:0;}

  .mebook-root .mb-empty{text-align:center;padding:50px 20px;color:var(--text-muted);background:var(--card);border-radius:12px;box-shadow:var(--shadow);}
  .mebook-root .mb-empty svg{width:52px;height:52px;fill:var(--border);margin:0 auto 12px;}
  .mebook-root .mb-loading{text-align:center;padding:40px;color:var(--text-muted);}

  .mebook-root .mb-theme-row{display:flex;align-items:center;justify-content:space-between;padding:14px 4px;border-bottom:1px solid var(--border);color:var(--text);}
  .mebook-root .mb-theme-row:last-child{border-bottom:none;}
  .mebook-root .mb-theme-row .mb-setting-txt h4{margin-bottom:2px;}

  @media(max-width:1100px){
    .mebook-root .mb-layout{grid-template-columns:240px minmax(0,1fr);}
    .mebook-root .mb-right{display:none;}
  }
  @media(max-width:820px){
    .mebook-root .mb-layout{grid-template-columns:minmax(0,1fr);padding:14px 10px 100px;}
    .mebook-root .mb-sidebar{display:none;}
    .mebook-root .mb-chat-list{width:100%;}
    .mebook-root .mb-chat-list.hide-mobile{display:none;}
    .mebook-root .mb-chat-window.hide-mobile{display:none;}
  }
  @media(max-width:600px){
    .mebook-root .mb-logo-text{font-size:19px;}
    .mebook-root .mb-profile-avatar-wrap img{width:100px;height:100px;}
    .mebook-root .mb-profile-name{font-size:21px;}
    .mebook-root .mb-profile-info{margin-top:-44px;}
    .mebook-root .mb-friends-grid{grid-template-columns:1fr;}
    .mebook-root .mb-mebook-grid{grid-template-columns:1fr 1fr;}
  }
`

/* ============================================================
   MAIN COMPONENT
============================================================ */

export default function MeBookPage() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  /* ---------------------------------------------
     State that mirrors the original HTML
  --------------------------------------------- */
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin")
  const [authErr, setAuthErr] = useState<{ si: string; su: string }>({
    si: "",
    su: "",
  })
  const [authBusy, setAuthBusy] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [currentView, setCurrentView] = useState<string>("home")
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [composerOpen, setComposerOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [userModalBody, setUserModalBody] = useState<React.ReactNode>(null)
  const [toast, setToast] = useState<{ msg: string; show: boolean }>({
    msg: "",
    show: false,
  })
  const [mebookTab, setMebookTab] = useState("featured")

  const [feed, setFeed] = useState<any[]>([])
  const [myPosts, setMyPosts] = useState<any[]>([])
  const [communityFeed, setCommunityFeed] = useState<any[]>([])
  const [friends, setFriends] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [myFriends, setMyFriends] = useState<any[]>([])
  const [chats, setChats] = useState<any[]>([])
  const [onlineList, setOnlineList] = useState<any[]>([])
  const [activeChat, setActiveChat] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [chatPartner, setChatPartner] = useState<any>(null)

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

  const [privacy, setPrivacy] = useState({
    info: true,
    posts: true,
    requests: true,
  })

  const [siEmail, setSiEmail] = useState("")
  const [siPass, setSiPass] = useState("")
  const [suName, setSuName] = useState("")
  const [suEmail, setSuEmail] = useState("")
  const [suPass, setSuPass] = useState("")

  const [friendSearch, setFriendSearch] = useState("")
  const [chatInput, setChatInput] = useState("")

  const unsubscribersRef = useRef<Array<() => void>>([])
  const chatUnsubRef = useRef<(() => void) | null>(null)

  /* ---------------------------------------------
     Inject CSS once
  --------------------------------------------- */
  useEffect(() => {
    const styleId = "mebook-styles"
    if (document.getElementById(styleId)) {
      setReady(true)
      return
    }
    const styleEl = document.createElement("style")
    styleEl.id = styleId
    styleEl.innerHTML = MEBOOK_CSS
    document.head.appendChild(styleEl)
    setReady(true)
  }, [])

  /* ---------------------------------------------
     Theme init
  --------------------------------------------- */
  useEffect(() => {
    const saved = localStorage.getItem("mebook-theme")
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches
    const isDark = saved ? saved === "dark" : prefersDark
    setTheme(isDark ? "dark" : "light")
  }, [])

  const toggleTheme = (isDark: boolean) => {
    setTheme(isDark ? "dark" : "light")
    localStorage.setItem("mebook-theme", isDark ? "dark" : "light")
  }

  /* ---------------------------------------------
     Toast helper
  --------------------------------------------- */
  const showToast = useCallback((msg: string) => {
    setToast({ msg, show: true })
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 2400)
  }, [])

  /* ---------------------------------------------
     Firebase init + Auth
  --------------------------------------------- */
  useEffect(() => {
    if (!ready) return
    let cancelled = false
    let unsubAuth: (() => void) | null = null

    ;(async () => {
      try {
        const { auth: A, db: D, fbMods: M } = await initFirebase()
        if (cancelled) return

        unsubAuth = M.onAuthStateChanged(A, async (u: any) => {
          if (cancelled) return
          if (u) {
            const userRef = M.doc(D, "users", u.uid)
            let snap = await M.getDoc(userRef)
            if (!snap.exists()) {
              await M.setDoc(userRef, {
                uid: u.uid,
                name: u.displayName || "User",
                email: u.email,
                photoURL: u.photoURL || "",
                coverURL: "",
                bio: "Movie lover 🎬",
                location: "",
                phone: "",
                createdAt: M.serverTimestamp(),
                privacy: { info: true, posts: true, requests: true },
              })
              snap = await M.getDoc(userRef)
            }
            setUser(u)
            const p = snap.data()
            setProfile(p)
            setPrivacy(p.privacy || { info: true, posts: true, requests: true })

            // Start listeners
            startAppListeners(u, p, M, D)
          } else {
            setUser(null)
            setProfile(null)
            cleanupListeners()
          }
        })
      } catch (e) {
        console.error(e)
        showToast("Firebase init failed")
      }
    })()

    return () => {
      cancelled = true
      if (unsubAuth) unsubAuth()
      cleanupListeners()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  const cleanupListeners = () => {
    unsubscribersRef.current.forEach((u) => {
      try {
        u()
      } catch {}
    })
    unsubscribersRef.current = []
    if (chatUnsubRef.current) {
      try {
        chatUnsubRef.current()
      } catch {}
      chatUnsubRef.current = null
    }
    setActiveChat(null)
  }

  /* ---------------------------------------------
     Start all listeners once signed in
  --------------------------------------------- */
  const startAppListeners = async (
    u: any,
    p: any,
    M: any,
    D: any
  ) => {
    cleanupListeners()

    /* Feed */
    const feedQ = M.query(
      M.collection(D, "posts"),
      M.orderBy("createdAt", "desc")
    )
    unsubscribersRef.current.push(
      M.onSnapshot(feedQ, (snap: any) => {
        const arr: any[] = []
        snap.forEach((d: any) => arr.push({ id: d.id, ...d.data() }))
        setFeed(arr)
      })
    )

    /* My posts */
    const myQ = M.query(
      M.collection(D, "posts"),
      M.where("authorId", "==", u.uid)
    )
    unsubscribersRef.current.push(
      M.onSnapshot(myQ, (snap: any) => {
        const arr: any[] = []
        snap.forEach((d: any) => arr.push({ id: d.id, ...d.data() }))
        arr.sort(
          (a, b) =>
            (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
        )
        setMyPosts(arr)
      })
    )

    /* Community feed */
    const commQ = M.query(
      M.collection(D, "communityPosts"),
      M.orderBy("createdAt", "desc")
    )
    unsubscribersRef.current.push(
      M.onSnapshot(commQ, (snap: any) => {
        const arr: any[] = []
        snap.forEach((d: any) => arr.push({ id: d.id, ...d.data() }))
        setCommunityFeed(arr)
      })
    )

    /* Friends (all users) */
    const usersQ = M.query(M.collection(D, "users"))
    unsubscribersRef.current.push(
      M.onSnapshot(usersQ, (snap: any) => {
        const arr: any[] = []
        snap.forEach((d: any) => {
          if (d.id !== u.uid) arr.push({ uid: d.id, ...d.data() })
        })
        setFriends(arr)
        setOnlineList(arr.slice(0, 5))
      })
    )

    /* Friend requests */
    const reqQ = M.query(
      M.collection(D, "friendRequests"),
      M.where("to", "==", u.uid),
      M.where("status", "==", "pending")
    )
    unsubscribersRef.current.push(
      M.onSnapshot(reqQ, async (snap: any) => {
        const arr: any[] = []
        for (const d of snap.docs) {
          const data = d.data()
          const fromSnap = await M.getDoc(M.doc(D, "users", data.from))
          arr.push({
            id: d.id,
            from: data.from,
            fromUser: fromSnap.exists()
              ? fromSnap.data()
              : { name: "User", photoURL: "" },
          })
        }
        setRequests(arr)
      })
    )

    /* My friends */
    const myFriendsQ = M.query(
      M.collection(D, "friends"),
      M.where("a", "==", u.uid)
    )
    unsubscribersRef.current.push(
      M.onSnapshot(myFriendsQ, async (snap: any) => {
        const arr: any[] = []
        for (const d of snap.docs) {
          const s = await M.getDoc(M.doc(D, "users", d.data().b))
          if (s.exists()) arr.push({ uid: s.id, ...s.data() })
        }
        setMyFriends(arr)
      })
    )

    /* Chats */
    const chatsQ = M.query(
      M.collection(D, "chats"),
      M.where("members", "array-contains", u.uid)
    )
    unsubscribersRef.current.push(
      M.onSnapshot(chatsQ, async (snap: any) => {
        const arr: any[] = []
        for (const d of snap.docs) {
          const data = d.data()
          const otherId = data.members.find((m: string) => m !== u.uid)
          if (!otherId) continue
          const s = await M.getDoc(M.doc(D, "users", otherId))
          if (!s.exists()) continue
          arr.push({
            id: d.id,
            otherId,
            other: s.data(),
            last: data.lastMessage || "",
            lastAt: data.lastAt,
          })
        }
        arr.sort(
          (a, b) => (b.lastAt?.seconds || 0) - (a.lastAt?.seconds || 0)
        )
        setChats(arr)
      })
    )
  }

  /* ---------------------------------------------
     AUTH ACTIONS
  --------------------------------------------- */
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthBusy(true)
    setAuthErr({ ...authErr, si: "" })
    try {
      const { auth: A, fbMods: M } = await initFirebase()
      await M.signInWithEmailAndPassword(A, siEmail.trim(), siPass)
    } catch (err: any) {
      setAuthErr((prev) => ({ ...prev, si: friendlyErr(err) }))
      setAuthBusy(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthBusy(true)
    setAuthErr({ ...authErr, su: "" })
    try {
      const { auth: A, db: D, fbMods: M } = await initFirebase()
      const cred = await M.createUserWithEmailAndPassword(
        A,
        suEmail.trim(),
        suPass
      )
      await M.updateProfile(cred.user, { displayName: suName.trim() })
      await M.setDoc(M.doc(D, "users", cred.user.uid), {
        uid: cred.user.uid,
        name: suName.trim(),
        email: cred.user.email,
        photoURL: "",
        coverURL: "",
        bio: "Movie lover 🎬",
        location: "",
        phone: "",
        createdAt: M.serverTimestamp(),
        privacy: { info: true, posts: true, requests: true },
      })
    } catch (err: any) {
      setAuthErr((prev) => ({ ...prev, su: friendlyErr(err) }))
      setAuthBusy(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      const { auth: A, db: D, fbMods: M } = await initFirebase()
      const provider = new M.GoogleAuthProvider()
      const cred = await M.signInWithPopup(A, provider)
      const ref = M.doc(D, "users", cred.user.uid)
      const snap = await M.getDoc(ref)
      if (!snap.exists()) {
        await M.setDoc(ref, {
          uid: cred.user.uid,
          name: cred.user.displayName || "User",
          email: cred.user.email,
          photoURL: cred.user.photoURL || "",
          coverURL: "",
          bio: "Movie lover 🎬",
          location: "",
          phone: "",
          createdAt: M.serverTimestamp(),
          privacy: { info: true, posts: true, requests: true },
        })
      }
    } catch (err: any) {
      showToast(friendlyErr(err))
    }
  }

  const handleSignOut = async () => {
    if (!confirm("Log out of MeBook?")) return
    try {
      const { auth: A, fbMods: M } = await initFirebase()
      cleanupListeners()
      await M.signOut(A)
    } catch (e: any) {
      showToast(e.message)
    }
  }

  const handleResetPassword = async () => {
    if (!user?.email) return
    try {
      const { auth: A, fbMods: M } = await initFirebase()
      await M.sendPasswordResetEmail(A, user.email)
      showToast("Password reset email sent ✅")
    } catch (e: any) {
      showToast(e.message)
    }
  }

  /* ---------------------------------------------
     NAV
  --------------------------------------------- */
  const goTo = (view: string) => {
    setCurrentView(view)
    setDrawerOpen(false)
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }, 50)
  }

  /* ---------------------------------------------
     POST ACTIONS
  --------------------------------------------- */
  const handleLikePost = async (postId: string) => {
    try {
      const { db: D, fbMods: M } = await initFirebase()
      const ref = M.doc(D, "posts", postId)
      const snap = await M.getDoc(ref)
      if (!snap.exists()) return
      const likes = snap.data().likes || []
      const has = likes.includes(user.uid)
      await M.updateDoc(ref, {
        likes: has
          ? M.arrayRemove(user.uid)
          : M.arrayUnion(user.uid),
      })
    } catch (e: any) {
      showToast(e.message)
    }
  }

  const handleAddComment = async (postId: string, text: string) => {
    text = (text || "").trim()
    if (!text) return
    try {
      const { db: D, fbMods: M } = await initFirebase()
      const ref = M.doc(D, "posts", postId)
      await M.updateDoc(ref, {
        comments: M.arrayUnion({
          uid: user.uid,
          name: profile.name,
          avatar: profile.photoURL || "",
          text,
          at: Date.now(),
        }),
      })
      showToast("Comment added")
    } catch (e: any) {
      showToast(e.message)
    }
  }

  const handleSharePost = async (postId: string) => {
    try {
      const { db: D, fbMods: M } = await initFirebase()
      const snap = await M.getDoc(M.doc(D, "posts", postId))
      if (!snap.exists()) {
        showToast("Post not found")
        return
      }
      const post = snap.data()
      const postUrl =
        location.origin + location.pathname + "#post-" + postId
      const shareText = `Check out this movie review on MeBook: "${
        post.caption || "Movie review"
      }" — ${post.movie || ""}`

      if ((navigator as any).share) {
        await (navigator as any).share({
          title: "MeBook Movie Review",
          text: shareText,
          url: postUrl,
        })
        await M.updateDoc(M.doc(D, "posts", postId), {
          shares: M.increment(1),
        })
        showToast("Shared ✅")
      } else {
        await navigator.clipboard.writeText(postUrl).catch(() => {})
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            postUrl
          )}`,
          "_blank",
          "width=640,height=480"
        )
        await M.updateDoc(M.doc(D, "posts", postId), {
          shares: M.increment(1),
        })
        showToast("Sharing to Facebook...")
      }
    } catch (e: any) {
      if (e.name !== "AbortError") showToast("Share cancelled or failed")
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Delete this post?")) return
    try {
      const { db: D, fbMods: M } = await initFirebase()
      await M.deleteDoc(M.doc(D, "posts", postId))
      showToast("Post deleted")
    } catch (e: any) {
      showToast(e.message)
    }
  }

  /* ---------------------------------------------
     COMPOSER
  --------------------------------------------- */
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
      showToast("Write something or add a photo")
      return
    }

    setPostBusy(true)
    try {
      const { db: D, fbMods: M } = await initFirebase()
      let imageUrl = ""
      if (selectedFile) {
        setUploadProgress(0)
        imageUrl = await cloudinaryUpload(selectedFile, (pct) =>
          setUploadProgress(pct)
        )
      }

      await M.addDoc(M.collection(D, "posts"), {
        authorId: user.uid,
        authorName: profile.name,
        authorAvatar: profile.photoURL || "",
        caption: text,
        movie,
        image: imageUrl,
        likes: [],
        comments: [],
        shares: 0,
        createdAt: M.serverTimestamp(),
      })

      setPostText("")
      setPostMovie("")
      removePreview()
      setUploadProgress(null)
      setComposerOpen(false)
      showToast("Post published ✅")
      goTo("home")
    } catch (err: any) {
      console.error(err)
      showToast("Failed: " + (err.message || "try again"))
    } finally {
      setPostBusy(false)
    }
  }

  /* ---------------------------------------------
     FRIEND ACTIONS
  --------------------------------------------- */
  const handleSendRequest = async (toUid: string) => {
    if (toUid === user.uid) return
    try {
      const { db: D, fbMods: M } = await initFirebase()
      const q1 = M.query(
        M.collection(D, "friendRequests"),
        M.where("from", "==", user.uid),
        M.where("to", "==", toUid)
      )
      const s1 = await M.getDocs(q1)
      const q2 = M.query(
        M.collection(D, "friendRequests"),
        M.where("from", "==", toUid),
        M.where("to", "==", user.uid)
      )
      const s2 = await M.getDocs(q2)
      if (!s1.empty || !s2.empty) {
        showToast("Request already exists")
        return
      }
      await M.addDoc(M.collection(D, "friendRequests"), {
        from: user.uid,
        to: toUid,
        status: "pending",
        createdAt: M.serverTimestamp(),
      })
      showToast("Friend request sent ✅")
    } catch (e: any) {
      showToast(e.message)
    }
  }

  const handleAcceptRequest = async (reqId: string, fromUid: string) => {
    try {
      const { db: D, fbMods: M } = await initFirebase()
      await M.updateDoc(M.doc(D, "friendRequests", reqId), {
        status: "accepted",
      })
      await M.setDoc(M.doc(D, "friends", user.uid + "_" + fromUid), {
        a: user.uid,
        b: fromUid,
        createdAt: M.serverTimestamp(),
      })
      showToast("You are now friends 🎉")
    } catch (e: any) {
      showToast(e.message)
    }
  }

  const handleDeclineRequest = async (reqId: string) => {
    try {
      const { db: D, fbMods: M } = await initFirebase()
      await M.updateDoc(M.doc(D, "friendRequests", reqId), {
        status: "declined",
      })
      showToast("Request declined")
    } catch (e: any) {
      showToast(e.message)
    }
  }

  /* ---------------------------------------------
     CHAT
  --------------------------------------------- */
  const startChat = async (
    otherId: string,
    otherName: string,
    otherPhoto: string
  ) => {
    if (otherId === user.uid) {
      showToast("You can't chat with yourself")
      return
    }
    const cid = chatIdFor(user.uid, otherId)
    try {
      const { db: D, fbMods: M } = await initFirebase()
      const ref = M.doc(D, "chats", cid)
      const snap = await M.getDoc(ref)
      if (!snap.exists()) {
        await M.setDoc(ref, {
          members: [user.uid, otherId],
          createdAt: M.serverTimestamp(),
          lastMessage: null,
          lastAt: M.serverTimestamp(),
        })
      }
      goTo("messages")
      openChat(cid, otherId, {
        uid: otherId,
        name: otherName,
        photoURL: otherPhoto,
      })
    } catch (e: any) {
      showToast(e.message)
    }
  }

  const openChat = (chatId: string, otherId: string, other: any) => {
    setActiveChat(chatId)
    setChatPartner({ ...other, uid: otherId })

    if (chatUnsubRef.current) {
      try {
        chatUnsubRef.current()
      } catch {}
      chatUnsubRef.current = null
    }

    ;(async () => {
      const { db: D, fbMods: M } = await initFirebase()
      const q = M.query(
        M.collection(D, "chats", chatId, "messages"),
        M.orderBy("at", "asc")
      )
      chatUnsubRef.current = M.onSnapshot(q, (snap: any) => {
        const arr: any[] = []
        snap.forEach((d: any) => arr.push({ id: d.id, ...d.data() }))
        setChatMessages(arr)
      })
    })()
  }

  const handleSendMessage = async () => {
    const text = chatInput.trim()
    if (!text || !activeChat) return
    setChatInput("")
    try {
      const { db: D, fbMods: M } = await initFirebase()
      await M.addDoc(M.collection(D, "chats", activeChat, "messages"), {
        from: user.uid,
        text,
        at: M.serverTimestamp(),
      })
      await M.updateDoc(M.doc(D, "chats", activeChat), {
        lastMessage: { text, from: user.uid },
        lastAt: M.serverTimestamp(),
      })
    } catch (e: any) {
      showToast(e.message)
    }
  }

  /* ---------------------------------------------
     PROFILE
  --------------------------------------------- */
  const handleEditProfile = () => {
    setEditName(profile.name || "")
    setEditBio(profile.bio || "")
    setEditLoc(profile.location || "")
    setEditPhone(profile.phone || "")
    setEditOpen(true)
  }

  const handleSaveProfile = async () => {
    try {
      const { db: D, fbMods: M } = await initFirebase()
      const updates = {
        name: editName.trim() || profile.name,
        bio: editBio.trim(),
        location: editLoc.trim(),
        phone: editPhone.trim(),
      }
      await M.updateDoc(M.doc(D, "users", user.uid), updates)
      setProfile({ ...profile, ...updates })
      setEditOpen(false)
      showToast("Profile updated ✅")
    } catch (e: any) {
      showToast(e.message)
    }
  }

  const handleChangeProfilePhoto = () => {
    const inp = document.createElement("input")
    inp.type = "file"
    inp.accept = "image/*"
    inp.onchange = async () => {
      const f = inp.files?.[0]
      if (!f) return
      showToast("Uploading profile photo...")
      try {
        const { db: D, fbMods: M } = await initFirebase()
        const url = await cloudinaryUpload(f)
        await M.updateDoc(M.doc(D, "users", user.uid), { photoURL: url })
        setProfile({ ...profile, photoURL: url })
        showToast("Profile photo updated ✅")
      } catch (e: any) {
        showToast("Upload failed: " + e.message)
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
      showToast("Uploading cover photo...")
      try {
        const { db: D, fbMods: M } = await initFirebase()
        const url = await cloudinaryUpload(f)
        await M.updateDoc(M.doc(D, "users", user.uid), { coverURL: url })
        setProfile({ ...profile, coverURL: url })
        showToast("Cover photo updated ✅")
      } catch (e: any) {
        showToast("Upload failed: " + e.message)
      }
    }
    inp.click()
  }

  const handleSavePrivacy = async () => {
    try {
      const { db: D, fbMods: M } = await initFirebase()
      await M.updateDoc(M.doc(D, "users", user.uid), { privacy })
      showToast("Privacy updated")
    } catch (e: any) {
      showToast(e.message)
    }
  }

  const handleOpenUser = async (uid: string) => {
    if (uid === user.uid) {
      goTo("profile")
      return
    }
    try {
      const { db: D, fbMods: M } = await initFirebase()
      const snap = await M.getDoc(M.doc(D, "users", uid))
      if (!snap.exists()) {
        showToast("User not found")
        return
      }
      const u = snap.data()
      const photo =
        u.photoURL ||
        `https://ui-avatars.com/api/?background=16a34a&color=fff&name=${encodeURIComponent(
          u.name || "U"
        )}`
      const cover =
        u.coverURL ||
        "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&q=80"

      setUserModalBody(
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              height: 120,
              background: `url('${cover}') center/cover`,
              borderRadius: 12,
              marginBottom: -40,
            }}
          />
          <img
            src={photo}
            style={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              objectFit: "cover",
              border: "4px solid var(--card)",
              margin: "0 auto",
              position: "relative",
            }}
          />
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              marginTop: 8,
              color: "var(--text)",
            }}
          >
            {u.name}
          </div>
          <div
            style={{
              color: "var(--text-muted)",
              fontSize: 13.5,
              marginTop: 3,
            }}
          >
            {u.bio || "Movie lover 🎬"}
          </div>
          {u.location && (
            <div
              style={{
                color: "var(--text-muted)",
                fontSize: 13,
                marginTop: 3,
              }}
            >
              📍 {u.location}
            </div>
          )}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginTop: 16,
            }}
          >
            <button
              className="mb-btn mb-btn-primary"
              onClick={() => handleSendRequest(u.uid)}
            >
              ＋ Add Friend
            </button>
            <button
              className="mb-btn mb-btn-secondary"
              onClick={() => {
                startChat(u.uid, u.name, photo)
                setUserModalOpen(false)
              }}
            >
              💬 Message
            </button>
          </div>
        </div>
      )
      setUserModalOpen(true)
    } catch (e: any) {
      showToast(e.message)
    }
  }

  /* ---------------------------------------------
     ESC close
  --------------------------------------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawerOpen(false)
        setComposerOpen(false)
        setEditOpen(false)
        setUserModalOpen(false)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  if (!ready) return null

  /* ============================================
     RENDER HELPERS
  ============================================ */

  const avatarUrl = (u: any) =>
    u?.photoURL ||
    `https://ui-avatars.com/api/?background=16a34a&color=fff&name=${encodeURIComponent(
      u?.name || "User"
    )}`

  const renderPost = (post: any, isMine = false) => {
    const liked =
      Array.isArray(post.likes) && post.likes.includes(user?.uid)
    const likesCount = Array.isArray(post.likes) ? post.likes.length : 0
    const commentsCount = Array.isArray(post.comments)
      ? post.comments.length
      : 0
    const shares = post.shares || 0
    const authorAvatar =
      post.authorAvatar ||
      `https://ui-avatars.com/api/?background=16a34a&color=fff&name=${encodeURIComponent(
        post.authorName || "User"
      )}`
    const timeText = post.timeText || timeAgo(post.createdAt)

    return (
      <article className="mb-post" key={post.id}>
        <div className="mb-post-head">
          <img
            className="mb-post-head-avatar"
            src={authorAvatar}
            alt={post.authorName}
            onClick={() => handleOpenUser(post.authorId)}
          />
          <div className="mb-post-head-info">
            <div
              className="mb-post-author"
              onClick={() => handleOpenUser(post.authorId)}
            >
              {post.authorName || "User"}
              {post.verified && (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="#16a34a"
                >
                  <path d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69l-3.61.82.34 3.69L1 12l2.44 2.79-.34 3.7 3.61.82L8.6 22.5l3.4-1.47 3.4 1.46 1.89-3.19 3.61-.82-.34-3.69L23 12zm-12.91 4.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z" />
                </svg>
              )}
            </div>
            <div className="mb-post-meta">
              {timeText} •{" "}
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

        {post.caption && (
          <div className="mb-post-caption">{post.caption}</div>
        )}

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
                <span className="like-count">{likesCount}</span>
              </span>
            ) : (
              <span
                className="like-count"
                style={{ fontSize: 13 }}
              >
                0 likes
              </span>
            )}
          </div>
          <div>
            <span className="cmt-count">{commentsCount}</span> comments •{" "}
            <span className="shr-count">{shares}</span> shares
          </div>
        </div>

        <div className="mb-post-actions">
          <button
            className={`mb-action like-btn ${liked ? "liked" : ""}`}
            onClick={() => handleLikePost(post.id)}
          >
            <svg viewBox="0 0 24 24">
              <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91z" />
            </svg>
            Like
          </button>
          <CommentButton
            postId={post.id}
            comments={post.comments || []}
            user={profile}
            onAdd={handleAddComment}
          />
          <button
            className="mb-action"
            onClick={() => handleSharePost(post.id)}
          >
            <svg viewBox="0 0 24 24">
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
            </svg>
            Share
          </button>
        </div>
      </article>
    )
  }

  /* ============================================
     MAIN RENDER
  ============================================ */

  const rootClass = `mebook-root ${theme === "dark" ? "dark-mode" : ""}`

  /* ---------- AUTH SCREEN ---------- */
  if (!user) {
    return (
      <div className={rootClass} ref={rootRef}>
        <div className="auth-wrap">
          <div className="auth-card">
            <div className="auth-logo">
              <img src={LOGO_URL} alt="MeBook" />
              <div className="mb-logo-text">
                <span className="me">Me</span>
                <span className="book">Book</span>
              </div>
            </div>
            <p className="auth-sub">Movie lovers' social network 🎬</p>

            <div className="auth-tabs">
              <button
                className={`auth-tab ${
                  authMode === "signin" ? "active" : ""
                }`}
                onClick={() => setAuthMode("signin")}
              >
                Sign In
              </button>
              <button
                className={`auth-tab ${
                  authMode === "signup" ? "active" : ""
                }`}
                onClick={() => setAuthMode("signup")}
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
                    placeholder="••••••••"
                    minLength={6}
                    value={siPass}
                    onChange={(e) => setSiPass(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="auth-btn"
                  disabled={authBusy}
                >
                  {authBusy ? "Signing in..." : "Sign In"}
                </button>
                <div
                  className={`auth-err ${
                    authErr.si ? "show" : ""
                  }`}
                >
                  {authErr.si}
                </div>
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
                    placeholder="••••••••"
                    minLength={6}
                    value={suPass}
                    onChange={(e) => setSuPass(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="auth-btn"
                  disabled={authBusy}
                >
                  {authBusy ? "Creating..." : "Create Account"}
                </button>
                <div
                  className={`auth-err ${
                    authErr.su ? "show" : ""
                  }`}
                >
                  {authErr.su}
                </div>
              </form>
            )}

            <div className="auth-divider">OR</div>

            <button
              className="auth-google"
              onClick={handleGoogleSignIn}
            >
              <svg viewBox="0 0 48 48">
                <path
                  fill="#FFC107"
                  d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
                />
                <path
                  fill="#4CAF50"
                  d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
                />
                <path
                  fill="#1976D2"
                  d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2C41 35.4 44 30.1 44 24c0-1.2-.1-2.4-.4-3.5z"
                />
              </svg>
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ---------- MAIN APP ---------- */
  const unreadCount = chats.filter(
    (c) =>
      c.last &&
      (c.last as any).read === false &&
      (c.last as any).from !== user.uid
  ).length

  const filteredFriends = friends.filter((f) => {
    const q = friendSearch.trim().toLowerCase()
    if (!q) return true
    return (
      (f.name || "").toLowerCase().includes(q) ||
      (f.email || "").toLowerCase().includes(q)
    )
  })

  return (
    <div className={rootClass} ref={rootRef}>
      {/* HEADER */}
      <header className="mb-header">
        <div className="mb-header-left">
          <img className="mb-logo-img" src={LOGO_URL} alt="MeBook Logo" />
          <div className="mb-logo-text">
            <span className="me">Me</span>
            <span className="book">Book</span>
          </div>
        </div>

        <div className="mb-header-right">
          <button
            className="mb-icon-btn"
            title="Messages"
            onClick={() => goTo("messages")}
          >
            <svg viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
            </svg>
            {unreadCount > 0 && (
              <span className="mb-badge-dot">{unreadCount}</span>
            )}
          </button>
          <button
            className="mb-icon-btn"
            title="Settings"
            onClick={() => goTo("settings")}
          >
            <svg viewBox="0 0 24 24">
              <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
            </svg>
          </button>
          <button
            className="mb-avatar-btn"
            title="Profile"
            onClick={() => goTo("profile")}
          >
            <img src={avatarUrl(profile)} alt="Profile" />
          </button>
          <button
            className="mb-icon-btn"
            title="Menu"
            onClick={() => setDrawerOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </button>
        </div>
      </header>

      {/* DRAWER */}
      <div
        className={`mb-overlay ${drawerOpen ? "open" : ""}`}
        onClick={() => setDrawerOpen(false)}
      />
      <aside className={`mb-drawer ${drawerOpen ? "open" : ""}`}>
        <div className="mb-drawer-head">
          <img src={LOGO_URL} alt="MeBook" />
          <div className="mb-logo-text">
            <span className="me">Me</span>
            <span className="book">Book</span>
          </div>
          <button
            className="mb-drawer-close"
            onClick={() => setDrawerOpen(false)}
          >
            <svg viewBox="0 0 24 24">
              <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>
        <div className="mb-drawer-divider" />
        <nav className="mb-drawer-nav">
          <DrawerItem
            id="home"
            label="Home"
            active={currentView === "home"}
            onClick={goTo}
          />
          <DrawerItem
            id="friends"
            label="Friends"
            active={currentView === "friends"}
            onClick={goTo}
            badge={requests.length}
            icon={
              <svg viewBox="0 0 24 24">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
            }
          />
          <DrawerItem
            id="messages"
            label="Messages"
            active={currentView === "messages"}
            onClick={goTo}
            badge={unreadCount}
            icon={
              <svg viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
              </svg>
            }
          />
          <DrawerItem
            id="mebook"
            label="MeBook"
            active={currentView === "mebook"}
            onClick={goTo}
            icon={
              <svg viewBox="0 0 24 24">
                <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z" />
              </svg>
            }
          />
          <DrawerItem
            id="settings"
            label="Settings"
            active={currentView === "settings"}
            onClick={goTo}
          />
          <DrawerItem
            id="community"
            label="MeBook Community"
            active={currentView === "community"}
            onClick={goTo}
          />
          <DrawerItem
            id="profile"
            label="Profile"
            active={currentView === "profile"}
            onClick={goTo}
          />
        </nav>
        <div className="mb-drawer-divider" />
        <div className="mb-drawer-foot">
          <span>MeBook</span>
          <span className="dot" />
          <span>Real-time</span>
          <span className="dot" />
          <span>v2.0</span>
        </div>
      </aside>

      {/* MAIN LAYOUT */}
      <div className="mb-layout">
        <aside className="mb-sidebar">
          <SideItem
            id="home"
            label="Home"
            active={currentView === "home"}
            onClick={goTo}
            icon={
              <svg viewBox="0 0 24 24">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
              </svg>
            }
          />
          <SideItem
            id="friends"
            label="Friends"
            active={currentView === "friends"}
            onClick={goTo}
            icon={
              <svg viewBox="0 0 24 24">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
            }
          />
          <SideItem
            id="messages"
            label="Messages"
            active={currentView === "messages"}
            onClick={goTo}
            icon={
              <svg viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
              </svg>
            }
          />
          <div className="mb-side-divider" />
          <SideItem
            id="mebook"
            label="MeBook"
            active={currentView === "mebook"}
            onClick={goTo}
            icon={
              <svg viewBox="0 0 24 24">
                <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z" />
              </svg>
            }
          />
          <SideItem
            id="community"
            label="Community"
            active={currentView === "community"}
            onClick={goTo}
            icon={
              <svg viewBox="0 0 24 24">
                <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1z" />
              </svg>
            }
          />
          <SideItem
            id="profile"
            label="Profile"
            active={currentView === "profile"}
            onClick={goTo}
            icon={
              <svg viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            }
          />
          <SideItem
            id="settings"
            label="Settings"
            active={currentView === "settings"}
            onClick={goTo}
            icon={
              <svg viewBox="0 0 24 24">
                <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
              </svg>
            }
          />
        </aside>

        <main className="mb-main">
          {/* HOME */}
          <section
            className={`mb-view ${
              currentView === "home" ? "active" : ""
            }`}
          >
            <div className="mb-composer">
              <div className="mb-composer-top">
                <img
                  className="mb-composer-avatar"
                  src={avatarUrl(profile)}
                  alt="You"
                />
                <button
                  className="mb-composer-input"
                  onClick={() => setComposerOpen(true)}
                >
                  Share a movie screenshot or review...
                </button>
              </div>
              <div className="mb-composer-actions">
                <button
                  className="mb-comp-action"
                  onClick={() => setComposerOpen(true)}
                >
                  <svg viewBox="0 0 24 24" fill="#16a34a">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                  </svg>
                  Photo
                </button>
                <button
                  className="mb-comp-action"
                  onClick={() => setComposerOpen(true)}
                >
                  <svg viewBox="0 0 24 24" fill="#f59e0b">
                    <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
                  </svg>
                  Movie Tag
                </button>
                <button
                  className="mb-comp-action"
                  onClick={() => setComposerOpen(true)}
                >
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
          </section>

          {/* FRIENDS */}
          <section
            className={`mb-view ${
              currentView === "friends" ? "active" : ""
            }`}
          >
            <h1 className="mb-page-title">
              <svg viewBox="0 0 24 24">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
              Friends
            </h1>

            <div className="mb-search-box">
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

            <div className="mb-card" style={{ marginBottom: 16 }}>
              <div className="mb-card-title">Friend Requests</div>
              <div>
                {requests.length === 0 ? (
                  <div
                    style={{
                      color: "var(--text-muted)",
                      fontSize: 14,
                      padding: 4,
                    }}
                  >
                    No pending friend requests.
                  </div>
                ) : (
                  requests.map((r) => {
                    const photo = avatarUrl(r.fromUser)
                    return (
                      <div
                        className="mb-contact"
                        key={r.id}
                        style={{ padding: "10px 6px" }}
                      >
                        <img src={photo} alt="" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="mb-contact-name">
                            {r.fromUser.name}
                          </div>
                          <div
                            style={{
                              fontSize: 12.5,
                              color: "var(--text-muted)",
                            }}
                          >
                            Wants to be friends
                          </div>
                        </div>
                        <button
                          className="mb-btn mb-btn-primary"
                          style={{
                            width: "auto",
                            padding: "7px 14px",
                            fontSize: 13,
                          }}
                          onClick={() =>
                            handleAcceptRequest(r.id, r.from)
                          }
                        >
                          Accept
                        </button>
                        <button
                          className="mb-btn mb-btn-secondary"
                          style={{
                            width: "auto",
                            padding: "7px 14px",
                            fontSize: 13,
                          }}
                          onClick={() => handleDeclineRequest(r.id)}
                        >
                          Decline
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {myFriends.length > 0 && (
              <div className="mb-card" style={{ marginBottom: 16 }}>
                <div className="mb-card-title">My Friends</div>
                <div>
                  {myFriends.map((f) => {
                    const photo = avatarUrl(f)
                    return (
                      <div className="mb-contact" key={f.uid}>
                        <img src={photo} alt="" />
                        <div className="mb-contact-name">{f.name}</div>
                        <button
                          className="mb-btn mb-btn-secondary"
                          style={{
                            width: "auto",
                            padding: "6px 12px",
                            fontSize: 12.5,
                          }}
                          onClick={() =>
                            startChat(f.uid, f.name, photo)
                          }
                        >
                          Message
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div
              className="mb-card-title"
              style={{ fontSize: 18, marginBottom: 10 }}
            >
              All MeBook Users
            </div>
            <div className="mb-friends-grid">
              {filteredFriends.length === 0 ? (
                <div
                  className="mb-empty"
                  style={{ gridColumn: "1/-1" }}
                >
                  No users found.
                </div>
              ) : (
                filteredFriends.map((u) => {
                  const photo = avatarUrl(u)
                  return (
                    <div className="mb-friend-card" key={u.uid}>
                      <div
                        className="mb-friend-cover"
                        style={
                          u.coverURL
                            ? {
                                background: `url('${u.coverURL}') center/cover`,
                              }
                            : undefined
                        }
                      />
                      <div className="mb-friend-body">
                        <img
                          src={photo}
                          alt={u.name}
                          onClick={() => handleOpenUser(u.uid)}
                        />
                        <div className="mb-friend-name">{u.name}</div>
                        <div className="mb-friend-mutual">
                          MeBook Member
                        </div>
                        <div className="mb-friend-btns">
                          <button
                            className="mb-btn mb-btn-primary"
                            onClick={() => handleSendRequest(u.uid)}
                          >
                            Add Friend
                          </button>
                          <button
                            className="mb-btn mb-btn-secondary"
                            onClick={() => handleOpenUser(u.uid)}
                          >
                            View Profile
                          </button>
                          <button
                            className="mb-btn mb-btn-outline"
                            onClick={() =>
                              startChat(u.uid, u.name, photo)
                            }
                          >
                            Message
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </section>

          {/* MESSAGES */}
          <section
            className={`mb-view ${
              currentView === "messages" ? "active" : ""
            }`}
          >
            <h1 className="mb-page-title">
              <svg viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
              </svg>
              Messages
            </h1>
            <div className="mb-chat-wrap">
              <div className="mb-chat-list">
                {chats.length === 0 ? (
                  <div
                    style={{
                      padding: 20,
                      color: "var(--text-muted)",
                      fontSize: 14,
                      textAlign: "center",
                    }}
                  >
                    No conversations yet. Start one from Friends page!
                  </div>
                ) : (
                  chats.map((c) => {
                    const photo = avatarUrl(c.other)
                    return (
                      <div
                        className={`mb-chat-item ${
                          activeChat === c.id ? "active" : ""
                        }`}
                        key={c.id}
                        onClick={() =>
                          openChat(c.id, c.otherId, c.other)
                        }
                      >
                        <img src={photo} alt="" />
                        <div className="mb-chat-item-body">
                          <div className="mb-chat-item-name">
                            {c.other.name}
                          </div>
                          <div className="mb-chat-item-last">
                            {(c.last as any)?.text || "Say hi 👋"}
                          </div>
                        </div>
                        <div className="mb-chat-item-time">
                          {c.lastAt ? timeAgo(c.lastAt) : ""}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
              <div className="mb-chat-window">
                {!activeChat || !chatPartner ? (
                  <div className="mb-chat-empty">
                    <svg viewBox="0 0 24 24">
                      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                    </svg>
                    <b>Select a conversation</b>
                    <p style={{ fontSize: 13 }}>
                      Choose someone to start chatting
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-chat-head">
                      <img src={avatarUrl(chatPartner)} alt="" />
                      <div className="mb-chat-head-info">
                        <div className="mb-chat-head-name">
                          {chatPartner.name}
                        </div>
                        <div className="mb-chat-head-status">
                          ● Active on MeBook
                        </div>
                      </div>
                      <button
                        className="mb-icon-btn"
                        style={{ background: "var(--input-bg)" }}
                        onClick={() =>
                          handleOpenUser(chatPartner.uid)
                        }
                      >
                        <svg
                          viewBox="0 0 24 24"
                          style={{ fill: "var(--text)" }}
                        >
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      </button>
                    </div>
                    <div className="mb-chat-body">
                      {chatMessages.map((m) => {
                        const mine = m.from === user.uid
                        const time = m.at
                          ? new Date(
                              m.at.seconds * 1000
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""
                        return (
                          <div
                            className={`mb-bubble ${
                              mine ? "me" : "them"
                            }`}
                            key={m.id}
                          >
                            {m.text}
                            <span className="mb-bubble-time">
                              {time}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                    <div className="mb-chat-input">
                      <input
                        type="text"
                        placeholder="Type a message..."
                        value={chatInput}
                        onChange={(e) =>
                          setChatInput(e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSendMessage()
                        }}
                      />
                      <button onClick={handleSendMessage}>
                        <svg viewBox="0 0 24 24">
                          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* MEBOOK */}
          <section
            className={`mb-view ${
              currentView === "mebook" ? "active" : ""
            }`}
          >
            <div className="mb-mebook-hero">
              <h2>📖 Welcome to MeBook</h2>
              <p>
                Your personal movie library, watchlist, and review hub —
                all in one place.
              </p>
              <span className="mb-mebook-badge">
                🎬 Powered by MeBook Community
              </span>
            </div>

            <div className="mb-mebook-grid">
              <div className="mb-mebook-stat">
                <div className="num">128</div>
                <div className="lbl">Movies Reviewed</div>
              </div>
              <div className="mb-mebook-stat">
                <div className="num">42</div>
                <div className="lbl">In Watchlist</div>
              </div>
              <div className="mb-mebook-stat">
                <div className="num">17</div>
                <div className="lbl">Reviews Written</div>
              </div>
              <div className="mb-mebook-stat">
                <div className="num">9</div>
                <div className="lbl">Favorites</div>
              </div>
            </div>

            <div className="mb-mebook-tabs">
              {[
                { id: "featured", label: "⭐ Featured" },
                { id: "watchlist", label: "📌 Watchlist" },
                { id: "favorites", label: "❤️ Favorites" },
                { id: "notes", label: "📝 My Notes" },
              ].map((t) => (
                <button
                  key={t.id}
                  className={`mb-mebook-tab ${
                    mebookTab === t.id ? "active" : ""
                  }`}
                  onClick={() => {
                    setMebookTab(t.id)
                    if (t.id !== "featured")
                      showToast(
                        `${t.label} coming soon`
                      )
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div>
              <div className="mb-card" style={{ marginBottom: 16 }}>
                <div className="mb-card-title">
                  🎬 Editor's Picks This Week
                </div>
                <div className="mb-mebook-list">
                  {[
                    {
                      img: "https://image.tmdb.org/t/p/w200/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
                      seed: "dune",
                      title: "Dune: Part Two",
                      desc: "Paul Atreides unites with Chani and the Fremen while seeking revenge.",
                      meta: "⭐ 8.7 • Sci-Fi • 2024",
                    },
                    {
                      img: "https://image.tmdb.org/t/p/w200/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg",
                      seed: "oppen",
                      title: "Oppenheimer",
                      desc: "The story of J. Robert Oppenheimer and the atomic bomb.",
                      meta: "⭐ 8.5 • Biography • 2023",
                    },
                    {
                      img: "https://image.tmdb.org/t/p/w200/1E5baAaEse26fej7uHcjOgEE2t2.jpg",
                      seed: "inter",
                      title: "Interstellar",
                      desc: "Explorers travel through a wormhole in search of a new home.",
                      meta: "⭐ 8.7 • Adventure • 2014",
                    },
                    {
                      img: "https://image.tmdb.org/t/p/w200/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
                      seed: "incept",
                      title: "Inception",
                      desc: "A thief plants an idea in a target's subconscious.",
                      meta: "⭐ 8.8 • Sci-Fi • 2010",
                    },
                  ].map((m) => (
                    <div className="mb-mebook-item" key={m.title}>
                      <img
                        src={m.img}
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).src =
                            `https://picsum.photos/seed/${m.seed}/200/260`
                        }}
                      />
                      <div className="mb-mebook-item-body">
                        <div className="mb-mebook-item-title">
                          {m.title}
                        </div>
                        <div className="mb-mebook-item-desc">
                          {m.desc}
                        </div>
                        <div className="mb-mebook-item-meta">
                          {m.meta}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-card">
                <div className="mb-card-title">💡 Quick Actions</div>
                <div className="mb-mebook-list">
                  <div
                    className="mb-mebook-item"
                    onClick={() => setComposerOpen(true)}
                  >
                    <div
                      style={{
                        width: 64,
                        height: 84,
                        background:
                          "linear-gradient(135deg,#16a34a,#0f172a)",
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="#fff"
                      >
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                      </svg>
                    </div>
                    <div className="mb-mebook-item-body">
                      <div className="mb-mebook-item-title">
                        Add New Review
                      </div>
                      <div className="mb-mebook-item-desc">
                        Share your thoughts on a movie you just watched.
                      </div>
                      <div className="mb-mebook-item-meta">
                        Tap to create →
                      </div>
                    </div>
                  </div>
                  <div
                    className="mb-mebook-item"
                    onClick={() => goTo("community")}
                  >
                    <div
                      style={{
                        width: 64,
                        height: 84,
                        background:
                          "linear-gradient(135deg,#8b5cf6,#0f172a)",
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="#fff"
                      >
                        <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z" />
                      </svg>
                    </div>
                    <div className="mb-mebook-item-body">
                      <div className="mb-mebook-item-title">
                        Visit Community
                      </div>
                      <div className="mb-mebook-item-desc">
                        See what other movie lovers are talking about.
                      </div>
                      <div className="mb-mebook-item-meta">
                        Explore →
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* PROFILE */}
          <section
            className={`mb-view ${
              currentView === "profile" ? "active" : ""
            }`}
          >
            <div className="mb-profile-head">
              <div
                className="mb-profile-cover"
                onClick={handleChangeCover}
              >
                <img
                  src={
                    profile.coverURL ||
                    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&q=80"
                  }
                  alt="Cover"
                />
                <div className="mb-profile-cover-add">
                  <svg viewBox="0 0 24 24">
                    <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
                  </svg>
                  Change Cover
                </div>
              </div>
              <div className="mb-profile-info">
                <div
                  className="mb-profile-avatar-wrap"
                  onClick={handleChangeProfilePhoto}
                >
                  <img src={avatarUrl(profile)} alt="Profile" />
                  <div className="mb-profile-avatar-add">
                    <svg viewBox="0 0 24 24">
                      <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
                    </svg>
                  </div>
                </div>
                <div className="mb-profile-text">
                  <div className="mb-profile-name">{profile.name}</div>
                  <div className="mb-profile-bio">
                    {profile.bio || "Movie lover 🎬"}
                  </div>
                </div>
              </div>
              <div className="mb-profile-actions">
                <button
                  className="mb-btn mb-btn-primary"
                  onClick={() => setComposerOpen(true)}
                >
                  ＋ Create Post
                </button>
                <button
                  className="mb-btn mb-btn-secondary"
                  onClick={handleEditProfile}
                >
                  Edit Profile
                </button>
              </div>
            </div>

            <div className="mb-card" style={{ marginBottom: 16 }}>
              <div className="mb-card-title">Personal Information</div>
              <div className="mb-info-grid">
                <div className="mb-info-row">
                  <svg viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" />
                  </svg>
                  <span>
                    <b>Email:</b> {profile.email || ""}
                  </span>
                </div>
                <div className="mb-info-row">
                  <svg viewBox="0 0 24 24">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                  </svg>
                  <span>
                    <b>Phone:</b> {profile.phone || "Not set"}
                  </span>
                </div>
                <div className="mb-info-row">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  </svg>
                  <span>
                    <b>Location:</b> {profile.location || "Not set"}
                  </span>
                </div>
                <div className="mb-info-row">
                  <svg viewBox="0 0 24 24">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
                  </svg>
                  <span>
                    <b>Joined:</b>{" "}
                    {profile.createdAt
                      ? new Date(
                          profile.createdAt.seconds * 1000
                        ).toLocaleDateString()
                      : "Just now"}
                  </span>
                </div>
              </div>
            </div>

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
                      setPrivacy({
                        ...privacy,
                        requests: e.target.checked,
                      })
                      setTimeout(handleSavePrivacy, 0)
                    }}
                  />
                  <span className="mb-slider" />
                </label>
              </div>
            </div>

            <div
              className="mb-card-title"
              style={{ fontSize: 18, marginBottom: 10 }}
            >
              My Posts
            </div>
            <div>
              {myPosts.length === 0 ? (
                <div className="mb-empty">
                  <svg viewBox="0 0 24 24">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                  </svg>
                  <b>No posts yet</b>
                  <p style={{ fontSize: 14, marginTop: 4 }}>
                    Create your first movie review!
                  </p>
                </div>
              ) : (
                myPosts.map((p) => renderPost(p, true))
              )}
            </div>
          </section>

          {/* SETTINGS */}
          <section
            className={`mb-view ${
              currentView === "settings" ? "active" : ""
            }`}
          >
            <h1 className="mb-page-title">
              <svg viewBox="0 0 24 24">
                <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
              </svg>
              Settings
            </h1>

            <div className="mb-card mb-settings-group">
              <div className="mb-card-title">Account</div>
              <div className="mb-setting-row" onClick={handleEditProfile}>
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
              <div
                className="mb-setting-row"
                onClick={handleResetPassword}
              >
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
              <div
                className="mb-setting-row"
                onClick={() => showToast("Privacy settings synced")}
              >
                <span className="mb-setting-ico">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                  </svg>
                </span>
                <div className="mb-setting-txt">
                  <h4>Privacy</h4>
                  <p>Control who sees your posts & info</p>
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
              <div
                className="mb-setting-row"
                onClick={() => showToast("Language: English")}
              >
                <span className="mb-setting-ico">
                  <svg viewBox="0 0 24 24">
                    <path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0 0 14.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12z" />
                  </svg>
                </span>
                <div className="mb-setting-txt">
                  <h4>Language</h4>
                  <p>English (US)</p>
                </div>
                <svg className="chev" viewBox="0 0 24 24">
                  <path d="M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6z" />
                </svg>
              </div>
            </div>

            <div className="mb-card mb-settings-group">
              <div className="mb-card-title">Support</div>
              <div
                className="mb-setting-row"
                onClick={() => showToast("Help center — coming soon")}
              >
                <span className="mb-setting-ico">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26A1.99 1.99 0 0 0 12 7a2 2 0 0 0-2 2H8a4 4 0 0 1 8 0c0 .88-.36 1.68-.93 2.25z" />
                  </svg>
                </span>
                <div className="mb-setting-txt">
                  <h4>Help Center</h4>
                  <p>FAQs and support</p>
                </div>
                <svg className="chev" viewBox="0 0 24 24">
                  <path d="M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6z" />
                </svg>
              </div>
              <div className="mb-setting-row" onClick={handleSignOut}>
                <span
                  className="mb-setting-ico"
                  style={{ background: "#fee2e2" }}
                >
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
          </section>

          {/* COMMUNITY */}
          <section
            className={`mb-view ${
              currentView === "community" ? "active" : ""
            }`}
          >
            <div className="mb-community-hero">
              <h2>🎬 MeBook Community</h2>
              <p>
                Official posts, announcements and featured reviews from
                the MeBook team.
              </p>
            </div>
            <div>
              {communityFeed.length === 0 ? (
                <>
                  {[
                    {
                      id: "comm-1",
                      authorId: "admin",
                      authorName: "MeBook Official",
                      authorAvatar: LOGO_URL,
                      verified: true,
                      caption:
                        "🎉 Welcome to the MeBook Community! Share your favourite movie screenshots & reviews. Use #MeBookReview to get featured!",
                      movie: "Community Announcement",
                      image:
                        "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=900&q=80",
                      likes: [],
                      comments: [],
                      shares: 0,
                      timeText: "just now",
                    },
                    {
                      id: "comm-2",
                      authorId: "admin",
                      authorName: "MeBook Official",
                      authorAvatar: LOGO_URL,
                      verified: true,
                      caption:
                        "🎬 This week's featured reviews are coming! Keep posting your best reviews.",
                      movie: "Weekly Spotlight",
                      image:
                        "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=900&q=80",
                      likes: [],
                      comments: [],
                      shares: 0,
                      timeText: "just now",
                    },
                  ].map((p) => renderPost(p))}
                </>
              ) : (
                communityFeed.map((p) => renderPost(p))
              )}
            </div>
          </section>
        </main>

        <aside className="mb-right">
          <div className="mb-card">
            <div className="mb-card-title">🔥 Trending Now</div>
            {[
              {
                img: "https://image.tmdb.org/t/p/w92/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
                seed: "m1",
                name: "Dune: Part Two",
                meta: "⭐ 8.7 • Sci-Fi",
              },
              {
                img: "https://image.tmdb.org/t/p/w92/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg",
                seed: "m2",
                name: "Oppenheimer",
                meta: "⭐ 8.5 • Biography",
              },
              {
                img: "https://image.tmdb.org/t/p/w92/1E5baAaEse26fej7uHcjOgEE2t2.jpg",
                seed: "m3",
                name: "Interstellar",
                meta: "⭐ 8.7 • Adventure",
              },
            ].map((m) => (
              <div className="mb-contact" key={m.name}>
                <img
                  src={m.img}
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src =
                      `https://picsum.photos/seed/${m.seed}/80`
                  }}
                />
                <div>
                  <div className="mb-contact-name">{m.name}</div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                    }}
                  >
                    {m.meta}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-card">
            <div className="mb-card-title">👥 Online Friends</div>
            {onlineList.length === 0 ? (
              <div
                style={{
                  fontSize: 13,
                  color: "var(--text-muted)",
                  padding: 6,
                }}
              >
                No other users yet
              </div>
            ) : (
              onlineList.map((u) => {
                const photo = avatarUrl(u)
                return (
                  <div
                    className="mb-contact"
                    key={u.uid}
                    onClick={() => startChat(u.uid, u.name, photo)}
                  >
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

      {/* COMPOSER MODAL */}
      <div
        className={`mb-modal-overlay ${
          composerOpen ? "open" : ""
        }`}
      >
        <div className="mb-modal">
          <div className="mb-modal-head">
            Create Post
            <button
              className="mb-modal-close"
              onClick={() => setComposerOpen(false)}
            >
              <svg viewBox="0 0 24 24">
                <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>
          <div className="mb-modal-body">
            <div className="mb-modal-user">
              <img src={avatarUrl(profile)} alt="You" />
              <div>
                <b>{profile.name}</b>
                <div
                  style={{ fontSize: 12, color: "var(--text-muted)" }}
                >
                  Public
                </div>
              </div>
            </div>
            <textarea
              className="mb-modal-textarea"
              placeholder="What's your take on this movie? Share your review..."
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
            />
            <div className="mb-movie-tag">
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
                <div
                  className="mb-upload-box"
                  onClick={() =>
                    document
                      .getElementById("mebook-file-input")
                      ?.click()
                  }
                >
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
              <div className="mb-preview">
                <img src={previewUrl} alt="preview" />
                <button
                  className="mb-preview-remove"
                  onClick={removePreview}
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              </div>
            )}
            {uploadProgress !== null && (
              <div style={{ marginTop: 10 }}>
                <div
                  style={{
                    height: 6,
                    background: "var(--border)",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${uploadProgress}%`,
                      background: "var(--green)",
                      transition: "width .3s ease",
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    marginTop: 4,
                  }}
                >
                  Uploading... {uploadProgress}%
                </div>
              </div>
            )}
          </div>
          <div className="mb-modal-foot">
            <button
              className="mb-btn mb-btn-secondary"
              onClick={() => setComposerOpen(false)}
            >
              Cancel
            </button>
            <button
              className="mb-btn mb-btn-primary"
              onClick={handleSubmitPost}
              disabled={postBusy}
            >
              {postBusy ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      <div className={`mb-modal-overlay ${editOpen ? "open" : ""}`}>
        <div className="mb-modal">
          <div className="mb-modal-head">
            Edit Profile
            <button
              className="mb-modal-close"
              onClick={() => setEditOpen(false)}
            >
              <svg viewBox="0 0 24 24">
                <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>
          <div className="mb-modal-body">
            <div className="auth-field">
              <label>Full Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
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
                placeholder="Dhaka, Bangladesh"
                value={editLoc}
                onChange={(e) => setEditLoc(e.target.value)}
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
          </div>
          <div className="mb-modal-foot">
            <button
              className="mb-btn mb-btn-secondary"
              onClick={() => setEditOpen(false)}
            >
              Cancel
            </button>
            <button
              className="mb-btn mb-btn-primary"
              onClick={handleSaveProfile}
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {/* USER PROFILE MODAL */}
      <div
        className={`mb-modal-overlay ${
          userModalOpen ? "open" : ""
        }`}
      >
        <div className="mb-modal" style={{ maxWidth: 440 }}>
          <div className="mb-modal-head">
            Profile
            <button
              className="mb-modal-close"
              onClick={() => setUserModalOpen(false)}
            >
              <svg viewBox="0 0 24 24">
                <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>
          <div className="mb-modal-body">{userModalBody}</div>
        </div>
      </div>

      {/* TOAST */}
      <div className={`mb-toast ${toast.show ? "show" : ""}`}>
        <svg viewBox="0 0 24 24">
          <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
        <span>{toast.msg}</span>
      </div>
    </div>
  )
}

/* ============================================================
   SMALL SUB-COMPONENTS
============================================================ */

function DrawerItem({
  id,
  label,
  active,
  onClick,
  badge,
  icon,
}: {
  id: string
  label: string
  active: boolean
  onClick: (id: string) => void
  badge?: number
  icon?: React.ReactNode
}) {
  const defaultIcon = (
    <svg viewBox="0 0 24 24">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    </svg>
  )
  return (
    <button
      className={`mb-nav-item ${active ? "active" : ""}`}
      onClick={() => onClick(id)}
    >
      <span className="mb-nav-ico">{icon || defaultIcon}</span>
      {label}
      {badge && badge > 0 ? (
        <span className="mb-nav-badge">{badge}</span>
      ) : null}
    </button>
  )
}

function SideItem({
  id,
  label,
  active,
  onClick,
  icon,
}: {
  id: string
  label: string
  active: boolean
  onClick: (id: string) => void
  icon?: React.ReactNode
}) {
  return (
    <button
      className={`mb-side-item ${active ? "active" : ""}`}
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
    </button>
  )
}

function CommentButton({
  postId,
  comments,
  user,
  onAdd,
}: {
  postId: string
  comments: any[]
  user: any
  onAdd: (postId: string, text: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState("")

  return (
    <>
      <button
        className="mb-action"
        onClick={() => setOpen((v) => !v)}
      >
        <svg viewBox="0 0 24 24">
          <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z" />
        </svg>
        Comment
      </button>
      {open && (
        <div
          className="mb-comments open"
          style={{ width: "100%" }}
        >
          {comments.map((c, i) => (
            <div className="mb-comment" key={i}>
              <img
                src={
                  c.avatar ||
                  `https://ui-avatars.com/api/?background=16a34a&color=fff&name=${encodeURIComponent(
                    c.name || "U"
                  )}`
                }
                alt=""
              />
              <div className="mb-comment-body">
                <b>{c.name || "User"}</b>
                {c.text || ""}
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    marginTop: 3,
                  }}
                >
                  {timeAgo(c.at)}
                </div>
              </div>
            </div>
          ))}
          <div className="mb-comment-input">
            <img
              src={
                user?.photoURL ||
                `https://ui-avatars.com/api/?background=16a34a&color=fff&name=${encodeURIComponent(
                  user?.name || "U"
                )}`
              }
              alt=""
            />
            <input
              type="text"
              placeholder="Write a comment..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onAdd(postId, text)
                  setText("")
                }
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}
