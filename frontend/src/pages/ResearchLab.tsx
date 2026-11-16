import { AlertTriangle, Database, ShieldCheck, ScanFace } from 'lucide-react'

const facts = [
  ['Camera preview', 'Available in supported browsers after camera permission is granted.'],
  ['Hand landmark detector', 'MediaPipe Hand Landmarker runs in the browser using bundled model and runtime assets.'],
  ['Published sign model', 'An experimental 11-class isolated-sign classifier runs locally in the browser; signer-diverse validation has not been independently reproduced.'],
  ['Personal vocabulary', 'Users can train labels from their own held signs after explicit consent. Samples remain in the browser.'],
  ['Continuous ISL translation', 'Not available. Neither the limited vocabulary model nor personal matching translates dynamic signs, facial expressions, or sentence grammar.'],
  ['Evaluation results', 'No independent accuracy evaluation is supplied for user-trained samples.'],
]

export default function ResearchLab() {
  return (
    <div className="container max-w-7xl py-10">
      <div className="mb-8 flex flex-col gap-3">
        <span className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Transparency and governance</span>
        <h1 className="font-display text-4xl font-bold tracking-tight">AI research lab</h1>
        <p className="max-w-2xl text-muted-foreground">A clear view of the software, model readiness, and data handling included in this project.</p>
      </div>

      <div className="mb-6 flex gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" /><div><h2 className="font-semibold">Experimental isolated-sign recognition</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">A limited 11-sign classifier and personal held-sign matching are available. This is not a general ISL translator and should not replace a qualified interpreter.</p></div></div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-5 flex items-center gap-3"><ScanFace className="h-6 w-6 text-primary" /><h2 className="font-display text-xl font-semibold">Capability status</h2></div>
          <dl className="space-y-4">{facts.map(([name, detail]) => <div key={name} className="border-b border-border pb-4 last:border-0 last:pb-0"><dt className="text-sm font-semibold">{name}</dt><dd className="mt-1 text-sm leading-6 text-muted-foreground">{detail}</dd></div>)}</dl>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-5 flex items-center gap-3"><ShieldCheck className="h-6 w-6 text-primary" /><h2 className="font-display text-xl font-semibold">Privacy model</h2></div>
          <ul className="space-y-4 text-sm leading-6 text-muted-foreground"><li><strong className="text-foreground">Camera:</strong> The video stream is processed in the browser and is not uploaded or recorded.</li><li><strong className="text-foreground">Hand examples:</strong> With explicit consent, derived landmarks and labels are saved in this browser only.</li><li><strong className="text-foreground">Session notes:</strong> Saved transcripts remain in this browser until exported or deleted.</li><li><strong className="text-foreground">Control:</strong> The recognition page provides a delete action for personalized examples.</li></ul>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <div className="mb-4 flex items-center gap-3"><Database className="h-6 w-6 text-primary" /><h2 className="font-display text-xl font-semibold">What production readiness requires</h2></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{['A signer-diverse, consented ISL dataset', 'Dynamic signs and non-manual features', 'Independent evaluation with published metrics', 'Review by Deaf ISL experts'].map(item => <div key={item} className="rounded-xl bg-muted/60 p-4 text-sm font-medium">{item}</div>)}</div>
        </section>
      </div>
    </div>
  )
}
