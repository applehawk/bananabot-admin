import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const args = process.argv.slice(2);
    const username = args[0];
    const password = args[1];
    const telegramId = args[2] ? BigInt(args[2]) : undefined;

    if (!username || !password) {
        console.error("Usage: npx tsx scripts/create-admin.ts <username> <password> [telegramId]");
        process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const admin = await prisma.adminUser.create({
            data: {
                username,
                password: hashedPassword,
                ...(telegramId && { telegramId }),
                role: "ADMIN",
            },
        });

        console.log(`Admin user created: ${admin.username} (${admin.id})`);
    } catch (e) {
        console.error("Error creating admin user:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
