'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
    CreditCard,
    Search,
    Filter,
    CheckCircle2,
    XCircle,
    ArrowUpRight,
    Zap,
    Gift,
    X,
    Check,
    Calendar,
    IndianRupee,
    AlertTriangle
} from 'lucide-react';
import { cn, formatDate, formatCurrency } from '@/lib/utils';

export default function SubscriptionsPage() {
    const [pharmacies, setPharmacies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedForRenewal, setSelectedForRenewal] = useState<any | null>(null);

    async function fetchSubscriptions() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('pharmacies')
                .select('*')
                .order('subscription_end_date', { ascending: true });

            if (error) throw error;
            setPharmacies(data || []);
        } catch (err) {
            console.error('Error fetching subscriptions:', err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const handleRenew = async (pharmacy: any) => {
        try {
            const currentDate = new Date(pharmacy.subscription_end_date);
            // Add 1 year to the existing end date
            const newEndDate = new Date(currentDate.setFullYear(currentDate.getFullYear() + 1));

            const { error } = await supabase
                .from('pharmacies')
                .update({
                    subscription_status: 'active',
                    subscription_end_date: newEndDate.toISOString(),
                    subscription_start_date: new Date().toISOString()
                })
                .eq('id', pharmacy.id);

            if (error) throw error;
            await fetchSubscriptions();
            setSelectedForRenewal(null);
        } catch (err) {
            console.error('Error renewing subscription:', err);
            alert('Failed to renew subscription node.');
        }
    };

    const filtered = pharmacies.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-10 max-w-7xl mx-auto space-y-10 animate-fade-in-up">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-4">
                        <div className="p-2 rounded-xl bg-brand/10 brand-glow">
                            <CreditCard className="h-8 w-8 text-brand" />
                        </div>
                        Financial Overview
                    </h1>
                    <p className="text-gray-400 mt-2 text-lg">Subscription cycles & enterprise revenue tracking</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass-morphism p-8 rounded-[2.5rem] hover-brand-glow transition-all duration-500 group shadow-lg border border-white/5 relative overflow-hidden">
                    <div className="absolute -right-8 -top-8 w-40 h-40 bg-brand/5 blur-[60px] rounded-full group-hover:bg-brand/10 transition-all duration-500" />
                    <p className="text-xs font-black text-white uppercase tracking-widest opacity-70 group-hover:opacity-100 transition-opacity">Trial Infrastructure</p>
                    <div className="flex items-center gap-4 mt-4">
                        <div className="p-4 rounded-2xl bg-brand/10 text-brand brand-glow-soft">
                            <Gift className="h-7 w-7" />
                        </div>
                        <div>
                            <p className="text-4xl font-black text-white">{pharmacies.filter(p => p.subscription_status === 'trial').length}</p>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-1">Experimental Nodes</p>
                        </div>
                    </div>
                    <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                        <span>Onboarding Funnel</span>
                        <span className="text-brand">Evaluation Phase</span>
                    </div>
                </div>

                <div className="glass-morphism p-8 rounded-[2.5rem] hover-brand-glow transition-all duration-500 group shadow-lg border border-white/5 relative overflow-hidden">
                    <div className="absolute -right-8 -top-8 w-40 h-40 bg-green-500/5 blur-[60px] rounded-full group-hover:bg-green-500/10 transition-all duration-500" />
                    <p className="text-xs font-black text-white uppercase tracking-widest opacity-70 group-hover:opacity-100 transition-opacity">Active Subscriptions</p>
                    <div className="flex items-center gap-4 mt-4">
                        <div className="p-4 rounded-2xl bg-green-500/10 text-green-500">
                            <Zap className="h-7 w-7 shadow-[0_0_15px_rgba(34,197,94,0.3)]" />
                        </div>
                        <div>
                            <p className="text-4xl font-black text-white">{pharmacies.filter(p => p.subscription_status === 'active').length}</p>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-1">Verified Revenue Nodes</p>
                        </div>
                    </div>
                    <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                        <span>Projected Revenue</span>
                        <span className="text-green-500">{formatCurrency(pharmacies.filter(p => p.subscription_status === 'active').length * 7000)} / Year</span>
                    </div>
                </div>
            </div>

            <div className="flex gap-4 items-center">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-brand transition-colors" />
                    <input
                        type="text"
                        placeholder="Filter revenue nodes by medical facility name..."
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
                                <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Node / Pharmacy</th>
                                <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Deployment Status</th>
                                <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Lifecycle End</th>
                                <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Enterprise ID</th>
                                <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="h-10 w-10 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
                                            <span className="text-gray-500 font-bold uppercase tracking-[0.2em]">Syncing Revenue Nodes...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-gray-500">
                                        No financial data matching your search parameters.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((pharmacy) => (
                                    <tr key={pharmacy.id} className="hover:bg-white/[0.04] transition-all duration-300 group/row border-b border-white/[0.02] last:border-0 cursor-default">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-2xl bg-brand/10 flex items-center justify-center text-brand font-black text-lg brand-glow group-hover/row:scale-110 transition-transform">
                                                    {pharmacy.name[0]}
                                                </div>
                                                <p className="font-bold text-white text-base group-hover/row:text-brand transition-colors">{pharmacy.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className={cn(
                                                "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-tighter backdrop-blur-md border",
                                                pharmacy.subscription_status === 'active' ? "bg-green-500/10 text-green-500 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]" :
                                                    pharmacy.subscription_status === 'trial' ? "bg-brand/10 text-brand border-brand/20 shadow-[0_0_10px_rgba(76,186,73,0.1)]" :
                                                        pharmacy.subscription_status === 'grace' ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                                                            "bg-red-500/10 text-red-400 border-red-500/20"
                                            )}>
                                                <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse",
                                                    pharmacy.subscription_status === 'active' ? "bg-green-500 shadow-[0_0_8px_#22c55e]" :
                                                        pharmacy.subscription_status === 'trial' ? "bg-brand shadow-[0_0_8px_#4cba49]" :
                                                            "bg-red-500"
                                                )} />
                                                {pharmacy.subscription_status}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-gray-500" />
                                                <span className="text-sm font-bold text-gray-200">{formatDate(pharmacy.subscription_end_date)}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <code className="text-xs font-mono text-gray-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md">{pharmacy.gstin || 'N/A'}</code>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button
                                                onClick={() => setSelectedForRenewal(pharmacy)}
                                                className="text-brand hover:text-white transition-all font-black text-xs uppercase tracking-widest flex items-center gap-2 ml-auto group"
                                            >
                                                Renew Node
                                                <ArrowUpRight className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Renewal Confirmation Modal */}
            {selectedForRenewal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-black/40 animate-in fade-in duration-300">
                    <div className="glass-morphism w-full max-w-lg rounded-[2.5rem] p-8 border border-white/10 shadow-2xl relative animate-in zoom-in-95 duration-300">
                        <button
                            onClick={() => setSelectedForRenewal(null)}
                            className="absolute right-6 top-6 p-2 rounded-xl hover:bg-white/5 text-gray-500 hover:text-white transition-all"
                        >
                            <X className="h-6 w-6" />
                        </button>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-16 w-16 rounded-2xl bg-brand/10 flex items-center justify-center text-brand font-black text-2xl brand-glow">
                                <Zap className="h-8 w-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white">Renew Infrastructure</h2>
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Node Lifecycle Extension</p>
                            </div>
                        </div>

                        <div className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/5">
                            <p className="text-sm text-gray-400 mb-4">You are about to extend the subscription for <span className="text-white font-bold">{selectedForRenewal.name}</span> by <span className="text-brand font-black">1 Year</span>.</p>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Current Expiry</p>
                                    <p className="text-gray-200 font-bold text-xs">{formatDate(selectedForRenewal.subscription_end_date)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-brand uppercase tracking-widest mb-1">New Terminal Date</p>
                                    <p className="text-brand font-bold text-xs">
                                        {formatDate(new Date(new Date(selectedForRenewal.subscription_end_date).setFullYear(new Date(selectedForRenewal.subscription_end_date).getFullYear() + 1)).toISOString())}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setSelectedForRenewal(null)}
                                className="flex-1 bg-white/5 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                            >
                                Abort
                            </button>
                            <button
                                onClick={() => handleRenew(selectedForRenewal)}
                                className="flex-1 bg-brand text-white py-4 rounded-2xl font-black uppercase tracking-widest brand-glow hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Check className="h-5 w-5" />
                                Confirm Renewal
                            </button>
                        </div>
                        <p className="text-center text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-6">
                            Enterprise Value: {formatCurrency(7000)} / Annual Node Status
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
