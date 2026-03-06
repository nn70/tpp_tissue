import { ShieldAlert } from "lucide-react";

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
            </div>
        </div>
    );
}
