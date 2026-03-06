import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

// 供 Next.js v15 避免 context 非同步錯誤的包裝
export async function POST(request: Request, props: RouteParams) {

    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || (session.user as any)?.role === "USER") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await props.params;
        const body = await request.json();
        const { quantity, date, nextContactDate, itemType } = body;

        if (quantity === undefined || !date || !nextContactDate || !itemType) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const newRecord = await prisma.distributionRecord.create({
            data: {
                locationId: id,
                itemType: itemType || "面紙",
                quantity: Number(quantity),
                date: date ? new Date(date) : new Date(),
            }
        });

        const updateData: any = { updatedAt: new Date() };
        if (nextContactDate !== undefined) {
            updateData.nextContactDate = nextContactDate ? new Date(nextContactDate) : null;
        }

        // 更新地點的 updatedAt 及下次聯絡日期
        await prisma.location.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(newRecord);
    } catch (error) {
        console.error("Error creating record:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
