import { useState } from 'react'
import { ownerApi } from '../lib/api'
import { OUTPUT_LANGUAGES } from '../lib/languages'

type Report = Awaited<ReturnType<typeof ownerApi.evaluate>>['validation_metrics']
export default function OwnerQualityTools({ token, labels }: { token: string; labels: string[] }) {
  const [label, setLabel] = useState('')
  const [language, setLanguage] = useState('kn-IN')
  const [text, setText] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [report, setReport] = useState<Report | null>(null)
  return <section className="my-6 grid gap-5 lg:grid-cols-2">
    <form className="rounded-3xl border border-border bg-card p-6" onSubmit={async event => { event.preventDefault(); setBusy(true); try { await ownerApi.saveTranslation(token, label, language, text); setNotice('Translation saved. Visitor vocabulary refreshes within one minute.'); } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not save translation.') } finally { setBusy(false) } }}>
      <h2 className="font-display text-xl font-bold">Optional translation overrides</h2><p className="my-3 text-sm text-muted-foreground">Enter a translation checked by a fluent speaker using the language’s native script—for example, வணக்கம் for Tamil. Roman-letter spellings may not be pronounced correctly. Saving replaces the translation for this phrase and language.</p>
      <label className="block text-sm">Original phrase<input required maxLength={100} list="translation-labels" value={label} onChange={event => setLabel(event.target.value)} className="my-2 block w-full rounded-xl border border-border bg-background p-3" /></label><datalist id="translation-labels">{labels.map(item => <option key={item} value={item} />)}</datalist>
      <label className="block text-sm">Output language<select value={language} onChange={event => setLanguage(event.target.value)} className="my-2 block w-full rounded-xl border border-border bg-background p-3">{OUTPUT_LANGUAGES.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label>
      <label className="block text-sm">Reviewed translation<textarea required maxLength={500} value={text} onChange={event => setText(event.target.value)} className="my-2 block w-full rounded-xl border border-border bg-background p-3" /></label><button disabled={busy} className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-50">Save translation</button>
    </form>
    <div className="rounded-3xl border border-border bg-card p-6"><h2 className="font-display text-xl font-bold">Evaluate before publishing</h2><p className="my-3 text-sm text-muted-foreground">Evaluate the current training clips against separate validation signers. Your published vocabulary stays active while you review the draft.</p><button disabled={busy} className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-50" onClick={async () => { setBusy(true); try { setReport((await ownerApi.evaluate(token)).validation_metrics); setNotice('Draft evaluated without publishing.'); } catch (error) { setNotice(error instanceof Error ? error.message : 'Evaluation failed.') } finally { setBusy(false) } }}>Evaluate draft</button>
    {report && <div className="mt-5">{report.validation_examples ? <><p>{report.validation_examples} validation clips · {Math.round(report.accuracy * 100)}% correct · {Math.round(report.coverage * 100)}% recognized</p><table className="mt-4 w-full text-left text-sm"><thead><tr><th>Expected</th><th>Predicted</th><th>Clips</th></tr></thead><tbody>{Object.entries(report.confusion).flatMap(([expected, outcomes]) => Object.entries(outcomes).map(([predicted, count]) => <tr key={`${expected}-${predicted}`} className="border-t border-border"><td className="py-2">{expected}</td><td>{predicted === 'unknown' ? 'Not recognized' : predicted}</td><td>{count}</td></tr>))}</tbody></table></> : <p className="rounded-xl bg-amber-500/10 p-4">No validation clips yet. Accuracy cannot be measured. Record validation examples using signer codes that are absent from training.</p>}</div>}
    </div><p role="status" className="text-sm lg:col-span-2">{notice}</p>
  </section>
}
