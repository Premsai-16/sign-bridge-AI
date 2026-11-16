import { useCallback, useRef, useState, useEffect } from 'react'

export interface RecognitionResult {
  label: string
  confidence: number
  timestamp: number
}

export function useSignRecognition() {
  const [isActive, setIsActive] = useState(false)
  const [transcript, setTranscript] = useState<string[]>([])
  const [currentLabel, setCurrentLabel] = useState<string | null>(null)
  const [confidence, setConfidence] = useState(0)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const lastLabelRef = useRef<string | null>(null)
  const lastEmitRef = useRef<number>(0)
  const neutralTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-IN'
      utterance.rate = 0.9
      setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      speechSynthesis.speak(utterance)
    }
  }, [])

  const processFrame = useCallback((label: string | null, conf: number) => {
    if (!label || conf < 0.7) {
      if (neutralTimeoutRef.current) {
        clearTimeout(neutralTimeoutRef.current)
      }
      neutralTimeoutRef.current = setTimeout(() => {
        lastLabelRef.current = null
        setCurrentLabel(null)
      }, 1000)
      return
    }

    setCurrentLabel(label)
    setConfidence(conf)

    const now = Date.now()
    const isNew = label !== lastLabelRef.current
    const timeSinceLast = now - lastEmitRef.current

    if (isNew && timeSinceLast > 800) {
      setTranscript(prev => [...prev, label])
      lastEmitRef.current = now
      lastLabelRef.current = label
      speak(label)
    }
  }, [speak])

  const start = useCallback(() => {
    setIsActive(true)
    setTranscript([])
    setCurrentLabel(null)
    setConfidence(0)
  }, [])

  const stop = useCallback(() => {
    setIsActive(false)
    setCurrentLabel(null)
    setConfidence(0)
    if (neutralTimeoutRef.current) {
      clearTimeout(neutralTimeoutRef.current)
    }
    window.speechSynthesis?.cancel()
    setIsSpeaking(false)
  }, [])

  const clearTranscript = useCallback(() => {
    setTranscript([])
  }, [])

  const setTranscriptText = useCallback((text: string) => {
    setTranscript([text])
  }, [])

  useEffect(() => {
    return () => {
      if (neutralTimeoutRef.current) {
        clearTimeout(neutralTimeoutRef.current)
      }
      window.speechSynthesis?.cancel()
    }
  }, [])

  return {
    isActive,
    transcript,
    currentLabel,
    confidence,
    isSpeaking,
    start,
    stop,
    clearTranscript,
    processFrame,
    speak,
    setTranscriptText,
  }
}
