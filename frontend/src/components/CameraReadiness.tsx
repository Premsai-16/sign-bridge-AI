import { useEffect, useState, type RefObject } from 'react'
export default function CameraReadiness({video,active,hands}:{video:RefObject<HTMLVideoElement|null>;active:boolean;hands:number}) {
 const [light,setLight]=useState<'waiting'|'dim'|'bright'|'good'>('waiting')
 useEffect(()=>{
  if(!active)return
  const canvas=document.createElement('canvas');canvas.width=32;canvas.height=24
  const context=canvas.getContext('2d',{willReadFrequently:true})
  const timer=window.setInterval(()=>{
   const source=video.current
   if(!context||!source||source.readyState<2)return
   try {
    context.drawImage(source,0,0,32,24)
    const pixels=context.getImageData(0,0,32,24).data
    let total=0
    for(let i=0;i<pixels.length;i+=4)total+=pixels[i]*.2126+pixels[i+1]*.7152+pixels[i+2]*.0722
    const level=total/(32*24)
    setLight(level<45?'dim':level>225?'bright':'good')
   } catch {setLight('waiting')}
  },2000)
  return()=>window.clearInterval(timer)
 },[active,video])
 if(!active)return null
 return <details className="border-b border-border px-5 py-3 text-sm"><summary className="cursor-pointer font-medium">Camera guidance · {hands>0?'hands in view':'show your hands'}{light==='dim'?' · low light':light==='bright'?' · very bright':''}</summary><p className="mt-2 text-muted-foreground">{light==='dim'?'Add light in front of you.':light==='bright'?'Avoid pointing the camera at a bright light.':'Keep your face and both hands visible, with room to move.'} Keep your hands away from the frame edges. Lighting is estimated on your device; it is not a recognition accuracy score.</p></details>
}
