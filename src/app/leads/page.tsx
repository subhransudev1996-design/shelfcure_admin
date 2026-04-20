'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Target,
    Search,
    Filter,
    MoreVertical,
    Phone,
    Mail,
    Building2,
    Clock,
    CheckCircle2,
    XCircle,
    MessageSquare,
    ChevronRight,
    ArrowUpRight,
    X,
    Check,
    UserPlus,
    MapPin,
    Key,
    LayoutGrid,
    List,
    CalendarClock,
    Play,
    Ban,
    Eye,
    Send,
    Calendar
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

// ── Pipeline Stage Config ────────────────────────────────────────────
const PIPELINE_STAGES = [
    { key: 'new', label: 'New', color: 'blue' },
    { key: 'contacted', label: 'Contacted', color: 'purple' },
    { key: 'follow_up', label: 'Follow-up', color: 'orange' },
    { key: 'demo_scheduled', label: 'Demo Scheduled', color: 'pink' },
    { key: 'demo_done', label: 'Demo Done', color: 'indigo' },
    { key: 'trial', label: 'Trial', color: 'cyan' },
    { key: 'won', label: 'Won', color: 'green' },
];

const STAGE_COLORS: Record<string, string> = {
    new: 'bg-blue-500',
    contacted: 'bg-purple-500',
    follow_up: 'bg-orange-500',
    demo_scheduled: 'bg-pink-500',
    demo_done: 'bg-indigo-500',
    trial: 'bg-cyan-500',
    won: 'bg-green-500',
    lost: 'bg-red-500',
};

const STAGE_TEXT_COLORS: Record<string, string> = {
    new: 'text-blue-400',
    contacted: 'text-purple-400',
    follow_up: 'text-orange-400',
    demo_scheduled: 'text-pink-400',
    demo_done: 'text-indigo-400',
    trial: 'text-cyan-400',
    won: 'text-green-400',
    lost: 'text-red-400',
};

const STAGE_BG_COLORS: Record<string, string> = {
    new: 'bg-blue-500/10 border-blue-500/20',
    contacted: 'bg-purple-500/10 border-purple-500/20',
    follow_up: 'bg-orange-500/10 border-orange-500/20',
    demo_scheduled: 'bg-pink-500/10 border-pink-500/20',
    demo_done: 'bg-indigo-500/10 border-indigo-500/20',
    trial: 'bg-cyan-500/10 border-cyan-500/20',
    won: 'bg-green-500/10 border-green-500/20',
    lost: 'bg-red-500/10 border-red-500/20',
};

const LEAD_SOURCES = [
    { value: 'website', label: 'Website' },
    { value: 'referral', label: 'Referral' },
    { value: 'cold_call', label: 'Cold Call' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'social_media', label: 'Social Media' },
    { value: 'existing_customer', label: 'Existing Customer' },
    { value: 'other', label: 'Other' },
];

const LOST_REASONS = [
    'Budget Issue',
    'Using Competitor',
    'Not Interested',
    'Trial Expired',
    'Not Reachable',
    'Other',
];

// ── Helper ───────────────────────────────────────────────────────────
const generateKeyString = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const randomString = (length: number) => {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };
    return `SHELF-${randomString(4)}-${randomString(4)}-${randomString(4)}`;
};

