import {test} from 'node:test'
import assert from 'node:assert/strict'
import {stripTypeScriptTypes} from 'node:module'
import fs from 'node:fs'
const source=stripTypeScriptTypes(fs.readFileSync(new URL('../src/hooks/useCamera.ts',import.meta.url),'utf8')
 .replace("import { accountStorage } from '../lib/account'",'const accountStorage={getItem:()=>null}')
 .replace("import { useCallback, useRef, useState, useEffect } from 'react'",'const {useCallback,useRef,useState,useEffect}=globalThis.cameraHooks'))
function setup(){
 let state
 globalThis.cameraHooks={useCallback:fn=>fn,useRef:value=>({current:value}),useState:value=>{state=value;return [value,next=>{state=typeof next==='function'?next(state):next}]},useEffect:()=>{}}
 const pending=[]
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{mediaDevices:{getUserMedia:()=>new Promise((resolve,reject)=>pending.push({resolve,reject}))}}})
 return {pending,getState:()=>state}
}
function stream(){const track={stopped:false,stop(){this.stopped=true},onended:null};return {track,getTracks:()=>[track],getVideoTracks:()=>[track]}}
let serial=0
async function hook(){return (await import('data:text/javascript;base64,'+Buffer.from(source+'\n//'+serial++).toString('base64'))).useCamera()}
test('stopping while permission is pending releases the late camera stream',async()=>{
 const env=setup(), camera=await hook(), pending=camera.start();camera.stop();const late=stream();env.pending[0].resolve(late)
 assert.equal(await pending,false);assert.equal(late.track.stopped,true);assert.equal(env.getState().isActive,false)
})
test('latest camera request wins when requests resolve out of order',async()=>{
 const env=setup(),camera=await hook(),first=camera.start(),second=camera.start('environment');const newer=stream(),older=stream()
 env.pending[1].resolve(newer);assert.equal(await second,true)
 env.pending[0].resolve(older);assert.equal(await first,false)
 assert.equal(older.track.stopped,true);assert.equal(env.getState().stream,newer);assert.equal(newer.track.stopped,false)
 camera.stop()
})
test('switching releases previous camera before requesting another',async()=>{
 const env=setup(),camera=await hook(),first=camera.start(),old=stream();env.pending[0].resolve(old);await first
 const second=camera.start('environment');assert.equal(old.track.stopped,true)
 env.pending[1].reject(new Error('Camera busy'));assert.equal(await second,false);assert.equal(env.getState().stream,null)
})
