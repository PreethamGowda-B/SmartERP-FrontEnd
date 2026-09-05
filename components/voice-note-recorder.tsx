"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Mic, Square, Trash2, Send, Play, Pause } from "lucide-react"
import { toast } from "sonner"

interface VoiceNoteRecorderProps {
  onSendVoiceNote: (audioBlob: Blob, durationSeconds: number) => void
  onCancel?: () => void
  autoStart?: boolean
}

function getSupportedMimeType(): string {
  if (typeof window === "undefined" || !("MediaRecorder" in window)) return "audio/webm"
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/ogg",
    "audio/wav",
  ]
  for (const t of types) {
    if (MediaRecorder.isTypeSupported(t)) return t
  }
  return ""
}

export function VoiceNoteRecorder({ onSendVoiceNote, onCancel, autoStart = true }: VoiceNoteRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, [audioUrl])

  const stopTracks = useCallback(() => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop())
      audioStreamRef.current = null
    }
  }, [])

  const startRecording = useCallback(async () => {
    if (typeof window === "undefined" || !navigator?.mediaDevices?.getUserMedia) {
      toast.error("Microphone recording is not supported in this browser.")
      onCancel?.()
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioStreamRef.current = stream
      audioChunksRef.current = []

      const mimeType = getSupportedMimeType()
      const options = mimeType ? { mimeType } : undefined
      const recorder = new MediaRecorder(stream, options)

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      recorder.onstop = () => {
        const finalType = recorder.mimeType || mimeType || "audio/webm"
        const blob = new Blob(audioChunksRef.current, { type: finalType })
        setAudioBlob(blob)
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        stopTracks()
      }

      mediaRecorderRef.current = recorder
      recorder.start(250) // slice chunks every 250ms
      setIsRecording(true)
      setRecordingTime(0)

      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (err: any) {
      console.error("Microphone access error:", err)
      const msg = err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
        ? "Microphone access blocked. Please click the lock/settings icon in your browser address bar and enable Microphone."
        : "Could not access microphone: " + (err.message || "Unknown error")
      toast.error(msg)
      onCancel?.()
    }
  }, [onCancel, stopTracks])

  useEffect(() => {
    if (autoStart) {
      startRecording()
    }
  }, [autoStart, startRecording])

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop()
      } catch (e) {
        console.warn("Error stopping recorder:", e)
      }
      setIsRecording(false)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  const togglePlayPlayback = () => {
    if (!audioElementRef.current && audioUrl) {
      const audio = new Audio(audioUrl)
      audio.onended = () => setIsPlaying(false)
      audioElementRef.current = audio
    }

    if (audioElementRef.current) {
      if (isPlaying) {
        audioElementRef.current.pause()
        setIsPlaying(false)
      } else {
        audioElementRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  const handleSend = () => {
    if (audioBlob) {
      onSendVoiceNote(audioBlob, Math.max(1, recordingTime))
      resetState()
    }
  }

  const resetState = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    stopTracks()
    setIsRecording(false)
    setRecordingTime(0)
    setAudioUrl(null)
    setAudioBlob(null)
    setIsPlaying(false)
    if (onCancel) onCancel()
  }

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  return (
    <div className="flex items-center gap-3 p-2.5 bg-card/90 backdrop-blur-sm rounded-2xl border shadow-sm w-full transition-all">
      {!isRecording && !audioUrl ? (
        <div className="flex items-center justify-between w-full">
          <Button
            type="button"
            onClick={startRecording}
            variant="outline"
            size="sm"
            className="h-9 px-4 text-xs font-bold rounded-xl border-rose-300 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            <Mic className="h-4 w-4 mr-1.5 animate-pulse" /> Click to Record Voice Note
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={resetState} className="text-xs text-muted-foreground">
            Cancel
          </Button>
        </div>
      ) : isRecording ? (
        <div className="flex items-center justify-between w-full gap-2">
          <div className="flex items-center gap-2.5 text-rose-600 text-xs font-bold">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
            </span>
            <span>Recording: {formatTimer(recordingTime)}</span>
            <div className="hidden sm:flex items-center gap-0.5 h-3 ml-2">
              <span className="w-1 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.3s] h-3" />
              <span className="w-1 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.15s] h-4" />
              <span className="w-1 bg-rose-500 rounded-full animate-bounce h-2" />
              <span className="w-1 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.2s] h-4" />
              <span className="w-1 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.05s] h-3" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetState}
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={stopRecording}
              size="sm"
              className="h-8 px-3 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
            >
              <Square className="h-3.5 w-3.5 mr-1 fill-white" /> Done
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between w-full gap-2">
          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full border-primary/30"
              onClick={togglePlayPlayback}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-foreground" />}
            </Button>
            <div className="text-xs font-bold text-foreground">
              Voice Note ({formatTimer(recordingTime)})
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={resetState}
              className="h-8 w-8 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSend}
              className="h-8 px-3.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              <Send className="h-3.5 w-3.5 mr-1" /> Send Voice
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
