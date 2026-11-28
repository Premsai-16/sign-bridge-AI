import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
async function load(file) {
 const code=stripTypeScriptTypes(fs.readFileSync(new URL(`../src/lib/${file}.ts`,import.meta.url),'utf8').replace('import.meta.env.VITE_API_URL',"''").replace("import { accountStorage } from './account'",'const accountStorage={getItem:()=>null,setItem(){}}'))
 return import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'))
}
const { predictSharedSequence, predictSharedSign }=await load('api')
const { predictPersonalSign }=await load('personalized-signs')
const frame=value=>Array(126).fill(value)
const clip=value=>Array.from({length:12},()=>frame(value))
const example=(label,value)=>({label,features:frame(value),frames:clip(value),createdAt:''})
test('exact competing shared templates are unknown, not an arbitrary label',()=>{
 assert.equal(predictSharedSequence({published:true,templates:{hello:[clip(.1)],love:[clip(.1)]}},clip(.1)),null)
 assert.equal(predictSharedSign({published:true,centroids:{hello:frame(.1),love:frame(.1)}},frame(.1)),null)
})
test('valid distinct shared sign matches while distant and empty input reject',()=>{
 const model={published:true,templates:{hello:[clip(.1)],water:[clip(.8)]}}
 assert.equal(predictSharedSequence(model,clip(.1)).label,'hello')
 assert.equal(predictSharedSequence(model,clip(-.9)),null)
 assert.equal(predictSharedSequence(model,clip(0)),null)
 assert.equal(predictSharedSequence(model,[[NaN]]),null)
})
test('personal sign ties and corrupt saved sequences reject without throwing',()=>{
 assert.equal(predictPersonalSign([example('father',.1),example('mother',.1)],clip(.1)),null)
 assert.equal(predictPersonalSign([{...example('father',.1),frames:[[.1]]}],clip(.1)),null)
 assert.equal(predictPersonalSign([example('father',.1)],[[NaN]]),null)
 assert.equal(predictPersonalSign([example('father',.1)],clip(.1)).label,'father')
})
test('malformed published model templates fail closed',()=>{
 assert.equal(predictSharedSequence({published:true,templates:{bad:null}},clip(.1)),null)
 assert.equal(predictSharedSequence({published:true,templates:{bad:[Array(12).fill(null)]}},clip(.1)),null)
 assert.equal(predictSharedSign({published:true,centroids:{bad:null}},frame(.1)),null)
})
