# syntax=docker/dockerfile:1

# ---------- Build frontend ----------
FROM node:20-alpine AS frontend-builder
WORKDIR /app/client
COPY client/package.json client/package-lock.json* ./
RUN npm ci
COPY client/ .
RUN npm run build

# ---------- Runtime image ----------
FROM python:3.11-slim
WORKDIR /app

# Install runtime dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install uvicorn fastapi

# Copy backend source code
COPY backend/app ./app

# Copy built frontend assets
COPY --from=frontend-builder /app/client/dist ./client/dist

# Ensure data directory exists
RUN mkdir -p data

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
