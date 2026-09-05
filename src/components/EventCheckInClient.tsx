"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, Loader2, LogIn, Phone, QrCode, XCircle } from "lucide-react";
import { taipeiDateTimeFormatOptions } from "@/lib/taipeiTime";

type CheckInEvent = {
    id: string;
    slug: string | null;
    title: string;
    location: string | null;
    startsAt: string;
};

type Props = {
    event: CheckInEvent;
    token: string;
    isLoggedIn: boolean;
};

type CheckInState = "idle" | "checking" | "success" | "error";

function formatDateTime(value: string) {
    return new Intl.DateTimeFormat("zh-TW", {
        ...taipeiDateTimeFormatOptions,
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

export default function EventCheckInClient({ event, token, isLoggedIn }: Props) {
    const [state, setState] = useState<CheckInState>("idle");
    const [phone, setPhone] = useState("");
    const [message, setMessage] = useState(isLoggedIn ? "請輸入報名電話末三碼完成報到。" : "請先登入 Google 帳號完成報到。");
    const callbackUrl = useMemo(() => {
        const path = `/events/${event.slug || event.id}/check-in?token=${encodeURIComponent(token)}`;
        return `/login?callbackUrl=${encodeURIComponent(path)}`;
    }, [event.id, event.slug, token]);

    const checkIn = async (e: FormEvent) => {
        e.preventDefault();
        setState("checking");
        setMessage("正在確認你的報到...");

        try {
            const res = await fetch(`/api/volunteer-events/${event.id}/check-in`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, phone }),
            });

            if (!res.ok) {
                const error = await res.json().catch(() => ({}));
                throw new Error(error.error || "報到失敗，請找現場工作人員協助。");
            }

            setState("success");
            setMessage("報到成功！這場活動已經列入你的出席紀錄。");
        } catch (error) {
            setState("error");
            setMessage(error instanceof Error ? error.message : "報到失敗，請找現場工作人員協助。");
        }
    };

    return (
        <main className="min-h-screen tpp-page pt-20 px-4">
            <div className="mx-auto max-w-xl">
                <section className="glass-panel rounded-2xl p-6 sm:p-8 text-center">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
                        {state === "checking" ? (
                            <Loader2 className="h-8 w-8 animate-spin text-[#61C5C7]" />
                        ) : state === "success" ? (
                            <CheckCircle2 className="h-8 w-8 text-[#61C5C7]" />
                        ) : state === "error" ? (
                            <XCircle className="h-8 w-8 text-red-300" />
                        ) : (
                            <QrCode className="h-8 w-8 text-[#61C5C7]" />
                        )}
                    </div>

                    <p className="text-sm font-semibold text-blue-200">志工活動報到</p>
                    <h1 className="mt-2 text-2xl sm:text-3xl font-black text-white">{event.title}</h1>
                    <p className="mt-3 text-sm text-slate-400">
                        {formatDateTime(event.startsAt)}｜{event.location || "線上活動"}
                    </p>

                    <div className="mt-6 rounded-xl border border-white/10 bg-black/20 px-4 py-4 text-slate-200">
                        {message}
                    </div>

                    {!isLoggedIn && (
                        <a
                            href={callbackUrl}
                            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl tpp-primary-button px-5 py-3 font-semibold transition  sm:w-auto"
                        >
                            <LogIn className="h-4 w-4" />
                            使用 Google 登入並報到
                        </a>
                    )}

                    {isLoggedIn && state !== "success" && (
                        <form onSubmit={checkIn} className="mt-6 space-y-4 text-left">
                            <div>
                                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-200">
                                    <Phone className="h-4 w-4 text-[#61C5C7]" />
                                    報名電話末三碼
                                </label>
                                <input
                                    type="tel"
                                    inputMode="numeric"
                                    pattern="[0-9]{3}"
                                    maxLength={3}
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 3))}
                                    placeholder="例如 494"
                                    required
                                    className="w-full glass-input rounded-xl px-4 py-3"
                                />
                                <p className="mt-2 text-xs leading-5 text-slate-400">
                                    末三碼需與報名時登記的電話一致，系統才會完成報到。
                                </p>
                            </div>
                            <button
                                type="submit"
                                disabled={state === "checking"}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl tpp-primary-button px-5 py-3 font-semibold transition disabled:opacity-50"
                            >
                                {state === "checking" ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                                確認報到
                            </button>
                        </form>
                    )}

                    <div className="mt-6">
                        <Link href={`/events/${event.slug || event.id}`} className="text-sm text-slate-300 hover:text-white">
                            返回活動頁
                        </Link>
                    </div>
                </section>
            </div>
        </main>
    );
}
