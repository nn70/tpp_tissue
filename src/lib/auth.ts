import { NextAuthOptions, DefaultSession, DefaultUser } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: string;
        } & DefaultSession["user"];
    }

    interface User extends DefaultUser {
        role: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role?: string;
    }
}

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma) as any,
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async signIn({ user }) {
            // 指定的 Email 自動賦予最高管理員權限
            const adminEmail = process.env.ADMIN_EMAIL || "nn70nn70@gmail.com";

            if (user.email && user.email === adminEmail) {
                const dbUser = await prisma.user.findUnique({ where: { email: user.email } }) as any;
                if (dbUser && dbUser.role !== "ADMIN") {
                    await prisma.user.update({ where: { email: user.email }, data: { role: "ADMIN" } });
                }
            }
            return true;
        },
        async jwt({ token, user }) {
            // 從資料庫取得最新權限狀態
            if (token.sub) {
                const dbUser = await prisma.user.findUnique({
                    where: { id: token.sub },
                    select: { role: true } as any
                }) as any;
                if (dbUser) {
                    token.role = dbUser.role;
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user && token.sub) {
                session.user.id = token.sub;
                session.user.role = token.role as string;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
};
