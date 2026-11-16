# Third-party model and runtime notices

## MediaPipe Tasks Vision

The browser hand-landmark detector uses `@mediapipe/tasks-vision` (Apache-2.0) and its WebAssembly runtime files under `frontend/public/mediapipe/wasm/`.

- Package: https://www.npmjs.com/package/@mediapipe/tasks-vision
- Documentation: https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker

## Hand Landmarker task model

The bundled `frontend/public/models/hand_landmarker.task` is Google's published MediaPipe Hand Landmarker task asset. SHA-256: `fbc2a30080c3c557093b5ddfc334698132eb341044ccee322ccf8bcf3607cde1`.

- Source: https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task
- Task documentation: https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker

This model detects hand landmarks. It is not an ISL sign-classification model. The app's personal held-sign matcher uses examples the user explicitly consents to save in their own browser.

## VSRS V1 isolated-sign classifier

The browser also bundles an exported numeric-weight version of the VSRS V1 11-class MLP classifier at `frontend/public/models/isl_11_sign.json`. It is derived from the model artifact published by Yojit Arora under the MIT license on its Hugging Face model card.

- Model card and source: https://huggingface.co/YojitArora/VSRS-V1-Models
- Downloaded source artifact: `mlp/model.joblib`
- Source artifact SHA-256: `4f13ec96dee5999d2fb6ff8cefbd10d23f80b762ef2ddbe1c7656a5a00b23098`
- The serialized Python artifact was converted to numeric JSON weights using an allowlisted unpickler; it is not loaded by the application at runtime.
- The model supports 11 isolated labels only. It does not provide continuous ISL translation.
