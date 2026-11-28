# Render deployment

Use Docker, repository root build context, `./Dockerfile`, and the `main` branch.
The root multi-stage Dockerfile builds the client and serves it with FastAPI on
Render's PORT. API calls use the same origin; do not point production at localhost.
Client route refreshes return index.html; missing API and asset paths stay 404.

Required environment variables:
- SUPABASE_URL and SUPABASE_ANON_KEY: existing public project URL/publishable key;
  used by the client build and server token verification. Never use a service-role key.
- ADMIN_USERNAME and ADMIN_PASSWORD: runtime-only owner credentials. Enter privately.
- DATABASE_URL: persistent PostgreSQL connection for production account saves.

Allow `https://sign-bridge-ai-jhc7.onrender.com/login` in Supabase Auth redirect URLs.
Use the production origin as Site URL. Keep localhost redirects if development continues.

Free Render local storage is ephemeral: SQLite, trained videos and model files do
not survive all restarts/redeploys. Durable database and private object storage are
required before treating this as a production training service. No paid upgrade
was selected in this repair.

Mobile speech: Start Camera primes a reusable media player during the user's tap.
Common phrases use shipped recordings; custom text needs a compatible installed
voice. Browsers can still require a fresh playback gesture. A physical phone test
is required; desktop emulation does not prove audible playback on iOS/Android.
