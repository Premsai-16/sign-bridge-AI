# Model Card: SignBridge Experimental ISL Classifier

## 1. Model Details

- **Model Type**: Landmark Centroid Classifier (Euclidean distance with cosine similarity verification)
- **Hand Feature Extractor**: MediaPipe Hand Landmarker compiled to WebAssembly (WASM), running on-device in the browser client
- **Input Representation**: 21 3D hand coordinates (x, y, z) normalized relative to wrist origin and hand scale
- **Target Language**: Indian Sign Language (ISL) isolated signs
- **Vocabulary Source**: Owner-curated and published prototype vocabulary + optional private client-side family gestures
- **Version Control**: Versioned published model artifacts (`published-model.json`) with automated backup of up to 20 past releases and instantaneous rollback capability

---

## 2. Intended Use

- **Primary Goal**: Facilitate two-way conversation between Deaf/Hard-of-Hearing individuals and hearing non-signers by recognizing isolated sign poses and converting them into editable draft sentences for speech synthesis.
- **Audience**: Individuals, families, educational groups, healthcare providers, and community workers interacting with ISL signers.
- **Deployment Scope**: Web application with client-side inference on standard desktop and mobile browsers with camera access.

---

## 3. Limitations & Out-of-Scope Use

- **Static vs. Continuous Signing**: The current prototype identifies held or isolated hand poses. It does not transcribe continuous sign streaming, complex facial grammar, lip patterns, or body movement.
- **Lighting & Camera Angles**: Recognition accuracy depends on clear lighting, hand visibility within the camera viewport, and minimal visual obstruction.
- **Out-of-Vocabulary Signs**: While distance thresholds reject uncertain poses, similar unseen gestures can occasionally be misclassified.
- **Safety-Critical Contexts**: SignBridge is an assistive communication aid; it is **not** a certified legal, medical, or emergency sign language interpreter.

---

## 4. Training Data & Dataset Governance

- **Explicit Consent**: All owner-recorded video samples require informed consent before recording.
- **Storage Boundaries**:
  - Regular visitor camera feeds are processed strictly in-browser via WASM and are never uploaded or recorded.
  - Consented owner training clips are stored in a private server directory accessible only by authenticated administrators.
  - Personal custom signs remain stored in local storage or encrypted account sync.
- **Dataset Curation**: The owner platform enforces participant coding and train/validation splits to ensure unbiased model updates.
- **Data Erasure**: Deleting an example or label completely removes the landmark entries, recalculates model centroids, and permanently purges stored video clips.

---

## 5. Evaluation & Performance

- **Evaluation Metric**: Cross-signer held-out accuracy and vocabulary coverage across distinct participant codes.
- **Prototypes vs. Field Deployment**: The owner console reports validation accuracy on the collected dataset. We advise thorough field trials with native Deaf ISL signers and accessibility advocates prior to production rollouts.

---

## 6. Ethical Considerations & Responsible AI

- Inclusivity and user agency are central: recognized signs are held in an editable draft buffer, allowing users to correct or amend messages before speech synthesis.
- Audio and speech captions are user-controlled, ensuring signers and speaking partners retain full oversight over the communication flow.
