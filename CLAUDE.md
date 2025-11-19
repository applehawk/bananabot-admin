# Claude Development Guidelines

## Package Management

### ⚠️ IMPORTANT: Use pnpm Only

This project uses **pnpm** as the package manager. **Do NOT use npm or yarn.**

#### Installing packages

```bash
# ✅ Correct way to add packages
pnpm add package-name
pnpm add -D package-name

# ❌ DO NOT USE
npm install package-name
yarn add package-name
```

#### Why pnpm?

- **Content-addressable storage** - packages are stored once globally
- **Faster installations** - hard links instead of copying files
- **Strict node_modules** - prevents phantom dependencies
- **Better monorepo support** - efficient workspace management
- **Disk space efficiency** - saves gigabytes of disk space

#### Common Commands

```bash
# Install all dependencies
pnpm install

# Add a production dependency
pnpm add chart.js react-chartjs-2

# Add a development dependency
pnpm add -D @types/node typescript

# Remove a package
pnpm remove package-name

# Update all packages
pnpm update

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Development Workflow

1. **Always use pnpm** for package management
2. Run `pnpm install` after pulling changes
3. Use `pnpm add` to add new dependencies
4. Never manually edit package.json to add packages
5. Commit both package.json and pnpm-lock.yaml

## Troubleshooting

If you encounter issues with pnpm:

```bash
# Clear pnpm cache
pnpm store prune

# Remove node_modules and reinstall
rm -rf node_modules
pnpm install

# Update pnpm itself
npm install -g pnpm@latest
```
