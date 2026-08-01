"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { FileText, Download, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { MessageAttachment } from "@/types/messaging"

interface AttachmentPreviewProps {
  attachment: MessageAttachment
  isOwn: boolean
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function AttachmentPreview({ attachment, isOwn }: AttachmentPreviewProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const isImage = attachment.file_type.startsWith("image/")

  if (isImage) {
    return (
      <>
        {/* Thumbnail — click to open lightbox */}
        <button
          onClick={() => setLightboxOpen(true)}
          className="block rounded-xl overflow-hidden mt-1 focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label={`View image: ${attachment.file_name}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={attachment.file_url}
            alt={attachment.file_name}
          className="max-w-60 max-h-45 object-cover rounded-xl"
            loading="lazy"
          />
        </button>

        {/* Lightbox */}
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-3xl p-2 bg-black/90 border-0">
            <div className="sr-only">
              <DialogTitle>Image Preview</DialogTitle>
              <DialogDescription>{attachment.file_name}</DialogDescription>
            </div>
            <div className="relative flex items-center justify-center">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 text-white hover:bg-white/20"
                onClick={() => setLightboxOpen(false)}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </Button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={attachment.file_url}
                alt={attachment.file_name}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
              <a
                href={attachment.file_url}
                download={attachment.file_name}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-2 right-2"
                aria-label="Download"
              >
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                  <Download className="h-4 w-4" />
                </Button>
              </a>
            </div>
            <p className="text-center text-xs text-white/60 mt-1 truncate px-4">
              {attachment.file_name} · {formatFileSize(attachment.file_size)}
            </p>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // Document / non-image attachment
  return (
    <a
      href={attachment.file_url}
      download={attachment.file_name}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-3 mt-1 px-3 py-2.5 rounded-xl border transition-colors
        ${isOwn
          ? "border-primary-foreground/20 hover:bg-primary-foreground/10"
          : "border-border hover:bg-accent"
        }`}
      aria-label={`Download ${attachment.file_name}`}
    >
      <FileText className="h-8 w-8 shrink-0 opacity-70" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium truncate">{attachment.file_name}</p>
        <p className="text-[10px] opacity-60">{formatFileSize(attachment.file_size)}</p>
      </div>
      <Download className="h-4 w-4 shrink-0 opacity-60" />
    </a>
  )
}
