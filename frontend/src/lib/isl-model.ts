export interface IsolatedSignModel {
  name: string
  classes: string[]
  mean: number[]
  scale: number[]
  weights: number[][][]
  biases: number[][]
  activation: 'relu'
  outputActivation: 'softmax'
}

export interface SignPrediction {
  label: string
  confidence: number
  margin: number
}

let modelPromise: Promise<IsolatedSignModel> | null = null

export function loadIsolatedSignModel(): Promise<IsolatedSignModel> {
  if (!modelPromise) {
    modelPromise = fetch('/models/isl_11_sign.json')
      .then(async response => {
        if (!response.ok) throw new Error(`ISL model could not be loaded (${response.status}).`)
        const model = await response.json() as IsolatedSignModel
        const valid = model.classes.length === 11 && model.mean.length === 126 && model.scale.length === 126
          && model.weights.length === 3 && model.biases.length === 3
          && model.weights[0]?.length === 126 && model.weights[0]?.[0]?.length === 256
          && model.weights[1]?.length === 256 && model.weights[1]?.[0]?.length === 128
          && model.weights[2]?.length === 128 && model.weights[2]?.[0]?.length === 11
        if (!valid) throw new Error('The bundled ISL model has an unexpected format.')
        return model
      })
      .catch(error => {
        modelPromise = null
        throw error
      })
  }
  return modelPromise
}

export function predictIsolatedSign(model: IsolatedSignModel, features: number[]): SignPrediction | null {
  if (features.length !== 126 || features.every(value => value === 0) || features.some(value => !Number.isFinite(value))) return null

  let activations = features.map((value, index) => (value - model.mean[index]) / (model.scale[index] || 1))
  for (let layer = 0; layer < model.weights.length; layer += 1) {
    const weights = model.weights[layer]
    const biases = model.biases[layer]
    const next = biases.map((bias, outputIndex) => {
      let value = bias
      for (let inputIndex = 0; inputIndex < activations.length; inputIndex += 1) {
        value += activations[inputIndex] * weights[inputIndex][outputIndex]
      }
      return value
    })
    if (layer < model.weights.length - 1) activations = next.map(value => Math.max(0, value))
    else {
      const max = Math.max(...next)
      const exponents = next.map(value => Math.exp(value - max))
      const total = exponents.reduce((sum, value) => sum + value, 0)
      activations = exponents.map(value => value / total)
    }
  }

  const ranked = activations.map((confidence, index) => ({ label: model.classes[index], confidence }))
    .sort((a, b) => b.confidence - a.confidence)
  const best = ranked[0]
  const second = ranked[1]
  // Open-set rejection: do not turn every out-of-vocabulary hand pose into a word.
  if (best.confidence < 0.62 || best.confidence - second.confidence < 0.18) return null
  return { ...best, margin: best.confidence - second.confidence }
}
