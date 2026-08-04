"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Mic, Square, Trash2, Send, Play, Pause, Volume2 } from "lucide-react"

interface VoiceNoteRecorderProps {
  onSendVoiceNote: (audioBlob: Blob, durationSeconds: number) => void
  onCancel?: () => void
}

export function VoiceNoteRecorder({ onSendVoiceNote, onCancel }: VoiceNoteRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioChunksRef.current = []
      const recorder = new MediaRecorder(stream)

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        setAudioBlob(blob)
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      console.error("Microphone access denied:", err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
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
      onSendVoiceNote(audioBlob, recordingTime)
      resetState()
    }
  }

  const resetState = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (audioUrl) URL.revokeObjectURL(audioUrl)
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
    <div className="flex items-center gap-3 p-2 bg-card rounded-2xl border shadow-sm w-full">
      {!isRecording && !audioUrl ? (
        <Button
          type="button"
          onClick={startRecording}
          variant="outline"
          size="sm"
          className="h-9 px-3 text-xs font-bold rounded-xl border-rose-300 text-rose-600 hover:bg-rose-50 dark:bg-rose-950/40"
        >
          <Mic className="h-4 w-4 mr-1.5 animate-pulse" /> Hold to Record Voice Note
        </Button>
      ) : isRecording ? (
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-rose-600 text-xs font-black animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
            Recording Audio: {formatTimer(recordingTime)}
          </div>
          <Button
            type="button"
            onClick={stopRecording}
            size="sm"
            className="h-8 px-3 text-xs font-bold rounded-xl bg-rose-600 text-white"
          >
            <Square className="h-3.5 w-3.5 mr-1 fill-white" /> Stop
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between w-full gap-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={togglePlayPlayback}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-foreground" />}
            </Button>
            <div className="text-xs font-bold text-foreground">Voice Note ({formatTimer(recordingTime)})</div>
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="icon" onClick={resetState} className="h-8 w-8 text-rose-600">
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button type="button" size="sm" onClick={handleSend} className="h-8 px-3 text-xs font-bold rounded-xl bg-emerald-600 text-white">
              <Send className="h-3.5 w-3.5 mr-1" /> Send Voice
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
