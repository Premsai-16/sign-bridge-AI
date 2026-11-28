import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
const code = stripTypeScriptTypes(fs.readFileSync(new URL('../src/lib/welcome.ts', import.meta.url), 'utf8'))
const { welcomeText, startAutomaticWelcome } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'))
const tick = () => new Promise(resolve => setTimeout(resolve, 5))
test('greeting uses the preferred language and one uninterrupted phrase', () => {
  assert.equal(welcomeText(' Sai ', 'en-IN'), 'Hello Sai')
  assert.equal(welcomeText('Prem Sai', 'kn-IN'), 'ನಮಸ್ಕಾರ Prem Sai')
  assert.equal(welcomeText('Sai', 'ta-IN'), 'வணக்கம் Sai')
  assert.equal(welcomeText('Sai', 'te-IN'), 'నమస్కారం Sai')
  assert.equal(welcomeText('Sai', 'hi-IN'), 'नमस्ते Sai')
  assert.equal(welcomeText(', Sai', 'unknown'), 'Hello Sai')
})
test('successful welcome runs automatically once, not on every home navigation', async () => {
  let calls = 0
  const options = {key:'once',target:new EventTarget(),notice(){},speak(callbacks){ calls++; callbacks.onStart() }}
  const cleanup = startAutomaticWelcome(options); await tick(); cleanup()
  startAutomaticWelcome(options); await tick(); assert.equal(calls,1)
})
test('blocked autoplay retries on ordinary interaction without a welcome button', async () => {
  let calls = 0
  const target = new EventTarget()
  const cleanup = startAutomaticWelcome({key:'blocked',target,notice(){},speak(callbacks){ calls++; calls===1 ? callbacks.onError('The browser blocked speech.') : callbacks.onStart() }})
  await tick(); assert.equal(calls,1)
  target.dispatchEvent(new Event('pointerup')); target.dispatchEvent(new Event('keydown'))
  assert.equal(calls,2); cleanup()
})
test('unmount cancels pending welcome and removes interaction retry', async () => {
  let calls = 0, signal
  const target = new EventTarget()
  const cleanup = startAutomaticWelcome({key:'cancel',target,notice(){},speak(callbacks){calls++;signal=callbacks.signal;callbacks.onError('blocked')}})
  await tick(); cleanup(); target.dispatchEvent(new Event('pointerup'))
  assert.equal(calls,1); assert.equal(signal.aborted,true)
  const early = startAutomaticWelcome({key:'early',target,notice(){},speak(){calls++}});early();await tick();assert.equal(calls,1)
})
