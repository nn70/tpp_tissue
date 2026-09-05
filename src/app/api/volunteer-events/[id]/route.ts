import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageContent, isAdmin } from "@/lib/permissions";
import { normalizeVolunteerEventCategory } from "@/lib/volunteerEventCategories";
import { parseTaipeiDateTimeInput } from "@/lib/taipeiTime";

type RouteParams = {
    params: Promise<{
        id: string;
    }>;
};

function normalizeSlug(slug: unknown, title: string, startsAt: string) {
    if (typeof slug === "string" && slug.trim()) {
        return slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
    }

    return `${new Date(startsAt).toISOString().slice(0, 10)}-${title.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "")}`;
}

export async function PUT(request: Request, props: RouteParams) {
    const session = await getServerSession(authOptions);

    if (!session?.user || !canManageContent(session)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { id } = await props.params;
        const body = await request.json();
        const { title, slug, category, description, location, mapUrl, coverImageUrl, startsAt, endsAt, registrationDeadline, capacity, isActive } = body;

        if (!title?.trim() || !startsAt) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const normalizedSlug = normalizeSlug(slug, title, startsAt);
        const event = await prisma.volunteerEvent.update({
            where: { id },
            data: {
                slug: normalizedSlug || null,
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
            } as unknown as Parameters<typeof prisma.volunteerEvent.update>[0]["data"],
        });

        return NextResponse.json(event);
    } catch (error) {
        console.error("Error updating volunteer event:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: Request, props: RouteParams) {
    const session = await getServerSession(authOptions);

    if (!session?.user || !isAdmin(session)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { id } = await props.params;

        await prisma.volunteerEvent.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting volunteer event:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
