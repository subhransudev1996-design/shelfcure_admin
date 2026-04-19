'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Receipt,
    Search,
    Filter,
    Plus,
    X,
    Check,
    AlertCircle,
    TrendingDown,
    Wallet,
    Calendar,
    Tag,
    MoreVertical,
    ChevronRight,
    ArrowUpRight,
    CreditCard
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
    const [selectedExpense, setSelectedExpense] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [newExpense, setNewExpense] = useState({
        category: 'Marketing',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        status: 'Paid'
    });

    const categories = ['Marketing', 'Sales', 'Salary', 'Rent', 'Utilities', 'Inventory', 'Travel', 'Other'];

    async function fetchExpenses() {
        setLoading(true);
        setError(null);
        try {
            const { data, error: supabaseError } = await supabase
                .from('expenses')
                .select('*')
                .order('date', { ascending: false });

            if (supabaseError) {
                if (supabaseError.code === '42P01') {
                    setError('The "expenses" table does not exist. Please run the SQL in the Financial Management Plan.');
                } else {
                    throw supabaseError;
                }
            } else {
                setExpenses(data || []);
            }
        } catch (err: any) {
            console.error('Error fetching expenses:', err?.message || err);
            setError(err?.message || 'Failed to sync with financial network.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchExpenses();
    }, []);

    const handleCreateExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase.from('expenses').insert([newExpense]);
            if (error) throw error;
            await fetchExpenses();
            setModalMode(null);
            setNewExpense({
                category: 'Marketing',
                amount: '',
                description: '',
                date: new Date().toISOString().split('T')[0],
                status: 'Paid'
            });
        } catch (err: any) {
            alert('Error logging expense: ' + err.message);
        }
    };

    const handleDeleteExpense = async (id: string) => {
        if (!confirm('Are you sure you want to delete this expense record?')) return;
        try {
            const { error } = await supabase.from('expenses').delete().eq('id', id);
            if (error) throw error;
            await fetchExpenses();
            setActiveMenu(null);
        } catch (err: any) {
            alert('Error deleting expense: ' + err.message);
        }
    };

    const filteredExpenses = expenses.filter(e =>
        e.description?.toLowerCase().includes(search.toLowerCase()) ||
        e.category?.toLowerCase().includes(search.toLowerCase())
    );

    const stats = {
        total: expenses.reduce((sum, e) => sum + Number(e.amount), 0),
        thisMonth: expenses
            .filter(e => new Date(e.date).getMonth() === new Date().getMonth())
            .reduce((sum, e) => sum + Number(e.amount), 0),
        marketing: expenses
            .filter(e => e.category === 'Marketing')
            .reduce((sum, e) => sum + Number(e.amount), 0),
        pending: expenses.filter(e => e.status === 'Pending').length
    };

    return (
        <div className="p-10 max-w-7xl mx-auto space-y-10 animate-fade-in-up">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-4">
                        <div className="p-2 rounded-xl bg-brand/10 brand-glow">
                            <Receipt className="h-8 w-8 text-brand" />
                        </div>
                        Operational Expenses
                    </h1>
                    <p className="text-gray-400 mt-2 text-lg">Track Shelfcure&apos;s internal burn, marketing, and sales costs</p>
                </div>
                <button
                    onClick={() => setModalMode('create')}
                    className="bg-brand text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest brand-glow hover:opacity-90 transition-all active:scale-95 flex items-center gap-3"
                >
                    <Plus className="h-5 w-5" />
                    Log Expense
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Burn', value: `₹${stats.total.toLocaleString()}`, color: 'brand', icon: Wallet },
                    { label: 'This Month', value: `₹${stats.thisMonth.toLocaleString()}`, color: 'blue', icon: Calendar },
                    { label: 'Marketing Spend', value: `₹${stats.marketing.toLocaleString()}`, color: 'orange', icon: TrendingDown },
                    { label: 'Pending Payouts', value: stats.pending, color: 'red', icon: AlertCircle },
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
                        <p className="text-sm font-bold text-white uppercase tracking-wider">Financial Sync Error</p>
                        <p className="text-sm text-gray-400 mt-1">{error}</p>
                    </div>
                </div>
            )}

            <div className="flex gap-4 items-center">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-brand transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by description or category..."
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
                                <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Date & Category</th>
                                <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Description</th>
                                <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Amount</th>
                                <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Status</th>
                                <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan={5} className="px-8 py-20 text-center text-gray-500 font-bold uppercase tracking-widest animate-pulse transition-all">Analyzing Financial Logs...</td></tr>
                            ) : filteredExpenses.length === 0 ? (
                                <tr><td colSpan={5} className="px-8 py-20 text-center text-gray-500 font-bold">No expenses found matching your criteria.</td></tr>
                            ) : (
                                filteredExpenses.map((expense) => (
                                    <tr key={expense.id} className="hover:bg-white/[0.04] transition-all duration-300 group cursor-default">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-white font-bold">{formatDate(expense.date)}</span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Tag className="h-3 w-3 text-brand opacity-50" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{expense.category}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-gray-300">{expense.description || 'No description'}</td>
                                        <td className="px-8 py-6">
                                            <span className="text-white font-black">₹{Number(expense.amount).toLocaleString()}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                                expense.status === 'Paid' ? "bg-brand/10 text-brand border-brand/20" : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                                            )}>
                                                {expense.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right relative">
                                            <button
                                                onClick={() => setActiveMenu(activeMenu === expense.id ? null : expense.id)}
                                                className="p-2 hover:bg-white/5 rounded-xl transition-all"
                                            >
                                                <MoreVertical className="h-5 w-5 text-gray-500" />
                                            </button>

                                            {activeMenu === expense.id && (
                                                <div className="absolute right-8 top-full mt-2 z-50 min-w-[160px] bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 p-1.5 shadow-2xl animate-in zoom-in-95 duration-200">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedExpense(expense);
                                                            setModalMode('edit');
                                                            setActiveMenu(null);
                                                        }}
                                                        className="w-full flex items-center gap-3 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all text-left"
                                                    >
                                                        Edit Details
                                                    </button>
                                                    <div className="h-px bg-white/5 my-1" />
                                                    <button
                                                        onClick={() => handleDeleteExpense(expense.id)}
                                                        className="w-full flex items-center gap-3 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-500/50 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all text-left"
                                                    >
                                                        Delete Log
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

            {/* Create Expense Modal */}
            {modalMode === 'create' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-black/40 animate-in fade-in duration-300">
                    <form onSubmit={handleCreateExpense} className="glass-morphism w-full max-w-lg rounded-[2.5rem] p-10 border border-white/10 shadow-2xl relative animate-in zoom-in-95 duration-300">
                        <button type="button" onClick={() => setModalMode(null)} className="absolute right-8 top-8 p-2 rounded-xl hover:bg-white/5 text-gray-500 hover:text-white transition-all"><X className="h-6 w-6" /></button>
                        <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3"><Receipt className="h-6 w-6 text-brand" /> Log New Expense</h2>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Category</label>
                                    <select
                                        value={newExpense.category}
                                        onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand/50 appearance-none bg-zinc-900"
                                    >
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Amount (₹)</label>
                                    <input
                                        type="number"
                                        value={newExpense.amount}
                                        onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand/50"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Date</label>
                                <input
                                    type="date"
                                    value={newExpense.date}
                                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand/50"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Description</label>
                                <textarea
                                    value={newExpense.description}
                                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand/50 min-h-[100px] resize-none"
                                    placeholder="What was this expense for?"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Payment Status</label>
                                <div className="flex gap-4">
                                    {['Paid', 'Pending'].map((status) => (
                                        <button
                                            key={status}
                                            type="button"
                                            onClick={() => setNewExpense({ ...newExpense, status })}
                                            className={cn(
                                                "flex-1 py-3 rounded-xl border text-xs font-black uppercase tracking-widest transition-all",
                                                newExpense.status === status
                                                    ? "bg-brand/10 border-brand text-brand ring-4 ring-brand/5"
                                                    : "bg-white/5 border-white/10 text-gray-500 hover:text-white"
                                            )}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button type="button" onClick={() => setModalMode(null)} className="flex-1 bg-white/5 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all">Abort</button>
                            <button type="submit" className="flex-1 bg-brand text-white py-4 rounded-2xl font-black uppercase tracking-widest brand-glow transition-all flex items-center justify-center gap-2"><Check className="h-5 w-5" /> Log Burn</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
