"use client";

import { useState, useEffect } from "react";
import Map from "@/components/Map";
import AddressInput from "@/components/AddressInput";
import { Plus, MapPin, Calendar, Box, Loader2, Phone, User, ArrowUpDown, Trash2 } from "lucide-react";
import { Location, DistributionRecord } from "@prisma/client";
import { useSession } from "next-auth/react";

type LocationWithRecords = Location & { records: DistributionRecord[] };

export default function DashboardClient() {
    const [locations, setLocations] = useState<LocationWithRecords[]>([]);
    const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
    const [selectedLocId, setSelectedLocId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<'updated' | 'lastDate'>('updated');
    const { data: session } = useSession();
    const isAdmin = (session?.user as any)?.role === "ADMIN";
    const canEdit = isAdmin || (session?.user as any)?.role === "EDITOR";

    // 計算兩周後日期的輔助函式
    const getTwoWeeksLater = () => {
        const d = new Date();
        d.setDate(d.getDate() + 14);
        return d.toISOString().split('T')[0];
    };

    // 新增地點表單狀態
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newName, setNewName] = useState("");
    const [newAddress, setNewAddress] = useState("");
    const [newLat, setNewLat] = useState<number | null>(null);
    const [newLng, setNewLng] = useState<number | null>(null);
    const [contactName, setContactName] = useState("");
    const [contactPhone, setContactPhone] = useState("");
    const [itemType, setItemType] = useState("面紙");
    const [quantity, setQuantity] = useState("1");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [nextContactDate, setNextContactDate] = useState(getTwoWeeksLater());
    const [addToCalendar, setAddToCalendar] = useState(true);

    // 為既存地點新增紀錄狀態
    const [addingRecordTo, setAddingRecordTo] = useState<string | null>(null);
    const [recordItemType, setRecordItemType] = useState("面紙");
    const [recordQuantity, setRecordQuantity] = useState("1");
    const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
    const [recordNextContactDate, setRecordNextContactDate] = useState("");
    const [recordAddToCalendar, setRecordAddToCalendar] = useState(true);

    // 新增種類狀態
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [isSavingCategory, setIsSavingCategory] = useState(false);

    const fetchCategories = async () => {
        try {
            const res = await fetch("/api/item-categories");
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
                // 若本身無預設值且有種類，自動選第一項
                if (data.length > 0) {
                    if (!itemType && !isAddingNew) setItemType(data[0].name);
                    if (!recordItemType && !addingRecordTo) setRecordItemType(data[0].name);
                }
            }
        } catch (error) {
            console.error("Failed to fetch categories", error);
        }
    };

    const fetchLocations = async () => {
        try {
            const res = await fetch("/api/locations");
            if (res.ok) {
                const data = await res.json();
                setLocations(data);
            }
        } catch (error) {
            console.error("Failed to fetch locations", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
        fetchLocations();
    }, []);

    const handleAddCategory = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!newCategoryName.trim()) return;

        setIsSavingCategory(true);
        try {
            const res = await fetch("/api/item-categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newCategoryName.trim() })
            });
            if (res.ok) {
                const newCat = await res.json();
                await fetchCategories();
                setItemType(newCat.name);
                setRecordItemType(newCat.name);
                setIsAddingCategory(false);
                setNewCategoryName("");
            } else {
                alert("新增失敗，可能名稱已存在");
            }
        } catch (error) {
            console.error(error);
            alert("系統錯誤");
        } finally {
            setIsSavingCategory(false);
        }
    };

    // 開啟 Google Calendar 建立提醒事件
    const openGoogleCalendar = (eventDate: string, locationName: string, address: string) => {
        const d = new Date(eventDate);
        const startDate = d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const endD = new Date(d.getTime() + 60 * 60 * 1000);
        const endDate = endD.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

        const title = encodeURIComponent(`🧴 聯絡補貨: ${locationName || address}`);
        const details = encodeURIComponent(`地址: ${address}\n請聯絡該地點確認選舉物資補貨需求`);
        const loc = encodeURIComponent(address);

        const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}&location=${loc}`;
        window.open(url, '_blank');
    };

    const handlePlaceSelected = (place: { address: string; lat: number; lng: number }) => {
        setNewAddress(place.address);
        setNewLat(place.lat);
        setNewLng(place.lng);
    };

    const submitNewLocation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAddress || newLat === null || newLng === null) return alert("請透過自動完成選擇一個有效地址");

        try {
            const res = await fetch("/api/locations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newName || undefined,
                    address: newAddress,
                    latitude: newLat,
                    longitude: newLng,
                    contactName: contactName || undefined,
                    contactPhone,
                    itemType,
                    initialQuantity: Number(quantity),
                    date,
                    nextContactDate: nextContactDate ? nextContactDate : undefined
                }),
            });

            if (res.ok) {
                // 如果有勾選「建立 Google Calendar」且有設定下次聯絡日
                if (addToCalendar && nextContactDate) {
                    openGoogleCalendar(nextContactDate, newName, newAddress);
                }
                setIsAddingNew(false);
                resetForm();
                fetchLocations();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const submitNewRecord = async (e: React.FormEvent, locationId: string) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/locations/${locationId}/records`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    itemType: recordItemType,
                    quantity: Number(recordQuantity),
                    date: recordDate,
                    nextContactDate: recordNextContactDate ? recordNextContactDate : undefined
                }),
            });

            if (res.ok) {
                // 如果有勾選且有設定下次聯絡日
                if (recordAddToCalendar && recordNextContactDate) {
                    const loc = locations.find(l => l.id === locationId);
                    openGoogleCalendar(recordNextContactDate, (loc as any)?.name || '', loc?.address || '');
                }
                setAddingRecordTo(null);
                setRecordItemType("面紙");
                setRecordQuantity("1");
                setRecordNextContactDate("");
                setRecordAddToCalendar(true);
                fetchLocations();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const resetForm = () => {
        setNewName("");
        setNewAddress("");
        setNewLat(null);
        setNewLng(null);
        setContactName("");
        setContactPhone("");
        setItemType("面紙");
        setQuantity("1");
        setNextContactDate(getTwoWeeksLater());
        setAddToCalendar(true);
    };

    const handleDeleteLocation = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("確定要刪除這個地點及其所有發放紀錄嗎？此動作無法復原。")) return;

        try {
            const res = await fetch(`/api/locations/${id}`, { method: "DELETE" });
            if (res.ok) {
                if (selectedLocId === id) setSelectedLocId(null);
                await fetchLocations();
            } else {
                alert("刪除失敗");
            }
        } catch (error) {
            alert("系統錯誤");
        }
    };

    const handleDeleteRecord = async (e: React.MouseEvent, locationId: string, recordId: string) => {
        e.stopPropagation();
        if (!confirm("確定要刪除這筆發放紀錄嗎？此動作無法復原。")) return;

        try {
            const res = await fetch(`/api/locations/${locationId}/records/${recordId}`, { method: "DELETE" });
            if (res.ok) {
                await fetchLocations();
            } else {
                alert("刪除失敗");
            }
        } catch (error) {
            alert("系統錯誤");
        }
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-slate-900 text-slate-100 pt-16">

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* Background Blobs */}
                <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full mix-blend-screen filter blur-[100px] pointer-events-none"></div>

                {/* Sidebar List */}
                <div className="w-full md:w-[400px] lg:w-[450px] flex flex-col glass-panel border-r border-white/10 z-10 shrink-0 h-full">
                    <div className="p-4 border-b border-white/10 shrink-0 space-y-3">
                        {canEdit && (
                            <button
                                onClick={() => setIsAddingNew(true)}
                                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-purple-500/20 transition-all transform active:scale-95"
                            >
                                <Plus className="w-5 h-5" />
                                <span>新增選舉物資發放據點</span>
                            </button>
                        )}
                        <div className="flex items-center space-x-2">
                            <ArrowUpDown className="w-4 h-4 text-slate-400" />
                            <span className="text-xs text-slate-400">排序：</span>
                            <button
                                onClick={() => setSortBy('updated')}
                                className={`text-xs px-2 py-1 rounded-lg transition-colors ${sortBy === 'updated' ? 'bg-purple-500/30 text-purple-200' : 'text-slate-400 hover:text-slate-200'}`}
                            >最近更新</button>
                            <button
                                onClick={() => setSortBy('lastDate')}
                                className={`text-xs px-2 py-1 rounded-lg transition-colors ${sortBy === 'lastDate' ? 'bg-purple-500/30 text-purple-200' : 'text-slate-400 hover:text-slate-200'}`}
                            >最近發放</button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        {loading ? (
                            <div className="flex justify-center items-center h-40">
                                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                            </div>
                        ) : locations.length === 0 ? (
                            <div className="text-center text-slate-400 mt-10 p-6 glass-panel rounded-2xl">
                                <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>尚無任何發放紀錄</p>
                                <p className="text-sm mt-1 opacity-70">點擊上方按鈕建立第一筆資料</p>
                            </div>
                        ) : (
                            [...locations].sort((a, b) => {
                                if (sortBy === 'lastDate') {
                                    const aDate = a.records.length > 0 ? new Date(a.records[0].date).getTime() : 0;
                                    const bDate = b.records.length > 0 ? new Date(b.records[0].date).getTime() : 0;
                                    return bDate - aDate;
                                }
                                return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                            }).map((loc) => (
                                <div
                                    key={loc.id}
                                    className={`bg-white/5 border border-white/10 rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:bg-white/10 ${selectedLocId === loc.id ? 'ring-2 ring-purple-500 bg-white/10 shadow-lg shadow-purple-500/20' : ''}`}
                                    onClick={() => setSelectedLocId(loc.id)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-xl mb-1 bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-blue-200">
                                                {(loc as any).name || loc.address}
                                            </h3>
                                            {(loc as any).name && <p className="text-sm text-slate-400 mb-3">{loc.address}</p>}
                                        </div>
                                        {isAdmin && (
                                            <button
                                                onClick={(e) => handleDeleteLocation(e, loc.id)}
                                                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors ml-2 shrink-0"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400 mb-3">
                                        {(loc as any).contactName && (
                                            <span className="flex items-center space-x-1">
                                                <User className="w-3.5 h-3.5" />
                                                <span>{(loc as any).contactName}</span>
                                            </span>
                                        )}
                                        {loc.contactPhone && (
                                            <span className="flex items-center space-x-1">
                                                <Phone className="w-3.5 h-3.5" />
                                                <span>{loc.contactPhone}</span>
                                            </span>
                                        )}
                                    </div>

                                    {loc.nextContactDate && (
                                        <div className={`flex items-center space-x-2 text-sm mb-3 ${new Date(loc.nextContactDate) <= new Date() ? 'text-red-400 font-bold' : 'text-blue-400'}`}>
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>
                                                {new Date(loc.nextContactDate) <= new Date() ? '⚠️ 該聯絡了: ' : '下次聯絡: '}
                                                {new Date(loc.nextContactDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}

                                    <div className="bg-black/20 rounded-xl p-3 mb-3">
                                        <div className="flex justify-between items-center text-sm mb-2">
                                            <span className="text-slate-400 font-medium">歷史發放明細</span>
                                            <span className="bg-purple-500/20 text-purple-200 text-xs px-2 py-1 rounded-full border border-purple-500/30">
                                                總計 {loc.records.reduce((acc, r) => acc + r.quantity, 0)} 盒
                                            </span>
                                        </div>
                                        <div className="space-y-2 max-h-32 overflow-y-auto pr-1 text-sm custom-scrollbar">
                                            {loc.records.map(record => (
                                                <div key={record.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-white/5 pb-1.5 last:border-0 gap-1 sm:gap-0">
                                                    <span className="text-slate-300 flex items-center whitespace-nowrap">
                                                        <Calendar className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                                                        {new Date(record.date).toLocaleDateString()}
                                                    </span>
                                                    <span className="text-blue-300 flex items-center font-medium whitespace-nowrap self-end sm:self-auto">
                                                        +{(record as any).itemType} {record.quantity} <Box className="w-3.5 h-3.5 ml-1.5 opacity-70" />
                                                        {isAdmin && (
                                                            <button
                                                                onClick={(e) => handleDeleteRecord(e, loc.id, record.id)}
                                                                className="ml-3 p-1 text-slate-500 hover:text-red-400 transition-colors"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {canEdit && (
                                        <button
                                            onClick={() => {
                                                const latestRecord = [...loc.records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                                                setAddingRecordTo(loc.id);
                                                setRecordItemType((latestRecord as any)?.itemType || "面紙");
                                            }}
                                            className="w-full mt-4 bg-white/5 hover:bg-white/10 text-blue-300 font-medium py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all border border-white/10"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span>登記新發放</span>
                                        </button>
                                    )}

                                    {addingRecordTo === loc.id ? (
                                        <form onSubmit={(e) => submitNewRecord(e, loc.id)} className="space-y-3 pt-2 border-t border-white/10" onClick={(e) => e.stopPropagation()}>
                                            <div className="grid grid-cols-3 gap-2">
                                                <div>
                                                    <label className="text-xs text-slate-400 mb-1 block">日期</label>
                                                    <input type="date" value={recordDate} onChange={e => setRecordDate(e.target.value)} required className="w-full glass-input px-3 py-2 rounded-lg text-sm" onClick={e => e.stopPropagation()} />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-400 mb-1 block">物資種類</label>
                                                    {!isAddingCategory ? (
                                                        <div className="flex space-x-2">
                                                            <select value={recordItemType} onChange={e => setRecordItemType(e.target.value)} className="flex-1 glass-input px-3 py-2 rounded-lg text-sm" onClick={e => e.stopPropagation()}>
                                                                {categories.map(cat => (
                                                                    <option key={cat.id} value={cat.name} className="text-black">{cat.name}</option>
                                                                ))}
                                                            </select>
                                                            {canEdit && (
                                                                <button type="button" onClick={(e) => { e.stopPropagation(); setIsAddingCategory(true); }} className="px-2 py-2 glass-input rounded-lg text-slate-400 hover:text-white transition-colors" title="新增種類">
                                                                    <Plus className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="flex space-x-1">
                                                            <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="新種類" className="flex-1 glass-input px-2 py-2 rounded-lg text-sm" onClick={e => e.stopPropagation()} autoFocus />
                                                            <button type="button" onClick={handleAddCategory} disabled={isSavingCategory} className="px-2 py-2 bg-purple-500 hover:bg-purple-400 rounded-lg text-white text-xs font-bold transition-colors">
                                                                儲存
                                                            </button>
                                                            <button type="button" onClick={(e) => { e.stopPropagation(); setIsAddingCategory(false); setNewCategoryName(""); }} className="px-2 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-xs transition-colors">
                                                                ✕
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-400 mb-1 block">數量</label>
                                                    <input type="number" min="1" value={recordQuantity} onChange={e => setRecordQuantity(e.target.value)} required className="w-full glass-input px-3 py-2 rounded-lg text-sm" onClick={e => e.stopPropagation()} />
                                                </div>
                                            </div>
                                            <div className="mt-2">
                                                <label className="text-xs text-slate-400 mb-1 block">下次聯絡日 *</label>
                                                <input type="date" value={recordNextContactDate} onChange={e => setRecordNextContactDate(e.target.value)} required className="w-full glass-input px-3 py-2 rounded-lg text-sm" onClick={e => e.stopPropagation()} />
                                                <label className="flex items-center space-x-2 mt-1.5 cursor-pointer select-none" onClick={e => e.stopPropagation()}>
                                                    <input type="checkbox" checked={recordAddToCalendar} onChange={e => setRecordAddToCalendar(e.target.checked)} className="w-3.5 h-3.5 rounded accent-purple-500" />
                                                    <span className="text-xs text-slate-400">📅 建立 Google Calendar 提醒</span>
                                                </label>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button type="button" onClick={(e) => { e.stopPropagation(); setAddingRecordTo(null); }} className="flex-1 py-2 rounded-lg text-slate-300 bg-white/5 hover:bg-white/10 text-sm transition-colors">取消</button>
                                                <button type="submit" onClick={e => e.stopPropagation()} className="flex-1 py-2 rounded-lg text-white bg-purple-600 hover:bg-purple-500 text-sm transition-colors">儲存</button>
                                            </div>
                                        </form>
                                    ) : (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setAddingRecordTo(loc.id); }}
                                            className="w-full py-2 flex items-center justify-center space-x-1 border border-dashed border-white/20 text-slate-300 hover:text-white hover:border-white/40 rounded-xl text-sm transition-all"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span>登記新發放</span>
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Map Area */}
                <div className="flex-1 relative hidden md:block p-4">
                    <Map
                        locations={locations}
                        selectedLocationId={selectedLocId}
                        onSelectMarker={setSelectedLocId}
                    />
                </div>

                {/* 新增地點 Modal */}
                {isAddingNew && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="glass-panel w-full max-w-lg rounded-2xl p-6 shadow-2xl animate-fade-in-up">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold flex items-center"><MapPin className="mr-2 text-purple-400" /> 新增地點與紀錄</h2>
                                <button onClick={() => setIsAddingNew(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">✕</button>
                            </div>

                            <form onSubmit={submitNewLocation} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-300 mb-1.5 block">地點名稱 *</label>
                                    <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="例如：全家松山店" required className="w-full glass-input px-4 py-3 rounded-xl" />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-slate-300 mb-1.5 block">搜尋並選擇地點 *</label>
                                    <AddressInput onPlaceSelected={handlePlaceSelected} placeholder="請輸入欲發放選舉物資的地點或地址" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-slate-300 mb-1.5 block">聯絡人姓名 *</label>
                                        <input type="text" value={contactName} onChange={e => setContactName(e.target.value)} placeholder="王小明" required className="w-full glass-input px-4 py-3 rounded-xl" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-300 mb-1.5 block">聯絡電話 *</label>
                                        <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="09XX-XXX-XXX" required className="w-full glass-input px-4 py-3 rounded-xl" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-slate-300 mb-1.5 block">發放日期 *</label>
                                        <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full glass-input px-4 py-3 rounded-xl" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-300 mb-1.5 block">物資種類 *</label>
                                        {!isAddingCategory ? (
                                            <div className="flex space-x-2 relative">
                                                <select value={itemType} onChange={e => setItemType(e.target.value)} className="flex-1 glass-input px-4 py-3 rounded-xl appearance-none">
                                                    {categories.map(cat => (
                                                        <option key={cat.id} value={cat.name} className="text-black">{cat.name}</option>
                                                    ))}
                                                </select>
                                                {canEdit && (
                                                    <button type="button" onClick={() => setIsAddingCategory(true)} className="px-3 glass-input rounded-xl text-slate-400 hover:text-white transition-colors" title="新增種類">
                                                        <Plus className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex space-x-2">
                                                <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="輸入新物資名稱" className="flex-1 glass-input px-4 py-3 rounded-xl" autoFocus />
                                                <button type="button" onClick={handleAddCategory} disabled={isSavingCategory} className="px-4 bg-purple-500 hover:bg-purple-400 rounded-xl text-white font-bold transition-colors">
                                                    儲存
                                                </button>
                                                <button type="button" onClick={() => { setIsAddingCategory(false); setNewCategoryName(""); }} className="px-4 bg-slate-700 hover:bg-slate-600 rounded-xl text-white transition-colors">
                                                    取消
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-300 mb-1.5 block">本次發放數量 *</label>
                                        <div className="relative">
                                            <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} required className="w-full glass-input px-4 py-3 rounded-xl pl-10" />
                                            <Box className="w-5 h-5 absolute left-3 top-3.5 text-slate-400" />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-slate-300 mb-1.5 block">下次聯絡日期 *</label>
                                    <input type="date" value={nextContactDate} onChange={e => setNextContactDate(e.target.value)} required className="w-full glass-input px-4 py-3 rounded-xl" />
                                    <label className="flex items-center space-x-2 mt-2 cursor-pointer select-none">
                                        <input type="checkbox" checked={addToCalendar} onChange={e => setAddToCalendar(e.target.checked)} className="w-4 h-4 rounded accent-purple-500" />
                                        <span className="text-sm text-slate-300">📅 建立 Google Calendar 提醒活動</span>
                                    </label>
                                </div>

                                <div className="pt-4 flex space-x-3">
                                    <button type="button" onClick={() => setIsAddingNew(false)} className="flex-1 py-3 px-4 rounded-xl font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition border border-white/10">取消</button>
                                    <button type="submit" className="flex-1 py-3 px-4 rounded-xl font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 transition shadow-lg shadow-purple-500/20">建立據點並儲存</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
