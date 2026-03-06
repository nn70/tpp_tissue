import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

export async function DELETE(request: Request, props: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || (session.user as any)?.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await props.params;

        // Optionally prevent deleting default categories like 面紙, 扇子
        const category = await prisma.itemCategory.findUnique({ where: { id } });
        if (!category) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        if (category.name === "面紙" || category.name === "扇子") {
            return NextResponse.json({ error: "Cannot delete default categories" }, { status: 400 });
        }

        await prisma.itemCategory.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting category:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
