import { Component, type ReactNode } from 'react'
export default class WorkspaceBoundary extends Component<{children:ReactNode},{failed:boolean}> {
 state={failed:false}
 static getDerivedStateFromError(){return {failed:true}}
 render(){
  if(this.state.failed)return <main className="page-width py-20"><h1 className="text-3xl font-bold">This screen couldn’t open</h1><p className="my-4">Reload to try again. Preferences already saved to your account are safe. Unsaved changes may be lost.</p><button className="action-primary" onClick={()=>window.location.reload()}>Reload SignBridge</button><a className="action-secondary ml-3" href="/">Return home</a></main>
  return this.props.children
 }
}
