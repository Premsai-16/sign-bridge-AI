import DeviceCheck from '../components/DeviceCheck'
import { accountStorage, flushAccountSaves } from '../lib/account'
import { OUTPUT_LANGUAGES } from '../lib/languages'
import { stopSpeech } from '../lib/speech'
import LocalizedNavLabel from '../components/LocalizedNavLabel'
import { useEffect, useState } from 'react'
import { Volume2, Shield, Palette, Camera, Coffee } from 'lucide-react'
import { clearSessions, getSavedSessions } from '../lib/sessions'
import { clearSignExamples, loadSignExamples } from '../lib/personalized-signs'

export default function Settings() {
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'))
  const [autoSpeak, setAutoSpeak] = useState(() => accountStorage.getItem('signbridge-auto-speak') !== 'false')
  const [highContrast, setHighContrast] = useState(() => accountStorage.getItem('signbridge-high-contrast') === 'true')
  const [reducedMotion, setReducedMotion] = useState(() => accountStorage.getItem('signbridge-reduced-motion') === 'true')
  const [cameraQuality, setCameraQuality] = useState(() => accountStorage.getItem('signbridge-camera-quality') || '720p')
  const [voice, setVoice] = useState(() => accountStorage.getItem('signbridge-output-language') || 'en-IN')
  const [speechRate, setSpeechRate] = useState(() => accountStorage.getItem('signbridge-speech-rate') || '1')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    accountStorage.setItem('signbridge-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', highContrast)
    accountStorage.setItem('signbridge-high-contrast', String(highContrast))
  }, [highContrast])

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reducedMotion)
    accountStorage.setItem('signbridge-reduced-motion', String(reducedMotion))
  }, [reducedMotion])

  const exportData = () => {
    const payload = { schemaVersion: 1, exportedAt: new Date().toISOString(), sessions: getSavedSessions(), personalSignExamples: loadSignExamples(), learningProgress: Object.fromEntries(['signbridge-alphabet-practice','signbridge-number-practice','signbridge-mastered-signs','signbridge-xp','signbridge-practice'].map(key => [key, accountStorage.getItem(key)])), conversation: accountStorage.getItem('signbridge-hub-messages'), voiceShortcuts: accountStorage.getItem('signbridge-voice-shortcuts') }
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'signbridge-data.json'
    anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    setNotice('Your sessions, personal signs, learning progress and voice shortcuts were exported. Keep this file private.')
  }

  const deleteData = async () => {
    if (!window.confirm('Delete your saved sessions, personal signs, conversations, voice shortcuts and study progress from your account on all devices? Your profile and shared owner vocabulary will remain. Export a backup first. This cannot be undone.')) return
    clearSessions()
    clearSignExamples()
    for (const key of ['signbridge-practice','signbridge-alphabet-practice','signbridge-number-practice','signbridge-mastered-signs','signbridge-xp','signbridge-hub-messages','signbridge-voice-shortcuts']) accountStorage.removeItem(key)
    accountStorage.removeItem('signbridge-community-interests')
    setNotice(await flushAccountSaves() ? 'Personal content and learning progress were deleted from your account.' : 'Deletion has not reached the server yet. Keep this tab open and use Save now to retry.')
  }

  return (
    <div className="prism-page container py-8 max-w-7xl">
      <div className="prism-page-heading flex flex-col gap-4 mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight"><LocalizedNavLabel label="Settings"/></h1>
        <p className="text-muted-foreground max-w-2xl">
          Customize your SignBridge AI experience to match your preferences and workflow.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <Palette className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-semibold"><LocalizedNavLabel label="Appearance"/></h2>
            </div>
            <div className="space-y-4">
              <ToggleSetting
                checked={darkMode}
                onChange={setDarkMode}
                label="Dark Mode"
                description="Switch between light and dark themes"
              />

              <ToggleSetting
                checked={highContrast}
                onChange={setHighContrast}
                label="High Contrast"
                description="Increase color contrast for better visibility"
              />

              <ToggleSetting checked={reducedMotion} onChange={setReducedMotion} label="Reduced Motion" description="Minimize animations and transitions" />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <Camera className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-semibold"><LocalizedNavLabel label="Camera"/></h2>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Camera preview starts only after you choose Open Camera and grant browser permission.</p>

              <div>
                <label className="text-sm font-medium mb-2 block"><LocalizedNavLabel label="Camera Quality"/></label>
                <select value={cameraQuality} onChange={event => { setCameraQuality(event.target.value); accountStorage.setItem('signbridge-camera-quality', event.target.value) }} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                  <option value="720p">720p (Recommended)</option>
                  <option value="1080p">1080p</option>
                  <option value="480p">480p (Low bandwidth)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <Volume2 className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-semibold"><LocalizedNavLabel label="Speech"/></h2>
            </div>
            <div className="space-y-4">
              <ToggleSetting
                checked={autoSpeak}
                onChange={value => { setAutoSpeak(value); accountStorage.setItem('signbridge-auto-speak', String(value)) }}
                label="Auto-speak recognized signs"
                description="Speak the assembled sign message after a short pause. Manual Speak buttons still work when this is off."
              />

              <div>
                <label className="text-sm font-medium mb-2 block"><LocalizedNavLabel label="Voice"/></label>
                <select value={voice} onChange={event => { setVoice(event.target.value); accountStorage.setItem('signbridge-output-language', event.target.value); window.dispatchEvent(new Event('signbridge-language')); stopSpeech() }} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                  {OUTPUT_LANGUAGES.map(language => <option key={language.code} value={language.code}>{language.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block"><LocalizedNavLabel label="Speech Speed"/></label>
                <select value={speechRate} onChange={event => { setSpeechRate(event.target.value); accountStorage.setItem('signbridge-speech-rate', event.target.value) }} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                  <option value="0.5">0.5×</option>
                  <option value="0.75">0.75×</option>
                  <option value="0.9">0.9×</option>
                  <option value="1">1.0×</option>
                  <option value="1.25">1.25×</option>
                  <option value="1.5">1.5×</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6"><h2 className="font-display text-xl font-semibold">Speech support</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Speech input depends on your browser. Common phrases have built-in audio in five languages. Custom text uses a matching device voice. Open Voice controls in Live Studio to test playback, select a voice, and adjust volume.</p></div>
        </div>
      </div>

      <DeviceCheck />
      <div className="grid gap-6 lg:grid-cols-2 mt-8">
        <div id="privacy" className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-semibold"><LocalizedNavLabel label="Privacy"/></h2>
          </div>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>Live recognition processes camera frames on your device. Owner training saves consented silent video clips on the server.</p>
            <p>Personal sign landmarks, learning progress and saved conversations are stored with your account.</p>
            <p>Online translation sends text to the translation provider when enabled. Speech recognition may use your browser’s online service.</p>
            <p>• Export your data anytime</p>
            <p>You can export or delete your personal content from your account.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Coffee className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-semibold"><LocalizedNavLabel label="Account"/></h2>
          </div>
          <div className="space-y-3">
            <button onClick={exportData} className="w-full rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition">
              <LocalizedNavLabel label="Export My Content"/>
            </button>
            <button onClick={() => void deleteData()} className="w-full rounded-xl border border-border px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition">
              <LocalizedNavLabel label="Delete My Saved Content"/>
            </button>
            <a href="#privacy" className="block w-full rounded-xl border border-border px-4 py-2 text-center text-sm font-medium hover:bg-muted transition">
              View Privacy Policy
            </a>
          </div>
        </div>
      </div>
      {notice && <p role="status" className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">{notice}</p>}
    </div>
  )
}

function ToggleSetting({ checked, onChange, label, description }: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description: string
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-sm"><LocalizedNavLabel label={label}/></p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary ${
          checked ? 'bg-primary' : 'bg-muted'
        }`}
        aria-label={label}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}
