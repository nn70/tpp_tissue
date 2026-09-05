import { prisma } from "@/lib/prisma";

type CalendarEventInput = {
    userId: string;
    title: string;
    details: string;
    location?: string;
    startsAt: Date;
    endsAt?: Date;
};

async function refreshGoogleAccessToken(accountId: string, refreshToken: string) {
    const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID ?? "",
            client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
            grant_type: "refresh_token",
            refresh_token: refreshToken,
        }),
    });

    if (!res.ok) {
        throw new Error("無法更新 Google Calendar 授權，請重新登入 Google 帳號。");
    }

    const token = await res.json();
    const expiresAt = Math.floor(Date.now() / 1000) + Number(token.expires_in ?? 3600);

    await prisma.account.update({
        where: { id: accountId },
        data: {
            access_token: token.access_token,
            expires_at: expiresAt,
            scope: token.scope,
        },
    });

    return token.access_token as string;
}

async function getGoogleAccessToken(userId: string) {
    const account = await prisma.account.findFirst({
        where: { userId, provider: "google" },
        select: {
            id: true,
            access_token: true,
            refresh_token: true,
            expires_at: true,
            scope: true,
        },
    });

    if (!account?.access_token) {
        throw new Error("尚未取得 Google Calendar 授權，請重新登入 Google 帳號。");
    }

    if (!account.scope?.includes("https://www.googleapis.com/auth/calendar.events")) {
        throw new Error("請重新登入並同意 Google Calendar 權限。");
    }

    const isExpired = account.expires_at ? account.expires_at < Math.floor(Date.now() / 1000) + 60 : false;
    if (isExpired) {
        if (!account.refresh_token) {
            throw new Error("Google 授權已過期，請重新登入 Google 帳號。");
        }

        return refreshGoogleAccessToken(account.id, account.refresh_token);
    }

    return account.access_token;
}

export async function createCalendarReminder(input: CalendarEventInput) {
    const accessToken = await getGoogleAccessToken(input.userId);
    const endsAt = input.endsAt ?? new Date(input.startsAt.getTime() + 60 * 60 * 1000);

    const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            summary: input.title,
            description: input.details,
            location: input.location,
            start: {
                dateTime: input.startsAt.toISOString(),
                timeZone: "Asia/Taipei",
            },
            end: {
                dateTime: endsAt.toISOString(),
                timeZone: "Asia/Taipei",
            },
            reminders: {
                useDefault: false,
                overrides: [
                    { method: "popup", minutes: 60 },
                    { method: "email", minutes: 24 * 60 },
                ],
            },
        }),
    });

    if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.error?.message ?? "建立 Google Calendar 提醒失敗。");
    }

    return res.json();
}
