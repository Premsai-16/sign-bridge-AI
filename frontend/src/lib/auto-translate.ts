import { accountStorage } from './account'
import { translatePhrase } from './languages'
const cache = new Map<string, string>()
const inFlight = new Map<string, Promise<string>>()
export async function translateAutomatically(text: string, target: string): Promise<string> {
  const local = translatePhrase(text, target)
  if (local.translated) return local.text
  if (accountStorage.getItem('signbridge-auto-translate') === 'false') throw new Error('Online auto-translation is off. Turn it on for words outside the built-in vocabulary.')
  const key = `${target}:${text.trim().toLowerCase()}`
  if (cache.has(key)) return cache.get(key)!
  if (inFlight.has(key)) return inFlight.get(key)!
  const work = (async () => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12000)
    try {
      const response = await fetch(`${import.meta.env?.VITE_API_URL || ''}/api/v1/translation`, {
        method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({text,source:'en',target:target.split('-')[0],consent:true}),
      })
      const result = await response.json()
      if (!response.ok || typeof result.text !== 'string' || !result.text.trim()) throw new Error(typeof result.detail === 'string' ? result.detail : 'Automatic translation is unavailable. Try the sign again.')
      if (cache.size >= 256) cache.delete(cache.keys().next().value!)
      cache.set(key,result.text)
      return result.text as string
    } catch (error) {
      if (controller.signal.aborted) throw new Error('Translation took too long. Please try the sign again.')
      throw error
    } finally { clearTimeout(timeout); inFlight.delete(key) }
  })()
  inFlight.set(key,work)
  return work
}
