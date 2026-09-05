"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarDays, CheckCircle2, Clock, ExternalLink, Loader2, MapPin, Phone, User, UserCheck } from "lucide-react";
import { askToAddGoogleCalendar, buildGoogleCalendarUrl } from "@/lib/calendar";
import { DEFAULT_VOLUNTEER_EVENT_CATEGORY, getVolunteerEventCoverImage } from "@/lib/volunteerEventCategories";

type RegistrationStatus = "REGISTERED" | "WAITLISTED" | "ATTENDED" | "CANCELLED";

type EventDetail = {
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
    registrationDeadline: string | null;
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
};

type Props = {
    event: EventDetail;
    isLoggedIn: boolean;
    currentUserProfile: { name: string | null; phone: string | null } | null;
};

function getEventStatus(event: EventDetail) {
    const now = Date.now();
    const startsAt = new Date(event.startsAt).getTime();
    const closesAt = new Date(event.registrationDeadline ?? event.startsAt).getTime();

    if (startsAt < now) return { label: "活動已結束", tone: "bg-slate-700 text-slate-200" };
    if (closesAt < now) return { label: "報名已截止", tone: "bg-red-500/20 text-red-200 border-red-400/30" };
    return { label: "報名開放中", tone: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30" };
}

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

export default function EventDetailClient({ event, isLoggedIn, currentUserProfile }: Props) {
    const [note, setNote] = useState(event.currentUserRegistration?.note ?? "");
    const [name, setName] = useState(event.currentUserRegistration?.name ?? currentUserProfile?.name ?? "");
    const [phone, setPhone] = useState(event.currentUserRegistration?.phone ?? currentUserProfile?.phone ?? "");
    const [registration, setRegistration] = useState(event.currentUserRegistration);
    const [registrationCount, setRegistrationCount] = useState(event.registrationCount);
    const [waitlistCount, setWaitlistCount] = useState(event.waitlistCount);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const status = getEventStatus(event);
    const closesAt = new Date(event.registrationDeadline ?? event.startsAt).getTime();
    const isClosed = closesAt < Date.now() || new Date(event.startsAt).getTime() < Date.now();
    const isWaitlisted = registration?.status === "WAITLISTED";
    const isRegistered = registration?.status === "REGISTERED" || registration?.status === "ATTENDED" || isWaitlisted;
    const isFull = event.capacity !== null && registrationCount >= event.capacity;
    const mapQuery = event.location || event.mapUrl;
    const mapEmbedUrl = mapQuery ? `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed` : null;
    const coverImageUrl = getVolunteerEventCoverImage(event);

    const submitRegistration = async () => {
        setSaving(true);
        setMessage(null);

        if (!name.trim() || !phone.trim()) {
            setMessage("請先填寫姓名與聯絡電話，方便活動前聯絡與現場報到確認。");
            setSaving(false);
            return;
        }

        try {
            const res = await fetch(`/api/volunteer-events/${event.id}/registrations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, note, phone }),
            });

            if (!res.ok) {
                const error = await res.json().catch(() => ({}));
                setMessage(error.error === "Registration closed" ? "報名已截止。" : error.error || "報名失敗，請稍後再試。");
                return;
            }

            const data = await res.json();
            setRegistration(data);
            if (!isRegistered && data.status !== "WAITLISTED") {
                setRegistrationCount((count) => count + 1);
            }
            if (!isRegistered && data.status === "WAITLISTED") {
                setWaitlistCount((count) => count + 1);
            }
            setMessage(data.status === "WAITLISTED" ? "候補報名成功，若有名額釋出會由主辦方通知。" : "報名成功，後台已記錄你的參與資料。");
            askToAddGoogleCalendar(event);
        } finally {
            setSaving(false);
        }
    };

    return (
        <main className="min-h-screen tpp-page pt-16">
            <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
                <Link href="/forum" className="inline-flex text-sm text-slate-300 hover:text-white mb-5">
                    ← 返回活動列表
                </Link>

                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30 mb-6">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={coverImageUrl} alt={event.title} className="w-full max-h-[420px] object-cover" />
                    <div className="border-t border-white/10 bg-black/20 px-4 py-2 text-xs font-semibold text-[#D9FFFF]">
                        {event.category || DEFAULT_VOLUNTEER_EVENT_CATEGORY}
                    </div>
                </div>

                <section className="glass-panel rounded-2xl p-6 sm:p-8">
                    <div className="mb-4">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${status.tone}`}>
                            活動 {status.label}
                        </span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-black text-white">{event.title}</h1>

                    <div className="mt-6 grid sm:grid-cols-2 gap-4">
                        <div className="rounded-xl bg-black/20 border border-white/10 p-4">
                            <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                                <CalendarDays className="w-4 h-4 text-[#61C5C7]" />
                                日期時間
                            </div>
                            <div className="font-semibold">{formatDateTime(event.startsAt)}</div>
                            {event.endsAt && <div className="text-sm text-slate-400 mt-1">至 {formatDateTime(event.endsAt)}</div>}
                        </div>

                        <div className="rounded-xl bg-black/20 border border-white/10 p-4">
                            <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                                <MapPin className="w-4 h-4 text-[#61C5C7]" />
                                活動地點
                            </div>
                            <div className="font-semibold">{event.location || "線上活動"}</div>
                        </div>
                    </div>

                    <div className="mt-5 rounded-xl bg-black/20 border border-white/10 p-4 text-sm text-slate-300">
                        已報名 {registrationCount} 人{event.capacity ? `，預期 ${event.capacity} 人` : ""}
                        {waitlistCount > 0 ? `，候補 ${waitlistCount} 人` : ""}
                    </div>

                    {mapEmbedUrl && (
                        <div className="mt-5 overflow-hidden rounded-xl border border-white/10 bg-black/20">
                            <iframe
                                title={`${event.title} 活動地圖`}
                                src={mapEmbedUrl}
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                className="h-72 w-full border-0"
                            />
                        </div>
                    )}

                    <div className="mt-5 flex flex-wrap gap-3">
                        <a href={buildGoogleCalendarUrl(event)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl tpp-primary-button px-4 py-2 text-sm font-semibold transition">
                            <ExternalLink className="w-4 h-4" />
                            加入 Google 行事曆
                        </a>
                    </div>
                </section>

                <section className="mt-6 glass-panel rounded-2xl p-6 sm:p-8">
                    <h2 className="text-2xl font-bold mb-4">活動說明</h2>
                    <div className="whitespace-pre-wrap leading-8 text-slate-200">
                        {event.description || "尚未填寫活動說明。"}
                    </div>
                </section>

                <section className="mt-6 glass-panel rounded-2xl p-6 sm:p-8">
                    <h2 className="text-2xl font-bold mb-4">立即報名</h2>

                    {message && <div className="mb-4 rounded-xl border border-[#61C5C7]/25 bg-[#61C5C7]/10 px-4 py-3 text-[#D9FFFF]">{message}</div>}

                    {!isLoggedIn ? (
                        <div className="rounded-xl bg-black/20 border border-white/10 p-5">
                            <div className="font-semibold text-white">請先登入 Google 帳號再報名。</div>
                            <Link href="/login" className="mt-4 inline-flex rounded-xl tpp-primary-button px-5 py-3 text-sm font-semibold transition">
                                前往登入
                            </Link>
                        </div>
                    ) : isClosed ? (
                        <div className="rounded-xl bg-red-500/10 border border-red-400/20 p-5">
                            <div className="flex items-center gap-2 font-semibold text-red-100">
                                <Clock className="w-5 h-5" />
                                報名已截止
                            </div>
                            <p className="text-sm text-red-100/75 mt-2">本活動已結束報名，感謝您的關注。</p>
                        </div>
                    ) : registration?.status === "ATTENDED" ? (
                        <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/20 p-5">
                            <div className="flex items-center gap-2 font-semibold text-[#D9FFFF]">
                                <CheckCircle2 className="w-5 h-5" />
                                已確認出席
                            </div>
                        </div>
                    ) : isWaitlisted ? (
                        <div className="rounded-xl bg-amber-400/10 border border-amber-300/30 p-5">
                            <div className="flex items-center gap-2 font-semibold text-amber-100">
                                <CheckCircle2 className="w-5 h-5" />
                                你已完成候補報名
                            </div>
                            {(registration?.phone || currentUserProfile?.phone) && (
                                <p className="text-sm text-amber-100/80 mt-2">
                                    報名姓名：{registration?.name || currentUserProfile?.name || "尚未登記"}<br />
                                    報到電話：{registration?.phone || currentUserProfile?.phone}
                                </p>
                            )}
                            <p className="text-sm text-amber-100/75 mt-2">候補名額不限；若有名額釋出，將由主辦方通知。</p>
                        </div>
                    ) : isRegistered ? (
                        <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/20 p-5">
                            <div className="flex items-center gap-2 font-semibold text-[#D9FFFF]">
                                <CheckCircle2 className="w-5 h-5" />
                                你已完成報名
                            </div>
                            {(registration?.phone || currentUserProfile?.phone) && (
                                <p className="text-sm text-[#D9FFFF]/75 mt-2">
                                    報名姓名：{registration?.name || currentUserProfile?.name || "尚未登記"}<br />
                                    報到電話：{registration?.phone || currentUserProfile?.phone}
                                </p>
                            )}
                            <p className="text-sm text-[#D9FFFF]/75 mt-2">活動結束後由後台確認出席，才會累計服務里程碑次數。</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="text-sm text-slate-400">
                                已報名 {registrationCount} 人{event.capacity ? `，預期 ${event.capacity} 人` : ""}
                                {waitlistCount > 0 ? `，候補 ${waitlistCount} 人` : ""}
                            </div>
                            <div>
                                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-200">
                                    <User className="w-4 h-4 text-[#61C5C7]" />
                                    姓名
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="請輸入姓名"
                                    className="w-full glass-input rounded-xl px-4 py-3"
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-200">
                                    <Phone className="w-4 h-4 text-[#61C5C7]" />
                                    聯絡電話
                                </label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="請輸入手機或聯絡電話"
                                    className="w-full glass-input rounded-xl px-4 py-3"
                                    required
                                />
                                <p className="mt-2 text-xs leading-5 text-slate-400">
                                    第一次報名會保存姓名與電話，之後報名會自動帶出；現場 QR 報到時需輸入相同電話。
                                </p>
                            </div>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="備註，例如可支援的時段或交通方式"
                                className="w-full min-h-28 glass-input rounded-xl px-4 py-3"
                            />
                            <button
                                type="button"
                                onClick={submitRegistration}
                                disabled={saving}
                                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl tpp-primary-button disabled:opacity-50 px-6 py-3 font-semibold transition"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                                {isFull ? "候補報名" : "送出報名"}
                            </button>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
