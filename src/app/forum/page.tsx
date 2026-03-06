import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import RestrictedAccess from "@/components/RestrictedAccess";

export default async function ForumPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return <RestrictedAccess />;
    }

    return (
        <div className="h-screen w-full pt-16 flex flex-col bg-[#0f1016]">
            <iframe
                src="https://registerforum.vercel.app/"
                className="w-full h-full border-none flex-1"
                title="人員造冊系統"
                allow="geolocation; microphone; camera; midi; vr; accelerometer; gyroscope; payment; ambient-light-sensor; encrypted-media; usb"
            />
        </div>
    );
}
