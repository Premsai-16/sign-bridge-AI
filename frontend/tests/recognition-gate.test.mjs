import { test } from 'node:test'
import assert from 'node:assert/strict'
import { stripTypeScriptTypes } from 'node:module'
import fs from 'node:fs'
const code = stripTypeScriptTypes(fs.readFileSync(new URL('../src/lib/recognition-gate.ts', import.meta.url), 'utf8'))
const { emptyRecognitionGate, advanceRecognitionGate } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'))
function sequence(frames) {
  let state = emptyRecognitionGate()
  return frames.map(([label, time]) => { const result = advanceRecognitionGate(state, label, time); state = result.state; return result.accepted })
}
test('one transient label never speaks; stable frames accept promptly', () => {
  assert.deepEqual(sequence([['hello', 0], ['hello', 40], ['hello', 90]]), [null, null, 'hello'])
})
test('holding a sign and brief tracking dropout do not repeat it', () => {
  assert.deepEqual(sequence([['hello', 0], ['hello', 90], [null, 140], ['hello', 190], ['hello', 280], ['hello', 500]]), [null, 'hello', null, null, null, null])
})
test('release allows intentional repetition', () => {
  assert.deepEqual(sequence([['hello', 0], ['hello', 90], [null, 140], [null, 400], ['hello', 450], ['hello', 540]]), [null, 'hello', null, null, null, 'hello'])
})
test('a different word must stabilize before acceptance', () => {
  assert.deepEqual(sequence([['hello', 0], ['hello', 90], ['love', 130], ['good', 180], ['good', 270]]), [null, 'hello', null, null, 'good'])
})
