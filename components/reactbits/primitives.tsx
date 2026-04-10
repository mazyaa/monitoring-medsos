"use client"

import type { CSSProperties, KeyboardEventHandler, ReactNode } from "react"

type StyledProps = {
  children?: ReactNode
  style?: CSSProperties
  className?: string
}

type TouchableProps = StyledProps & {
  onPress?: () => void
}

export function View({ children, style, className }: StyledProps) {
  return (
    <div className={className} style={style}>
      {children}
    </div>
  )
}

export function Text({ children, style, className }: StyledProps) {
  return (
    <span className={className} style={style}>
      {children}
    </span>
  )
}

export function Touchable({ children, style, className, onPress }: TouchableProps) {
  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (!onPress) {
      return
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onPress()
    }
  }

  return (
    <div
      className={className}
      style={style}
      role={onPress ? "button" : undefined}
      tabIndex={onPress ? 0 : undefined}
      onClick={onPress}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  )
}
