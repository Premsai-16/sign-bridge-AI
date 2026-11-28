import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
const code = stripTypeScriptTypes(fs.readFileSync(new URL('../src/lib/training-frames.ts', import.meta.url), 'utf8'))
const { sampleTrainingFrames } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'))
test('long recordings preserve the last movement instead of truncating to the first 60 frames', () => {
  const result = sampleTrainingFrames(Array.from({length:111},(_,index)=>[index]))
  assert.equal(result.length,60)
  assert.deepEqual(result[0],[0]); assert.deepEqual(result.at(-1),[110])
  assert.equal(new Set(result.map(frame=>frame[0])).size,60)
})
test('short recordings are copied without inventing additional hand frames', () => {
  const input = [[1],[2]]
  const result = sampleTrainingFrames(input)
  assert.deepEqual(result,input); result[0][0]=9; assert.equal(input[0][0],1)
  assert.deepEqual(sampleTrainingFrames([]),[])
})
