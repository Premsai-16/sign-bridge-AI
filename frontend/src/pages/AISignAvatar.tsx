import { accountStorage } from '../lib/account'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Volume2,
  Sparkles,
  Type,
  BookOpen,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'
import SignAvatarCanvas from '../components/SignAvatarCanvas'
import { PRESET_SIGNS } from '../components/avatarPoses'
import { speakText } from '../lib/speech'

export default function AISignAvatar() {
  const [activeTab, setActiveTab] = useState<'presets' | 'fingerspell' | 'text'>('presets')
  const [selectedSign, setSelectedSign] = useState('hello')
  const [typedText, setTypedText] = useState('INDIA')
  const [speed, setSpeed] = useState(1.0)
  const [theme, setTheme] = useState<'saffron' | 'cyber' | 'contrast' | 'pastel'>('saffron')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)

  const presetList = Object.entries(PRESET_SIGNS).map(([key, data]) => ({
    key,
    ...data,
  }))

  const handleSpeak = (textToSpeak: string) => {
    if (!voiceEnabled || !textToSpeak) return
    setIsSpeaking(true)
    const started = speakText(textToSpeak, accountStorage.getItem('signbridge-voice') || 'en-IN', speed, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    })
    if (!started) setIsSpeaking(false)
  }

  const handleSelectPreset = (key: string) => {
    setSelectedSign(key)
    const sign = PRESET_SIGNS[key]
    if (sign) {
      handleSpeak(sign.label.split('/')[0].trim())
    }
  }

  return (
    <div className="prism-page container max-w-7xl py-8">
      {/* Header */}
      <div className="prism-page-heading mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Interactive pose and hand viewer</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
            Human Connection Studio
          </h1>
          <p className="mt-1 text-muted-foreground max-w-2xl text-sm sm:text-base">
            Explore clear visual references and hand-motion controls. For learning actual ISL signs, use the official alphabet and number lessons.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex rounded-xl bg-muted p-1 border border-border">
          <button
            onClick={() => {
              setActiveTab('presets')
              handleSelectPreset('hello')
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'presets'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            Sign Library
          </button>
          <button
            onClick={() => setActiveTab('fingerspell')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'fingerspell'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Type className="h-4 w-4" />
            Fingerspelling
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left Column: Avatar Stage */}
        <div className="flex flex-col rounded-3xl border border-border bg-card overflow-hidden shadow-xl">
          {/* Avatar Header / Stage Toolbar */}
          <div className="flex items-center justify-between border-b border-border bg-muted/40 px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <div>
                <p className="text-sm font-bold text-foreground">
                  {activeTab === 'presets' ? PRESET_SIGNS[selectedSign]?.label : `Spelling: "${typedText}"`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {activeTab === 'presets' ? PRESET_SIGNS[selectedSign]?.hindi : 'Indian Sign Alphabet'}
                </p>
              </div>
            </div>

            {/* Avatar Theme Switcher */}
            <div className="flex items-center gap-1.5 bg-background/80 rounded-lg p-1 border border-border text-xs">
              {(['saffron', 'cyber', 'contrast', 'pastel'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`capitalize px-2 py-1 rounded transition text-xs font-medium ${
                    theme === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Canvas Display */}
          <div className="relative flex min-h-[380px] sm:min-h-[440px] items-center justify-center bg-gradient-to-b from-card via-background to-muted/20 p-6">
            <div className="w-full"><Link to="/learn" className="my-4 inline-flex rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground">Open official ISL lessons</Link><details open className="rounded-xl border border-border p-4"><summary className="cursor-pointer font-semibold">Optional illustrated hand-motion viewer</summary>
            <SignAvatarCanvas
              activeSignKey={activeTab === 'presets' ? selectedSign : ''}
              fingerspellText={activeTab === 'fingerspell' ? typedText : ''}
              speed={speed}
              theme={theme}
              className="w-full h-full"
            />
            </details></div>
          </div>

          {/* Interactive Playback Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const currentWord = activeTab === 'presets'
                    ? PRESET_SIGNS[selectedSign]?.label.split('/')[0].trim()
                    : typedText
                  handleSpeak(currentWord)
                }}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  voiceEnabled
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <Volume2 className={`h-4 w-4 ${isSpeaking ? 'animate-bounce' : ''}`} />
                {isSpeaking ? 'Speaking...' : 'Speak Audio'}
              </button>

              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`rounded-xl border border-border px-3 py-2 text-xs font-medium transition ${
                  voiceEnabled ? 'text-primary border-primary/30' : 'text-muted-foreground'
                }`}
              >
                Auto-Voice: {voiceEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Speed Selector */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground font-medium">Speed:</span>
              {[0.5, 1.0, 1.5].map(s => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    speed === s ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Library / Fingerspell Input */}
        <div className="flex flex-col gap-6">
          {activeTab === 'presets' && (
            <div className="flex flex-col rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="font-display text-xl font-bold">Illustrative Gesture Library</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Select a demonstration to inspect its illustrated motion and hand configuration.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
                {presetList.map(item => {
                  const isSelected = selectedSign === item.key
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleSelectPreset(item.key)}
                      className={`flex flex-col text-left rounded-2xl p-4 border transition duration-200 ${
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-md ring-2 ring-primary/20'
                          : 'border-border bg-background/50 hover:bg-muted hover:border-primary/30'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="font-display font-semibold text-sm text-foreground">
                          {item.label}
                        </span>
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                      </div>
                      <span className="text-xs text-secondary font-medium mb-1">
                        {item.hindi}
                      </span>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === 'fingerspell' && (
            <div className="flex flex-col rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="font-display text-xl font-bold">Text-to-Sign Fingerspelling</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Type any word, name, or acronym to animate standard sign alphabet letter-by-letter.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="fingerspell-input" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Enter Word / Letters (A-Z)
                  </label>
                  <input
                    id="fingerspell-input"
                    type="text"
                    value={typedText}
                    onChange={e => setTypedText(e.target.value.toUpperCase().slice(0, 20))}
                    placeholder="e.g. NAMASTE, INDIA, FRIEND"
                    maxLength={20}
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3.5 text-lg font-bold tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
                  />
                  <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                    <span>{typedText.length} letters</span>
                    <div className="flex gap-1">
                      {['HELLO', 'SIGN', 'INDIA', 'FRIEND', 'WATER'].map(quick => (
                        <button
                          key={quick}
                          onClick={() => {
                            setTypedText(quick)
                            handleSpeak(quick)
                          }}
                          className="px-2 py-0.5 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition font-medium"
                        >
                          {quick}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Alphabet Visual Pills */}
                <div className="rounded-2xl border border-border bg-muted/40 p-4">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                    Currently Fingerspelling Sequence
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {typedText.split('').map((char, index) => (
                      <span
                        key={index}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary font-bold text-sm border border-primary/30 shadow-sm"
                      >
                        {char}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Info & Next Steps */}
          <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/5 via-secondary/5 to-transparent p-6">
            <h4 className="font-display font-semibold text-base mb-1">
              Want to practice reading or signing yourself?
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4">
              Explore the official ISL references and try experimental camera pose exercises.
            </p>
            <Link
              to="/learn"
              className="inline-flex items-center gap-2 rounded-xl bg-foreground text-background px-4 py-2.5 text-xs font-semibold hover:opacity-90 transition"
            >
              Open Practice Studio
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
