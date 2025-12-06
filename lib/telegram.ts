
export async function sendTelegramMessage(chatId: string | number, text: string): Promise<{ success: boolean; error?: string }> {
    const botToken = process.env.BOT_TOKEN;
    if (!botToken) {
        console.warn('BOT_TOKEN is not defined in environment variables');
        return { success: false, error: 'Configuration error: BOT_TOKEN missing' };
    }

    try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'HTML',
            }),
        });

        const data = await response.json();

        if (!data.ok) {
            console.error('Telegram API error:', data);
            return { success: false, error: data.description || 'Unknown Telegram API error' };
        }

        return { success: true };
    } catch (error) {
        console.error('Network error sending Telegram message:', error);
        return { success: false, error: 'Network error' };
    }
}
