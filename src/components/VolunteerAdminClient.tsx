"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import imageCompression from "browser-image-compression";
import { CalendarPlus, CheckCircle2, Clock, Copy, Edit3, Gift, History, ImagePlus, Link2, Loader2, Monitor, QrCode, RefreshCw, Save, Trash2, Users, X } from "lucide-react";
import AddressInput from "@/components/AddressInput";
import { VOLUNTEER_EVENT_CATEGORIES, getVolunteerEventCoverImage } from "@/lib/volunteerEventCategories";

type RegistrationStatus = "REGISTERED" | "WAITLISTED" | "ATTENDED" | "CANCELLED";

type AdminRegistration = {
    id: string;
    name: string | null;
    note: string | null;
    phone: string | null;
    status: RegistrationStatus;
    checkedInAt: string | null;
    createdAt: string;
    user: {
        id: string;
        name: string | null;
        email: string | null;
        image: string | null;
        phone: string | null;
    };
};

type AdminEvent = {
    id: string;
    slug: string | null;
    checkInToken: string | null;
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
    isActive: boolean;
    registrations: AdminRegistration[];
};

type VolunteerStats = {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    phone: string | null;
    attendedCount: number;
    next: { times: number; title: string; description: string } | null;
    remainingToNext: number;
    unlocked: { times: number; title: string; description: string }[];
    profileChangeLogs: {
        id: string;
        oldName: string | null;
        newName: string | null;
        oldPhone: string | null;
        newPhone: string | null;
        source: string | null;
        createdAt: string;
    }[];
};

type EventFormState = {
    title: string;
    slug: string;
    category: string;
    description: string;
    location: string;
    mapUrl: string;
    coverImageUrl: string;
    startsAt: string;
    endsAt: string;
    registrationDeadline: string;
    capacity: string;
};

const statusLabels: Record<RegistrationStatus, string> = {
    REGISTERED: "已報名",
    WAITLISTED: "候補",
    ATTENDED: "已出席",
    CANCELLED: "已取消",
};

