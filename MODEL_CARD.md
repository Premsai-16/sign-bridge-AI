# Model Card: SignBridge Experimental ISL Recognition

## Model details

- **Published model:** VSRS V1 isolated-sign MLP, exported to JSON for browser inference
- **Personal model:** User-trained held-sign nearest-neighbor matcher
- **Hand detector:** MediaPipe Hand Landmarker, running in the browser
- **Published vocabulary:** cellphone, good, hello, house, I, loud, quiet, red, shoes, teacher, time
- **Version:** 0.3.0 experimental prototype
- **Task:** Isolated sign classification to English labels

## Intended use

The camera page can classify a limited set of 11 isolated signs with the published model, or match held signs to labels taught by the current user. A personal label becomes eligible after at least five captured examples. Single-label matching uses an absolute distance cutoff; adding labels makes unknown-sign rejection more reliable. Recognized labels appear in a live transcript and can be spoken using browser speech synthesis.

## Limitations

- The published classifier knows only its 11 trained classes. Out-of-vocabulary rejection is heuristic.
- Personal enrollment is signer-, camera-, and lighting-dependent.
- Dynamic signs, facial expression, ISL grammar, continuous signing, and sentence-level translation are not supported.
- The publisher describes a small test set; SignBridge has not independently reproduced or validated those results.
- No cross-region, signer-diversity, or real-world accuracy claim is made.
- This prototype is not an interpreter replacement or suitable for safety-critical communication.

## Data governance

- Published model inference runs in the browser. Video and landmarks are not uploaded.
- With explicit opt-in, personal derived landmarks and labels are stored in browser local storage.
- Users can delete personal examples from the recognition page or clear local app data in Settings.

## Evaluation

No SignBridge validation results or accuracy metrics are claimed. Test recognition with consenting ISL signers before any wider use.

## Licensing

User-created examples remain under user control. See `THIRD_PARTY_NOTICES.md` for model and runtime attribution.
