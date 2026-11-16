import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Send, Volume2, MessageCircle, Camera, Mic, MicOff, Save, Trash2, AlertTriangle } from 'lucide-react'
import { saveSession } from '../lib/sessions'
import { speakText } from '../lib/speech'

interface Message { id: string; role: 'you' | 'partner'; content: string; at: string }
interface SpeechResultEvent extends Event { results: ArrayLike<ArrayLike<{ transcript: string }>>; resultIndex: number }
interface SpeechRecognitionLike {
  lang: string; continuous: boolean; interimResults: boolean
  onresult: ((event: SpeechResultEvent) => void) | null
  onerror: ((event: Event) => void) | null
  onend: (() => void) | null
  start(): void; stop(): void
}
interface SpeechWindow extends Window {
  SpeechRecognition?: new () => SpeechRecognitionLike
  webkitSpeechRecognition?: new () => SpeechRecognitionLike
}

const timestamp = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

export default function ConversationStudio() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [listening, setListening] = useState(false)
  const [speechError, setSpeechError] = useState('')
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  useEffect(() => () => recognitionRef.current?.stop(), [])

  const sendMessage = (text = inputValue) => {
    const content = text.trim()
    if (!content) return
    setMessages(current => [...current, { id: `${Date.now()}-${Math.random()}`, role: 'you', content, at: timestamp() }])
    setInputValue('')
  }

  const toggleSpeechInput = () => {
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }
    const speechWindow = window as SpeechWindow
    const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSpeechError('Speech-to-text is not supported by this browser. You can type instead, or try a current version of Chrome or Edge.')
      return
    }
    setSpeechError('')
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-IN'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onresult = event => {
      const phrase = event.results[event.resultIndex]?.[0]?.transcript
      if (phrase) sendMessage(phrase)
    }
    recognition.onerror = () => setSpeechError('Microphone input stopped. Check microphone permission and try again.')
    recognition.onend = () => setListening(false)
    recognitionRef.current = recognition
    try {
      recognition.start()
      setListening(true)
    } catch {
      setSpeechError('Could not start microphone input. Check that no other session is using it.')
    }
  }

  const speak = (text: string) => {
    const started = speakText(text, localStorage.getItem('signbridge-voice') || 'en-IN', Number(localStorage.getItem('signbridge-speech-rate') || '1'), {
      onError: message => setSpeechError(message),
    })
    if (!started) setSpeechError('Text-to-speech is not available in this browser.')
    else setSpeechError('')
  }

  const saveConversation = () => {
    if (messages.length) saveSession(messages.map(message => `${message.role === 'you' ? 'You' : 'Partner'}: ${message.content}`).join('\n'), 'Conversation')
  }

  return (
    <div className="container max-w-7xl py-10">
      <div className="mb-8 flex flex-col gap-3">
        <span className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Communication workspace</span>
        <h1 className="font-display text-4xl font-bold tracking-tight">Conversation studio</h1>
        <p className="max-w-2xl text-muted-foreground">Type or speak to build a readable conversation. Use speech output to share messages aloud.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
        <section className="flex min-h-[620px] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div><h2 className="font-display text-xl font-semibold">Conversation</h2><p className="mt-1 text-xs text-muted-foreground">Messages remain in this tab until you save them.</p></div>
            <button onClick={saveConversation} disabled={!messages.length} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"><Save className="h-4 w-4" />Save</button>
          </div>
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-primary/[0.025] to-transparent p-5">
            {!messages.length ? <div className="flex h-full min-h-64 flex-col items-center justify-center text-center"><div className="mb-4 rounded-2xl bg-primary/10 p-4 text-primary"><MessageCircle className="h-7 w-7" /></div><h3 className="font-semibold">Start a conversation</h3><p className="mt-2 max-w-xs text-sm text-muted-foreground">Type a message below, or use the microphone for speech-to-text.</p></div> : messages.map(message => (
              <div key={message.id} className={`flex ${message.role === 'you' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.role === 'you' ? 'rounded-br-md bg-primary text-primary-foreground' : 'rounded-bl-md bg-muted'}`}>
                  <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.content}</p>
                  <div className="mt-2 flex items-center justify-between gap-6 text-[11px] opacity-70"><span>{message.role === 'you' ? 'You' : 'Partner'}</span><span>{message.at}</span></div>
                </div>
                <button onClick={() => speak(message.content)} aria-label="Speak message" title="Speak message" className="ml-2 self-end rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><Volume2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
          <div className="border-t border-border p-4">
            {speechError && <p role="status" className="mb-3 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">{speechError}</p>}
            <form onSubmit={event => { event.preventDefault(); sendMessage() }} className="flex gap-2">
              <input value={inputValue} onChange={event => setInputValue(event.target.value)} placeholder="Write a message…" aria-label="Message" className="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              <button type="button" onClick={toggleSpeechInput} title={listening ? 'Stop speech input' : 'Speak a message'} aria-label={listening ? 'Stop speech input' : 'Speak a message'} className={`rounded-xl border px-3 ${listening ? 'border-red-500 bg-red-500/10 text-red-600' : 'border-border hover:bg-muted'}`}>{listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}</button>
              <button type="submit" disabled={!inputValue.trim()} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"><Send className="h-4 w-4" /><span className="hidden sm:inline">Send</span></button>
            </form>
          </div>
        </section>

        <aside className="space-y-5">
          <div className="rounded-3xl border border-border bg-card p-6">
            <h2 className="font-display text-xl font-semibold">Live sign translation</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">The camera workspace includes an experimental 11-sign vocabulary and optional personal held-sign training. It does not provide continuous ISL interpretation.</p>
            <div className="mt-5 flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm"><AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" /><span>Camera recognition currently covers 11 isolated signs and user-trained held signs.</span></div>
            <Link to="/live-translate" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold hover:bg-muted"><Camera className="h-4 w-4" />Open camera workspace</Link>
          </div>
          <div className="rounded-3xl border border-border bg-card p-6">
            <h2 className="font-display text-xl font-semibold">Text-to-speech</h2>
            <p className="mt-2 text-sm text-muted-foreground">Choose any message in the conversation and press its speaker button to read it aloud.</p>
            <button onClick={() => messages.length ? speak(messages[messages.length - 1].content) : setSpeechError('Send a message first, then use this action to speak it.')} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"><Volume2 className="h-4 w-4" />Speak latest message</button>
            <button onClick={() => { setMessages([]); window.speechSynthesis?.cancel() }} disabled={!messages.length} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm text-muted-foreground hover:bg-muted disabled:opacity-40"><Trash2 className="h-4 w-4" />Clear conversation</button>
          </div>
        </aside>
      </div>
    </div>
  )
}
