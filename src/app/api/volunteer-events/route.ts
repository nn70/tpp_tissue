import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageContent } from "@/lib/permissions";
import { getRewardProgress } from "@/lib/volunteerRewards";
import { normalizeVolunteerEventCategory } from "@/lib/volunteerEventCategories";
import { parseTaipeiDateTimeInput } from "@/lib/taipeiTime";

type EventRegistrationForList = {
    id: string;
    status: string;
    userId: string;
    createdAt: Date;
    name: string | null;
    note: string | null;
    phone: string | null;
    user: {
        name: string | null;
        email: string | null;
        image: string | null;
        phone: string | null;
    };
};

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
                    name: true,
                    note: true,
                    phone: true,
                    user: {
                        select: {
                            name: true,
                            email: true,
                            image: true,
                            phone: true,
                        },
                    },
                } as any,
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
    const visibleRegistrationStatuses = ["REGISTERED", "WAITLISTED", "ATTENDED"];

    return NextResponse.json({
        events: events.map(({ checkInToken, ...event }) => {
            const registrations = event.registrations as unknown as EventRegistrationForList[];
            const currentUserRegistration = registrations.find((registration) => registration.userId === session.user.id) ?? null;
            const visibleRegistrations = registrations.filter((registration) => (
                visibleRegistrationStatuses.includes(registration.status as string)
            ));
            const canSeeParticipants = manage || Boolean(currentUserRegistration && currentUserRegistration.status !== "CANCELLED");

            return {
                ...event,
                currentUserRegistration,
                registrationCount: registrations.filter((registration) => (
                    registration.status === "REGISTERED" || registration.status === "ATTENDED"
                )).length,
                waitlistCount: registrations.filter((registration) => (registration.status as string) === "WAITLISTED").length,
                checkInToken: manage ? checkInToken : undefined,
                registrations: manage ? event.registrations : undefined,
                participants: canSeeParticipants ? visibleRegistrations.map((registration) => ({
                    id: registration.id,
                    name: registration.name || registration.user.name || "未命名志工",
                    status: registration.status,
                    email: manage ? registration.user.email : undefined,
                    phone: manage ? registration.phone || registration.user.phone : undefined,
                    note: manage ? registration.note : undefined,
                })) : undefined,
            };
        }),
        currentUserProfile: session.user.id
            ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, phone: true } })
            : null,
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
        const { title, slug, category, description, location, mapUrl, coverImageUrl, startsAt, endsAt, registrationDeadline, capacity, isActive } = body;

        if (!title?.trim() || !startsAt) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const normalizedSlug = typeof slug === "string" && slug.trim()
            ? slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "")
            : `${new Date(startsAt).toISOString().slice(0, 10)}-${title.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "")}`;

        const event = await prisma.volunteerEvent.create({
            data: {
                slug: normalizedSlug || undefined,
                checkInToken: randomUUID(),
                title: title.trim(),
                category: normalizeVolunteerEventCategory(category),
                description: description?.trim() || null,
                location: location?.trim() || null,
                mapUrl: mapUrl?.trim() || null,
                coverImageUrl: coverImageUrl?.trim() || null,
                startsAt: parseTaipeiDateTimeInput(startsAt),
                endsAt: endsAt ? parseTaipeiDateTimeInput(endsAt) : null,
                registrationDeadline: registrationDeadline ? parseTaipeiDateTimeInput(registrationDeadline) : null,
                capacity: capacity ? Number(capacity) : null,
                isActive: isActive ?? true,
            } as unknown as Parameters<typeof prisma.volunteerEvent.create>[0]["data"],
        });

        return NextResponse.json(event, { status: 201 });
    } catch (error) {
        console.error("Error creating volunteer event:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
