import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { address, latitude, longitude, contactPhone, initialQuantity, date, nextContactDate } = body;

        if (!address || initialQuantity === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const newLocation = await prisma.location.create({
            data: {
                address,
                latitude,
                longitude,
                contactPhone,
                nextContactDate: nextContactDate ? new Date(nextContactDate) : null,
                records: {
                    create: {
                        quantity: Number(initialQuantity),
                        date: date ? new Date(date) : new Date(),
                    }
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
