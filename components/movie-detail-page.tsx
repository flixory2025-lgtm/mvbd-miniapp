"use client"

import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
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
  Play,
} from "lucide-react"
import {
  doc,
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  writeBatch,
  updateDoc,
  increment,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore"
import { db, auth, incrementMovieView, getMovieViews } from "@/lib/firebase"
import { movies } from "@/lib/movie-data"
import TelegramJoinPopup from "./telegram-join-popup"
import AuthModal from "./auth-modal"
import SubscriptionPanel from "./subscription-panel"
import { useAuth } from "./auth-provider"
import MovieCast from "./movie-cast"
import PosterImage, { usePosterUrl } from "./poster-image"

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

type Me = { id: string; name: string; avatar?: string }

const SITE_URL = "https://mvbds.xyz"
const BG = "#050507"

/* ------------------------------------------------------------------ */
/*  Firebase (Firestore) social layer: likes + comments                */
/*                                                                     */
/*  movieSocial/{mediaType_movieId}                                    */
/*      likeCount, commentCount                                        */
/*      /likes/{uid}                                                   */
/*      /comments/{commentId}                                          */
/* ------------------------------------------------------------------ */

function toMillis(v: any): number | undefined {
  if (!v) return undefined
  if (typeof v.toMillis === "function") return v.toMillis()
  if (typeof v === "number") return v
  return undefined
}

function toComment(d: QueryDocumentSnapshot<DocumentData>): CommentItem {
  const x = d.data({ serverTimestamps: "estimate" })
  return {
    id: d.id,
    userId: x.userId,
    name: x.name ?? "User",
    avatar: x.avatar ?? undefined,
    text: x.text ?? "",
    createdAt: toMillis(x.createdAt) ?? Date.now(),
    editedAt: toMillis(x.editedAt),
    parentId: x.parentId ?? undefined,
    likes: Array.isArray(x.likes) ? x.likes : [],
  }
}

function useMovieSocial(
  socialId: string,
  meId: string | null,
  commentsOpen: boolean
) {
  const [likeCount, setLikeCount] = useState(0)
  const [commentCount, setCommentCount] = useState(0)
  const [liked, setLiked] = useState(false)
  const [comments, setComments] = useState<CommentItem[]>([])
  const [error, setError] = useState("")
  const busyLike = useRef(false)

  const report = (e: unknown) => {
    console.error("[movieSocial]", e)
    setError("Something went wrong. Please try again.")
    setTimeout(() => setError(""), 3000)
  }

  const parentRef = () => doc(db, "movieSocial", socialId)
  const commentRef = (id: string) =>
    doc(db, "movieSocial", socialId, "comments", id)

  // like + comment counters (live)
  useEffect(() => {
    setLikeCount(0)
    setCommentCount(0)
    const unsub = onSnapshot(
      parentRef(),
      (snap) => {
        const d = snap.data()
        setLikeCount(Math.max(0, d?.likeCount ?? 0))
        setCommentCount(Math.max(0, d?.commentCount ?? 0))
      },
      (e) => console.error("[movieSocial] counters", e)
    )
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socialId])

  // did I like it? (live)
  useEffect(() => {
    setLiked(false)
    if (!meId) return
    const unsub = onSnapshot(
      doc(db, "movieSocial", socialId, "likes", meId),
      (snap) => setLiked(snap.exists()),
      (e) => console.error("[movieSocial] myLike", e)
    )
    return unsub
  }, [socialId, meId])

  // comments (live, only while the sheet is open → saves reads)
  useEffect(() => {
    if (!commentsOpen) return
    const q = query(
      collection(db, "movieSocial", socialId, "comments"),
      orderBy("createdAt", "desc"),
      limit(300)
    )
    const unsub = onSnapshot(
      q,
      (snap) => setComments(snap.docs.map(toComment)),
      (e) => console.error("[movieSocial] comments", e)
    )
    return () => {
      unsub()
      setComments([])
    }
  }, [socialId, commentsOpen])

  const toggleLike = async (me: Me) => {
    if (busyLike.current) return
    busyLike.current = true
    try {
      const batch = writeBatch(db)
      const likeRef = doc(db, "movieSocial", socialId, "likes", me.id)
      if (liked) {
        batch.delete(likeRef)
        batch.set(parentRef(), { likeCount: increment(-1) }, { merge: true })
      } else {
        batch.set(likeRef, { userId: me.id, createdAt: serverTimestamp() })
        batch.set(parentRef(), { likeCount: increment(1) }, { merge: true })
      }
      await batch.commit()
    } catch (e) {
      report(e)
    } finally {
      busyLike.current = false
    }
  }

  const addComment = async (me: Me, text: string, parentId?: string) => {
    try {
      const ref = doc(collection(db, "movieSocial", socialId, "comments"))
      const batch = writeBatch(db)
      batch.set(ref, {
        userId: me.id,
        name: me.name,
        avatar: me.avatar ?? null,
        text,
        parentId: parentId ?? null,
        likes: [],
        createdAt: serverTimestamp(),
        editedAt: null,
      })
      batch.set(parentRef(), { commentCount: increment(1) }, { merge: true })
      await batch.commit()
    } catch (e) {
      report(e)
    }
  }

  const editComment = async (id: string, text: string) => {
    try {
      await updateDoc(commentRef(id), { text, editedAt: serverTimestamp() })
    } catch (e) {
      report(e)
    }
  }

  const deleteComment = async (id: string) => {
    try {
      const replies = comments.filter((c) => c.parentId === id)
      const batch = writeBatch(db)
      replies.forEach((r) => batch.delete(commentRef(r.id)))
      batch.delete(commentRef(id))
      batch.set(
        parentRef(),
        { commentCount: increment(-(1 + replies.length)) },
        { merge: true }
      )
      await batch.commit()
    } catch (e) {
      report(e)
    }
  }

  const likeComment = async (me: Me, id: string) => {
    try {
      const c = comments.find((x) => x.id === id)
      const has = !!c && c.likes.includes(me.id)
      await updateDoc(commentRef(id), {
        likes: has ? arrayRemove(me.id) : arrayUnion(me.id),
      })
    } catch (e) {
      report(e)
    }
  }

  return {
    likeCount,
    commentCount,
    liked,
    comments,
    error,
    toggleLike,
    addComment,
    editComment,
    deleteComment,
    likeComment,
  }
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
/*  Bottom-sheet shell (iPhone style: slides up, drag down to close)   */
/* ------------------------------------------------------------------ */

const SHEET_MS = 420

/* Shared iPhone-style motion: slide up, drag down to close, slide down on close */
function useSheetMotion(onClose: () => void) {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startY = useRef(0)
  const startT = useRef(0)
  const closingRef = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // lock page scroll + slide up on mount
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setOpen(true))
    })
    return () => {
      document.body.style.overflow = prev
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  // slide down first, then tell the parent
  const requestClose = useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true
    setClosing(true)
    setDragging(false)
    setDragY(0)
    setOpen(false)
    timer.current = setTimeout(() => onCloseRef.current(), SHEET_MS - 20)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [requestClose])

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (closingRef.current) return
    if ((e.target as HTMLElement).closest("button")) return
    startY.current = e.clientY
    startT.current = Date.now()
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    setDragY(Math.max(0, e.clientY - startY.current))
  }
  const onPointerUp = () => {
    if (!dragging) return
    const velocity = dragY / Math.max(1, Date.now() - startT.current)
    if (dragY > 110 || velocity > 0.6) {
      requestClose()
    } else {
      setDragging(false)
      setDragY(0)
    }
  }

  return {
    open,
    closing,
    requestClose,
    dragProps: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
    sheetStyle: {
      transform: open ? `translateY(${dragY}px)` : "translateY(100%)",
      transition: dragging ? "none" : `transform ${SHEET_MS}ms cubic-bezier(.32,.72,0,1)`,
      willChange: "transform",
    },
    backdropStyle: {
      opacity: open ? Math.max(0, 1 - dragY / 420) : 0,
      transition: dragging ? "none" : `opacity ${SHEET_MS}ms ease`,
    },
  }
}

