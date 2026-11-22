import { test, beforeEach, after } from 'node:test'
import assert from 'node:assert/strict'
import { stripTypeScriptTypes } from 'node:module'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'signbridge-speech-'))
for(const name of ['languages','auto-translate','speech']) fs.writeFileSync(path.join(directory,`${name}.mjs`),stripTypeScriptTypes(fs.readFileSync(new URL(`../src/lib/${name}.ts`,import.meta.url),'utf8').replace("import { accountStorage } from './account'", "const accountStorage = globalThis.localStorage").replace("'./languages'","'./languages.mjs'").replace("'./auto-translate'","'./auto-translate.mjs'")))
const values=new Map(); const players=[]; const utterances=[]
globalThis.localStorage={getItem:key=>values.get(key)??null}
globalThis.window=new EventTarget()
window.setTimeout=setTimeout
window.speechSynthesis={getVoices:()=>[{lang:'ta_IN',voiceURI:'Vani'}],cancel(){},resume(){},speak(value){utterances.push(value);value.onstart?.()}}
globalThis.Audio=class { constructor(src){this.src=src;players.push(this)} async play(){this.onplaying?.()} pause(){this.paused=true} }
globalThis.SpeechSynthesisUtterance=class {constructor(text){this.text=text}}
const speech=await import(`file://${directory}/speech.mjs`)
const languages=await import(`file://${directory}/languages.mjs`)
beforeEach(()=>{speech.stopSpeech();values.clear();players.length=0;utterances.length=0;languages.setSharedTranslations({})})
after(()=>fs.rmSync(directory,{recursive:true,force:true}))
test('Tamil hello uses shipped audio without requiring browser voices',()=>{
 values.set('signbridge-output-language','ta-IN');assert.equal(speech.speakText('Hello!'),true)
 assert.equal(players[0].src,'/audio/ta-IN/hello.wav');assert.equal(speech.getLastSpeech().text,'வணக்கம்')
})
test('already translated Tamil is not translated a second time',()=>{
 values.set('signbridge-output-language','ta-IN');assert.equal(speech.speakText('வணக்கம்'),true);assert.equal(players.length,1)
})
test('romanized owner override does not replace native built-in greeting',()=>{
 languages.setSharedTranslations({hello:{'ta-IN':'VANGA VANAKAM'}})
 assert.equal(languages.translatePhrase('hello','ta-IN').text,'வணக்கம்')
})
test('queued recordings play sequentially and stop clears the queue',()=>{
 values.set('signbridge-output-language','kn-IN');speech.speakText('hello');speech.speakText('water','en-IN',1,{queue:true});assert.equal(players.length,1)
 players[0].onended();assert.equal(players.length,2);assert.equal(players[1].src,'/audio/kn-IN/water.wav')
 speech.speakText('yes','en-IN',1,{queue:true});speech.stopSpeech();players[1].onended();assert.equal(players.length,2)
})
test('all shipped recordings exist',()=>{
 for(const language of languages.OUTPUT_LANGUAGES)for(const key of languages.PHRASE_KEYS){const file=new URL(`../public/audio/${language.code}/${key.replaceAll(' ','-')}.wav`,import.meta.url);assert.ok(fs.statSync(file).size>1000)}
})
test('custom Tamil selects underscore-form device locale',async()=>{
 speech.speakText('ஒரு புதிய செய்தி','ta-IN',1,{translate:false});await new Promise(resolve=>setImmediate(resolve));assert.equal(utterances[0].voice.voiceURI,'Vani');assert.equal(utterances[0].lang,'ta-IN')
})
test('automatic translation deduplicates requests and caches repeat words', async()=>{
 const {translateAutomatically}=await import(`file://${directory}/auto-translate.mjs`)
 let calls=0
 const originalFetch=globalThis.fetch
 globalThis.fetch=async()=>{calls++;return {ok:true,json:async()=>({text:'ಪ್ರೀತಿ'})}}
 try {
  const translated=await Promise.all([translateAutomatically('a fresh phrase','kn-IN'),translateAutomatically('a fresh phrase','kn-IN')])
  assert.deepEqual(translated,['ಪ್ರೀತಿ','ಪ್ರೀತಿ']);assert.equal(calls,1)
  assert.equal(await translateAutomatically('a fresh phrase','kn-IN'),'ಪ್ರೀತಿ');assert.equal(calls,1)
 } finally {globalThis.fetch=originalFetch}
})
test('stopping during translation prevents delayed speech', async()=>{
 values.set('signbridge-output-language','ta-IN')
 const originalFetch=globalThis.fetch
 let release
 globalThis.fetch=()=>new Promise(resolve=>{release=()=>resolve({ok:true,json:async()=>({text:'புதிய சொல்'})})})
 try {
  speech.speakText('a new unseen word');speech.stopSpeech();release()
  await new Promise(resolve=>setImmediate(resolve))
  assert.equal(utterances.length,0);assert.equal(players.length,0)
 } finally {globalThis.fetch=originalFetch}
})
test('disabling online translation prevents network disclosure', async()=>{
 values.set('signbridge-auto-translate','false')
 const {translateAutomatically}=await import(`file://${directory}/auto-translate.mjs`)
 await assert.rejects(()=>translateAutomatically('private unseen phrase','hi-IN'),/off/)
})
