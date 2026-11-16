export interface SignExample { label: string; features: number[]; createdAt: string }

const KEY = 'signbridge-personal-sign-examples'
export const MIN_EXAMPLES_PER_SIGN = 5
const MAX_MATCH_DISTANCE = 0.2

function canonicalLabel(label: string): string {
  return label.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase()
}

export function loadSignExamples(): SignExample[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) || '[]')
    if (!Array.isArray(value)) return []
    return value.filter((item): item is SignExample => item && typeof item.label === 'string' && canonicalLabel(item.label).length > 0 && canonicalLabel(item.label).length <= 40 && Array.isArray(item.features) && item.features.length === 126 && item.features.every(Number.isFinite)).map(item => ({ ...item, label: item.label.normalize('NFKC').trim().replace(/\s+/g, ' ') })).slice(-500)
  } catch {
    return []
  }
}

export function saveSignExample(label: string, features: number[]): SignExample[] {
  const cleanedLabel = label.normalize('NFKC').trim().replace(/\s+/g, ' ')
  if (!cleanedLabel || cleanedLabel.length > 40) throw new Error('Enter a sign label between 1 and 40 characters.')
  if (features.length !== 126 || features.some(value => !Number.isFinite(value))) throw new Error('The camera did not produce a valid hand sample. Try capturing again.')
  const next = [...loadSignExamples(), { label: cleanedLabel, features, createdAt: new Date().toISOString() }].slice(-500)
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
    return next
  } catch {
    throw new Error('This browser could not save the sample. Check available storage and try again.')
  }
}

export function clearSignExamples(): void {
  localStorage.removeItem(KEY)
}

export function deleteSignExamples(label: string): SignExample[] {
  const key = canonicalLabel(label)
  const next = loadSignExamples().filter(example => canonicalLabel(example.label) !== key)
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
    return next
  } catch {
    throw new Error('This browser could not update your saved signs. Check available storage and try again.')
  }
}

export function exampleCounts(examples: SignExample[]): Record<string, number> {
  return examples.reduce<Record<string, number>>((counts, sample) => {
    const key = canonicalLabel(sample.label)
    counts[key] = (counts[key] || 0) + 1
    return counts
  }, {})
}

export function predictPersonalSign(examples: SignExample[], features: number[]): { label: string; confidence: number } | null {
  const groups = new Map<string, number[][]>()
  for (const sample of examples) {
    const key = canonicalLabel(sample.label)
    groups.set(key, [...(groups.get(key) || []), sample.features])
  }
  const eligible = [...groups.entries()].filter(([, vectors]) => vectors.length >= MIN_EXAMPLES_PER_SIGN)
  if (eligible.length < 1 || features.length !== 126 || features.every(value => value === 0) || features.some(value => !Number.isFinite(value))) return null

  const distances = eligible.map(([label, vectors]) => {
    const nearest = vectors.map(vector => Math.sqrt(features.reduce((sum, value, index) => sum + (value - vector[index]) ** 2, 0) / features.length))
      .sort((a, b) => a - b)
      .slice(0, Math.min(3, vectors.length))
    return { label, distance: nearest.reduce((sum, value) => sum + value, 0) / nearest.length }
  }).sort((a, b) => a.distance - b.distance)

  const best = distances[0]
  if (best.distance > MAX_MATCH_DISTANCE) return null
  if (distances.length === 1) {
    const confidence = Math.max(0, 1 - best.distance / MAX_MATCH_DISTANCE)
    return { label: best.label, confidence }
  }

  const second = distances[1]
  const confidence = Math.max(0, 1 - best.distance / Math.max(second.distance, 1e-6))
  return confidence >= 0.15 ? { label: best.label, confidence: Math.min(confidence, 0.99) } : null
}
