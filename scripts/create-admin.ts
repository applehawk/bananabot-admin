import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const username = 'admin';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log(`Creating/Updating admin user: ${username}`);

    const admin = await prisma.adminUser.upsert({
        where: { username },
        update: {
            password: hashedPassword,
        },
        create: {
            username,
            password: hashedPassword,
            role: 'ADMIN',
        },
    });

    console.log(`✅ Admin user created/updated.`);
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
