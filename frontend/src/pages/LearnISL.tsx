import { accountStorage } from '../lib/account'
import OfficialLesson from '../components/OfficialLesson'
import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Camera,
  CheckCircle2,
  Sparkles,
  Trophy,
  Flame,
  Volume2,
  ArrowRight,
  Award,
  Video,
  VideoOff,
  ChevronRight,
  HelpCircle,
} from 'lucide-react'
import { useCamera } from '../hooks/useCamera'
import { useMediaPipe } from '../hooks/useMediaPipe'
import HandOverlay from '../components/HandOverlay'
import { speakText } from '../lib/speech'

interface PracticeSign {
  id: string
  label: string
  category: 'alphabet' | 'number' | 'phrase'
  hindi: string
  tip: string
  targetKey: string // Matches gesture-classifier or general label
}

const PRACTICE_SIGNS: PracticeSign[] = [
  {
    id: 'namaste',
    label: 'Namaste',
    category: 'phrase',
    hindi: 'नमस्ते',
    tip: 'Bring both hands together in front of your chest with palms touching.',
    targetKey: 'namaste',
  },
  {
    id: 'good',
    label: 'Good / Yes',
    category: 'phrase',
    hindi: 'बहुत अच्छा / हाँ',
    tip: 'Curl all fingers tightly into a fist and extend your thumb upwards firmly.',
    targetKey: 'good',
  },
  {
    id: 'love',
    label: 'I Love You',
    category: 'phrase',
    hindi: 'आई लव यू',
    tip: 'Extend your thumb, index finger, and pinky finger simultaneously. Keep middle and ring curled.',
    targetKey: 'love',
  },
  {
    id: 'peace',
    label: 'Peace / Victory',
    category: 'phrase',
    hindi: 'शांति / विजय',
    tip: 'Form a V-shape with your index and middle fingers spread apart.',
    targetKey: 'peace',
  },
  {
    id: 'hello',
    label: 'Hello / Open Palm',
    category: 'phrase',
    hindi: 'नमस्ते / सुनिए',
    tip: 'Open your hand with all five fingers spread facing forward towards the camera.',
    targetKey: 'hello',
  },
  {
    id: 'letter-l',
    label: 'Letter L',
    category: 'alphabet',
    hindi: 'अक्षर L',
    tip: 'Form an L-shape with your thumb and index finger extended at 90 degrees.',
    targetKey: 'letter l',
  },
  {
    id: 'letter-y',
    label: 'Letter Y',
    category: 'alphabet',
    hindi: 'अक्षर Y',
    tip: 'Extend only your thumb and pinky finger outward, with the three middle fingers curled.',
    targetKey: 'letter y',
  },
  {
    id: 'letter-w',
    label: 'Letter W',
    category: 'alphabet',
    hindi: 'अक्षर W',
    tip: 'Extend index, middle, and ring fingers upwards like a W.',
    targetKey: 'letter w',
  },
  {
    id: 'num-1',
    label: 'Number 1 / Point',
    category: 'number',
    hindi: 'संख्या १',
    tip: 'Point your index finger straight up while keeping other fingers tucked into a fist.',
    targetKey: 'number 1',
  },
  {
    id: 'letter-b',
    label: 'Letter B / Four',
    category: 'alphabet',
    hindi: 'अक्षर B',
    tip: 'Extend four fingers straight up together, with thumb tucked across your palm.',
    targetKey: 'letter b',
  },
]

