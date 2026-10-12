# ==============================================================
# Stage 1: Build the Angular Frontend
# ==============================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend-angular

# Copy frontend dependency definitions
COPY frontend-angular/package*.json ./

# Install npm dependencies (use npm ci if package-lock exists, fallback to npm install)
RUN npm ci || npm install

# Copy Angular source files
COPY frontend-angular/ ./

# Build production bundle
RUN npm run build

# Extract the compiled assets into /app/dist-static
# Handles both Angular 17 application builder (/browser) and legacy output paths
RUN mkdir -p /app/dist-static && \
    if [ -d "dist/lumi-ai/browser" ]; then \
        cp -r dist/lumi-ai/browser/* /app/dist-static/; \
    elif [ -d "dist/lumi-ai" ]; then \
        cp -r dist/lumi-ai/* /app/dist-static/; \
    fi

# ==============================================================
# Stage 2: Python FastAPI Backend & Unified Static Server
# ==============================================================
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=10000 \
    STATIC_DIR=/app/static

WORKDIR /app

# Install system dependencies (build tools for native modules, audio processing, curl)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    ffmpeg \
    flac \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python backend dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application source files
COPY . .

# Copy compiled Angular frontend from frontend-builder stage
COPY --from=frontend-builder /app/dist-static /app/static

# Expose the default port (Render injects $PORT at runtime, defaults to 10000)
EXPOSE 10000

# Health check configuration for Render and container orchestrators
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:${PORT:-10000}/healthz || exit 1

# Start Uvicorn ASGI server binding to 0.0.0.0 and Render's injected $PORT
CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PORT:-10000}"]
