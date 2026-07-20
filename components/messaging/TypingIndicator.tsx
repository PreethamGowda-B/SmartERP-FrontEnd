"use client"

interface TypingIndicatorProps {
  name: string
}

export function TypingIndicator({ name }: TypingIndicatorProps) {
  return (
    <div className="flex items-end gap-2 mb-1">
      <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl rounded-bl-sm bg-muted max-w-30">
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
      </div>
      <span className="text-[10px] text-muted-foreground mb-1">{name} is typing…</span>
    </div>
  )
}
