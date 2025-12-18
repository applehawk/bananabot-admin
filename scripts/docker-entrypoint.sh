#!/bin/sh
set -e

echo "Detailed Schema Check:"
cat ./prisma/schema.prisma | head -n 12

echo "Starting application..."
exec "$@"
