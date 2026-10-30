import type { ReactNode } from "react"
import { Film } from "lucide-react"

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

/* ---------- exports ---------- */

export function MvbdAiMessage({ role, content, error, movies }: MvbdAiChatMessage) {
  if (role === "user") {
    return (
      <div className="mvbd-ai-message is-user">
        <div className="mvbd-ai-stub">{content}</div>
      </div>
    )
  }
  return (
    <div className="mvbd-ai-message is-assistant">
      <span className="mvbd-ai-avatar" aria-hidden="true">
        <img src={AI_AVATAR} alt="" />
      </span>
      <div className={`mvbd-ai-reply ${error ? "is-error" : ""}`}>
        {renderContent(content)}
        {movies && movies.length > 0 && (
          <div className="mvbd-ai-movies" role="list">
            {movies.map((movie, i) => <MovieCard key={`${movie.title}-${i}`} movie={movie} />)}
          </div>
        )}
      </div>
    </div>
  )
}

export function MvbdAiTyping() {
  return (
    <div className="mvbd-ai-message is-assistant" aria-label="MVBD AI is typing">
      <span className="mvbd-ai-avatar" aria-hidden="true">
        <img src={AI_AVATAR} alt="" />
      </span>
      <div className="mvbd-ai-reply mvbd-ai-typing"><i /><i /><i /></div>
    </div>
  )
}
