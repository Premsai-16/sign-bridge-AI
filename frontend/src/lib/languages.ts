let sharedTranslations: Record<string, Record<string, string>> = {}
export function setSharedTranslations(value: Record<string, Record<string, string>>) { sharedTranslations = value }
export const OUTPUT_LANGUAGES = [{ code: 'en-IN', name: 'English' }, { code: 'kn-IN', name: 'ಕನ್ನಡ · Kannada' }, { code: 'ta-IN', name: 'தமிழ் · Tamil' }, { code: 'te-IN', name: 'తెలుగు · Telugu' }, { code: 'hi-IN', name: 'हिन्दी · Hindi' }]
const phrases: Record<string, string[]> = {
  love: ['ಪ್ರೀತಿ', 'அன்பு', 'ప్రేమ', 'प्यार'],
  i: ['ನಾನು', 'நான்', 'నేను', 'मैं'],
  you: ['ನೀವು', 'நீங்கள்', 'మీరు', 'आप'],
  hello: ['ನಮಸ್ಕಾರ', 'வணக்கம்', 'నమస్కారం', 'नमस्ते'],
  'thank you': ['ಧನ್ಯವಾದಗಳು', 'நன்றி', 'ధన్యవాదాలు', 'धन्यवाद'],
  yes: ['ಹೌದು', 'ஆம்', 'అవును', 'हाँ'],
  no: ['ಇಲ್ಲ', 'இல்லை', 'కాదు', 'नहीं'],
  water: ['ನೀರು', 'தண்ணீர்', 'నీరు', 'पानी'],
  help: ['ಸಹಾಯ', 'உதவி', 'సహాయం', 'मदद'],
  'please speak slowly': ['ದಯವಿಟ್ಟು ನಿಧಾನವಾಗಿ ಮಾತನಾಡಿ', 'தயவுசெய்து மெதுவாகப் பேசுங்கள்', 'దయచేసి నెమ్మదిగా మాట్లాడండి', 'कृपया धीरे बोलिए'],
}
export function builtInAudioText(key: string, language: string): string | undefined {
  if (language === 'en-IN') return Object.hasOwn(phrases, key) ? key : undefined
  return phrases[key]?.[['kn-IN', 'ta-IN', 'te-IN', 'hi-IN'].indexOf(language)]
}
export const PHRASE_KEYS = Object.keys(phrases)
export function translatePhrase(text: string, language: string): { text: string; translated: boolean } {
  text = text.trim().replace(/\s+/g, ' ').replace(/[.!?]+$/, '')
  const index = ['kn-IN', 'ta-IN', 'te-IN', 'hi-IN'].indexOf(language)
  if (index >= 0 && Object.values(phrases).some(values => values[index] === text)) return { text, translated: true }
  const custom = sharedTranslations[text.trim().toLowerCase()]?.[language]
  const nativeScripts: Record<string, RegExp> = { 'kn-IN': /[\u0C80-\u0CFF]/, 'ta-IN': /[\u0B80-\u0BFF]/, 'te-IN': /[\u0C00-\u0C7F]/, 'hi-IN': /[\u0900-\u097F]/ }
  // Text already written in the selected script is spoken as-is.
  if (nativeScripts[language]?.test(text)) return { text, translated: true }
  if (custom && (!nativeScripts[language] || nativeScripts[language].test(custom))) return { text: custom, translated: true }
  const value = phrases[text.trim().toLowerCase().replace(/[.!?]+$/, '')]?.[index]
  return { text: value || text, translated: index < 0 || Boolean(value) }
}
