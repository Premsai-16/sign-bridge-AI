import { translateAutomatically } from '../lib/auto-translate'
import { OUTPUT_LANGUAGES } from '../lib/languages'
import { accountStorage } from '../lib/account'
import { useEffect, useState } from 'react'
import {
  Hospital,
  Bus,
  ShieldAlert,
  Building2,
  Volume2,
  Maximize2,
  X,
  Copy,
  Check,
  HeartPulse,
} from 'lucide-react'
import { speakText } from '../lib/speech'

interface PhraseCard {
  id: string
  text: string
  hindi: string
  urgent?: boolean
}

const SCENARIOS = [
  {
    id: 'healthcare',
    name: 'Hospital & Healthcare',
    desc: 'Medical alerts, symptom descriptions, and doctor communication',
    icon: Hospital,
    color: 'emerald',
    phrases: [
      { id: 'h1', text: 'I am deaf / hard of hearing. Please write things down.', hindi: 'मैं सुन नहीं सकता, कृपया लिखकर बताएं।', urgent: false },
      { id: 'h2', text: 'I need immediate emergency medical help!', hindi: 'मुझे तुरंत आपातकालीन चिकित्सा सहायता चाहिए!', urgent: true },
      { id: 'h3', text: 'I am experiencing severe chest pain and difficulty breathing.', hindi: 'मुझे छाती में तेज दर्द और सांस लेने में तकलीफ है।', urgent: true },
      { id: 'h4', text: 'Please call a qualified sign language interpreter.', hindi: 'कृपया साइन लैंग्वेज अनुवादक को बुलाएं।', urgent: false },
      { id: 'h5', text: 'I have severe allergies to certain medications.', hindi: 'मुझे कुछ दवाओं से गंभीर एलर्जी है।', urgent: true },
      { id: 'h6', text: 'Where is the pharmacy / prescription counter?', hindi: 'दवाइयों की दुकान कहाँ है?', urgent: false },
    ],
  },
  {
    id: 'transport',
    name: 'Transport & Travel',
    desc: 'Train platforms, flight gates, bus navigation, and ticketing',
    icon: Bus,
    color: 'blue',
    phrases: [
      { id: 't1', text: 'Which platform does my train arrive on?', hindi: 'मेरी ट्रेन किस प्लेटफॉर्म पर आएगी?', urgent: false },
      { id: 't2', text: 'I need wheelchair and boarding assistance, please.', hindi: 'मुझे व्हीलचेयर और बोर्डिंग सहायता चाहिए।', urgent: false },
      { id: 't3', text: 'I have lost my baggage and travel tickets.', hindi: 'मेरा सामान और टिकट खो गया है।', urgent: true },
      { id: 't4', text: 'Please tell me when we arrive at my stop.', hindi: 'कृपया मुझे बताएं जब मेरा स्टॉप आ जाए।', urgent: false },
      { id: 't5', text: 'How much is the fare to the central station?', hindi: 'सेंट्रल स्टेशन का किराया कितना है?', urgent: false },
      { id: 't6', text: 'Can you please call a verified taxi for me?', hindi: 'क्या आप मेरे लिए टैक्सी बुला सकते हैं?', urgent: false },
    ],
  },
  {
    id: 'emergency',
    name: 'Police & Safety',
    desc: 'Urgent reports, distress signals, lost items, and crisis help',
    icon: ShieldAlert,
    color: 'red',
    phrases: [
      { id: 'e1', text: 'EMERGENCY! I need police help right now!', hindi: 'आपातकालीन! मुझे अभी पुलिस की मदद चाहिए!', urgent: true },
      { id: 'e2', text: 'An accident has occurred. People need an ambulance.', hindi: 'दुर्घटना हो गई है। एम्बुलेंस की आवश्यकता है।', urgent: true },
      { id: 'e3', text: 'I am feeling unsafe. Someone is following me.', hindi: 'मैं असुरक्षित महसूस कर रहा हूँ। कोई मेरा पीछा कर रहा है।', urgent: true },
      { id: 'e4', text: 'My wallet, phone, and identification have been stolen.', hindi: 'मेरा बटुआ, फोन और पहचान पत्र चोरी हो गए हैं।', urgent: true },
      { id: 'e5', text: 'I am lost and cannot locate my family or hotel.', hindi: 'मैं रास्ता भटक गया हूँ और अपने परिवार को नहीं ढूंढ पा रहा।', urgent: true },
      { id: 'e6', text: 'Please communicate by writing on this screen.', hindi: 'कृपया इस स्क्रीन पर लिखकर बात करें।', urgent: false },
    ],
  },
  {
    id: 'daily',
    name: 'Daily & Public Services',
    desc: 'Banking, retail, restaurants, and municipal counters',
    icon: Building2,
    color: 'amber',
    phrases: [
      { id: 'd1', text: 'Where is the nearest public restroom?', hindi: 'निकटतम शौचालय कहाँ है?', urgent: false },
      { id: 'd2', text: 'How much does this item cost?', hindi: 'इस वस्तु की कीमत कितनी है?', urgent: false },
      { id: 'd3', text: 'I want to deposit or withdraw cash from my bank account.', hindi: 'मुझे बैंक खाते से पैसे निकालने या जमा करने हैं।', urgent: false },
      { id: 'd4', text: 'Thank you very much for your patience and help!', hindi: 'आपके धैर्य और सहायता के लिए बहुत-बहुत धन्यवाद!', urgent: false },
      { id: 'd5', text: 'Could you please type your reply on my phone?', hindi: 'क्या आप अपना उत्तर मेरे फोन पर टाइप कर सकते हैं?', urgent: false },
      { id: 'd6', text: 'Do you accept digital UPI / card payments?', hindi: 'क्या आप यूपीआई या कार्ड भुगतान स्वीकार करते हैं?', urgent: false },
    ],
  },
]

