import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Camera, Check, Hand, HeartPulse, Languages, LockKeyhole, MessageSquare, Mic, ShieldCheck, Volume2 } from 'lucide-react'
import ExperiencePreview from '../components/ExperiencePreview'
import BridgeMark from '../components/BridgeMark'
import { speakText, stopSpeech } from '../lib/speech'

const greetings = [
  { name: 'Kannada', code: 'kn-IN', text: 'ನಮಸ್ಕಾರ', pronunciation: 'Namaskara' },
  { name: 'Tamil', code: 'ta-IN', text: 'வணக்கம்', pronunciation: 'Vanakkam' },
  { name: 'Telugu', code: 'te-IN', text: 'నమస్కారం', pronunciation: 'Namaskaram' },
  { name: 'Hindi', code: 'hi-IN', text: 'नमस्ते', pronunciation: 'Namaste' },
  { name: 'English', code: 'en-IN', text: 'Hello', pronunciation: 'Hello' },
]

export default function Landing() {
  const [motionPaused, setMotionPaused] = useState(false)
  const [selected, setSelected] = useState(0)
  const [voiceStatus, setVoiceStatus] = useState('Choose a language. Hear a greeting.')
  const [playing, setPlaying] = useState(false)
  const greeting = greetings[selected]
  useEffect(() => () => stopSpeech(), [])
  const preview = () => {
    if (playing) { stopSpeech(); setPlaying(false); setVoiceStatus('Preview stopped.'); return }
    setPlaying(true)
    setVoiceStatus('Preparing audio…')
    speakText(greeting.text, greeting.code, 1, {
      translate: false,
      onStart: () => setVoiceStatus(`Playing in ${greeting.name}`),
      onEnd: () => { setPlaying(false); setVoiceStatus('Listen again or try another language.') },
      onError: message => { setPlaying(false); setVoiceStatus(message) },
    })
  }
  return (
    <div className={`welcome-page immersive-welcome ${motionPaused ? 'motion-paused' : ''}`}>
      <div className="aurora-scene" aria-hidden="true"><i /><i /><i /></div>
      <section className="welcome-hero page-width" aria-labelledby="welcome-title">
        <div className="welcome-copy">
          <p className="eyebrow"><span className="eyebrow-line" /> SIGN. SPEAK. CONNECT.</p>
          <h1 id="welcome-title">Different ways.<br /><span>One conversation.</span></h1>
          <p className="welcome-intro">A shared space for signing, speaking, and understanding. Turn supported signs into words, read spoken replies, and learn something new—together.</p>
          <div className="welcome-actions">
            <Link className="action-primary" to="/conversation"><Camera size={20} aria-hidden="true" /> Start a conversation</Link>
            <Link className="action-secondary" to="/learn"><BookOpen size={20} aria-hidden="true" /> Explore ISL</Link>
          </div>
          <button type="button" className="motion-control" aria-pressed={motionPaused} onClick={() => setMotionPaused(!motionPaused)}>{motionPaused ? 'Resume visual motion' : 'Pause visual motion'}</button>
          <div className="welcome-assurance"><span><Check size={16} /> Your personal workspace</span><span><ShieldCheck size={16} /> Camera processing on device</span></div>
        </div>
        <div className="connection-stage">
          <div className="bridge-sculpture" aria-hidden="true"><div className="sculpture-ring ring-a" /><div className="sculpture-ring ring-b" /><div className="sculpture-ring ring-c" /><div className="sculpture-core"><BridgeMark /></div><span className="sculpture-spark spark-a"/><span className="sculpture-spark spark-b"/></div>
          <div className="stage-orbit orbit-one" aria-hidden="true" /><div className="stage-orbit orbit-two" aria-hidden="true" />
          <div className="meaning-card"><span className="meaning-icon"><Hand size={27} aria-hidden="true" /></span><div><span className="small-label">A shared meaning</span><strong>Hello</strong></div><span className="example-tag">Example</span></div>
          <div className="language-preview">
            <div className="preview-heading"><span className="preview-icon"><Languages size={22} aria-hidden="true" /></span><div><strong>One greeting. Your language.</strong><p>Explore the voice experience</p></div></div>
            <div className="language-options" role="group" aria-label="Greeting language">{greetings.map((item, index) => <button key={item.code} type="button" aria-pressed={selected === index} onClick={() => { stopSpeech(); setPlaying(false); setSelected(index); setVoiceStatus('Choose Listen to hear this greeting.') }}>{item.name}</button>)}</div>
            <div className="greeting-output" key={greeting.code}><span className="small-label">{greeting.name} greeting</span><p lang={greeting.code}>{greeting.text}</p><span>{greeting.pronunciation}</span></div>
            <div className="preview-bottom"><div className={`voice-bars ${playing ? 'is-playing' : ''}`} aria-hidden="true">{[14,25,38,21,32,45,26,18,33,23,13].map((height,i) => <i key={i} style={{height,animationDelay:`${i * 70}ms`}} />)}</div><button type="button" className="listen-button" onClick={preview}><Volume2 size={18} aria-hidden="true" />{playing ? 'Stop' : 'Listen'}</button></div>
            <p className="preview-status" role="status">{voiceStatus}</p>
          </div>
          <div className="reply-note"><MessageSquare size={20} aria-hidden="true" /><span>And a reply you can <strong>read.</strong></span></div>
        </div>
      </section>
      <section className="capability-strip" aria-label="Ways to connect"><div className="page-width"><span><Hand /> Sign to words</span><span><Mic /> Speech to captions</span><span><Languages /> Five output languages</span><span><BookOpen /> Learn at your pace</span></div></section>
      <ExperiencePreview />
      <section className="page-width discover-section" aria-labelledby="discover-title">
        <div className="section-heading"><div><p className="eyebrow">Made for everyday moments</p><h2 id="discover-title">Your next conversation<br />starts here.</h2></div><p>At home, in a classroom, or out in the world.<br />Choose the tools that fit your moment.</p></div>
        <div className="feature-grid">
          <Link to="/conversation" className="feature-tile tile-conversation"><div className="tile-top"><span className="tile-icon"><Camera /></span><span className="tile-category">Connect</span></div><h3>Make room for<br />both sides.</h3><p>Use the camera with published vocabulary, hear accepted signs aloud, and read spoken replies.</p><div className="conversation-illustration" aria-hidden="true"><span>I’d like some water.</span><span>Of course. Here you go.</span></div><span className="tile-link">Open conversation studio</span></Link>
          <Link to="/learn" className="feature-tile tile-learn"><div className="tile-top"><span className="tile-icon"><BookOpen /></span><span className="tile-category">Discover</span></div><h3>A new way<br />to say something.</h3><p>Explore alphabet and number references. Learn at a comfortable pace with visual guidance.</p><div className="alphabet-illustration" aria-hidden="true"><span>A</span><span>B</span><span>C</span></div><span className="tile-link">Start learning ISL</span></Link>
          <Link to="/accessibility" className="feature-tile tile-emergency"><div className="tile-top"><span className="tile-icon"><HeartPulse /></span><span className="tile-category">Be understood</span></div><h3>Clear words.<br />When they matter.</h3><p>Large, readable communication cards for medical needs, travel, and everyday assistance.</p><div className="help-illustration" aria-hidden="true"><HeartPulse size={27} /><span>I need help.</span></div><span className="tile-link">Open communication boards</span></Link>
        </div>
      </section>
      <section className="page-width approach-section" aria-labelledby="approach-title"><div><p className="eyebrow">A bridge, built thoughtfully</p><h2 id="approach-title">Technology should<br />make space for people.</h2><p className="approach-intro">Simple to start. Clear about what it can do. Designed to keep the conversation in your hands.</p><Link className="text-link" to="/research">Read about privacy and model limits</Link></div><div className="principle-list">{[
        {icon:Camera,title:'You choose when to start',text:'Open the studio and enable your camera when you’re ready. Recognition uses published signs and your saved family signs.'},
        {icon:Languages,title:'Meaning, in your language',text:'Choose English, Kannada, Tamil, Telugu, or Hindi. Online translation handles new words when enabled; translations can need correction.'},
        {icon:LockKeyhole,title:'A place for learning. A place for training.',text:'Your account keeps personal progress separate. Owner credentials open the protected shared-vocabulary training studio.'},
      ].map(({icon:Icon,title,text}) => <article key={title}><span><Icon size={22} /></span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div></section>
      <section className="page-width"><div className="closing-card"><div><p className="eyebrow">Start with a hello</p><h2>Meet in the middle.</h2><p>Bring your words. We’ll help make the connection.</p></div><Link className="action-primary" to="/conversation"><Camera size={20} /> Open live studio</Link></div></section>
    </div>
  )
}
