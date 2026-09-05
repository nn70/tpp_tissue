"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, CheckCircle2, Gift, Loader2, MapPin, UserCheck, Users } from "lucide-react";
import { askToAddGoogleCalendar } from "@/lib/calendar";

type RegistrationStatus = "REGISTERED" | "ATTENDED" | "CANCELLED";

type VolunteerEvent = {
    id: string;
    slug: string | null;
    title: string;
    description: string | null;
    location: string | null;
    startsAt: string;
    endsAt: string | null;
    capacity: number | null;
    registrationCount: number;
    currentUserRegistration: {
        id: string;
        status: RegistrationStatus;
        note: string | null;
    } | null;
};

type RewardProgress = {
    attendedCount: number;
    next: { times: number; title: string; description: string } | null;
    remainingToNext: number;
    unlocked: { times: number; title: string; description: string }[];
};

export default function VolunteerForumClient() {
    const [events, setEvents] = useState<VolunteerEvent[]>([]);
    const [rewardProgress, setRewardProgress] = useState<RewardProgress | null>(null);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [notes, setNotes] = useState<Record<string, string>>({});
    const [message, setMessage] = useState<string | null>(null);

    const fetchEvents = async () => {
        try {
            const res = await fetch("/api/volunteer-events");
            if (res.ok) {
                const data = await res.json();
                setEvents(data.events);
                setRewardProgress(data.rewardProgress);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const nextEvent = useMemo(() => {
        return events.find((event) => new Date(event.startsAt).getTime() >= Date.now()) ?? events[0] ?? null;
    }, [events]);

    const register = async (event: VolunteerEvent) => {
        const eventId = event.id;
        setSavingId(eventId);
        setMessage(null);

        try {
            const res = await fetch(`/api/volunteer-events/${eventId}/registrations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ note: notes[eventId] ?? "" }),
            });

            if (!res.ok) {
                const error = await res.json().catch(() => ({}));
                setMessage(error.error || "報名失敗，請稍後再試。");
                return;
            }

            setMessage("報名成功，後台已可追蹤你的參與紀錄。");
            askToAddGoogleCalendar(event);
            await fetchEvents();
        } finally {
            setSavingId(null);
        }
    };

    const cancelRegistration = async (eventId: string) => {
        setSavingId(eventId);
        setMessage(null);

        try {
            const res = await fetch(`/api/volunteer-events/${eventId}/registrations`, { method: "DELETE" });
            if (!res.ok) {
                setMessage("取消報名失敗，請稍後再試。");
                return;
            }

            setMessage("已取消報名。");
            await fetchEvents();
        } finally {
            setSavingId(null);
        }
    };

    const formatDateTime = (value: string) => {
        return new Intl.DateTimeFormat("zh-TW", {
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(value));
    };

    return (
        <main className="min-h-screen bg-[#0f1016] text-slate-100 pt-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-6 pb-10">
                <section className="grid lg:grid-cols-[1.5fr_1fr] gap-4">
                    <div className="glass-panel rounded-2xl p-6">
                        <div className="flex items-center gap-3 text-slate-300 mb-4">
                            <Users className="w-5 h-5 text-blue-300" />
                            <span className="text-sm">志工活動報名</span>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-3">登入 Google 帳號後即可報名活動</h1>
                        <p className="text-slate-400 leading-7">
                            每次活動由後台確認出席後才會累計次數；達到 5、10、20、50 次時會解鎖不同獎勵。
                        </p>
                        {nextEvent && (
                            <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-300">
                                <span className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
                                    <CalendarDays className="w-4 h-4 text-blue-300" />
                                    下一場：{formatDateTime(nextEvent.startsAt)}
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
                                    <MapPin className="w-4 h-4 text-emerald-300" />
                                    {nextEvent.location || "線上活動"}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="glass-panel rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Gift className="w-5 h-5 text-amber-300" />
                            <h2 className="font-bold">我的獎勵進度</h2>
                        </div>
                        <div className="text-4xl font-black text-white">{rewardProgress?.attendedCount ?? 0}</div>
                        <p className="text-sm text-slate-400 mt-1">已確認出席活動次數</p>
                        <div className="mt-5 rounded-xl bg-black/20 border border-white/10 p-4">
                            {rewardProgress?.next ? (
                                <>
                                    <div className="font-semibold text-slate-200">下一個目標：{rewardProgress.next.title}</div>
                                    <div className="text-sm text-slate-400 mt-1">再參加 {rewardProgress.remainingToNext} 次可解鎖</div>
                                </>
                            ) : (
                                <div className="font-semibold text-amber-200">已達成所有獎勵門檻</div>
                            )}
                        </div>
                    </div>
                </section>

                {message && (
                    <div className="rounded-xl border border-blue-400/20 bg-blue-500/10 px-4 py-3 text-blue-200">
                        {message}
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-20 text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mr-2" />
                        載入活動中...
                    </div>
                ) : events.length === 0 ? (
                    <div className="glass-panel rounded-2xl p-10 text-center text-slate-400">
                        目前尚未開放志工活動。
                    </div>
                ) : (
                    <section className="grid md:grid-cols-2 gap-4">
                        {events.map((event) => {
                            const status = event.currentUserRegistration?.status;
                            const isRegistered = status === "REGISTERED" || status === "ATTENDED";

                            return (
                                <article key={event.id} className="glass-panel rounded-2xl p-5 space-y-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h2 className="text-xl font-bold text-white">{event.title}</h2>
                                            <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-400">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <CalendarDays className="w-4 h-4" />
                                                    {formatDateTime(event.startsAt)}
                                                </span>
                                                <span className="inline-flex items-center gap-1.5">
                                                    <MapPin className="w-4 h-4" />
                                                    {event.location || "線上活動"}
                                                </span>
                                            </div>
                                        </div>
                                        {status === "ATTENDED" && <CheckCircle2 className="w-6 h-6 text-emerald-300 shrink-0" />}
                                    </div>

                                    {event.description && <p className="text-sm text-slate-300 leading-6">{event.description}</p>}

                                    <div className="text-sm text-slate-400">
                                        已報名 {event.registrationCount} 人{event.capacity ? `，預期 ${event.capacity} 人` : ""}
                                    </div>

                                    {!isRegistered && (
                                        <textarea
                                            value={notes[event.id] ?? ""}
                                            onChange={(e) => setNotes((prev) => ({ ...prev, [event.id]: e.target.value }))}
                                            placeholder="備註，例如可支援的時段或交通方式"
                                            className="w-full min-h-20 glass-input rounded-xl px-3 py-2 text-sm"
                                        />
                                    )}

                                    <div className="flex gap-3">
                                        <Link
                                            href={`/events/${event.slug || event.id}`}
                                            className="inline-flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/15 px-4 py-3 text-sm font-semibold transition"
                                        >
                                            查看詳情
                                        </Link>
                                        {isRegistered ? (
                                            <button
                                                type="button"
                                                onClick={() => cancelRegistration(event.id)}
                                                disabled={savingId === event.id || status === "ATTENDED"}
                                                className="flex-1 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-50 px-4 py-3 text-sm font-semibold transition"
                                            >
                                                {status === "ATTENDED" ? "已確認出席" : "取消報名"}
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => register(event)}
                                                disabled={savingId === event.id}
                                                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-3 text-sm font-semibold transition"
                                            >
                                                {savingId === event.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                                                我要報名
                                            </button>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </section>
                )}
            </div>
        </main>
    );
}
