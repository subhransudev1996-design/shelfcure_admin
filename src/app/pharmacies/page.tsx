'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    Search,
    MoreVertical,
    CheckCircle2,
    XCircle,
    Clock,
    Eye,
    Edit2,
    Power,
    X,
    Check,
    Loader2,
    AlertTriangle,
    Phone,
    Mail,
    Building2,
    ArrowRight
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

export default function PharmaciesPage() {
    const [pharmacies, setPharmacies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [selectedPharmacy, setSelectedPharmacy] = useState<any | null>(null);
    const [modalMode, setModalMode] = useState<'view' | 'edit' | 'deactivate' | null>(null);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const router = useRouter();

    function showToast(message: string, type: 'success' | 'error' = 'success') {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }

    async function fetchPharmacies() {
        try {
            const { data, error } = await supabase
                .from('pharmacies')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPharmacies(data || []);
        } catch (err) {
            console.error('Error fetching pharmacies:', err);
            showToast('Failed to load customers', 'error');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchPharmacies();
    }, []);

    useEffect(() => {
        const handleClickOutside = () => setActiveMenu(null);
        if (activeMenu) {
            window.addEventListener('click', handleClickOutside);
        }
        return () => window.removeEventListener('click', handleClickOutside);
    }, [activeMenu]);

    async function handleDeactivateConfirm() {
        if (!selectedPharmacy) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('pharmacies')
                .update({ subscription_status: 'expired' })
                .eq('id', selectedPharmacy.id);

            if (error) throw error;
            showToast(`${selectedPharmacy.name} deactivated`);
            setModalMode(null);
            setSelectedPharmacy(null);
            await fetchPharmacies();
        } catch (err) {
            console.error('Error deactivating pharmacy:', err);
            showToast('Failed to deactivate', 'error');
        } finally {
            setSaving(false);
        }
    }

    async function handleUpdate(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedPharmacy) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('pharmacies')
                .update({
                    name: selectedPharmacy.name,
                    owner_name: selectedPharmacy.owner_name,
                    license_number: selectedPharmacy.license_number,
                    gstin: selectedPharmacy.gstin,
                    phone: selectedPharmacy.phone,
                    email: selectedPharmacy.email,
                    address: selectedPharmacy.address,
                    city: selectedPharmacy.city,
                    state: selectedPharmacy.state,
                    pincode: selectedPharmacy.pincode,
                    subscription_status: selectedPharmacy.subscription_status,
                    subscription_end_date: selectedPharmacy.subscription_end_date || null,
                    max_machines: selectedPharmacy.max_machines
                })
                .eq('id', selectedPharmacy.id);

            if (error) throw error;
            showToast('Customer updated successfully');
            setModalMode(null);
            setSelectedPharmacy(null);
            await fetchPharmacies();
        } catch (err) {
            console.error('Error updating pharmacy:', err);
            showToast('Failed to update customer', 'error');
        } finally {
            setSaving(false);
        }
    }

    // Filtering
    const filteredPharmacies = pharmacies.filter(p => {
        const matchesSearch = (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (p.license_number || '').toLowerCase().includes(search.toLowerCase()) ||
            (p.owner_name || '').toLowerCase().includes(search.toLowerCase()) ||
            (p.city || '').toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || p.subscription_status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Stats
    const activeCount = pharmacies.filter(p => p.subscription_status === 'active').length;
    const trialCount = pharmacies.filter(p => p.subscription_status === 'trial').length;
    const expiringCount = pharmacies.filter(p => {
        if (!p.subscription_end_date) return false;
        const end = new Date(p.subscription_end_date);
        const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        return end < thirtyDays && end > new Date() && p.subscription_status === 'active';
    }).length;
    const activeRate = pharmacies.length > 0 ? Math.round(activeCount / pharmacies.length * 100) : 0;

    const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all font-medium placeholder:text-gray-600";

    return (
        <div className="p-10 max-w-7xl mx-auto space-y-10 animate-fade-in-up pb-20">
            {/* Toast */}
            {toast && (
                <div className={cn(
                    "fixed top-6 right-6 z-[200] px-6 py-4 rounded-2xl font-bold text-sm shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300",
                    toast.type === 'success' ? "bg-brand/90 text-white border border-brand/40" : "bg-red-500/90 text-white border border-red-500/40"
                )}>
                    {toast.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-white">Customers</h1>
                    <p className="text-gray-400 mt-2 text-lg">Converted leads &amp; active pharmacy subscriptions</p>
                </div>
                <button
                    onClick={() => router.push('/leads')}
                    className="bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-2xl flex items-center gap-2 transition-all font-bold border border-white/10 hover:border-brand/30 active:scale-95"
                >
                    Go to Leads Pipeline
                    <ArrowRight className="h-5 w-5" />
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="glass-morphism p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10 flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Total Customers</span>
                        <span className="text-4xl font-black text-white">{pharmacies.length}</span>
                        <span className="text-xs text-brand font-medium">Converted from leads</span>
                    </div>
                </div>
                <div className="glass-morphism p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10 flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Active</span>
                        <span className="text-4xl font-black text-white">{activeCount}</span>
                        <span className="text-xs text-green-500 font-medium">{activeRate}% active rate</span>
                    </div>
                </div>
                <div className="glass-morphism p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10 flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">On Trial</span>
                        <span className="text-4xl font-black text-white">{trialCount}</span>
                        <span className="text-xs text-indigo-400 font-medium">Trial period active</span>
                    </div>
                </div>
                <div className="glass-morphism p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10 flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Expiring Soon</span>
                        <span className="text-4xl font-black text-white">{expiringCount}</span>
                        <span className="text-xs text-red-500 font-medium">Within 30 days</span>
                    </div>
                </div>
            </div>

            {/* Search + Filter */}
            <div className="flex gap-4 items-center">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-brand transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by name, license, owner or city..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full glass-morphism rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all text-white placeholder:text-gray-600 shadow-inner"
                    />
                </div>
                <div className="flex gap-2">
                    {['all', 'active', 'trial', 'expired'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={cn(
                                "px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border",
                                statusFilter === status
                                    ? "bg-brand/20 text-brand border-brand/30"
                                    : "glass-morphism text-gray-400 hover:text-white border-white/5 hover:border-white/20"
                            )}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="glass-morphism rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/[0.02] border-b border-white/10">
                                <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Pharmacy</th>
                                <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Status</th>
                                <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Subscription Ends</th>
                                <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Location</th>
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
                            ) : filteredPharmacies.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Building2 className="h-10 w-10 text-gray-700" />
                                            <p className="text-gray-400 font-bold">No customers found</p>
                                            <p className="text-gray-600 text-sm">Customers appear here when leads are converted through the pipeline</p>
                                            <button
                                                onClick={() => router.push('/leads')}
                                                className="mt-4 bg-brand text-white px-6 py-3 rounded-2xl font-bold hover:opacity-90 transition-all brand-glow flex items-center gap-2"
                                            >
                                                Go to Leads Pipeline
                                                <ArrowRight className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredPharmacies.map((pharmacy) => (
                                    <tr key={pharmacy.id} className="hover:bg-white/[0.04] transition-all duration-300 group/row border-b border-white/[0.02] last:border-0 cursor-default">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-2xl bg-brand/10 flex items-center justify-center text-brand font-black text-lg brand-glow group-hover/row:scale-110 transition-transform">
                                                    {(pharmacy.name || '?')[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white text-base group-hover/row:text-brand transition-colors">{pharmacy.name}</p>
                                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-0.5">{pharmacy.license_number || 'No License'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className={cn(
                                                "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-tighter backdrop-blur-md border",
                                                pharmacy.subscription_status === 'active' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                                                    pharmacy.subscription_status === 'trial' ? "bg-brand/10 text-brand border-brand/20" :
                                                        pharmacy.subscription_status === 'grace' ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                                                            "bg-red-500/10 text-red-400 border-red-500/20"
                                            )}>
                                                {pharmacy.subscription_status === 'active' ? <CheckCircle2 className="h-3.5 w-3.5" /> :
                                                    pharmacy.subscription_status === 'trial' ? <Clock className="h-3.5 w-3.5" /> :
                                                        <XCircle className="h-3.5 w-3.5" />}
                                                {pharmacy.subscription_status || 'unknown'}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div>
                                                <p className="text-sm font-bold text-gray-200">{pharmacy.subscription_end_date ? formatDate(pharmacy.subscription_end_date) : 'Not Set'}</p>
                                                {pharmacy.subscription_end_date && new Date(pharmacy.subscription_end_date) < new Date() && (
                                                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-1">Expired</p>
                                                )}
                                                {pharmacy.subscription_end_date && new Date(pharmacy.subscription_end_date) > new Date() && new Date(pharmacy.subscription_end_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                                                    <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mt-1">Expiring Soon</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-medium text-gray-400">{[pharmacy.city, pharmacy.state].filter(Boolean).join(', ') || 'N/A'}</p>
                                        </td>
                                        <td className="px-8 py-6 text-right relative">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveMenu(activeMenu === pharmacy.id ? null : pharmacy.id);
                                                }}
                                                className={cn(
                                                    "transition-all p-2 rounded-xl",
                                                    activeMenu === pharmacy.id ? "bg-brand/20 text-brand brand-glow" : "text-gray-500 hover:text-white hover:bg-white/5"
                                                )}
                                            >
                                                <MoreVertical className="h-5 w-5" />
                                            </button>

                                            {activeMenu === pharmacy.id && (
                                                <div className="absolute right-0 top-full mt-2 z-50 min-w-[180px] bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedPharmacy(pharmacy);
                                                            setModalMode('view');
                                                            setActiveMenu(null);
                                                        }}
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-brand/10 text-gray-300 hover:text-brand transition-all text-xs font-black uppercase tracking-widest text-left"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        View Details
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedPharmacy({ ...pharmacy });
                                                            setModalMode('edit');
                                                            setActiveMenu(null);
                                                        }}
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-all text-xs font-black uppercase tracking-widest text-left"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                        Edit Details
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            router.push(`/pharmacies/${pharmacy.id}`);
                                                        }}
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-all text-xs font-black uppercase tracking-widest text-left"
                                                    >
                                                        <ArrowRight className="h-4 w-4" />
                                                        Full Profile
                                                    </button>
                                                    <div className="h-px bg-white/5 my-1 mx-2" />
                                                    {pharmacy.subscription_status === 'active' ? (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedPharmacy(pharmacy);
                                                                setModalMode('deactivate');
                                                                setActiveMenu(null);
                                                            }}
                                                            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-red-500/10 text-gray-500 hover:text-red-500 transition-all text-xs font-black uppercase tracking-widest text-left"
                                                        >
                                                            <Power className="h-4 w-4" />
                                                            Deactivate
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    await supabase.from('pharmacies').update({ subscription_status: 'active' }).eq('id', pharmacy.id);
                                                                    showToast(`${pharmacy.name} reactivated`);
                                                                    setActiveMenu(null);
                                                                    await fetchPharmacies();
                                                                } catch { showToast('Failed to reactivate', 'error'); }
                                                            }}
                                                            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-green-500/10 text-gray-500 hover:text-green-500 transition-all text-xs font-black uppercase tracking-widest text-left"
                                                        >
                                                            <CheckCircle2 className="h-4 w-4" />
                                                            Reactivate
                                                        </button>
                                                    )}
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

            {/* ═══════════ VIEW MODAL ═══════════ */}
            {modalMode === 'view' && selectedPharmacy && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-black/40 animate-in fade-in duration-300">
                    <div className="glass-morphism w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-8 border border-white/10 shadow-2xl relative animate-in zoom-in-95 duration-300">
                        <button onClick={() => { setModalMode(null); setSelectedPharmacy(null); }} className="absolute right-6 top-6 p-2 rounded-xl hover:bg-white/5 text-gray-500 hover:text-white transition-all z-10">
                            <X className="h-6 w-6" />
                        </button>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-16 w-16 rounded-2xl bg-brand/10 flex items-center justify-center text-brand font-black text-2xl brand-glow">
                                {(selectedPharmacy.name || '?')[0]}
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white">{selectedPharmacy.name}</h2>
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Customer Details</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Owner Name</p>
                                    <p className="text-gray-200 font-bold">{selectedPharmacy.owner_name || 'Not Specified'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Status</p>
                                    <p className={cn("font-black uppercase tracking-tighter",
                                        selectedPharmacy.subscription_status === 'active' ? "text-green-500" :
                                        selectedPharmacy.subscription_status === 'trial' ? "text-brand" : "text-red-400"
                                    )}>{selectedPharmacy.subscription_status || 'Unknown'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">License Number</p>
                                    <p className="text-gray-200 font-bold font-mono">{selectedPharmacy.license_number || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">GSTIN</p>
                                    <p className="text-gray-200 font-bold font-mono">{selectedPharmacy.gstin || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Contact</p>
                                    {selectedPharmacy.phone && <a href={`tel:${selectedPharmacy.phone}`} className="text-gray-300 text-sm font-bold hover:text-brand transition-colors flex items-center gap-1.5"><Phone className="h-3 w-3" />{selectedPharmacy.phone}</a>}
                                    {selectedPharmacy.email && <a href={`mailto:${selectedPharmacy.email}`} className="text-gray-400 text-xs hover:text-brand transition-colors flex items-center gap-1.5 mt-1"><Mail className="h-3 w-3" />{selectedPharmacy.email}</a>}
                                    {!selectedPharmacy.phone && !selectedPharmacy.email && <p className="text-gray-600 text-xs">No contact info</p>}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Subscription Ends</p>
                                    <p className="text-gray-200 font-bold">{selectedPharmacy.subscription_end_date ? formatDate(selectedPharmacy.subscription_end_date) : 'Not Set'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Max Machines</p>
                                    <p className="text-gray-200 font-bold">{selectedPharmacy.max_machines || 1}</p>
                                </div>
                            </div>
                            {(selectedPharmacy.address || selectedPharmacy.city) && (
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Address</p>
                                    <p className="text-gray-200 font-bold">{selectedPharmacy.address || ''}</p>
                                    <p className="text-gray-400 text-xs">{[selectedPharmacy.city, selectedPharmacy.state, selectedPharmacy.pincode].filter(Boolean).join(', ')}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 mt-10">
                            <button onClick={() => setModalMode('edit')} className="flex-1 bg-brand text-white py-4 rounded-2xl font-black uppercase tracking-widest brand-glow hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2">
                                <Edit2 className="h-4 w-4" />
                                Edit
                            </button>
                            <button onClick={() => router.push(`/pharmacies/${selectedPharmacy.id}`)} className="flex-1 bg-white/5 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                                Full Profile
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════ EDIT MODAL ═══════════ */}
            {modalMode === 'edit' && selectedPharmacy && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-black/40 animate-in fade-in duration-300">
                    <form onSubmit={handleUpdate} className="glass-morphism w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-8 border border-white/10 shadow-2xl relative animate-in zoom-in-95 duration-300">
                        <button type="button" onClick={() => { setModalMode(null); setSelectedPharmacy(null); }} className="absolute right-6 top-6 p-2 rounded-xl hover:bg-white/5 text-gray-500 hover:text-white transition-all z-10">
                            <X className="h-6 w-6" />
                        </button>

                        <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
                            <Edit2 className="h-6 w-6 text-brand" />
                            Edit Customer
                        </h2>

                        <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Pharmacy Name *</label>
                                    <input type="text" value={selectedPharmacy.name || ''} onChange={(e) => setSelectedPharmacy({ ...selectedPharmacy, name: e.target.value })} className={inputClass} required />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Owner Name</label>
                                    <input type="text" value={selectedPharmacy.owner_name || ''} onChange={(e) => setSelectedPharmacy({ ...selectedPharmacy, owner_name: e.target.value })} className={inputClass} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Phone</label>
                                    <input type="tel" value={selectedPharmacy.phone || ''} onChange={(e) => setSelectedPharmacy({ ...selectedPharmacy, phone: e.target.value })} className={inputClass} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Email</label>
                                    <input type="email" value={selectedPharmacy.email || ''} onChange={(e) => setSelectedPharmacy({ ...selectedPharmacy, email: e.target.value })} className={inputClass} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">License Number</label>
                                    <input type="text" value={selectedPharmacy.license_number || ''} onChange={(e) => setSelectedPharmacy({ ...selectedPharmacy, license_number: e.target.value })} className={cn(inputClass, "font-mono")} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">GSTIN</label>
                                    <input type="text" value={selectedPharmacy.gstin || ''} onChange={(e) => setSelectedPharmacy({ ...selectedPharmacy, gstin: e.target.value })} className={cn(inputClass, "font-mono")} />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Address</label>
                                <input type="text" value={selectedPharmacy.address || ''} onChange={(e) => setSelectedPharmacy({ ...selectedPharmacy, address: e.target.value })} className={inputClass} placeholder="Street address" />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">City</label>
                                    <input type="text" value={selectedPharmacy.city || ''} onChange={(e) => setSelectedPharmacy({ ...selectedPharmacy, city: e.target.value })} className={inputClass} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">State</label>
                                    <input type="text" value={selectedPharmacy.state || ''} onChange={(e) => setSelectedPharmacy({ ...selectedPharmacy, state: e.target.value })} className={inputClass} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Pincode</label>
                                    <input type="text" value={selectedPharmacy.pincode || ''} onChange={(e) => setSelectedPharmacy({ ...selectedPharmacy, pincode: e.target.value })} className={inputClass} />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Status</label>
                                    <select value={selectedPharmacy.subscription_status || 'active'} onChange={(e) => setSelectedPharmacy({ ...selectedPharmacy, subscription_status: e.target.value })} className={cn(inputClass, "bg-[#0f0a2a]")}>
                                        <option value="active">Active</option>
                                        <option value="trial">Trial</option>
                                        <option value="grace">Grace</option>
                                        <option value="expired">Expired</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Subscription End</label>
                                    <input type="date" value={selectedPharmacy.subscription_end_date?.split('T')[0] || ''} onChange={(e) => setSelectedPharmacy({ ...selectedPharmacy, subscription_end_date: e.target.value || null })} className={cn(inputClass, "[color-scheme:dark]")} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Max Machines</label>
                                    <input type="number" min="1" value={selectedPharmacy.max_machines || 1} onChange={(e) => setSelectedPharmacy({ ...selectedPharmacy, max_machines: Number(e.target.value) })} className={inputClass} />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-10">
                            <button type="button" onClick={() => { setModalMode(null); setSelectedPharmacy(null); }} className="flex-1 bg-white/5 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all">Cancel</button>
                            <button type="submit" disabled={saving} className="flex-1 bg-brand text-white py-4 rounded-2xl font-black uppercase tracking-widest brand-glow hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50">
                                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ═══════════ DEACTIVATE CONFIRMATION MODAL ═══════════ */}
            {modalMode === 'deactivate' && selectedPharmacy && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 backdrop-blur-sm bg-black/50 animate-in fade-in duration-200">
                    <div className="glass-morphism w-full max-w-md rounded-3xl p-8 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 rounded-2xl bg-red-500/10">
                                <Power className="h-8 w-8 text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white">Deactivate Customer</h3>
                                <p className="text-gray-400 text-sm">This will suspend their subscription</p>
                            </div>
                        </div>
                        <p className="text-gray-300 mb-8">
                            Are you sure you want to deactivate <span className="font-bold text-white">&quot;{selectedPharmacy.name}&quot;</span>? They will lose access to the software.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => { setModalMode(null); setSelectedPharmacy(null); }} className="flex-1 bg-white/5 text-white py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all text-sm">Cancel</button>
                            <button onClick={handleDeactivateConfirm} disabled={saving} className="flex-1 bg-red-500 text-white py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-red-600 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                                Deactivate
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