export default function LearnISL() {
  const [activeTab, setActiveTab] = useState<'practice' | 'alphabet' | 'numbers' | 'phrases'>('alphabet')
  const [currentSignIndex, setCurrentSignIndex] = useState(0)
  const [masteredIds, setMasteredIds] = useState<string[]>(() => {
    try {
      return JSON.parse(accountStorage.getItem('signbridge-mastered-signs') || '[]')
    } catch {
      return []
    }
  })
  const [xp, setXp] = useState(() => Number(accountStorage.getItem('signbridge-xp') || '0'))
  const [showCelebration, setShowCelebration] = useState(false)

  const { isActive, start, stop, videoRef } = useCamera()
  const detector = useMediaPipe(videoRef, isActive)

  const currentSign = PRACTICE_SIGNS[currentSignIndex] || PRACTICE_SIGNS[0]
  const accuracy = useMemo(() => {
    if (!isActive || !detector.rawHands.length) return 0
    const geom = detector.geometricPrediction
    if (!geom) return 15
    const predicted = geom.label.toLowerCase()
    const target = currentSign.targetKey.toLowerCase()
    return predicted.includes(target) || target.includes(predicted.split('/')[0].trim())
      ? Math.round(geom.confidence * 100)
      : 20
  }, [currentSign.targetKey, detector.geometricPrediction, detector.rawHands.length, isActive])
  const holdTimerRef = useRef<number>(0)

  // Real-time gesture matching
  useEffect(() => {
    if (!isActive || !detector.rawHands.length) {
      holdTimerRef.current = 0
      return
    }

    // If matching >= 80% for 1 second, celebrate and mark mastered
    if (accuracy >= 80) {
      holdTimerRef.current += 1
      if (holdTimerRef.current >= 12) {
        // approx 1 second of stable recognition
        if (!masteredIds.includes(currentSign.id)) {
          const nextMastered = [...masteredIds, currentSign.id]
          setMasteredIds(nextMastered)
          accountStorage.setItem('signbridge-mastered-signs', JSON.stringify(nextMastered))

          const nextXp = xp + 50
          setXp(nextXp)
          accountStorage.setItem('signbridge-xp', String(nextXp))

          setShowCelebration(true)
          speakText(`Practice complete: ${currentSign.label}`, 'en-IN', 1.0)

          setTimeout(() => {
            setShowCelebration(false)
            if (currentSignIndex < PRACTICE_SIGNS.length - 1) {
              setCurrentSignIndex(prev => prev + 1)
            }
          }, 2400)
        }
      }
    } else {
      holdTimerRef.current = 0
    }
  }, [accuracy, detector.rawHands, isActive, currentSign, masteredIds, currentSignIndex, xp])

  const handleSelectSign = (index: number) => {
    setCurrentSignIndex(index)
    holdTimerRef.current = 0
    speakText(PRACTICE_SIGNS[index].label.split('/')[0], 'en-IN', 1.0)
  }

  return (
    <div className="prism-page container max-w-7xl py-8">
      {/* Header & Stats Banner */}
      <div className="prism-page-heading mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary mb-3">
            <Trophy className="h-3.5 w-3.5" />
            <span>ISL Learning Studio</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
            Learn Indian Sign Language
          </h1>
          <p className="mt-1 text-muted-foreground text-sm sm:text-base max-w-2xl">
            Interactive visual guides, fingerspelling dictionaries, and live camera-powered AI practice
            with experimental pose feedback. Pose scores are not validated measures of ISL fluency.
          </p>
        </div>

        {/* Gamification Badges */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2.5 shadow-sm">
            <Flame className="h-5 w-5 text-amber-500 animate-pulse" />
            <div>
              <p className="text-xs text-muted-foreground font-medium">Practice mode</p>
              <p className="text-sm font-bold text-foreground">At your pace</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2.5 shadow-sm">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground font-medium">Earned XP</p>
              <p className="text-sm font-bold text-primary">{xp} XP</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2.5 shadow-sm">
            <Award className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-xs text-muted-foreground font-medium">Practised</p>
              <p className="text-sm font-bold text-emerald-500">
                {masteredIds.length}/{PRACTICE_SIGNS.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex border-b border-border overflow-x-auto gap-4">
        {[
          { id: 'practice', label: 'Camera Practice Studio' },
          { id: 'alphabet', label: 'ISL Alphabet (A-Z)' },
          { id: 'numbers', label: 'Numbers (0–9)' },
          { id: 'phrases', label: 'Conversational Signs' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 text-sm font-semibold transition border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Live Camera Practice Studio */}
      {activeTab === 'practice' && (
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Camera Stage */}
          <div className="flex flex-col rounded-3xl border border-border bg-card overflow-hidden shadow-xl">
            <div className="flex items-center justify-between border-b border-border bg-muted/40 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-3 w-3 relative">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      isActive ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  ></span>
                  <span
                    className={`relative inline-flex rounded-full h-3 w-3 ${
                      isActive ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  ></span>
                </span>
                <span className="text-sm font-bold">
                  {isActive ? 'Camera Tracking Active' : 'Camera Off'}
                </span>
              </div>

              {isActive ? (
                <button
                  onClick={stop}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/20 transition"
                >
                  <VideoOff className="h-3.5 w-3.5" />
                  Turn Off
                </button>
              ) : (
                <button
                  onClick={() => start('user')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition shadow-sm"
                >
                  <Video className="h-3.5 w-3.5" />
                  Start Camera
                </button>
              )}
            </div>

            {/* Video Feed with Overlay */}
            <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                className="h-full w-full object-cover transform -scale-x-100"
                playsInline
                muted
              />

              {isActive && (
                <HandOverlay
                  hands={detector.rawHands}
                  prediction={detector.geometricPrediction}
                  activeSign={detector.geometricPrediction?.label}
                  confidence={detector.geometricPrediction?.confidence}
                  mirrored={true}
                />
              )}

              {/* Not Started Overlay */}
              {!isActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 p-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4 shadow-inner">
                    <Camera className="h-8 w-8" />
                  </div>
                  <h3 className="font-display text-xl font-bold mb-2">Practice With Your Webcam</h3>
                  <p className="max-w-md text-xs sm:text-sm text-muted-foreground mb-6">
                    Turn on your camera to see your hand skeleton tracked in real-time. Practice the target
                    pose and receive experimental shape feedback.
                  </p>
                  <button
                    onClick={() => start('user')}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-95 shadow-lg transition"
                  >
                    <Video className="h-4 w-4" />
                    Enable Camera & Begin
                  </button>
                </div>
              )}

              {/* Celebration Animation Banner */}
              {showCelebration && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-950/85 backdrop-blur-sm z-30 p-6 text-center animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 text-white mb-3 shadow-lg shadow-emerald-500/50">
                    <CheckCircle2 className="h-10 w-10 animate-bounce" />
                  </div>
                  <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white mb-1">
                    Practised: {currentSign.label}
                  </h2>
                  <p className="text-emerald-200 text-sm font-medium mb-3">+50 XP Awarded</p>
                  <span className="text-xs text-emerald-300">Proceeding to next sign...</span>
                </div>
              )}
            </div>

            {/* Target Match Accuracy Meter */}
            <div className="border-t border-border bg-card p-5">
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <span className="text-muted-foreground">Match with Target: {currentSign.label}</span>
                <span className={accuracy >= 80 ? 'text-emerald-500' : 'text-primary'}>
                  {accuracy}% pose match
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    accuracy >= 80
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      : 'bg-gradient-to-r from-primary to-secondary'
                  }`}
                  style={{ width: `${accuracy}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Hold the pose above 80% for 1 second to master this sign!
              </p>
            </div>
          </div>

          {/* Right Column: Sign Instructions & Practice Playlist */}
          <div className="flex flex-col gap-6">
            {/* Current Target Card */}
            <div className="rounded-3xl border border-primary/30 bg-primary/5 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary uppercase">
                  Target Sign #{currentSignIndex + 1}
                </span>
                <button
                  onClick={() => speakText(currentSign.label, 'en-IN', 1.0)}
                  className="rounded-full bg-background p-2 border border-border text-muted-foreground hover:text-primary transition"
                  title="Pronounce"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </div>

              <h2 className="font-display text-2xl font-bold text-foreground mb-1">
                {currentSign.label}
              </h2>
              <p className="text-sm font-semibold text-secondary mb-3">{currentSign.hindi}</p>

              <div className="rounded-2xl border border-border bg-card p-4 mb-4">
                <div className="flex items-start gap-2.5">
                  <HelpCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {currentSign.tip}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  disabled={currentSignIndex === 0}
                  onClick={() => handleSelectSign(currentSignIndex - 1)}
                  className="flex-1 rounded-xl border border-border bg-card py-2 text-xs font-semibold hover:bg-muted disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={currentSignIndex === PRACTICE_SIGNS.length - 1}
                  onClick={() => handleSelectSign(currentSignIndex + 1)}
                  className="flex-1 rounded-xl bg-primary text-primary-foreground py-2 text-xs font-semibold hover:bg-primary/90 disabled:opacity-40"
                >
                  Next Sign
                </button>
              </div>
            </div>

            {/* Practice Playlist Queue */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h3 className="font-display text-lg font-bold mb-3">Lesson Signs</h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {PRACTICE_SIGNS.map((item, idx) => {
                  const isCurrent = idx === currentSignIndex
                  const isMastered = masteredIds.includes(item.id)

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectSign(idx)}
                      className={`flex items-center justify-between w-full rounded-2xl p-3.5 border text-left transition ${
                        isCurrent
                          ? 'border-primary bg-primary/10 shadow-sm'
                          : 'border-border bg-background/50 hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                            isMastered
                              ? 'bg-emerald-500 text-white'
                              : isCurrent
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {isMastered ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                        </span>
                        <div>
                          <p className="text-sm font-semibold">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.hindi}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Alphabet Fingerspelling Chart */}
      {activeTab === 'alphabet' && <OfficialLesson key="alphabet" kind="alphabet" />}
      {activeTab === 'numbers' && <OfficialLesson key="numbers" kind="numbers" />}


      {/* Tab 4: Conversational Signs */}
      {activeTab === 'phrases' && (
        <div>
          <div className="mb-6">
            <h2 className="font-display text-2xl font-bold">Everyday Conversational Signs</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Essential expressions for daily communication, greetings, and emergency needs.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                title: 'Namaste / Greeting',
                hindi: 'नमस्ते',
                desc: 'Joined palms held in front of chest with a polite nod',
                category: 'Greeting',
              },
              {
                title: 'Thank You',
                hindi: 'धन्यवाद',
                desc: 'Flat hand moving from chin forward towards partner',
                category: 'Polite',
              },
              {
                title: 'Please',
                hindi: 'कृपया',
                desc: 'Flat open palm rubbing circular motion over chest',
                category: 'Polite',
              },
              {
                title: 'Help / Emergency',
                hindi: 'मदद',
                desc: 'Fist resting on flat upward-facing palm',
                category: 'Emergency',
              },
              {
                title: 'Water',
                hindi: 'पानी',
                desc: 'W-shaped fingers touching the lips',
                category: 'Daily',
              },
              {
                title: 'Food / Hungry',
                hindi: 'खाना',
                desc: 'Fingertips brought together and moved towards mouth',
                category: 'Daily',
              },
              {
                title: 'Yes / Agree',
                hindi: 'हाँ',
                desc: 'Thumbs up or fist nodding up and down',
                category: 'Response',
              },
              {
                title: 'No / Disagree',
                hindi: 'नहीं',
                desc: 'Index and middle fingers snapping against thumb',
                category: 'Response',
              },
              {
                title: 'I Love You',
                hindi: 'आई लव यू',
                desc: 'Thumb, index, and pinky extended upward',
                category: 'Expression',
              },
            ].map(item => (
              <div
                key={item.title}
                className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-md transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                      {item.category}
                    </span>
                    <button
                      onClick={() => speakText(item.title, 'en-IN', 1.0)}
                      className="text-muted-foreground hover:text-primary transition"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                  </div>
                  <h3 className="font-display text-lg font-bold text-foreground">{item.title}</h3>
                  <p className="text-xs font-semibold text-secondary mb-2">{item.hindi}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>

                <button
                  onClick={() => {
                    setActiveTab('practice')
                    const matching = PRACTICE_SIGNS.findIndex(s =>
                      s.label.toLowerCase().includes(item.title.toLowerCase().split('/')[0].trim())
                    )
                    if (matching !== -1) setCurrentSignIndex(matching)
                  }}
                  className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl border border-border py-2 text-xs font-semibold text-primary hover:bg-primary/10 transition"
                >
                  Practice in Camera
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
