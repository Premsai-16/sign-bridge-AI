# SignBridge Experimental ISL Recognition

## Model details

- **Shared model:** Owner-trained isolated-sign centroids, published as a versioned JSON file
- **Personal model:** On-device nearest-example matching for private held signs
- **Hand detector:** MediaPipe Hand Landmarker running in the browser
- **Task:** Match a held hand pose to a trained English label
- **Initial state:** No shared vocabulary is bundled; the owner must collect, validate, and publish samples

## Intended use

The public camera page recognizes only labels in the currently published owner model or a visitor's private family vocabulary. Shared training samples are stored by the backend; private family samples remain in the browser. Recognized labels can be assembled into an editable message and spoken as a whole after a short pause or when the visitor submits it.

## Limitations

- The classifier matches still hand landmarks. It does not recognize sign motion, facial expression, body posture, ISL grammar, or continuous sentences.
- It can reject uncertain poses, but cannot reliably detect every out-of-vocabulary sign. Similar trained poses can still be confused.
- Owner examples should include multiple consenting signers, lighting, distance, and camera variation. Held-out metrics are small prototype checks, not a real-world accuracy guarantee.
- Personal signs are signer-, camera-, and lighting-dependent, and are available only in the browser where they were trained.
- This prototype is not an interpreter replacement or suitable for safety-critical communication.

## Data governance

- Camera video is processed in the browser and is not uploaded by recognition.
- With explicit consent, the owner trainer stores the silent camera clip in private backend storage and sends derived hand landmarks plus an anonymous signer code for shared model training. Video clips are available only through the authenticated owner workspace and are deleted with their example.
- With consent, private derived landmarks and labels are stored in browser local storage.
- Session notes are kept in the browser unless the user exports or deletes them.

## Evaluation

No independent SignBridge accuracy results are claimed. The owner console reports held-out signer accuracy and coverage for the collected sample set. Evaluate with consenting ISL signers and Deaf ISL experts before wider use.

## Licensing

See `THIRD_PARTY_NOTICES.md` for third-party model and runtime attribution. User-created examples remain under user control.
