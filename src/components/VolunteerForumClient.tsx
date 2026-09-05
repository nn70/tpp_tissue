"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, CheckCircle2, Gift, Loader2, MapPin, Phone, Save, User, UserCheck, Users } from "lucide-react";
import { askToAddGoogleCalendar } from "@/lib/calendar";
import { getVolunteerEventCoverImage } from "@/lib/volunteerEventCategories";
import { taipeiDateTimeFormatOptions } from "@/lib/taipeiTime";

type RegistrationStatus = "REGISTERED" | "WAITLISTED" | "ATTENDED" | "CANCELLED";

type VolunteerEvent = {
    id: string;
    slug: string | null;
    title: string;
    category: string | null;
    description: string | null;
    location: string | null;
    mapUrl: string | null;
    coverImageUrl: string | null;
    startsAt: string;
    endsAt: string | null;
    capacity: number | null;
    registrationCount: number;
    waitlistCount: number;
    currentUserRegistration: {
        id: string;
        status: RegistrationStatus;
        name: string | null;
        note: string | null;
        phone: string | null;
    } | null;
    participants?: {
        id: string;
        name: string;
        status: RegistrationStatus;
        email?: string | null;
        phone?: string | null;
        note?: string | null;
    }[];
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
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [savedName, setSavedName] = useState("");
    const [savedPhone, setSavedPhone] = useState("");
    const [profileSaving, setProfileSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const statusLabels: Record<RegistrationStatus, string> = {
        REGISTERED: "已報名",
        WAITLISTED: "候補",
        ATTENDED: "已出席",
        CANCELLED: "已取消",
    };

    const fetchEvents = async () => {
        try {
            const res = await fetch("/api/volunteer-events");
            if (res.ok) {
                const data = await res.json();
                setEvents(data.events);
                setRewardProgress(data.rewardProgress);
                const profileName = data.currentUserProfile?.name ?? "";
                const profilePhone = data.currentUserProfile?.phone ?? "";
                setName(profileName);
                setPhone(profilePhone);
                setSavedName(profileName);
                setSavedPhone(profilePhone);
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
    const profileChanged = name.trim() !== savedName.trim() || phone.trim() !== savedPhone.trim();

    const saveProfile = async () => {
        setProfileSaving(true);
        setMessage(null);

        if (!name.trim() || !phone.trim()) {
            setMessage("請填寫姓名與聯絡電話後再儲存。");
            setProfileSaving(false);
            return;
        }

        try {
            const res = await fetch("/api/volunteer-profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, phone }),
            });

            if (!res.ok) {
                const error = await res.json().catch(() => ({}));
                setMessage(error.error === "Phone required" ? "請輸入有效的聯絡電話。" : error.error || "資料儲存失敗，請稍後再試。");
                return;
            }

            const data = await res.json();
            setSavedName(data.user.name ?? "");
            setSavedPhone(data.user.phone ?? "");
            setName(data.user.name ?? "");
            setPhone(data.user.phone ?? "");
            setEvents((currentEvents) => currentEvents.map((event) => {
                if (!event.currentUserRegistration || event.currentUserRegistration.status === "ATTENDED" || event.currentUserRegistration.status === "CANCELLED") {
                    return event;
                }

                return {
                    ...event,
                    currentUserRegistration: {
                        ...event.currentUserRegistration,
                        name: data.user.name ?? "",
                        phone: data.user.phone ?? "",
                    },
                };
            }));
            setMessage(data.changed ? "個人資料已更新，後台已保存修改紀錄。" : "個人資料沒有變更。");
        } finally {
            setProfileSaving(false);
        }
    };

    const register = async (event: VolunteerEvent) => {
        const eventId = event.id;
        setSavingId(eventId);
        setMessage(null);

        if (!name.trim() || !phone.trim()) {
            setMessage("請先填寫姓名與聯絡電話，方便活動前聯絡與現場報到確認。");
            setSavingId(null);
            return;
        }

        try {
            const res = await fetch(`/api/volunteer-events/${eventId}/registrations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, note: notes[eventId] ?? "", phone }),
            });

            if (!res.ok) {
                const error = await res.json().catch(() => ({}));
                setMessage(error.error || "報名失敗，請稍後再試。");
                return;
            }

            const data = await res.json();
            setMessage(data.status === "WAITLISTED" ? "候補報名成功，若有名額釋出會由主辦方通知。" : "報名成功，後台已記錄你的參與資料。");
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
            ...taipeiDateTimeFormatOptions,
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(value));
    };

    return (
        <main className="min-h-screen tpp-page pt-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-6 pb-10">
                <section>
                    <div className="glass-panel rounded-2xl p-6">
                        <div className="flex items-center gap-3 text-slate-300 mb-4">
                            <Users className="w-5 h-5 text-[#61C5C7]" />
                            <span className="text-sm">志工活動報名</span>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-3">登入 Google 帳號後即可報名活動</h1>
                        {nextEvent && (
                            <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-300">
                                <span className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
                                    <CalendarDays className="w-4 h-4 text-[#61C5C7]" />
                                    下一場：{formatDateTime(nextEvent.startsAt)}
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
                                    <MapPin className="w-4 h-4 text-[#61C5C7]" />
                                    {nextEvent.location || "線上活動"}
                                </span>
                            </div>
                        )}
                    </div>
                </section>

                <section className="glass-panel rounded-2xl p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                                <Phone className="w-4 h-4 text-[#61C5C7]" />
                                志工個人資料
                            </div>
                            <p className="mt-1 text-xs leading-5 text-slate-400">
                                第一次報名請留下姓名與電話，之後系統會自動帶出。
                            </p>
                        </div>
                        <div className="grid w-full gap-2 sm:max-w-2xl sm:grid-cols-[1fr_1fr_auto]">
                            <label className="relative min-w-0">
                                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#61C5C7]" />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="請輸入姓名"
                                    className="w-full glass-input rounded-xl py-3 pl-10 pr-4"
                                />
                            </label>
                            <label className="relative min-w-0">
                                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#61C5C7]" />
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="請輸入手機或聯絡電話"
                                    className="w-full glass-input rounded-xl py-3 pl-10 pr-4"
                                />
                            </label>
                            <button
                                type="button"
                                onClick={saveProfile}
                                disabled={profileSaving || !profileChanged}
                                className="inline-flex items-center justify-center gap-2 rounded-xl tpp-primary-button px-4 py-3 text-sm font-semibold disabled:opacity-50"
                            >
                                {profileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                儲存資料
                            </button>
                        </div>
                    </div>
                </section>

                {message && (
                    <div className="rounded-xl border border-[#61C5C7]/25 bg-[#61C5C7]/10 px-4 py-3 text-[#D9FFFF]">
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
                            const isWaitlisted = status === "WAITLISTED";
                            const isRegistered = status === "REGISTERED" || status === "ATTENDED" || isWaitlisted;
                            const isFull = event.capacity !== null && event.registrationCount >= event.capacity;
                            const coverImageUrl = getVolunteerEventCoverImage(event);
                            const mapQuery = event.location || event.mapUrl;
                            const mapEmbedUrl = mapQuery ? `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed` : null;

                            return (
                                <article key={event.id} className="glass-panel rounded-2xl p-5 space-y-4">
                                    {coverImageUrl && (
                                        <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={coverImageUrl} alt={event.title} className="h-44 w-full object-cover" />
                                        </div>
                                    )}
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            {event.category && (
                                                <div className="mb-2 inline-flex rounded-full border border-[#61C5C7]/25 bg-[#61C5C7]/10 px-2.5 py-1 text-xs font-semibold text-[#D9FFFF]">
                                                    {event.category}
                                                </div>
                                            )}
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
                                        {status === "ATTENDED" && <CheckCircle2 className="w-6 h-6 text-[#61C5C7] shrink-0" />}
                                        {isWaitlisted && (
                                            <span className="shrink-0 rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-100">
                                                候補
                                            </span>
                                        )}
                                    </div>

                                    {event.description && <p className="text-sm text-slate-300 leading-6">{event.description}</p>}

                                    {mapEmbedUrl && (
                                        <div className="overflow-hidden rounded-xl border border-[#61C5C7]/20 bg-white/70">
                                            <iframe
                                                title={`${event.title} 地圖`}
                                                src={mapEmbedUrl}
                                                className="h-48 w-full border-0"
                                                loading="lazy"
                                                referrerPolicy="no-referrer-when-downgrade"
                                            />
                                        </div>
                                    )}

                                    <div className="text-sm text-slate-400">
                                        已報名 {event.registrationCount} 人{event.capacity ? `，預期 ${event.capacity} 人` : ""}
                                        {event.waitlistCount > 0 ? `，候補 ${event.waitlistCount} 人` : ""}
                                    </div>

                                    {isRegistered && (
                                        <div className={`rounded-xl border px-3 py-2 text-sm ${isWaitlisted ? "border-amber-300/30 bg-amber-400/10 text-amber-100" : "border-[#61C5C7]/20 bg-[#61C5C7]/10 text-[#D9FFFF]"}`}>
                                            {isWaitlisted && <div className="mb-1 font-semibold">目前為候補報名，候補名額不限。</div>}
                                            報名姓名：{event.currentUserRegistration?.name || name || "尚未登記"}<br />
                                            報到電話：{event.currentUserRegistration?.phone || phone || "尚未登記，請聯絡工作人員補登"}
                                        </div>
                                    )}

                                    {event.participants && event.participants.length > 0 && (
                                        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-200">
                                                <Users className="h-4 w-4 text-[#61C5C7]" />
                                                已報名志工
                                            </div>
                                            <div className="space-y-2">
                                                {event.participants.map((participant) => (
                                                    <div key={participant.id} className="rounded-lg bg-black/15 px-3 py-2 text-sm text-slate-300">
                                                        <div className="font-medium text-slate-100">
                                                            {participant.name}
                                                            {participant.status === "WAITLISTED" && <span className="ml-2 text-xs text-amber-100">候補</span>}
                                                        </div>
                                                        {(participant.email || participant.phone || participant.note) && (
                                                            <div className="mt-1 text-xs leading-5 text-slate-400">
                                                                {participant.email && <div>Email：{participant.email}</div>}
                                                                {participant.phone && <div>電話：{participant.phone}</div>}
                                                                <div>狀態：{statusLabels[participant.status]}</div>
                                                                {participant.note && <div>備註：{participant.note}</div>}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

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
                                                {status === "ATTENDED" ? "已確認出席" : isWaitlisted ? "取消候補" : "取消報名"}
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => register(event)}
                                                disabled={savingId === event.id}
                                                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl tpp-primary-button disabled:opacity-50 px-4 py-3 text-sm font-semibold transition"
                                            >
                                                {savingId === event.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                                                {isFull ? "候補報名" : "我要報名"}
                                            </button>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </section>
                )}

                <section className="glass-panel rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Gift className="w-5 h-5 text-[#F4F7F7]" />
                        <h2 className="font-bold">我的服務里程碑</h2>
                    </div>
                    <div className="text-4xl font-black text-white">{rewardProgress?.attendedCount ?? 0}</div>
                    <p className="text-sm text-slate-400 mt-1">已確認出席活動次數</p>
                    <div className="mt-5 rounded-xl bg-black/20 border border-white/10 p-4">
                        {rewardProgress?.next ? (
                            <>
                                <div className="font-semibold text-slate-200">下一個里程碑：{rewardProgress.next.title}</div>
                                <div className="text-sm text-slate-400 mt-1">再參加 {rewardProgress.remainingToNext} 次可解鎖</div>
                            </>
                        ) : (
                            <div className="font-semibold text-[#D9FFFF]">已達成所有里程碑</div>
                        )}
                    </div>
                    <p className="mt-4 text-sm leading-6 text-slate-400">
                        每次活動完成現場 QR Code 報到後才會累計次數；達到 3、10、20、30、50 次時會解鎖志工服務里程碑。
                    </p>
                    <Link href="/volunteer-rewards" className="mt-4 inline-flex text-sm font-semibold text-[#D9FFFF] hover:text-white">
                        查看完整里程碑說明
                    </Link>
                    <p className="mt-3 text-xs leading-5 text-slate-500">
                        里程碑僅作為志工服務紀錄、感謝與活動安排參考；所有內容皆須符合選罷法，不得作為投票或助選行為之對價。
                    </p>
                </section>
            </div>
        </main>
    );
}
