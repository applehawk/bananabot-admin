# ==========================================
# STAGE 1: Base Image
# Общий базовый образ для всех этапов админки.
# ==========================================
FROM oven/bun:latest AS base
WORKDIR /app

# ==========================================
# STAGE 2: Dependencies
# Установка ВСЕХ зависимостей (включая dev) для сборки.
# ==========================================
FROM base AS deps
# Копируем только файлы манифеста для кэширования.
COPY package.json bun.lock* ./

# Использование '--frozen-lockfile' гарантирует воспроизводимость сборок.
# '--frozne-lockfile' если оставить, я получаю 
# 0.232 bun install v1.3.5 (1e86cebd)                                                    
# 9.141 error: Integrity check failed for tarball: date-fns                              
# 16.71 error: IntegrityCheckFailed extracting tarball from date-fns                     
# ------                                                                                 
# target bot: failed to solve: process "/bin/sh -c bun install --frozen-lockfile" did not complete successfully: exit code: 1
RUN bun install

# ==========================================
# STAGE 3: Builder
# Сборка Next.js приложения.
# ==========================================
FROM base AS builder

# Копируем зависимости из предыдущего этапа.
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Аргументы сборки для публичных переменных окружения Next.js.
ARG NEXT_PUBLIC_BOT_USERNAME
ENV NEXT_PUBLIC_BOT_USERNAME=$NEXT_PUBLIC_BOT_USERNAME

# Генерация Prisma Client.
RUN bunx prisma generate --schema=./prisma/schema.prisma

# Сборка Next.js.
# В next.config.ts должно быть включено 'output: "standalone"'.
# Это создает минимальный набор файлов для работы в продакшене.
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# ==========================================
# STAGE 4: Runner
# Финальный легковесный образ.
# ==========================================
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# [БЕЗОПАСНОСТЬ]: Создание non-root пользователя.
RUN groupadd -g 1001 nodejs && \
  useradd -u 1001 -g nodejs -m -s /bin/bash nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Копируем node_modules для поддержки скриптов (например, create-admin.ts)
# Standalone сборка включает только минимальные зависимости для runtime,
# но скриптам нужны дополнительные пакеты (@prisma/adapter-pg, bcryptjs и т.д.)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Копируем файлы Prisma и конфигурации.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/scripts/docker-entrypoint.sh /usr/local/bin/

# Подготовка логов и прав доступа.
RUN mkdir -p /app/logs && \
  chmod +x /usr/local/bin/docker-entrypoint.sh && \
  chown -R nextjs:nodejs /app

USER nextjs

# Health check для API админки.
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD bun -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

ENTRYPOINT ["docker-entrypoint.sh"]

# В режиме standalone запуск идет через server.js.
CMD ["bun", "run", "server.js"]
