export const greetings: Record<string, string> = {
  'en-IN': 'Hello', 'kn-IN': 'ನಮಸ್ಕಾರ', 'ta-IN': 'வணக்கம்',
  'te-IN': 'నమస్కారం', 'hi-IN': 'नमस्ते',
}
export function welcomeText(name: string, language: string): string {
  const cleaned = name.replace(/[,，،]+/g, ' ').replace(/\s+/g, ' ').trim()
  return `${greetings[language] || greetings['en-IN']}${cleaned ? ` ${cleaned}` : ''}`
}

/** One successful welcome per account/name/language during this page visit. */
const welcomed = new Set<string>()
export function startAutomaticWelcome(options: {
  key: string
  target: EventTarget
  speak: (callbacks: { signal: AbortSignal; onStart: () => void; onError: (message: string) => void }) => void
  notice: (message: string) => void
}): () => void {
  if (welcomed.has(options.key)) return () => {}
  const controller = new AbortController()
  let waitingForInteraction = false
  let attemptedRetry = false
  let active = true
  const removeListeners = () => {
    options.target.removeEventListener('pointerup', interact)
    options.target.removeEventListener('keydown', interact)
  }
  const attempt = () => options.speak({
    signal: controller.signal,
    onStart: () => { if (active) { welcomed.add(options.key); waitingForInteraction = false; removeListeners(); options.notice('') } },
    onError: message => {
      if (!active) return
      if (/blocked|not.allowed/i.test(message) && !attemptedRetry) {
        waitingForInteraction = true
        options.notice('Your browser will allow the welcome after your first tap or key press.')
        options.target.addEventListener('pointerup', interact)
        options.target.addEventListener('keydown', interact)
      } else options.notice(message)
    },
  })
  function interact() {
    if (!active || !waitingForInteraction) return
    attemptedRetry = true; waitingForInteraction = false; removeListeners(); attempt()
  }
  // Delay one task so React's development effect replay cannot speak twice.
  const timer = setTimeout(attempt, 0)
  return () => { active = false; clearTimeout(timer); removeListeners(); controller.abort() }
}
