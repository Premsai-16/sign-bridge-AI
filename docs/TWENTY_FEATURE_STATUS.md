# Twenty-feature implementation tracker

This is an implementation inventory, not a claim that all features are verified.

| # | Upgrade | Current status / remaining work |
|---|---|---|
|1|Login|Unified email OTP; Google enabled in Supabase, callback allowed; full Google sign-in round trip verified in the local browser. Typo checks and delivery wording improved. Callback intent captured before SDK initialization; three callback regression tests pass.|
|2|Onboarding|Profile form with required name and optional support preferences; blank names rejected.|
|3|Welcome|Automatic personalized greeting in the preferred language, no comma or welcome button. One utterance per visit/account/name/language, silent preference respected; blocked autoplay retries once on ordinary interaction. Six additional welcome/speech tests pass. Device voice availability remains a real-device requirement.|
|4|Bilingual interface|Navigation plus key profile, welcome, camera, caption, Text & Speech, lesson, zoom and voice controls translated into Kannada, Tamil, Telugu and Hindi; explanatory text and full-page localization remain. Native-speaker review needed.|
|5|Preferences|Account-scoped saves; pending-save status corrected; unrelated profile edits preserve conversation language.|
|6|Mobile camera|Larger contain-fit preview, correct rear-camera mirroring, fullscreen button added. Physical device verification remains.|
|7|Camera readiness|Hand overlay plus collapsible hand-visibility and low-light guidance implemented. Lighting sampled on-device every two seconds; device validation remains.|
|8|Recognition feedback|Active tracking and confidence display exist. Measured latency optimization remains.|
|9|Uncertainty|Recognition thresholds exist; systematic unknown-sign testing remains.|
|10|Editable conversation|Consecutive same-speaker messages merge into editable paragraphs; speaker changes, corrected turns, and pauses stay separate. Three regression tests pass.|
|11|Repeat prevention|Elapsed-time stability gate with 250 ms release tolerance; four tests cover transients, held signs, brief dropouts, intentional repeats, and changing words. Personal recording suppresses recognition output. Physical signing verification remains.|
|12|Two-way conversation|Camera and speech/text tools exist. Text & Speech now includes all five output languages, separate partner-caption language, saved mute/rate preferences, microphone teardown, explicit error feedback, bounded 200-message history and honest clipboard status. Captured partner speech retains its original language for replay. Real mic/browser testing remains.|
|13|Translation|Automatic translation integration exists. Backend merges identical in-flight requests, caches validated results in memory for up to ten minutes, and caps provider work at four concurrent calls per worker. Three tests cover sharing, recovery and overload. Native-script text bypasses unnecessary English translation, covered by a regression test. Newly trained vocabulary and language coverage require live verification.|
|14|Voice controls|Speech library and controls exist; installed-voice and mobile playback tests remain.|
|15|Emergency|Emergency route restored and preferred-language translation implemented. Language-keyed translations prevent stale phrases after switching language. Offline and speech behavior require testing.|
|16|Personal signs|Personal examples and deletion exist; MAX_PERSONAL_SIGNS is five. Account save isolation tests pass; live personal-sign recognition still requires testing.|
|17|Training quality|Training/validation sample and signer counts exist; Failed uploads retain video and landmark frames for retry in the open tab. Stable upload identifiers prevent duplicate examples on retry, covered by a backend test. Full five-second collection is evenly sampled to the 60-frame API limit; two regression tests cover endpoint preservation and short clips. Real-camera interruption testing remains.|
|18|Validation|Held-out metrics and rollback exist; validation is currently recommended, not a publication requirement.|
|19|Learning|Alphabet closeups plus A–Z recall practice, revealable official reference, review priority and account-saved self-assessment progress implemented. Accessible image zoom dialog (100–300%), previous/next, Escape and focus return verified in the signed-in browser. Practice completion is an explicit self-check; changing learning tabs stops the camera. Automated signing assessment remains.|
|20|Consistent design|Shared styles exist; full responsive/accessibility review remains. Route-level lazy loading added. Canvas animation pauses in hidden tabs and honors OS/account reduced-motion preferences. Lint now passes without warnings.|

Verified in this work: production build, all 35 frontend tests (camera races, conversation turns, speech/translation), and all 25 backend tests. Added render-error recovery and online save retry. Camera starts now reject stale permission responses, switching releases the old stream, and playback failures release the camera.
Not verified: 2,000–5,000 concurrent users, universal device support, recognition accuracy.

Browser smoke check: email sign-in, enabled Google button, and owner portal fields render at localhost:5173/login. A signed-in workspace subsequently became available: letter J selection, enlargement, 150% zoom, Escape dismissal and focus return passed browser checks. Production build passes; lint passes with no warnings. Bundle-size warning remains (~525 KB main JavaScript).

Latest learning fixes: contain-fit portrait-friendly practice preview and matching overlay dimensions; camera failures displayed; unsupported phrase practice buttons no longer silently select an unrelated sign. Number learning now includes official 0–9 crops, enlarged zoom views, the official number video, and separate account-saved recall practice. Source attribution is included. Number 9 selection, enlargement to 150%, disabled Next at the endpoint, Escape and focus return subsequently passed signed-in browser checks. Shared avatar pose constants moved to their own module without changing pose data.

28 November follow-up: restarted the local API with the upload-id migration and retry handling. Lint has zero warnings. The main bundle remains above the 500 KB advisory. Full-page bilingual localization, physical-device voice/camera testing, recognition validation and high-concurrency deployment remain open; these changes do not certify 100% recognition accuracy or 5,000-user capacity.

Latest verification and hardening:
- Owner sessions are hashed and persisted in the database, expire after 24 hours, revoke on logout and invalidate when owner credentials change.
- Published models use a bounded response cache and ETags; unchanged clients receive 304 responses.
- Exact competing recognition templates, malformed frames and empty input now reject rather than choosing an arbitrary sign. Synthetic tests pass; real signer accuracy remains unverified.
- Settings now includes user-initiated camera, voice and API checks, corrected reduced-motion styling, broader data export and explicit account-saved-content deletion wording.
- Browser checks: Google returned to the signed-in home; personalized greeting appeared without comma or play button; camera produced 1280×720; Tamil had one installed voice and reported playback started. Audibility is not verified. The 390×844 Live Studio layout puts the language selector and camera first; viewport was restored.
- Live translation of umbrella returned native-script results in Kannada, Telugu and Hindi, but an unrelated Tamil sentence. Added a conservative short-label expansion guard to reject this response. This does not establish semantic accuracy of arbitrary translations; the free provider remains a limitation.
- Production build and lint pass. Main JavaScript chunk remains approximately 527 KB.
