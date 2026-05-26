#!/bin/sh
set -e

echo "[start] Running migrations..."
alembic upgrade head
echo "[start] Migrations done"

echo "[start] Seeding database..."
python -u seed.py || echo "[start] Seed skipped (already seeded or error)"
echo "[start] Seed done"

echo "[start] Starting uvicorn on port ${PORT:-8000}..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
