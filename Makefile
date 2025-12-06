.PHONY: help install dev build start lint clean clean-all seed

# Default target
help:
	@echo "BananaBot Admin Panel - Available commands:"
	@echo "  make install        - Install dependencies using pnpm"
	@echo "  make dev            - Run in development mode (port 3001)"
	@echo "  make build          - Build for production"
	@echo "  make start          - Start in production mode"
	@echo "  make lint           - Run linter"
	@echo "  make seed           - Seed database with test packages"
	@echo "  make clean          - Remove build artifacts and cache"
	@echo "  make clean          - Remove build artifacts and cache"
	@echo "  make clean-all      - Remove everything (build, deps, cache)"
	@echo "  make prisma-generate - Generate Prisma Client"

# Generate Prisma Client
prisma-generate:
	@echo "Generating Prisma Client..."
	pnpm prisma generate
	@echo "✓ Prisma Client generated"

# Apply pending migrations (deploy)
migrate-deploy:
	@echo "Applying pending migrations..."
	export $$(grep -v '^#' .env | xargs) && export DATABASE_URL=$$(echo $$DATABASE_URL | sed 's/postgres:5432/localhost:5432/') && pnpm prisma migrate deploy
	@echo "✓ Migrations applied"

# Install dependencies
install:
	@echo "Installing dependencies with pnpm..."
	pnpm install
	@echo "✓ Dependencies installed"

# Run in development mode
dev:
	@echo "Starting admin panel in development mode..."
	pnpm run dev

# Build for production
build:
	@echo "Building admin panel for production..."
	pnpm run build
	@echo "✓ Build complete"

# Start in production mode
start:
	@echo "Starting admin panel in production mode..."
	pnpm start

# Run linter
lint:
	@echo "Running linter..."
	pnpm run lint

# Seed database
seed:
	@echo "Seeding database with test packages..."
	pnpm run seed
	@echo "✓ Database seeded"

# Clean build artifacts and cache
clean:
	@echo "Cleaning build artifacts and cache..."
	rm -rf .next
	rm -rf out
	find . -name ".DS_Store" -type f -delete
	find . -name "._*" -type f -delete
	find . -name "*.log" -type f -delete
	@echo "✓ Clean complete"

# Remove everything including dependencies
clean-all: clean
	@echo "Removing node_modules..."
	rm -rf node_modules
	@echo "✓ Deep clean complete"

# Fresh install
fresh: clean-all install build
	@echo "✓ Fresh installation complete"
