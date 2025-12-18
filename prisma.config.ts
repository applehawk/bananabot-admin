import { defineConfig } from '@prisma/config';

console.log('Loader Prisma Config (TypeScript Mode)');

export default defineConfig({
    datasource: {
        url: process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost:5432/dummy'
    }
});
