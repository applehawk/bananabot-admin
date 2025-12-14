import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'bot';
    const linesToFetch = parseInt(searchParams.get('lines') || '100');

    // Determine log file path
    // In Docker, it's /app/logs. Locally, it might be ../logs relative to admin panel root?
    // Let's assume standard Docker path /app/logs, or fallback to relative path for local dev.

    let logDir = '/app/logs';
    if (process.env.NODE_ENV !== 'production') {
        // Local development fallback: try to find the logs folder adjacent to bananabot-admin
        // bananabot-admin is at root/bananabot-admin. logs is at root/logs.
        logDir = path.join(process.cwd(), '../logs');
    }

    const filename = type === 'admin' ? 'admin.log' : 'bot.log';
    const filePath = path.join(logDir, filename);

    if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: 'Log file not found', path: filePath }, { status: 404 });
    }

    try {
        // Read the file. specific "tail" implementation for efficiency could be complex.
        // For now, read the whole file (or last N bytes) and parse lines.
        // If file is huge, reading whole file is bad.
        // Let's allow reading last 500KB.

        const stats = fs.statSync(filePath);
        const fileSize = stats.size;
        const bufferSize = Math.min(500 * 1024, fileSize); // Max 500KB
        const buffer = Buffer.alloc(bufferSize);

        const fd = fs.openSync(filePath, 'r');
        fs.readSync(fd, buffer, 0, bufferSize, fileSize - bufferSize);
        fs.closeSync(fd);

        const content = buffer.toString('utf-8');
        const lines = content.split('\n');

        // Take last N lines, filtering out empty ones
        const logs = lines
            .filter(line => line.trim().length > 0)
            .slice(-linesToFetch);

        return NextResponse.json({ logs });
    } catch (error) {
        logger.error('Error reading log file', { error });
        return NextResponse.json({ error: 'Failed to read logs' }, { status: 500 });
    }
}
