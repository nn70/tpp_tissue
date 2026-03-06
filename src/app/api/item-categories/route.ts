import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const categories = await prisma.itemCategory.findMany({
            orderBy: { createdAt: 'asc' }
        });
        return NextResponse.json(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || (session.user as any)?.role === "USER") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { name } = body;

        if (!name || name.trim() === "") {
            return NextResponse.json({ error: "Category name is required" }, { status: 400 });
        }

        const newCategory = await prisma.itemCategory.create({
            data: {
                name: name.trim()
            }
        });

        return NextResponse.json(newCategory);
    } catch (error: any) {
        console.error("Error creating category:", error);
        if (error.code === 'P2002') { // Unique constraint violation
            return NextResponse.json({ error: "Category already exists" }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
