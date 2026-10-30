"use client"

import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  type ReactNode,
} from "react"
import {
  Eye,
  ArrowLeft,
  ThumbsUp,
  MessageCircle,
  Share2,
  Send,
  X,
  MoreHorizontal,
  Copy,
  Check,
  Mail,
  MessageSquare,
  Pencil,
  Trash2,
  Star,
} from "lucide-react"
import { movies } from "@/lib/movie-data"
import TelegramJoinPopup from "./telegram-join-popup"
import AuthModal from "./auth-modal"
import SubscriptionPanel from "./subscription-panel"
import { useAuth } from "./auth-provider"
import MovieCast from "./movie-cast"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type DetailItem = {
  id: number
  title: string
  poster: string
  year: number | string
  rating: number | string
  description: string
  genre: string
  trailer?: string
  telegramLink?: string
  telegram4kLink?: string
  language?: string
  tmdbId?: number
  tmdbType?: "movie" | "tv"
  imdbId?: string
  mdlId?: string
}

interface MovieDetailPageProps {
  movie: DetailItem
  onBack: () => void
  onMovieClick?: (movie: DetailItem) => void
  showAdultContent?: boolean
  relatedItems?: DetailItem[]
  mediaType?: "movie" | "anime"
}

type CommentItem = {
  id: string
  userId: string
  name: string
  avatar?: string
  text: string
  createdAt: number
  editedAt?: number
  parentId?: string
  likes: string[]
}

type SocialState = {
  likes: string[]
  comments: CommentItem[]
}

type Me = { id: string; name: string; avatar?: string }

const SITE_URL = "https://mvbds.xyz"
const BG = "#0b0711"

/* ------------------------------------------------------------------ */
/*  Social data layer (likes + comments)                               */
/*  এখন এটা localStorage এ save হয়। সব ইউজারের জন্য real-time shared    */
/*  করতে শুধু readSocial / writeSocial বদলে আপনার database call বসাতে হবে */
/* ------------------------------------------------------------------ */

const EMPTY_SOCIAL: SocialState = { likes: [], comments: [] }

function readSocial(key: string): SocialState {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return EMPTY_SOCIAL
    const p = JSON.parse(raw)
    return {
      likes: Array.isArray(p.likes) ? p.likes : [],
      comments: Array.isArray(p.comments) ? p.comments : [],
    }
  } catch {
    return EMPTY_SOCIAL
  }
}

function writeSocial(key: string, state: SocialState) {
  try {
    localStorage.setItem(key, JSON.stringify(state))
  } catch {
    /* storage full / blocked */
  }
}

function useMovieSocial(storageKey: string) {
  const [state, setState] = useState<SocialState>(EMPTY_SOCIAL)

  useEffect(() => {
    setState(readSocial(storageKey))
    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey) setState(readSocial(storageKey))
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [storageKey])

  const update = useCallback(
    (fn: (s: SocialState) => SocialState) => {
      const next = fn(readSocial(storageKey))
      writeSocial(storageKey, next)
      setState(next)
    },
    [storageKey]
  )

  return [state, update] as const
}

/* ------------------------------------------------------------------ */
/*  Small helpers                                                      */
/* ------------------------------------------------------------------ */

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return "Just now"
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d`
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  })
}

function hashColor(str: string) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360
  return `linear-gradient(135deg, hsl(${h} 70% 55%), hsl(${(h + 50) % 360} 70% 42%))`
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement("textarea")
      ta.value = text
      ta.style.position = "fixed"
      ta.style.opacity = "0"
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand("copy")
      document.body.removeChild(ta)
      return ok
    } catch {
      return false
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Brand icons                                                        */
/* ------------------------------------------------------------------ */

function TelegramLogo({ size = 28, uid = "a" }: { size?: number; uid?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 240 240" aria-hidden="true">
      <defs>
        <linearGradient id={`tgA-${uid}`} x1=".667" x2=".417" y1=".167" y2=".75">
          <stop offset="0" stopColor="#37aee2" />
          <stop offset="1" stopColor="#1e96c8" />
        </linearGradient>
        <linearGradient id={`tgB-${uid}`} x1=".66" x2=".851" y1=".437" y2=".802">
          <stop offset="0" stopColor="#eff7fc" />
          <stop offset="1" stopColor="#fff" />
        </linearGradient>
      </defs>
      <circle cx="120" cy="120" r="120" fill={`url(#tgA-${uid})`} />
      <path fill="#c8daea" d="M98 175c-3.888 0-3.227-1.468-4.568-5.17L82 132.207 170 80" />
      <path fill="#a9c9dd" d="M98 175c3 0 4.325-1.372 6-3l16-15.558-19.958-12.035" />
      <path
        fill={`url(#tgB-${uid})`}
        d="M100.04 144.41l48.36 35.729c5.519 3.045 9.501 1.468 10.876-5.123l19.685-92.763c2.015-8.08-3.08-11.746-8.36-9.349l-115.59 44.571c-7.89 3.165-7.843 7.567-1.438 9.528l29.663 9.259 68.673-43.325c3.242-1.966 6.218-.91 3.776 1.258"
      />
    </svg>
  )
}

