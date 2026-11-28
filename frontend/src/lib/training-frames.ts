/** Preserve the beginning and end of a clip while meeting the API frame limit. */
export function sampleTrainingFrames(frames: number[][], limit = 60): number[][] {
  if (!Number.isInteger(limit) || limit < 2) throw new Error('At least two sample frames are required.')
  if (frames.length <= limit) return frames.map(frame => [...frame])
  return Array.from({ length: limit }, (_, index) => [...frames[Math.round(index * (frames.length - 1) / (limit - 1))]])
}