export default function VolunteerAdminClient() {
    const { data: session } = useSession();
    const [events, setEvents] = useState<AdminEvent[]>([]);
    const [volunteers, setVolunteers] = useState<VolunteerStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [isOnlineEvent, setIsOnlineEvent] = useState(false);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [editingEventId, setEditingEventId] = useState<string | null>(null);
    const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
    const [qrEventId, setQrEventId] = useState<string | null>(null);
    const [tokenUpdatingId, setTokenUpdatingId] = useState<string | null>(null);
    const [expandedProfileUserId, setExpandedProfileUserId] = useState<string | null>(null);
    const [form, setForm] = useState<EventFormState>({
        title: "",
        slug: "",
        category: "",
        description: "",
        location: "",
        mapUrl: "",
        coverImageUrl: "",
        startsAt: "",
        endsAt: "",
        registrationDeadline: "",
        capacity: "",
    });
    const [editForm, setEditForm] = useState<EventFormState>(form);
    const [editIsOnlineEvent, setEditIsOnlineEvent] = useState(false);
    const isCurrentUserAdmin = session?.user?.role === "ADMIN" || session?.user?.email?.toLowerCase() === "nn70nn70@gmail.com";

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
            waitlisted: registrations.filter((registration) => registration.status === "WAITLISTED").length,
            attended: registrations.filter((registration) => registration.status === "ATTENDED").length,
        };
    }, [events]);
    const isUploadedCover = form.coverImageUrl.startsWith("data:image/");
    const formDefaultCoverImageUrl = getVolunteerEventCoverImage(form);

    const buildCheckInUrl = (event: AdminEvent) => {
        if (!event.checkInToken || typeof window === "undefined") return "";
        return `${window.location.origin}/events/${event.slug || event.id}/check-in?token=${encodeURIComponent(event.checkInToken)}`;
    };

    const buildQrCodeUrl = (event: AdminEvent) => {
        const url = buildCheckInUrl(event);
        if (!url) return "";
        return `https://quickchart.io/qr?size=240&margin=2&text=${encodeURIComponent(url)}`;
    };

    const createEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch("/api/volunteer-events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    location: isOnlineEvent ? "" : form.location,
                    mapUrl: isOnlineEvent ? "" : form.mapUrl,
                    capacity: form.capacity ? Number(form.capacity) : null,
                    endsAt: form.endsAt || null,
                }),
            });

            if (res.ok) {
                setForm({
                    title: "",
                    slug: "",
                    category: "",
                    description: "",
                    location: "",
                    mapUrl: "",
                    coverImageUrl: "",
                    startsAt: "",
                    endsAt: "",
                    registrationDeadline: "",
                    capacity: "",
                });
                setIsOnlineEvent(false);
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

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingCover(true);
        try {
            const compressedFile = await imageCompression(file, {
                maxSizeMB: 1,
                maxWidthOrHeight: 1200,
                useWebWorker: true,
                fileType: "image/jpeg",
            });

            const reader = new FileReader();
            reader.readAsDataURL(compressedFile);
            const dataUrl = await new Promise<string>((resolve, reject) => {
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = () => reject(new Error("讀取圖片失敗"));
            });

            setForm((prev) => ({ ...prev, coverImageUrl: dataUrl }));
        } catch (error) {
            console.error(error);
            alert("封面圖上傳失敗，請換一張圖片再試一次。");
        } finally {
            setUploadingCover(false);
            e.target.value = "";
        }
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

    const showQrCode = async (event: AdminEvent) => {
        setQrEventId((current) => (current === event.id ? null : event.id));

        if (event.checkInToken) return;

        setTokenUpdatingId(event.id);
        try {
            const res = await fetch(`/api/volunteer-admin/events/${event.id}/check-in-token`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });

            if (!res.ok) {
                alert("產生 QR Code 失敗。");
                return;
            }

            const data = await res.json();
            setEvents((prev) => prev.map((item) => item.id === event.id ? { ...item, checkInToken: data.checkInToken } : item));
        } finally {
            setTokenUpdatingId(null);
        }
    };

    const copyCheckInUrl = async (event: AdminEvent) => {
        const url = buildCheckInUrl(event);
        if (!url) return;

        await navigator.clipboard.writeText(url);
    };

    const toDateTimeInputValue = (value: string | null) => {
        if (!value) return "";
        const date = new Date(value);
        const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        return localDate.toISOString().slice(0, 16);
    };

    const startEditingEvent = (event: AdminEvent) => {
        setEditingEventId(event.id);
        setEditIsOnlineEvent(!event.location);
        setEditForm({
            title: event.title,
            slug: event.slug ?? "",
            category: event.category ?? "",
            description: event.description ?? "",
            location: event.location ?? "",
            mapUrl: event.mapUrl ?? "",
            coverImageUrl: event.coverImageUrl ?? "",
            startsAt: toDateTimeInputValue(event.startsAt),
            endsAt: toDateTimeInputValue(event.endsAt),
            registrationDeadline: toDateTimeInputValue(event.registrationDeadline),
            capacity: event.capacity ? String(event.capacity) : "",
        });
    };

    const handleEditPlaceSelected = (place: { address: string; lat: number; lng: number; placeId?: string }) => {
        const query = encodeURIComponent(place.address);
        const placeParam = place.placeId ? `&query_place_id=${encodeURIComponent(place.placeId)}` : "";

        setEditForm((prev) => ({
            ...prev,
            location: place.address,
            mapUrl: `https://www.google.com/maps/search/?api=1&query=${query}${placeParam}`,
        }));
    };

    const updateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingEventId) return;

        setUpdatingId(editingEventId);
        try {
            const res = await fetch(`/api/volunteer-events/${editingEventId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...editForm,
                    location: editIsOnlineEvent ? "" : editForm.location,
                    mapUrl: editIsOnlineEvent ? "" : editForm.mapUrl,
                    capacity: editForm.capacity ? Number(editForm.capacity) : null,
                    endsAt: editForm.endsAt || null,
                    isActive: true,
                }),
            });

            if (res.ok) {
                setEditingEventId(null);
                await fetchAdminData();
            } else {
                alert("更新活動失敗，請確認必填欄位。");
            }
        } finally {
            setUpdatingId(null);
        }
    };

    const deleteEvent = async (event: AdminEvent) => {
        if (!confirm(`確定要刪除「${event.title}」？此動作會一併移除這場活動的報名紀錄。`)) return;

        setDeletingEventId(event.id);
        try {
            const res = await fetch(`/api/volunteer-events/${event.id}`, { method: "DELETE" });

            if (res.ok) {
                await fetchAdminData();
            } else {
                alert("刪除活動失敗，只有管理員可以刪除活動。");
            }
        } finally {
            setDeletingEventId(null);
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

    const profileSourceLabel = (source: string | null) => {
        if (source === "event-registration") return "報名時更新";
        if (source === "volunteer-profile") return "個人資料頁更新";
        return "資料更新";
    };

    return (
        <main className="min-h-screen tpp-page pt-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-6 pb-10">
                <section className="grid md:grid-cols-4 gap-4">
                    <div className="glass-panel rounded-2xl p-5">
                        <div className="text-sm text-slate-400">活動數</div>
                        <div className="text-3xl font-black mt-2">{totals.events}</div>
                    </div>
                    <div className="glass-panel rounded-2xl p-5">
                        <div className="text-sm text-slate-400">目前報名</div>
                        <div className="text-3xl font-black mt-2">{totals.registered}</div>
                    </div>
                    <div className="glass-panel rounded-2xl p-5">
                        <div className="text-sm text-slate-400">候補人數</div>
                        <div className="text-3xl font-black mt-2">{totals.waitlisted}</div>
                    </div>
                    <div className="glass-panel rounded-2xl p-5">
                        <div className="text-sm text-slate-400">已確認出席</div>
                        <div className="text-3xl font-black mt-2">{totals.attended}</div>
                    </div>
                </section>

                <section className="grid lg:grid-cols-[0.95fr_1.4fr] gap-5">
                    <form onSubmit={createEvent} className="glass-panel rounded-2xl p-6 space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <CalendarPlus className="w-5 h-5 text-[#61C5C7]" />
                            <h1 className="text-xl font-bold">建立活動</h1>
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
                        <label className="space-y-1 block">
                            <span className="text-sm text-slate-300">活動分類</span>
                            <select
                                value={form.category}
                                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                                className="w-full glass-input rounded-xl px-4 py-3"
                            >
                                <option value="" className="bg-[#173246] text-white">
                                    無
                                </option>
                                {VOLUNTEER_EVENT_CATEGORIES.map((category) => (
                                    <option key={category.label} value={category.label} className="bg-[#173246] text-white">
                                        {category.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-sm text-slate-300">活動封面圖（未上傳時使用分類預設圖）</span>
                                {form.coverImageUrl && (
                                    <button
                                        type="button"
                                        onClick={() => setForm((prev) => ({ ...prev, coverImageUrl: "" }))}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs font-semibold transition"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                        移除
                                    </button>
                                )}
                            </div>
                            {form.coverImageUrl && (
                                <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={form.coverImageUrl} alt="活動封面預覽" className="h-40 w-full object-cover" />
                                </div>
                            )}
                            {!form.coverImageUrl && formDefaultCoverImageUrl && (
                                <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={formDefaultCoverImageUrl} alt={`${form.category} 預設封面`} className="h-40 w-full object-cover" />
                                </div>
                            )}
                            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10">
                                {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                                {uploadingCover ? "圖片處理中..." : "上傳封面圖"}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleCoverUpload}
                                    disabled={uploadingCover}
                                    className="hidden"
                                />
                            </label>
                            <input
                                value={isUploadedCover ? "" : form.coverImageUrl}
                                onChange={(e) => setForm((prev) => ({ ...prev, coverImageUrl: e.target.value }))}
                                placeholder={isUploadedCover ? "已使用上傳圖片" : "或貼上封面圖網址，可留空"}
                                disabled={isUploadedCover}
                                className="w-full glass-input rounded-xl px-4 py-3"
                            />
                        </div>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                            placeholder="活動說明"
                            className="w-full min-h-24 glass-input rounded-xl px-4 py-3"
                        />
                        <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                            <input
                                type="checkbox"
                                checked={isOnlineEvent}
                                onChange={(e) => {
                                    const checked = e.target.checked;
                                    setIsOnlineEvent(checked);
                                    if (checked) {
                                        setForm((prev) => ({ ...prev, location: "", mapUrl: "" }));
                                    }
                                }}
                                className="h-4 w-4 accent-[#61C5C7]"
                            />
                            <Monitor className="h-4 w-4 text-[#61C5C7]" />
                            線上活動
                        </label>
                        {!isOnlineEvent && (
                            <>
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
                            </>
                        )}
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <div className="mb-3 flex items-center gap-2">
                                <Clock className="h-4 w-4 text-[#61C5C7]" />
                                <span className="text-sm font-semibold text-slate-200">活動時間</span>
                            </div>
                            <div className="grid gap-3 lg:grid-cols-3">
                                <label className="space-y-1">
                                    <span className="text-sm text-slate-300">開始時間 *</span>
                                    <input
                                        required
                                        type="datetime-local"
                                        value={form.startsAt}
                                        onChange={(e) => setForm((prev) => ({ ...prev, startsAt: e.target.value }))}
                                        className="w-full glass-input rounded-xl px-4 py-3"
                                    />
                                    <span className="block text-xs leading-5 text-slate-500">活動正式開始時間。</span>
                                </label>
                                <label className="space-y-1">
                                    <span className="text-sm text-slate-300">結束時間</span>
                                    <input
                                        type="datetime-local"
                                        value={form.endsAt}
                                        onChange={(e) => setForm((prev) => ({ ...prev, endsAt: e.target.value }))}
                                        className="w-full glass-input rounded-xl px-4 py-3"
                                    />
                                    <span className="block text-xs leading-5 text-slate-500">選填；不填則行事曆預設 2 小時。</span>
                                </label>
                                <label className="space-y-1">
                                    <span className="text-sm text-slate-300">報名截止時間</span>
                                    <input
                                        type="datetime-local"
                                        value={form.registrationDeadline}
                                        onChange={(e) => setForm((prev) => ({ ...prev, registrationDeadline: e.target.value }))}
                                        className="w-full glass-input rounded-xl px-4 py-3"
                                    />
                                    <span className="block text-xs leading-5 text-slate-500">選填；不填則活動開始前截止。</span>
                                </label>
                            </div>
                        </div>
                        <label className="space-y-1 block">
                            <span className="text-sm text-slate-300">預期人數（選填）</span>
                            <input
                                type="number"
                                min="1"
                                value={form.capacity}
                                onChange={(e) => setForm((prev) => ({ ...prev, capacity: e.target.value }))}
                                placeholder="手動輸入預期人數"
                                className="w-full glass-input rounded-xl px-4 py-3"
                            />
                        </label>
                        <button
                            disabled={saving}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl tpp-primary-button disabled:opacity-60 px-4 py-3 font-semibold transition"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarPlus className="w-4 h-4" />}
                            建立活動
                        </button>
                    </form>

                    <section className="glass-panel rounded-2xl p-6">
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <div className="flex items-center gap-3">
                                <Users className="w-5 h-5 text-[#61C5C7]" />
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
                                        {getVolunteerEventCoverImage(event) && (
                                            <div className="mb-4 overflow-hidden rounded-xl border border-white/10 bg-black/20">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={getVolunteerEventCoverImage(event) ?? ""} alt={event.title} className="h-36 w-full object-cover" />
                                            </div>
                                        )}
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                            <div>
                                                {event.category && (
                                                    <div className="mb-1 inline-flex rounded-full border border-[#61C5C7]/25 bg-[#61C5C7]/10 px-2.5 py-1 text-xs font-semibold text-[#D9FFFF]">
                                                        {event.category}
                                                    </div>
                                                )}
                                                <h3 className="font-bold text-white">{event.title}</h3>
                                                <p className="text-sm text-slate-400 mt-1">{formatDateTime(event.startsAt)}｜{event.location || "線上活動"}</p>
                                            </div>
                                            <div className="flex flex-col items-start sm:items-end gap-2">
                                                <span className="text-xs text-slate-400">
                                                    {event.registrations.filter((registration) => (
                                                        registration.status === "REGISTERED" || registration.status === "ATTENDED"
                                                    )).length}
                                                    {event.capacity ? ` / 預期 ${event.capacity}` : ""} 人
                                                    {event.registrations.some((registration) => registration.status === "WAITLISTED") && (
                                                        <>，候補 {event.registrations.filter((registration) => registration.status === "WAITLISTED").length} 人</>
                                                    )}
                                                </span>
                                                <div className="flex flex-wrap justify-start gap-2 sm:justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => startEditingEvent(event)}
                                                        className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs font-semibold transition"
                                                    >
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                        編輯
                                                    </button>
                                                    {isCurrentUserAdmin && (
                                                        <button
                                                            type="button"
                                                            onClick={() => deleteEvent(event)}
                                                            disabled={deletingEventId === event.id}
                                                            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600/75 hover:bg-rose-500 disabled:opacity-60 px-3 py-1.5 text-xs font-semibold transition"
                                                        >
                                                            {deletingEventId === event.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                                            刪除
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => showQrCode(event)}
                                                        disabled={tokenUpdatingId === event.id}
                                                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 disabled:opacity-60 px-3 py-1.5 text-xs font-semibold transition"
                                                    >
                                                        {tokenUpdatingId === event.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <QrCode className="w-3.5 h-3.5" />}
                                                        報到 QR
                                                    </button>
                                                    <Link
                                                        href={`/events/${event.slug || event.id}`}
                                                        className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs font-semibold transition"
                                                    >
                                                        <Link2 className="w-3.5 h-3.5" />
                                                        活動頁
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>

                                        {editingEventId === event.id && (
                                            <form onSubmit={updateEvent} className="mt-4 space-y-4 rounded-xl border border-[#61C5C7]/20 bg-[#071820]/55 p-4">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-2 text-sm font-semibold text-[#D9FFFF]">
                                                        <Edit3 className="h-4 w-4" />
                                                        編輯活動內容
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingEventId(null)}
                                                        className="rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                                                        title="取消編輯"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                                <div className="grid gap-3 md:grid-cols-2">
                                                    <input
                                                        required
                                                        value={editForm.title}
                                                        onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                                                        placeholder="活動名稱"
                                                        className="glass-input rounded-xl px-4 py-3"
                                                    />
                                                    <input
                                                        value={editForm.slug}
                                                        onChange={(e) => setEditForm((prev) => ({ ...prev, slug: e.target.value }))}
                                                        placeholder="活動網址代號"
                                                        className="glass-input rounded-xl px-4 py-3"
                                                    />
                                                </div>
                                                <div className="grid gap-3 md:grid-cols-2">
                                                    <label className="space-y-1 block">
                                                        <span className="text-sm text-slate-300">活動分類</span>
                                                        <select
                                                            value={editForm.category}
                                                            onChange={(e) => setEditForm((prev) => ({ ...prev, category: e.target.value }))}
                                                            className="w-full glass-input rounded-xl px-4 py-3"
                                                        >
                                                            <option value="" className="bg-[#173246] text-white">
                                                                無
                                                            </option>
                                                            {VOLUNTEER_EVENT_CATEGORIES.map((category) => (
                                                                <option key={category.label} value={category.label} className="bg-[#173246] text-white">
                                                                    {category.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </label>
                                                    <label className="space-y-1 block">
                                                        <span className="text-sm text-slate-300">封面圖網址</span>
                                                        <input
                                                            value={editForm.coverImageUrl}
                                                            onChange={(e) => setEditForm((prev) => ({ ...prev, coverImageUrl: e.target.value }))}
                                                            placeholder="可留空，使用分類預設圖"
                                                            className="w-full glass-input rounded-xl px-4 py-3"
                                                        />
                                                    </label>
                                                </div>
                                                <textarea
                                                    value={editForm.description}
                                                    onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                                                    placeholder="活動說明"
                                                    className="w-full min-h-24 glass-input rounded-xl px-4 py-3"
                                                />
                                                <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                                                    <input
                                                        type="checkbox"
                                                        checked={editIsOnlineEvent}
                                                        onChange={(e) => {
                                                            const checked = e.target.checked;
                                                            setEditIsOnlineEvent(checked);
                                                            if (checked) {
                                                                setEditForm((prev) => ({ ...prev, location: "", mapUrl: "" }));
                                                            }
                                                        }}
                                                        className="h-4 w-4 accent-[#61C5C7]"
                                                    />
                                                    <Monitor className="h-4 w-4 text-[#61C5C7]" />
                                                    線上活動
                                                </label>
                                                {!editIsOnlineEvent && (
                                                    <div className="grid gap-3 md:grid-cols-2">
                                                        <div className="space-y-1">
                                                            <span className="text-sm text-slate-300">集合地點</span>
                                                            <AddressInput
                                                                defaultValue={editForm.location}
                                                                onPlaceSelected={handleEditPlaceSelected}
                                                                onInputChange={(value) => setEditForm((prev) => ({ ...prev, location: value }))}
                                                                placeholder="輸入地點或地址，例如：虎林"
                                                            />
                                                        </div>
                                                        <label className="space-y-1 block">
                                                            <span className="text-sm text-slate-300">Google Maps 連結</span>
                                                            <input
                                                                value={editForm.mapUrl}
                                                                onChange={(e) => setEditForm((prev) => ({ ...prev, mapUrl: e.target.value }))}
                                                                placeholder="Google Maps 連結，可留空"
                                                                className="w-full glass-input rounded-xl px-4 py-3"
                                                            />
                                                        </label>
                                                    </div>
                                                )}
                                                <div className="grid gap-3 md:grid-cols-3">
                                                    <label className="space-y-1">
                                                        <span className="text-sm text-slate-300">開始時間 *</span>
                                                        <input
                                                            required
                                                            type="datetime-local"
                                                            value={editForm.startsAt}
                                                            onChange={(e) => setEditForm((prev) => ({ ...prev, startsAt: e.target.value }))}
                                                            className="w-full glass-input rounded-xl px-4 py-3"
                                                        />
                                                    </label>
                                                    <label className="space-y-1">
                                                        <span className="text-sm text-slate-300">結束時間</span>
                                                        <input
                                                            type="datetime-local"
                                                            value={editForm.endsAt}
                                                            onChange={(e) => setEditForm((prev) => ({ ...prev, endsAt: e.target.value }))}
                                                            className="w-full glass-input rounded-xl px-4 py-3"
                                                        />
                                                    </label>
                                                    <label className="space-y-1">
                                                        <span className="text-sm text-slate-300">報名截止時間</span>
                                                        <input
                                                            type="datetime-local"
                                                            value={editForm.registrationDeadline}
                                                            onChange={(e) => setEditForm((prev) => ({ ...prev, registrationDeadline: e.target.value }))}
                                                            className="w-full glass-input rounded-xl px-4 py-3"
                                                        />
                                                    </label>
                                                </div>
                                                <label className="space-y-1 block">
                                                    <span className="text-sm text-slate-300">預期人數（選填）</span>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={editForm.capacity}
                                                        onChange={(e) => setEditForm((prev) => ({ ...prev, capacity: e.target.value }))}
                                                        placeholder="手動輸入預期人數"
                                                        className="w-full glass-input rounded-xl px-4 py-3"
                                                    />
                                                </label>
                                                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingEventId(null)}
                                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold transition hover:bg-white/15"
                                                    >
                                                        取消
                                                    </button>
                                                    <button
                                                        disabled={updatingId === event.id}
                                                        className="inline-flex items-center justify-center gap-2 rounded-xl tpp-primary-button px-4 py-3 text-sm font-semibold transition disabled:opacity-60"
                                                    >
                                                        {updatingId === event.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                        儲存修改
                                                    </button>
                                                </div>
                                            </form>
                                        )}

                                        {qrEventId === event.id && event.checkInToken && (
                                            <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                                                <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
                                                    <div className="overflow-hidden rounded-xl border border-white/10 bg-white p-2">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={buildQrCodeUrl(event)} alt={`${event.title} 報到 QR Code`} className="h-40 w-40" />
                                                    </div>
                                                    <div className="min-w-0 space-y-3">
                                                        <div>
                                                            <div className="font-semibold text-[#D9FFFF]">現場報到 QR Code</div>
                                                            <p className="mt-1 text-sm text-[#D9FFFF]/75">志工掃描後登入 Google，並輸入報名電話完成報到。</p>
                                                        </div>
                                                        <div className="break-all rounded-lg bg-black/20 px-3 py-2 text-xs text-slate-300">
                                                            {buildCheckInUrl(event)}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => copyCheckInUrl(event)}
                                                            className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/15 px-3 py-2 text-xs font-semibold transition"
                                                        >
                                                            <Copy className="w-3.5 h-3.5" />
                                                            複製報到連結
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-4 space-y-2">
                                            {event.registrations.length === 0 ? (
                                                <div className="text-sm text-slate-500">尚無報名者</div>
                                            ) : (
                                                event.registrations.map((registration) => (
                                                    <div key={registration.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg bg-white/5 p-3">
                                                        <div>
                                                            <div className="font-medium text-slate-200">{registration.name || registration.user.name || "未命名志工"}</div>
                                                            <div className="text-xs text-slate-400">{registration.user.email}</div>
                                                            <div className="text-xs text-slate-400">報名電話：{registration.phone || "未留電話"}</div>
                                                            {registration.note && <div className="text-xs text-slate-300 mt-1">備註：{registration.note}</div>}
                                                            {registration.checkedInAt && <div className="text-xs text-[#61C5C7] mt-1">報到：{formatDateTime(registration.checkedInAt)}</div>}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <select
                                                                value={registration.status}
                                                                disabled={updatingId === registration.id}
                                                                onChange={(e) => updateRegistration(registration.id, e.target.value as RegistrationStatus)}
                                                                className="glass-input rounded-lg px-3 py-2 text-sm"
                                                            >
                                                                <option value="REGISTERED">已報名</option>
                                                                <option value="WAITLISTED">候補</option>
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
                        <Gift className="w-5 h-5 text-[#F4F7F7]" />
                        <h2 className="text-xl font-bold">志工里程碑統計</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-sm text-slate-400 border-b border-white/10">
                                <tr>
                                    <th className="py-3 pr-4">志工</th>
                                    <th className="py-3 px-4">出席次數</th>
                                    <th className="py-3 px-4">已解鎖</th>
                                    <th className="py-3 pl-4">下一個里程碑</th>
                                    <th className="py-3 pl-4">修改紀錄</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {volunteers.map((volunteer) => {
                                    const isExpanded = expandedProfileUserId === volunteer.id;
                                    const latestLog = volunteer.profileChangeLogs[0] ?? null;

                                    return (
                                        <Fragment key={volunteer.id}>
                                            <tr>
                                                <td className="py-4 pr-4">
                                                    <div className="font-medium text-slate-200">{volunteer.name || "未命名志工"}</div>
                                                    <div className="text-xs text-slate-400">{volunteer.email}</div>
                                                    <div className="text-xs text-slate-400">電話：{volunteer.phone || "未留電話"}</div>
                                                </td>
                                                <td className="py-4 px-4 font-bold">{volunteer.attendedCount}</td>
                                                <td className="py-4 px-4 text-sm text-slate-300">
                                                    {volunteer.unlocked.length > 0 ? volunteer.unlocked.map((reward) => reward.title).join("、") : "尚未解鎖"}
                                                </td>
                                                <td className="py-4 pl-4 text-sm text-slate-300">
                                                    {volunteer.next ? `再 ${volunteer.remainingToNext} 次：${volunteer.next.title}` : (
                                                        <span className="inline-flex items-center gap-1 text-[#61C5C7]">
                                                            <CheckCircle2 className="w-4 h-4" />
                                                            全部達成
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-4 pl-4 text-sm text-slate-300">
                                                    {latestLog ? (
                                                        <div className="space-y-2">
                                                            <div className="text-xs text-slate-400">最近：{formatDateTime(latestLog.createdAt)}</div>
                                                            <button
                                                                type="button"
                                                                onClick={() => setExpandedProfileUserId(isExpanded ? null : volunteer.id)}
                                                                className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-[#D9FFFF] transition hover:bg-white/15"
                                                            >
                                                                <History className="h-3.5 w-3.5" />
                                                                {isExpanded ? "收合" : `查看 ${volunteer.profileChangeLogs.length} 筆`}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-500">尚無修改</span>
                                                    )}
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                            <tr>
                                                    <td colSpan={5} className="pb-4">
                                                        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                                                            <div className="mb-3 text-sm font-semibold text-slate-200">姓名與電話修改紀錄</div>
                                                            <div className="space-y-3">
                                                                {volunteer.profileChangeLogs.map((log) => (
                                                                    <div key={log.id} className="rounded-lg bg-white/5 p-3 text-xs text-slate-300">
                                                                        <div className="mb-2 flex flex-wrap items-center gap-2 text-slate-400">
                                                                            <span>{formatDateTime(log.createdAt)}</span>
                                                                            <span className="rounded-full bg-[#61C5C7]/10 px-2 py-0.5 text-[#D9FFFF]">{profileSourceLabel(log.source)}</span>
                                                                        </div>
                                                                        <div>姓名：{log.oldName || "未填"} → {log.newName || "未填"}</div>
                                                                        <div className="mt-1">電話：{log.oldPhone || "未填"} → {log.newPhone || "未填"}</div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    );
                                })}
                                {volunteers.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-10 text-center text-slate-400">尚無志工紀錄。</td>
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
