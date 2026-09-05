import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidPhone, normalizePhone } from "@/lib/phone";

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
        const inputName = typeof body.name === "string" ? body.name.trim() : "";
        const note = typeof body.note === "string" ? body.note.trim() : "";
        const inputPhone = typeof body.phone === "string" ? body.phone.trim() : "";
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { name: true, phone: true },
        });
        const name = inputName || user?.name?.trim() || "";
        const phone = inputPhone || user?.phone || "";

        if (!name) {
            return NextResponse.json({ error: "Name required" }, { status: 400 });
        }

        if (!phone || !isValidPhone(phone)) {
            return NextResponse.json({ error: "Phone required" }, { status: 400 });
        }

        const normalizedPhone = normalizePhone(phone);

        const event = await prisma.volunteerEvent.findUnique({
            where: { id },
            include: { registrations: true },
        });

        if (!event || !event.isActive) {
            return NextResponse.json({ error: "Event unavailable" }, { status: 404 });
        }

        const closesAt = event.registrationDeadline ?? event.startsAt;
        if (closesAt.getTime() < Date.now()) {
            return NextResponse.json({ error: "Registration closed" }, { status: 400 });
        }

        const existingRegistration = event.registrations.find((registration) => registration.userId === session.user.id);
        const confirmedCount = event.registrations.filter((registration) => (
            registration.status === "REGISTERED" || registration.status === "ATTENDED"
        )).length;
        const isFull = event.capacity !== null && confirmedCount >= event.capacity;
        const nextStatus = isFull ? "WAITLISTED" : "REGISTERED";

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
                name,
                phone: normalizedPhone,
                status: nextStatus as any,
                note: note || null,
            } as any,
            update: {
                status: (existingRegistration?.status === "ATTENDED" ? "ATTENDED" : nextStatus) as any,
                name: (existingRegistration as any)?.name || name,
                phone: existingRegistration?.phone || normalizedPhone,
                note: note || existingRegistration?.note || null,
            } as any,
        });

        if (!user?.name || user.name.trim() !== name || !user?.phone || normalizePhone(user.phone) !== normalizedPhone) {
            await prisma.user.update({
                where: { id: session.user.id },
                data: { name, phone: normalizedPhone },
            });
        }

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
