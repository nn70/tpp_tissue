import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageContent } from "@/lib/permissions";

export async function PATCH(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user || !canManageContent(session)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { registrationId, status } = body;

        if (!registrationId || !["REGISTERED", "WAITLISTED", "ATTENDED", "CANCELLED"].includes(status)) {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 });
        }

        const registration = await prisma.volunteerRegistration.update({
            where: { id: registrationId },
            data: {
                status: status as any,
                checkedInAt: status === "ATTENDED" ? new Date() : null,
            },
        });

        return NextResponse.json(registration);
    } catch (error) {
        console.error("Error updating volunteer registration:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
