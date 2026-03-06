import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

interface RouteParams {
    params: Promise<{
        id: string;
        recordId: string;
    }>;
}

export async function DELETE(request: Request, props: RouteParams) {
    const session = await getServerSession(authOptions);

    if ((session?.user as any)?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const { id, recordId } = await props.params;

        await prisma.distributionRecord.delete({
            where: {
                id: recordId,
                locationId: id
            }
        });

        // 重新計算最近更新時間與下次聯絡日
        const remainingRecords = await prisma.distributionRecord.findMany({
            where: { locationId: id },
            orderBy: { date: 'desc' },
            take: 1
        });

        if (remainingRecords.length > 0) {
            await prisma.location.update({
                where: { id },
                data: { updatedAt: new Date() }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting record:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