function YouTubeLogo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="0.8" y="4.2" width="22.4" height="15.6" rx="4.6" fill="#FF0000" />
      <path d="M9.8 8.6v6.8l5.9-3.4z" fill="#fff" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  Avatar                                                             */
/* ------------------------------------------------------------------ */

function Avatar({
  name,
  src,
  size = 36,
}: {
  name: string
  src?: string
  size?: number
}) {
  const initial = (name || "U").trim().charAt(0).toUpperCase()
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: hashColor(name || "U"),
        fontSize: size * 0.42,
      }}
    >
      {initial}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Bottom-sheet shell (mobile: bottom sheet, desktop: centered modal) */
/* ------------------------------------------------------------------ */

function Sheet({
  title,
  onClose,
  children,
  tall,
}: {
  title: ReactNode
  onClose: () => void
  children: ReactNode
  tall?: boolean
}) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm mv-fade"
        onClick={onClose}
      />
      <div
        className={`relative w-full sm:max-w-lg flex flex-col bg-[#15101f] border border-white/10 shadow-2xl rounded-t-[28px] sm:rounded-[28px] mv-sheet ${
          tall ? "h-[88vh] sm:h-[80vh]" : "max-h-[88vh]"
        }`}
      >
        <div className="sm:hidden flex justify-center pt-2.5">
          <span className="h-1 w-10 rounded-full bg-white/20" />
        </div>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 flex-shrink-0">
          <h3 className="text-base font-bold text-white">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Share sheet                                                        */
/* ------------------------------------------------------------------ */

