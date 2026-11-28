import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'

const source = fs.readFileSync(new URL('../src/lib/supabase.ts', import.meta.url), 'utf8')
  .replace(/import .*\n/, '')
  .replaceAll('import.meta.env.VITE_SUPABASE_URL', "'https://example.supabase.co'")
  .replaceAll('import.meta.env.VITE_SUPABASE_ANON_KEY', "'public-key'")
  .replaceAll('export const ', 'var ')
function initialize(search) {
  const context = vm.createContext({
    URLSearchParams,
    window: { location: { search } },
    createClient() { context.window.location.search = ''; return {} },
  })
  vm.runInContext(source, context)
  return context
}
test('OAuth callback survives SDK removal of the URL code', () => {
  const result = initialize('?code=one-time-code')
  assert.equal(result.window.location.search, '')
  assert.equal(result.authCallback, true)
})
test('ordinary login does not exchange an old session', () => {
  assert.equal(initialize('').authCallback, false)
})
test('provider denial is preserved for the login error message', () => {
  assert.equal(initialize('?error_description=Access+denied').authCallbackError, 'Access denied')
})
