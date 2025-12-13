import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const users = await prisma.user.findMany({
            where: {
                reservedCredits: {
                    gt: 0,
                },
            },
            select: {
                id: true,
                telegramId: true,
                username: true,
                firstName: true,
                reservedCredits: true,
            },
            orderBy: {
                reservedCredits: "desc",
            },
        });

        // Serialize BigInt
        const safeUsers = users.map((user) => ({
            ...user,
            telegramId: user.telegramId.toString(),
        }));

        return NextResponse.json(safeUsers);
    } catch (error) {
        console.error("Failed to fetch reserved credits:", error);
        return NextResponse.json(
            { error: "Failed to fetch users" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userIds } = body;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return NextResponse.json(
                { error: "Invalid user IDs provided" },
                { status: 400 }
            );
        }

        // Release credits (set to 0)
        await prisma.user.updateMany({
            where: {
                id: {
                    in: userIds,
                },
            },
            data: {
                reservedCredits: 0,
            },
        });

        return NextResponse.json({ success: true, count: userIds.length });
    } catch (error) {
        console.error("Failed to release credits:", error);
        return NextResponse.json(
            { error: "Failed to release credits" },
            { status: 500 }
        );
    }
}
