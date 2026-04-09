import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

// 修改地點基本資料（名稱、聯絡人、電話、類型）
export async function PATCH(request: Request, props: RouteParams) {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (role !== "ADMIN" && role !== "EDITOR") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const { id } = await props.params;
        const body = await request.json();

        // 只允許修改這幾個欄位
        const allowedFields: Record<string, any> = {};
        if (body.name !== undefined) allowedFields.name = body.name || null;
        if (body.contactName !== undefined) allowedFields.contactName = body.contactName || null;
        if (body.contactPhone !== undefined) allowedFields.contactPhone = body.contactPhone || null;
        if (body.type !== undefined) allowedFields.type = body.type;

        const updated = await prisma.location.update({
            where: { id },
            data: allowedFields,
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating location:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: Request, props: RouteParams) {
    const session = await getServerSession(authOptions);

    if ((session?.user as any)?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const { id } = await props.params;

        await prisma.location.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting location:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
