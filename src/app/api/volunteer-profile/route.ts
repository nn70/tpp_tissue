import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { normalizeProfileInput, updateUserProfileWithLog } from "@/lib/userProfileChanges";

export async function PATCH(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json().catch(() => ({}));
        const profile = normalizeProfileInput(body.name, body.phone);
        const result = await updateUserProfileWithLog(session.user.id, {
            ...profile,
            source: "volunteer-profile",
        });

        if ("error" in result) {
            const status = result.error === "User not found" ? 404 : 400;
            return NextResponse.json({ error: result.error }, { status });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error updating volunteer profile:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
