import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { canManageContent } from "@/lib/permissions";
import { createCalendarReminder } from "@/lib/googleCalendar";

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user || !canManageContent(session)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { date, locationName, address, contactName, contactPhone } = body;

        if (!date || !address) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const startsAt = new Date(`${date}T10:00:00+08:00`);
        const title = `聯絡補貨：${locationName || address}`;
        const details = [
            `地址：${address}`,
            contactName ? `聯絡人：${contactName}` : null,
            contactPhone ? `電話：${contactPhone}` : null,
            "請聯絡該地點確認是否需要補充物資。",
        ].filter(Boolean).join("\n");

        const event = await createCalendarReminder({
            userId: session.user.id,
            title,
            details,
            location: address,
            startsAt,
        });

        return NextResponse.json({ success: true, eventId: event.id, htmlLink: event.htmlLink });
    } catch (error) {
        console.error("Error creating calendar reminder:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal Server Error" },
            { status: 500 },
        );
    }
}
