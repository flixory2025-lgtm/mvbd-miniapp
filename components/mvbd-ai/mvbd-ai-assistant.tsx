"use client"

import { useEffect, useRef, useState } from "react"
import { RotateCcw, X } from "lucide-react"
import { MvbdAiInput } from "./mvbd-ai-input"
import { MvbdAiMessage, MvbdAiTyping, type MvbdAiChatMessage } from "./mvbd-ai-message"
import "./mvbd-ai.css"

const ENDPOINT = "https://alia.aliaaiultra4.workers.dev"
const AI_AVATAR = "https://i.postimg.cc/Wz5YXJgC/c6d87db279f921d6f9c5b1be88b84014.jpg"
const welcome: MvbdAiChatMessage = { role: "assistant", content: "Hello! আমি MVBD AI। কীভাবে সাহায্য করতে পারি?" }

type ApiResponse = { success?: boolean; reply?: string; message?: string }

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

  /* ---------------------------------------------------------
     Close handler with bubble animation
  --------------------------------------------------------- */
  const closePanel = () => {
    if (closing) return
    setClosing(true)

    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current)
    }

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
      if (closeTimer.current !== null) {
        window.clearTimeout(closeTimer.current)
      }
    }
  }, [])

  /* ---------------------------------------------------------
     Scroll hide launcher
  --------------------------------------------------------- */
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

  /* ---------------------------------------------------------
     Esc / outside click to close
  --------------------------------------------------------- */
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

  /* ---------------------------------------------------------
     Send message
  --------------------------------------------------------- */
  const send = async (question = value.trim()) => {
    const message = question.trim()
    if (!message || thinking) return
    const isRetry = failedMessage === message
    if (!isRetry) {
      setValue("")
      setMessages((current) => [...current, { role: "user", content: message }])
    }
    setFailedMessage(null)
    setThinking(true)
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
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
      setMessages((current) => [...current, { role: "assistant", content: data.reply as string }])
    } catch (error) {
      console.error("MVBD AI API Error:", error)
      setFailedMessage(message)
      setMessages((current) => [
        ...current,
        { role: "assistant", content: "দুঃখিত, এখন সংযোগে সমস্যা হচ্ছে। আবার চেষ্টা করুন।", error: true },
      ])
    } finally {
      setThinking(false)
    }
  }

  return (
    <div className="mvbd-ai-root">
      {open ? (
        <section
          className={`mvbd-ai-panel ${closing ? "is-closing" : ""}`}
          aria-label="MVBD AI chat"
        >
          <header className="mvbd-ai-header">
            <div className="mvbd-ai-brand">
              <span className="mvbd-ai-brand-mark">
                <img src={AI_AVATAR} alt="MVBD AI" />
              </span>
              <div>
                <strong>MVBD AI</strong>
                <small>আপনার স্মার্ট সহকারী</small>
              </div>
            </div>
            <button
              className="mvbd-ai-icon-button"
              onClick={closePanel}
              aria-label="Close MVBD AI"
            >
              <X size={17} />
            </button>
          </header>

          <div className="mvbd-ai-messages" aria-live="polite">
            {messages.map((message, index) => (
              <MvbdAiMessage key={`${message.role}-${index}`} {...message} />
            ))}
            {thinking && <MvbdAiTyping />}
            {failedMessage && !thinking && (
              <button className="mvbd-ai-retry" onClick={() => send(failedMessage)}>
                <RotateCcw size={13} /> Try Again
              </button>
            )}
          </div>

          <MvbdAiInput
            value={value}
            onChange={setValue}
            onSubmit={() => send()}
            disabled={thinking}
          />
        </section>
      ) : (
        <button
          className={`mvbd-ai-launcher ${hidden ? "is-hidden" : ""}`}
          onClick={openPanel}
          aria-label="Open MVBD AI assistant"
        >
          <img src={AI_AVATAR} alt="MVBD AI" />
        </button>
      )}
    </div>
  )
}
