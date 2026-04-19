'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    ArrowLeft,
    Building2,
    Activity,
    Key,
    Clock,
    Phone,
    Mail,
    MapPin,
    AlertTriangle,
    CheckCircle2,
    Target,
    Edit2,
    Power,
    Loader2,
    X,
    Check,
    Plus,
    Download,
    XCircle,
    Copy
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

export default function PharmacyDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [pharmacy, setPharmacy] = useState<any | null>(null);
    const [licenses, setLicenses] = useState<any[]>([]);
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [editData, setEditData] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [addingNote, setAddingNote] = useState(false);

    function showToast(message: string, type: 'success' | 'error' = 'success') {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }

    async function fetchPharmacy() {
        if (!params.id) return;
        try {
            const { data, error } = await supabase
                .from('pharmacies')
                .select('*')
                .eq('id', params.id)
                .single();

            if (error) throw error;
            setPharmacy(data);
        } catch (err) {
            console.error('Error fetching pharmacy:', err);
        } finally {
            setLoading(false);
        }
    }

    async function fetchLicenses() {
        if (!params.id) return;
        try {
            const { data } = await supabase
                .from('licenses')
                .select('*')
                .eq('pharmacy_id', params.id)
                .order('created_at', { ascending: false });
            setLicenses(data || []);
        } catch (err) {
            // Table might not exist yet — that's okay
            console.error('Error fetching licenses:', err);
        }
    }

    async function fetchActivities() {
        if (!params.id) return;
        try {
            // Try pharmacy_activities first, then fall back to nothing
            const { data } = await supabase
                .from('pharmacy_notes')
                .select('*')
                .eq('pharmacy_id', params.id)
                .order('created_at', { ascending: false })
                .limit(20);
            setActivities(data || []);
        } catch {
            setActivities([]);
        }
    }

    useEffect(() => {
        fetchPharmacy();
        fetchLicenses();
        fetchActivities();
    }, [params.id]);

    async function handleUpdatePharmacy(e: React.FormEvent) {
        e.preventDefault();
        if (!editData) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('pharmacies')
                .update({
                    name: editData.name,
                    owner_name: editData.owner_name,
                    license_number: editData.license_number,
                    gstin: editData.gstin,
                    phone: editData.phone,
                    email: editData.email,
                    address: editData.address,
                    city: editData.city,
                    state: editData.state,
                    pincode: editData.pincode,
                    subscription_status: editData.subscription_status,
                    subscription_end_date: editData.subscription_end_date || null,
                    max_machines: Number(editData.max_machines) || 1,
                    account_manager: editData.account_manager
                })
                .eq('id', editData.id);

            if (error) throw error;
            showToast('Customer updated');
            setEditMode(false);
            setEditData(null);
            await fetchPharmacy();
        } catch (err) {
            console.error('Error updating:', err);
            showToast('Failed to update', 'error');
        } finally {
            setSaving(false);
        }
    }

    async function handleAddNote() {
        if (!noteText.trim() || !params.id) return;
        setAddingNote(true);
        try {
            const { error } = await supabase
                .from('pharmacy_notes')
                .insert([{
                    pharmacy_id: params.id,
                    note: noteText.trim(),
                    type: 'note'
                }]);

            if (error) throw error;
            showToast('Note added');
            setNoteText('');
            await fetchActivities();
        } catch (err) {
            console.error('Error adding note:', err);
            showToast('Failed to add note (table may not exist yet)', 'error');
        } finally {
            setAddingNote(false);
        }
    }

    async function handleToggleStatus() {
        if (!pharmacy) return;
        const newStatus = pharmacy.subscription_status === 'active' ? 'expired' : 'active';
        setSaving(true);
        try {
            const { error } = await supabase
                .from('pharmacies')
                .update({ subscription_status: newStatus })
                .eq('id', pharmacy.id);

            if (error) throw error;
            showToast(newStatus === 'active' ? 'Customer reactivated' : 'Customer deactivated');
            await fetchPharmacy();
        } catch (err) {
            showToast('Failed to update status', 'error');
        } finally {
            setSaving(false);
        }
    }

    const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all font-medium placeholder:text-gray-600";

    if (loading) {
        return (
            <div className="p-10 max-w-5xl mx-auto space-y-6">
                <div className="animate-pulse h-10 w-32 bg-white/5 rounded-xl" />
                <div className="animate-pulse h-40 w-full bg-white/5 rounded-3xl" />
                <div className="grid grid-cols-3 gap-6">
                    <div className="animate-pulse h-64 bg-white/5 rounded-3xl col-span-2" />
                    <div className="animate-pulse h-64 bg-white/5 rounded-3xl" />
                </div>
            </div>
        );
    }

    if (!pharmacy) {
        return (
            <div className="p-10 text-center text-gray-500 min-h-[50vh] flex flex-col items-center justify-center">
                <Building2 className="h-16 w-16 text-gray-700 mb-4" />
                <p className="text-xl font-bold text-white mb-2">Customer Not Found</p>
                <p className="text-gray-400 mb-6">This pharmacy record doesn&apos;t exist or has been removed.</p>
                <button onClick={() => router.push('/pharmacies')} className="bg-brand text-white px-6 py-3 rounded-2xl font-bold hover:opacity-90 transition-all">Go Back</button>
            </div>
        );
    }

    const daysLeft = pharmacy.subscription_end_date
        ? Math.ceil((new Date(pharmacy.subscription_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;

    return (
        <div className="p-10 max-w-6xl mx-auto space-y-8 animate-fade-in-up pb-20">
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

            <button
                onClick={() => router.push('/pharmacies')}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-bold uppercase tracking-widest text-xs"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Customers
            </button>

            {/* Header */}
            <div className="glass-morphism rounded-[2.5rem] p-10 border border-white/5 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-brand/5 to-transparent pointer-events-none" />
                <div className="flex gap-8 relative z-10 w-full">
                    <div className="h-24 w-24 rounded-3xl bg-brand/10 flex items-center justify-center text-brand font-black text-4xl brand-glow shrink-0 border border-brand/20">
                        {(pharmacy.name || '?')[0]}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-4xl font-black text-white tracking-tight">{pharmacy.name}</h1>
                                <p className="text-brand font-bold uppercase tracking-[0.2em] text-sm mt-2 flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    {pharmacy.license_number || 'No License'}
                                </p>
                            </div>
                            <div className="text-right flex items-start gap-3">
                                <button
                                    onClick={() => { setEditData({ ...pharmacy }); setEditMode(true); }}
                                    className="bg-white/5 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
                                >
                                    <Edit2 className="h-4 w-4" />
                                    Edit
                                </button>
                                <div className="flex flex-col items-end gap-2">
                                    <div className={cn(
                                        "inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border",
                                        pharmacy.subscription_status === 'active' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                                            pharmacy.subscription_status === 'trial' ? "bg-brand/10 text-brand border-brand/20" :
                                                "bg-red-500/10 text-red-500 border-red-500/20"
                                    )}>
                                        {pharmacy.subscription_status === 'active' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                                        {pharmacy.subscription_status || 'Unknown'}
                                    </div>
                                    {daysLeft !== null && (
                                        <p className={cn("text-xs font-bold uppercase tracking-widest",
                                            daysLeft < 0 ? "text-red-500" : daysLeft < 30 ? "text-yellow-500" : "text-gray-500"
                                        )}>
                                            {daysLeft < 0 ? `Expired ${Math.abs(daysLeft)}d ago` :
                                             daysLeft === 0 ? 'Expires today' :
                                             `${daysLeft}d remaining`}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-8 mt-8 border-t border-white/5 pt-8">
                            <div>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Health Score</p>
                                <div className="flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-indigo-400" />
                                    <span className="text-2xl font-black text-white">{pharmacy.health_score || 100}%</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Max Machines</p>
                                <div className="flex items-center gap-2">
                                    <Key className="h-5 w-5 text-blue-400" />
                                    <span className="text-2xl font-black text-white">{pharmacy.max_machines || 1}</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Account Manager</p>
                                <span className="text-xl font-bold text-gray-200">{pharmacy.account_manager || 'Unassigned'}</span>
                            </div>
                            <div className="ml-auto">
                                <button
                                    onClick={handleToggleStatus}
                                    disabled={saving}
                                    className={cn(
                                        "px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 border disabled:opacity-50",
                                        pharmacy.subscription_status === 'active'
                                            ? "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                                            : "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20"
                                    )}
                                >
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                                    {pharmacy.subscription_status === 'active' ? 'Deactivate' : 'Reactivate'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-8">
                    {/* License Deployments */}
                    <div className="glass-morphism rounded-3xl p-8 border border-white/5">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-white flex items-center gap-3">
                                <Key className="h-6 w-6 text-brand" />
                                Deployed Licenses
                            </h3>
                        </div>
                        {licenses.length > 0 ? (
                            <div className="space-y-3">
                                {licenses.map((lic) => (
                                    <div key={lic.id} className="flex items-center justify-between bg-white/[0.02] rounded-2xl p-4 border border-white/5 group hover:border-white/10 transition-all">
                                        <div className="flex items-center gap-3">
                                            <Key className="h-4 w-4 text-brand" />
                                            <span className="font-mono text-sm font-bold text-gray-200">{lic.license_key}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={cn("text-xs font-bold uppercase", lic.status === 'active' ? "text-green-500" : "text-red-400")}>{lic.status}</span>
                                            {lic.expiry_date && <span className="text-xs text-gray-500">{formatDate(lic.expiry_date)}</span>}
                                            <button
                                                onClick={() => { navigator.clipboard.writeText(lic.license_key); showToast('License key copied'); }}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-white/10"
                                            >
                                                <Copy className="h-3.5 w-3.5 text-gray-400" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-8 text-center text-gray-500">
                                <Key className="h-8 w-8 mx-auto mb-3 opacity-50" />
                                <p className="font-medium text-sm">No licenses deployed yet.</p>
                                <p className="text-xs mt-1">Licenses are created when leads are converted via the pipeline.</p>
                            </div>
                        )}
                    </div>

                    {/* Timeline & Notes */}
                    <div className="glass-morphism rounded-3xl p-8 border border-white/5">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black text-white flex items-center gap-3">
                                <Clock className="h-6 w-6 text-indigo-400" />
                                Notes &amp; Timeline
                            </h3>
                        </div>

                        {/* Add Note */}
                        <div className="flex gap-3 mb-6">
                            <input
                                type="text"
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                placeholder="Add a note about this customer..."
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all placeholder:text-gray-600"
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAddNote()}
                            />
                            <button
                                onClick={handleAddNote}
                                disabled={!noteText.trim() || addingNote}
                                className="bg-brand text-white px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-30 flex items-center gap-2"
                            >
                                {addingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                Add
                            </button>
                        </div>

                        {activities.length > 0 ? (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                {activities.map((a) => (
                                    <div key={a.id} className="flex items-start gap-3 bg-white/[0.02] rounded-xl p-4 border border-white/5">
                                        <div className="p-1.5 rounded-lg bg-indigo-500/10 mt-0.5">
                                            <Clock className="h-3.5 w-3.5 text-indigo-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-200">{a.note || a.description}</p>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">{formatDate(a.created_at)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white/[0.02] rounded-2xl border border-dashed border-white/10 p-8 text-center text-gray-500">
                                <p className="font-medium text-sm">No notes recorded yet.</p>
                                <p className="text-xs mt-1">Add notes above to track interactions with this customer.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column (Sidebar) */}
                <div className="space-y-8">
                    {/* Contact Information */}
                    <div className="glass-morphism rounded-3xl p-8 border border-white/5">
                        <h3 className="text-sm font-black text-white mb-6 uppercase tracking-widest">Contact Info</h3>
                        
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-xl bg-white/5 shrink-0">
                                    <Phone className="h-5 w-5 text-gray-400" />
                                </div>
                                <div className="mt-1">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Phone</p>
                                    {pharmacy.phone ? (
                                        <a href={`tel:${pharmacy.phone}`} className="text-sm font-bold text-gray-200 hover:text-brand transition-colors">{pharmacy.phone}</a>
                                    ) : (
                                        <p className="text-sm font-bold text-gray-600">Not provided</p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-xl bg-white/5 shrink-0">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <div className="mt-1">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Email</p>
                                    {pharmacy.email ? (
                                        <a href={`mailto:${pharmacy.email}`} className="text-sm font-bold text-gray-200 break-all hover:text-brand transition-colors">{pharmacy.email}</a>
                                    ) : (
                                        <p className="text-sm font-bold text-gray-600">Not provided</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-xl bg-white/5 shrink-0">
                                    <MapPin className="h-5 w-5 text-gray-400" />
                                </div>
                                <div className="mt-1">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Address</p>
                                    <p className="text-sm font-bold text-gray-200 leading-relaxed">
                                        {pharmacy.address || 'N/A'}
                                        <br />
                                        {[pharmacy.city, pharmacy.state, pharmacy.pincode].filter(Boolean).join(', ') || ''}
                                    </p>
                                </div>
                            </div>

                            {pharmacy.owner_name && (
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-xl bg-white/5 shrink-0">
                                        <Target className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <div className="mt-1">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Owner</p>
                                        <p className="text-sm font-bold text-gray-200">{pharmacy.owner_name}</p>
                                    </div>
                                </div>
                            )}

                            {pharmacy.gstin && (
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-xl bg-white/5 shrink-0">
                                        <Building2 className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <div className="mt-1">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">GSTIN</p>
                                        <p className="text-sm font-bold text-gray-200 font-mono">{pharmacy.gstin}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Subscription Info */}
                    <div className="glass-morphism rounded-3xl p-8 border border-white/5">
                        <h3 className="text-sm font-black text-white mb-6 uppercase tracking-widest">Subscription</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500 font-bold uppercase">Plan</span>
                                <span className={cn("text-xs font-black uppercase px-2 py-1 rounded-lg",
                                    pharmacy.subscription_status === 'active' ? "bg-green-500/10 text-green-500" :
                                    pharmacy.subscription_status === 'trial' ? "bg-brand/10 text-brand" :
                                    "bg-red-500/10 text-red-400"
                                )}>{pharmacy.subscription_status || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500 font-bold uppercase">Ends</span>
                                <span className="text-sm font-bold text-gray-200">{pharmacy.subscription_end_date ? formatDate(pharmacy.subscription_end_date) : 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500 font-bold uppercase">Machines</span>
                                <span className="text-sm font-bold text-gray-200">{pharmacy.max_machines || 1}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500 font-bold uppercase">Since</span>
                                <span className="text-sm font-bold text-gray-200">{formatDate(pharmacy.created_at)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════ INLINE EDIT MODAL ═══════ */}
            {editMode && editData && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-black/40 animate-in fade-in duration-300">
                    <form onSubmit={handleUpdatePharmacy} className="glass-morphism w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-8 border border-white/10 shadow-2xl relative animate-in zoom-in-95 duration-300">
                        <button type="button" onClick={() => { setEditMode(false); setEditData(null); }} className="absolute right-6 top-6 p-2 rounded-xl hover:bg-white/5 text-gray-500 hover:text-white transition-all z-10">
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
                                    <input type="text" value={editData.name || ''} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className={inputClass} required />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Owner Name</label>
                                    <input type="text" value={editData.owner_name || ''} onChange={(e) => setEditData({ ...editData, owner_name: e.target.value })} className={inputClass} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Phone</label>
                                    <input type="tel" value={editData.phone || ''} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} className={inputClass} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Email</label>
                                    <input type="email" value={editData.email || ''} onChange={(e) => setEditData({ ...editData, email: e.target.value })} className={inputClass} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">License Number</label>
                                    <input type="text" value={editData.license_number || ''} onChange={(e) => setEditData({ ...editData, license_number: e.target.value })} className={cn(inputClass, "font-mono")} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">GSTIN</label>
                                    <input type="text" value={editData.gstin || ''} onChange={(e) => setEditData({ ...editData, gstin: e.target.value })} className={cn(inputClass, "font-mono")} />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Address</label>
                                <input type="text" value={editData.address || ''} onChange={(e) => setEditData({ ...editData, address: e.target.value })} className={inputClass} />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">City</label>
                                    <input type="text" value={editData.city || ''} onChange={(e) => setEditData({ ...editData, city: e.target.value })} className={inputClass} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">State</label>
                                    <input type="text" value={editData.state || ''} onChange={(e) => setEditData({ ...editData, state: e.target.value })} className={inputClass} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Pincode</label>
                                    <input type="text" value={editData.pincode || ''} onChange={(e) => setEditData({ ...editData, pincode: e.target.value })} className={inputClass} />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Status</label>
                                    <select value={editData.subscription_status || 'active'} onChange={(e) => setEditData({ ...editData, subscription_status: e.target.value })} className={cn(inputClass, "bg-[#0f0a2a]")}>
                                        <option value="active">Active</option>
                                        <option value="trial">Trial</option>
                                        <option value="grace">Grace</option>
                                        <option value="expired">Expired</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Subscription End</label>
                                    <input type="date" value={editData.subscription_end_date?.split('T')[0] || ''} onChange={(e) => setEditData({ ...editData, subscription_end_date: e.target.value || null })} className={cn(inputClass, "[color-scheme:dark]")} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Max Machines</label>
                                    <input type="number" min="1" value={editData.max_machines || 1} onChange={(e) => setEditData({ ...editData, max_machines: Number(e.target.value) })} className={inputClass} />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Account Manager</label>
                                <input type="text" value={editData.account_manager || ''} onChange={(e) => setEditData({ ...editData, account_manager: e.target.value })} className={inputClass} placeholder="Assign a team member" />
                            </div>
                        </div>

                        <div className="flex gap-4 mt-10">
                            <button type="button" onClick={() => { setEditMode(false); setEditData(null); }} className="flex-1 bg-white/5 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all">Cancel</button>
                            <button type="submit" disabled={saving} className="flex-1 bg-brand text-white py-4 rounded-2xl font-black uppercase tracking-widest brand-glow hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50">
                                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
