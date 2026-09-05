import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

export async function POST(request: Request, props: RouteParams) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await props.params;
        const body = await request.json().catch(() => ({}));
        const note = typeof body.note === "string" ? body.note.trim() : "";

        const event = await prisma.volunteerEvent.findUnique({
            where: { id },
            include: { registrations: true },
        });

        if (!event || !event.isActive) {
            return NextResponse.json({ error: "Event unavailable" }, { status: 404 });
        }

        const activeRegistrationCount = event.registrations.filter((registration) => registration.status !== "CANCELLED").length;
        const existingRegistration = event.registrations.find((registration) => registration.userId === session.user.id);

        const alreadyActive = existingRegistration?.status === "REGISTERED" || existingRegistration?.status === "ATTENDED";
        if (event.capacity && activeRegistrationCount >= event.capacity && !alreadyActive) {
            return NextResponse.json({ error: "Event is full" }, { status: 400 });
        }

        const registration = await prisma.volunteerRegistration.upsert({
            where: {
                eventId_userId: {
                    eventId: id,
                    userId: session.user.id,
                },
            },
            create: {
                eventId: id,
                userId: session.user.id,
                note: note || null,
            },
            update: {
                status: "REGISTERED",
                note: note || existingRegistration?.note || null,
            },
        });

        return NextResponse.json(registration, { status: 201 });
    } catch (error) {
        console.error("Error registering volunteer:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: Request, props: RouteParams) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await props.params;

        await prisma.volunteerRegistration.update({
            where: {
                eventId_userId: {
                    eventId: id,
                    userId: session.user.id,
                },
            },
            data: { status: "CANCELLED" },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error cancelling volunteer registration:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
