import { getServerSession } from "next-auth/next";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import EventDetailClient from "@/components/EventDetailClient";
import { canManageContent } from "@/lib/permissions";

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

type RegistrationStatus = "REGISTERED" | "WAITLISTED" | "ATTENDED" | "CANCELLED";

type EventRegistrationForDetail = {
    id: string;
    status: RegistrationStatus;
    userId: string;
    name: string | null;
    note: string | null;
    phone: string | null;
    user: {
        name: string | null;
        email: string | null;
        phone: string | null;
    };
};

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
                    user: {
                        select: {
                            name: true,
                            email: true,
                            phone: true,
                        },
                    },
                } as any,
            },
        },
    });

    if (!event) {
        notFound();
    }

    const registrations = event.registrations as unknown as EventRegistrationForDetail[];
    const currentUserRegistration = session?.user
        ? registrations.find((registration) => registration.userId === session.user.id) ?? null
        : null;
    const currentUserProfile = session?.user
        ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, phone: true } })
        : null;
    const manage = canManageContent(session);
    const visibleRegistrationStatuses = ["REGISTERED", "WAITLISTED", "ATTENDED"];
    const canSeeParticipants = manage || Boolean(currentUserRegistration && currentUserRegistration.status !== "CANCELLED");
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
                registrationCount: registrations.filter((registration) => (
                    registration.status === "REGISTERED" || registration.status === "ATTENDED"
                )).length,
                waitlistCount: registrations.filter((registration) => (registration.status as string) === "WAITLISTED").length,
                currentUserRegistration: currentUserRegistration as any,
                participants: canSeeParticipants ? registrations
                    .filter((registration) => visibleRegistrationStatuses.includes(registration.status as string))
                    .map((registration) => ({
                        id: registration.id,
                        name: registration.name || registration.user.name || "未命名志工",
                        status: registration.status,
                        email: manage ? registration.user.email : undefined,
                        phone: manage ? registration.phone || registration.user.phone : undefined,
                        note: manage ? registration.note : undefined,
                    })) : undefined,
                canSeeParticipantDetails: manage,
            }}
        />
    );
}
