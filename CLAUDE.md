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

## Script Execution

### Local Development

When running scripts locally (e.g. in `bananabot-admin/scripts/` folder), you need to provide the `DATABASE_URL` pointing to localhost because the database is running inside Docker but exposed to the host.

```bash
# Run from root directory
DATABASE_URL="postgresql://bananabot:bananabot_secret@localhost:5432/bananabot?schema=public" npx ts-node bananabot-admin/scripts/test-generation-cost.ts
```

### Production (Google Cloud)

For production, you typically need to access the remote instance and then execute scripts inside the running Docker container.

1.  **SSH into the instance**:
    ```bash
    gcloud compute ssh $INSTANCE_NAME
    ```
    *(See `deploy/google.cloud/deploy-bot.sh` for reference)*

2.  **Execute script inside Docker**:
    Once on the VM, use `docker exec` to run the script inside the `bananabot-admin` container.
    ```bash
    # The script is located at /app/scripts/test-generation-cost.ts inside the container
    docker exec -it bananabot-admin npx ts-node scripts/test-generation-cost.ts
    ```
