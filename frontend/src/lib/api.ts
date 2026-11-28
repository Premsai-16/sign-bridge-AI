const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

async function request<T = Record<string, unknown>>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, init)
  } catch {
    throw new Error('Unable to reach SignBridge. Check that the API server is running.')
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const detail = typeof body?.detail === 'string' ? body.detail : `Request failed (${response.status})`
    throw new Error(detail)
  }

  return response.json() as Promise<T>
}

export const api = {
  translate: (text: string, source: string, target: string, signal?: AbortSignal) => request<{ text: string; provider: string; machine_translated: boolean }>('/api/v1/translation', { method: 'POST', signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, source, target, consent: true }) }),
  getHealth: () => request('/health'),

  getModels: () => request('/api/v1/models'),

  getEnrollmentStatus: () => request('/api/v1/enrollment/status'),

  addExample: (label: string, landmarks: number[], consented: boolean) =>
    request('/api/v1/enrollment/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, landmarks: JSON.stringify(landmarks), consented }),
    }),

  saveTranscript: (content: string, language = 'ISL') =>
    request('/api/v1/transcripts/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, language }),
    }),

  recordConsent: (type: string, granted: boolean, purpose: string) =>
    request('/api/v1/consent/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consent_type: type, granted, purpose, version: '1.0' }),
    }),
}

export interface OwnerExample { id: number; label: string; created_at: string; consented: boolean; dataset_split: 'train' | 'validation'; participant_code: string; num_frames: number; has_video: boolean }
export interface SharedModel { published: boolean; version?: string; labels?: string[]; examples_per_label?: Record<string, number>; centroids?: Record<string, number[]>; templates?: Record<string, number[][][]> }
export interface SharedSignPrediction { label: string; confidence: number; margin: number }
export interface ModelVersion { version: string; created_at: string; labels: string[]; is_active: boolean; validation_metrics?: { validation_examples: number; validation_signers: number; accuracy: number; coverage: number } }

const FEATURE_COUNT = 126
const SEQUENCE_LENGTH = 12

function resampleSequence(sequence: number[][], count: number): number[][] {
  if (sequence.length === count) return sequence
  return Array.from({ length: count }, (_, index) => {
    const position = index * (sequence.length - 1) / (count - 1)
    const start = Math.floor(position)
    const end = Math.min(start + 1, sequence.length - 1)
    const fraction = position - start
    return sequence[start].map((value, feature) => value * (1 - fraction) + sequence[end][feature] * fraction)
  })
}

export function predictSharedSequence(model: SharedModel | null, frames: number[][]): SharedSignPrediction | null {
  if (!model?.published || !model.templates || frames.length < 6 || frames.some(frame => frame.length !== FEATURE_COUNT || frame.some(value => !Number.isFinite(value)))) return null
  if (frames.every(frame => frame.every(value => value === 0))) return null
  const current = resampleSequence(frames.slice(-40), SEQUENCE_LENGTH)
  const recent = resampleSequence(frames.slice(-6), SEQUENCE_LENGTH)
  const ranked = Object.entries(model.templates).map(([label, template]) => {
    // Read v1 models that used a single averaged template, and the current multi-clip kNN format.
    const samples = Array.isArray(template?.[0]?.[0])
      ? template
      : [template as unknown as number[][]]
    const valid = samples.filter(sample => Array.isArray(sample) && sample.length === SEQUENCE_LENGTH && sample.every(frame => Array.isArray(frame) && frame.length === FEATURE_COUNT && frame.every(Number.isFinite)))
    if (!valid.length) return null
    const distances = valid.map(sample => {
      // Stable poses can use recent frames; moving signs retain the full sequence.
      const variation = sample.reduce((sum, frame) => sum + frame.reduce((total, value, index) => total + Math.abs(value - sample[0][index]), 0), 0) / (SEQUENCE_LENGTH * FEATURE_COUNT)
      const observed = variation < 0.015 ? recent : current
      return sample.reduce((sum, target, frameIndex) => {
      const frameDistance = Math.sqrt(observed[frameIndex].reduce((frameSum, value, featureIndex) => frameSum + (value - target[featureIndex]) ** 2, 0) / FEATURE_COUNT)
      return sum + frameDistance
    }, 0) / SEQUENCE_LENGTH
    }).sort((a, b) => a - b).slice(0, 3)
    return { label, distance: distances.reduce((sum, distance) => sum + distance, 0) / distances.length }
  }).filter((item): item is { label: string; distance: number } => item !== null && Number.isFinite(item.distance)).sort((a, b) => a.distance - b.distance)
  const best = ranked[0]
  if (!best || best.distance > 0.2) return null
  const second = ranked[1]
  const margin = second ? Math.max(0, (second.distance - best.distance) / Math.max(second.distance, 1e-6)) : 1
  if (second && margin < 0.16) return null
  return { label: best.label, confidence: Math.max(0, 1 - best.distance / 0.2), margin }
}

