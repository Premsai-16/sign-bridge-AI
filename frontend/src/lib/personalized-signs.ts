import { accountStorage } from './account'
export interface SignExample {
  label: string
  features: number[]
  frames?: number[][]
  createdAt: string
  id?: string
  confidence?: number
}

const KEY = 'signbridge-personal-sign-examples'
export const MIN_EXAMPLES_PER_SIGN = 10
export const MAX_PERSONAL_SIGNS = 5
const MAX_MATCH_DISTANCE = 0.28
const TEMPORAL_FRAMES = 12

function resampleSequence(sequence: number[][], count = TEMPORAL_FRAMES): number[][] {
  if (sequence.length === count) return sequence
  if (sequence.length === 0) return Array.from({ length: count }, () => Array(126).fill(0))
  if (sequence.length === 1) return Array.from({ length: count }, () => [...sequence[0]])

  return Array.from({ length: count }, (_, index) => {
    const position = (index * (sequence.length - 1)) / (count - 1)
    const start = Math.floor(position)
    const end = Math.min(start + 1, sequence.length - 1)
    const fraction = position - start
    return sequence[start].map(
      (value, feature) => value * (1 - fraction) + sequence[end][feature] * fraction
    )
  })
}

function canonicalLabel(label: string): string {
  return label.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase()
}

