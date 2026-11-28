import LocalizedNavLabel from './LocalizedNavLabel'
import { useState } from 'react'
import { accountStorage } from '../lib/account'
function load(letters: string[], key: string): Record<string, number> {
 try { const data=JSON.parse(accountStorage.getItem(key)||'{}'); return Object.fromEntries(letters.map(letter=>[letter,typeof data?.[letter]==='number'?Math.max(0,data[letter]):0])) } catch {return {}}
}
export default function AlphabetPractice({kind = 'alphabet'}: {kind?: 'alphabet' | 'numbers'}) {
 const letters = (kind === 'alphabet' ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : '0123456789').split('')
 const key = `signbridge-${kind === 'alphabet' ? 'alphabet' : 'number'}-practice`
 const unit = kind === 'alphabet' ? 'letter' : 'number'
 const [progress,setProgress]=useState(() => load(letters,key))
 const [index,setIndex]=useState(0),[revealed,setRevealed]=useState(false)
 const [notice,setNotice]=useState('')
 const letter=letters[index]
 const completed=letters.filter(value=>(progress[value]||0)>0).length
 function next(remembered:boolean) {
  const updated={...progress,[letter]:remembered?(progress[letter]||0)+1:0}
  setProgress(updated);accountStorage.setItem(key,JSON.stringify(updated))
  setNotice(remembered?`${letter} marked as recalled. This is a self-check, not a camera assessment.`:`${letter} stays in your review list.`)
  const candidates=letters.filter(value=>value!==letter).sort((a,b)=>(updated[a]||0)-(updated[b]||0))
  setIndex(letters.indexOf(candidates[0]));setRevealed(false)
 }
 return <section className="mt-6 rounded-3xl border border-border bg-card p-5 sm:p-7" aria-labelledby="alphabet-practice-title">
  <p className="eyebrow">Recall practice · saved to your account</p><h2 id="alphabet-practice-title" className="mt-2 text-2xl font-bold">Try it, then check the reference</h2>
  <p className="mt-2 text-muted-foreground">Make the sign from memory before revealing the official reference. Rate your own recall; this does not certify signing accuracy.</p>
  <label className="mt-4 block">Choose a {unit} <select className="ml-3 rounded-xl border border-border bg-background p-3" value={letter} onChange={e=>{setIndex(letters.indexOf(e.target.value));setRevealed(false);setNotice('')}}>{letters.map(value=><option key={value}>{value}</option>)}</select></label>
  <p className="mt-4 text-sm">{completed} of {letters.length} {unit}s recalled at least once</p><progress aria-label={`${unit}s recalled`} className="mt-2 w-full" max={letters.length} value={completed}/>
  <div className="my-5 flex min-h-64 items-center justify-center rounded-2xl bg-background p-4">{revealed?<img className="max-h-96 w-full object-contain" src={`/lessons/${kind}/${letter}.png`} alt={`Official ISLRTC reference for ${unit} ${letter}`}/>:<p className="text-center"><span className="block text-sm text-muted-foreground">How do you sign</span><strong className="text-8xl">{letter}</strong></p>}</div>
  {revealed?<div className="flex flex-wrap gap-3"><button className="action-primary" onClick={()=>next(true)}>I recalled it · next</button><button className="action-secondary" onClick={()=>next(false)}>Needs practice · next</button></div>:<button className="action-primary" onClick={()=>setRevealed(true)}><LocalizedNavLabel label="Show reference"/></button>}
  <p role="status" className="mt-3 text-sm text-muted-foreground">{notice}</p>
 </section>
}