function Sheet({
  title,
  onClose,
  children,
  tall,
  poster,
}: {
  title: ReactNode
  onClose: () => void
  children: ReactNode
  tall?: boolean
  poster?: string
}) {
  const { requestClose, dragProps, sheetStyle, backdropStyle } = useSheetMotion(onClose)

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        style={backdropStyle}
        onClick={requestClose}
      />
      <div
        className={`relative w-full sm:max-w-lg flex flex-col overflow-hidden bg-[#08080a] border border-white/10 border-b-0 shadow-2xl rounded-t-[28px] ${
          tall ? "h-[88vh] sm:h-[80vh]" : "max-h-[88vh]"
        }`}
        style={sheetStyle}
      >
        {/* faint movie poster behind everything */}
        {poster && (
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={poster}
              alt=""
              draggable={false}
              className="w-full h-full object-cover object-top select-none"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(6,6,8,.70) 0%, rgba(6,6,8,.84) 55%, rgba(6,6,8,.93) 100%)",
              }}
            />
          </div>
        )}

        <div className="relative z-10 flex flex-col flex-1 min-h-0">
          <div
            className="flex-shrink-0 touch-none cursor-grab active:cursor-grabbing"
            {...dragProps}
          >
            <div className="flex justify-center pt-2.5">
              <span className="h-1 w-10 rounded-full bg-white/30" />
            </div>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
              <h3 className="text-base font-bold text-white">{title}</h3>
              <button
                onClick={requestClose}
                aria-label="Close"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          {children}
        </div>
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
  poster,
}: {
  title: string
  onClose: () => void
  poster?: string
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
    <Sheet title="Share" onClose={onClose} poster={poster}>
      <div className="p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] overflow-y-auto">
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
  poster,
}: {
  comments: CommentItem[]
  me: Me | null
  onClose: () => void
  onAdd: (text: string, parentId?: string) => void
  onEdit: (id: string, text: string) => void
  onDelete: (id: string) => void
  onLike: (id: string) => void
  onNeedLogin: () => void
  poster?: string
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
                  <span className="absolute -bottom-2.5 right-2 flex items-center gap-1 rounded-full bg-[#1f1f26] border border-white/10 px-1.5 py-0.5 text-[11px] text-slate-200 shadow">
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
                      <div className="absolute right-0 top-9 z-20 w-36 rounded-xl bg-[#1a1a20] border border-white/10 shadow-2xl overflow-hidden mv-pop-in">
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
      poster={poster}
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

      <div className="flex-shrink-0 border-t border-white/10 bg-black/45 backdrop-blur-md">
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
/*  Trailer sheet (YouTube style: autoplay, ambient glow, related)     */
/* ------------------------------------------------------------------ */

function getYouTubeId(url?: string): string | null {
  if (!url) return null
  const m = url.match(
    /(?:youtube\.com\/(?:embed\/|watch\?(?:.*&)?v=|shorts\/|live\/|v\/)|youtu\.be\/|youtube-nocookie\.com\/embed\/)([A-Za-z0-9_-]{11})/
  )
  return m ? m[1] : null
}

function buildEmbedSrc(url: string, id: string | null) {
  if (id) {
    const origin =
      typeof window !== "undefined"
        ? `&origin=${encodeURIComponent(window.location.origin)}`
        : ""
    return `https://www.youtube.com/embed/${id}?autoplay=1&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&enablejsapi=1${origin}`
  }
  return url + (url.includes("?") ? "&" : "?") + "autoplay=1"
}

function isAdultGenre(genre: string) {
  const g = (genre || "").toLowerCase()
  return g.includes("adult") || g.includes("18+")
}

function getRelatedFor(base: DetailItem, items: DetailItem[], max: number) {
  const baseGenres = base.genre.split("|").map((g) => g.trim().toLowerCase())
  const baseName = base.title.split("(")[0].toLowerCase().trim()
  const scored = items
    .filter((m) => m.id !== base.id)
    .map((m) => {
      const mg = m.genre.split("|").map((g) => g.trim().toLowerCase())
      const matches = mg.filter((g) => baseGenres.includes(g)).length
      const name = m.title.split("(")[0].toLowerCase().trim()
      const titleMatch = !!name && !!baseName && (name.includes(baseName) || baseName.includes(name))
      return { m, matches, titleMatch, hasTrailer: !!m.trailer }
    })
  const picked = scored
    .filter((x) => x.matches > 0 || x.titleMatch)
    .sort(
      (a, b) =>
        Number(b.hasTrailer) - Number(a.hasTrailer) ||
        Number(b.titleMatch) - Number(a.titleMatch) ||
        b.matches - a.matches
    )
    .slice(0, max)
    .map((x) => x.m)
  if (picked.length < max) {
    const used = new Set(picked.map((m) => m.id))
    for (const x of scored) {
      if (picked.length >= max) break
      if (x.hasTrailer && !used.has(x.m.id)) {
        picked.push(x.m)
        used.add(x.m.id)
      }
    }
  }
  return picked
}

/* Related card thumbnail: falls back to the (resolved) poster when YouTube has no thumbnail
   (deleted / private videos return a tiny 120x90 grey placeholder) */
function RelatedThumb({
  rid,
  item,
  blur,
}: {
  rid: string | null
  item: DetailItem
  blur: boolean
}) {
  const [bad, setBad] = useState(false)

  if (!rid || bad) {
    return (
      <PosterImage
        src={item.poster}
        title={item.title}
        year={item.year}
        genre={item.genre}
        tmdbId={item.tmdbId}
        tmdbType={item.tmdbType}
        loading="lazy"
        draggable={false}
        className={`w-full h-full object-cover object-[center_22%] ${blur ? "blur-lg" : ""}`}
      />
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://i.ytimg.com/vi/${rid}/mqdefault.jpg`}
      alt={item.title}
      loading="lazy"
      draggable={false}
      onLoad={(e) => {
        if (e.currentTarget.naturalWidth <= 120) setBad(true)
      }}
      onError={() => setBad(true)}
      className={`w-full h-full object-cover ${blur ? "blur-lg" : ""}`}
    />
  )
}

function TrailerSheet({
  movie,
  relatedItems,
  showAdultContent,
  onClose,
}: {
  movie: DetailItem
  relatedItems: DetailItem[]
  showAdultContent: boolean
  onClose: (current: DetailItem) => void
}) {
  const [cur, setCur] = useState<DetailItem>(movie)
  const curRef = useRef(cur)
  curRef.current = cur
  const curPoster = usePosterUrl({
    src: cur.poster,
    title: cur.title,
    year: cur.year,
    genre: cur.genre,
    tmdbId: cur.tmdbId,
    tmdbType: cur.tmdbType,
  })
  const { open, closing, requestClose, dragProps, sheetStyle, backdropStyle } =
    useSheetMotion(() => onClose(curRef.current))

  const [descOpen, setDescOpen] = useState(false)
  const [meta, setMeta] = useState<{ title?: string; author?: string }>({})
  const [progress, setProgress] = useState<number | null>(null)
  const [tick, setTick] = useState(0)
  const [badId, setBadId] = useState<string | null>(null)
  const durRef = useRef(0)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const ytId = getYouTubeId(cur.trailer)
  const embedSrc = cur.trailer ? buildEmbedSrc(cur.trailer, ytId) : ""
  // true when YouTube says the video is deleted / private / not embeddable
  const unavailable = !!ytId && badId === ytId
  const related = useMemo(
    () => getRelatedFor(cur, relatedItems, 12),
    [cur, relatedItems]
  )
  const genreList = cur.genre
    .split("|")
    .map((g) => g.trim())
    .filter(Boolean)
  const hasRating =
    cur.rating !== undefined &&
    cur.rating !== "" &&
    String(cur.rating).toLowerCase() !== "not available"
  const ratingText =
    typeof cur.rating === "number" ? cur.rating.toFixed(1) : cur.rating

  // real video title from YouTube (no API key needed)
  useEffect(() => {
    setMeta({})
    if (!ytId) return
    const ctrl = new AbortController()
    fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(
        `https://www.youtube.com/watch?v=${ytId}`
      )}&format=json`,
      { signal: ctrl.signal }
    )
      .then((r) => {
        if (r.status === 400 || r.status === 401 || r.status === 404) setBadId(ytId)
        return r.ok ? r.json() : null
      })
      .then((j) => {
        if (j) setMeta({ title: j.title, author: j.author_name })
      })
      .catch(() => {})
    return () => ctrl.abort()
  }, [ytId])

  // ambient glow follows the real playback position (YouTube iframe API messages)
  useEffect(() => {
    setProgress(null)
    durRef.current = 0
    if (!ytId) return
    const onMsg = (e: MessageEvent) => {
      if (!String(e.origin).includes("youtube.com")) return
      let d: any = e.data
      if (typeof d === "string") {
        try {
          d = JSON.parse(d)
        } catch {
          return
        }
      }
      if (d?.event === "onError") {
        setBadId(ytId)
        return
      }
      const info = d?.info
      if (!info) return
      if (typeof info.duration === "number" && info.duration > 0) durRef.current = info.duration
      if (typeof info.currentTime === "number" && durRef.current > 0) {
        setProgress(Math.min(1, info.currentTime / durRef.current))
      }
    }
    window.addEventListener("message", onMsg)
    return () => window.removeEventListener("message", onMsg)
  }, [ytId])

  // fallback: if no playback info arrives, slowly cycle the frames
  useEffect(() => {
    if (!ytId || progress !== null) return
    const t = setInterval(() => setTick((n) => n + 1), 4000)
    return () => clearInterval(t)
  }, [ytId, progress])

  const frame =
    progress === null
      ? tick % 4
      : progress < 0.12
        ? 0
        : progress < 0.37
          ? 1
          : progress < 0.62
            ? 2
            : 3

  const handshake = () => {
    const send = () =>
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "listening", id: 1, channel: "widget" }),
        "*"
      )
    send()
    setTimeout(send, 800)
    setTimeout(send, 2000)
  }

  const pick = (rm: DetailItem) => {
    setCur(rm)
    setDescOpen(false)
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })
  }

  const title = unavailable ? cur.title : meta.title || `${cur.title} — Official Trailer`
  const longDesc = (cur.description || "").length > 120

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Trailer"
    >
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        style={backdropStyle}
        onClick={requestClose}
      />

      <div
        className="relative w-full sm:max-w-lg flex flex-col overflow-hidden bg-[#08080a] rounded-t-[22px] shadow-2xl"
        style={{
          ...sheetStyle,
          // leave a small gap at the top so the page shows above the sheet
          height: "calc(100% - max(48px, calc(env(safe-area-inset-top, 0px) + 24px)))",
        }}
      >
        {/* Ambient background: colours follow the video */}
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
          {ytId && !unavailable ? (
            [0, 1, 2, 3].map((n) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${ytId}-${n}`}
                src={`https://i.ytimg.com/vi/${ytId}/${n}.jpg`}
                alt=""
                draggable={false}
                className="mv-ambient-img"
                style={{ opacity: frame === n ? 1 : 0 }}
              />
            ))
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={curPoster}
              alt=""
              draggable={false}
              className="mv-ambient-img"
              style={{ opacity: 1 }}
            />
          )}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(8,8,10,.22) 0%, rgba(8,8,10,.58) 36%, rgba(8,8,10,.86) 100%)",
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col flex-1 min-h-0">
          {/* VIDEO — edge to edge, no border */}
          <div className="relative flex-shrink-0 w-full aspect-video bg-black overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                ytId && !unavailable
                  ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`
                  : curPoster
              }
              alt=""
              draggable={false}
              onLoad={(e) => {
                // YouTube serves a 120x90 grey placeholder for deleted / private videos
                if (ytId && !unavailable && e.currentTarget.naturalWidth <= 120) setBadId(ytId)
              }}
              onError={() => {
                if (ytId && !unavailable) setBadId(ytId)
              }}
              className={`absolute inset-0 w-full h-full object-cover ${
                ytId && !unavailable ? "" : "object-[center_22%]"
              }`}
            />
            {embedSrc && open && !closing && !unavailable && (
              <iframe
                key={cur.id}
                ref={iframeRef}
                src={embedSrc}
                title={title}
                onLoad={handshake}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                className="absolute inset-0 w-full h-full border-0 block"
              />
            )}
            {(unavailable || !embedSrc) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-gradient-to-b from-black/55 via-black/60 to-black/75 px-6 text-center">
                <span className="text-[15px] font-bold text-white">Trailer unavailable</span>
                <span className="text-[12px] text-slate-300">
                  This trailer is no longer available. You can still watch related trailers below.
                </span>
              </div>
            )}

            {/* drag handle (swipe down to close) */}
            <div
              className="absolute top-0 inset-x-0 h-7 z-10 touch-none cursor-grab active:cursor-grabbing flex justify-center pt-2"
              {...dragProps}
            >
              <span className="h-1 w-10 rounded-full bg-white/50 shadow" />
            </div>

            <button
              onClick={requestClose}
              aria-label="Close trailer"
              className="absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full bg-black/55 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-black/75 active:scale-95 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* CAPTION + RELATED */}
          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            <div className="px-4 pt-3.5">
              <h2 className="text-[17px] font-bold leading-snug text-white line-clamp-2">
                {title}
              </h2>
              <p className="mt-1 text-[12px] text-slate-300/90">
                {unavailable ? (
                  <span className="text-amber-300">Trailer unavailable</span>
                ) : (
                  <>
                    {meta.author ? `${meta.author} • ` : ""}
                    {cur.title}
                  </>
                )}
              </p>

              {(cur.description || genreList.length > 0) && (
                <div className="mt-3 rounded-xl bg-white/[0.09] px-3.5 py-3 backdrop-blur-sm">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-semibold text-white">
                    <span>{cur.year}</span>
                    {genreList.length > 0 && (
                      <span className="text-slate-300 font-medium">
                        {genreList.slice(0, 3).join(" • ")}
                      </span>
                    )}
                    {hasRating && (
                      <span className="flex items-center gap-1 text-yellow-400">
                        <Star className="w-3 h-3" fill="currentColor" />
                        {ratingText}
                      </span>
                    )}
                  </div>
                  {cur.description && (
                    <>
                      <p
                        className={`mt-1.5 text-[12.5px] leading-relaxed text-slate-200 ${
                          descOpen ? "" : "line-clamp-2"
                        }`}
                      >
                        {cur.description}
                      </p>
                      {longDesc && (
                        <button
                          onClick={() => setDescOpen((v) => !v)}
                          className="mt-0.5 text-[12.5px] font-bold text-white"
                        >
                          {descOpen ? "Show less" : "...more"}
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {related.length > 0 && (
              <div className="pt-5 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <h3 className="px-4 mb-3 text-[14px] font-bold text-white">
                  {`Related Movies & Series`}
                </h3>
                <div className="space-y-5">
                  {related.map((rm) => {
                    const rid = getYouTubeId(rm.trailer)
                    const blur = isAdultGenre(rm.genre) && !showAdultContent
                    const rg = rm.genre
                      .split("|")
                      .map((g) => g.trim())
                      .filter(Boolean)
                      .slice(0, 2)
                      .join(" • ")
                    return (
                      <button
                        key={rm.id}
                        onClick={() => pick(rm)}
                        className="group block w-full text-left px-4 active:opacity-80"
                      >
                        <div className="relative aspect-video overflow-hidden rounded-xl bg-neutral-900 ring-1 ring-white/10">
                          <RelatedThumb rid={rid} item={rm} blur={blur} />
                          <span className="absolute inset-0 flex items-center justify-center">
                            <span className="w-11 h-11 rounded-full bg-black/55 backdrop-blur-sm border border-white/25 flex items-center justify-center transition group-hover:scale-110">
                              <Play className="w-5 h-5 text-white" fill="white" />
                            </span>
                          </span>
                          {rm.year && (
                            <span className="absolute bottom-1.5 right-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-semibold">
                              {rm.year}
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-[14px] font-semibold leading-snug text-white line-clamp-2">
                          {rm.title}
                        </p>
                        <p className="mt-0.5 text-[12px] text-slate-400">
                          {rg}
                          {rm.rating && String(rm.rating).toLowerCase() !== "not available"
                            ? `${rg ? " • " : ""}⭐ ${rm.rating}`
                            : ""}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const PAGE_CSS = `