export function loadSignExamples(): SignExample[] {
  try {
    const value: unknown = JSON.parse(accountStorage.getItem(KEY) || '[]')
    if (!Array.isArray(value)) return []
    return value
      .filter(
        (item): item is SignExample =>
          item &&
          typeof item.label === 'string' &&
          canonicalLabel(item.label).length > 0 &&
          canonicalLabel(item.label).length <= 50 &&
          Array.isArray(item.features) &&
          item.features.length === 126
      )
      .map(item => ({
        ...item,
        label: item.label.normalize('NFKC').trim().replace(/\s+/g, ' '),
        id: item.id || `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      }))
  } catch {
    return []
  }
}

export function saveSignExample(label: string, features: number[]): SignExample[] {
  const cleanedLabel = label.normalize('NFKC').trim().replace(/\s+/g, ' ')
  if (!cleanedLabel || cleanedLabel.length > 50) {
    throw new Error('Please enter a sign label between 1 and 50 characters.')
  }
  if (!features || features.length !== 126) {
    throw new Error('The camera did not produce hand features. Ensure your hand is in view.')
  }

  const existing = loadSignExamples()
  const singleFrame = [features]
  const sequence = resampleSequence(singleFrame)

  const newExample: SignExample = {
    id: `sample-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    label: cleanedLabel,
    features,
    frames: sequence,
    createdAt: new Date().toISOString(),
    confidence: 0.95,
  }

  const next = [...existing, newExample]
  accountStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export function saveSignSequence(label: string, frames: number[][]): SignExample[] {
  const cleanedLabel = label.normalize('NFKC').trim().replace(/\s+/g, ' ')
  if (!cleanedLabel || cleanedLabel.length > 50) {
    throw new Error('Please enter a sign label between 1 and 50 characters.')
  }
  if (!frames || frames.length === 0) {
    throw new Error('No hand motion was captured. Keep your hand visible and try again.')
  }

  // Resample any number of captured frames (even 1 to 5 frames) to standard sequence
  const sequence = resampleSequence(frames)
  const average = Array.from({ length: 126 }, (_, index) =>
    sequence.reduce((sum, frame) => sum + frame[index], 0) / sequence.length
  )

  const existing = loadSignExamples()
  const newExample: SignExample = {
    id: `sample-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    label: cleanedLabel,
    features: average,
    frames: sequence,
    createdAt: new Date().toISOString(),
    confidence: 0.95,
  }

  const next = [...existing, newExample]
  accountStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export function clearSignExamples(): void {
  accountStorage.removeItem(KEY)
}

export function deleteSignExamples(label: string): SignExample[] {
  const key = canonicalLabel(label)
  const next = loadSignExamples().filter(example => canonicalLabel(example.label) !== key)
  accountStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export function deleteSignExampleById(id: string): SignExample[] {
  const next = loadSignExamples().filter(example => example.id !== id)
  accountStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export function deleteSignExample(label: string, sampleIndex: number): SignExample[] {
  const key = canonicalLabel(label)
  let index = 0
  const next = loadSignExamples().filter(example => {
    if (canonicalLabel(example.label) !== key) return true
    const keep = index !== sampleIndex
    index += 1
    return keep
  })
  accountStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export function renameSignExamples(label: string, nextLabel: string): SignExample[] {
  const source = canonicalLabel(label)
  const target = nextLabel.normalize('NFKC').trim().replace(/\s+/g, ' ')
  if (!target) return loadSignExamples()

  const next = loadSignExamples().map(example =>
    canonicalLabel(example.label) === source ? { ...example, label: target } : example
  )
  accountStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export function exampleCounts(examples: SignExample[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const example of examples) {
    if (!Array.isArray(example.features) || example.features.length !== 126 || example.features.some(value => !Number.isFinite(value))) continue
    if (example.frames && (example.frames.length !== TEMPORAL_FRAMES || example.frames.some(frame => !Array.isArray(frame) || frame.length !== 126 || frame.some(value => !Number.isFinite(value))))) continue
    const key = canonicalLabel(example.label)
    counts[key] = (counts[key] || 0) + 1
  }
  return counts
}

export function getExamplesForLabel(examples: SignExample[], label: string): SignExample[] {
  const key = canonicalLabel(label)
  return examples.filter(example => canonicalLabel(example.label) === key)
}

export function importSignExamples(value: unknown, mode: 'merge' | 'replace' = 'merge'): SignExample[] {
  if (!Array.isArray(value) || value.length > 500) {
    throw new Error('This vocabulary backup is invalid or contains too many samples.')
  }
  const imported = value.map((entry, index): SignExample => {
    if (!entry || typeof entry !== 'object') throw new Error(`Sample ${index + 1} is invalid.`)
    const sample = entry as Partial<SignExample>
    if (typeof sample.label !== 'string' || !sample.label.trim() || sample.label.length > 50 || !Array.isArray(sample.features) || sample.features.length !== 126 || !sample.features.every(value => typeof value === 'number' && Number.isFinite(value))) {
      throw new Error(`Sample ${index + 1} has invalid sign data.`)
    }
    const frames = Array.isArray(sample.frames) && sample.frames.length === TEMPORAL_FRAMES && sample.frames.every(frame => Array.isArray(frame) && frame.length === 126 && frame.every(value => typeof value === 'number' && Number.isFinite(value)))
      ? sample.frames as number[][]
      : undefined
    return {
      ...sample,
      label: sample.label.normalize('NFKC').trim().replace(/\s+/g, ' '),
      features: sample.features as number[],
      frames,
      id: typeof sample.id === 'string' ? sample.id : `import-${Date.now()}-${index}`,
      createdAt: typeof sample.createdAt === 'string' ? sample.createdAt : new Date().toISOString(),
    }
  })
  const current = mode === 'replace' ? [] : loadSignExamples()
  const next = [...current, ...imported].slice(-500)
  accountStorage.setItem(KEY, JSON.stringify(next))
  return next
}

function frameDistance(first: number[], second: number[]): number {
  return (
    Math.sqrt(
      first.reduce((sum, value, index) => sum + (value - second[index]) ** 2, 0) / first.length
    )
  )
}

function sequenceDistance(first: number[][], second: number[][]): number {
  return (
    first.reduce((sum, frame, index) => sum + frameDistance(frame, second[index]), 0) /
    first.length
  )
}

export function predictPersonalSign(
  examples: SignExample[],
  input: number[] | number[][]
): { label: string; confidence: number; margin?: number } | null {
  if (!examples || examples.length === 0) return null

  const isSequence = Array.isArray(input[0])
  const observedFrames = isSequence ? input as number[][] : [input as number[]]
  if (!observedFrames.length || observedFrames.some(frame => !Array.isArray(frame) || frame.length !== 126 || frame.some(value => !Number.isFinite(value)))) return null
  const currentSequence = isSequence ? resampleSequence(input as number[][]) : null
  const currentFeatures = isSequence
    ? Array.from({ length: 126 }, (_, index) =>
        (input as number[][]).reduce((sum, frame) => sum + frame[index], 0) / (input as number[][]).length
      )
    : (input as number[])

  if (!currentFeatures || currentFeatures.length !== 126 || currentFeatures.every(v => v === 0)) {
    return null
  }

  // Group templates by canonical label
  const grouped = new Map<string, { label: string; distances: number[] }>()
  for (const example of examples) {
    if (!Array.isArray(example.features) || example.features.length !== 126 || example.features.some(value => !Number.isFinite(value))) continue
    if (example.frames && (example.frames.length !== TEMPORAL_FRAMES || example.frames.some(frame => !Array.isArray(frame) || frame.length !== 126 || frame.some(value => !Number.isFinite(value))))) continue
    const key = canonicalLabel(example.label)
    if (!grouped.has(key)) {
      grouped.set(key, { label: example.label, distances: [] })
    }

    let d = 1.0
    if (currentSequence && example.frames) {
      d = sequenceDistance(currentSequence, example.frames)
    } else {
      d = frameDistance(currentFeatures, example.features)
    }

    if (Number.isFinite(d)) {
      grouped.get(key)!.distances.push(d)
    }
  }

  // Calculate nearest centroid / minimum distance per sign
  const candidates: { label: string; distance: number }[] = []
  for (const [, item] of grouped) {
    if (item.distances.length === 0) continue
    // Use top-k nearest distances average
    const sorted = [...item.distances].sort((a, b) => a - b)
    const k = Math.min(3, sorted.length)
    const avgDist = sorted.slice(0, k).reduce((s, v) => s + v, 0) / k
    candidates.push({ label: item.label, distance: avgDist })
  }

  candidates.sort((a, b) => a.distance - b.distance)
  const best = candidates[0]
  if (!best || best.distance > MAX_MATCH_DISTANCE) return null

  const second = candidates[1]
  const margin = second ? Math.max(0, (second.distance - best.distance) / Math.max(second.distance, 1e-6)) : 1.0
  if (second && margin < 0.16) return null
  const confidence = Math.max(0, Math.min(0.99, 1 - best.distance / MAX_MATCH_DISTANCE))

  return { label: best.label, confidence, margin }
}
