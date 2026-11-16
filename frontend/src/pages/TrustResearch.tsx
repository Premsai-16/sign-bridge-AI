import { CheckCircle } from 'lucide-react'

export default function TrustResearch() {
  return (
    <div className="container py-8 max-w-7xl">
      <div className="flex flex-col gap-4 mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">Trust & AI Research</h1>
        <p className="text-muted-foreground max-w-2xl">
          Model transparency, evaluation metrics, and data governance for the SignBridge AI platform.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="border-b border-border p-4">
            <h2 className="font-display text-xl font-semibold">Model Card</h2>
            <p className="text-sm text-muted-foreground mt-1">Technical specifications and limitations</p>
          </div>
          <div className="p-4">
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Language</span>
                <span className="font-medium">Indian Sign Language (ISL)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Model Type</span>
                <span className="font-medium">Personalized enrollment classifier</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">License</span>
                <span className="font-medium">User-created examples under consent</span>
              </div>
              <div>
                <span className="text-muted-foreground">Limitations</span>
                <ul className="text-xs text-muted-foreground mt-1 space-y-1 ml-4">
                  <li>• Signer-dependent: requires user enrollment for best accuracy</li>
                  <li>• Limited vocabulary: grows with user contributions</li>
                  <li>• Does not support all ISL signs currently</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="border-b border-border p-4">
            <h2 className="font-display text-xl font-semibold">Data Governance</h2>
            <p className="text-sm text-muted-foreground mt-1">Privacy-first design principles</p>
          </div>
          <div className="p-4">
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Local Storage</p>
                  <p className="text-muted-foreground">Landmark samples stored locally. No raw video or audio.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">User Consent</p>
                  <p className="text-muted-foreground">Explicit informed consent required for landmark collection.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Data Rights</p>
                  <p className="text-muted-foreground">Export all data, request deletion, or manage retention anytime.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="border-b border-border p-4">
            <h2 className="font-display text-xl font-semibold">Model Evaluation</h2>
            <p className="text-sm text-muted-foreground mt-1">Performance metrics and assessments</p>
          </div>
          <div className="p-4">
            <div className="space-y-3 text-sm">
              <div className="border-l-4 border-primary pl-3">
                <p className="font-medium">Class Balance</p>
                <p className="text-muted-foreground">Model trained with balanced enrollment samples per class.</p>
              </div>
              <div className="border-l-4 border-primary pl-3">
                <p className="font-medium">Signer-Independent Evaluation</p>
                <p className="text-muted-foreground">Held-out evaluation from different signers for generalization testing.</p>
              </div>
              <div className="border-l-4 border-primary pl-3">
                <p className="font-medium">Minimum Readiness</p>
                <p className="text-muted-foreground">Requires minimum 5 examples per sign for training.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="border-b border-border p-4">
            <h2 className="font-display text-xl font-semibold">Known Limitations</h2>
            <p className="text-sm text-muted-foreground mt-1">Technical constraints and research gaps</p>
          </div>
          <div className="p-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>• Signer-dependent: requires user enrollment for best accuracy</p>
              <p>• Limited vocabulary: grows with user contributions</p>
              <p>• Does not support all ISL signs currently</p>
              <p>• Unknown or ambiguous inputs return "not sure" rather than false translations</p>
              <p>• Movement-dependent signs require temporal modeling</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <h3 className="font-display text-2xl font-bold">Model Status</h3>
        </div>
        <div className="p-6">
          <div className="grid gap-4 md:grid-cols-4 text-center">
            <div className="p-4 border border-border rounded-2xl">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">✓</p>
              <p className="text-xs text-muted-foreground mt-1">Model Ready</p>
            </div>
            <div className="p-4 border border-border rounded-2xl">
              <p className="text-2xl font-bold text-primary">24</p>
              <p className="text-xs text-muted-foreground mt-1">Vocabulary Signs</p>
            </div>
            <div className="p-4 border border-border rounded-2xl">
              <p className="text-2xl font-bold text-primary">156</p>
              <p className="text-xs text-muted-foreground mt-1">User Examples</p>
            </div>
            <div className="p-4 border border-border rounded-2xl">
              <p className="text-2xl font-bold text-primary">0.82</p>
              <p className="text-xs text-muted-foreground mt-1">Current Accuracy</p>
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Accuracy varies by signer. Results from validation with consenting users.
          </p>
        </div>
      </div>
    </div>
  )
}