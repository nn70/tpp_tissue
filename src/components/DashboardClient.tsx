"use client";

import { useState, useEffect, useRef } from "react";
import Map from "@/components/Map";
import AddressInput from "@/components/AddressInput";
import { Plus, MapPin, Calendar, Box, Loader2, Phone, User, ArrowUpDown, Trash2, Camera, MapIcon } from "lucide-react";
import exifr from 'exifr';
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

    // 新增看板表單狀態
    const [isAddingBillboard, setIsAddingBillboard] = useState(false);
    const [billboardStep, setBillboardStep] = useState<'upload' | 'form' | 'manual'>('upload');
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 為既存地點新增紀錄狀態
    const [addingRecordTo, setAddingRecordTo] = useState<string | null>(null);
    const [recordItemType, setRecordItemType] = useState("面紙");
    const [recordQuantity, setRecordQuantity] = useState("1");
    const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
    const [recordNextContactDate, setRecordNextContactDate] = useState("");
    const [recordAddToCalendar, setRecordAddToCalendar] = useState(true);

    const [mobileView, setMobileView] = useState<'map' | 'list'>('map');
    const [filterType, setFilterType] = useState<'ALL' | 'SUPPLY' | 'BILLBOARD'>('ALL'); // 新增清單過濾狀態

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

    const handleDeleteCategory = async (categoryId: string) => {
        if (!confirm("確定要刪除這個物資種類嗎？這將會更新介面的選單。")) return;

        try {
            const res = await fetch(`/api/item-categories/${categoryId}`, {
                method: "DELETE"
            });
            if (res.ok) {
                await fetchCategories();
            } else {
                alert("刪除失敗，可能是預設種類或權限不足");
            }
        } catch (error) {
            console.error(error);
            alert("系統錯誤");
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

    // Google Geocoder 根據坐標反查地址
    const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
        return new Promise((resolve) => {
            if (!window.google || !window.google.maps) {
                resolve("");
                return;
            }
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                if (status === "OK" && results && results[0]) {
                    resolve(results[0].formatted_address);
                } else {
                    resolve("");
                }
            });
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        try {
            const gpsData = await exifr.gps(file);
            if (gpsData && gpsData.latitude && gpsData.longitude) {
                setNewLat(gpsData.latitude);
                setNewLng(gpsData.longitude);
                const address = await reverseGeocode(gpsData.latitude, gpsData.longitude);
                setNewAddress(address);
                setBillboardStep('form');
            } else {
                setBillboardStep('manual');
            }
        } catch (err) {
            console.error(err);
            setBillboardStep('manual');
        } finally {
            setIsAddingBillboard(true);  // 新增這行：開啟彈窗
            setUploadingImage(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const submitNewLocation = async (e: React.FormEvent, type: "SUPPLY" | "BILLBOARD" = "SUPPLY") => {
        e.preventDefault();
        if (!newAddress || newLat === null || newLng === null) return alert("請透過自動完成選擇一個有效地址或是上傳含有地理資訊的照片");

        try {
            const res = await fetch("/api/locations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type,
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
                if (addToCalendar && nextContactDate && type === "SUPPLY") {
                    openGoogleCalendar(nextContactDate, newName, newAddress);
                }
                setIsAddingNew(false);
                setIsAddingBillboard(false);
                resetForm();
                fetchLocations();
            } else {
                const errData = await res.json().catch(() => ({}));
                alert(`儲存失敗：${errData.error || '未知錯誤'} (${res.status})`);
            }
        } catch (err) {
            console.error(err);
            alert("網路錯誤，請檢查網路連線後重試");
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
            } else {
                const errData = await res.json().catch(() => ({}));
                alert(`儲存紀錄失敗：${errData.error || '未知錯誤'} (${res.status})`);
            }
        } catch (err) {
            console.error(err);
            alert("網路錯誤，請檢查網路連線後重試");
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
        setBillboardStep('upload');
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
                <div className={`${mobileView === 'list' ? 'flex' : 'hidden'} md:flex w-full md:w-[400px] lg:w-[450px] flex-col glass-panel border-r border-white/10 z-10 shrink-0 h-full`}>
                    <div className="p-4 border-b border-white/10 shrink-0 space-y-3">
                        {canEdit && (
                            <div className="flex flex-col space-y-2">
                                <button
                                    onClick={() => { setIsAddingNew(true); setIsAddingBillboard(false); resetForm(); }}
                                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-purple-500/20 transition-all transform active:scale-95"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span>新增選舉物資發放據點</span>
                                </button>

                                <button
                                    onClick={() => { if (fileInputRef.current) fileInputRef.current.click(); }}
                                    disabled={uploadingImage}
                                    className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-teal-500/20 transition-all transform active:scale-95 disabled:opacity-50"
                                >
                                    {uploadingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                                    <span>新增看板位置 (自動讀取照片座標)</span>
                                </button>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                />
                            </div>
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

                        {/* 分類篩選按鈕區 */}
                        <div className="flex bg-black/20 rounded-xl p-1 gap-1">
                            <button
                                onClick={() => setFilterType('ALL')}
                                className={`flex-1 text-xs py-1.5 rounded-lg transition-all ${filterType === 'ALL' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'}`}
                            >全部</button>
                            <button
                                onClick={() => setFilterType('SUPPLY')}
                                className={`flex-1 text-xs py-1.5 rounded-lg transition-all ${filterType === 'SUPPLY' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'}`}
                            >📦 物資站</button>
                            <button
                                onClick={() => setFilterType('BILLBOARD')}
                                className={`flex-1 text-xs py-1.5 rounded-lg transition-all ${filterType === 'BILLBOARD' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'}`}
                            >📍 看板</button>
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
                            [...locations].filter(loc => {
                                if (filterType === 'ALL') return true;
                                const t = (loc as any).type || 'SUPPLY';
                                return t === filterType;
                            }).sort((a, b) => {
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

                                    {(loc as any).type !== 'BILLBOARD' && (
                                        <>
                                            <div className="bg-black/20 rounded-xl p-3 mb-3 mt-3">
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
                                                                <div className="flex space-x-1 items-center">
                                                                    <select value={recordItemType} onChange={e => setRecordItemType(e.target.value)} className="flex-1 min-w-0 w-full glass-input px-2 py-2 rounded-lg text-sm" onClick={e => e.stopPropagation()}>
                                                                        {categories.map(cat => (
                                                                            <option key={cat.id} value={cat.name} className="text-black">{cat.name}</option>
                                                                        ))}
                                                                    </select>
                                                                    {canEdit && (
                                                                        <button type="button" onClick={(e) => { e.stopPropagation(); setIsAddingCategory(true); }} className="shrink-0 p-1.5 glass-input rounded-md text-slate-400 hover:text-white transition-colors" title="新增種類">
                                                                            <Plus className="w-4 h-4" />
                                                                        </button>
                                                                    )}
                                                                    {isAdmin && recordItemType !== "面紙" && recordItemType !== "扇子" && (
                                                                        <button type="button" onClick={(e) => { e.stopPropagation(); const cat = categories.find(c => c.name === recordItemType); if (cat) handleDeleteCategory(cat.id); }} className="shrink-0 p-1.5 glass-input rounded-md text-red-400 hover:text-red-300 transition-colors" title="刪除種類">
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="flex space-x-1 items-center">
                                                                    <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="新種類" className="w-[80px] glass-input px-2 py-2 rounded-lg text-sm" onClick={e => e.stopPropagation()} autoFocus />
                                                                    <div className="flex flex-col space-y-1">
                                                                        <button type="button" onClick={handleAddCategory} disabled={isSavingCategory} className="px-2 py-1 bg-purple-500 hover:bg-purple-400 rounded-md text-white text-[10px] font-bold transition-colors">
                                                                            儲存
                                                                        </button>
                                                                        <button type="button" onClick={(e) => { e.stopPropagation(); setIsAddingCategory(false); setNewCategoryName(""); }} className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded-md text-white text-[10px] transition-colors">
                                                                            取消
                                                                        </button>
                                                                    </div>
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
                                                canEdit && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const latestRecord = [...loc.records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                                                            setAddingRecordTo(loc.id);
                                                            setRecordItemType((latestRecord as any)?.itemType || "面紙");
                                                        }}
                                                        className="w-full mt-2 py-2 flex items-center justify-center space-x-1 border border-dashed border-white/20 text-slate-300 hover:text-white hover:border-white/40 rounded-xl text-sm transition-all"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                        <span>登記新發放</span>
                                                    </button>
                                                )
                                            )}
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Map Area */}
                <div className={`${mobileView === 'map' ? 'block' : 'hidden'} md:block flex-1 relative p-4`}>
                    <Map
                        locations={locations}
                        selectedLocationId={selectedLocId}
                        onSelectMarker={setSelectedLocId}
                    />
                </div>

                {/* 手機版切換按鈕 */}
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 md:hidden flex p-1.5 rounded-full bg-slate-800/90 backdrop-blur-md shadow-2xl border border-white/10">
                    <button
                        onClick={() => setMobileView('map')}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${mobileView === 'map' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'text-slate-400 hover:text-white'}`}
                    >
                        地圖
                    </button>
                    <button
                        onClick={() => setMobileView('list')}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${mobileView === 'list' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'text-slate-400 hover:text-white'}`}
                    >
                        列表
                    </button>
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
                                            <div className="flex space-x-1 items-center">
                                                <select value={itemType} onChange={e => setItemType(e.target.value)} className="flex-1 min-w-0 w-full glass-input px-2 py-3 rounded-xl">
                                                    {categories.map(cat => (
                                                        <option key={cat.id} value={cat.name} className="text-black">{cat.name}</option>
                                                    ))}
                                                </select>
                                                {canEdit && (
                                                    <button type="button" onClick={() => setIsAddingCategory(true)} className="shrink-0 p-2.5 glass-input rounded-xl text-slate-400 hover:text-white transition-colors" title="新增種類">
                                                        <Plus className="w-5 h-5" />
                                                    </button>
                                                )}
                                                {isAdmin && itemType !== "面紙" && itemType !== "扇子" && (
                                                    <button type="button" onClick={() => { const cat = categories.find(c => c.name === itemType); if (cat) handleDeleteCategory(cat.id); }} className="shrink-0 p-2.5 glass-input rounded-xl text-red-400 hover:text-red-300 transition-colors" title="刪除種類">
                                                        <Trash2 className="w-5 h-5" />
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

                {/* 新增看板 Modal */}
                {isAddingBillboard && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="glass-panel w-full max-w-lg rounded-2xl p-6 shadow-2xl animate-fade-in-up">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold flex items-center text-teal-400"><MapIcon className="mr-2" /> 新增看板位置</h2>
                                <button onClick={() => { setIsAddingBillboard(false); setBillboardStep('upload'); }} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">✕</button>
                            </div>

                            {billboardStep === 'manual' && (
                                <div className="mb-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-200">
                                    <div className="flex mb-2">
                                        <div className="text-xl mr-2">⚠️</div>
                                        <div className="font-bold">照片中沒有 GPS 座標資訊</div>
                                    </div>
                                    <div className="text-sm space-y-2 opacity-90 pl-7">
                                        <p>為了能自動在地圖標記，請確認相機設定：</p>
                                        <ul className="list-disc pl-4 space-y-1 text-xs">
                                            <li><strong>iPhone:</strong> 設定 → 隱私權與安全性 → 定位服務 → 相機 → 選擇「使用 App 期間」並開啟「準確位置」</li>
                                            <li><strong>Android:</strong> 打開相機 App → 設定 (齒輪圖示) → 開啟「儲存地理位置」或「位置標籤」</li>
                                        </ul>
                                        <p className="pt-2">您現在可以選擇放棄，或者手動在地圖上搜尋位置輸入：</p>
                                    </div>
                                    <div className="mt-4 flex space-x-2 pl-7">
                                        <button type="button" onClick={() => setBillboardStep('form')} className="px-4 py-2 bg-orange-500/30 hover:bg-orange-500/40 border border-orange-500/50 rounded-lg text-sm font-medium transition-colors">手動輸入地址</button>
                                    </div>
                                </div>
                            )}

                            {billboardStep === 'form' && (
                                <form onSubmit={(e) => submitNewLocation(e, "BILLBOARD")} className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-slate-300 mb-1.5 block">看板名稱 (選填)</label>
                                        <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="例如：中正路大看板" className="w-full glass-input px-4 py-3 rounded-xl" />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-slate-300 mb-1.5 block">搜尋並選擇看板地址 / 座標 *</label>
                                        <AddressInput onPlaceSelected={handlePlaceSelected} placeholder="請輸入地址或座標" defaultValue={newAddress} />
                                    </div>

                                    {newLat && newLng && (
                                        <div className="text-xs text-green-400 bg-green-400/10 p-2 rounded-lg border border-green-400/20">
                                            ✅ 已鎖定座標：{newLat.toFixed(5)}, {newLng.toFixed(5)}
                                        </div>
                                    )}

                                    <div className="pt-4 flex space-x-3">
                                        <button type="button" onClick={() => { setIsAddingBillboard(false); setBillboardStep('upload'); }} className="flex-1 py-3 px-4 rounded-xl font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition border border-white/10">取消</button>
                                        <button type="submit" className="flex-1 py-3 px-4 rounded-xl font-medium text-white bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 transition shadow-lg shadow-teal-500/20">建立看板位置</button>
                                    </div>
                                </form>
                            )}

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
