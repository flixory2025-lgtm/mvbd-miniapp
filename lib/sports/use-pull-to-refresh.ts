"use client"

import { useEffect, useRef, useState } from "react"

// Lightweight pull-to-refresh for the matches dashboard (mobile)
export function usePullToRefresh(onRefresh: () => Promise<void> | void) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(0)
  const pulling = useRef(false)
  const THRESHOLD = 70

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY <= 0 && !refreshing) {
        startY.current = e.touches[0].clientY
        pulling.current = true
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      if (!pulling.current) return
      const delta = e.touches[0].clientY - startY.current
      if (delta > 0) {
        setPullDistance(Math.min(delta * 0.5, 90))
      }
    }
    const onTouchEnd = async () => {
      if (!pulling.current) return
      pulling.current = false
      if (pullDistance >= THRESHOLD) {
        setRefreshing(true)
        setPullDistance(THRESHOLD)
        await onRefresh()
        setRefreshing(false)
      }
      setPullDistance(0)
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true })
    el.addEventListener("touchmove", onTouchMove, { passive: true })
    el.addEventListener("touchend", onTouchEnd)
    return () => {
      el.removeEventListener("touchstart", onTouchStart)
      el.removeEventListener("touchmove", onTouchMove)
      el.removeEventListener("touchend", onTouchEnd)
    }
  }, [pullDistance, refreshing, onRefresh])

  return { containerRef, pullDistance, refreshing, threshold: THRESHOLD }
}
