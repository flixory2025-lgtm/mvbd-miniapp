"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { ReactNode } from "react"
import { Check, Copy, Film, Share2 } from "lucide-react"

const AI_AVATAR = "https://i.postimg.cc/Wz5YXJgC/c6d87db279f921d6f9c5b1be88b84014.jpg"

export type MvbdAiMovie = {
  title: string
  year?: string
  language?: string
  quality?: string
  poster?: string
  url?: string
}

export type MvbdAiChatMessage = {
  role: "user" | "assistant"
  content: string
  error?: boolean
  movies?: MvbdAiMovie[]
}

/* ---------- tiny safe markdown renderer (no HTML injection) ---------- */

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^\s)]+\)|https?:\/\/[^\s)]+)/g

function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  let i = 0
  let m: RegExpExecArray | null
  INLINE.lastIndex = 0
  while ((m = INLINE.exec(text))) {
    const token = m[0]
    if (m.index > last) out.push(text.slice(last, m.index))
    const k = `${key}-${i++}`
    if (token.startsWith("**")) {
      out.push(<strong key={k}>{token.slice(2, -2)}</strong>)
    } else if (token.startsWith("`")) {
      out.push(<code key={k}>{token.slice(1, -1)}</code>)
    } else if (token.startsWith("[")) {
      const parts = /^\[([^\]]+)\]\((.+)\)$/.exec(token)
      if (parts) out.push(<a key={k} href={parts[2]} target="_blank" rel="noopener noreferrer">{parts[1]}</a>)
    } else {
      const url = token.replace(/[.,!?;:]+$/, "")
      out.push(<a key={k} href={url} target="_blank" rel="noopener noreferrer">{url}</a>)
      if (url.length < token.length) out.push(token.slice(url.length))
    }
    last = m.index + token.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

function renderContent(content: string): ReactNode[] {
  const blocks: ReactNode[] = []
  const lines = content.replace(/\r/g, "").split("\n")
  let para: string[] = []
  let list: { ordered: boolean; items: string[] } | null = null
  let code: string[] | null = null

  const flushPara = () => {
    if (!para.length) return
    const key = `p${blocks.length}`
    blocks.push(<p key={key}>{inline(para.join(" "), key)}</p>)
    para = []
  }
  const flushList = () => {
    if (!list) return
    const key = `l${blocks.length}`
    const items = list.items.map((item, i) => <li key={i}>{inline(item, `${key}-${i}`)}</li>)
    blocks.push(list.ordered ? <ol key={key}>{items}</ol> : <ul key={key}>{items}</ul>)
    list = null
  }

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      if (code) {
        blocks.push(<pre key={`c${blocks.length}`}><code>{code.join("\n")}</code></pre>)
        code = null
      } else {
        flushPara()
        flushList()
        code = []
      }
      continue
    }
    if (code) {
      code.push(line)
      continue
    }
    const bullet = /^\s*[-*•]\s+(.*)$/.exec(line)
    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line)
    const heading = /^\s*#{1,4}\s+(.*)$/.exec(line)
    if (bullet || numbered) {
      flushPara()
      const ordered = !!numbered
      if (list && list.ordered !== ordered) flushList()
      if (!list) list = { ordered, items: [] }
      list.items.push((bullet || numbered)![1])
    } else if (heading) {
      flushPara()
      flushList()
      const key = `h${blocks.length}`
      blocks.push(<p key={key} className="mvbd-ai-heading">{inline(heading[1], key)}</p>)
    } else if (!line.trim()) {
      flushPara()
      flushList()
    } else {
      flushList()
      para.push(line.trim())
    }
  }
  if (code) blocks.push(<pre key={`c${blocks.length}`}><code>{code.join("\n")}</code></pre>)
  flushPara()
  flushList()
  return blocks
}

/* ---------- movie cards ---------- */

function MovieCard({ movie }: { movie: MvbdAiMovie }) {
  const meta = [movie.year, movie.language, movie.quality].filter(Boolean).join(" · ")
  const body = (
    <>
      <span className="mvbd-ai-poster">
        {movie.poster ? (
          <img
            src={movie.poster}
            alt=""
            loading="lazy"
            onError={(e) => { e.currentTarget.style.display = "none" }}
          />
        ) : null}
        <Film size={22} aria-hidden="true" />
      </span>
      <strong>{movie.title}</strong>
      {meta && <small>{meta}</small>}
    </>
  )
  return movie.url ? (
    <a className="mvbd-ai-movie" href={movie.url} target="_blank" rel="noopener noreferrer">{body}</a>
  ) : (
    <div className="mvbd-ai-movie">{body}</div>
  )
}

/* ---------- reply actions (copy / share) ---------- */

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

