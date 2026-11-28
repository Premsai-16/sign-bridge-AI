/** Require a short stable observation; tolerate brief tracking dropouts. */
export interface RecognitionGate {
  candidate: string | null
  since: number
  frames: number
  lastAccepted: string | null
  missingSince: number | null
}
export function emptyRecognitionGate(): RecognitionGate {
  return { candidate: null, since: 0, frames: 0, lastAccepted: null, missingSince: null }
}
export function advanceRecognitionGate(state: RecognitionGate, label: string | null, now: number): { state: RecognitionGate; accepted: string | null } {
  if (!label) {
    const missingSince = state.missingSince ?? now
    return { state: { ...state, candidate: null, frames: 0, missingSince,
      lastAccepted: now - missingSince >= 250 ? null : state.lastAccepted }, accepted: null }
  }
  const next = { ...state, candidate: label, missingSince: null,
    since: state.candidate === label ? state.since : now,
    frames: state.candidate === label ? state.frames + 1 : 1 }
  if (next.frames < 2 || now - next.since < 80 || next.lastAccepted === label) return { state: next, accepted: null }
  return { state: { ...next, lastAccepted: label }, accepted: label }
}
