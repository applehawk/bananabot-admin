# Docker Deployment Guide

Руководство по развертыванию BananaBot Admin Panel с использованием Docker и docker-compose.

## Предварительные требования

- Docker 20.10+
- Docker Compose 2.0+
- Git with submodules support

## Быстрый старт

### 1. Клонирование репозитория с submodules

```bash
git clone --recurse-submodules git@github.com:applehawk/bananabot-admin.git
cd bananabot-admin
```

Если уже клонировали без `--recurse-submodules`:

```bash
git submodule init
git submodule update
```

### 2. Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```bash
# PostgreSQL Configuration
POSTGRES_USER=bananabot
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=bananabot
POSTGRES_PORT=5432

# Admin Panel Configuration
ADMIN_PORT=3001

# Database URL
DATABASE_URL=postgresql://bananabot:your_secure_password_here@postgres:5432/bananabot?schema=public

# Next.js Configuration
NODE_ENV=production
```

### 3. Запуск с Docker Compose

```bash
# Сборка и запуск всех сервисов
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановка сервисов
docker-compose down

# Остановка с удалением volumes (БД будет удалена!)
docker-compose down -v
```

### 4. Проверка работоспособности

Откройте в браузере:
- Admin Panel: http://localhost:3001
- Health Check: http://localhost:3001/api/health

## Работа с Prisma

### Инициализация базы данных

При первом запуске миграции применяются автоматически. Если нужно применить вручную:

```bash
# Войти в контейнер
docker-compose exec admin sh

# Применить миграции
cd prisma && pnpm migrate
```

### Создание новой миграции

```bash
cd prisma
pnpm migrate:dev --name your_migration_name
```

### Prisma Studio

Для просмотра данных в БД:

```bash
cd prisma
pnpm studio
```

## Структура проекта

```
bananabot-admin/
├── prisma/                 # Git submodule с shared Prisma schema
│   ├── schema.prisma
│   ├── migrations/
│   └── package.json
├── app/                    # Next.js App Router
├── Dockerfile              # Multi-stage Docker build
├── docker-compose.yml      # PostgreSQL + Admin Panel
└── .env                    # Environment variables
```

## Deployment на Amvera Cloud

### 1. Добавьте Amvera remote (если еще не добавлен)

```bash
git remote add amvera https://git.msk0.amvera.ru/defg/bananabot-admin
```

### 2. Push в Amvera

```bash
git push amvera main
```

### 3. Настройте переменные окружения в панели Amvera

В панели управления Amvera добавьте:
- `DATABASE_URL` - URL подключения к PostgreSQL
- Другие необходимые переменные из `.env`

## Полезные команды

### Docker

```bash
# Пересборка образов
docker-compose build --no-cache

# Просмотр логов конкретного сервиса
docker-compose logs -f admin
docker-compose logs -f postgres

# Рестарт сервиса
docker-compose restart admin

# Выполнение команды в контейнере
docker-compose exec admin sh
```

### Database

```bash
# Бэкап PostgreSQL
docker-compose exec postgres pg_dump -U bananabot bananabot > backup.sql

# Восстановление из бэкапа
cat backup.sql | docker-compose exec -T postgres psql -U bananabot bananabot
```

## Troubleshooting

### Проблема: Prisma Client не найден

```bash
# Пересоздайте Prisma Client
docker-compose exec admin sh -c "cd prisma && pnpm generate"
```

### Проблема: Миграции не применились

```bash
# Применить миграции вручную
docker-compose exec admin sh -c "cd prisma && pnpm migrate"
```

### Проблема: Submodule не загрузился

```bash
git submodule update --init --recursive
```

## Production Checklist

- [ ] Изменены дефолтные пароли в `.env`
- [ ] DATABASE_URL использует безопасный пароль
- [ ] PostgreSQL доступен только из internal network
- [ ] Настроен HTTPS (через reverse proxy)
- [ ] Настроены регулярные бэкапы БД
- [ ] Health checks работают корректно
- [ ] Логирование настроено

## Ссылки

- **Основной репозиторий:** [applehawk/pb-bananabot](https://github.com/applehawk/pb-bananabot)
- **Prisma Schema:** [applehawk/bananabot-prisma](https://github.com/applehawk/bananabot-prisma)
- **Admin Panel:** [applehawk/bananabot-admin](https://github.com/applehawk/bananabot-admin)