function ShareSheet({
  title,
  onClose,
}: {
  title: string
  onClose: () => void
}) {
  const [toast, setToast] = useState("")
  const shareText = `🎬 ${title} — MoviesVerse এ দেখুন`
  const fullText = `${shareText}\n${SITE_URL}`
  const enc = encodeURIComponent
  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function"

  const flash = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(""), 2200)
  }

  const open = (url: string) =>
    window.open(url, "_blank", "noopener,noreferrer")

  const doCopy = async (msg = "Link copied!") => {
    const ok = await copyText(SITE_URL)
    flash(ok ? msg : "Copy failed")
  }

  const targets: {
    key: string
    label: string
    bg: string
    icon: ReactNode
    action: () => void
  }[] = [
    {
      key: "wa",
      label: "WhatsApp",
      bg: "#25D366",
      icon: <MessageCircle className="w-6 h-6 text-white" fill="white" />,
      action: () => open(`https://wa.me/?text=${enc(fullText)}`),
    },
    {
      key: "tg",
      label: "Telegram",
      bg: "#229ED9",
      icon: <TelegramLogo size={34} uid="share" />,
      action: () =>
        open(`https://t.me/share/url?url=${enc(SITE_URL)}&text=${enc(shareText)}`),
    },
    {
      key: "ms",
      label: "Messenger",
      bg: "linear-gradient(135deg,#00B2FF,#006AFF 55%,#A033FF)",
      icon: <MessageCircle className="w-6 h-6 text-white" fill="white" />,
      action: () => {
        const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
        if (mobile) {
          window.location.href = `fb-messenger://share/?link=${enc(SITE_URL)}`
        } else {
          open(`https://www.facebook.com/sharer/sharer.php?u=${enc(SITE_URL)}`)
        }
      },
    },
    {
      key: "imo",
      label: "imo",
      bg: "#0A8CFF",
      icon: <span className="text-white font-black text-lg lowercase">imo</span>,
      action: async () => {
        await copyText(fullText)
        flash("Copied — imo তে paste করুন")
      },
    },
    {
      key: "fb",
      label: "Facebook",
      bg: "#1877F2",
      icon: <span className="text-white font-black text-2xl leading-none">f</span>,
      action: () =>
        open(`https://www.facebook.com/sharer/sharer.php?u=${enc(SITE_URL)}`),
    },
    {
      key: "x",
      label: "X",
      bg: "#000000",
      icon: <span className="text-white font-black text-xl leading-none">𝕏</span>,
      action: () =>
        open(`https://twitter.com/intent/tweet?text=${enc(shareText)}&url=${enc(SITE_URL)}`),
    },
    {
      key: "sms",
      label: "SMS",
      bg: "#34C759",
      icon: <MessageSquare className="w-6 h-6 text-white" />,
      action: () => {
        window.location.href = `sms:?&body=${enc(fullText)}`
      },
    },
    {
      key: "mail",
      label: "Email",
      bg: "#EA4335",
      icon: <Mail className="w-6 h-6 text-white" />,
      action: () => {
        window.location.href = `mailto:?subject=${enc(shareText)}&body=${enc(fullText)}`
      },
    },
  ]

  return (
    <Sheet title="Share" onClose={onClose}>
      <div className="p-5 overflow-y-auto">
        <p className="text-sm text-slate-400 mb-5">
          বন্ধুদের সাথে MoviesVerse শেয়ার করুন
        </p>

        <div className="grid grid-cols-4 gap-y-5 gap-x-2">
          {targets.map((t) => (
            <button
              key={t.key}
              onClick={t.action}
              className="flex flex-col items-center gap-2 group"
            >
              <span
                className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition group-hover:scale-110 group-active:scale-95"
                style={{ background: t.bg }}
              >
                {t.icon}
              </span>
              <span className="text-[11px] text-slate-300">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 p-2 pl-4">
          <span className="flex-1 truncate text-sm text-slate-200">
            {SITE_URL}
          </span>
          <button
            onClick={() => doCopy()}
            className="flex items-center gap-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold px-4 py-2 transition active:scale-95"
          >
            <Copy className="w-4 h-4" />
            Copy
          </button>
        </div>

        {canNativeShare && (
          <button
            onClick={() =>
              navigator
                .share({ title: "MoviesVerse", text: shareText, url: SITE_URL })
                .catch(() => {})
            }
            className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 py-3 text-sm font-semibold transition"
          >
            More options…
          </button>
        )}

        <div
          className={`mt-4 flex items-center justify-center gap-2 text-sm text-emerald-400 transition-all ${
            toast ? "opacity-100" : "opacity-0"
          }`}
        >
          <Check className="w-4 h-4" />
          {toast || "."}
        </div>
      </div>
    </Sheet>
  )
}

/* ------------------------------------------------------------------ */
/*  Comments sheet (Facebook style)                                    */
/* ------------------------------------------------------------------ */

function CommentsSheet({
  comments,
  me,
  onClose,
  onAdd,
  onEdit,
  onDelete,
  onLike,
  onNeedLogin,
}: {
  comments: CommentItem[]
  me: Me | null
  onClose: () => void
  onAdd: (text: string, parentId?: string) => void
  onEdit: (id: string, text: string) => void
  onDelete: (id: string) => void
  onLike: (id: string) => void
  onNeedLogin: () => void
}) {
  const [text, setText] = useState("")
  const [replyTo, setReplyTo] = useState<CommentItem | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [menuId, setMenuId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const roots = useMemo(
    () =>
      comments
        .filter((c) => !c.parentId)
        .sort((a, b) => b.createdAt - a.createdAt),
    [comments]
  )
  const repliesOf = (id: string) =>
    comments
      .filter((c) => c.parentId === id)
      .sort((a, b) => a.createdAt - b.createdAt)

  const expand = (id: string) =>
    setExpanded((prev) => new Set(prev).add(id))

  const submit = () => {
    const t = text.trim()
    if (!t) return
    if (!me) {
      onNeedLogin()
      return
    }
    if (editingId) {
      onEdit(editingId, t)
      setEditingId(null)
    } else if (replyTo) {
      const rootId = replyTo.parentId ?? replyTo.id
      onAdd(t, rootId)
      expand(rootId)
    } else {
      onAdd(t)
    }
    setText("")
    setReplyTo(null)
  }

  const startReply = (c: CommentItem) => {
    if (!me) return onNeedLogin()
    setEditingId(null)
    setReplyTo(c)
    setText(c.userId === me.id ? "" : `@${c.name} `)
    setTimeout(() => inputRef.current?.focus(), 30)
  }

  const startEdit = (c: CommentItem) => {
    setMenuId(null)
    setReplyTo(null)
    setEditingId(c.id)
    setText(c.text)
    setTimeout(() => inputRef.current?.focus(), 30)
  }

  const cancelCompose = () => {
    setReplyTo(null)
    setEditingId(null)
    setText("")
  }

  const renderComment = (c: CommentItem, isReply: boolean) => {
    const mine = !!me && me.id === c.userId
    const liked = !!me && c.likes.includes(me.id)
    const replies = isReply ? [] : repliesOf(c.id)
    const open = expanded.has(c.id)

    return (
      <div key={c.id} className="mv-fadeup">
        <div className="flex gap-2.5">
          <Avatar name={c.name} src={c.avatar} size={isReply ? 28 : 36} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-1.5">
              <div className="relative max-w-full rounded-2xl bg-white/[0.08] px-3.5 py-2">
                <p className="text-[13px] font-semibold text-white leading-tight">
                  {c.name}
                </p>
                <p className="text-[14px] text-slate-200 whitespace-pre-wrap break-words leading-snug mt-0.5">
                  {c.text}
                </p>
                {c.likes.length > 0 && (
                  <span className="absolute -bottom-2.5 right-2 flex items-center gap-1 rounded-full bg-[#2a2338] border border-white/10 px-1.5 py-0.5 text-[11px] text-slate-200 shadow">
                    <span className="w-4 h-4 rounded-full bg-sky-500 flex items-center justify-center">
                      <ThumbsUp className="w-2.5 h-2.5 text-white" fill="white" />
                    </span>
                    {c.likes.length}
                  </span>
                )}
              </div>

              {mine && (
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => setMenuId(menuId === c.id ? null : c.id)}
                    aria-label="Comment options"
                    className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  {menuId === c.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setMenuId(null)}
                      />
                      <div className="absolute right-0 top-9 z-20 w-36 rounded-xl bg-[#241d33] border border-white/10 shadow-2xl overflow-hidden mv-pop-in">
                        <button
                          onClick={() => startEdit(c)}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-white/10"
                        >
                          <Pencil className="w-4 h-4" /> Edit
                        </button>
                        <button
                          onClick={() => {
                            setMenuId(null)
                            if (window.confirm("Delete this comment?")) {
                              onDelete(c.id)
                              if (editingId === c.id) cancelCompose()
                            }
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-white/10"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 px-3 pt-1.5 text-[12px] text-slate-400">
              <span>{timeAgo(c.createdAt)}</span>
              <button
                onClick={() => (me ? onLike(c.id) : onNeedLogin())}
                className={`font-semibold hover:underline ${
                  liked ? "text-sky-400" : ""
                }`}
              >
                Like
              </button>
              <button
                onClick={() => startReply(c)}
                className="font-semibold hover:underline"
              >
                Reply
              </button>
              {c.editedAt && <span className="italic">Edited</span>}
            </div>

            {!isReply && replies.length > 0 && (
              <div className="mt-2">
                {!open ? (
                  <button
                    onClick={() => expand(c.id)}
                    className="flex items-center gap-2 text-[13px] font-semibold text-slate-300 hover:text-white px-3"
                  >
                    <span className="w-6 h-px bg-slate-500" />
                    View {replies.length}{" "}
                    {replies.length === 1 ? "reply" : "replies"}
                  </button>
                ) : (
                  <div className="space-y-3 mt-1">
                    {replies.map((r) => renderComment(r, true))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Sheet
      tall
      onClose={onClose}
      title={
        <span>
          Comments{" "}
          <span className="text-slate-400 font-medium">({comments.length})</span>
        </span>
      }
    >
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {roots.length === 0 ? (
          <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center text-slate-400">
            <MessageCircle className="w-12 h-12 mb-3 opacity-40" />
            <p className="font-semibold text-slate-200">No comments yet</p>
            <p className="text-sm mt-1">Be the first to share your thoughts.</p>
          </div>
        ) : (
          roots.map((c) => renderComment(c, false))
        )}
      </div>

      <div className="flex-shrink-0 border-t border-white/10 bg-[#15101f] rounded-b-[28px]">
        {(replyTo || editingId) && (
          <div className="flex items-center justify-between px-4 pt-2.5 text-xs text-slate-400">
            <span>
              {editingId ? (
                "Editing comment"
              ) : (
                <>
                  Replying to{" "}
                  <b className="text-slate-200">{replyTo?.name}</b>
                </>
              )}
            </span>
            <button onClick={cancelCompose} className="hover:text-white">
              Cancel
            </button>
          </div>
        )}

        {me ? (
          <div className="flex items-center gap-2.5 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <Avatar name={me.name} src={me.avatar} size={34} />
            <div className="flex-1 flex items-center rounded-full bg-white/[0.08] border border-white/10 focus-within:border-sky-400/60 transition pl-4 pr-1.5">
              <input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    submit()
                  }
                }}
                maxLength={800}
                placeholder={
                  editingId
                    ? "Edit your comment..."
                    : replyTo
                      ? "Write a reply..."
                      : "Write a comment..."
                }
                className="flex-1 bg-transparent outline-none text-[14px] text-white placeholder:text-slate-500 py-2.5"
              />
              <button
                onClick={submit}
                disabled={!text.trim()}
                aria-label="Send"
                className="w-9 h-9 rounded-full flex items-center justify-center text-sky-400 disabled:text-slate-600 hover:bg-white/10 disabled:hover:bg-transparent transition"
              >
                {editingId ? <Check className="w-5 h-5" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
        ) : (
          <div className="px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <button
              onClick={onNeedLogin}
              className="w-full rounded-full bg-sky-500 hover:bg-sky-400 text-white font-semibold py-3 transition active:scale-[0.98]"
            >
              Log in to comment
            </button>
          </div>
        )}
      </div>
    </Sheet>
  )
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const PAGE_CSS = `
@keyframes mvShine { 0%{transform:translateX(-160%) skewX(-18deg)} 55%,100%{transform:translateX(520%) skewX(-18deg)} }
@keyframes mvFlow { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
@keyframes mvGlowBlue {
  0%,100%{ box-shadow:0 10px 30px -8px rgba(34,158,217,.65), 0 0 0 0 rgba(34,158,217,.45) }
  50%{ box-shadow:0 14px 40px -6px rgba(34,158,217,.9), 0 0 0 9px rgba(34,158,217,0) }
}
@keyframes mvGlowRed {
  0%,100%{ box-shadow:0 8px 26px -10px rgba(255,30,60,.55), inset 0 0 0 1px rgba(255,70,90,.45) }
  50%{ box-shadow:0 10px 34px -8px rgba(255,30,60,.85), inset 0 0 0 1px rgba(255,90,110,.8) }
}
@keyframes mvBob { 0%,100%{transform:translateY(0) rotate(0)} 50%{transform:translateY(-2px) rotate(-8deg)} }
@keyframes mvBeat { 0%,100%{transform:scale(1)} 50%{transform:scale(1.12)} }
@keyframes mvSheetUp { from{transform:translateY(100%)} to{transform:none} }
@keyframes mvZoomIn { from{opacity:0;transform:scale(.94) translateY(12px)} to{opacity:1;transform:none} }
@keyframes mvFade { from{opacity:0} to{opacity:1} }
@keyframes mvFadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
@keyframes mvLikePop { 0%{transform:scale(1)} 35%{transform:scale(1.45) rotate(-12deg)} 100%{transform:scale(1)} }
@keyframes mvKen { from{transform:scale(1)} to{transform:scale(1.06)} }

.mv-sheet { animation: mvSheetUp .32s cubic-bezier(.2,.8,.2,1) both }
@media (min-width:640px){ .mv-sheet { animation-name: mvZoomIn } }
.mv-fade { animation: mvFade .25s ease both }
.mv-fadeup { animation: mvFadeUp .3s ease both }
.mv-pop-in { animation: mvZoomIn .15s ease both }
.mv-like-pop { animation: mvLikePop .45s ease both }
.mv-ken { animation: mvKen 14s ease-in-out infinite alternate }

.tg-btn {
  background: linear-gradient(110deg,#1b8fd6 0%,#229ED9 28%,#4cc2f5 52%,#229ED9 74%,#1779b8 100%);
  background-size: 220% 100%;
  animation: mvFlow 5s linear infinite, mvGlowBlue 2.4s ease-in-out infinite;
  border: 1px solid rgba(255,255,255,.28);
  transition: transform .2s ease, filter .2s ease;
}
.tg-btn:hover { transform: translateY(-2px) scale(1.01); filter: brightness(1.08) }
.tg-btn:active { transform: scale(.97) }
.tg-btn:hover .tg-icon { animation: mvBob .6s ease-in-out infinite }
.tg-icon { animation: mvBeat 2.4s ease-in-out infinite }

.yt-btn {
  background: linear-gradient(135deg, rgba(255,0,40,.22), rgba(255,0,40,.05) 60%, rgba(255,255,255,.04));
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  animation: mvGlowRed 2.8s ease-in-out infinite;
  transition: transform .2s ease, background .25s ease;
}
.yt-btn:hover {
  transform: translateY(-2px) scale(1.01);
  background: linear-gradient(135deg, rgba(255,0,40,.4), rgba(255,0,40,.12) 60%, rgba(255,255,255,.06));
}
.yt-btn:active { transform: scale(.97) }
.yt-btn:hover .yt-icon { transform: scale(1.18) }
.yt-icon { transition: transform .25s ease }

.btn-shine {
  position:absolute; top:0; bottom:0; left:0; width:28%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.38), transparent);
  animation: mvShine 3.2s ease-in-out infinite;
  pointer-events:none;
}

@media (prefers-reduced-motion: reduce) {
  .tg-btn,.yt-btn,.btn-shine,.tg-icon,.mv-ken { animation: none !important }
}
`

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function MovieDetailPage({
  movie,
  onBack,
  onMovieClick,
  showAdultContent = false,
  relatedItems = movies,
  mediaType = "movie",
}: MovieDetailPageProps) {
  const [showTrailer, setShowTrailer] = useState(false)
  const [viewCount] = useState(Math.floor(Math.random() * 1000) + 1)
  const [showTelegramPopup, setShowTelegramPopup] = useState(false)
  const [showSubscriptions, setShowSubscriptions] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [descOpen, setDescOpen] = useState(false)
  const [likePop, setLikePop] = useState(0)
  const { user, entitlement } = useAuth()

  const socialKey = `mvbds:social:v1:${mediaType}:${movie.id}`
  const [social, updateSocial] = useMovieSocial(socialKey)

  useEffect(() => {
    window.scrollTo(0, 0)
    setDescOpen(false)
    setShowComments(false)
    setShowShare(false)
  }, [movie.id])

  /* current user (auth shape unknown → defensive) */
  const me: Me | null = useMemo(() => {
    if (!user) return null
    const u = user as any
    const id = String(u.id ?? u.uid ?? u.email ?? u.username ?? "user")
    const name: string =
      u.name ??
      u.displayName ??
      u.full_name ??
      u.user_metadata?.full_name ??
      u.username ??
      (u.email ? String(u.email).split("@")[0] : "User")
    const avatar: string | undefined =
      u.avatar ??
      u.photoURL ??
      u.image ??
      u.picture ??
      u.user_metadata?.avatar_url ??
      undefined
    return { id, name, avatar }
  }, [user])

  const isAdultMovie = (genre: string): boolean => {
    const adultGenres = ["Adult", "18+"]
    return adultGenres.some((g) =>
      genre.toLowerCase().includes(g.toLowerCase())
    )
  }

  const handleWatchNow = () => {
    if (!user) {
      setShowAuthModal(true)
      return
    }
    setShowTelegramPopup(true)
  }

  const needLogin = () => {
    setShowComments(false)
    setShowShare(false)
    setShowAuthModal(true)
  }

  /* likes */
  const liked = !!me && social.likes.includes(me.id)
  const toggleLike = () => {
    if (!me) return needLogin()
    setLikePop((n) => n + 1)
    updateSocial((s) => ({
      ...s,
      likes: s.likes.includes(me.id)
        ? s.likes.filter((x) => x !== me.id)
        : [...s.likes, me.id],
    }))
  }

  /* comments */
  const addComment = (text: string, parentId?: string) => {
    if (!me) return
    const c: CommentItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: me.id,
      name: me.name,
      avatar: me.avatar,
      text,
      createdAt: Date.now(),
      parentId,
      likes: [],
    }
    updateSocial((s) => ({ ...s, comments: [...s.comments, c] }))
  }

  const editComment = (id: string, text: string) => {
    if (!me) return
    updateSocial((s) => ({
      ...s,
      comments: s.comments.map((c) =>
        c.id === id && c.userId === me.id
          ? { ...c, text, editedAt: Date.now() }
          : c
      ),
    }))
  }

  const deleteComment = (id: string) => {
    if (!me) return
    updateSocial((s) => ({
      ...s,
      comments: s.comments.filter((c) => {
        if (c.id === id) return c.userId !== me.id
        if (c.parentId === id) {
          const parent = s.comments.find((p) => p.id === id)
          return !(parent && parent.userId === me.id)
        }
        return true
      }),
    }))
  }

  const likeComment = (id: string) => {
    if (!me) return
    updateSocial((s) => ({
      ...s,
      comments: s.comments.map((c) =>
        c.id === id
          ? {
              ...c,
              likes: c.likes.includes(me.id)
                ? c.likes.filter((x) => x !== me.id)
                : [...c.likes, me.id],
            }
          : c
      ),
    }))
  }

  /* derived */
  const isAdult = isAdultMovie(movie.genre)
  const genreList = movie.genre
    .split("|")
    .map((g) => g.trim())
    .filter(Boolean)
  const movieGenres = genreList.map((g) => g.toLowerCase())
  const ratingText =
    typeof movie.rating === "number" ? movie.rating.toFixed(1) : movie.rating
  const hasRating =
    ratingText !== undefined &&
    ratingText !== "" &&
    String(ratingText).toLowerCase() !== "not available"
  const longDesc = (movie.description || "").length > 150

  const relatedMovies = relatedItems
    .filter((m) => {
      if (m.id === movie.id) return false
      const mGenres = m.genre.split("|").map((g) => g.trim().toLowerCase())
      const genreMatch = mGenres.some((genre) => movieGenres.includes(genre))
      const titleMatch =
        m.title
          .toLowerCase()
          .includes(movie.title.split("(")[0].toLowerCase().trim()) ||
        movie.title
          .split("(")[0]
          .toLowerCase()
          .trim()
          .includes(m.title.split("(")[0].toLowerCase().trim())
      return genreMatch || titleMatch
    })
    .sort((a, b) => {
      const aG = a.genre.split("|").map((g) => g.trim().toLowerCase())
      const bG = b.genre.split("|").map((g) => g.trim().toLowerCase())
      const aM = aG.filter((g) => movieGenres.includes(g)).length
      const bM = bG.filter((g) => movieGenres.includes(g)).length
      return bM - aM
    })
    .slice(0, 12)

  return (
    <div
      className="min-h-screen text-white relative overflow-x-hidden"
      style={{
        background: `radial-gradient(900px 500px at 85% 55%, rgba(120,40,160,.18), transparent 60%), radial-gradient(700px 400px at 5% 85%, rgba(200,30,80,.12), transparent 60%), ${BG}`,
      }}
    >
      <style>{PAGE_CSS}</style>

      {/* Back button */}
      <button
        onClick={onBack}
        aria-label="Back"
        className="fixed top-[max(1rem,env(safe-area-inset-top))] left-4 z-40 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-black/60 hover:scale-105 active:scale-95 transition"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* HERO */}
      <section className="relative w-full h-[74vh] min-h-[500px] max-h-[780px] overflow-hidden">
        {/* blurred backdrop (visible on wide screens) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={movie.poster || "/placeholder.svg"}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover scale-125 blur-2xl opacity-50"
        />

        <div className="relative mx-auto h-full w-full md:max-w-[480px] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={movie.poster || "/placeholder.svg"}
            alt={movie.title}
            className="mv-ken h-full w-full object-cover object-top"
          />
          {isAdult && (
            <span className="absolute top-4 right-4 bg-gradient-to-r from-pink-500 to-red-500 text-white text-xs px-3 py-1 rounded-full font-bold animate-pulse border border-white z-10">
              18+
            </span>
          )}
        </div>

        {/* dark fade */}
        <div
          className="absolute inset-x-0 bottom-0 h-[62%] pointer-events-none"
          style={{
            background: `linear-gradient(to top, ${BG} 4%, ${BG}f2 22%, ${BG}b0 48%, transparent)`,
          }}
        />
        <div
          className="absolute inset-x-0 top-0 h-24 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, rgba(0,0,0,.55), transparent)",
          }}
        />

        {/* title block */}
        <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center flex-wrap gap-x-3 gap-y-2">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-balance leading-tight">
                {movie.title}
              </h1>
              {movie.language && (
                <span className="rounded-full bg-white/15 border border-white/20 backdrop-blur px-2.5 py-0.5 text-[11px] font-semibold text-slate-100">
                  {movie.language}
                </span>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-slate-300">
              <span>{movie.year}</span>
              {genreList.length > 0 && (
                <>
                  <span className="h-3 w-px bg-white/25" />
                  <span>{genreList.slice(0, 3).join(" • ")}</span>
                </>
              )}
              {hasRating && (
                <>
                  <span className="h-3 w-px bg-white/25" />
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" />
                    {ratingText} Ratings
                  </span>
                </>
              )}
              <span className="h-3 w-px bg-white/25" />
              <span className="flex items-center gap-1 text-emerald-400">
                <Eye className="w-3.5 h-3.5" />
                {viewCount.toLocaleString()} views
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN */}
      <main className="relative z-10 max-w-2xl mx-auto px-5 pt-3 space-y-6">
        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleWatchNow}
            className="tg-btn relative w-full overflow-hidden rounded-2xl py-3.5 px-5 flex items-center justify-center gap-3 text-white font-bold text-[17px]"
          >
            <span className="btn-shine" />
            <span className="tg-icon relative w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-md">
              <TelegramLogo size={34} uid="btn" />
            </span>
            <span className="relative drop-shadow">Download on Telegram</span>
          </button>

          {movie.trailer && (
            <button
              onClick={() => setShowTrailer(true)}
              className="yt-btn relative w-full overflow-hidden rounded-2xl py-3.5 px-5 flex items-center justify-center gap-3 text-white font-bold text-[17px]"
            >
              <span className="btn-shine" style={{ animationDelay: "1.4s" }} />
              <span className="yt-icon relative flex items-center justify-center">
                <YouTubeLogo size={34} />
              </span>
              <span className="relative">Trailer</span>
            </button>
          )}
        </div>

        {/* Description */}
        {movie.description && (
          <div>
            <p
              className={`text-[14px] leading-relaxed text-slate-300 ${
                descOpen ? "" : "line-clamp-4"
              }`}
            >
              {movie.description}
            </p>
            {longDesc && (
              <button
                onClick={() => setDescOpen((v) => !v)}
                className="mt-1 text-[14px] font-bold text-white hover:text-sky-300 transition"
              >
                {descOpen ? "Show Less" : "Read More"}
              </button>
            )}
          </div>
        )}

        {/* Like / Comments / Share */}
        <div className="flex items-stretch rounded-2xl bg-white/[0.04] border border-white/10 divide-x divide-white/10 overflow-hidden">
          <button
            onClick={toggleLike}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition hover:bg-white/5 active:bg-white/10 ${
              liked ? "text-sky-400" : "text-slate-200"
            }`}
          >
            <ThumbsUp
              key={likePop}
              className={`w-5 h-5 ${liked ? "mv-like-pop" : ""}`}
              fill={liked ? "currentColor" : "none"}
            />
            <span>{liked ? "Liked" : "Like"}</span>
            {social.likes.length > 0 && (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
                {social.likes.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowComments(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-slate-200 transition hover:bg-white/5 active:bg-white/10"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Comments</span>
            {social.comments.length > 0 && (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
                {social.comments.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowShare(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-slate-200 transition hover:bg-white/5 active:bg-white/10"
          >
            <Share2 className="w-5 h-5" />
            <span>Share</span>
          </button>
        </div>

        {/* Cast */}
        <section>
          <h3 className="text-lg font-bold mb-3">Cast</h3>
          <MovieCast
            title={movie.title}
            year={movie.year}
            mediaType={mediaType}
            genre={movie.genre}
            movieId={movie.id}
            tmdbId={movie.tmdbId}
            tmdbType={movie.tmdbType}
            imdbId={movie.imdbId}
            mdlId={movie.mdlId}
          />
        </section>
      </main>

      {/* RELATED */}
      {relatedMovies.length > 0 && (
        <section className="relative z-10 max-w-5xl mx-auto px-5 pt-10 pb-6">
          <h3 className="text-lg font-bold mb-4">
            {mediaType === "anime" ? "Related Anime" : "Related Movies & Series"}
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {relatedMovies.map((rm) => {
              const isRelAdult = isAdultMovie(rm.genre)
              const blur = isRelAdult && !showAdultContent
              return (
                <div
                  key={rm.id}
                  onClick={() => onMovieClick?.(rm)}
                  className="cursor-pointer group"
                >
                  <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-lg ring-1 ring-white/10 group-hover:ring-white/30 group-hover:shadow-2xl transition transform group-hover:-translate-y-1 group-hover:scale-[1.03] relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={rm.poster || "/placeholder.svg"}
                      alt={rm.title}
                      className={`w-full h-full object-cover ${blur ? "blur-lg" : ""}`}
                    />

                    {isRelAdult && (
                      <span className="absolute top-1 right-8 bg-gradient-to-r from-pink-500 to-red-500 text-white text-[8px] px-1.5 py-0.5 rounded font-bold animate-pulse border border-white z-10">
                        18+
                      </span>
                    )}
                    {rm.language && (
                      <span className="absolute top-1 right-1 bg-black/70 text-white text-[8px] px-1 py-0.5 rounded uppercase font-semibold z-10">
                        {rm.language}
                      </span>
                    )}
                    {rm.year && (
                      <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] px-1 py-0.5 rounded font-medium z-10">
                        {rm.year}
                      </span>
                    )}
                    {rm.rating && rm.rating !== "not available" && (
                      <span className="absolute bottom-1 right-1 bg-yellow-500/90 text-black text-[8px] px-1 py-0.5 rounded font-bold z-10">
                        ⭐ {rm.rating}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-slate-300 line-clamp-2 group-hover:text-white transition">
                    {rm.title}
                  </p>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Footer */}
      <div className="relative z-10 bg-black/60 backdrop-blur-xl border-t border-white/10 mt-6">
        <div className="px-4 py-8 max-w-6xl mx-auto">
          <div className="flex justify-center items-center gap-4">
            <p className="text-slate-500 text-xs text-center">
              © 2025 MoviesVerse. সর্বাধিকার সংরক্ষিত। All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Trailer Modal */}
      {showTrailer && movie.trailer && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4 mv-fade"
          onClick={() => setShowTrailer(false)}
        >
          <div
            className="relative w-full max-w-4xl aspect-video mv-pop-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowTrailer(false)}
              className="absolute -top-10 right-0 bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-full transition"
            >
              ✕
            </button>
            <iframe
              src={movie.trailer}
              title="Trailer"
              allowFullScreen
              className="w-full h-full rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Comments */}
      {showComments && (
        <CommentsSheet
          comments={social.comments}
          me={me}
          onClose={() => setShowComments(false)}
          onAdd={addComment}
          onEdit={editComment}
          onDelete={deleteComment}
          onLike={likeComment}
          onNeedLogin={needLogin}
        />
      )}

      {/* Share */}
      {showShare && (
        <ShareSheet title={movie.title} onClose={() => setShowShare(false)} />
      )}

      {showAuthModal && (
        <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
      )}

      {showTelegramPopup && user && (
        <TelegramJoinPopup
          movieTitle={movie.title}
          mediaType={mediaType}
          onClose={() => setShowTelegramPopup(false)}
          telegramLink={movie.telegramLink}
          telegram4kLink={movie.telegram4kLink}
          moviePoster={movie.poster}
          hasPremiumAccess={entitlement.isPremiumActive}
        />
      )}
      <SubscriptionPanel
        open={showSubscriptions}
        onOpenChange={setShowSubscriptions}
      />
    </div>
  )
                                            }
