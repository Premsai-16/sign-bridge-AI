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
