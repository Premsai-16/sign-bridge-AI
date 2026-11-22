import { AlertTriangle, Database, ShieldCheck, ScanFace } from 'lucide-react'

const facts = [
  ['Camera preview', 'Available in supported browsers after camera permission is granted.'],
  ['Hand landmark detector', 'MediaPipe Hand Landmarker runs in the browser using bundled model and runtime assets.'],
  ['Shared sign model', 'Only labels captured and published by an authorized owner are available to all visitors. Until one is published, shared sign recognition stays off.'],
  ['Private family vocabulary', 'Visitors can optionally capture up to five personal sign sequences after explicit consent. Derived hand landmarks remain in that browser; raw clips are temporary previews.'],
  ['Continuous ISL translation', 'Not available. This prototype recognizes held poses; it does not translate dynamic signs, facial expressions, or ISL sentence grammar.'],
  ['Evaluation results', 'No independent accuracy evaluation is supplied for user-trained samples.'],
]

export default function ResearchLab() {
  return (
    <div className="prism-page container max-w-7xl py-10">
      <div className="prism-page-heading mb-8 flex flex-col gap-3">
        <span className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Transparency and governance</span>
        <h1 className="font-display text-4xl font-bold tracking-tight">AI research lab</h1>
        <p className="max-w-2xl text-muted-foreground">A clear view of the software, model readiness, and data handling included in this project.</p>
      </div>

      <div className="mb-6 flex gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" /><div><h2 className="font-semibold">Experimental isolated-sign recognition</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Shared recognition depends on the owner’s trained and published vocabulary. Until that model is published, only visitor-created private held-sign labels can be matched. This is not a general ISL translator and should not replace a qualified interpreter.</p></div></div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-5 flex items-center gap-3"><ScanFace className="h-6 w-6 text-primary" /><h2 className="font-display text-xl font-semibold">Capability status</h2></div>
          <dl className="space-y-4">{facts.map(([name, detail]) => <div key={name} className="border-b border-border pb-4 last:border-0 last:pb-0"><dt className="text-sm font-semibold">{name}</dt><dd className="mt-1 text-sm leading-6 text-muted-foreground">{detail}</dd></div>)}</dl>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-5 flex items-center gap-3"><ShieldCheck className="h-6 w-6 text-primary" /><h2 className="font-display text-xl font-semibold">Privacy model</h2></div>
          <ul className="space-y-4 text-sm leading-6 text-muted-foreground"><li><strong className="text-foreground">Visitor camera:</strong> Live recognition processes camera frames in the browser; they are not uploaded.</li><li><strong className="text-foreground">Owner training:</strong> With explicit signer consent, the silent clip is saved in private backend storage for owner review; derived landmarks and an anonymous signer code train the shared model. Deleting the example deletes its clip.</li><li><strong className="text-foreground">Family signs:</strong> With the user's consent, private motion landmarks and labels are stored privately with your signed-in account. The raw preview is temporary.</li><li><strong className="text-foreground">Session notes:</strong> Saved transcripts are stored privately with your signed-in account until deleted.</li></ul>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <div className="mb-4 flex items-center gap-3"><Database className="h-6 w-6 text-primary" /><h2 className="font-display text-xl font-semibold">What production readiness requires</h2></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{['A signer-diverse, consented ISL dataset', 'Dynamic signs and non-manual features', 'Independent evaluation with published metrics', 'Review by Deaf ISL experts'].map(item => <div key={item} className="rounded-xl bg-muted/60 p-4 text-sm font-medium">{item}</div>)}</div>
        </section>
      </div>
    </div>
  )
}
