export interface SpeechCallbacks {
  onStart?: () => void
  onEnd?: () => void
  onError?: (message: string) => void
}

export function speakText(text: string, language = 'en-IN', rate = 1, callbacks: SpeechCallbacks = {}): boolean {
  if (!('speechSynthesis' in window) || !text.trim()) return false

  const synthesis = window.speechSynthesis
  const utterance = new SpeechSynthesisUtterance(text.trim())
  const voices = synthesis.getVoices()
  const locale = language.toLowerCase()
  const languageBase = locale.split('-')[0]
  const voice = voices.find(item => item.lang.toLowerCase() === locale)
    || voices.find(item => item.lang.toLowerCase().startsWith(`${languageBase}-`))
    || voices.find(item => item.lang.toLowerCase().startsWith('en-'))
    || voices.find(item => item.default)

  utterance.lang = voice?.lang || language
  utterance.voice = voice || null
  utterance.rate = Number.isFinite(rate) ? Math.min(2, Math.max(0.5, rate)) : 1
  utterance.onstart = () => callbacks.onStart?.()
  utterance.onend = () => callbacks.onEnd?.()
  utterance.onerror = event => callbacks.onError?.(event.error === 'not-allowed'
    ? 'The browser blocked speech. Press Test voice once, then try again.'
    : `Speech playback failed (${event.error}).`)

  synthesis.cancel()
  synthesis.resume()
  synthesis.speak(utterance)
  return true
}
