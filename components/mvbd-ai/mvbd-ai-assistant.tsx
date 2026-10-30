"use client"

import { useEffect, useRef, useState } from "react"
import { RotateCcw, SquarePen, X } from "lucide-react"
import { MvbdAiInput } from "./mvbd-ai-input"
import { MvbdAiMessage, MvbdAiTyping, type MvbdAiChatMessage, type MvbdAiMovie } from "./mvbd-ai-message"
import "./mvbd-ai.css"

const ENDPOINT = "https://alia.aliaaiultra4.workers.dev"
const AI_AVATAR = "https://i.postimg.cc/Wz5YXJgC/c6d87db279f921d6f9c5b1be88b84014.jpg"
const HISTORY_LIMIT = 12

const welcome: MvbdAiChatMessage = {
  role: "assistant",
  content: "আমি MVBD AI। মুভি খুঁজতে, Premium বা Mini App নিয়ে জানতে, অথবা যেকোনো প্রশ্ন করতে পারেন।",
}

const SUGGESTIONS = [
  "নতুন কী মুভি এসেছে?",
  "Movie request kibhabe korbo?",
  "MVBD Premium কী?",
  "Mini App কী?",
]

type ApiResponse = { success?: boolean; reply?: string; message?: string; movies?: MvbdAiMovie[] }

export function MvbdAiAssistant() {
  const [open, setOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [closing, setClosing] = useState(false)
  const [value, setValue] = useState("")
  const [thinking, setThinking] = useState(false)
  const [messages, setMessages] = useState<MvbdAiChatMessage[]>([welcome])
  const [failedMessage, setFailedMessage] = useState<string | null>(null)
  const lastScroll = useRef(0)
  const frame = useRef<number | null>(null)
  const closeTimer = useRef<number | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  /* ---------- open / close ---------- */
  const closePanel = () => {
    if (closing) return
    setClosing(true)
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => {
      setOpen(false)
      setClosing(false)
      closeTimer.current = null
    }, 320)
  }

  const openPanel = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
    setClosing(false)
    setHidden(false)
    setOpen(true)
  }

  useEffect(() => {
    return () => {
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current)
    }
  }, [])

  /* ---------- hide launcher while scrolling down ---------- */
  useEffect(() => {
    const onScroll = () => {
      if (frame.current) return
      frame.current = requestAnimationFrame(() => {
        const current = window.scrollY
        setHidden(current > lastScroll.current && current > 100 && !open)
        lastScroll.current = current
        frame.current = null
      })
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      if (frame.current) cancelAnimationFrame(frame.current)
    }
  }, [open])

  /* ---------- Esc / outside click ---------- */
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePanel()
    }
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Element
      if (!target.closest(".mvbd-ai-root")) closePanel()
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("pointerdown", onPointer)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("pointerdown", onPointer)
    }
  }, [open, closing])

  /* ---------- keep the newest message in view ---------- */
  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" })
  }, [messages, thinking, open])

  /* ---------- new chat ---------- */
  const resetChat = () => {
    if (thinking) return
    setMessages([welcome])
    setFailedMessage(null)
    setValue("")
  }

  /* ---------- send ---------- */
  const send = async (question = value.trim()) => {
    const message = question.trim()
    if (!message || thinking) return
    const isRetry = failedMessage === message

    // conversation so far (no welcome text, no error bubbles), so the AI remembers context
    const base = messages.filter((m) => m !== welcome && !m.error)
    const earlier = isRetry && base.length && base[base.length - 1].role === "user" ? base.slice(0, -1) : base
    const history = earlier.slice(-HISTORY_LIMIT).map(({ role, content }) => ({ role, content }))

    if (isRetry) {
      setMessages((current) => current.filter((m) => !m.error))
    } else {
      setValue("")
      setMessages((current) => [...current, { role: "user", content: message }])
    }
    setFailedMessage(null)
    setThinking(true)

    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      })
      let data: ApiResponse = {}
      try {
        data = await response.json()
      } catch (error) {
        console.error("MVBD AI Response JSON Error:", error)
        throw new Error(`AI server returned non-JSON response (${response.status})`)
      }
      if (!response.ok) {
        console.error("MVBD AI Response:", data)
        throw new Error(data.message || `AI server error: ${response.status}`)
      }
      if (!data.success || typeof data.reply !== "string" || !data.reply.trim()) {
        console.error("MVBD AI Response:", data)
        throw new Error(data.message || "AI returned an invalid response.")
      }
      const reply: MvbdAiChatMessage = {
        role: "assistant",
        content: data.reply,
        movies: Array.isArray(data.movies) ? data.movies : undefined,
      }
      setMessages((current) => [...current, reply])
    } catch (error) {
      console.error("MVBD AI API Error:", error)
      setFailedMessage(message)
      setMessages((current) => [
        ...current,
        { role: "assistant", content: "সংযোগ করা যায়নি। ইন্টারনেট দেখে আবার চেষ্টা করুন।", error: true },
      ])
    } finally {
      setThinking(false)
    }
  }

  const showSuggestions = messages.length === 1 && !thinking

  return (
    <div className="mvbd-ai-root">
      {open ? (
        <section className={`mvbd-ai-panel ${closing ? "is-closing" : ""}`} aria-label="MVBD AI chat">
          <header className="mvbd-ai-header">
            <div className="mvbd-ai-brand">
              <span className="mvbd-ai-brand-mark">
                <img src={AI_AVATAR} alt="" />
              </span>
              <div>
                <strong>MVBD AI</strong>
                <small>মুভি ও সাপোর্ট সহকারী</small>
              </div>
            </div>
            <div className="mvbd-ai-actions">
              <button className="mvbd-ai-icon-button" onClick={resetChat} aria-label="New chat" title="নতুন চ্যাট">
                <SquarePen size={16} />
              </button>
              <button className="mvbd-ai-icon-button" onClick={closePanel} aria-label="Close MVBD AI">
                <X size={17} />
              </button>
            </div>
          </header>

          <div className="mvbd-ai-messages" aria-live="polite">
            {messages.map((message, index) => (
              <MvbdAiMessage key={`${message.role}-${index}`} {...message} />
            ))}
            {thinking && <MvbdAiTyping />}
            {failedMessage && !thinking && (
              <button className="mvbd-ai-retry" onClick={() => send(failedMessage)}>
                <RotateCcw size={13} /> আবার চেষ্টা করুন
              </button>
            )}
            {showSuggestions && (
              <div className="mvbd-ai-chips">
                {SUGGESTIONS.map((text) => (
                  <button key={text} onClick={() => send(text)}>{text}</button>
                ))}
              </div>
            )}
            <div ref={endRef} />
          </div>

          <MvbdAiInput value={value} onChange={setValue} onSubmit={() => send()} disabled={thinking} />
          <p className="mvbd-ai-note">AI ভুল করতে পারে। Premium ও payment-এর বিষয়ে support-এ যোগাযোগ করুন।</p>
        </section>
      ) : (
        <button
          className={`mvbd-ai-launcher ${hidden ? "is-hidden" : ""}`}
          onClick={openPanel}
          aria-label="Open MVBD AI assistant"
        >
          <img src={AI_AVATAR} alt="" />
        </button>
      )}
    </div>
  )
}
