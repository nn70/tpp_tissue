"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, Users, Shield, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

export default function Navigation() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const isDashboard = pathname === "/dashboard" || pathname === "/";
    const isForum = pathname === "/forum";
    const isAdmin = pathname === "/admin";

    return (
        <nav className="fixed top-0 w-full z-50 bg-[#0f1016]/80 backdrop-blur-xl border-b border-white/10 shrink-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-500 shadow-lg shadow-purple-500/20 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">H</span>
                        </div>
                        <span className="text-white font-bold text-xl tracking-wide hidden sm:block">
                            Hub
                        </span>
                    </div>

                    <div className="flex space-x-1 sm:space-x-4">
                        <Link
                            href="/dashboard"
                            className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300
                                ${isDashboard
                                    ? 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/50 shadow-lg shadow-purple-500/10'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                                }`}
                        >
                            <Map className="w-4 h-4" />
                            <span>物資發放紀錄</span>
                        </Link>

                        <Link
                            href="https://registerforum.vercel.app/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300
                                ${isForum
                                    ? 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/50 shadow-lg shadow-blue-500/10'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                                }`}
                        >
                            <Users className="w-4 h-4" />
                            <span>志工報名系統(可追蹤)</span>
                        </Link>

                        {(session?.user as any)?.role === "ADMIN" && (
                            <Link
                                href="/admin"
                                className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300
                                    ${isAdmin
                                        ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/50 shadow-lg shadow-amber-500/10'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                                    }`}
                            >
                                <Shield className="w-4 h-4" />
                                <span>權限管理</span>
                            </Link>
                        )}
                    </div>

                    <div className="flex items-center min-w-[84px] justify-end">
                        {session && (
                            <button
                                onClick={() => signOut({ callbackUrl: '/login' })}
                                className="flex items-center space-x-2 px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors rounded-xl hover:bg-white/5"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden sm:inline">登出</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
