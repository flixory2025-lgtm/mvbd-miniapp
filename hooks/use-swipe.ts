import { useEffect, useRef, useState } from "react"

interface SwipeOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number
}

export function useSwipe(options: SwipeOptions = {}) {
  const { onSwipeLeft, onSwipeRight, threshold = 50 } = options
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.changedTouches[0].clientX
  }

  const handleTouchEnd = (e: TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX
    handleSwipe()
  }

  const handleSwipe = () => {
    const distance = touchStartX.current - touchEndX.current
    const isLeftSwipe = distance > threshold
    const isRightSwipe = distance < -threshold

    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft()
    }
    if (isRightSwipe && onSwipeRight) {
      onSwipeRight()
    }
  }

  useEffect(() => {
    const element = document.documentElement
    element.addEventListener("touchstart", handleTouchStart, false)
    element.addEventListener("touchend", handleTouchEnd, false)

    return () => {
      element.removeEventListener("touchstart", handleTouchStart, false)
      element.removeEventListener("touchend", handleTouchEnd, false)
    }
  }, [onSwipeLeft, onSwipeRight, threshold])
}
