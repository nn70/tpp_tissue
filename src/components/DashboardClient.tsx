"use client";

import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import Map from "@/components/Map";
import AddressInput from "@/components/AddressInput";
import { LogOut, Plus, MapPin, Calendar, Box, Loader2, Phone } from "lucide-react";
import { Location, DistributionRecord } from "@prisma/client";

type LocationWithRecords = Location & { records: DistributionRecord[] };

export default function DashboardClient() {
    const { data: session } = useSession();
    const [locations, setLocations] = useState<LocationWithRecords[]>([]);
    const [selectedLocId, setSelectedLocId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // 新增地點表單狀態
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newAddress, setNewAddress] = useState("");
    const [newLat, setNewLat] = useState<number | null>(null);
    const [newLng, setNewLng] = useState<number | null>(null);
    const [contactPhone, setContactPhone] = useState("");
    const [quantity, setQuantity] = useState("1");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [nextContactDate, setNextContactDate] = useState("");

    // 為既存地點新增紀錄狀態
    const [addingRecordTo, setAddingRecordTo] = useState<string | null>(null);
    const [recordQuantity, setRecordQuantity] = useState("1");
    const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
    const [recordNextContactDate, setRecordNextContactDate] = useState("");

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
        fetchLocations();
    }, []);

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
                    address: newAddress,
                    latitude: newLat,
                    longitude: newLng,
                    contactPhone,
                    initialQuantity: Number(quantity),
                    date,
                    nextContactDate: nextContactDate ? nextContactDate : undefined
                }),
            });

            if (res.ok) {
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
                    quantity: Number(recordQuantity),
                    date: recordDate,
                    nextContactDate: recordNextContactDate ? recordNextContactDate : undefined
                }),
            });

            if (res.ok) {
                setAddingRecordTo(null);
                setRecordQuantity("1");
                fetchLocations();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const resetForm = () => {
        setNewAddress("");
        setNewLat(null);
        setNewLng(null);
        setContactPhone("");
        setQuantity("1");
        setNextContactDate("");
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-slate-900 text-slate-100">
            {/* Header */}
            <header className="h-16 glass-panel border-b border-white/10 flex items-center justify-between px-6 z-10 shrink-0">
                <div className="flex items-center space-x-3">
                    <div className="bg-purple-500/20 p-2 rounded-lg">
                        <MapPin className="text-purple-300 w-5 h-5" />
                    </div>
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-blue-200">
                        發放熱點追蹤
                    </h1>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 text-sm text-slate-300 hidden md:flex">
                        {session?.user?.image && <img src={session.user.image} alt="Avatar" className="w-8 h-8 rounded-full border border-white/20" />}
                        <span>{session?.user?.name}</span>
                    </div>
                    <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="flex items-center space-x-2 text-sm text-red-300 hover:text-red-200 hover:bg-red-500/10 px-3 py-2 rounded-lg transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden md:inline">登出</span>
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* Background Blobs */}
                <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full mix-blend-screen filter blur-[100px] pointer-events-none"></div>

                {/* Sidebar List */}
                <div className="w-full md:w-[400px] lg:w-[450px] flex flex-col glass-panel border-r border-white/10 z-10 shrink-0 h-full">
                    <div className="p-4 border-b border-white/10 shrink-0">
                        <button
                            onClick={() => setIsAddingNew(true)}
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-purple-500/20 transition-all transform active:scale-95"
                        >
                            <Plus className="w-5 h-5" />
                            <span>新增面紙盒發放據點</span>
                        </button>
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
                            locations.map((loc) => (
                                <div
                                    key={loc.id}
                                    className={`bg-white/5 border border-white/10 rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:bg-white/10 ${selectedLocId === loc.id ? 'ring-2 ring-purple-500 bg-white/10 shadow-lg shadow-purple-500/20' : ''}`}
                                    onClick={() => setSelectedLocId(loc.id)}
                                >
                                    <h3 className="font-semibold text-slate-100 text-lg mb-2">{loc.address}</h3>

                                    {loc.contactPhone && (
                                        <div className="flex items-center space-x-2 text-sm text-slate-400 mb-3">
                                            <Phone className="w-3.5 h-3.5" />
                                            <span>{loc.contactPhone}</span>
                                        </div>
                                    )}

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
                                                <div key={record.id} className="flex justify-between items-center border-b border-white/5 pb-1 last:border-0">
                                                    <span className="text-slate-300 flex items-center"><Calendar className="w-3 h-3 mr-1.5 opacity-70" /> {new Date(record.date).toLocaleDateString()}</span>
                                                    <span className="text-blue-300 flex items-center font-medium">+{record.quantity} <Box className="w-3 h-3 ml-1 opacity-70" /></span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {addingRecordTo === loc.id ? (
                                        <form onSubmit={(e) => submitNewRecord(e, loc.id)} className="space-y-3 pt-2 border-t border-white/10 onClick={(e) => e.stopPropagation()}">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-xs text-slate-400 mb-1 block">日期</label>
                                                    <input type="date" value={recordDate} onChange={e => setRecordDate(e.target.value)} required className="w-full glass-input px-3 py-2 rounded-lg text-sm" onClick={e => e.stopPropagation()} />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-400 mb-1 block">數量</label>
                                                    <input type="number" min="1" value={recordQuantity} onChange={e => setRecordQuantity(e.target.value)} required className="w-full glass-input px-3 py-2 rounded-lg text-sm" onClick={e => e.stopPropagation()} />
                                                </div>
                                            </div>
                                            <div className="mt-2">
                                                <label className="text-xs text-slate-400 mb-1 block">下次聯絡日 (選填)</label>
                                                <input type="date" value={recordNextContactDate} onChange={e => setRecordNextContactDate(e.target.value)} className="w-full glass-input px-3 py-2 rounded-lg text-sm" onClick={e => e.stopPropagation()} />
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
                                    <label className="text-sm font-medium text-slate-300 mb-1.5 block">搜尋並選擇地點 *</label>
                                    <AddressInput onPlaceSelected={handlePlaceSelected} />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-slate-300 mb-1.5 block">聯絡電話 (選填)</label>
                                    <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="09XX-XXX-XXX" className="w-full glass-input px-4 py-3 rounded-xl" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-slate-300 mb-1.5 block">發放日期 *</label>
                                        <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full glass-input px-4 py-3 rounded-xl" />
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
                                    <label className="text-sm font-medium text-slate-300 mb-1.5 block">提醒幾天後聯絡 (輸入下次聯絡日期，選填)</label>
                                    <input type="date" value={nextContactDate} onChange={e => setNextContactDate(e.target.value)} className="w-full glass-input px-4 py-3 rounded-xl" />
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
