export interface ConversationMessage {
 id:string
 role:'signer'|'partner'
 content:string
 at:string
 corrected?:boolean
 updatedAt?:number
}
export function appendConversation(messages:ConversationMessage[], message:ConversationMessage):ConversationMessage[] {
 const last=messages.at(-1)
 const now=message.updatedAt??Date.now()
 // Keep a turn together without combining across speakers or editing a corrected turn.
 if(last && last.role===message.role && !last.corrected && last.updatedAt!==undefined && now>=last.updatedAt && now-last.updatedAt<30000 && last.content.length+message.content.length<1500){
  return [...messages.slice(0,-1),{...last,content:`${last.content.trimEnd()} ${message.content.trim()}`,updatedAt:now,at:message.at}]
 }
 return [...messages,{...message,updatedAt:now}].slice(-200)
}
export function conversationStorageKey(username:string){return `signbridge-active-conversation:${encodeURIComponent(username)}`}
