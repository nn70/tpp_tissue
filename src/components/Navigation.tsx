"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Award, CalendarCheck, Map, Users, Shield, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

export default function Navigation() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const isDashboard = pathname === "/dashboard";
    const isForum = pathname === "/forum";
    const isRewards = pathname === "/volunteer-rewards";
    const isAdmin = pathname === "/admin";
    const isVolunteerAdmin = pathname === "/volunteer-admin";
    const canManageContent = session?.user?.role === "ADMIN" || session?.user?.role === "EDITOR";
    const baseLinkClass = "flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 shrink-0";
    const inactiveLinkClass = "text-[#3b597d] hover:text-[#173246] hover:bg-[#61C5C7]/10";
    const activeLinkClass = "bg-[#61C5C7]/18 text-[#173246] ring-1 ring-[#61C5C7]/50 shadow-lg shadow-[#61C5C7]/10";

    return (
        <nav className="fixed top-0 w-full z-50 border-b border-[#61C5C7]/20 bg-white/78 backdrop-blur-xl shrink-0 shadow-sm shadow-[#3b597d]/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <Link href="/" className="flex items-center space-x-3 rounded-xl transition-opacity hover:opacity-90">
                        <div className="w-8 h-8 rounded-xl tpp-brand-mark">
                            <span className="text-white font-bold text-lg">眾</span>
                        </div>
                        <span className="text-[#173246] font-bold text-sm sm:text-base lg:text-lg tracking-wide hidden sm:block whitespace-nowrap">
                            TPP志工報名系統
                        </span>
                    </Link>

                    <div className="flex space-x-1 sm:space-x-4 overflow-x-auto hide-scrollbar flex-1 px-2 mx-2">
                        {canManageContent && (
                            <Link
                                href="/dashboard"
                                className={`${baseLinkClass} ${isDashboard ? activeLinkClass : inactiveLinkClass}`}
                            >
                                <Map className="w-4 h-4" />
                                <span className="hidden sm:inline">物資發放紀錄</span>
                                <span className="sm:hidden">發放紀錄</span>
                            </Link>
                        )}

                        <Link
                            href="/forum"
                            className={`${baseLinkClass} ${isForum ? activeLinkClass : inactiveLinkClass}`}
                        >
                            <Users className="w-4 h-4" />
                            <span className="hidden sm:inline">志工報名系統</span>
                            <span className="sm:hidden">報名系統</span>
                        </Link>

                        <Link
                            href="/volunteer-rewards"
                            className={`${baseLinkClass} ${isRewards ? activeLinkClass : inactiveLinkClass}`}
                        >
                            <Award className="w-4 h-4" />
                            <span className="hidden sm:inline">志工里程碑</span>
                            <span className="sm:hidden">里程碑</span>
                        </Link>

                        {canManageContent && (
                            <Link
                                href="/volunteer-admin"
                                className={`${baseLinkClass} ${isVolunteerAdmin ? activeLinkClass : inactiveLinkClass}`}
                            >
                                <CalendarCheck className="w-4 h-4" />
                                <span className="hidden sm:inline">系統後台</span>
                                <span className="sm:hidden">後台</span>
                            </Link>
                        )}

                        {session?.user?.role === "ADMIN" && (
                            <Link
                                href="/admin"
                                className={`${baseLinkClass} ${isAdmin ? activeLinkClass : inactiveLinkClass}`}
                            >
                                <Shield className="w-4 h-4" />
                                <span className="hidden sm:inline">權限管理</span>
                                <span className="sm:hidden">管理</span>
                            </Link>
                        )}
                    </div>

                    <div className="flex items-center min-w-[84px] justify-end">
                        {session && (
                            <button
                                onClick={() => signOut({ callbackUrl: '/login' })}
                                className="flex items-center space-x-2 px-3 py-2 text-sm text-[#3b597d] hover:text-[#173246] transition-colors rounded-xl hover:bg-[#61C5C7]/10"
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
