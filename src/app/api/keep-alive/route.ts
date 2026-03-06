import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        // 簡單的一筆查詢來喚醒資料庫連線
        await prisma.location.findFirst({ select: { id: true } });

        return NextResponse.json({
            status: "success",
            message: "Keep-alive ping successful",
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("Keep-alive error:", error);
        return NextResponse.json(
            { status: "error", message: "Keep-alive ping failed" },
            { status: 500 }
        );
    }
}
