# Capacity and rollout gates

No 2,000–5,000 concurrent-user capacity is claimed or verified.

Implemented in this iteration:
- First-use account preferences and editable profile (optional support information).
- Automatic personalized greeting with preferred-language speech, silent preference and browser-autoplay handling.
- Default language selection without removing conversation selectors.
- Large-text / reduced-motion preferences.
- Taller mobile camera preview, uncropped video, matching landmark coordinates.
- Bounded PostgreSQL connection pool and row locking for account saves.

Required before a large-user launch:
- Complete Supabase provider and OTP setup; verify real delivery and account recovery.
- Owner sessions now persist in the database; replace in-memory rate-limit storage before using multiple API workers.
- Use PostgreSQL, not development SQLite, with pooling sized across all workers.
- Use shared object storage for private recordings and published model artifacts.
- Limit recording uploads and move model publication to background jobs.
- Scale the implemented per-process translation cache and four-call provider limit across workers; validate provider quotas and add shared cross-worker controls.
- Load-test realistic sign-in, saves, vocabulary downloads and training uploads at 100, 500, 2,000 and 5,000 users, with defined latency/error targets.
- Test real iPhone Safari, Android Chrome, Windows browsers and macOS browsers: camera permissions, switching, rotation, video upload and language voice availability.
- Hardware/browser voice quality varies. Missing voices need a tested hosted TTS fallback.

The 20 feature groups remain a backlog. Full bilingual UI, travel packs, complete account centre, remote sign-out, feedback workflows, training-quality features and offline recovery are not all implemented. Interface-language preference controls greetings, defaults, navigation and key account/camera/learning/voice controls, but not every explanatory UI string. Personal support information is optional and stored with account preferences.

## Local load smoke test

`scripts/load_smoke.py` exercised an isolated test server with 100 concurrent requests and 1,000 total read-only health/model requests: all 1,000 returned HTTP 200. Recorded throughput was approximately 2,687 requests/second, p95 270 ms, p99 349 ms. Raw output: `LOCAL_LOAD_SMOKE.json`. This short loopback test uses synthetic model data and excludes authentication, writes, uploads, camera processing, speech and external translation. It is not evidence of 5,000 simultaneous real users.
