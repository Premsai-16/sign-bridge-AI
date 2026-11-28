import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { accountStorage, accountRequest, getAccount, loadAccountSaves } from '../lib/account'
export default function AccountGate() {
  const [status,setStatus] = useState<'loading'|'ready'|'error'>('loading')
  const location = useLocation()
  const account = getAccount()
  useEffect(() => { if(account?.role === 'user') void accountRequest('/me').then(loadAccountSaves).then(() => setStatus('ready')).catch(() => setStatus('error')) }, [account?.role, account?.access_token])
  if (!account) return <Navigate to="/login" replace />
  if (account.role === 'owner') return <Navigate to="/owner/trainer" replace />
  if(status === 'error') return <div className="page-width py-20"><h1>Your account couldn’t load</h1><p className="my-5">Check your connection or sign in again. Your saved data has not been replaced.</p><button className="action-primary" onClick={() => window.location.reload()}>Retry</button> <a href="/login" className="action-secondary">Sign in again</a></div>
  if(status === 'ready' && accountStorage.getItem('signbridge-onboarded') !== 'true' && location.pathname !== '/profile') return <Navigate to="/profile" replace />
  return status === 'ready' ? <Outlet /> : <p className="page-width py-20" role="status">Loading your private workspace…</p>
}
