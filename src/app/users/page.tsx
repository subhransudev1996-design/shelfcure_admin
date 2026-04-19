'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Users,
    Search,
    Filter,
    MoreVertical,
    Shield,
    User,
    CheckCircle2,
    XCircle,
    Eye,
    Edit2,
    Power,
    X,
    Check
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [modalMode, setModalMode] = useState<'view' | 'edit' | null>(null);

    async function fetchUsers() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*, pharmacies(name)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSuspend = async (id: string, name: string, currentStatus: boolean) => {
        const action = currentStatus ? 'suspend' : 'reactivate';
        if (!confirm(`Are you sure you want to ${action} ${name}?`)) return;

        try {
            const { error } = await supabase
                .from('users')
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            await fetchUsers();
            setActiveMenu(null);
        } catch (err) {
            console.error('Error toggling user status:', err);
            alert(`Failed to ${action} user.`);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('users')
                .update({
                    full_name: selectedUser.full_name,
                    email: selectedUser.email,
                    role: selectedUser.role
                })
                .eq('id', selectedUser.id);

            if (error) throw error;
            await fetchUsers();
            setModalMode(null);
            setSelectedUser(null);
        } catch (err) {
            console.error('Error updating user:', err);
            alert('Failed to update user.');
        }
    };

    useEffect(() => {
        const handleClickOutside = () => setActiveMenu(null);
        if (activeMenu) {
            window.addEventListener('click', handleClickOutside);
        }
        return () => window.removeEventListener('click', handleClickOutside);
    }, [activeMenu]);

    const filteredUsers = users.filter(u =>
        u.full_name.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.pharmacies?.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-10 max-w-7xl mx-auto space-y-10 animate-fade-in-up">
            <div>
                <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-4">
                    <div className="p-2 rounded-xl bg-brand/10 brand-glow">
                        <Users className="h-8 w-8 text-brand" />
                    </div>
                    User Management
                </h1>
                <p className="text-gray-400 mt-2 text-lg">Monitor and manage all system access nodes</p>
            </div>

            <div className="flex gap-4 items-center">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-brand transition-colors" />
                    <input
                        type="text"
                        placeholder="Search identities by name, email or pharmacy..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full glass-morphism rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all text-white placeholder:text-gray-600 shadow-inner"
                    />
                </div>
                <button className="glass-morphism p-4 rounded-2xl text-gray-400 hover:text-white hover:brand-glow transition-all active:scale-95">
                    <Filter className="h-5 w-5" />
                </button>
            </div>

            <div className="glass-morphism rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/[0.02] border-b border-white/10">
                                <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Identity</th>
                                <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Deployment</th>
                                <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Access Level</th>
                                <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Activity Status</th>
                                <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-8 h-16 bg-white/[0.02]" />
                                    </tr>
                                ))
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-white/[0.04] transition-all duration-300 group/row border-b border-white/[0.02] last:border-0 cursor-default">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-2xl bg-brand/10 flex items-center justify-center text-brand font-black text-lg brand-glow group-hover/row:scale-110 transition-transform">
                                                    {user.full_name?.[0] || 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white text-base group-hover/row:text-brand transition-colors">{user.full_name || 'System Identity'}</p>
                                                    <p className="text-xs font-medium text-gray-500 lowercase mt-0.5">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <Shield className="h-4 w-4 text-brand/50" />
                                                <span className="text-sm font-bold text-gray-200">{user.pharmacies?.name || 'Central Command'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className={cn(
                                                "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border",
                                                user.role === 'super_admin' ? "bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)]" :
                                                    user.role === 'admin' ? "bg-brand/10 text-brand border-brand/20" :
                                                        "bg-white/5 text-gray-400 border-white/10"
                                            )}>
                                                {user.role === 'super_admin' && <Shield className="h-3 w-3" />}
                                                {user.role.replace('_', ' ')}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={cn(
                                                "flex items-center gap-2 text-xs font-bold uppercase tracking-tighter px-3 py-1.5 rounded-full border",
                                                user.is_active ? "text-green-500 bg-green-500/10 border-green-500/20" : "text-red-500 bg-red-500/10 border-red-500/20"
                                            )}>
                                                <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", user.is_active ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : "bg-red-500")} />
                                                {user.is_active ? 'Active' : 'Offline'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right relative">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveMenu(activeMenu === user.id ? null : user.id);
                                                }}
                                                className={cn(
                                                    "transition-all p-2 rounded-xl",
                                                    activeMenu === user.id ? "bg-brand/20 text-brand brand-glow" : "text-gray-500 hover:text-white hover:bg-white/5"
                                                )}
                                            >
                                                <MoreVertical className="h-5 w-5" />
                                            </button>

                                            {activeMenu === user.id && (
                                                <div className="absolute right-0 top-full mt-2 z-50 min-w-[180px] bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedUser(user);
                                                            setModalMode('view');
                                                            setActiveMenu(null);
                                                        }}
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-brand/10 text-gray-300 hover:text-brand transition-all text-xs font-black uppercase tracking-widest group text-left"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        View Detail
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedUser(user);
                                                            setModalMode('edit');
                                                            setActiveMenu(null);
                                                        }}
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-all text-xs font-black uppercase tracking-widest group text-left"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                        Edit User
                                                    </button>
                                                    <div className="h-px bg-white/5 my-1 mx-2" />
                                                    <button
                                                        onClick={() => handleSuspend(user.id, user.full_name, user.is_active)}
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-red-500/10 text-gray-500 hover:text-red-500 transition-all text-xs font-black uppercase tracking-widest group text-left"
                                                    >
                                                        <Power className="h-4 w-4" />
                                                        {user.is_active ? 'Suspend' : 'Activate'}
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Modal */}
            {modalMode === 'view' && selectedUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-black/40 animate-in fade-in duration-300">
                    <div className="glass-morphism w-full max-w-lg rounded-[2.5rem] p-8 border border-white/10 shadow-2xl relative animate-in zoom-in-95 duration-300">
                        <button
                            onClick={() => { setModalMode(null); setSelectedUser(null); }}
                            className="absolute right-6 top-6 p-2 rounded-xl hover:bg-white/5 text-gray-500 hover:text-white transition-all"
                        >
                            <X className="h-6 w-6" />
                        </button>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-16 w-16 rounded-2xl bg-brand/10 flex items-center justify-center text-brand font-black text-2xl brand-glow">
                                {selectedUser.full_name?.[0] || 'U'}
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white">{selectedUser.full_name || 'System Identity'}</h2>
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Identity Profile & Authorization</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Access Email</p>
                                    <p className="text-gray-200 font-bold truncate">{selectedUser.email}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Authorization Role</p>
                                    <p className="text-brand font-black uppercase tracking-tighter">{selectedUser.role.replace('_', ' ')}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Connected Pharmacy</p>
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-brand/50" />
                                        <p className="text-gray-200 font-bold">{selectedUser.pharmacies?.name || 'Central Command'}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Activity Status</p>
                                    <p className={cn("font-black uppercase tracking-tighter", selectedUser.is_active ? "text-green-500" : "text-red-500")}>
                                        {selectedUser.is_active ? 'Active' : 'Offline / Suspended'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Node Identity ID</p>
                                    <p className="text-gray-400 text-[10px] font-mono">{selectedUser.auth_user_id || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Created At</p>
                                    <p className="text-gray-200 font-bold text-xs">{formatDate(selectedUser.created_at)}</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setModalMode('edit')}
                            className="w-full mt-10 bg-brand text-white py-4 rounded-2xl font-black uppercase tracking-widest brand-glow hover:opacity-90 transition-all active:scale-95"
                        >
                            Update Authorization Node
                        </button>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {modalMode === 'edit' && selectedUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-black/40 animate-in fade-in duration-300">
                    <form onSubmit={handleUpdate} className="glass-morphism w-full max-w-lg rounded-[2.5rem] p-8 border border-white/10 shadow-2xl relative animate-in zoom-in-95 duration-300">
                        <button
                            type="button"
                            onClick={() => { setModalMode(null); setSelectedUser(null); }}
                            className="absolute right-6 top-6 p-2 rounded-xl hover:bg-white/5 text-gray-500 hover:text-white transition-all"
                        >
                            <X className="h-6 w-6" />
                        </button>

                        <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
                            <Edit2 className="h-6 w-6 text-brand" />
                            Identity Configuration
                        </h2>

                        <div className="space-y-5">
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Full Identity Name</label>
                                <input
                                    type="text"
                                    value={selectedUser.full_name || ''}
                                    onChange={(e) => setSelectedUser({ ...selectedUser, full_name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Access Email Vector</label>
                                <input
                                    type="email"
                                    value={selectedUser.email || ''}
                                    onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Authorization Role</label>
                                <select
                                    value={selectedUser.role}
                                    onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all appearance-none"
                                >
                                    <option value="user" className="bg-gray-900">User</option>
                                    <option value="admin" className="bg-gray-900">Admin</option>
                                    <option value="super_admin" className="bg-gray-900">Super Admin</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-10">
                            <button
                                type="button"
                                onClick={() => { setModalMode(null); setSelectedUser(null); }}
                                className="flex-1 bg-white/5 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                            >
                                Abort
                            </button>
                            <button
                                type="submit"
                                className="flex-1 bg-brand text-white py-4 rounded-2xl font-black uppercase tracking-widest brand-glow hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Check className="h-5 w-5" />
                                Commit Identity
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
