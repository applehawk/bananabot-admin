
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Available models:', Object.keys(prisma));
    // Also try to check specific keys if they exist in $dmmf if exposed, but keys is usually enough for top-level delegates
    // Actually runtime delegates might be lazy getters.
    // Let's print known ones.
    console.log('fSMVersion:', !!prisma.fSMVersion);
    console.log('fsmVersion:', !!(prisma as any).fsmVersion);
    console.log('FSMVersion:', !!(prisma as any).FSMVersion);
}

main()
    .finally(() => prisma.$disconnect());
