import VerifiedSignIn from '../components/VerifiedSignIn'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import BridgeMark from '../components/BridgeMark'
import { accountRequest, flushAccountSaves, type Account } from '../lib/account'

export default function Login() {
  const [owner, setOwner] = useState(false)
  const [username, setUsername] = useState(''), [password, setPassword] = useState('')
  const [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('')
    try {
      if (!await flushAccountSaves()) throw new Error('Your previous changes are still saving. Please try again.')
      const account: Account = await accountRequest('/login', {method:'POST', body:JSON.stringify({username,password})})
      if (account.role !== 'owner') throw new Error('Use email verification to access your personal account.')
      sessionStorage.setItem('signbridge-account', JSON.stringify(account))
      sessionStorage.setItem('signbridge-owner-session', account.access_token)
      navigate('/owner/trainer', {replace:true})
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to sign in.') }
    finally { setBusy(false) }
  }
  return <main className="account-entrance">
    <section className="account-intro"><BridgeMark className="h-20 w-20"/><p className="eyebrow mt-6">SignBridge · your space to connect</p><h1>Your words.<br/>Your progress.<br/><span>Your connection.</span></h1><p>Keep your favorites, learning progress, preferences, and personal signs together in your own account.</p><div className="mt-8 space-y-3"><p>Shared vocabulary, trained by the owner.</p><p>Personal learning, saved just for you.</p></div></section>
    <section className="account-form"><BridgeMark className="h-12 w-12 mb-5"/>
      {owner ? <><h2>Owner sign-in</h2><p className="mt-3 text-muted-foreground">Open the vocabulary training studio.</p><form className="mt-7 space-y-5" onSubmit={submit}><label className="block font-medium">Owner ID<input className="mt-2 w-full rounded-xl border border-border bg-background p-3" autoComplete="username" required value={username} onChange={e=>setUsername(e.target.value)}/></label><label className="block font-medium">Password<input className="mt-2 w-full rounded-xl border border-border bg-background p-3" type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>{error && <p role="alert" className="text-destructive">{error}</p>}<button disabled={busy} className="action-primary w-full">{busy ? 'Signing in…' : 'Open training studio'}</button></form></> : <VerifiedSignIn/>}
      <button type="button" disabled={busy} className="mt-8 min-h-11 text-sm text-primary underline underline-offset-4" onClick={()=>{setOwner(!owner);setError('');setPassword('')}}>{owner ? 'Back to email sign-in' : 'Owner portal'}</button>
    </section>
  </main>
}
