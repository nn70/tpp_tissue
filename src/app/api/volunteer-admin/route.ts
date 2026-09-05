import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageContent } from "@/lib/permissions";
import { getRewardProgress } from "@/lib/volunteerRewards";

type ProfileChangeLog = {
    id: string;
    userId: string;
    oldName: string | null;
    newName: string | null;
    oldPhone: string | null;
    newPhone: string | null;
    source: string | null;
    createdAt: Date;
};

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
    const profileChangeLogs = await (prisma as any).userProfileChangeLog.findMany({
        where: {
            userId: { in: volunteers.map((volunteer) => volunteer.id) },
        },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            userId: true,
            oldName: true,
            newName: true,
            oldPhone: true,
            newPhone: true,
            source: true,
            createdAt: true,
        },
    }) as ProfileChangeLog[];
    const logsByUserId = profileChangeLogs.reduce((acc: Record<string, ProfileChangeLog[]>, log) => {
        acc[log.userId] = [...(acc[log.userId] ?? []), log].slice(0, 10);
        return acc;
    }, {});

    return NextResponse.json({
        events,
        volunteers: volunteers.map((volunteer) => ({
            id: volunteer.id,
            name: volunteer.name,
            email: volunteer.email,
            image: volunteer.image,
            phone: volunteer.phone,
            profileChangeLogs: logsByUserId[volunteer.id] ?? [],
            ...getRewardProgress(volunteer.volunteerRegistrations.length),
        })),
    });
}
