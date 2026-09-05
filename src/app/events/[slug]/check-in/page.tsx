import { getServerSession } from "next-auth/next";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import EventCheckInClient from "@/components/EventCheckInClient";

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
    searchParams: Promise<{
        token?: string;
    }>;
}

export default async function EventCheckInPage({ params, searchParams }: PageProps) {
    const [{ slug }, { token }, session] = await Promise.all([
        params,
        searchParams,
        getServerSession(authOptions),
    ]);

    if (!token) {
        notFound();
    }

    const event = await prisma.volunteerEvent.findFirst({
        where: {
            OR: [
                { slug },
                { id: slug },
            ],
            isActive: true,
            checkInToken: token,
        },
        select: {
            id: true,
            slug: true,
            title: true,
            location: true,
            startsAt: true,
        },
    });

    if (!event) {
        notFound();
    }

    return (
        <EventCheckInClient
            isLoggedIn={Boolean(session?.user)}
            token={token}
            event={{
                id: event.id,
                slug: event.slug,
                title: event.title,
                location: event.location,
                startsAt: event.startsAt.toISOString(),
            }}
        />
    );
}
