import { AlertCircle, Play, Pause } from 'lucide-react'

export default function AIAvatarStudio() {
  return (
    <div className="container py-8 max-w-7xl">
      <div className="flex flex-col gap-4 mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">AI Avatar Studio</h1>
        <p className="text-muted-foreground max-w-2xl">
          Accessible signing reference and avatar playback for verified ISL content.
        </p>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-6 mb-8">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-900 dark:text-amber-200 mb-2">Note</h3>
            <p className="text-sm text-amber-800 dark:text-amber-300">
              Use real, licensed animation/video assets only. Never present unreviewed generated avatar as verified translation.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="border-b border-border p-4">
            <h2 className="font-display text-xl font-semibold">Reference Library</h2>
            <p className="text-sm text-muted-foreground mt-1">Reviewed ISL signs with verified animations</p>
          </div>
          <div className="p-4">
            <div className="text-center py-8 text-muted-foreground">
              <p>No signs loaded</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="border-b border-border p-4">
            <h2 className="font-display text-xl font-semibold">Playback Controls</h2>
            <p className="text-sm text-muted-foreground mt-1">Visual ISL representation of text/speech</p>
          </div>
          <div className="aspect-video bg-muted/50 flex items-center justify-center">
            <p className="text-muted-foreground">Avatar preview</p>
          </div>
          <div className="p-4 border-t border-border">
            <div className="flex gap-3">
              <button className="flex-1 inline-flex items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition">
                <Play className="h-4 w-4 mr-2" />
                Play
              </button>
              <button className="flex-1 inline-flex items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition">
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}