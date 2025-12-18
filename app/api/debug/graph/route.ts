
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // In Docker, 'bot' is the hostname of the bot container. Port is 3000.
        // Locally, if running outside docker, might need localhost:3000.
        // We can use an ENV or default to http://bot:3000 as priority for Docker.
        const botUrl = process.env.BOT_INTERNAL_URL || 'http://bot:3000';

        // We can also try to fallback or check NODE_ENV. 
        // If we assume this runs in the admin container, http://bot:3000 is correct for docker-compose.

        const res = await fetch(`${botUrl}/debug/graph`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!res.ok) {
            return NextResponse.json({ error: "Failed to fetch from bot" }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Debug Proxy Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
