import { Send, Volume2, MessageCircle } from 'lucide-react'

export default function CommunicationHub() {
  return (
    <div className="container py-8 max-w-7xl">
      <div className="flex flex-col gap-4 mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">Communication Hub</h1>
        <p className="text-muted-foreground max-w-2xl">
          Two-way communication: sign to text/speech, speech to text. Your conversation history is saved locally.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card flex flex-col h-[500px]">
          <div className="border-b border-border p-4">
            <h2 className="font-display text-xl font-semibold">Live Conversation</h2>
            <p className="text-sm text-muted-foreground mt-1">Your conversation with SignBridge AI</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Conversation history will appear here</p>
            </div>
          </div>

          <div className="border-t border-border p-4">
            <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
              <input
                type="text"
                placeholder="Type your message..."
                className="flex-1 rounded-xl border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2 text-white font-medium"
              >
                <Send className="h-4 w-4 mr-2" />
                Send
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-display text-lg font-semibold mb-3">Text-to-Speech</h3>
            <div className="space-y-3">
              <select className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option>English (US)</option>
                <option>Hindi</option>
              </select>
              <button className="w-full inline-flex items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition">
                <Volume2 className="h-4 w-4 mr-2" />
                Speak Current Transcript
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-display text-lg font-semibold mb-3">Settings</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm">Auto-speak recognized signs</span>
                <input type="checkbox" className="w-5 h-5 rounded border-border" />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm">Save conversation history</span>
                <input type="checkbox" className="w-5 h-5 rounded border-border" defaultChecked />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}