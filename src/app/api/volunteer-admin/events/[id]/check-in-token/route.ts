import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageContent } from "@/lib/permissions";

type RouteParams = {
    params: Promise<{
        id: string;
    }>;
};

export async function POST(request: Request, props: RouteParams) {
    const session = await getServerSession(authOptions);

    if (!session?.user || !canManageContent(session)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await props.params;
    const body = await request.json().catch(() => ({}));
    const event = await prisma.volunteerEvent.findUnique({
        where: { id },
        select: {
            id: true,
            slug: true,
            checkInToken: true,
        },
    });

    if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.checkInToken && !body.regenerate) {
        return NextResponse.json(event);
    }

    const updatedEvent = await prisma.volunteerEvent.update({
        where: { id },
        data: { checkInToken: randomUUID() },
        select: {
            id: true,
            slug: true,
            checkInToken: true,
        },
    });

    return NextResponse.json(updatedEvent);
}
