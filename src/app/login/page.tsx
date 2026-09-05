"use client";

import { signIn } from "next-auth/react";
import { LogIn } from "lucide-react";

export default function LoginPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] tpp-page p-4">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 max-w-md w-full text-center space-y-8 shadow-xl">
                <div>
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 rounded-2xl tpp-brand-mark flex items-center justify-center">
                            <span className="text-white font-bold text-3xl">眾</span>
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold mb-2">登入 TPP志工報名系統</h1>
                    <p className="text-slate-400 text-sm">請使用您的 Google 帳號登入以存取系統功能</p>
                </div>

                <div className="pt-4 border-t border-white/5">
                    <button
                        onClick={() => signIn("google", { callbackUrl: "/forum" })}
                        className="w-full flex items-center justify-center space-x-3 bg-white hover:bg-slate-100 text-slate-900 font-semibold py-3.5 px-4 rounded-xl transition-all duration-200"
                    >
                        <LogIn className="w-5 h-5 text-slate-700" />
                        <span>使用 Google 帳號登入</span>
                    </button>
                    <p className="mt-4 text-xs leading-5 text-slate-400">
                        登入即表示您同意我們的服務條款和隱私政策
                    </p>
                </div>
            </div>
        </div>
    );
}
