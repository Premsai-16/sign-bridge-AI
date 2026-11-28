import { accountStorage } from './account'
import { translateAutomatically } from './auto-translate'
import { builtInAudioText, PHRASE_KEYS, OUTPUT_LANGUAGES, translatePhrase } from './languages'
export interface SpeechCallbacks {
  signal?: AbortSignal
  queue?: boolean
  translate?: boolean
  onStart?: () => void
  onEnd?: () => void
  onError?: (message: string) => void
}
interface SpeechJob { needsTranslation?: boolean; text: string; language: string; rate: number; volume: number; callbacks: SpeechCallbacks }
let jobs: SpeechJob[] = []
let busy = false
let generation = 0
let audio: HTMLAudioElement | null = null
let activeJob: SpeechJob | null = null
let currentUtterance: SpeechSynthesisUtterance | null = null
let lastSpeech: { text: string; language: string } | null = null
const locale = (value: string) => value.replace(/_/g, '-').toLowerCase()
const notify = (state: string, job?: SpeechJob, error?: string) => window.dispatchEvent(new CustomEvent('signbridge-speech', { detail: { state, text: job?.text, language: job?.language, error } }))
export function getLastSpeech() { return lastSpeech }
export function stopSpeech() {
  generation += 1; jobs = []; busy = false; activeJob = null
  if (audio) { audio.pause(); audio.src = ''; audio = null }
  if (currentUtterance) { currentUtterance.onend = null; currentUtterance.onerror = null }
  window.speechSynthesis?.cancel(); currentUtterance = null
  notify('stopped')
}
function fallbackUrl(text: string, language: string) {
  const languageCode = OUTPUT_LANGUAGES.find(item => locale(item.code) === locale(language))?.code
  if (!languageCode) return null
  const key = PHRASE_KEYS.find(item => builtInAudioText(item, languageCode) === text || (languageCode === 'en-IN' && item === text.toLowerCase()))
  // Only shipped phrases qualify: owner overrides must not play an older recording.
  return key ? `/audio/${languageCode}/${key.replaceAll(' ', '-')}.wav` : null
}
async function waitForVoices() {
  const synthesis = window.speechSynthesis
  if (!synthesis || synthesis.getVoices().length) return
  await new Promise<void>(resolve => {
    const finish = () => { clearTimeout(timer); synthesis.removeEventListener('voiceschanged', finish); resolve() }
    const timer = window.setTimeout(finish, 1200)
    synthesis.addEventListener('voiceschanged', finish)
  })
}
async function playNext() {
  if (busy || !jobs.length) return
  while (jobs[0]?.callbacks.signal?.aborted) jobs.shift()
  if (!jobs.length) return
  busy = true
  const job = jobs.shift()!
  activeJob = job
  const token = generation
  let settled = false
  const abort = () => {
    if (activeJob !== job || settled) return
    settled = true
    generation += 1
    if (audio) { audio.pause(); audio.src = ''; audio = null }
    if (currentUtterance) { currentUtterance.onend = null; currentUtterance.onerror = null; window.speechSynthesis?.cancel(); currentUtterance = null }
    busy = false; activeJob = null
    void playNext()
  }
  job.callbacks.signal?.addEventListener('abort', abort, { once: true })
  const started = () => { if (token !== generation) return; lastSpeech = { text: job.text, language: job.language }; job.callbacks.onStart?.(); notify('speaking', job) }
  const finish = (error?: string) => {
    if (token !== generation || settled) return
    settled = true
    job.callbacks.signal?.removeEventListener('abort', abort)
    busy = false; activeJob = null; audio = null; currentUtterance = null
    if (error) { job.callbacks.onError?.(error); notify('error', job, error) }
    else { job.callbacks.onEnd?.(); notify('finished', job) }
    void playNext()
  }
  if (job.needsTranslation) {
    notify('translating', job)
    try { job.text = await translateAutomatically(job.text, job.language) }
    catch (error) { finish(error instanceof Error ? error.message : 'Automatic translation failed.'); return }
    if (token !== generation) return
  }
  notify('translated', job)
  const recording = fallbackUrl(job.text, job.language)
  if (recording) {
    audio = new Audio(recording); audio.controls = true
    if (typeof document !== 'undefined') { const host = document.getElementById('signbridge-audio-preview'); if (host) host.replaceChildren(audio) }
    audio.playbackRate = job.rate; audio.volume = job.volume
    audio.onplaying = started; audio.onended = () => finish()
    audio.onerror = () => finish('The phrase audio could not load. Refresh the page and try Test greeting.')
    try { await audio.play() } catch { finish('Audio was blocked. Press Test greeting to enable playback, then try again.') }
    return
  }
  if (!window.speechSynthesis) { finish('This browser does not support device speech. Common phrase recordings are still available.'); return }
  await waitForVoices()
  if (token !== generation) return
  const voices = window.speechSynthesis.getVoices()
  const languageBase = locale(job.language).split('-')[0]
  const preference = accountStorage.getItem(`signbridge-device-voice-${job.language}`)
  const matching = voices.filter(item => locale(item.lang).split('-')[0] === languageBase)
  const voice = matching.find(item => item.voiceURI === preference) || matching.find(item => locale(item.lang) === locale(job.language)) || matching[0]
  if (!voice && languageBase !== 'en') { finish('No device voice for this language is available for custom text. Use a common phrase recording or install a matching voice in your device settings.'); return }
  const utterance = new SpeechSynthesisUtterance(job.text); currentUtterance = utterance
  utterance.lang = job.language; utterance.voice = voice || null; utterance.rate = job.rate; utterance.volume = job.volume
  utterance.onstart = started; utterance.onend = () => finish()
  utterance.onerror = event => finish(event.error === 'not-allowed' ? 'The browser blocked speech. Press Test greeting, then try again.' : `Speech playback failed (${event.error}).`)
  window.speechSynthesis.resume(); window.speechSynthesis.speak(utterance)
}
export function speakText(text: string, language = 'en-IN', rate = 1, callbacks: SpeechCallbacks = {}): boolean {
  if (!text.trim() || callbacks.signal?.aborted) return false
  let needsTranslation = false
  const output = accountStorage.getItem('signbridge-output-language')
  if (output && callbacks.translate !== false) {
    const translated = translatePhrase(text, output)
    if (translated.translated) { text = translated.text; language = output }
    else if (!output.startsWith('en')) { language = output; needsTranslation = true }
  }
  if (!callbacks.queue) stopSpeech()
  if (jobs.length >= 8) { callbacks.onError?.('Speech queue is full. Stop playback or wait for the current messages.'); return false }
  const volume = Number(accountStorage.getItem('signbridge-speech-volume') ?? '1')
  jobs.push({ needsTranslation, text: text.trim(), language, rate: Number.isFinite(rate) ? Math.min(2, Math.max(.5, rate)) : 1, volume: Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : 1, callbacks })
  void playNext(); return true
}
