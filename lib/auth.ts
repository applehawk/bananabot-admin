import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export const authOptions: NextAuthOptions = {
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    providers: [
        CredentialsProvider({
            id: "credentials",
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) {
                    return null;
                }

                const user = await prisma.adminUser.findUnique({
                    where: { username: credentials.username } as any,
                });

                if (!user || !(user as any).password) {
                    return null;
                }

                const isValid = await bcrypt.compare(credentials.password, (user as any).password);

                if (!isValid) {
                    return null;
                }

                return {
                    id: user.id,
                    name: user.username,
                    role: user.role,
                };
            },
        }),
        CredentialsProvider({
            id: "telegram-login",
            name: "Telegram Login",
            credentials: {
                id: { label: "ID", type: "text" },
                first_name: { label: "First Name", type: "text" },
                last_name: { label: "Last Name", type: "text" },
                username: { label: "Username", type: "text" },
                photo_url: { label: "Photo URL", type: "text" },
                auth_date: { label: "Auth Date", type: "text" },
                hash: { label: "Hash", type: "text" },
            },
            async authorize(credentials) {
                if (!credentials?.id || !credentials?.hash || !credentials?.auth_date) {
                    return null;
                }

                const botToken = process.env.TELEGRAM_BOT_TOKEN;
                if (!botToken) {
                    throw new Error("TELEGRAM_BOT_TOKEN is not set");
                }

                // Verify Telegram login
                const dataCheckArr = [];
                for (const [key, value] of Object.entries(credentials)) {
                    if (key !== "hash" && value) {
                        dataCheckArr.push(`${key}=${value}`);
                    }
                }
                dataCheckArr.sort();
                const dataCheckString = dataCheckArr.join("\n");

                const secretKey = crypto.createHash("sha256").update(botToken).digest();
                const hmac = crypto
                    .createHmac("sha256", secretKey)
                    .update(dataCheckString)
                    .digest("hex");

                if (hmac !== credentials.hash) {
                    return null;
                }

                // Check if auth_date is not too old (e.g. 24 hours)
                const authDate = parseInt(credentials.auth_date, 10);
                const now = Math.floor(Date.now() / 1000);
                if (now - authDate > 86400) {
                    return null;
                }

                // Find or create AdminUser
                // Note: We might want to restrict this to existing admins or specific IDs
                // For now, we'll find by telegramId. If not found, we reject login.
                // Or we can allow any valid Telegram user to login but with limited role?
                // The request implies "auth in admin", so likely only allowed users.

                const telegramId = BigInt(credentials.id);

                let user = await prisma.adminUser.findUnique({
                    where: { telegramId },
                });

                if (!user) {
                    // Optional: Auto-create admin if it's the first one or based on a whitelist?
                    // For security, strict mode: only allow existing admins.
                    // But user asked to "make auth", maybe they want to be able to login.
                    // I'll return null if not found, assuming they will seed the DB or manually add.
                    return null;
                }

                return {
                    id: user.id,
                    name: user.username || credentials.username || `User ${credentials.id}`,
                    role: user.role,
                    image: credentials.photo_url,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).role = token.role;
                (session.user as any).id = token.id;
            }
            return session;
        },
    },
};
