"use client"

import { useEffect, useRef } from "react"
import type { FormEvent, KeyboardEvent } from "react"
import { ArrowUp } from "lucide-react"

type Props = {
  value: string
  disabled?: boolean
  onChange: (value: string) => void
  onSubmit: () => void
}

export function MvbdAiInput({ value, disabled, onChange, onSubmit }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)

  // grow with the text, up to 5 lines
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [value])

  // after a reply arrives, put the cursor back (desktop only, so phones don't pop the keyboard)
  useEffect(() => {
    if (!disabled && window.matchMedia("(pointer: fine)").matches) ref.current?.focus()
  }, [disabled])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  const keyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <form className="mvbd-ai-input-wrap" onSubmit={submit}>
      <textarea
        ref={ref}
        rows={1}
        maxLength={1000}
        aria-label="Message MVBD AI"
        placeholder="মুভি খুঁজুন বা কিছু জিজ্ঞেস করুন…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={keyDown}
        disabled={disabled}
      />
      <button type="submit" aria-label="Send message" disabled={disabled || !value.trim()}>
        <ArrowUp size={18} />
      </button>
    </form>
  )
}
