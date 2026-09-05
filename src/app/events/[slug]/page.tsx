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
                    name: true,
                    note: true,
                    phone: true,
                } as any,
            },
        },
    });

    if (!event) {
        notFound();
    }

    const currentUserRegistration = session?.user
        ? event.registrations.find((registration) => registration.userId === session.user.id) ?? null
        : null;
    const currentUserProfile = session?.user
        ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, phone: true } })
        : null;
    const category = "category" in event && typeof event.category === "string" ? event.category : null;

    return (
        <EventDetailClient
            isLoggedIn={Boolean(session?.user)}
            currentUserProfile={currentUserProfile}
            event={{
                id: event.id,
                slug: event.slug,
                title: event.title,
                category,
                description: event.description,
                location: event.location,
                mapUrl: event.mapUrl,
                coverImageUrl: event.coverImageUrl,
                startsAt: event.startsAt.toISOString(),
                endsAt: event.endsAt?.toISOString() ?? null,
                registrationDeadline: event.registrationDeadline?.toISOString() ?? null,
                capacity: event.capacity,
                registrationCount: event.registrations.filter((registration) => (
                    registration.status === "REGISTERED" || registration.status === "ATTENDED"
                )).length,
                waitlistCount: event.registrations.filter((registration) => (registration.status as string) === "WAITLISTED").length,
                currentUserRegistration: currentUserRegistration as any,
            }}
        />
    );
}
