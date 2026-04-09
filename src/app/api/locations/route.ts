import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {

    try {
        const locations = await prisma.location.findMany({
            select: {
                id: true,
                name: true,
                address: true,
                latitude: true,
                longitude: true,
                contactName: true,
                contactPhone: true,
                nextContactDate: true,
                type: true,
                imageUrl: true,
                updatedAt: true,
                records: {
                    select: {
                        id: true,
                        itemType: true,
                        quantity: true,
                        date: true
                    },
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
        const { type, name, address, latitude, longitude, contactName, contactPhone, itemType, initialQuantity, date, nextContactDate, imageUrl } = body;

        let finalType = type;
        if (!["SUPPLY", "BILLBOARD", "PROSPECT"].includes(finalType)) {
            finalType = "SUPPLY";
        }

        if (finalType === "SUPPLY") {
            if (!name || !address || !contactName || !contactPhone || !itemType || initialQuantity === undefined || !date || !nextContactDate) {
                return NextResponse.json({ error: "Missing required fields for supply" }, { status: 400 });
            }
        } else if (finalType === "BILLBOARD") {
            if (!name || !address || latitude === undefined || longitude === undefined) {
                return NextResponse.json({ error: "Missing required fields for billboard" }, { status: 400 });
            }
        } else if (finalType === "PROSPECT") {
            if (!name || !address || latitude === undefined || longitude === undefined) {
                 return NextResponse.json({ error: "Missing required fields for prospect" }, { status: 400 });
            }
        }

        const newLocation = await prisma.location.create({
            data: {
                name,
                address,
                latitude,
                longitude,
                contactName: (finalType === "SUPPLY" || finalType === "PROSPECT") ? (contactName || null) : null,
                contactPhone: (finalType === "SUPPLY" || finalType === "PROSPECT") ? (contactPhone || null) : null,
                nextContactDate: (finalType === "SUPPLY" && nextContactDate) ? new Date(nextContactDate) : null,
                type: finalType,
                imageUrl: finalType === "BILLBOARD" ? imageUrl : null,
                records: finalType === "SUPPLY" ? {
                    create: {
                        itemType: itemType || "面紙",
                        quantity: Number(initialQuantity),
                        date: date ? new Date(date) : new Date(),
                    } as any
                } : undefined
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
