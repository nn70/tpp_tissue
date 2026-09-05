import { prisma } from "@/lib/prisma";
import { isValidPhone, normalizePhone } from "@/lib/phone";

export function normalizeProfileInput(name: unknown, phone: unknown) {
    const normalizedName = typeof name === "string" ? name.trim() : "";
    const normalizedPhone = typeof phone === "string" ? normalizePhone(phone.trim()) : "";

    return {
        name: normalizedName,
        phone: normalizedPhone,
    };
}

export async function updateUserProfileWithLog(userId: string, input: { name: string; phone: string; source: string }) {
    if (!input.name) {
        return { error: "Name required" as const };
    }

    if (!input.phone || !isValidPhone(input.phone)) {
        return { error: "Phone required" as const };
    }

    const nextName = input.name.trim();
    const nextPhone = normalizePhone(input.phone);
    const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, phone: true },
    });

    if (!currentUser) {
        return { error: "User not found" as const };
    }

    const oldName = currentUser.name?.trim() || null;
    const oldPhone = currentUser.phone ? normalizePhone(currentUser.phone) : null;
    const hasChanged = oldName !== nextName || oldPhone !== nextPhone;

    if (!hasChanged) {
        return {
            user: {
                ...currentUser,
                name: nextName,
                phone: nextPhone,
            },
            changed: false,
        };
    }

    const [updatedUser] = await prisma.$transaction([
        prisma.user.update({
            where: { id: userId },
            data: { name: nextName, phone: nextPhone },
            select: { id: true, name: true, phone: true },
        }),
        prisma.volunteerRegistration.updateMany({
            where: {
                userId,
                status: { in: ["REGISTERED", "WAITLISTED"] as any },
            },
            data: { name: nextName, phone: nextPhone } as any,
        }),
        (prisma as any).userProfileChangeLog.create({
            data: {
                userId,
                oldName,
                newName: nextName,
                oldPhone,
                newPhone: nextPhone,
                source: input.source,
            },
        }),
    ]);

    return { user: updatedUser, changed: true };
}
