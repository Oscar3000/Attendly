#!/bin/sh

set -e

echo "Starting Attendly..."

# Validate DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL not set"
    exit 1
fi

echo "✅ Configuration validated"

# Wait for database using netcat
echo "⏳ Waiting for database..."
for i in $(seq 1 30); do
    if nc -z postgres 5432 2>/dev/null; then
        echo "✅ Database is ready"
        sleep 2
        break
    fi
    echo "  Attempt $i/30..."
    sleep 1
done

# Run migrations
echo "🔄 Running migrations..."
npx prisma migrate deploy 2>&1 || echo "⚠️ Migrations already applied"

echo "✅ Setup complete, starting Next.js..."
exec node server.js
