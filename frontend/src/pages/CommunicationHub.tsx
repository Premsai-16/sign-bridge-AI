import { accountStorage } from '../lib/account'
import { useState, useRef, useEffect } from 'react'
import {
  Send,
  Volume2,
  Mic,
  MicOff,
  MessageSquare,
  Sparkles,
  Download,
  Copy,
  Trash2,
  Check,
} from 'lucide-react'
import { speakText } from '../lib/speech'
import { saveSession } from '../lib/sessions'

interface ChatMessage {
  id: string
  sender: 'signer' | 'partner'
  text: string
  timestamp: string
}

const QUICK_CHIPS = [
  'Yes, I understand.',
  'No, thank you.',
  'Could you please repeat that?',
  'Please wait a minute.',
  'Can you write it down?',
  'Thank you very much!',
  'Where is the restroom?',
  'I am deaf / hard of hearing.',
]

export default function CommunicationHub() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      return JSON.parse(accountStorage.getItem('signbridge-hub-messages') || '[]')
    } catch {
      return []
    }
  })
  const [inputText, setInputText] = useState('')
  const [activeRole, setActiveRole] = useState<'signer' | 'partner'>('signer')
  const [isListening, setIsListening] = useState(false)
  const [liveCaption, setLiveCaption] = useState('')
  const [autoSpeak, setAutoSpeak] = useState(true)
  const [selectedVoice, setSelectedVoice] = useState(() => accountStorage.getItem('signbridge-voice') || 'en-IN')
  const [speechRate, setSpeechRate] = useState(1.0)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const recognitionRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    accountStorage.setItem('signbridge-hub-messages', JSON.stringify(messages))
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Initialize Speech-to-Text
  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Speech-to-text is not supported in this browser. Please use Chrome, Edge, or Safari.')
      return
    }

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = selectedVoice

      recognition.onresult = (event: any) => {
        let interim = ''
        let final = ''
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript
          } else {
            interim += event.results[i][0].transcript
          }
        }

        if (final) {
          const newMsg: ChatMessage = {
            id: Date.now().toString(),
            sender: 'partner',
            text: final.trim(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
          setMessages(prev => [...prev, newMsg])
          setLiveCaption('')
        } else {
          setLiveCaption(interim)
        }
      }

      recognition.onerror = () => {
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.start()
      recognitionRef.current = recognition
      setIsListening(true)
    } catch {
      setIsListening(false)
    }
  }

  const handleSendMessage = (textToSend?: string) => {
    const content = (textToSend || inputText).trim()
    if (!content) return

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: activeRole,
      text: content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages(prev => [...prev, newMsg])
    setInputText('')

    if (autoSpeak && activeRole === 'signer') {
      speakText(content, selectedVoice, speechRate)
    }
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleSaveSession = () => {
    if (messages.length === 0) return
    const textContent = messages
      .map(m => `[${m.timestamp}] ${m.sender.toUpperCase()}: ${m.text}`)
      .join('\n')
    saveSession(textContent, 'Two-Way Hub Session')
    alert('Session saved to Conversation History!')
  }

  const handleClear = () => {
    if (confirm('Clear current conversation?')) {
      setMessages([])
      accountStorage.removeItem('signbridge-hub-messages')
    }
  }

  return (
    <div className="prism-page container max-w-7xl py-8">
      {/* Header */}
      <div className="prism-page-heading mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Dual-Channel Accessibility Hub</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
            Communication Hub
          </h1>
          <p className="mt-1 text-muted-foreground text-sm sm:text-base max-w-2xl">
            Seamless two-way conversation between Signers and Speaking Partners with instant speech
            synthesis, live microphone captioning, and quick phrase responses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveSession}
            disabled={messages.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold hover:bg-muted transition disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            Save Transcript
          </button>
          <button
            onClick={handleClear}
            disabled={messages.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left Column: Two-Way Chat Workspace */}
        <div className="flex flex-col rounded-3xl border border-border bg-card overflow-hidden shadow-xl h-[620px]">
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 rounded-full bg-emerald-500"></span>
              <span className="text-sm font-bold">Active Communication Channel</span>
            </div>

            {/* Role Switcher */}
            <div className="flex rounded-lg bg-background p-1 border border-border text-xs">
              <button
                onClick={() => setActiveRole('signer')}
                className={`px-3 py-1 rounded font-semibold transition ${
                  activeRole === 'signer'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Signer (Deaf)
              </button>
              <button
                onClick={() => setActiveRole('partner')}
                className={`px-3 py-1 rounded font-semibold transition ${
                  activeRole === 'partner'
                    ? 'bg-secondary text-secondary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Speaking Partner
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 stroke-1 mb-3 text-primary/40" />
                <p className="font-display font-semibold text-base text-foreground">
                  No messages yet
                </p>
                <p className="text-xs sm:text-sm max-w-sm mt-1">
                  Type a message below or press the speech microphone button to transcribe spoken replies.
                </p>
              </div>
            )}

            {messages.map(msg => {
              const isSigner = msg.sender === 'signer'

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isSigner ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider ${
                        isSigner ? 'text-primary' : 'text-secondary'
                      }`}
                    >
                      {isSigner ? 'Signer (You)' : 'Hearing Partner'}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{msg.timestamp}</span>
                  </div>

                  <div
                    className={`group relative max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm ${
                      isSigner
                        ? 'bg-primary text-primary-foreground rounded-br-xs'
                        : 'bg-muted border border-border text-foreground rounded-bl-xs'
                    }`}
                  >
                    <p>{msg.text}</p>

                    {/* Hover Action Buttons */}
                    <div className="mt-2 flex items-center gap-2 opacity-80 group-hover:opacity-100 transition">
                      <button
                        onClick={() => speakText(msg.text, selectedVoice, speechRate)}
                        className="rounded p-1 hover:bg-black/15 transition text-xs flex items-center gap-1"
                        title="Speak aloud"
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                        <span className="text-[10px]">Speak</span>
                      </button>
                      <button
                        onClick={() => handleCopy(msg.text, msg.id)}
                        className="rounded p-1 hover:bg-black/15 transition text-xs flex items-center gap-1"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-300" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        <span className="text-[10px]">Copy</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Live Caption Interim Preview */}
            {liveCaption && (
              <div className="flex flex-col items-start animate-pulse">
                <span className="text-xs font-bold text-secondary mb-1">Partner speaking...</span>
                <div className="rounded-2xl bg-secondary/10 border border-secondary/30 px-5 py-3 text-sm text-foreground">
                  <p className="italic">"{liveCaption}"</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="border-t border-border bg-card p-4">
            <form
              onSubmit={e => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder={
                  activeRole === 'signer'
                    ? 'Type message to speak aloud...'
                    : 'Type or click mic to speak...'
                }
                className="flex-1 rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
              />

              <button
                type="button"
                onClick={toggleListening}
                className={`flex h-12 w-12 items-center justify-center rounded-2xl transition shadow-md ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                title={isListening ? 'Stop listening' : 'Start microphone speech-to-text'}
              >
                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>

              <button
                type="submit"
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-md"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Audio Settings & Quick Response Chips */}
        <div className="flex flex-col gap-6">
          {/* Audio Engine Configuration */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold">Voice & Speech Engine</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Auto-Speak:</span>
                <input
                  type="checkbox"
                  checked={autoSpeak}
                  onChange={e => setAutoSpeak(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Spoken Voice Language
                </label>
                <select
                  value={selectedVoice}
                  onChange={e => {
                    setSelectedVoice(e.target.value)
                    accountStorage.setItem('signbridge-voice', e.target.value)
                  }}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-semibold"
                >
                  <option value="en-IN">English (India)</option>
                  <option value="en-US">English (US)</option>
                  <option value="hi-IN">Hindi (India)</option>
                  <option value="bn-IN">Bengali (India)</option>
                  <option value="ta-IN">Tamil (India)</option>
                  <option value="te-IN">Telugu (India)</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-muted-foreground uppercase">Speech Speed</span>
                  <span className="font-bold text-primary">{speechRate}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={speechRate}
                  onChange={e => setSpeechRate(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            </div>
          </div>

          {/* Quick Response Chips */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h3 className="font-display text-lg font-bold mb-2">Instant Quick Responses</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Tap any chip to instantly send and speak aloud without typing.
            </p>

            <div className="flex flex-wrap gap-2">
              {QUICK_CHIPS.map(chip => (
                <button
                  key={chip}
                  onClick={() => handleSendMessage(chip)}
                  className="rounded-xl border border-border bg-background/60 px-3.5 py-2 text-xs font-medium hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
