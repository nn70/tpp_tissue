"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, LogIn, QrCode, XCircle } from "lucide-react";

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
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

export default function EventCheckInClient({ event, token, isLoggedIn }: Props) {
    const [state, setState] = useState<CheckInState>(isLoggedIn ? "checking" : "idle");
    const [message, setMessage] = useState(isLoggedIn ? "正在確認你的報到..." : "請先登入 Google 帳號完成報到。");
    const callbackUrl = useMemo(() => {
        const path = `/events/${event.slug || event.id}/check-in?token=${encodeURIComponent(token)}`;
        return `/api/auth/signin/google?callbackUrl=${encodeURIComponent(path)}`;
    }, [event.id, event.slug, token]);

    useEffect(() => {
        if (!isLoggedIn) return;

        let cancelled = false;

        async function checkIn() {
            setState("checking");
            setMessage("正在確認你的報到...");

            try {
                const res = await fetch(`/api/volunteer-events/${event.id}/check-in`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token }),
                });

                if (!res.ok) {
                    const error = await res.json().catch(() => ({}));
                    throw new Error(error.error || "報到失敗，請找現場工作人員協助。");
                }

                if (!cancelled) {
                    setState("success");
                    setMessage("報到成功！這場活動已經列入你的出席紀錄。");
                }
            } catch (error) {
                if (!cancelled) {
                    setState("error");
                    setMessage(error instanceof Error ? error.message : "報到失敗，請找現場工作人員協助。");
                }
            }
        }

        checkIn();

        return () => {
            cancelled = true;
        };
    }, [event.id, isLoggedIn, token]);

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
