import { supabase } from './supabase'
export interface Account { access_token: string; username: string; role: 'user' | 'owner' }
const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
export function getAccount(): Account | null { try { return JSON.parse(sessionStorage.getItem('signbridge-account') || 'null') } catch { return null } }
export async function accountRequest(path: string, init: RequestInit = {}) {
  const account = getAccount()
  const response = await fetch(`${base}/api/v1/account${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(account ? {Authorization: `Bearer ${account.access_token}`} : {}), ...init.headers } })
  const data = await response.json().catch(() => null)
  if (!data) throw new Error(response.ok ? 'The server returned an unreadable response. Please retry.' : 'Unable to reach your account. Check the connection and retry.')
  if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Please check your account details.')
  return data
}
let values: Record<string,string> = {}
let pending: Record<string,string | null> = {}
let timer: ReturnType<typeof setTimeout> | undefined
let saving = false
export let saveStatus = 'Saved to your account'
const report = (message: string) => { saveStatus = message; window.dispatchEvent(new Event('account-save-status')) }
export async function loadAccountSaves() { values = await accountRequest('/saves'); pending = {}; document.documentElement.classList.toggle('dark',values['signbridge-theme'] === 'dark'); document.documentElement.classList.toggle('high-contrast',values['signbridge-high-contrast'] === 'true'); document.documentElement.classList.toggle('large-text',values['signbridge-large-text'] === 'true'); document.documentElement.classList.toggle('reduce-motion',values['signbridge-reduced-motion'] === 'true') }
export async function flushAccountSaves(): Promise<boolean> {
  if (saving) return false
  if (!Object.keys(pending).length) return true
  saving = true
  const changes = pending; pending = {}
  try { await accountRequest('/saves', {method:'PATCH',body:JSON.stringify({values:changes})}); report(Object.keys(pending).length ? 'Saving…' : 'Saved to your account'); return !Object.keys(pending).length }
  catch { pending = {...changes,...pending}; report('Changes not saved. Retry before signing out.'); return false }
  finally { saving = false; if (Object.keys(pending).length) timer = setTimeout(() => void flushAccountSaves(), 5000) }
}
export const accountStorage = {
  getItem(key: string): string | null { return values[key] ?? null },
  setItem(key: string, value: string) { values[key] = value; pending[key] = value; report('Saving…'); clearTimeout(timer); timer = setTimeout(() => void flushAccountSaves(), 500) },
  removeItem(key: string) { delete values[key]; pending[key] = null; report('Saving…'); clearTimeout(timer); timer = setTimeout(() => void flushAccountSaves(), 500) },
}
export async function signOut() {
  if (!await flushAccountSaves()) throw new Error('Wait for your changes to save, then try again.')
  if (supabase) await supabase.auth.signOut()
  await accountRequest('/logout',{method:'POST'})
  sessionStorage.removeItem('signbridge-account'); sessionStorage.removeItem('signbridge-owner-session'); values = {}; pending = {}; clearTimeout(timer)
  window.location.assign('/login')
}

window.addEventListener('online', () => { if (Object.keys(pending).length) void flushAccountSaves() })

window.addEventListener('beforeunload', event => { if(saving || Object.keys(pending).length) { event.preventDefault(); event.returnValue = ''; } })
