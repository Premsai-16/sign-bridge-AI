FROM node:22-slim AS frontend
WORKDIR /build
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG SUPABASE_URL
ARG SUPABASE_ANON_KEY
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN VITE_API_URL="" VITE_SUPABASE_URL="${VITE_SUPABASE_URL:-$SUPABASE_URL}" VITE_SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY:-$SUPABASE_ANON_KEY}" npm run build

FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/app ./app
COPY --from=frontend /build/dist ./static
ENV FRONTEND_DIST=/app/static
EXPOSE 10000
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000}"]
