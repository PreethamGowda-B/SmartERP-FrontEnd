"use client"

import { useState, useRef, useCallback, type KeyboardEvent } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Loader2, Paperclip, X, FileText } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/apiClient"
import type { MessageAttachment } from "@/types/messaging"

interface MessageInputProps {
  onSend: (content: string, attachment?: MessageAttachment) => Promise<void>
  onTyping?: (typing: boolean) => void
  disabled?: boolean
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const ACCEPTED_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
].join(",")

export function MessageInput({ onSend, onTyping, disabled = false }: MessageInputProps) {
  const [value, setValue] = useState("")
  const [pendingAttachment, setPendingAttachment] = useState<MessageAttachment | null>(null)
  const [uploading, setUploading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  const handleSend = async () => {
    const trimmed = value.trim()
    if ((!trimmed && !pendingAttachment) || disabled || uploading) return

    const attachmentToSend = pendingAttachment ?? undefined
    setValue("")
    setPendingAttachment(null)
    resetTextarea()
    onTyping?.(false)

    await onSend(trimmed, attachmentToSend)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    // Auto-resize
    const el = e.target
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 120) + "px"
    // Notify parent about typing state
    onTyping?.(e.target.value.length > 0)
  }

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Reset file input so the same file can be re-selected
    e.target.value = ""

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large (max 10 MB)")
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("attachment", file)

      // Use fetch directly for multipart (apiClient uses JSON)
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://smarterp-backendend.onrender.com"
      const token = typeof window !== "undefined"
        ? (localStorage.getItem("token") ?? sessionStorage.getItem("token") ?? "")
        : ""

      const response = await fetch(`${BACKEND_URL}/api/messages/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
        credentials: "include",
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.message || "Upload failed")
      }

      const data: MessageAttachment = await response.json()
      setPendingAttachment(data)
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload file")
    } finally {
      setUploading(false)
    }
  }, [])

  const isImage = pendingAttachment?.file_type.startsWith("image/")
  const canSend = (value.trim().length > 0 || !!pendingAttachment) && !disabled && !uploading

  return (
    <div className="border-t bg-background">
      {/* Pending attachment preview strip */}
      {pendingAttachment && (
        <div className="flex items-center gap-2 px-4 pt-3 pb-1">
          <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 flex-1 min-w-0">
            {isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={pendingAttachment.file_url}
                alt={pendingAttachment.file_name}
                className="h-8 w-8 rounded object-cover shrink-0"
              />
            ) : (
              <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{pendingAttachment.file_name}</p>
              <p className="text-[10px] text-muted-foreground">{formatFileSize(pendingAttachment.file_size)}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => setPendingAttachment(null)}
            aria-label="Remove attachment"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2 p-4">
        {/* File attach button */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          className="hidden"
          onChange={handleFileChange}
          aria-label="Attach file"
        />
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-9 w-9 text-muted-foreground hover:text-foreground"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          aria-label="Attach file"
          type="button"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Paperclip className="h-4 w-4" />
          )}
        </Button>

        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          disabled={disabled}
          maxLength={2000}
          rows={1}
          className="flex-1 min-h-10 max-h-30 resize-none overflow-y-auto"
          aria-label="Message input"
        />

        <Button
          size="icon"
          onClick={handleSend}
          disabled={!canSend}
          className="shrink-0"
          aria-label="Send message"
          type="button"
        >
          {disabled ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
