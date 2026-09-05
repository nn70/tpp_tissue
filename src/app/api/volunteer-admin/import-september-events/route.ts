import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/permissions";
import { normalizeVolunteerEventCategory } from "@/lib/volunteerEventCategories";
import { parseTaipeiDateTimeInput } from "@/lib/taipeiTime";
import { septemberVolunteerEvents } from "@/lib/septemberVolunteerEvents";

function buildMapUrl(location: string | null) {
    if (!location) return null;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

async function importEvents() {
    const existingEvents = await prisma.volunteerEvent.findMany({
        where: {
            slug: {
                in: septemberVolunteerEvents.map((event) => event.slug),
            },
        },
        select: {
            slug: true,
        },
    });
    const existingSlugs = new Set(existingEvents.map((event) => event.slug).filter(Boolean));

    const results = await prisma.$transaction(septemberVolunteerEvents.map((event) => (
        prisma.volunteerEvent.upsert({
            where: { slug: event.slug },
            update: {
                title: event.title,
                category: normalizeVolunteerEventCategory(event.category),
                description: event.description,
                location: event.location,
                mapUrl: buildMapUrl(event.location),
                startsAt: parseTaipeiDateTimeInput(event.startsAt),
                endsAt: event.endsAt ? parseTaipeiDateTimeInput(event.endsAt) : null,
                registrationDeadline: parseTaipeiDateTimeInput(event.startsAt),
                capacity: event.capacity,
                isActive: true,
            } as unknown as Parameters<typeof prisma.volunteerEvent.update>[0]["data"],
            create: {
                slug: event.slug,
                checkInToken: randomUUID(),
                title: event.title,
                category: normalizeVolunteerEventCategory(event.category),
                description: event.description,
                location: event.location,
                mapUrl: buildMapUrl(event.location),
                startsAt: parseTaipeiDateTimeInput(event.startsAt),
                endsAt: event.endsAt ? parseTaipeiDateTimeInput(event.endsAt) : null,
                registrationDeadline: parseTaipeiDateTimeInput(event.startsAt),
                capacity: event.capacity,
                isActive: true,
            } as unknown as Parameters<typeof prisma.volunteerEvent.create>[0]["data"],
        })
    )));

    return {
        imported: results.length,
        created: septemberVolunteerEvents.filter((event) => !existingSlugs.has(event.slug)).length,
        updated: septemberVolunteerEvents.filter((event) => existingSlugs.has(event.slug)).length,
        slugs: results.map((event) => event.slug),
    };
}

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user || !isAdmin(session)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await importEvents();
    return NextResponse.json(result);
}

export async function POST() {
    return GET();
}
