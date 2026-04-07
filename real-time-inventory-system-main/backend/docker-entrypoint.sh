#!/bin/sh
set -eu

echo "Generating Prisma client..."
npx prisma generate

echo "Applying Prisma migrations..."
npx prisma migrate deploy

echo "Starting backend service..."
node dist/server.js