// ═════════════════════════════════════════════════════════════════════
export default function LeadsPage() {
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
    const [selectedLead, setSelectedLead] = useState<any | null>(null);
    const [showLostFilter, setShowLostFilter] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Modal states
    const [modalMode, setModalMode] = useState<'create' | 'view' | 'give_trial' | 'convert_purchase' | 'mark_lost' | null>(null);
    const [leadModalTab, setLeadModalTab] = useState<'overview' | 'activities'>('overview');

    // Activities
    const [activities, setActivities] = useState<any[]>([]);
    const [loadingActivities, setLoadingActivities] = useState(false);

    // Create form
    const [newLead, setNewLead] = useState({
        full_name: '',
        pharmacy_name: '',
        phone: '',
        email: '',
        notes: '',
        source: 'manual'
    });

    // Trial form
    const [trialData, setTrialData] = useState({
        trial_days: '7',
        max_machines: 1
    });

    // Purchase conversion form
    const [conversionData, setConversionData] = useState({
        city: '',
        state: '',
        pincode: '',
        license_number: '',
        gstin: '',
        plan: 'standard',
        max_machines: 1,
        expiry_days: '365'
    });

    // Lost form
    const [lostReason, setLostReason] = useState('Not Interested');
    const [lostNotes, setLostNotes] = useState('');

    // Processing states
    const [processing, setProcessing] = useState(false);
    const [generatedLicense, setGeneratedLicense] = useState<string | null>(null);

    // ── Data Fetching ────────────────────────────────────────────────
    async function fetchLeads() {
        setLoading(true);
        setError(null);
        try {
            const { data, error: supabaseError } = await supabase
                .from('leads')
                .select('*')
                .order('created_at', { ascending: false });

            if (supabaseError) {
                if (supabaseError.code === '42P01') {
                    setError('The "leads" table does not exist. Please run the migration SQL.');
                    setLeads([]);
                } else {
                    throw supabaseError;
                }
            } else {
                setLeads(data || []);
            }
        } catch (err: any) {
            console.error('Error fetching leads:', err?.message || err);
            setError(err?.message || 'Failed to load leads.');
        } finally {
            setLoading(false);
        }
    }

    async function fetchActivities(leadId: string) {
        setLoadingActivities(true);
        try {
            const { data, error } = await supabase
                .from('lead_activities')
                .select('*')
                .eq('lead_id', leadId)
                .order('performed_at', { ascending: false });

            if (error) throw error;
            setActivities(data || []);
        } catch (err) {
            console.error('Error fetching activities:', err);
            setActivities([]);
        } finally {
            setLoadingActivities(false);
        }
    }

    async function logActivity(leadId: string, type: string, description: string) {
        try {
            await supabase.from('lead_activities').insert([{
                lead_id: leadId,
                type,
                description
            }]);
        } catch (err) {
            console.error('Error logging activity:', err);
        }
    }

    useEffect(() => {
        fetchLeads();
    }, []);

    // ── Actions ──────────────────────────────────────────────────────
    const handleCreateLead = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('leads')
                .insert([{ ...newLead, pipeline_stage: 'new', status: 'new' }]);

            if (error) throw error;
            await fetchLeads();
            setModalMode(null);
            setNewLead({ full_name: '', pharmacy_name: '', phone: '', email: '', notes: '', source: 'manual' });
        } catch (err) {
            console.error('Error creating lead:', err);
            alert('Failed to create lead.');
        }
    };

    const handleUpdateStage = async (id: string, newStage: string) => {
        try {
            const { error } = await supabase
                .from('leads')
                .update({ pipeline_stage: newStage })
                .eq('id', id);

            if (error) throw error;
            await logActivity(id, 'system', `Stage changed to "${newStage}"`);
            await fetchLeads();

            if (selectedLead && selectedLead.id === id) {
                setSelectedLead({ ...selectedLead, pipeline_stage: newStage });
            }
        } catch (err) {
            console.error('Error updating stage:', err);
            alert('Failed to update stage.');
        }
    };

    const handleScheduleFollowup = async (id: string, date: string) => {
        const dateValue = date || null;
        try {
            const { error } = await supabase
                .from('leads')
                .update({ next_followup_date: dateValue })
                .eq('id', id);

            if (error) throw error;
            if (dateValue) {
                await logActivity(id, 'system', `Follow-up scheduled for ${dateValue}`);
            }
            await fetchLeads();

            if (selectedLead && selectedLead.id === id) {
                setSelectedLead({ ...selectedLead, next_followup_date: dateValue });
            }
        } catch (err) {
            console.error('Error scheduling follow-up:', err);
            alert('Failed to schedule follow-up.');
        }
    };

    const handleScheduleDemo = async (id: string, date: string) => {
        const dateValue = date || null;
        try {
            const updateData: any = { demo_date: dateValue };
            if (dateValue) updateData.pipeline_stage = 'demo_scheduled';

            const { error } = await supabase
                .from('leads')
                .update(updateData)
                .eq('id', id);

            if (error) throw error;
            if (dateValue) {
                await logActivity(id, 'demo', `Demo scheduled for ${dateValue}`);
            }
            await fetchLeads();

            if (selectedLead && selectedLead.id === id) {
                setSelectedLead({ ...selectedLead, demo_date: dateValue, ...(dateValue ? { pipeline_stage: 'demo_scheduled' } : {}) });
            }
        } catch (err) {
            console.error('Error scheduling demo:', err);
            alert('Failed to schedule demo.');
        }
    };

    const handleGiveTrial = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLead) return;
        setProcessing(true);
        setError(null);
        try {
            const licenseKey = generateKeyString();
            const days = parseInt(trialData.trial_days, 10);
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + days);

            const licensePayload = {
                license_key: licenseKey,
                pharmacy_name: selectedLead.pharmacy_name || selectedLead.full_name,
                owner_email: selectedLead.email,
                plan: 'trial',
                max_machines: trialData.max_machines,
                expiry_date: endDate.toISOString().split('T')[0],
                status: 'active',
                ai_credits: 10
            };

            const { error: licenseError } = await supabase.from('desktop_licenses').insert([licensePayload]);
            if (licenseError) throw licenseError;

            const { error: leadError } = await supabase.from('leads').update({
                pipeline_stage: 'trial',
                trial_start_date: startDate.toISOString().split('T')[0],
                trial_end_date: endDate.toISOString().split('T')[0]
            }).eq('id', selectedLead.id);
            if (leadError) throw leadError;

            await logActivity(selectedLead.id, 'trial_issued', `${days}-day trial issued. Key: ${licenseKey}`);

            setGeneratedLicense(licenseKey);
            await fetchLeads();
        } catch (err: any) {
            console.error('Failed to issue trial:', err);
            setError('Failed to issue trial: ' + (err.message || 'Unknown error'));
        } finally {
            setProcessing(false);
        }
    };

    const handleConvertToPurchase = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLead) return;
        setProcessing(true);
        setError(null);
        try {
            // 1. Create Pharmacy
            const pharmacyPayload = {
                name: selectedLead.pharmacy_name || selectedLead.full_name,
                owner_name: selectedLead.full_name,
                phone: selectedLead.phone,
                email: selectedLead.email,
                city: conversionData.city || selectedLead.city,
                state: conversionData.state || selectedLead.state,
                pincode: conversionData.pincode || selectedLead.pincode,
                license_number: conversionData.license_number,
                gstin: conversionData.gstin,
                subscription_status: 'active',
                subscription_end_date: (() => {
                    if (conversionData.expiry_days === 'lifetime') return null;
                    const date = new Date();
                    date.setDate(date.getDate() + parseInt(conversionData.expiry_days, 10));
                    return date.toISOString().split('T')[0];
                })()
            };

            const { error: pharmacyError } = await supabase.from('pharmacies').insert([pharmacyPayload]);
            if (pharmacyError) throw pharmacyError;

            // 2. Create License
            const licenseKey = generateKeyString();
            let expiryDate = null;
            if (conversionData.expiry_days !== 'lifetime') {
                const days = parseInt(conversionData.expiry_days, 10);
                const date = new Date();
                date.setDate(date.getDate() + days);
                expiryDate = date.toISOString().split('T')[0];
            }

            const licensePayload = {
                license_key: licenseKey,
                pharmacy_name: pharmacyPayload.name,
                owner_email: pharmacyPayload.email,
                plan: conversionData.plan,
                max_machines: conversionData.max_machines,
                expiry_date: expiryDate,
                status: 'active',
                ai_credits: 50
            };

            const { error: licenseError } = await supabase.from('desktop_licenses').insert([licensePayload]);
            if (licenseError) throw licenseError;

            // 3. Update Lead
            const { error: leadError } = await supabase.from('leads').update({
                pipeline_stage: 'won',
                status: 'closed'
            }).eq('id', selectedLead.id);
            if (leadError) throw leadError;

            await logActivity(selectedLead.id, 'purchase', `Converted to customer. Plan: ${conversionData.plan}, Key: ${licenseKey}`);

            // 4. Send License Email
            try {
                let planText = 'Standard License';
                if (conversionData.expiry_days === '365') planText = '1-Year Subscription';
                else if (conversionData.expiry_days === '730') planText = '2-Year Subscription';
                else if (conversionData.expiry_days === 'lifetime') planText = 'Lifetime Access';

                await fetch('/api/send-license', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: pharmacyPayload.email,
                        pharmacyName: pharmacyPayload.name,
                        licenseKey,
                        expiryDays: conversionData.expiry_days,
                        maxMachines: conversionData.max_machines,
                        plan: planText
                    })
                });
            } catch (emailErr) {
                console.error('Email failed (non-critical):', emailErr);
            }

            setGeneratedLicense(licenseKey);
            await fetchLeads();
        } catch (err: any) {
            console.error('Failed to convert lead:', err);
            setError('Failed to convert: ' + (err.message || 'Unknown error'));
        } finally {
            setProcessing(false);
        }
    };

    const handleMarkLost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLead) return;
        setProcessing(true);
        try {
            const { error } = await supabase.from('leads').update({
                pipeline_stage: 'lost',
                lost_reason: lostReason,
                notes: selectedLead.notes ? `${selectedLead.notes}\n\nLost: ${lostNotes}` : `Lost: ${lostNotes}`
            }).eq('id', selectedLead.id);

            if (error) throw error;
            await logActivity(selectedLead.id, 'lost', `Marked as lost. Reason: ${lostReason}. ${lostNotes}`);
            await fetchLeads();
            setModalMode(null);
            setSelectedLead(null);
            setLostReason('Not Interested');
            setLostNotes('');
        } catch (err) {
            console.error('Error marking lost:', err);
            alert('Failed to mark as lost.');
        } finally {
            setProcessing(false);
        }
    };

    // ── Computed data ────────────────────────────────────────────────
    const getStage = (lead: any) => lead.pipeline_stage || lead.status || 'new';

    const filtered = leads.filter(l => {
        const matchesSearch =
            l.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            l.pharmacy_name?.toLowerCase().includes(search.toLowerCase()) ||
            l.email?.toLowerCase().includes(search.toLowerCase());

        if (!showLostFilter && getStage(l) === 'lost') return false;
        return matchesSearch;
    });

    const stats = {
        total: leads.filter(l => getStage(l) !== 'lost').length,
        newLeads: leads.filter(l => getStage(l) === 'new').length,
        inDemo: leads.filter(l => ['demo_scheduled', 'demo_done'].includes(getStage(l))).length,
        activeTrials: leads.filter(l => getStage(l) === 'trial').length,
        won: leads.filter(l => getStage(l) === 'won').length,
        lost: leads.filter(l => getStage(l) === 'lost').length,
    };

    // ── Render ───────────────────────────────────────────────────────
    return (
        <div className="p-10 max-w-7xl mx-auto space-y-10 animate-fade-in-up">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-4">
                        <div className="p-2 rounded-xl bg-brand/10 brand-glow">
                            <Target className="h-8 w-8 text-brand" />
                        </div>
                        Leads
                    </h1>
                    <p className="text-gray-400 mt-2 text-lg">Manage your product sales pipeline</p>
                </div>
                <button
                    onClick={() => setModalMode('create')}
                    className="bg-brand text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest brand-glow hover:opacity-90 transition-all active:scale-95 flex items-center gap-3"
                >
                    <UserPlus className="h-5 w-5" />
                    Add New Lead
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
                {[
                    { label: 'Total Leads', value: stats.total, color: 'brand', icon: Target },
                    { label: 'New Leads', value: stats.newLeads, color: 'blue', icon: Clock },
                    { label: 'Demo Stage', value: stats.inDemo, color: 'pink', icon: Play },
                    { label: 'Active Trials', value: stats.activeTrials, color: 'cyan', icon: Eye },
                    { label: 'Won', value: stats.won, color: 'green', icon: CheckCircle2 },
                ].map((stat, i) => (
                    <div key={i} className="glass-morphism p-5 rounded-3xl border border-white/5 relative overflow-hidden group">
                        <div className={`absolute -right-4 -top-4 w-20 h-20 bg-${stat.color}-500/5 blur-3xl rounded-full group-hover:bg-${stat.color}-500/10 transition-all`} />
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{stat.label}</p>
                        <div className="flex items-center justify-between">
                            <p className="text-3xl font-black text-white">{stat.value}</p>
                            <stat.icon className={`h-5 w-5 text-${stat.color}-500 opacity-20 group-hover:opacity-100 transition-opacity`} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Error */}
            {error && (
                <div className="glass-morphism p-6 rounded-[2rem] border border-red-500/20 bg-red-500/5 flex items-start gap-4">
                    <XCircle className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-white">Error</p>
                        <p className="text-sm text-gray-400 mt-1">{error}</p>
                        <button onClick={() => fetchLeads()} className="mt-3 text-xs font-black uppercase tracking-widest text-brand hover:underline">
                            Retry
                        </button>
                    </div>
                </div>
            )}

            {/* Search + Controls */}
            <div className="flex gap-4 items-center">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-brand transition-colors" />
                    <input
                        type="text"
                        placeholder="Search leads by name, pharmacy, or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full glass-morphism rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all text-white placeholder:text-gray-600 shadow-inner"
                    />
                </div>
                <div className="glass-morphism p-2 rounded-2xl flex items-center gap-1 border border-white/5">
                    <button
                        onClick={() => setViewMode('list')}
                        className={cn("p-3 rounded-xl transition-all", viewMode === 'list' ? "bg-brand text-white shadow-lg" : "text-gray-500 hover:text-white")}
                    >
                        <List className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('board')}
                        className={cn("p-3 rounded-xl transition-all", viewMode === 'board' ? "bg-brand text-white shadow-lg" : "text-gray-500 hover:text-white")}
                    >
                        <LayoutGrid className="h-5 w-5" />
                    </button>
                </div>
                <button
                    onClick={() => setShowLostFilter(!showLostFilter)}
                    className={cn(
                        "glass-morphism px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
                        showLostFilter ? "text-red-400 border border-red-500/30 bg-red-500/5" : "text-gray-500 hover:text-white"
                    )}
                >
                    <Ban className="h-4 w-4 inline mr-2" />
                    Lost ({stats.lost})
                </button>
            </div>

            {/* ────────────── LIST VIEW ─────────────── */}
            {viewMode === 'list' ? (
                <div className="glass-morphism rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/[0.02] border-b border-white/10">
                                    <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Contact</th>
                                    <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Pharmacy</th>
                                    <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Stage</th>
                                    <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Source</th>
                                    <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Follow-up</th>
                                    <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-[0.2em] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="h-10 w-10 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
                                                <span className="text-gray-500 font-bold uppercase tracking-widest text-sm">Loading leads...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="p-4 rounded-full bg-white/5">
                                                    <Target className="h-12 w-12 text-gray-700" />
                                                </div>
                                                <p className="text-gray-500 font-bold max-w-xs">No leads found. Add your first lead to get started.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((lead) => {
                                        const stage = getStage(lead);
                                        return (
                                            <tr key={lead.id} className="hover:bg-white/[0.04] transition-all duration-300 group/row cursor-default">
                                                <td className="px-8 py-5 text-white font-bold">
                                                    <div className="flex flex-col">
                                                        <span>{lead.full_name}</span>
                                                        <span className="text-[10px] text-gray-500 font-medium">{lead.phone || lead.email || ''}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-gray-300">{lead.pharmacy_name || '—'}</td>
                                                <td className="px-8 py-5">
                                                    <span className={cn(
                                                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                                        STAGE_BG_COLORS[stage] || 'bg-gray-500/10 border-gray-500/20',
                                                        STAGE_TEXT_COLORS[stage] || 'text-gray-400'
                                                    )}>
                                                        {stage.replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-gray-400 text-xs capitalize">{lead.source || '—'}</td>
                                                <td className="px-8 py-5">
                                                    {lead.next_followup_date ? (
                                                        <span className={cn(
                                                            "text-xs font-bold",
                                                            new Date(lead.next_followup_date) < new Date() ? "text-red-400" : "text-brand"
                                                        )}>
                                                            {formatDate(lead.next_followup_date)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-600 text-xs">—</span>
                                                    )}
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedLead(lead);
                                                            setModalMode('view');
                                                            setLeadModalTab('overview');
                                                            fetchActivities(lead.id);
                                                        }}
                                                        className="p-2 hover:bg-brand/10 rounded-xl transition-all group/btn"
                                                    >
                                                        <ChevronRight className="h-5 w-5 text-gray-500 group-hover/btn:text-brand" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* ────────────── BOARD VIEW ─────────────── */
                <div className="flex gap-5 overflow-x-auto pb-8 snap-x min-h-[600px] items-start">
                    {PIPELINE_STAGES.map(({ key: stage, label, color }) => {
                        const stageLeads = filtered.filter(l => getStage(l) === stage);
                        const colorClass = STAGE_COLORS[stage] || 'bg-gray-500';

                        return (
                            <div key={stage} className="min-w-[300px] max-w-[300px] glass-morphism rounded-3xl flex flex-col snap-start overflow-hidden border border-white/5">
                                <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                    <h3 className="font-black text-white uppercase tracking-widest text-xs flex items-center gap-2">
                                        <div className={cn("w-2 h-2 rounded-full", colorClass)} />
                                        {label}
                                    </h3>
                                    <span className="bg-white/10 text-gray-400 text-xs font-bold px-2 py-1 rounded-lg">{stageLeads.length}</span>
                                </div>
                                <div className="p-4 flex flex-col gap-3 overflow-y-auto max-h-[650px] custom-scrollbar">
                                    {stageLeads.map(lead => (
                                        <div
                                            key={lead.id}
                                            onClick={() => {
                                                setSelectedLead(lead);
                                                setModalMode('view');
                                                setLeadModalTab('overview');
                                                fetchActivities(lead.id);
                                            }}
                                            className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 cursor-pointer hover:bg-white/[0.08] hover:border-white/20 transition-all group shadow-lg flex flex-col gap-2"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-bold text-white text-base leading-tight mb-0.5">{lead.full_name}</h4>
                                                    <p className="text-[10px] font-medium text-brand truncate max-w-[200px] uppercase tracking-widest">{lead.pharmacy_name}</p>
                                                </div>
                                            </div>

                                            {lead.lead_temperature && (
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border self-start",
                                                    lead.lead_temperature === 'hot' ? "bg-red-500/10 border-red-500/20 text-red-500" :
                                                    lead.lead_temperature === 'warm' ? "bg-orange-500/10 border-orange-500/20 text-orange-500" :
                                                    "bg-blue-500/10 border-blue-500/20 text-blue-500"
                                                )}>
                                                    {lead.lead_temperature}
                                                </span>
                                            )}

                                            <div className="flex items-center gap-3 text-gray-500 text-xs">
                                                {lead.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</span>}
                                            </div>

                                            {lead.next_followup_date && (
                                                <div className="mt-1 pt-2 border-t border-white/5 flex items-center justify-between">
                                                    <span className="text-[10px] uppercase font-black tracking-widest text-gray-600">Follow-up</span>
                                                    <span className={cn("text-xs font-bold", new Date(lead.next_followup_date) < new Date() ? "text-red-400" : "text-brand")}>
                                                        {new Date(lead.next_followup_date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {stageLeads.length === 0 && (
                                        <div className="text-center py-6 border border-dashed border-white/10 rounded-2xl">
                                            <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">No Leads</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ════════════════ CREATE LEAD MODAL ════════════════ */}
            {modalMode === 'create' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-black/40 animate-in fade-in duration-300">
                    <form onSubmit={handleCreateLead} className="glass-morphism w-full max-w-lg rounded-[2.5rem] p-8 border border-white/10 shadow-2xl relative animate-in zoom-in-95 duration-300">
                        <button type="button" onClick={() => setModalMode(null)} className="absolute right-6 top-6 p-2 rounded-xl hover:bg-white/5 text-gray-500 hover:text-white transition-all">
                            <X className="h-6 w-6" />
                        </button>

                        <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
                            <UserPlus className="h-6 w-6 text-brand" />
                            Create Lead
                        </h2>

                        <div className="space-y-5">
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Full Name</label>
                                <input
                                    type="text"
                                    value={newLead.full_name}
                                    onChange={(e) => setNewLead({ ...newLead, full_name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all font-medium"
                                    placeholder="e.g., Dr. Sameer Khan"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Pharmacy Name</label>
                                <input
                                    type="text"
                                    value={newLead.pharmacy_name}
                                    onChange={(e) => setNewLead({ ...newLead, pharmacy_name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all font-medium"
                                    placeholder="e.g., Al-Madina Healthcare"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Phone</label>
                                    <input
                                        type="tel"
                                        value={newLead.phone}
                                        onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all font-medium"
                                        placeholder="+91..."
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Email</label>
                                    <input
                                        type="email"
                                        value={newLead.email}
                                        onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all font-medium"
                                        placeholder="contact@pharmacy.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Lead Source</label>
                                <select
                                    value={newLead.source}
                                    onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                                    className="w-full bg-[#0f0a2a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all font-medium"
                                >
                                    <option value="manual">Manual Entry</option>
                                    {LEAD_SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Notes</label>
                                <textarea
                                    value={newLead.notes}
                                    onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all font-medium resize-none"
                                    placeholder="Any initial notes..."
                                    rows={2}
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button type="button" onClick={() => setModalMode(null)} className="flex-1 bg-white/5 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                                Cancel
                            </button>
                            <button type="submit" className="flex-1 bg-brand text-white py-4 rounded-2xl font-black uppercase tracking-widest brand-glow hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2">
                                <Check className="h-5 w-5" />
                                Save Lead
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ════════════════ VIEW LEAD MODAL ════════════════ */}
            {modalMode === 'view' && selectedLead && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-black/40 animate-in fade-in duration-300">
                    <div className="glass-morphism w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-[2.5rem] flex flex-col border border-white/10 shadow-2xl relative animate-in zoom-in-95 duration-300">
                        <button onClick={() => { setModalMode(null); setSelectedLead(null); }} className="absolute right-6 top-6 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all z-10">
                            <X className="h-5 w-5" />
                        </button>

                        {/* Header */}
                        <div className="p-8 pb-0 shrink-0">
                            <div className="flex items-start gap-6 mb-6">
                                <div className="h-16 w-16 rounded-2xl bg-brand/10 flex items-center justify-center brand-glow">
                                    <Target className="h-8 w-8 text-brand" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-3xl font-black text-white">{selectedLead.full_name}</h2>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                            STAGE_BG_COLORS[getStage(selectedLead)] || 'bg-gray-500/10 border-gray-500/20',
                                            STAGE_TEXT_COLORS[getStage(selectedLead)] || 'text-gray-400'
                                        )}>
                                            {getStage(selectedLead).replace(/_/g, ' ')}
                                        </span>
                                        {selectedLead.lead_temperature && (
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest",
                                                selectedLead.lead_temperature === 'hot' ? "bg-red-500/10 text-red-500" :
                                                selectedLead.lead_temperature === 'warm' ? "bg-orange-500/10 text-orange-500" :
                                                "bg-blue-500/10 text-blue-500"
                                            )}>
                                                {selectedLead.lead_temperature}
                                            </span>
                                        )}
                                        <span className="text-[10px] text-gray-500 uppercase tracking-widest">via {selectedLead.source || 'manual'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex items-center gap-6 border-b border-white/10">
                                <button onClick={() => setLeadModalTab('overview')} className={cn("px-4 py-4 text-xs font-black uppercase tracking-widest transition-all", leadModalTab === 'overview' ? "text-brand border-b-2 border-brand" : "text-gray-500 hover:text-gray-300")}>
                                    Overview
                                </button>
                                <button onClick={() => setLeadModalTab('activities')} className={cn("px-4 py-4 text-xs font-black uppercase tracking-widest transition-all", leadModalTab === 'activities' ? "text-brand border-b-2 border-brand" : "text-gray-500 hover:text-gray-300")}>
                                    Activity Log
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                            {leadModalTab === 'overview' ? (
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-5">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Pharmacy</p>
                                            <div className="flex items-center gap-3 text-white bg-white/5 p-4 rounded-2xl border border-white/5">
                                                <Building2 className="h-5 w-5 text-brand" />
                                                <span className="font-bold">{selectedLead.pharmacy_name || 'Not Specified'}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Contact Info</p>
                                            <div className="space-y-2 bg-white/5 p-4 rounded-2xl border border-white/5">
                                                <div className="flex items-center gap-3 text-white/70">
                                                    <Phone className="h-4 w-4 text-brand/70" />
                                                    <span className="text-sm font-medium">{selectedLead.phone || 'No Phone'}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-white/70">
                                                    <Mail className="h-4 w-4 text-brand/70" />
                                                    <span className="text-sm font-medium">{selectedLead.email || 'No Email'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Created</p>
                                            <div className="flex items-center gap-3 text-white/50 bg-white/5 p-4 rounded-2xl border border-white/5">
                                                <Clock className="h-4 w-4" />
                                                <span className="text-xs font-medium">{formatDate(selectedLead.created_at)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-5">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Notes</p>
                                            <div className="flex items-start gap-3 text-white bg-white/5 p-4 rounded-2xl border border-white/5 min-h-[120px]">
                                                <MessageSquare className="h-5 w-5 text-brand shrink-0 mt-0.5" />
                                                <span className="text-sm leading-relaxed italic">{selectedLead.notes || 'No notes yet.'}</span>
                                            </div>
                                        </div>
                                        {selectedLead.demo_date && (
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Demo Date</p>
                                                <div className="flex items-center gap-3 text-white bg-white/5 p-4 rounded-2xl border border-white/5">
                                                    <Play className="h-4 w-4 text-pink-400" />
                                                    <span className="font-bold">{formatDate(selectedLead.demo_date)}</span>
                                                </div>
                                            </div>
                                        )}
                                        {selectedLead.trial_end_date && (
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Trial Period</p>
                                                <div className="flex items-center gap-3 text-white bg-white/5 p-4 rounded-2xl border border-white/5">
                                                    <Eye className="h-4 w-4 text-cyan-400" />
                                                    <span className="font-bold text-sm">{formatDate(selectedLead.trial_start_date)} — {formatDate(selectedLead.trial_end_date)}</span>
                                                </div>
                                            </div>
                                        )}
                                        {selectedLead.lost_reason && (
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Lost Reason</p>
                                                <div className="flex items-center gap-3 text-red-400 bg-red-500/5 p-4 rounded-2xl border border-red-500/10">
                                                    <Ban className="h-4 w-4" />
                                                    <span className="font-bold">{selectedLead.lost_reason}</span>
                                                </div>
                                            </div>
                                        )}
                                        {selectedLead.value_estimate && (
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Estimated Value</p>
                                                <div className="flex items-center gap-3 text-white bg-white/5 p-4 rounded-2xl border border-white/5">
                                                    <span className="font-bold text-green-400">₹{selectedLead.value_estimate}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                /* Activity Tab */
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-white text-lg">Activity Timeline</h3>
                                    </div>
                                    {loadingActivities ? (
                                        <div className="flex justify-center py-10">
                                            <div className="h-8 w-8 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
                                        </div>
                                    ) : activities.length === 0 ? (
                                        <div className="border-l-2 border-white/10 ml-4 space-y-8 pb-8">
                                            <div className="relative pl-6">
                                                <div className="absolute -left-[11px] top-1 bg-black p-1 rounded-full border border-white/20">
                                                    <MessageSquare className="h-3 w-3 text-brand" />
                                                </div>
                                                <p className="text-sm text-gray-400">No activities logged yet.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="border-l-2 border-white/10 ml-4 space-y-6 pb-8">
                                            {activities.map((act: any) => {
                                                const iconMap: Record<string, any> = {
                                                    call: Phone, email: Mail, whatsapp: MessageSquare,
                                                    demo: Play, trial_issued: Eye, purchase: CheckCircle2,
                                                    lost: Ban, system: Clock, note: MessageSquare, meeting: Calendar
                                                };
                                                const IconComp = iconMap[act.type] || MessageSquare;
                                                return (
                                                    <div key={act.id} className="relative pl-6">
                                                        <div className="absolute -left-[11px] top-1 bg-black p-1 rounded-full border border-white/20">
                                                            <IconComp className="h-3 w-3 text-brand" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-white font-medium">{act.description}</p>
                                                            <p className="text-[10px] text-gray-500 mt-1">{formatDate(act.performed_at)} · {act.type}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* ── Action Bar ── */}
                        <div className="p-6 border-t border-white/5 shrink-0 bg-black/20">
                            {getStage(selectedLead) === 'won' || getStage(selectedLead) === 'lost' ? (
                                <div className="flex gap-3">
                                    <button onClick={() => { setModalMode(null); setSelectedLead(null); }} className="flex-1 bg-white/5 text-white py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all text-sm text-center">
                                        Close
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {/* Stage Selector */}
                                    <select
                                        className="bg-white/5 border border-white/10 text-white px-3 py-3 rounded-2xl font-bold uppercase tracking-widest outline-none hover:bg-white/10 transition-all cursor-pointer appearance-none text-center text-[10px]"
                                        value={getStage(selectedLead)}
                                        onChange={(e) => handleUpdateStage(selectedLead.id, e.target.value)}
                                    >
                                        {PIPELINE_STAGES.map(s => (
                                            <option key={s.key} value={s.key} className="text-black">{s.label}</option>
                                        ))}
                                    </select>

                                    {/* Schedule Follow-up */}
                                    <div className="flex items-center bg-brand/5 rounded-2xl border border-brand/20 px-4 py-2.5 hover:border-brand/50 transition-all group cursor-pointer">
                                        <CalendarClock className="h-5 w-5 text-brand/60 group-hover:text-brand transition-colors mr-3 shrink-0" />
                                        <div className="flex flex-col w-full overflow-hidden">
                                            <label className="text-[8px] font-black uppercase tracking-widest text-brand/60 truncate">Follow-up Date</label>
                                            <input
                                                type="date"
                                                className="bg-transparent text-white outline-none text-xs font-bold w-full cursor-pointer [color-scheme:dark]"
                                                value={selectedLead.next_followup_date?.split('T')[0] || ''}
                                                onChange={(e) => handleScheduleFollowup(selectedLead.id, e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Schedule Demo */}
                                    <div className="flex items-center bg-pink-500/5 rounded-2xl border border-pink-500/20 px-4 py-2.5 hover:border-pink-500/50 transition-all group cursor-pointer">
                                        <Play className="h-5 w-5 text-pink-400/60 group-hover:text-pink-400 transition-colors mr-3 shrink-0" />
                                        <div className="flex flex-col w-full overflow-hidden">
                                            <label className="text-[8px] font-black uppercase tracking-widest text-pink-400/60 truncate">Demo Date</label>
                                            <input
                                                type="date"
                                                className="bg-transparent text-white outline-none text-xs font-bold w-full cursor-pointer [color-scheme:dark]"
                                                value={selectedLead.demo_date?.split('T')[0] || ''}
                                                onChange={(e) => handleScheduleDemo(selectedLead.id, e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Mark Lost */}
                                    <button
                                        onClick={() => setModalMode('mark_lost')}
                                        className="bg-red-500/10 text-red-400 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-500/20 transition-all flex items-center justify-center gap-2 border border-red-500/20"
                                    >
                                        <Ban className="h-4 w-4" />
                                        Lost
                                    </button>

                                    {/* Give Trial — visible for follow_up, demo_done, demo_scheduled */}
                                    {['follow_up', 'demo_done', 'demo_scheduled', 'contacted'].includes(getStage(selectedLead)) && (
                                        <button
                                            onClick={() => { setModalMode('give_trial'); setGeneratedLicense(null); }}
                                            className="bg-cyan-500/10 text-cyan-400 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-cyan-500/20 transition-all flex items-center justify-center gap-2 border border-cyan-500/20 col-span-2"
                                        >
                                            <Eye className="h-4 w-4" />
                                            Give Trial
                                        </button>
                                    )}

                                    {/* Convert to Purchase — visible for trial, demo_done */}
                                    {['trial', 'demo_done'].includes(getStage(selectedLead)) && (
                                        <button
                                            onClick={() => { setModalMode('convert_purchase'); setGeneratedLicense(null); }}
                                            className="bg-green-500/10 text-green-400 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-green-500/20 transition-all flex items-center justify-center gap-2 border border-green-500/20 col-span-2"
                                        >
                                            <CheckCircle2 className="h-4 w-4" />
                                            Convert to Purchase
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════ GIVE TRIAL MODAL ════════════════ */}
            {modalMode === 'give_trial' && selectedLead && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-black/40 animate-in fade-in duration-300">
                    <div className="glass-morphism w-full max-w-lg rounded-[2.5rem] p-8 border border-white/10 shadow-2xl relative animate-in zoom-in-95 duration-300">
                        {generatedLicense ? (
                            <div className="text-center py-8">
                                <div className="h-20 w-20 mx-auto rounded-[2rem] bg-cyan-500/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                                    <CheckCircle2 className="h-10 w-10 text-cyan-500" />
                                </div>
                                <h2 className="text-3xl font-black text-white mb-2">Trial Issued!</h2>
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-8">{trialData.trial_days}-Day Trial License</p>

                                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl inline-block max-w-md w-full mb-8">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Trial License Key</p>
                                    <div className="flex items-center justify-center gap-4 bg-black/50 p-4 rounded-2xl">
                                        <Key className="h-5 w-5 text-cyan-500" />
                                        <code className="text-xl font-mono font-black text-white">{generatedLicense}</code>
                                    </div>
                                </div>

                                <button
                                    onClick={() => { setModalMode('view'); setGeneratedLicense(null); fetchActivities(selectedLead.id); }}
                                    className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95"
                                >
                                    Back to Lead
                                </button>
                            </div>
                        ) : (
                            <>
                                <button onClick={() => setModalMode('view')} className="absolute right-6 top-6 p-2 rounded-xl hover:bg-white/5 text-gray-500 hover:text-white transition-all">
                                    <X className="h-6 w-6" />
                                </button>

                                <div className="flex items-center gap-4 mb-8">
                                    <div className="h-14 w-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                                        <Eye className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-white">Give Trial</h2>
                                        <p className="text-gray-400 text-sm">Issue a trial license to <b className="text-white">{selectedLead.full_name}</b></p>
                                    </div>
                                </div>

                                <form onSubmit={handleGiveTrial} className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Trial Duration</label>
                                        <select
                                            value={trialData.trial_days}
                                            onChange={(e) => setTrialData({ ...trialData, trial_days: e.target.value })}
                                            className="w-full bg-[#0f0a2a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                                        >
                                            <option value="7">7 Days</option>
                                            <option value="15">15 Days</option>
                                            <option value="30">30 Days</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Max Machines</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={trialData.max_machines}
                                            onChange={(e) => setTrialData({ ...trialData, max_machines: Number(e.target.value) })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                                        />
                                    </div>

                                    {error && <p className="text-red-400 text-sm">{error}</p>}

                                    <div className="flex gap-4 pt-4">
                                        <button type="button" onClick={() => setModalMode('view')} className="flex-1 bg-white/5 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                                            Back
                                        </button>
                                        <button type="submit" disabled={processing} className="flex-1 bg-cyan-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-cyan-600 transition-all disabled:opacity-50 flex justify-center items-center gap-2">
                                            {processing ? <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><Eye className="h-5 w-5" />Issue Trial</>}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ════════════════ CONVERT TO PURCHASE MODAL ════════════════ */}
            {modalMode === 'convert_purchase' && selectedLead && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-black/40 animate-in fade-in duration-300">
                    <div className="glass-morphism w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-8 border border-white/10 shadow-2xl relative animate-in zoom-in-95 duration-300">
                        {generatedLicense ? (
                            <div className="text-center py-8">
                                <div className="h-20 w-20 mx-auto rounded-[2rem] bg-green-500/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                                    <CheckCircle2 className="h-10 w-10 text-green-500" />
                                </div>
                                <h2 className="text-3xl font-black text-white mb-2">Purchase Complete!</h2>
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-8">Customer Created & License Issued</p>

                                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl inline-block max-w-md w-full mb-8">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">License Key</p>
                                    <div className="flex items-center justify-center gap-4 bg-black/50 p-4 rounded-2xl">
                                        <Key className="h-5 w-5 text-green-500" />
                                        <code className="text-xl font-mono font-black text-white">{generatedLicense}</code>
                                    </div>
                                </div>

                                <button
                                    onClick={() => { setModalMode(null); setSelectedLead(null); setGeneratedLicense(null); }}
                                    className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95"
                                >
                                    Close & Return
                                </button>
                            </div>
                        ) : (
                            <>
                                <button onClick={() => setModalMode('view')} className="absolute right-6 top-6 p-2 rounded-xl hover:bg-white/5 text-gray-500 hover:text-white transition-all">
                                    <X className="h-6 w-6" />
                                </button>

                                <div className="flex items-center gap-4 mb-8">
                                    <div className="h-14 w-14 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-400">
                                        <ArrowUpRight className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-white">Convert to Purchase</h2>
                                        <p className="text-gray-400 text-sm">Create customer & issue license for <b className="text-white">{selectedLead.pharmacy_name || selectedLead.full_name}</b></p>
                                    </div>
                                </div>

                                <form onSubmit={handleConvertToPurchase} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Store License Number</label>
                                            <input
                                                type="text" required
                                                value={conversionData.license_number}
                                                onChange={(e) => setConversionData({ ...conversionData, license_number: e.target.value })}
                                                placeholder="e.g. DL-12345"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">GSTIN (Optional)</label>
                                            <input
                                                type="text"
                                                value={conversionData.gstin}
                                                onChange={(e) => setConversionData({ ...conversionData, gstin: e.target.value })}
                                                placeholder="e.g. 27AADCB2230M1Z2"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">City</label>
                                            <input
                                                type="text" required
                                                value={conversionData.city}
                                                onChange={(e) => setConversionData({ ...conversionData, city: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">State</label>
                                                <input
                                                    type="text" required
                                                    value={conversionData.state}
                                                    onChange={(e) => setConversionData({ ...conversionData, state: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Pincode</label>
                                                <input
                                                    type="text" required
                                                    value={conversionData.pincode}
                                                    onChange={(e) => setConversionData({ ...conversionData, pincode: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-white/10 pt-6 grid grid-cols-2 gap-6">
                                        <div className="col-span-2">
                                            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <Key className="h-4 w-4 text-green-400" />
                                                License Details
                                            </h3>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Purchase Type</label>
                                            <select
                                                value={conversionData.expiry_days}
                                                onChange={(e) => setConversionData({ ...conversionData, expiry_days: e.target.value })}
                                                className="w-full bg-[#0f0a2a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
                                            >
                                                <option value="365">1-Year Subscription</option>
                                                <option value="730">2-Year Subscription</option>
                                                <option value="lifetime">Lifetime Access</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Max Machines</label>
                                            <input
                                                type="number" min="1" required
                                                value={conversionData.max_machines}
                                                onChange={(e) => setConversionData({ ...conversionData, max_machines: Number(e.target.value) })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
                                            />
                                        </div>
                                    </div>

                                    {error && <p className="text-red-400 text-sm">{error}</p>}

                                    <div className="flex gap-4 pt-4 border-t border-white/10">
                                        <button type="button" onClick={() => setModalMode('view')} className="flex-1 bg-white/5 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                                            Back
                                        </button>
                                        <button type="submit" disabled={processing} className="flex-1 bg-green-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-green-600 transition-all disabled:opacity-50 flex justify-center items-center gap-2">
                                            {processing ? <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><Check className="h-5 w-5" />Complete Purchase</>}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ════════════════ MARK AS LOST MODAL ════════════════ */}
            {modalMode === 'mark_lost' && selectedLead && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-black/40 animate-in fade-in duration-300">
                    <div className="glass-morphism w-full max-w-md rounded-[2.5rem] p-8 border border-white/10 shadow-2xl relative animate-in zoom-in-95 duration-300">
                        <button onClick={() => setModalMode('view')} className="absolute right-6 top-6 p-2 rounded-xl hover:bg-white/5 text-gray-500 hover:text-white transition-all">
                            <X className="h-6 w-6" />
                        </button>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-14 w-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400">
                                <Ban className="h-7 w-7" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white">Mark as Lost</h2>
                                <p className="text-gray-400 text-sm"><b className="text-white">{selectedLead.full_name}</b></p>
                            </div>
                        </div>

                        <form onSubmit={handleMarkLost} className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Reason</label>
                                <select
                                    value={lostReason}
                                    onChange={(e) => setLostReason(e.target.value)}
                                    className="w-full bg-[#0f0a2a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                                >
                                    {LOST_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Additional Notes (Optional)</label>
                                <textarea
                                    value={lostNotes}
                                    onChange={(e) => setLostNotes(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
                                    placeholder="Any additional context..."
                                    rows={3}
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setModalMode('view')} className="flex-1 bg-white/5 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                                    Cancel
                                </button>
                                <button type="submit" disabled={processing} className="flex-1 bg-red-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-50 flex justify-center items-center gap-2">
                                    {processing ? <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><Ban className="h-5 w-5" />Confirm Lost</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
