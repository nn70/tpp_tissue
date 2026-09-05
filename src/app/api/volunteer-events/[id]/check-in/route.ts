import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = {
    params: Promise<{
        id: string;
    }>;
};

export async function POST(request: Request, props: RouteParams) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await props.params;
        const body = await request.json().catch(() => ({}));
        const token = typeof body.token === "string" ? body.token : "";

        const event = await prisma.volunteerEvent.findFirst({
            where: {
                id,
                isActive: true,
                checkInToken: token,
            },
            select: {
                id: true,
                title: true,
                checkInToken: true,
            },
        });

        if (!event?.checkInToken) {
            return NextResponse.json({ error: "Invalid check-in code" }, { status: 404 });
        }

        const now = new Date();
        const registration = await prisma.volunteerRegistration.upsert({
            where: {
                eventId_userId: {
                    eventId: event.id,
                    userId: session.user.id,
                },
            },
            create: {
                eventId: event.id,
                userId: session.user.id,
                status: "ATTENDED",
                checkedInAt: now,
            },
            update: {
                status: "ATTENDED",
                checkedInAt: now,
            },
            include: {
                event: {
                    select: {
                        title: true,
                        startsAt: true,
                    },
                },
            },
        });

        return NextResponse.json(registration);
    } catch (error) {
        console.error("Error checking in volunteer:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