function ReplyActions({ content }: { content: string }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => () => clearTimeout(timer.current), [])

  const flash = () => {
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 1800)
  }
  const onCopy = async () => {
    if (await copyText(content)) flash()
  }
  const onShare = async () => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ text: content })
        return
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return
      }
    }
    if (await copyText(content)) flash()
  }

  return (
    <div className="mvbd-ai-actions-row">
      <button type="button" onClick={onCopy} aria-label={copied ? "কপি হয়েছে" : "কপি করুন"} title="কপি">
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </button>
      <button type="button" onClick={onShare} aria-label="শেয়ার করুন" title="শেয়ার">
        <Share2 size={13} />
      </button>
    </div>
  )
}

/* ---------- assistant reply with word-by-word typing ---------- */

// replies already shown once (so reopening the chat doesn't replay old answers)
const seenReplies = new Set<string>()

function AssistantReply({
  content,
  error,
  movies,
  animate,
}: {
  content: string
  error?: boolean
  movies?: MvbdAiMovie[]
  animate?: boolean
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [typing] = useState(() => {
    if (error) return false
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false
    if (animate !== undefined) return animate
    return !seenReplies.has(content)
  })
  const tokens = useMemo(() => content.split(/(\s+)/), [content])
  const [count, setCount] = useState(typing ? 0 : tokens.length)

  useEffect(() => {
    seenReplies.add(content)
  }, [content])

  useEffect(() => {
    if (!typing || count >= tokens.length) return
    // a bit faster for very long replies
    const step = Math.max(1, Math.ceil(tokens.length / 260))
    const id = setInterval(() => {
      setCount((c) => Math.min(c + step, tokens.length))
    }, 30)
    return () => clearInterval(id)
  }, [typing, count, tokens.length])

  // keep the chat scrolled down while text is being typed
  useEffect(() => {
    if (!typing) return
    const box = rootRef.current?.closest(".mvbd-ai-messages") as HTMLElement | null
    if (!box) return
    if (box.scrollHeight - box.scrollTop - box.clientHeight < 160) {
      box.scrollTo({ top: box.scrollHeight, behavior: "auto" })
    }
  }, [typing, count])

  const done = !typing || count >= tokens.length
  const visible = typing ? tokens.slice(0, count).join("") : content

  return (
    <div className="mvbd-ai-message is-assistant" ref={rootRef}>
      <span className="mvbd-ai-avatar" aria-hidden="true">
        <img src={AI_AVATAR} alt="" />
      </span>
      <div className={`mvbd-ai-reply ${error ? "is-error" : ""}`}>
        {renderContent(visible)}
        {!done && <span className="mvbd-ai-caret" aria-hidden="true" />}
        {done && movies && movies.length > 0 && (
          <div className="mvbd-ai-movies" role="list">
            {movies.map((movie, i) => <MovieCard key={`${movie.title}-${i}`} movie={movie} />)}
          </div>
        )}
        {done && !error && content.trim() && <ReplyActions content={content} />}
      </div>
    </div>
  )
}

/* ---------- exports ---------- */

export function MvbdAiMessage({
  role,
  content,
  error,
  movies,
  animate,
}: MvbdAiChatMessage & { animate?: boolean }) {
  if (role === "user") {
    return (
      <div className="mvbd-ai-message is-user">
        <div className="mvbd-ai-stub">{content}</div>
      </div>
    )
  }
  return <AssistantReply content={content} error={error} movies={movies} animate={animate} />
}

const DEFAULT_STEPS = ["Thinking...", "Searching...", "Preparing the answer..."]

/** Thinking indicator: shows one step at a time, in English.
 *  Pass `status` to show a real status text instead of the timed steps. */
export function MvbdAiTyping({ steps = DEFAULT_STEPS, status }: { steps?: string[]; status?: string }) {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    if (status || idx >= steps.length - 1) return
    const id = setTimeout(() => setIdx((i) => i + 1), 1600)
    return () => clearTimeout(id)
  }, [idx, steps.length, status])

  const label = status ?? steps[idx] ?? steps[steps.length - 1]

  return (
    <div className="mvbd-ai-message is-assistant" aria-label="MVBD AI is thinking" role="status">
      <span className="mvbd-ai-avatar" aria-hidden="true">
        <img src={AI_AVATAR} alt="" />
      </span>
      <div className="mvbd-ai-reply mvbd-ai-thinking">
        <div key={label} className="mvbd-ai-step is-current">
          <span className="mvbd-ai-pulse" aria-hidden="true"><i /><i /><i /></span>
          <span className="mvbd-ai-step-text">{label}</span>
        </div>
      </div>
    </div>
  )
}
