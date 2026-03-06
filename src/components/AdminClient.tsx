"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Shield, User, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";

interface AppUser {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    role: "USER" | "EDITOR" | "ADMIN";
}

export default function AdminClient() {
    const { data: session } = useSession();
    const [users, setUsers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/users");
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleRoleChange = async (userId: string, newRole: string) => {
        setUpdating(userId);
        setMessage(null);
        try {
            const res = await fetch("/api/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, role: newRole })
            });

            if (res.ok) {
                setMessage({ type: 'success', text: '權限更新成功' });
                await fetchUsers();
            } else {
                setMessage({ type: 'error', text: '權限更新失敗，請稍後再試' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: '發生系統錯誤' });
        } finally {
            setUpdating(null);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f1016] text-slate-100 pt-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center space-x-3 pb-6 border-b border-white/10">
                    <div className="bg-amber-500/20 p-2.5 rounded-xl">
                        <Shield className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">人員權限管理</h1>
                        <p className="text-sm text-slate-400 mt-1">設定小編權限，只有小編以上才能觀看地圖與登打資料</p>
                    </div>
                </div>

                {message && (
                    <div className={`p-4 rounded-xl flex items-center space-x-2 animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                        }`}>
                        {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <span>{message.text}</span>
                    </div>
                )}

                <div className="glass-panel rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/10">
                                    <th className="px-6 py-4 text-sm font-medium text-slate-300">使用者</th>
                                    <th className="px-6 py-4 text-sm font-medium text-slate-300">目前的權限</th>
                                    <th className="px-6 py-4 text-sm font-medium text-slate-300 text-right">操作設定</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                                            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                                            載入中...
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                                            尚未有使用者註冊
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    {user.image ? (
                                                        <img src={user.image} alt="" className="w-10 h-10 rounded-full" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                                                            <User className="w-5 h-5 text-slate-400" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-medium text-slate-200">{user.name || '未知使用者'}</div>
                                                        <div className="text-sm text-slate-400">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${user.role === 'ADMIN' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                                                        user.role === 'EDITOR' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                                                            'bg-slate-500/20 text-slate-300 border-slate-500/30'
                                                    }`}>
                                                    {user.role === 'ADMIN' ? '最高管理員' : user.role === 'EDITOR' ? '小編 (可編輯)' : '一般註冊者 (無權限)'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <select
                                                    disabled={updating === user.id || user.email === (session?.user?.email || '')}
                                                    value={user.role}
                                                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                    className="glass-input px-3 py-1.5 rounded-lg text-sm bg-slate-900 border-white/10 disabled:opacity-50"
                                                >
                                                    <option value="USER">設為一般</option>
                                                    <option value="EDITOR">設為小編</option>
                                                    <option value="ADMIN">設為管理員</option>
                                                </select>
                                                {user.email === (session?.user?.email || '') && (
                                                    <p className="text-xs text-slate-500 mt-1">無法調整自己的權限</p>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