@keyframes mvZoomIn { from{opacity:0;transform:scale(.94) translateY(12px)} to{opacity:1;transform:none} }
@keyframes mvFade { from{opacity:0} to{opacity:1} }
@keyframes mvFadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
@keyframes mvLikePop { 0%{transform:scale(1)} 35%{transform:scale(1.45) rotate(-12deg)} 100%{transform:scale(1)} }

.mv-fade { animation: mvFade .25s ease both }
.mv-fadeup { animation: mvFadeUp .3s ease both }
.mv-pop-in { animation: mvZoomIn .15s ease both }
.mv-like-pop { animation: mvLikePop .45s ease both }

/* Trailer ambient glow */
@keyframes mvAmbient {
  from { transform: scale(1.8) translate3d(-3%,-2%,0) }
  to   { transform: scale(2.2) translate3d(3%,3%,0) }
}
.mv-ambient-img {
  position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; user-select: none;
  filter: blur(46px) saturate(1.9) brightness(.95);
  transition: opacity 1.6s ease;
  animation: mvAmbient 16s ease-in-out infinite alternate;
  will-change: opacity, transform;
}
@media (prefers-reduced-motion: reduce) { .mv-ambient-img { animation: none } }

/* Glossy 3D pill buttons (Telegram + YouTube) */
.mv-btn {
  position: relative; isolation: isolate; overflow: hidden;
  flex: 1 1 0; min-width: 0; height: 54px;
  display: flex; align-items: center; justify-content: center; gap: 9px;
  padding: 0 14px; border-radius: 999px; color: #fff;
  border: 1px solid rgba(255,255,255,.16);
  -webkit-tap-highlight-color: transparent;
  transition: transform .15s ease, box-shadow .15s ease, filter .2s ease;
}
.mv-btn-tg {
  background: linear-gradient(180deg,#46c3f7 0%,#229ed9 46%,#1678b4 100%);
  box-shadow: inset 0 1.5px 0 rgba(255,255,255,.55), inset 0 -5px 10px rgba(0,40,90,.35), 0 5px 0 #0d5a8c, 0 12px 24px -6px rgba(34,158,217,.55);
}
.mv-btn-yt {
  background: radial-gradient(120% 160% at 28% 0%,#e8283c 0%,#b5121f 42%,#650811 100%);
  box-shadow: inset 0 1.5px 0 rgba(255,255,255,.4), inset 0 -5px 10px rgba(40,0,5,.45), 0 5px 0 #4a0510, 0 12px 24px -6px rgba(255,35,65,.45);
}
.mv-btn:active { transform: translateY(4px) }
.mv-btn-tg:active { box-shadow: inset 0 1.5px 0 rgba(255,255,255,.55), inset 0 -5px 10px rgba(0,40,90,.35), 0 1px 0 #0d5a8c, 0 6px 14px -6px rgba(34,158,217,.55) }
.mv-btn-yt:active { box-shadow: inset 0 1.5px 0 rgba(255,255,255,.4), inset 0 -5px 10px rgba(40,0,5,.45), 0 1px 0 #4a0510, 0 6px 14px -6px rgba(255,35,65,.45) }
@media (hover:hover) { .mv-btn:hover { filter: brightness(1.1); transform: translateY(-1px) } .mv-btn:active { transform: translateY(4px) } }
.mv-btn-gloss {
  position: absolute; left: 6%; right: 6%; top: 2px; height: 46%; z-index: 0; pointer-events: none;
  border-radius: 999px; background: linear-gradient(180deg,rgba(255,255,255,.38),rgba(255,255,255,0));
}
.mv-btn-ico {
  position: relative; z-index: 1; flex: none; width: 34px; height: 34px; border-radius: 999px; background: #fff;
  display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,.3);
}
.mv-btn-label {
  position: relative; z-index: 1; display: flex; flex-direction: column; align-items: flex-start;
  line-height: 1; text-align: left; text-shadow: 0 1px 2px rgba(0,0,0,.35); white-space: nowrap;
}
.mv-btn-label small { font-size: 10px; font-weight: 500; opacity: .85; margin-bottom: 3px }
.mv-btn-label b { font-size: 15.5px; font-weight: 700; letter-spacing: .2px }
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
  const [viewCount, setViewCount] = useState(0)
  const [showTelegramPopup, setShowTelegramPopup] = useState(false)
  const [showSubscriptions, setShowSubscriptions] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [descOpen, setDescOpen] = useState(false)
  const castRef = useRef<HTMLDivElement>(null)
  const [likePop, setLikePop] = useState(0)
  const { user, entitlement } = useAuth()

  useEffect(() => {
    window.scrollTo(0, 0)
    setDescOpen(false)
    setShowComments(false)
    setShowShare(false)
  }, [movie.id])

  /* MovieCast এর ভিতরের বাংলা heading লুকানো (শুধু English "Cast" থাকবে) */
  useEffect(() => {
    const root = castRef.current
    if (!root) return
    const bn = /[\u0980-\u09FF]/
    const hide = () => {
      root.querySelectorAll<HTMLElement>("h1,h2,h3,h4,h5,h6").forEach((el) => {
        if (bn.test(el.textContent || "")) el.style.display = "none"
      })
    }
    hide()
    const mo = new MutationObserver(hide)
    mo.observe(root, { childList: true, subtree: true, characterData: true })
    return () => mo.disconnect()
  }, [movie.id])

  /* real view count (Firebase) — counts once per browser session */
  useEffect(() => {
    let alive = true
    const k = `mv_viewed_${movie.id}`
    ;(async () => {
      let seen = false
      try {
        seen = sessionStorage.getItem(k) === "1"
      } catch {}
      const n = seen
        ? await getMovieViews(movie.id)
        : await incrementMovieView(movie.id)
      if (!seen) {
        try {
          sessionStorage.setItem(k, "1")
        } catch {}
      }
      if (alive) setViewCount(n)
    })()
    return () => {
      alive = false
    }
  }, [movie.id])

  /* current user (auth shape unknown → defensive) */
  const me: Me | null = useMemo(() => {
    if (!user) return null
    const u = user as any
    const fb = auth.currentUser
    const id: string | undefined = fb?.uid ?? u.uid ?? u.id
    if (!id) return null
    const name: string =
      fb?.displayName ??
      u.displayName ??
      u.name ??
      u.full_name ??
      u.user_metadata?.full_name ??
      u.username ??
      (u.email ? String(u.email).split("@")[0] : "User")
    const avatar: string | undefined =
      fb?.photoURL ??
      u.photoURL ??
      u.avatar ??
      u.image ??
      u.picture ??
      u.user_metadata?.avatar_url ??
      undefined
    return { id, name, avatar }
  }, [user])

  // poster: /public first, then TMDB / MyDramaList when the local file is missing
  const posterUrl = usePosterUrl({
    src: movie.poster,
    title: movie.title,
    year: movie.year,
    genre: movie.genre,
    mediaType,
    tmdbId: movie.tmdbId,
    tmdbType: movie.tmdbType,
  })

  const social = useMovieSocial(`${mediaType}_${movie.id}`, me?.id ?? null, showComments)

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

  /* likes + comments (Firebase) */
  const liked = social.liked
  const toggleLike = () => {
    if (!me) return needLogin()
    setLikePop((n) => n + 1)
    social.toggleLike(me)
  }
  const addComment = (text: string, parentId?: string) => {
    if (me) social.addComment(me, text, parentId)
  }
  const editComment = (id: string, text: string) => {
    if (me) social.editComment(id, text)
  }
  const deleteComment = (id: string) => {
    if (me) social.deleteComment(id)
  }
  const likeComment = (id: string) => {
    if (me) social.likeComment(me, id)
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
      style={{ background: BG, "--hero-h": "clamp(340px, 50vh, 520px)" } as any}
    >
      <style>{PAGE_CSS}</style>

      {/* Back button */}
      <button
        onClick={onBack}
        aria-label="Back"
        className="fixed top-[max(1rem,env(safe-area-inset-top))] left-4 z-40 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-black/60 hover:scale-105 active:scale-95 transition"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      {/* FIXED POSTER — scroll korleo ekhane i thake */}
      <div
        className="fixed inset-x-0 top-0 z-0 pointer-events-none"
        style={{ height: "calc(var(--hero-h) + 80px)" }}
      >
        <div className="relative mx-auto h-full w-full md:max-w-[380px] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={posterUrl}
            alt={movie.title}
            className="h-full w-full object-cover object-top"
          />
          {isAdult && (
            <span className="absolute top-4 right-4 bg-gradient-to-r from-pink-500 to-red-500 text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold animate-pulse border border-white z-10">
              18+
            </span>
          )}
        </div>
        <div
          className="absolute inset-x-0 top-0 h-24"
          style={{
            background: "linear-gradient(to bottom, rgba(0,0,0,.55), transparent)",
          }}
        />
      </div>

      {/* SCROLLING CONTENT — poster er upor diye uthe */}
      <div className="relative z-10">
        {/* spacer: poster dekha jay */}
        <div style={{ height: "calc(var(--hero-h) - 155px)" }} />

        {/* dark → clear gradient + title */}
        <div
          className="relative flex items-end min-h-[200px] px-4 pb-3"
          style={{
            background: `linear-gradient(to bottom, transparent 0%, rgba(5,5,7,.35) 22%, rgba(5,5,7,.75) 52%, rgba(5,5,7,.96) 78%, ${BG} 100%)`,
          }}
        >
          <div className="w-full">
          <div className="max-w-2xl mx-auto">
              <div className="flex items-center flex-wrap gap-x-3 gap-y-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-balance leading-tight">
                  {movie.title}
                </h1>
                {movie.language && (
                  <span className="rounded-full bg-white/15 border border-white/20 backdrop-blur px-2 py-0.5 text-[10px] font-semibold text-slate-100">
                    {movie.language}
                  </span>
                )}
              </div>
  
              <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-slate-300">
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
                      <Star className="w-3 h-3 text-yellow-400" fill="currentColor" />
                      {ratingText} Ratings
                    </span>
                  </>
                )}
                {viewCount > 0 && (
                  <>
                    <span className="h-3 w-px bg-white/25" />
                    <span className="flex items-center gap-1 text-emerald-400">
                      <Eye className="w-3 h-3" />
                      {viewCount.toLocaleString()} views
                    </span>
                  </>
                )}
              </div>
            </div>
            </div>
        </div>

      {/* MAIN */}
      <div style={{ background: BG }}>
      <main className="relative max-w-2xl mx-auto px-4 pt-2 space-y-4">
        {/* Buttons */}
        <div className="flex items-center justify-center gap-2.5 max-w-[420px] mx-auto pt-1 pb-2">
          <button
            onClick={handleWatchNow}
            className="mv-btn mv-btn-tg"
            aria-label="Download on Telegram"
          >
            <span className="mv-btn-gloss" aria-hidden="true" />
            <span className="mv-btn-ico">
              <TelegramLogo size={28} uid="btn" />
            </span>
            <span className="mv-btn-label">
              <small>Download on</small>
              <b>Telegram</b>
            </span>
          </button>

          {movie.trailer && (
            <button
              onClick={() => setShowTrailer(true)}
              className="mv-btn mv-btn-yt"
              aria-label="Watch trailer on YouTube"
            >
              <span className="mv-btn-gloss" aria-hidden="true" />
              <span className="mv-btn-ico">
                <YouTubeLogo size={24} />
              </span>
              <span className="mv-btn-label">
                <small>Watch</small>
                <b>Trailer</b>
              </span>
            </button>
          )}
        </div>

        {/* Description */}
        {movie.description && (
          <div>
            <p
              className={`text-[12.5px] leading-relaxed text-slate-300 ${
                descOpen ? "" : "line-clamp-3"
              }`}
            >
              {movie.description}
            </p>
            {longDesc && (
              <button
                onClick={() => setDescOpen((v) => !v)}
                className="mt-0.5 text-[12.5px] font-bold text-white hover:text-sky-300 transition"
              >
                {descOpen ? "Show Less" : "Read More"}
              </button>
            )}
          </div>
        )}

        {/* Like / Comments / Share */}
        <div className="flex items-stretch rounded-xl bg-white/[0.04] border border-white/10 divide-x divide-white/10 overflow-hidden">
          <button
            onClick={toggleLike}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold transition hover:bg-white/5 active:bg-white/10 ${
              liked ? "text-sky-400" : "text-slate-200"
            }`}
          >
            <ThumbsUp
              key={likePop}
              className={`w-4 h-4 ${liked ? "mv-like-pop" : ""}`}
              fill={liked ? "currentColor" : "none"}
            />
            <span>{liked ? "Liked" : "Like"}</span>
            {social.likeCount > 0 && (
              <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[11px]">
                {social.likeCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowComments(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold text-slate-200 transition hover:bg-white/5 active:bg-white/10"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Comments</span>
            {social.commentCount > 0 && (
              <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[11px]">
                {social.commentCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowShare(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold text-slate-200 transition hover:bg-white/5 active:bg-white/10"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>

      </main>
      </div>


      {/* Cast + related: plain black background (poster removed) */}
      <div className="relative overflow-hidden" style={{ background: BG }}>
        <div className="relative z-10 max-w-2xl mx-auto px-4 pt-6">
        {/* Cast */}
        <section>
          <h3 className="text-xl font-bold mb-3">Cast</h3>
          <div ref={castRef}>
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
          </div>
        </section>
        </div>

      {/* RELATED */}
      {relatedMovies.length > 0 && (
        <section className="relative z-10 max-w-5xl mx-auto px-4 pt-12 pb-6">
          <h3 className="text-base font-bold mb-3">
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
                    <PosterImage
                      src={rm.poster}
                      title={rm.title}
                      year={rm.year}
                      genre={rm.genre}
                      mediaType={mediaType}
                      tmdbId={rm.tmdbId}
                      tmdbType={rm.tmdbType}
                      loading="lazy"
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

      </div>

      </div>

      {/* Footer */}
      <div className="relative z-10 bg-black border-t border-white/10 mt-0">
        <div className="px-4 py-8 max-w-6xl mx-auto">
          <div className="flex justify-center items-center gap-4">
            <p className="text-slate-500 text-xs text-center">
              © 2025 MoviesVerse. সর্বাধিকার সংরক্ষিত। All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Trailer (YouTube style bottom sheet) */}
      {showTrailer && movie.trailer && (
        <TrailerSheet
          movie={movie}
          relatedItems={relatedItems}
          showAdultContent={showAdultContent}
          onClose={(current) => {
            setShowTrailer(false)
            if (current.id !== movie.id) onMovieClick?.(current)
          }}
        />
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
          poster={posterUrl}
        />
      )}

      {/* Share */}
      {showShare && (
        <ShareSheet
          title={movie.title}
          poster={posterUrl}
          onClose={() => setShowShare(false)}
        />
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
          moviePoster={posterUrl}
          hasPremiumAccess={entitlement.isPremiumActive}
        />
      )}
      <SubscriptionPanel
        open={showSubscriptions}
        onOpenChange={setShowSubscriptions}
      />

      {social.error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] rounded-full bg-red-500/90 px-4 py-2 text-sm font-semibold shadow-lg mv-fadeup">
          {social.error}
        </div>
      )}
    </div>
  )
            }
