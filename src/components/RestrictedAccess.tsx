import { ShieldAlert, LogIn } from "lucide-react";
import Link from "next/link";

export default function RestrictedAccess() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-[#0f1016] text-white p-4">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-xl">
                <div className="flex justify-center mb-6">
                    <div className="bg-amber-500/20 p-4 rounded-full">
                        <ShieldAlert className="w-12 h-12 text-amber-500" />
                    </div>
                </div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-orange-200">
                    請先登入系統
                </h1>
                <p className="text-slate-400 text-sm leading-relaxed">
                    為了確保資料安全，您必須登入後才能觀看發放紀錄與造冊系統。
                </p>
                <div className="pt-6">
                    <Link
                        href="/login"
                        className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-8 py-3 rounded-xl font-medium shadow-lg shadow-purple-500/20 transition-all hover:scale-105 active:scale-95"
                    >
                        <LogIn className="w-5 h-5" />
                        <span>前往登入</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
