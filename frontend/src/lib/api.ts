const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

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
