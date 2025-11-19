# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy prisma submodule (schema and migrations)
COPY prisma ./prisma

# Generate Prisma Client
RUN pnpm prisma generate --schema=./prisma/schema.prisma

# Copy source code
COPY . .

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build

# Production stage
FROM node:20-alpine AS runner

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy package files and node_modules from builder
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules

# Copy Prisma submodule
COPY --from=builder /app/prisma ./prisma


# Copy built Next.js application
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/scripts ./scripts

# Switch to non-root user
USER nextjs

# Expose the port Next.js runs on
EXPOSE 3001

# Set the port and hostname environment variables
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application with Prisma migrations
CMD ["sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema.prisma && pnpm start"]
