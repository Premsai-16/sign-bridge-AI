# Verified sign-in setup

Client frontend/.env.local:
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_KEY

Server root .env:
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_PUBLIC_KEY

Never put a service-role key in frontend files.

In Supabase Auth:
- Add http://127.0.0.1:5173/login (and the actual deployed HTTPS /login URL) to the redirect allowlist.
- Configure Google, Apple, and Facebook with their provider credentials and Supabase callback URL.
- Enable email sign-in and configure the email template to include {{ .Token }} for OTP, not just a confirmation link. Configure production SMTP.
- Enable phone sign-in and configure an SMS provider and delivery limits.
- Restart API and frontend after configuration.

Verified Supabase identities are exchanged server-side for local account sessions. Provider subjects are isolated from existing username accounts; accounts are not linked merely because emails match. Social identities never grant owner access. Owner sign-in retains configured owner credentials.

Pending verification: real email delivery, SMS delivery, each OAuth provider, provider cancellation/errors, and deployed redirect URLs. Existing password accounts remain available; this is not an OTP-only enforcement migration.

Sources:
https://supabase.com/docs/reference/javascript/auth-signinwithotp
https://supabase.com/docs/reference/javascript/auth-signinwithoauth
https://supabase.com/docs/guides/auth/phone-login

## Required email verification flow

The main login form now uses a single email → OTP → verified session flow for both
new and returning users. It does not issue a SignBridge account session before
Supabase verifies the code. The owner portal remains a separate password flow.
Both historical local registration/login APIs reject user password sign-in;
previous unverified local account sessions cannot access account saves. Existing
local data is retained, but is not automatically linked to an email identity.
Do not link legacy accounts by an unverified username or email.

Both Supabase email templates (Confirm sign up and Magic link or OTP) must include
`{{ .Token }}`. These were configured in the project dashboard. Delivery is a
separate requirement: the observed `535 5.7.8 Authentication failed` means the
SMTP server rejected the credentials. Brevo showed no generated SMTP key during
inspection. Generate an SMTP key in Brevo and enter it directly in Supabase's
SMTP Password field, using the displayed SMTP Login (not the account password or
an API key). Host is `smtp-relay.brevo.com`, port `587`.

Brevo also displays an authorized-IP restriction for SMTP keys. If a correctly
configured key is still rejected, inspect Brevo's blocked connection events and
authorize only the necessary sending infrastructure; do not disable protections
as a workaround. Confirm the sender is verified, then test both first-time signup
and returning-user OTP delivery. Until that succeeds, delivery is not verified.
