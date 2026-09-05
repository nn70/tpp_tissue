import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageContent } from "@/lib/permissions";
import { getRewardProgress } from "@/lib/volunteerRewards";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const manage = canManageContent(session);
    const events = await prisma.volunteerEvent.findMany({
        where: manage ? undefined : { isActive: true },
        orderBy: { startsAt: "asc" },
        include: {
            registrations: {
                select: {
                    id: true,
                    status: true,
                    userId: true,
                    createdAt: true,
                    note: true,
                    user: {
                        select: {
                            name: true,
                            email: true,
                            image: true,
                        },
                    },
                },
                orderBy: { createdAt: "asc" },
            },
        },
    });

    const attendedCount = await prisma.volunteerRegistration.count({
        where: {
            userId: session.user.id,
            status: "ATTENDED",
        },
    });

    return NextResponse.json({
        events: events.map((event) => ({
            ...event,
            currentUserRegistration: event.registrations.find((registration) => registration.userId === session.user.id) ?? null,
            registrationCount: event.registrations.filter((registration) => registration.status !== "CANCELLED").length,
            registrations: manage ? event.registrations : undefined,
        })),
        rewardProgress: getRewardProgress(attendedCount),
    });
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user || !canManageContent(session)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { title, description, location, startsAt, endsAt, capacity, isActive } = body;

        if (!title?.trim() || !startsAt) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const event = await prisma.volunteerEvent.create({
            data: {
                title: title.trim(),
                description: description?.trim() || null,
                location: location?.trim() || null,
                startsAt: new Date(startsAt),
                endsAt: endsAt ? new Date(endsAt) : null,
                capacity: capacity ? Number(capacity) : null,
                isActive: isActive ?? true,
            },
        });

        return NextResponse.json(event, { status: 201 });
    } catch (error) {
        console.error("Error creating volunteer event:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
