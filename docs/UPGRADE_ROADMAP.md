# Upgrade roadmap and delivery status

The 94-item backlog from the product discussion remains a backlog; no blanket completion is claimed.

## Foundation implemented in this change
- Shared username/password sign-in, user registration, server-determined owner/user routing.
- Owner entry removed from visitor navigation; direct owner URL redirects to shared login when signed out.
- Database-backed user sessions with expiry and revocation. Owner sessions retain existing server-memory behavior.
- Account-scoped server saves for existing preferences, favorites, progress, family sign landmarks, and saved content.
- Save status, retry, sign-out protection, and unsaved-change navigation warning.
- Shared owner vocabulary remains independent of personal account saves.
- Bounded conversation transcript scrolling.

## Next dependency-ordered work
1. Authentication hardening: verified email, password reset/recovery, multi-worker rate limiting, account deletion/export, production HTTPS deployment.
2. Google/Apple OAuth: requires registered provider applications, callback URLs, client credentials, and provider configuration. Do not present inactive buttons as working login.
3. Sync: conflict UI for simultaneous devices, durable offline retry, explicit import of legacy browser data. Existing browser saves are not silently assigned to a new account.
4. Conversation: full fixed workspace, optional paragraph composition, undo, correction, face-to-face mode, robust recognition uncertainty.
5. Owner samples: review/retake, recovery, quality checks, recycle bin, evaluation and release workflow improvements.
6. Learning: reviewed hand-only demonstrations, region/handedness metadata, guided paths. AI hand imagery is illustrative until reviewed; still images do not teach movement.
7. Everyday features: profiles, custom boards, personal sign export/import, offline essentials, favorites polish.
8. Presentation: homepage journey refinements, consistent responsive navigation, accessibility audit, demonstrations.
9. Research: continuous signing, face/body features, independent-signer evaluation, additional sign languages, remote rooms, reviewed text-to-sign.

## Limits
- Google and Apple are not configured.
- Account recovery and production-ready identity operations are not implemented.
- Account data storage has a 5 MB limit; personal landmark data now leaves the browser for account storage, disclosed at registration/sign-in.
- Concurrent changes to the same saved key use last-write-wins; conflict resolution is pending.
- Raw legacy browser data stays untouched and is not imported automatically.
