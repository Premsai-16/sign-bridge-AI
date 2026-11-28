import {test} from 'node:test'
import assert from 'node:assert/strict'
import {stripTypeScriptTypes} from 'node:module'
import fs from 'node:fs'
const source=stripTypeScriptTypes(fs.readFileSync(new URL('../src/lib/conversation.ts',import.meta.url),'utf8'))
const {appendConversation,conversationStorageKey}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))
const message=(role,content,updatedAt=1000)=>({id:content,role,content,at:'12:00',updatedAt})
test('short successive signs form one editable paragraph',()=>{
 const result=appendConversation([message('signer','Hello')],message('signer','friend',2000))
 assert.equal(result.length,1);assert.equal(result[0].content,'Hello friend');assert.equal(result[0].id,'Hello')
})
test('speaker changes, long pauses and corrections keep separate turns',()=>{
 const initial=message('signer','Hello')
 assert.equal(appendConversation([initial],message('partner','Hi')).length,2)
 assert.equal(appendConversation([initial],message('signer','Again',40000)).length,2)
 assert.equal(appendConversation([{...initial,corrected:true}],message('signer','Again')).length,2)
})
test('conversation storage separates accounts',()=>assert.notEqual(conversationStorageKey('alice'),conversationStorageKey('bob')))
