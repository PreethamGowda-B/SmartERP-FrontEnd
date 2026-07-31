"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Loader2 } from "lucide-react"
import { motion } from "framer-motion"

interface AIVoiceInputProps {
  onSpeechResult: (transcript: string) => void
  disabled?: boolean
}

export function AIVoiceInput({ onSpeechResult, disabled }: AIVoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const recognitionRef = useRef<any>(null)
  const onSpeechResultRef = useRef(onSpeechResult)

  useEffect(() => {
    onSpeechResultRef.current = onSpeechResult
  }, [onSpeechResult])

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setIsSupported(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = "en-US"

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      if (transcript) {
        onSpeechResultRef.current(transcript)
      }
      setIsListening(false)
    }

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition error:", event.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
  }, [])

  const toggleListening = () => {
    if (!recognitionRef.current) return

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (err) {
        console.warn("Failed to start speech recognition:", err)
      }
    }
  }

  if (!isSupported) {
    return null // Gracefully degrade if browser doesn't support Web Speech API
  }

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggleListening}
      disabled={disabled}
      className={`h-9 w-9 rounded-md flex items-center justify-center transition-all duration-300 ${
        isListening
          ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50"
          : "bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary"
      }`}
      title={isListening ? "Listening... Click to stop" : "Speak hands-free command"}
    >
      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </motion.button>
  )
}
