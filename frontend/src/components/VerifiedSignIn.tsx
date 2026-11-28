import { useEffect, useRef, useState } from 'react'
import { supabase, authCallback, authCallbackError } from '../lib/supabase'
import { accountRequest, flushAccountSaves } from '../lib/account'

function authMessage(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unable to sign in. Please try again.'
  if (/error sending.*email/i.test(message)) return 'We couldn’t send your verification email. The email delivery service needs attention. Your account has not been signed in. Please try again once delivery is restored.'
  if (/expired|invalid.*token|otp.*invalid/i.test(message)) return 'That code is invalid or has expired. Check the latest email, or request a new code.'
  return message
}

export default function VerifiedSignIn() {
  const [address,setAddress] = useState(''), [code,setCode] = useState('')
  const [sent,setSent] = useState(false), [busy,setBusy] = useState(false)
  const [error,setError] = useState(authCallbackError || ''), [notice,setNotice] = useState('')
  const [providers,setProviders] = useState<Record<string,boolean>>({})
  const [cooldown,setCooldown] = useState(0)
  const inFlight = useRef(false)
  const verifiedToken = useRef<string | null>(null)
  const codeInput = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (!supabase) return
    const controller = new AbortController()
    fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/settings`,{headers:{apikey:import.meta.env.VITE_SUPABASE_ANON_KEY},signal:controller.signal})
      .then(async response => { if (!response.ok) return; const data = await response.json(); setProviders(data.external || {}) })
      .catch(()=>{})
    return ()=>controller.abort()
  },[])
  useEffect(()=>{if(!cooldown)return;const timer=setTimeout(()=>setCooldown(value=>value-1),1000);return()=>clearTimeout(timer)},[cooldown])
  useEffect(()=>{if(sent)codeInput.current?.focus()},[sent])
  async function finish(token:string) {
    if (!await flushAccountSaves()) throw new Error('Your previous changes are still saving. Please try again.')
    const account = await accountRequest('/supabase',{method:'POST',body:JSON.stringify({access_token:token})})
    sessionStorage.removeItem('signbridge-owner-session')
    sessionStorage.setItem('signbridge-account',JSON.stringify(account))
    window.location.assign('/')
  }
  // Only exchange an existing Supabase session during an actual OAuth callback.
  // Visiting this page otherwise always starts with email verification.
  useEffect(()=>{
    if(!supabase || !authCallback) return
    let active = true
    void supabase.auth.getSession().then(async ({data,error})=>{
      if(!active)return
      if(error)throw error
      if(data.session)await finish(data.session.access_token)
      else throw new Error('Google sign-in did not complete. Please try again.')
    }).catch(e=>{if(active)setError(authMessage(e))})
    return ()=>{active=false}
  },[])
  async function run(action:()=>Promise<void>) {
    if(inFlight.current)return
    inFlight.current=true;setBusy(true);setError('');setNotice('')
    try {await action()} catch(e) {setError(authMessage(e))} finally {inFlight.current=false;setBusy(false)}
  }
  async function sendCode() {
    if(!supabase)throw new Error('Email sign-in is not configured. Please contact the site owner.')
    if(cooldown>0)return
    const email = address.trim().toLowerCase()
    const domain = email.split('@')[1]
    const corrections: Record<string,string> = {'gamil.com':'gmail.com','gmial.com':'gmail.com','gmail.con':'gmail.com','icloud.con':'icloud.com'}
    if(corrections[domain]) throw new Error(`Check your email address: did you mean ${corrections[domain]}? Correct it before continuing.`)
    const {error}=await supabase.auth.signInWithOtp({email,options:{shouldCreateUser:true,emailRedirectTo:window.location.origin+'/login'}})
    if(error)throw error
    verifiedToken.current=null
    setAddress(email);setCode('');setSent(true);setCooldown(60)
    setNotice('Email requested. Delivery may take a moment. Check your inbox and spam folder, and use the most recent code.')
  }
  async function verifyCode() {
    if(!supabase)throw new Error('Email sign-in is not configured.')
    if(verifiedToken.current) { await finish(verifiedToken.current); return }
    const {data,error}=await supabase.auth.verifyOtp({email:address,token:code.trim(),type:'email'})
    if(error)throw error
    if(!data.session)throw new Error('Verification did not complete. Please request a new code.')
    verifiedToken.current=data.session.access_token
    await finish(data.session.access_token)
  }
  return <section aria-labelledby="signin-heading">
    <p className="eyebrow mb-3">{sent ? 'Step 2 of 2 · Verify' : 'Step 1 of 2 · Your email'}</p>
    <h2 id="signin-heading">{sent ? 'Check your email' : 'Welcome to SignBridge'}</h2>
    <p className="mt-3 text-muted-foreground">{sent ? `Enter the verification code sent to ${address}.` : 'Sign in or create your account with your email. Verify your code to open your personal workspace—no password needed.'}</p>
    <form className="mt-7 space-y-5" onSubmit={e=>{e.preventDefault();void run(sent ? verifyCode : sendCode)}} aria-busy={busy}>
      {!sent ? <label className="block font-medium" htmlFor="signin-email">Email address<input id="signin-email" className="mt-2 w-full rounded-xl border border-border bg-background p-3" required type="email" autoComplete="email" maxLength={254} disabled={busy} value={address} onChange={e=>setAddress(e.target.value)}/></label> : <label className="block font-medium" htmlFor="signin-code">Verification code<input ref={codeInput} id="signin-code" className="mt-2 w-full rounded-xl border border-border bg-background p-3 text-2xl tracking-widest" required inputMode="numeric" pattern="[0-9]{6,10}" minLength={6} maxLength={10} autoComplete="one-time-code" disabled={busy} value={code} onChange={e=>setCode(e.target.value.replace(/\s/g,''))} aria-describedby="signin-feedback"/></label>}
      {error && <p id="signin-feedback" role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-destructive">{error}</p>}
      {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
      {!supabase && <p role="alert">Email sign-in is waiting for the site’s authentication configuration.</p>}
      <button className="action-primary w-full" disabled={!supabase||busy||(!sent&&cooldown>0)}>{busy ? (sent?'Verifying…':'Sending code…') : sent ? 'Verify and continue' : cooldown>0 ? `Send again in ${cooldown}s` : 'Continue with email'}</button>
      {sent && <div className="flex flex-wrap gap-3"><button type="button" className="action-secondary" disabled={busy||cooldown>0} onClick={()=>void run(sendCode)}>{cooldown>0?`Resend in ${cooldown}s`:'Resend code'}</button><button type="button" className="min-h-11 px-3 text-primary underline" disabled={busy} onClick={()=>{verifiedToken.current=null;setSent(false);setCode('');setError('');setNotice('')}}>Change email</button></div>}
    </form>
    {!sent && ['google','apple','facebook'].some(provider=>providers[provider]) && <div className="mt-6 border-t border-border pt-5"><p className="mb-3 text-sm text-muted-foreground">Or use your existing account</p><div className="flex flex-wrap gap-2">{(['google','apple','facebook'] as const).filter(provider=>providers[provider]).map(provider=><button type="button" className="action-secondary capitalize" key={provider} disabled={busy} onClick={()=>void run(async()=>{const {error}=await supabase!.auth.signInWithOAuth({provider,options:{redirectTo:window.location.origin+'/login'}});if(error)throw error})}>{provider}</button>)}</div></div>}
  </section>
}
