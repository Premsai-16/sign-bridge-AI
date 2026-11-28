import LocalizedNavLabel from './LocalizedNavLabel'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { accountStorage, getAccount } from '../lib/account'
import { speakText } from '../lib/speech'
import { startAutomaticWelcome, welcomeText } from '../lib/welcome'

export default function PersonalWelcome() {
  const name = accountStorage.getItem('signbridge-name') || ''
  const language = accountStorage.getItem('signbridge-interface-language') || 'en-IN'
  const account = getAccount()?.username || ''
  const silent = accountStorage.getItem('signbridge-auto-speak') === 'false'
  const [notice, setNotice] = useState('')
  const greeting = welcomeText(name, language)
  useEffect(() => {
    if (silent) return
    return startAutomaticWelcome({
      key: JSON.stringify([account, name, language]), target: window, notice: setNotice,
      speak: callbacks => { speakText(greeting, language, 1, { ...callbacks, translate: false, queue: true }) },
    })
  }, [account, name, language, greeting, silent])
  return <section className="page-width personal-welcome">
    <div><p className="eyebrow">Your SignBridge</p><h2>{welcomeText(name, 'en-IN')}</h2>
      {language !== 'en-IN' && <p lang={language} className="text-xl mt-2">{greeting}</p>}
      <p className="text-sm text-muted-foreground mt-3">Your default language is saved. Choose another language in Live Studio whenever you need it.</p>
    </div>
    <div className="flex flex-wrap gap-3">
      <Link className="action-primary" to={accountStorage.getItem('signbridge-communication') === 'text' ? '/hub' : '/conversation'}><LocalizedNavLabel label="Start communicating"/></Link>
      <Link className="action-secondary" to="/profile"><LocalizedNavLabel label="My preferences"/></Link>
    </div>
    {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
  </section>
}
