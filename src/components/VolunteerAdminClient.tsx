"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarPlus, CheckCircle2, Gift, Link2, Loader2, RefreshCw, Users } from "lucide-react";
import AddressInput from "@/components/AddressInput";

type RegistrationStatus = "REGISTERED" | "ATTENDED" | "CANCELLED";

type AdminRegistration = {
    id: string;
    note: string | null;
    status: RegistrationStatus;
    createdAt: string;
    user: {
        id: string;
        name: string | null;
        email: string | null;
        image: string | null;
    };
};

type AdminEvent = {
    id: string;
    slug: string | null;
    title: string;
    description: string | null;
    location: string | null;
    mapUrl: string | null;
    coverImageUrl: string | null;
    startsAt: string;
    endsAt: string | null;
    registrationDeadline: string | null;
    capacity: number | null;
    isActive: boolean;
    registrations: AdminRegistration[];
};

type VolunteerStats = {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    attendedCount: number;
    next: { times: number; title: string; description: string } | null;
    remainingToNext: number;
    unlocked: { times: number; title: string; description: string }[];
};

const statusLabels: Record<RegistrationStatus, string> = {
    REGISTERED: "已報名",
    ATTENDED: "已出席",
    CANCELLED: "已取消",
};

export default function VolunteerAdminClient() {
    const [events, setEvents] = useState<AdminEvent[]>([]);
    const [volunteers, setVolunteers] = useState<VolunteerStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [form, setForm] = useState({
        title: "",
        slug: "",
        description: "",
        location: "",
        mapUrl: "",
        coverImageUrl: "",
        startsAt: "",
        endsAt: "",
        registrationDeadline: "",
        capacity: "",
    });

    const fetchAdminData = async () => {
        try {
            const res = await fetch("/api/volunteer-admin");
            if (res.ok) {
                const data = await res.json();
                setEvents(data.events);
                setVolunteers(data.volunteers);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdminData();
    }, []);

    const totals = useMemo(() => {
        const registrations = events.flatMap((event) => event.registrations);
        return {
            events: events.length,
            registered: registrations.filter((registration) => registration.status === "REGISTERED").length,
            attended: registrations.filter((registration) => registration.status === "ATTENDED").length,
        };
    }, [events]);

    const createEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch("/api/volunteer-events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    capacity: form.capacity ? Number(form.capacity) : null,
                    endsAt: form.endsAt || null,
                }),
            });

            if (res.ok) {
                setForm({ title: "", slug: "", description: "", location: "", mapUrl: "", coverImageUrl: "", startsAt: "", endsAt: "", registrationDeadline: "", capacity: "" });
                await fetchAdminData();
            } else {
                alert("建立活動失敗，請確認必填欄位。");
            }
        } finally {
            setSaving(false);
        }
    };

    const handlePlaceSelected = (place: { address: string; lat: number; lng: number; placeId?: string }) => {
        const query = encodeURIComponent(place.address);
        const placeParam = place.placeId ? `&query_place_id=${encodeURIComponent(place.placeId)}` : "";

        setForm((prev) => ({
            ...prev,
            location: place.address,
            mapUrl: `https://www.google.com/maps/search/?api=1&query=${query}${placeParam}`,
        }));
    };

    const updateRegistration = async (registrationId: string, status: RegistrationStatus) => {
        setUpdatingId(registrationId);

        try {
            const res = await fetch("/api/volunteer-admin/registrations", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ registrationId, status }),
            });

            if (res.ok) {
                await fetchAdminData();
            } else {
                alert("更新報名狀態失敗。");
            }
        } finally {
            setUpdatingId(null);
        }
    };

    const formatDateTime = (value: string) => {
        return new Intl.DateTimeFormat("zh-TW", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(value));
    };

    return (
        <main className="min-h-screen bg-[#0f1016] text-slate-100 pt-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-6 pb-10">
                <section className="grid md:grid-cols-3 gap-4">
                    <div className="glass-panel rounded-2xl p-5">
                        <div className="text-sm text-slate-400">活動數</div>
                        <div className="text-3xl font-black mt-2">{totals.events}</div>
                    </div>
                    <div className="glass-panel rounded-2xl p-5">
                        <div className="text-sm text-slate-400">目前報名</div>
                        <div className="text-3xl font-black mt-2">{totals.registered}</div>
                    </div>
                    <div className="glass-panel rounded-2xl p-5">
                        <div className="text-sm text-slate-400">已確認出席</div>
                        <div className="text-3xl font-black mt-2">{totals.attended}</div>
                    </div>
                </section>

                <section className="grid lg:grid-cols-[0.95fr_1.4fr] gap-5">
                    <form onSubmit={createEvent} className="glass-panel rounded-2xl p-6 space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <CalendarPlus className="w-5 h-5 text-blue-300" />
                            <h1 className="text-xl font-bold">建立志工活動</h1>
                        </div>
                        <input
                            required
                            value={form.title}
                            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                            placeholder="活動名稱"
                            className="w-full glass-input rounded-xl px-4 py-3"
                        />
                        <input
                            value={form.slug}
                            onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                            placeholder="活動網址代號，例如 2026-1-31-diy"
                            className="w-full glass-input rounded-xl px-4 py-3"
                        />
                        <input
                            value={form.coverImageUrl}
                            onChange={(e) => setForm((prev) => ({ ...prev, coverImageUrl: e.target.value }))}
                            placeholder="封面圖網址，可留空"
                            className="w-full glass-input rounded-xl px-4 py-3"
                        />
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                            placeholder="活動說明"
                            className="w-full min-h-24 glass-input rounded-xl px-4 py-3"
                        />
                        <div className="space-y-1">
                            <span className="text-sm text-slate-300">集合地點</span>
                            <AddressInput
                                defaultValue={form.location}
                                onPlaceSelected={handlePlaceSelected}
                                onInputChange={(value) => setForm((prev) => ({ ...prev, location: value }))}
                                placeholder="輸入地點或地址，例如：虎林"
                            />
                        </div>
                        <input
                            value={form.mapUrl}
                            onChange={(e) => setForm((prev) => ({ ...prev, mapUrl: e.target.value }))}
                            placeholder="Google Maps 連結，可留空"
                            className="w-full glass-input rounded-xl px-4 py-3"
                        />
                        <div className="grid sm:grid-cols-2 gap-3">
                            <label className="space-y-1">
                                <span className="text-sm text-slate-300">開始時間</span>
                                <input
                                    required
                                    type="datetime-local"
                                    value={form.startsAt}
                                    onChange={(e) => setForm((prev) => ({ ...prev, startsAt: e.target.value }))}
                                    className="w-full glass-input rounded-xl px-4 py-3"
                                />
                            </label>
                            <label className="space-y-1">
                                <span className="text-sm text-slate-300">結束時間</span>
                                <input
                                    type="datetime-local"
                                    value={form.endsAt}
                                    onChange={(e) => setForm((prev) => ({ ...prev, endsAt: e.target.value }))}
                                    className="w-full glass-input rounded-xl px-4 py-3"
                                />
                            </label>
                        </div>
                        <label className="space-y-1 block">
                            <span className="text-sm text-slate-300">報名截止時間</span>
                            <input
                                type="datetime-local"
                                value={form.registrationDeadline}
                                onChange={(e) => setForm((prev) => ({ ...prev, registrationDeadline: e.target.value }))}
                                className="w-full glass-input rounded-xl px-4 py-3"
                            />
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={form.capacity}
                            onChange={(e) => setForm((prev) => ({ ...prev, capacity: e.target.value }))}
                            placeholder="名額上限，空白代表不限"
                            className="w-full glass-input rounded-xl px-4 py-3"
                        />
                        <button
                            disabled={saving}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 px-4 py-3 font-semibold transition"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarPlus className="w-4 h-4" />}
                            建立活動
                        </button>
                    </form>

                    <section className="glass-panel rounded-2xl p-6">
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <div className="flex items-center gap-3">
                                <Users className="w-5 h-5 text-emerald-300" />
                                <h2 className="text-xl font-bold">活動報名管理</h2>
                            </div>
                            <button onClick={fetchAdminData} className="p-2 rounded-lg hover:bg-white/10 transition" title="重新整理">
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>

                        {loading ? (
                            <div className="py-20 text-center text-slate-400">
                                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                載入中...
                            </div>
                        ) : events.length === 0 ? (
                            <div className="py-20 text-center text-slate-400">尚未建立活動。</div>
                        ) : (
                            <div className="space-y-4 max-h-[720px] overflow-y-auto pr-1">
                                {events.map((event) => (
                                    <article key={event.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                            <div>
                                                <h3 className="font-bold text-white">{event.title}</h3>
                                                <p className="text-sm text-slate-400 mt-1">{formatDateTime(event.startsAt)}{event.location ? `｜${event.location}` : ""}</p>
                                            </div>
                                            <div className="flex flex-col items-start sm:items-end gap-2">
                                                <span className="text-xs text-slate-400">
                                                    {event.registrations.filter((registration) => registration.status !== "CANCELLED").length}
                                                    {event.capacity ? ` / ${event.capacity}` : ""} 人
                                                </span>
                                                <Link
                                                    href={`/events/${event.slug || event.id}`}
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs font-semibold transition"
                                                >
                                                    <Link2 className="w-3.5 h-3.5" />
                                                    活動頁
                                                </Link>
                                            </div>
                                        </div>

                                        <div className="mt-4 space-y-2">
                                            {event.registrations.length === 0 ? (
                                                <div className="text-sm text-slate-500">尚無報名者</div>
                                            ) : (
                                                event.registrations.map((registration) => (
                                                    <div key={registration.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg bg-white/5 p-3">
                                                        <div>
                                                            <div className="font-medium text-slate-200">{registration.user.name || "未命名志工"}</div>
                                                            <div className="text-xs text-slate-400">{registration.user.email}</div>
                                                            {registration.note && <div className="text-xs text-slate-300 mt-1">備註：{registration.note}</div>}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <select
                                                                value={registration.status}
                                                                disabled={updatingId === registration.id}
                                                                onChange={(e) => updateRegistration(registration.id, e.target.value as RegistrationStatus)}
                                                                className="glass-input rounded-lg px-3 py-2 text-sm"
                                                            >
                                                                <option value="REGISTERED">已報名</option>
                                                                <option value="ATTENDED">已出席</option>
                                                                <option value="CANCELLED">已取消</option>
                                                            </select>
                                                            <span className="text-xs text-slate-400 min-w-12">{statusLabels[registration.status]}</span>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                </section>

                <section className="glass-panel rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Gift className="w-5 h-5 text-amber-300" />
                        <h2 className="text-xl font-bold">志工獎勵統計</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-sm text-slate-400 border-b border-white/10">
                                <tr>
                                    <th className="py-3 pr-4">志工</th>
                                    <th className="py-3 px-4">出席次數</th>
                                    <th className="py-3 px-4">已解鎖</th>
                                    <th className="py-3 pl-4">下一個獎勵</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {volunteers.map((volunteer) => (
                                    <tr key={volunteer.id}>
                                        <td className="py-4 pr-4">
                                            <div className="font-medium text-slate-200">{volunteer.name || "未命名志工"}</div>
                                            <div className="text-xs text-slate-400">{volunteer.email}</div>
                                        </td>
                                        <td className="py-4 px-4 font-bold">{volunteer.attendedCount}</td>
                                        <td className="py-4 px-4 text-sm text-slate-300">
                                            {volunteer.unlocked.length > 0 ? volunteer.unlocked.map((reward) => reward.title).join("、") : "尚未解鎖"}
                                        </td>
                                        <td className="py-4 pl-4 text-sm text-slate-300">
                                            {volunteer.next ? `再 ${volunteer.remainingToNext} 次：${volunteer.next.title}` : (
                                                <span className="inline-flex items-center gap-1 text-emerald-300">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    全部達成
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {volunteers.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-10 text-center text-slate-400">尚無志工紀錄。</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </main>
    );
}
