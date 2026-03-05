import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

// 供 Next.js v15 避免 context 非同步錯誤的包裝
export async function POST(request: Request, props: RouteParams) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await props.params;
        const body = await request.json();
        const { quantity, date, nextContactDate } = body;

        if (quantity === undefined) {
            return NextResponse.json({ error: "Missing quantity" }, { status: 400 });
        }

        const newRecord = await prisma.distributionRecord.create({
            data: {
                locationId: id,
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
