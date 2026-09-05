import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createCalendarReminder } from "@/lib/googleCalendar";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const eventId = typeof body.eventId === "string" ? body.eventId : "";

        if (!eventId) {
            return NextResponse.json({ error: "Missing event id" }, { status: 400 });
        }

        const event = await prisma.volunteerEvent.findUnique({
            where: { id: eventId },
            select: {
                title: true,
                description: true,
                location: true,
                startsAt: true,
                endsAt: true,
            },
        });

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        const calendarEvent = await createCalendarReminder({
            userId: session.user.id,
            title: event.title,
            details: event.description ?? "",
            location: event.location ?? undefined,
            startsAt: event.startsAt,
            endsAt: event.endsAt ?? undefined,
            reminders: [
                { method: "popup", minutes: 60 },
            ],
        });

        return NextResponse.json({ success: true, eventId: calendarEvent.id, htmlLink: calendarEvent.htmlLink });
    } catch (error) {
        console.error("Error creating volunteer event calendar entry:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal Server Error" },
            { status: 500 },
        );
    }
}
