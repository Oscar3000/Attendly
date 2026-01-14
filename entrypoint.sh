#!/bin/sh

set -e

echo "Starting Attendly..."

# Validate DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL not set"
    exit 1
fi

echo "✅ Configuration validated"

# Extract database host and port from DATABASE_URL
# Format: postgres://user:password@host:port/database?schema=public
# Extract host (everything between @ and :port or /)
DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^/:]+).*|\1|')
# Extract port (everything between : and /)
DB_PORT=$(echo "$DATABASE_URL" | sed -E 's|.*:([0-9]+)/.*|\1|' | grep -E '^[0-9]+$' || echo "5432")

echo "📡 Database: $DB_HOST:$DB_PORT"

# Wait for database using netcat
echo "⏳ Waiting for database..."
for i in $(seq 1 30); do
    if nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; then
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
