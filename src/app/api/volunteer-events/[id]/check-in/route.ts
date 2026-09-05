import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone";

type RouteParams = {
    params: Promise<{
        id: string;
    }>;
};

function getPhoneLastThree(value: string) {
    return normalizePhone(value).replace(/\D/g, "").slice(-3);
}

export async function POST(request: Request, props: RouteParams) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await props.params;
        const body = await request.json().catch(() => ({}));
        const token = typeof body.token === "string" ? body.token : "";
        const phoneLastThree = typeof body.phone === "string" ? body.phone.replace(/\D/g, "").slice(-3) : "";

        if (phoneLastThree.length !== 3) {
            return NextResponse.json({ error: "請輸入報名電話的末三碼。" }, { status: 400 });
        }

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
        const existingRegistration = await prisma.volunteerRegistration.findUnique({
            where: {
                eventId_userId: {
                    eventId: event.id,
                    userId: session.user.id,
                },
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

        if (!existingRegistration || existingRegistration.status === "CANCELLED") {
            return NextResponse.json({ error: "查無此活動的有效報名紀錄，請先確認是否已完成報名。" }, { status: 400 });
        }

        if ((existingRegistration.status as string) === "WAITLISTED") {
            return NextResponse.json({ error: "你目前是候補報名，請先找現場工作人員確認是否可轉為正取後再報到。" }, { status: 400 });
        }

        if (!existingRegistration.phone) {
            return NextResponse.json({ error: "這筆報名資料沒有電話號碼，請找現場工作人員協助。" }, { status: 400 });
        }

        if (getPhoneLastThree(existingRegistration.phone) !== phoneLastThree) {
            return NextResponse.json({ error: "末三碼與報名時登記的電話不一致，報到失敗。" }, { status: 400 });
        }

        const registration = await prisma.volunteerRegistration.update({
            where: {
                eventId_userId: {
                    eventId: event.id,
                    userId: session.user.id,
                },
            },
            data: {
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
