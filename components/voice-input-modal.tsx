"use client"

import React, { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Sparkles, Loader2, Volume2, ArrowRight, Check } from "lucide-react"
import { apiClient } from "@/lib/apiClient"
import { useToast } from "@/hooks/use-toast"

interface VoiceInputModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (response: any) => void
  portal?: string
}

export function VoiceInputModal({ isOpen, onClose, onSuccess, portal = "owner" }: VoiceInputModalProps) {
  const { toast } = useToast()
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [aiResult, setAiResult] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = "en-IN" // Defaults to Indian English for shop floor context

      recognition.onresult = (event: any) => {
        let current = ""
        for (let i = 0; i < event.results.length; i++) {
          current += event.results[i][0].transcript + " "
        }
        setTranscript(current.trim())
      }

      recognition.onerror = (err: any) => {
        console.warn("Speech recognition error:", err)
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    }
  }, [])

  const startListening = () => {
    setAiResult(null)
    setTranscript("")
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (err) {
        console.warn("Error starting speech recognition:", err)
      }
    } else {
      toast({
        title: "Voice Not Supported",
        description: "Your browser does not support speech recognition. Please use Google Chrome or Edge.",
        variant: "destructive",
      })
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (_) {}
    }
    setIsListening(false)
  }

  const handleProcessVoice = async () => {
    if (!transcript.trim()) return
    setIsProcessing(true)
    setAiResult(null)

    try {
      const res = await apiClient<{ text?: string; error?: string }>("/api/ai/agent", {
        method: "POST",
        body: JSON.stringify({
          message: transcript,
          currentPortal: portal,
          currentModule: "voice_assistant",
        }),
      })

      const reply = res.text || "Voice command processed successfully."
      setAiResult(reply)
      if (onSuccess) onSuccess(res)
    } catch (err: any) {
      toast({
        title: "AI Processing Failed",
        description: err.message || "Failed to process voice command.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { stopListening(); onClose() } }}>
      <DialogContent className="sm:max-w-md rounded-2xl p-6 border-indigo-200 dark:border-indigo-900 shadow-2xl">
        <DialogHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 mb-2">
            <Volume2 className="h-6 w-6" />
          </div>
          <DialogTitle className="text-lg font-bold">Shop Floor Voice AI</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Speak naturally to log job actions, update part quantities, or request assistance hands-free.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Animated Mic Visualizer */}
          <div className="flex flex-col items-center justify-center py-4">
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={`relative w-20 h-20 rounded-full flex items-center justify-center text-white transition-all shadow-lg ${
                isListening
                  ? "bg-rose-600 shadow-rose-500/40 animate-pulse scale-105"
                  : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30"
              }`}
            >
              {isListening ? (
                <>
                  <span className="absolute inset-0 rounded-full bg-rose-500/30 animate-ping" />
                  <MicOff className="h-8 w-8 relative z-10" />
                </>
              ) : (
                <Mic className="h-8 w-8" />
              )}
            </button>
            <p className="text-xs font-semibold mt-3 text-slate-600 dark:text-slate-400">
              {isListening ? "Listening... Click to stop" : "Click microphone to start speaking"}
            </p>
          </div>

          {/* Live Transcript Box */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 min-h-[70px] flex items-center justify-center text-center">
            {transcript ? (
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200 italic">
                "{transcript}"
              </p>
            ) : (
              <p className="text-xs text-slate-400">
                Try: "Completed spindle alignment on Machine VMC-01" or "Check low stock bearings"
              </p>
            )}
          </div>

          {/* AI Result Box */}
          {aiResult && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-start gap-2 animate-in fade-in">
              <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">AI Interpretation:</p>
                <p>{aiResult}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex sm:justify-between gap-2">
          <Button variant="outline" size="sm" onClick={() => { stopListening(); onClose() }} className="rounded-xl text-xs">
            Close
          </Button>
          <Button
            size="sm"
            onClick={handleProcessVoice}
            disabled={!transcript.trim() || isProcessing}
            className="rounded-xl text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-1.5 shadow-sm"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Processing Command...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Execute Command <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
