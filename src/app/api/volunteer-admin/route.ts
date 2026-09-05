import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageContent } from "@/lib/permissions";
import { getRewardProgress } from "@/lib/volunteerRewards";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user || !canManageContent(session)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [events, volunteers] = await Promise.all([
        prisma.volunteerEvent.findMany({
            orderBy: { startsAt: "desc" },
            include: {
                registrations: {
                    orderBy: { createdAt: "asc" },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true,
                                phone: true,
                            },
                        },
                    },
                },
            },
        }),
        prisma.user.findMany({
            where: {
                volunteerRegistrations: {
                    some: {},
                },
            },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                phone: true,
                volunteerRegistrations: {
                    where: { status: "ATTENDED" },
                    select: { id: true },
                },
            },
            orderBy: { name: "asc" },
        }),
    ]);

    return NextResponse.json({
        events,
        volunteers: volunteers.map((volunteer) => ({
            id: volunteer.id,
            name: volunteer.name,
            email: volunteer.email,
            image: volunteer.image,
            phone: volunteer.phone,
            ...getRewardProgress(volunteer.volunteerRegistrations.length),
        })),
    });
}
