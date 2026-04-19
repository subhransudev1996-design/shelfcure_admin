'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
    UserCircle,
    Search,
    Filter,
    Plus,
    X,
    Check,
    AlertCircle,
    Briefcase,
    IndianRupee,
    Calendar,
    Phone,
    Mail,
    MoreVertical,
    ChevronRight,
    UserCheck,
    UserMinus,
    TrendingDown,
    Send
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

export default function StaffPage() {
    const [staff, setStaff] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'pay' | null>(null);
    const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [newStaff, setNewStaff] = useState({
        full_name: '',
        role: 'Sales Representative',
        salary_amount: '',
        joined_date: new Date().toISOString().split('T')[0],
        status: 'Active',
        phone: '',
        email: ''
    });

    const roles = ['Sales Representative', 'Marketing Executive', 'Pharmacist', 'Operations Manager', 'Admin', 'Support'];

    async function fetchStaff() {
        setLoading(true);
        setError(null);
        try {
            const { data, error: supabaseError } = await supabase
                .from('staff')
                .select('*')
                .order('full_name', { ascending: true });

            if (supabaseError) {
                if (supabaseError.code === '42P01') {
                    setError('The "staff" table does not exist. Please run the SQL in the Financial Management Plan.');
                } else {
                    throw supabaseError;
                }
            } else {
                setStaff(data || []);
            }
        } catch (err: any) {
            console.error('Error fetching staff:', err?.message || err);
            setError(err?.message || 'Failed to sync with HR network.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchStaff();
    }, []);

    const handleCreateStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase.from('staff').insert([newStaff]);
            if (error) throw error;
            await fetchStaff();
            setModalMode(null);
            setNewStaff({
                full_name: '',
                role: 'Sales Representative',
                salary_amount: '',
                joined_date: new Date().toISOString().split('T')[0],
                status: 'Active',
                phone: '',
                email: ''
            });
        } catch (err: any) {
            alert('Error adding staff: ' + err.message);
        }
    };

    const handleSalaryPayout = async (staffMember: any) => {
        if (!confirm(`Log salary payout of ₹${staffMember.salary_amount} for ${staffMember.full_name}?`)) return;

        try {
            // Log as an expense
            const { error: expenseError } = await supabase.from('expenses').insert([{
                category: 'Salary',
                amount: staffMember.salary_amount,
                description: `Salary Payout: ${staffMember.full_name} (${formatDate(new Date().toISOString())})`,
                date: new Date().toISOString().split('T')[0],
                status: 'Paid'
            }]);

            if (expenseError) throw expenseError;
            alert('Salary payout logged successfully!');
        } catch (err: any) {
            alert('Error logging payout: ' + err.message);
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase.from('staff').update({ status: newStatus }).eq('id', id);
            if (error) throw error;
            await fetchStaff();
            setActiveMenu(null);
        } catch (err: any) {
            alert('Error updating status: ' + err.message);
        }
    };

    const handleDeleteStaff = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to remove ${name} from the team records?`)) return;
        try {
            const { error } = await supabase.from('staff').delete().eq('id', id);
            if (error) throw error;
            await fetchStaff();
            setActiveMenu(null);
        } catch (err: any) {
            alert('Error deleting staff: ' + err.message);
        }
    };

    const filteredStaff = staff.filter(s =>
        s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.role?.toLowerCase().includes(search.toLowerCase())
    );

    const stats = {
        total: staff.length,
        active: staff.filter(s => s.status === 'Active').length,
        monthlyPayroll: staff
            .filter(s => s.status === 'Active')
            .reduce((sum, s) => sum + Number(s.salary_amount), 0),
        newJoins: staff.filter(s => {
            const joinDate = new Date(s.joined_date);
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return joinDate > monthAgo;
        }).length
    };

    return (
        <div className="p-10 max-w-7xl mx-auto space-y-10 animate-fade-in-up">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-4">
                        <div className="p-2 rounded-xl bg-brand/10 brand-glow">
                            <UserCircle className="h-8 w-8 text-brand" />
                        </div>
                        Staff & HR
                    </h1>
                    <p className="text-gray-400 mt-2 text-lg">Manage team roles, salaries, and internal distributions</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setModalMode('create')}
                        className="bg-brand text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest brand-glow hover:opacity-90 transition-all active:scale-95 flex items-center gap-3"
                    >
                        <Plus className="h-5 w-5" />
                        Add Team Member
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Team', value: stats.total, color: 'brand', icon: UserCheck },
                    { label: 'Active Staff', value: stats.active, color: 'blue', icon: Briefcase },
                    { label: 'Monthly Payroll', value: `₹${stats.monthlyPayroll.toLocaleString()}`, color: 'orange', icon: IndianRupee },
                    { label: 'Recent Joins', value: stats.newJoins, color: 'brand', icon: Calendar },
                ].map((stat, i) => (
                    <div key={i} className="glass-morphism p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
                        <div className={`absolute -right-4 -top-4 w-24 h-24 bg-${stat.color === 'brand' ? 'brand' : stat.color + '-500'}/10 blur-3xl rounded-full group-hover:bg-${stat.color}-500/20 transition-all`} />
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{stat.label}</p>
                        <div className="flex items-center justify-between">
                            <p className="text-3xl font-black text-white">{stat.value}</p>
                            <stat.icon className={`h-6 w-6 text-${stat.color === 'brand' ? 'brand' : stat.color + '-500'} opacity-20 group-hover:opacity-100 transition-opacity`} />
                        </div>
                    </div>
                ))}
            </div>

            {error && (
                <div className="glass-morphism p-6 rounded-[2rem] border border-red-500/20 bg-red-500/5 flex items-start gap-4">
                    <AlertCircle className="h-6 w-6 text-red-500 shrink-0" />
                    <div>
                        <p className="text-sm font-bold text-white uppercase tracking-wider">HR Sync Error</p>
                        <p className="text-sm text-gray-400 mt-1">{error}</p>
                    </div>
                </div>
            )}

            <div className="flex gap-4 items-center">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-brand transition-colors" />
                    <input
                        type="text"
                        placeholder="Search team by name or role..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full glass-morphism rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all text-white placeholder:text-gray-600"
                    />
                </div>
                <button className="glass-morphism p-4 rounded-2xl text-gray-400 hover:text-white hover:brand-glow transition-all">
                    <Filter className="h-5 w-5" />
                </button>
            </div>

            <div className="glass-morphism rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/[0.02] border-b border-white/10">
                                <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Member & Role</th>
                                <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Salary (Monthly)</th>
                                <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Contact</th>
                                <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Status</th>
                                <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-[0.2em] text-right">Quick Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan={5} className="px-8 py-20 text-center text-gray-500 font-bold uppercase tracking-widest animate-pulse transition-all">Retrieving Team Records...</td></tr>
                            ) : filteredStaff.length === 0 ? (
                                <tr><td colSpan={5} className="px-8 py-20 text-center text-gray-500 font-bold">No team members found matching your search.</td></tr>
                            ) : (
                                filteredStaff.map((member) => (
                                    <tr key={member.id} className="hover:bg-white/[0.04] transition-all duration-300 group cursor-default">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-white font-bold">{member.full_name}</span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Briefcase className="h-3 w-3 text-brand opacity-50" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{member.role}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <IndianRupee className="h-4 w-4 text-white opacity-40" />
                                                <span className="text-white font-black">{Number(member.salary_amount).toLocaleString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                                    <Phone className="h-3 w-3" />
                                                    {member.phone || 'N/A'}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                                    <Mail className="h-3 w-3" />
                                                    {member.email || 'N/A'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                                member.status === 'Active' ? "bg-brand/10 text-brand border-brand/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                                            )}>
                                                {member.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right relative">
                                            <div className="flex justify-end gap-2 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleSalaryPayout(member)}
                                                    className="p-2 hover:bg-brand/10 rounded-xl transition-all group/payout flex items-center gap-2"
                                                    title="Disburse Salary"
                                                >
                                                    <Send className="h-5 w-5 text-gray-500 group-hover/payout:text-brand" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-brand hidden group-hover/payout:block">Pay</span>
                                                </button>
                                                <button
                                                    onClick={() => setActiveMenu(activeMenu === member.id ? null : member.id)}
                                                    className="p-2 hover:bg-white/5 rounded-xl transition-all"
                                                >
                                                    <MoreVertical className="h-5 w-5 text-gray-500" />
                                                </button>
                                            </div>

                                            {activeMenu === member.id && (
                                                <div className="absolute right-8 top-full mt-2 z-50 min-w-[180px] bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 p-1.5 shadow-2xl animate-in zoom-in-95 duration-200">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedStaff(member);
                                                            setModalMode('edit');
                                                            setActiveMenu(null);
                                                        }}
                                                        className="w-full flex items-center gap-3 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all text-left"
                                                    >
                                                        Edit Profile
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(member.id, member.status === 'Active' ? 'Inactive' : 'Active')}
                                                        className="w-full flex items-center gap-3 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all text-left"
                                                    >
                                                        {member.status === 'Active' ? 'Deactivate' : 'Reactivate'}
                                                    </button>
                                                    <div className="h-px bg-white/5 my-1" />
                                                    <button
                                                        onClick={() => handleDeleteStaff(member.id, member.full_name)}
                                                        className="w-full flex items-center gap-3 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-500/50 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all text-left"
                                                    >
                                                        Delete Record
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

            {/* Add Staff Modal */}
            {modalMode === 'create' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-black/40 animate-in fade-in duration-300">
                    <form onSubmit={handleCreateStaff} className="glass-morphism w-full max-w-xl rounded-[2.5rem] p-10 border border-white/10 shadow-2xl relative animate-in zoom-in-95 duration-300">
                        <button type="button" onClick={() => setModalMode(null)} className="absolute right-8 top-8 p-2 rounded-xl hover:bg-white/5 text-gray-500 hover:text-white transition-all"><X className="h-6 w-6" /></button>
                        <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3"><Plus className="h-6 w-6 text-brand" /> Add Team Member</h2>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Full Identity</label>
                                    <input
                                        type="text"
                                        value={newStaff.full_name}
                                        onChange={(e) => setNewStaff({ ...newStaff, full_name: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand/50"
                                        placeholder="Full Name"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Role</label>
                                    <select
                                        value={newStaff.role}
                                        onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand/50 appearance-none bg-zinc-900"
                                    >
                                        {roles.map(role => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Monthly Salary (₹)</label>
                                    <input
                                        type="number"
                                        value={newStaff.salary_amount}
                                        onChange={(e) => setNewStaff({ ...newStaff, salary_amount: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand/50"
                                        placeholder="0"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Join Date</label>
                                    <input
                                        type="date"
                                        value={newStaff.joined_date}
                                        onChange={(e) => setNewStaff({ ...newStaff, joined_date: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand/50"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Contact Number</label>
                                    <input
                                        type="tel"
                                        value={newStaff.phone}
                                        onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand/50"
                                        placeholder="+91..."
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Personal Email</label>
                                    <input
                                        type="email"
                                        value={newStaff.email}
                                        onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand/50"
                                        placeholder="email@example.com"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button type="button" onClick={() => setModalMode(null)} className="flex-1 bg-white/5 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all">Abort</button>
                            <button type="submit" className="flex-1 bg-brand text-white py-4 rounded-2xl font-black uppercase tracking-widest brand-glow transition-all flex items-center justify-center gap-2"><Check className="h-5 w-5" /> Enlist Member</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
