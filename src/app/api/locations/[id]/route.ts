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
