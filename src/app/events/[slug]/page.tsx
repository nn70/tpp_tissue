import { getServerSession } from "next-auth/next";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import EventDetailClient from "@/components/EventDetailClient";

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default async function EventPage({ params }: PageProps) {
    const [{ slug }, session] = await Promise.all([
        params,
        getServerSession(authOptions),
    ]);

    const event = await prisma.volunteerEvent.findFirst({
        where: {
            OR: [
                { slug },
                { id: slug },
            ],
            isActive: true,
        },
        include: {
            registrations: {
                select: {
                    id: true,
                    status: true,
                    userId: true,
                    note: true,
                },
            },
        },
    });

    if (!event) {
        notFound();
    }

    const currentUserRegistration = session?.user
        ? event.registrations.find((registration) => registration.userId === session.user.id) ?? null
        : null;

    return (
        <EventDetailClient
            isLoggedIn={Boolean(session?.user)}
            event={{
                id: event.id,
                slug: event.slug,
                title: event.title,
                description: event.description,
                location: event.location,
                mapUrl: event.mapUrl,
                coverImageUrl: event.coverImageUrl,
                startsAt: event.startsAt.toISOString(),
                endsAt: event.endsAt?.toISOString() ?? null,
                registrationDeadline: event.registrationDeadline?.toISOString() ?? null,
                capacity: event.capacity,
                registrationCount: event.registrations.filter((registration) => registration.status !== "CANCELLED").length,
                currentUserRegistration,
            }}
        />
    );
}
