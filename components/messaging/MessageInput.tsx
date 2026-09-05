"use client"

import { useState, useRef, useCallback, type KeyboardEvent } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Loader2, Paperclip, X, FileText, Mic, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"
import type { MessageAttachment } from "@/types/messaging"
import { VoiceNoteRecorder } from "@/components/voice-note-recorder"
import { getAuthToken } from "@/lib/apiClient"

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

const DOCUMENT_ACCEPTED_TYPES = [
  "application/pdf", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
].join(",")

const IMAGE_ACCEPTED_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
].join(",")

export function MessageInput({ onSend, onTyping, disabled = false }: MessageInputProps) {
  const [value, setValue] = useState("")
  const [pendingAttachment, setPendingAttachment] = useState<MessageAttachment | null>(null)
  const [uploading, setUploading] = useState(false)
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

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
    const el = e.target
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 120) + "px"
    onTyping?.(e.target.value.length > 0)
  }

  const uploadFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large (max 10 MB)")
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("attachment", file)

      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.prozync.in"
      const token = getAuthToken() || ""

      const response = await fetch(`${BACKEND_URL}/api/messages/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
        credentials: "include",
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.message || "Upload failed")
      }
      const data = await response.json()

      const isImage = file.type.startsWith("image/")
      const url = data.url || data.media_url || data.file_url || ""
      const type = isImage ? "image" : "document"

      setPendingAttachment({
        file_url: url,
        file_type: file.type || type,
        file_name: file.name,
        file_size: file.size,
        media_url: url,
        media_type: type,
      })
    } catch (err: any) {
      toast.error(err.message || "Failed to upload attachment")
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""
    await uploadFile(file)
  }, [])

  const handleVoiceNoteSend = async (blob: Blob, durationSeconds: number) => {
    setShowVoiceRecorder(false)
    try {
      setUploading(true)
      const formData = new FormData()
      formData.append("attachment", blob, `voicenote_${Date.now()}.webm`)

      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.prozync.in"
      const token = getAuthToken() || ""

      const response = await fetch(`${BACKEND_URL}/api/messages/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
        credentials: "include",
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.message || "Voice note upload failed")
      }
      const data = await response.json()
      const url = data.url || data.media_url || data.file_url || ""
      
      const attachment: MessageAttachment = {
        file_url: url,
        file_type: blob.type || "audio/webm",
        file_name: `Voice Note (${durationSeconds}s)`,
        file_size: blob.size,
        media_url: url,
        media_type: "audio",
      }
      await onSend("🎤 Voice Note", attachment)
    } catch (err: any) {
      toast.error(err.message || "Failed to send voice note")
    } finally {
      setUploading(false)
    }
  }

  const canSend = Boolean(value.trim() || pendingAttachment) && !disabled && !uploading

  return (
    <div className="border-t bg-card flex flex-col">
      {pendingAttachment && (
        <div className="flex items-center justify-between p-3 border-b bg-muted/30">
          <div className="flex items-center gap-2.5 min-w-0">
            {(pendingAttachment.media_type === "image" || pendingAttachment.file_type?.startsWith("image")) ? (
              <img
                src={pendingAttachment.media_url || pendingAttachment.file_url}
                alt="Attachment preview"
                className="h-10 w-10 rounded-lg object-cover shrink-0 border shadow-xs"
              />
            ) : (
              <FileText className="h-6 w-6 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate">{pendingAttachment.file_name}</p>
              <p className="text-[10px] text-muted-foreground">{formatFileSize(pendingAttachment.file_size)}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => setPendingAttachment(null)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {uploading && !pendingAttachment && (
        <div className="flex items-center gap-2 px-4 py-2 border-b bg-primary/5 text-xs text-primary animate-pulse">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Uploading attachment...</span>
        </div>
      )}

      {showVoiceRecorder ? (
        <div className="p-3">
          <VoiceNoteRecorder
            onSendVoiceNote={handleVoiceNoteSend}
            onCancel={() => setShowVoiceRecorder(false)}
          />
        </div>
      ) : (
        <div className="flex items-end gap-2 p-3">
          {/* File picker for documents */}
          <input
            ref={fileInputRef}
            type="file"
            accept={DOCUMENT_ACCEPTED_TYPES}
            className="hidden"
            onChange={handleFileChange}
          />
          {/* File picker for images */}
          <input
            ref={imageInputRef}
            type="file"
            accept={IMAGE_ACCEPTED_TYPES}
            className="hidden"
            onChange={handleFileChange}
          />

          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-9 w-9 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40"
            onClick={() => imageInputRef.current?.click()}
            disabled={disabled || uploading}
            type="button"
            title="Share Image"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            type="button"
            title="Attach Document"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-9 w-9 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            onClick={() => setShowVoiceRecorder(true)}
            disabled={disabled || uploading}
            type="button"
            title="Record Voice Message"
          >
            <Mic className="h-4 w-4" />
          </Button>

          <Textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={disabled}
            maxLength={2000}
            rows={1}
            className="flex-1 min-h-9 max-h-28 text-xs rounded-xl resize-none"
          />

          <Button
            size="icon"
            onClick={handleSend}
            disabled={!canSend}
            className="shrink-0 h-9 w-9 rounded-xl bg-primary text-primary-foreground"
            type="button"
          >
            {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  )
}
