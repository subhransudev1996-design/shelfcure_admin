'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Key,
    Search,
    Filter,
    CheckCircle2,
    XCircle,
    ArrowUpRight,
    Server,
    ShieldCheck,
    X,
    Check,
    Calendar,
    AlertTriangle,
    Plus,
    Copy,
    Cpu,
    Trash2,
    Pencil
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

export default function LicensesPage() {
    const [licenses, setLicenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    
    // Leads State
    const [leads, setLeads] = useState<any[]>([]);
    const [selectedLeadId, setSelectedLeadId] = useState<string>('');
    
    // Generate Form State
    const [newPharmacyName, setNewPharmacyName] = useState('');
    const [newOwnerEmail, setNewOwnerEmail] = useState('');
    const [newPlan, setNewPlan] = useState('standard');
    const [newMaxMachines, setNewMaxMachines] = useState(1);
    const [newExpiryDays, setNewExpiryDays] = useState('365');
    const [generating, setGenerating] = useState(false);

    // Edit State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingLicense, setEditingLicense] = useState<any>(null);
    const [editExpiryDate, setEditExpiryDate] = useState('');

    // Feedback State
    const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    async function fetchLicenses() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('desktop_licenses')
                .select('*')
                .order('created_at', { ascending: false });

            // Ignore failures if the table doesn't exist yet, we just show empty
            if (error) {
                console.warn('Licenses fetch error (Table might missing?):', error);
                setLicenses([]);
            } else {
                setLicenses(data || []);
            }
        } catch (err) {
            console.error('Error fetching licenses:', err);
        } finally {
            setLoading(false);
        }
    }

    async function fetchLeads() {
        try {
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .neq('status', 'closed')
                .order('created_at', { ascending: false });

            if (!error && data) {
                setLeads(data);
            }
        } catch (err) {
            console.error('Error fetching leads:', err);
        }
    }

    useEffect(() => {
        fetchLicenses();
        fetchLeads();
    }, []);

    const generateKeyString = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 1, 0 to avoid confusion
        const randomString = (length: number) => {
            let result = '';
            for (let i = 0; i < length; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        };
        return `SHELF-${randomString(4)}-${randomString(4)}-${randomString(4)}`;
    };

    const handleGenerateLicense = async (e: React.FormEvent) => {
        e.preventDefault();
        setGenerating(true);
        try {
            const licenseKey = generateKeyString();
            
            let expiryDate = null;
            if (newExpiryDays !== 'lifetime') {
                const days = parseInt(newExpiryDays, 10);
                const date = new Date();
                date.setDate(date.getDate() + days);
                expiryDate = date.toISOString().split('T')[0]; // simple YYYY-MM-DD
            }

            let aiCredits = 50;
            if (newExpiryDays === '7' || newExpiryDays === '30') {
                aiCredits = 10;
            }

            const payload = {
                license_key: licenseKey,
                pharmacy_name: newPharmacyName,
                owner_email: newOwnerEmail,
                plan: newPlan,
                max_machines: newMaxMachines,
                expiry_date: expiryDate,
                status: 'active',
                ai_credits: aiCredits
            };

            const { error } = await supabase
                .from('desktop_licenses')
                .insert([payload]);

            if (error) throw error;
            
            if (selectedLeadId) {
                const isTrial = newExpiryDays === '7' || newExpiryDays === '30';
                const newStatus = isTrial ? 'onboarding' : 'closed';
                
                await supabase.from('leads')
                    .update({ status: newStatus })
                    .eq('id', selectedLeadId);
                
                if (!isTrial) {
                    const selectedLead = leads.find(l => l.id === selectedLeadId);
                    if (selectedLead) {
                        try {
                            await supabase.from('pharmacies').insert([{
                                name: payload.pharmacy_name,
                                owner_name: selectedLead.full_name,
                                phone: selectedLead.phone,
                                email: payload.owner_email,
                                subscription_status: 'active',
                                subscription_end_date: payload.expiry_date
                            }]);
                        } catch (e) {
                            console.error('Failed pushing pharmacy subset record:', e);
                        }
                    }
                }
                
                // Refetch leads to remove the converted ones from the dropdown
                await fetchLeads();
            }
            
            await fetchLicenses();
            setShowGenerateModal(false);

            let emailSent = false;
            // Send License Email if an email address is provided
            if (payload.owner_email) {
                try {
                    const res = await fetch('/api/send-license', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: payload.owner_email,
                            pharmacyName: payload.pharmacy_name,
                            licenseKey: payload.license_key,
                            plan: payload.plan,
                            expiryDays: newExpiryDays
                        })
                    });
                    if (res.ok) emailSent = true;
                } catch (e) {
                    console.error('Failed to trigger license email', e);
                }
            }
            
            // Reset form
            setNewPharmacyName('');
            setNewOwnerEmail('');
            setNewPlan('standard');
            setNewMaxMachines(1);
            setNewExpiryDays('365');
            setSelectedLeadId('');

            if (payload.owner_email && emailSent) {
                showToast(`Node Provisioned! Key & Setup successfully sent to ${payload.owner_email}.`, 'success');
            } else if (payload.owner_email && !emailSent) {
                showToast(`Node Provisioned! However, the email failed to send.`, 'error');
            } else {
                showToast(`Node Provisioned successfully!`, 'success');
            }
            
        } catch (err: any) {
            console.error('Failed to generate license:', err);
            showToast(`Failed to provision node: ${err.message}`, 'error');
        } finally {
            setGenerating(false);
        }
    };

    const handleDeleteLicense = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this license? This action cannot be undone.')) return;
        try {
            const { error } = await supabase
                .from('desktop_licenses')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await fetchLicenses();
        } catch (err: any) {
            console.error('Failed to delete license:', err);
            alert('Failed to delete license: ' + err.message);
        }
    };

    const handleUpdateLicense = async (e: React.FormEvent) => {
        e.preventDefault();
        setGenerating(true);
        try {
            const payload = {
                expiry_date: editExpiryDate === '' ? null : editExpiryDate
            };
            const { error } = await supabase
                .from('desktop_licenses')
                .update(payload)
                .eq('id', editingLicense.id);

            if (error) throw error;
            await fetchLicenses();
            setShowEditModal(false);
            setEditingLicense(null);
        } catch (err: any) {
            console.error('Failed to update license:', err);
            alert('Failed to update license: ' + err.message);
        } finally {
            setGenerating(false);
        }
    };

    const openEditModal = (l: any) => {
        setEditingLicense(l);
        setEditExpiryDate(l.expiry_date || '');
        setShowEditModal(true);
    };

    const toggleStatus = async (license: any) => {
        const newStatus = license.status === 'active' ? 'suspended' : 'active';
        try {
            const { error } = await supabase
                .from('desktop_licenses')
                .update({ status: newStatus })
                .eq('id', license.id);

            if (error) throw error;
            await fetchLicenses();
        } catch (err) {
            console.error('Failed to toggle status:', err);
            alert('Failed to update license status.');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('License key copied to clipboard!');
    };

    const filtered = licenses.filter(l =>
        l.pharmacy_name.toLowerCase().includes(search.toLowerCase()) ||
        l.license_key.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-10 max-w-7xl mx-auto space-y-10 animate-fade-in-up">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-4">
                        <div className="p-2 rounded-xl bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                            <Key className="h-8 w-8 text-indigo-500" />
                        </div>
                        License Engine
                    </h1>
                    <p className="text-gray-400 mt-2 text-lg">Hardware activations & subscription nodes</p>
                </div>
                <button 
                    onClick={() => setShowGenerateModal(true)}
                    className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all active:scale-95"
                >
                    <Plus className="h-5 w-5" />
                    Provision Node
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass-morphism p-8 rounded-[2.5rem] hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] transition-all duration-500 group shadow-lg border border-white/5 relative overflow-hidden">
                    <div className="absolute -right-8 -top-8 w-40 h-40 bg-indigo-500/5 blur-[60px] rounded-full group-hover:bg-indigo-500/10 transition-all duration-500" />
                    <p className="text-xs font-black text-white uppercase tracking-widest opacity-70 group-hover:opacity-100 transition-opacity">Active Nodes</p>
                    <div className="flex items-center gap-4 mt-4">
                        <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                            <Server className="h-7 w-7" />
                        </div>
                        <div>
                            <p className="text-4xl font-black text-white">{licenses.filter(l => l.status === 'active').length}</p>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-1">Verified Hardware</p>
                        </div>
                    </div>
                </div>

                <div className="glass-morphism p-8 rounded-[2.5rem] hover:shadow-[0_0_30px_rgba(239,68,68,0.1)] transition-all duration-500 group shadow-lg border border-white/5 relative overflow-hidden">
                    <div className="absolute -right-8 -top-8 w-40 h-40 bg-red-500/5 blur-[60px] rounded-full group-hover:bg-red-500/10 transition-all duration-500" />
                    <p className="text-xs font-black text-white uppercase tracking-widest opacity-70 group-hover:opacity-100 transition-opacity">Suspended / Expired</p>
                    <div className="flex items-center gap-4 mt-4">
                        <div className="p-4 rounded-2xl bg-red-500/10 text-red-500">
                            <AlertTriangle className="h-7 w-7 shadow-[0_0_15px_rgba(239,68,68,0.3)]" />
                        </div>
                        <div>
                            <p className="text-4xl font-black text-white">{licenses.filter(l => l.status !== 'active').length}</p>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-1">Revoked Access</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-4 items-center">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by key, pharmacy name, or client..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full glass-morphism rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-white placeholder:text-gray-600 shadow-inner"
                    />
                </div>
            </div>

            <div className="glass-morphism rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/[0.02] border-b border-white/10">
                                <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-[0.2em]">License Identity</th>
                                <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Status</th>
                                <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Hardware Binding</th>
                                <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Lifecycle</th>
                                <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-[0.2em] text-right">Access</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="h-10 w-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                                            <span className="text-gray-500 font-bold uppercase tracking-[0.2em]">Resolving Keys...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-gray-500">
                                        No activation records found. Deploy the SQL schema if this is unexpected.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((l) => (
                                    <tr key={l.id} className="hover:bg-white/[0.04] transition-all duration-300 group/row border-b border-white/[0.02] last:border-0 cursor-default">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1">
                                                <div className="font-bold text-white text-base flex items-center gap-2 group-hover/row:text-indigo-400 transition-colors">
                                                    {l.pharmacy_name}
                                                    <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-md uppercase tracking-widest text-gray-300">
                                                        {l.plan}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                                                    {l.license_key}
                                                    <button onClick={() => copyToClipboard(l.license_key)} className="hover:text-white transition-colors">
                                                        <Copy className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className={cn(
                                                "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-tighter backdrop-blur-md border",
                                                l.status === 'active' ? "bg-green-500/10 text-green-500 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]" : "bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]"
                                            )}>
                                                <div className={cn("h-1.5 w-1.5 rounded-full",
                                                    l.status === 'active' ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : "bg-red-500 shadow-[0_0_8px_#ef4444]"
                                                )} />
                                                {l.status}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <Cpu className="h-4 w-4 text-gray-500" />
                                                <span className="text-sm font-bold text-gray-300">
                                                    {(l.activated_machines || []).length} / {l.max_machines}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-gray-500" />
                                                <span className="text-sm font-bold text-gray-300">
                                                    {l.expiry_date ? formatDate(l.expiry_date) : <span className="text-indigo-400 uppercase tracking-widest text-[10px]">Lifetime</span>}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(l)}
                                                    className="transition-all p-2 rounded-lg border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10"
                                                    title="Edit Expiry"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteLicense(l.id)}
                                                    className="transition-all p-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10"
                                                    title="Delete License"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => toggleStatus(l)}
                                                    className={cn(
                                                        "transition-all font-black text-[10px] uppercase tracking-widest px-3 py-2 rounded-lg border",
                                                        l.status === 'active' 
                                                            ? "text-red-400 border-red-500/20 hover:bg-red-500/10"
                                                            : "text-green-500 border-green-500/20 hover:bg-green-500/10"
                                                    )}
                                                >
                                                    {l.status === 'active' ? 'Revoke' : 'Activate'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* License Generation Modal */}
            {showGenerateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-black/40 animate-in fade-in duration-300">
                    <div className="glass-morphism w-full max-w-xl rounded-[2.5rem] p-8 border border-white/10 shadow-2xl relative animate-in zoom-in-95 duration-300">
                        <button
                            onClick={() => setShowGenerateModal(false)}
                            className="absolute right-6 top-6 p-2 rounded-xl hover:bg-white/5 text-gray-500 hover:text-white transition-all"
                        >
                            <X className="h-6 w-6" />
                        </button>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-black shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                                <ShieldCheck className="h-8 w-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white">Generate License</h2>
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Offline Infrastructure Provisioning</p>
                            </div>
                        </div>

                        <form onSubmit={handleGenerateLicense} className="space-y-6">
                            <div className="bg-indigo-500/5 border border-indigo-500/10 p-5 rounded-3xl mb-6">
                                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    Link to Prospect (Optional)
                                </label>
                                <select 
                                    value={selectedLeadId}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setSelectedLeadId(val);
                                        if (val) {
                                            const lead = leads.find(l => l.id === val);
                                            if (lead) {
                                                setNewPharmacyName(lead.pharmacy_name || lead.full_name);
                                                setNewOwnerEmail(lead.email || '');
                                            }
                                        } else {
                                            setNewPharmacyName('');
                                            setNewOwnerEmail('');
                                        }
                                    }}
                                    className="w-full bg-[#1e1b4b] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                >
                                    <option value="">-- No Prospect (Direct Provisioning) --</option>
                                    {leads.map(l => (
                                        <option key={l.id} value={l.id}>{l.full_name} {l.pharmacy_name ? `(${l.pharmacy_name})` : ''}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Pharmacy Target Name</label>
                                    <input 
                                        type="text"
                                        required
                                        value={newPharmacyName}
                                        onChange={(e) => setNewPharmacyName(e.target.value)}
                                        placeholder="e.g. Apollo Pharmacy Central"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Owner Email (Optional)</label>
                                    <input 
                                        type="email"
                                        value={newOwnerEmail}
                                        onChange={(e) => setNewOwnerEmail(e.target.value)}
                                        placeholder="owner@pharmacy.com"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Service Plan</label>
                                    <select 
                                        value={newPlan}
                                        onChange={(e) => setNewPlan(e.target.value)}
                                        className="w-full bg-[#1e1b4b] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    >
                                        <option value="standard">Standard Node</option>
                                        <option value="pro">Pro Node</option>
                                        <option value="enterprise">Enterprise Array</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Max Allowed Machines</label>
                                    <input 
                                        type="number"
                                        min="1"
                                        required
                                        value={newMaxMachines}
                                        onChange={(e) => setNewMaxMachines(Number(e.target.value))}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Lifecycle Expiry</label>
                                    <select 
                                        value={newExpiryDays}
                                        onChange={(e) => setNewExpiryDays(e.target.value)}
                                        className="w-full bg-[#1e1b4b] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    >
                                        <option value="7">7 Days (Trial)</option>
                                        <option value="30">30 Days (Demo)</option>
                                        <option value="365">1 Year</option>
                                        <option value="730">2 Years</option>
                                        <option value="lifetime">Lifetime Access</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="flex gap-4 pt-4 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setShowGenerateModal(false)}
                                    className="flex-1 bg-white/5 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={generating}
                                    className="flex-1 bg-indigo-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:bg-indigo-600 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                                >
                                    {generating ? (
                                        <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Check className="h-5 w-5" />
                                            Provision Key
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && editingLicense && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-black/40 animate-in fade-in duration-300">
                    <div className="glass-morphism w-full max-w-sm rounded-[2.5rem] p-8 border border-white/10 shadow-2xl relative animate-in zoom-in-95 duration-300">
                        <button
                            onClick={() => setShowEditModal(false)}
                            className="absolute right-6 top-6 p-2 rounded-xl hover:bg-white/5 text-gray-500 hover:text-white transition-all"
                        >
                            <X className="h-6 w-6" />
                        </button>
                        
                        <div className="mb-8">
                            <h2 className="text-2xl font-black text-white">Edit Timeline</h2>
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-1">{editingLicense.pharmacy_name}</p>
                        </div>

                        <form onSubmit={handleUpdateLicense} className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Expiry Date</label>
                                <input 
                                    type="date"
                                    value={editExpiryDate}
                                    onChange={(e) => setEditExpiryDate(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                />
                                <p className="text-xs text-gray-500 mt-2 font-bold uppercase tracking-wider">Leave empty for lifetime access</p>
                            </div>
                            
                            <div className="flex gap-4 pt-4 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 bg-white/5 text-white py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={generating}
                                    className="flex-1 bg-indigo-500 text-white py-3 rounded-2xl font-black uppercase tracking-widest shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:bg-indigo-600 transition-all disabled:opacity-50 flex justify-center items-center gap-2 text-sm"
                                >
                                    {generating ? (
                                        <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Check className="h-4 w-4" />
                                            Update
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div className={cn(
                    "fixed bottom-6 right-6 z-[200] max-w-sm px-6 py-4 rounded-2xl shadow-2xl font-bold flex items-center gap-3 transition-all animate-in slide-in-from-bottom-5",
                    toast.type === 'success' ? "bg-green-500/20 text-green-400 border border-green-500/30 backdrop-blur-md" : "bg-red-500/20 text-red-400 border border-red-500/30 backdrop-blur-md"
                )}>
                    {toast.type === 'success' ? <CheckCircle2 className="h-6 w-6 flex-shrink-0" /> : <XCircle className="h-6 w-6 flex-shrink-0" />}
                    <p className="text-sm leading-tight">{toast.message}</p>
                </div>
            )}
        </div>
    );
}

