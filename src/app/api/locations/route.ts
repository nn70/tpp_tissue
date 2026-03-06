import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {

    try {
        const locations = await prisma.location.findMany({
            include: {
                records: {
                    orderBy: { date: 'desc' }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        return NextResponse.json(locations);
    } catch (error) {
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
        const { name, address, latitude, longitude, contactName, contactPhone, itemType, initialQuantity, date, nextContactDate } = body;

        if (!name || !address || !contactName || !contactPhone || !itemType || initialQuantity === undefined || !date || !nextContactDate) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const newLocation = await prisma.location.create({
            data: {
                name,
                address,
                latitude,
                longitude,
                contactName,
                contactPhone,
                nextContactDate: nextContactDate ? new Date(nextContactDate) : null,
                records: {
                    create: {
                        itemType: itemType || "面紙",
                        quantity: Number(initialQuantity),
                        date: date ? new Date(date) : new Date(),
                    } as any
                }
            },
            include: {
                records: true
            }
        });

        return NextResponse.json(newLocation);
    } catch (error) {
        console.error("Error creating location:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