export function predictSharedSign(model: SharedModel | null, features: number[]): SharedSignPrediction | null {
  if (!model?.published || !model.centroids || features.length !== 126 || features.every(value => value === 0) || features.some(value => !Number.isFinite(value))) return null
  const ranked = Object.entries(model.centroids).filter(([, center]) => Array.isArray(center) && center.length === FEATURE_COUNT && center.every(Number.isFinite)).map(([label, center]) => ({
    label,
    distance: Math.sqrt(features.reduce((sum, value, index) => sum + (value - center[index]) ** 2, 0) / features.length),
  })).filter(item => Number.isFinite(item.distance)).sort((a, b) => a.distance - b.distance)
  const best = ranked[0]
  if (!best || best.distance > 0.2) return null
  const second = ranked[1]
  const margin = second ? Math.max(0, (second.distance - best.distance) / Math.max(second.distance, 1e-6)) : 1
  if (second && margin < 0.12) return null
  return { label: best.label, confidence: Math.max(0, 1 - best.distance / 0.2), margin }
}

async function ownerRequest<T>(path: string, token?: string, init: RequestInit = {}): Promise<T> {
  const isJsonBody = typeof init.body === 'string'
  return request<T>(path, { ...init, headers: { ...(isJsonBody ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers } })
}

async function fetchOwnerVideo(token: string, id: number): Promise<string> {
  let response: Response
  try {
    response = await fetch(`${API_URL}/api/v1/owner/examples/${id}/video`, { headers: { Authorization: `Bearer ${token}` } })
  } catch { throw new Error('Unable to reach SignBridge. Check that the API server is running.') }
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(typeof body?.detail === 'string' ? body.detail : `Could not load the saved video (${response.status}).`)
  }
  return URL.createObjectURL(await response.blob())
}

export const ownerApi = {
  translations: () => ownerRequest<Record<string, Record<string, string>>>('/api/v1/owner/translations'),
  saveTranslation: (token: string, label: string, language: string, text: string) => ownerRequest<Record<string, Record<string, string>>>('/api/v1/owner/translations', token, { method: 'PUT', body: JSON.stringify({ label, language, text }) }),
  evaluate: (token: string) => ownerRequest<{ validation_metrics: { validation_examples: number; accuracy: number; coverage: number; confusion: Record<string, Record<string, number>> } }>('/api/v1/owner/publish?dry_run=true', token, { method: 'POST' }),
  login: (username: string, password: string) => ownerRequest<{ access_token: string }>('/api/v1/auth/admin/login', undefined, { method: 'POST', body: JSON.stringify({ username, password }) }),
  examples: (token: string) => ownerRequest<OwnerExample[]>('/api/v1/owner/examples', token),
  addExample: (token: string, label: string, frames: number[][], video: Blob, dataset_split: 'train' | 'validation', participant_code: string, upload_id?: string) => {
    const body = new FormData()
    body.set('label', label)
    body.set('frames_json', JSON.stringify(frames))
    body.set('consented', 'true')
    body.set('dataset_split', dataset_split)
    body.set('participant_code', participant_code)
    if (upload_id) body.set('upload_id', upload_id)
    body.set('video', video, video.type.includes('mp4') ? 'sample.mp4' : 'sample.webm')
    return ownerRequest<OwnerExample>('/api/v1/owner/examples', token, { method: 'POST', body })
  },
  exampleVideo: fetchOwnerVideo,
  deleteExample: (token: string, id: number) => ownerRequest(`/api/v1/owner/examples/${id}`, token, { method: 'DELETE' }),
  deleteLabel: (token: string, label: string) => ownerRequest(`/api/v1/owner/labels/${encodeURIComponent(label)}`, token, { method: 'DELETE' }),
  renameLabel: (token: string, label: string, newLabel: string) => ownerRequest<{ label: string; updated_examples: number }>(`/api/v1/owner/labels/${encodeURIComponent(label)}`, token, { method: 'PUT', body: JSON.stringify({ new_label: newLabel }) }),
  publish: (token: string) => ownerRequest<{ published: boolean; version: string; labels: string[]; examples_per_label: Record<string, { train: number; validation: number }>; validation_metrics: ModelVersion['validation_metrics'] }>('/api/v1/owner/publish', token, { method: 'POST' }),
  versions: (token: string) => ownerRequest<ModelVersion[]>('/api/v1/owner/versions', token),
  activateVersion: (token: string, version: string) => ownerRequest(`/api/v1/owner/versions/${encodeURIComponent(version)}/activate`, token, { method: 'POST' }),
  model: () => ownerRequest<SharedModel>('/api/v1/owner/model', undefined, { cache: 'no-store' }),
}
