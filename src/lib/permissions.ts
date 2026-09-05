import { Session } from "next-auth";

export const SUPERUSER_EMAIL = "nn70nn70@gmail.com";

export function getRole(session: Session | null): string | undefined {
    return session?.user?.role;
}

export function canManageContent(session: Session | null): boolean {
    const role = getRole(session);
    return role === "ADMIN" || role === "EDITOR";
}

export function isAdmin(session: Session | null): boolean {
    return getRole(session) === "ADMIN";
}

export function isSuperUser(session: Session | null): boolean {
    return session?.user?.email?.toLowerCase() === SUPERUSER_EMAIL;
}