export default function AccessibilityNetwork() {
  const [language,setLanguage] = useState(() => accountStorage.getItem('signbridge-output-language') || 'en-IN')
  const [translated,setTranslated] = useState<Record<string,string>>({})
  useEffect(() => { const update = () => setLanguage(accountStorage.getItem('signbridge-output-language') || 'en-IN'); window.addEventListener('signbridge-language',update); return () => window.removeEventListener('signbridge-language',update) }, [])
  const [selectedScenario, setSelectedScenario] = useState('healthcare')
  const [fullscreenPhrase, setFullscreenPhrase] = useState<PhraseCard | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [lastSpokenText, setLastSpokenText] = useState('')

  const activeData = SCENARIOS.find(s => s.id === selectedScenario) || SCENARIOS[0]

  useEffect(() => {
    let active = true
    setTranslated({})
    for (const phrase of activeData.phrases) {
      if (language === 'en-IN' || language === 'hi-IN') { setTranslated(previous => ({...previous,[phrase.id]:language === 'hi-IN' ? phrase.hindi : phrase.text})); continue }
      void translateAutomatically(phrase.text,language).then(text => { if(active) setTranslated(previous => ({...previous,[phrase.id]:text})) }).catch(() => {if(active) setTranslated(previous=>({...previous,[phrase.id]:'Translation unavailable. English remains above.'}))})
    }
    return () => {active=false}
  }, [language,selectedScenario])
  const handleSpeak = (phrase: PhraseCard) => {
    setLastSpokenText(phrase.text)
    speakText(phrase.text, language, 0.95)
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="prism-page container max-w-7xl py-8">
      {/* Header */}
      <div className="prism-page-heading mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary/15 px-3.5 py-1.5 text-xs font-semibold text-secondary mb-3">
            <HeartPulse className="h-3.5 w-3.5" />
            <span>Real-World Situational Accessibility Boards</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
            Accessibility Network
          </h1>
          <p className="mt-1 text-muted-foreground text-sm sm:text-base max-w-2xl">
            Pre-configured, high-visibility communication boards for hospitals, travel, emergencies,
            and daily interactions. Tap to speak aloud or present full-screen.
          </p>
        </div>
      </div>

      <label className="mb-5 block">Card language <select className="ml-3 rounded-xl border border-border bg-card p-3" value={language} onChange={event=>{setLanguage(event.target.value);accountStorage.setItem('signbridge-output-language',event.target.value);window.dispatchEvent(new Event('signbridge-language'))}}>{OUTPUT_LANGUAGES.map(item=><option key={item.code} value={item.code}>{item.name}</option>)}</select></label><p className="mb-5 text-sm text-muted-foreground">New translations use the online translation setting. Machine translations can need correction; the original English remains visible.</p>
      {/* Scenario Selector Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {SCENARIOS.map(scenario => {
          const Icon = scenario.icon
          const isSelected = selectedScenario === scenario.id

          return (
            <button
              key={scenario.id}
              onClick={() => setSelectedScenario(scenario.id)}
              className={`flex flex-col text-left rounded-3xl p-5 border transition-all duration-200 ${
                isSelected
                  ? 'border-primary bg-primary/10 shadow-md ring-2 ring-primary/20 scale-[1.02]'
                  : 'border-border bg-card hover:bg-muted hover:border-primary/30'
              }`}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl mb-4 transition ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-base font-bold text-foreground mb-1">
                {scenario.name}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2">{scenario.desc}</p>
            </button>
          )
        })}
      </div>

      {/* Selected Board Phrases */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-5 mb-6">
          <div>
            <h2 className="font-display text-2xl font-bold flex items-center gap-2.5">
              <activeData.icon className="h-6 w-6 text-primary" />
              {activeData.name} Communication Board
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Tap any card to announce aloud through speech synthesis or expand to full-screen display.
            </p>
          </div>
          {lastSpokenText && (
            <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary">
              <Volume2 className="h-4 w-4 shrink-0" />
              <span className="line-clamp-1 max-w-[200px]">Last spoken: {lastSpokenText}</span>
            </div>
          )}
        </div>

        {/* Phrases Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {activeData.phrases.map(phrase => (
            <div
              key={phrase.id}
              className={`flex flex-col justify-between rounded-2xl p-5 border transition duration-200 ${
                phrase.urgent
                  ? 'border-red-500/40 bg-red-500/5 hover:border-red-500'
                  : 'border-border bg-background/50 hover:border-primary/40 hover:shadow-md'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  {phrase.urgent ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-bold text-red-500">
                      URGENT
                    </span>
                  ) : (
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      Standard Phrase
                    </span>
                  )}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(phrase.text, phrase.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
                      title="Copy phrase"
                    >
                      {copiedId === phrase.id ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => setFullscreenPhrase(phrase)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
                      title="Present full-screen"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="font-display font-semibold text-base sm:text-lg text-foreground leading-snug mb-2">
                  {phrase.text}
                </p>
                <p className="text-xs sm:text-sm font-medium text-secondary">{translated[phrase.id] || 'Translating…'}</p>
              </div>

              <div className="mt-5 flex gap-2 pt-3 border-t border-border/60">
                <button
                  onClick={() => handleSpeak(phrase)}
                  className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition shadow-sm ${
                    phrase.urgent
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  }`}
                >
                  <Volume2 className="h-4 w-4" />
                  Speak Aloud
                </button>
                <button
                  onClick={() => setFullscreenPhrase(phrase)}
                  className="rounded-xl border border-border px-3 py-2.5 text-xs font-semibold hover:bg-muted transition"
                >
                  Show Screen
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full-Screen High-Contrast Show-to-Person Modal */}
      {fullscreenPhrase && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 p-6 sm:p-12 animate-in fade-in duration-200">
          <button
            onClick={() => setFullscreenPhrase(null)}
            className="absolute top-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="max-w-4xl text-center space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-1.5 text-sm font-extrabold text-black uppercase tracking-wider">
              {fullscreenPhrase.urgent ? '🚨 URGENT MESSAGE' : 'PLEASE READ THIS MESSAGE'}
            </span>

            <h2 className="font-display text-3xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight">
              "{fullscreenPhrase.text}"
            </h2>

            <p className="font-display text-2xl sm:text-4xl font-bold text-amber-300">
              {translated[fullscreenPhrase.id] || 'Translating…'}
            </p>

            <div className="pt-8 flex flex-wrap justify-center gap-4">
              <button
                onClick={() => handleSpeak(fullscreenPhrase)}
                className="inline-flex items-center gap-2 rounded-2xl bg-white text-black px-8 py-4 text-lg font-bold hover:bg-gray-200 transition shadow-xl"
              >
                <Volume2 className="h-6 w-6" />
                Speak Aloud Again
              </button>
              <button
                onClick={() => setFullscreenPhrase(null)}
                className="rounded-2xl border-2 border-white/40 text-white px-8 py-4 text-lg font-semibold hover:bg-white/10 transition"
              >
                Close Fullscreen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
