# Build stage
FROM oven/bun:1 AS builder

# Set working directory
WORKDIR /app

# Copy package files
# We copy pnpm-lock.yaml if it exists just in case, but we might ignore it
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
# Allow bun to migrate pnpm-lock.yaml to bun.lockb to resolve specific versions
RUN bun install --no-frozen-lockfile

# Copy prisma submodule (schema and migrations)
COPY prisma ./prisma

# Generate Prisma Client
RUN bunx prisma generate --schema=./prisma/schema.prisma

# Copy source code
COPY . .

# Build arguments for Next.js public env vars
ARG NEXT_PUBLIC_BOT_USERNAME
ENV NEXT_PUBLIC_BOT_USERNAME=$NEXT_PUBLIC_BOT_USERNAME

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# Production stage
FROM oven/bun:1 AS runner

WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user
# Debian syntax
RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -m -s /bin/bash nextjs

# Copy necessary files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/scripts ./scripts

# Switch to non-root user
USER nextjs

# Expose the port Next.js runs on
EXPOSE 3001

# Set the port and hostname environment variables
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# Health check
# Use bun for healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD bun -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application with Prisma migrations
# Use bunx/bun for execution
CMD ["sh", "-c", "bunx prisma migrate deploy --schema=./prisma/schema.prisma && bun run start"]
