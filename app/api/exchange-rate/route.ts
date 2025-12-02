import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Using exchangerate-api.com free tier (no API key required)
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');

        if (!response.ok) {
            throw new Error('Failed to fetch exchange rate');
        }

        const data = await response.json();
        const usdRubRate = data.rates.RUB;

        return NextResponse.json({
            usdRubRate,
            lastUpdated: data.time_last_updated,
            source: 'exchangerate-api.com'
        });
    } catch (error) {
        console.error('Error fetching exchange rate:', error);

        // Fallback to a reasonable default if fetch fails
        return NextResponse.json({
            usdRubRate: 100,
            error: 'Failed to fetch current rate, using fallback value',
            lastUpdated: new Date().toISOString(),
            source: 'fallback'
        }, { status: 200 });
    }
}
