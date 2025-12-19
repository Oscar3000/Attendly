#!/bin/sh

# Exit on any error
set -e

echo "🚀 Starting Attendly application..."

# Validate required secrets are provided
required_vars="DATABASE_URL"
for var in $required_vars; do
    if [ -z "$(eval echo \$$var)" ]; then
        echo "❌ Error: Required secret $var is not set"
        echo "💡 Ensure all secrets are provided via environment variables"
        exit 1
    fi
done

echo "✅ Required secrets validated"

# Dynamic environment setup
if [ "$NODE_ENV" = "production" ]; then
    echo "🏭 Production mode detected"
    export NEXT_TELEMETRY_DISABLED=1
elif [ "$NODE_ENV" = "staging" ]; then
    echo "🧪 Staging mode detected"
else
    echo "🛠️ Development mode detected"
fi

# Wait for database connection with enhanced retry logic
echo "🔄 Waiting for database connection..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if npx prisma db push --skip-generate > /dev/null 2>&1; then
        echo "✅ Database connection successful"
        break
    fi
    
    attempt=$((attempt + 1))
    echo "⏳ Database not ready (attempt $attempt/$max_attempts)..."
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo "❌ Failed to connect to database after $max_attempts attempts"
    echo "💡 Check your DATABASE_URL and ensure the database is running"
    exit 1
fi

# Run database migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy || {
    echo "❌ Database migration failed"
    exit 1
}

# Verify Prisma client
echo "🔧 Verifying Prisma client..."
npx prisma generate || {
    echo "❌ Prisma client generation failed"
    exit 1
}

echo "🎉 Database setup completed successfully!"

# Start the Next.js application
echo "🌟 Starting Next.js application on port ${PORT:-3000}..."
exec node server.js