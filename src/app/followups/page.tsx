'use client';

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
    CalendarClock,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Phone,
    Mail,
    ArrowRight,
    MessageSquare,
    Ban,
    RotateCcw,
    Play,
    X,
    Check,
    Loader2,
    Calendar
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function FollowupsPage() {
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [rescheduleId, setRescheduleId] = useState<string | null>(null);
    const [rescheduleDate, setRescheduleDate] = useState('');
    const [lostConfirmId, setLostConfirmId] = useState<string | null>(null);
    const [lostConfirmName, setLostConfirmName] = useState('');
    const router = useRouter();

    function showToast(message: string, type: 'success' | 'error' = 'success') {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }

    async function fetchFollowups() {
        try {
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .not('next_followup_date', 'is', null)
                .order('next_followup_date', { ascending: true });

            if (error) throw error;
            setLeads(data || []);
        } catch (err) {
            console.error('Error fetching followups:', err);
        } finally {
            setLoading(false);
        }
    }

    async function logActivity(leadId: string, type: string, description: string) {
        try {
            await supabase.from('lead_activities').insert([{ lead_id: leadId, type, description }]);
        } catch (err) {
            console.error('Error logging activity:', err);
        }
    }

    async function handleQuickAction(leadId: string, action: 'called' | 'whatsapp') {
        setActionLoading(`${action}-${leadId}`);
        try {
            const desc = action === 'called' ? 'Phone call made' : 'WhatsApp message sent';
            await logActivity(leadId, action === 'called' ? 'call' : 'whatsapp', desc);

            // Update pipeline stage to contacted if still 'new'
            const lead = leads.find(l => l.id === leadId);
            if (lead && getStage(lead) === 'new') {
                await supabase
                    .from('leads')
                    .update({ pipeline_stage: 'contacted' })
                    .eq('id', leadId);
                await fetchFollowups();
            }

            showToast(desc);
        } catch (err) {
            console.error('Error:', err);
            showToast('Failed to log action', 'error');
        } finally {
            setActionLoading(null);
        }
    }

    async function handleRescheduleSubmit() {
        if (!rescheduleId || !rescheduleDate) return;
        setActionLoading(`reschedule-${rescheduleId}`);
        try {
            const { error } = await supabase
                .from('leads')
                .update({ next_followup_date: rescheduleDate })
                .eq('id', rescheduleId);

            if (error) throw error;
            await logActivity(rescheduleId, 'system', `Follow-up rescheduled to ${rescheduleDate}`);
            showToast(`Rescheduled to ${new Date(rescheduleDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`);
            setRescheduleId(null);
            setRescheduleDate('');
            await fetchFollowups();
        } catch (err) {
            console.error('Error rescheduling:', err);
            showToast('Failed to reschedule', 'error');
        } finally {
            setActionLoading(null);
        }
    }

    async function handleMarkLostConfirm() {
        if (!lostConfirmId) return;
        setActionLoading(`lost-${lostConfirmId}`);
        try {
            const { error } = await supabase
                .from('leads')
                .update({ pipeline_stage: 'lost', lost_reason: 'Not Reachable', next_followup_date: null })
                .eq('id', lostConfirmId);

            if (error) throw error;
            await logActivity(lostConfirmId, 'lost', 'Marked as lost from follow-ups page');
            showToast(`"${lostConfirmName}" marked as lost`);
            setLostConfirmId(null);
            setLostConfirmName('');
            await fetchFollowups();
        } catch (err) {
            console.error('Error marking lost:', err);
            showToast('Failed to mark as lost', 'error');
        } finally {
            setActionLoading(null);
        }
    }

    useEffect(() => {
        fetchFollowups();
    }, []);

    // Categorize follow-ups
    const todayStr = new Date().toISOString().split('T')[0];
    const getStage = (l: any) => l.pipeline_stage || l.status || 'new';

    const overdue = leads.filter(l => {
        const d = l.next_followup_date?.split('T')[0] || l.next_followup_date;
        return d < todayStr && !['won', 'lost'].includes(getStage(l));
    });
    const today = leads.filter(l => {
        const d = l.next_followup_date?.split('T')[0] || l.next_followup_date;
        return d === todayStr && !['won', 'lost'].includes(getStage(l));
    });
    const upcoming = leads.filter(l => {
        const d = l.next_followup_date?.split('T')[0] || l.next_followup_date;
        return d > todayStr && !['won', 'lost'].includes(getStage(l));
    });

    const renderLeadCard = (lead: any, type: 'overdue' | 'today' | 'upcoming') => {
        const isCalledLoading = actionLoading === `called-${lead.id}`;
        const isWhatsappLoading = actionLoading === `whatsapp-${lead.id}`;
        const isRescheduleOpen = rescheduleId === lead.id;

        return (
            <div key={lead.id} className={cn(
                "group glass-morphism rounded-3xl p-6 border transition-all hover:-translate-y-1 relative overflow-hidden",
                type === 'overdue' ? "border-red-500/20 hover:border-red-500/50" :
                type === 'today' ? "border-brand/30 hover:border-brand/60" :
                "border-white/5 hover:border-white/20"
            )}>
                {/* Background Gradient */}
                <div className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none",
                    type === 'overdue' ? "bg-gradient-to-br from-red-500 to-transparent" :
                    type === 'today' ? "bg-gradient-to-br from-brand to-transparent" :
                    "bg-gradient-to-br from-indigo-500 to-transparent"
                )} />

                <div className="flex items-start justify-between relative z-10">
                    <div>
                        <h3 className="text-lg font-black text-white">{lead.full_name}</h3>
                        <p className="text-gray-400 font-medium text-sm mt-1">{lead.pharmacy_name || 'No Pharmacy Name'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {lead.lead_temperature && (
                            <div className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                                lead.lead_temperature === 'hot' ? "bg-red-500/10 text-red-500" :
                                lead.lead_temperature === 'warm' ? "bg-orange-500/10 text-orange-500" :
                                "bg-blue-500/10 text-blue-500"
                            )}>
                                {lead.lead_temperature}
                            </div>
                        )}
                        <div className={cn(
                            "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                            "bg-white/5 text-gray-400"
                        )}>
                            {(getStage(lead)).replace(/_/g, ' ')}
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                    {lead.phone && (
                        <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-sm text-gray-300 hover:text-brand transition-colors">
                            <Phone className="h-4 w-4 text-gray-500" />
                            {lead.phone}
                        </a>
                    )}
                    {lead.email && (
                        <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-sm text-gray-300 hover:text-brand transition-colors">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span className="truncate max-w-[150px]">{lead.email}</span>
                        </a>
                    )}
                </div>

                {/* Scheduled Date */}
                <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                    <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            Scheduled
                        </p>
                        <p className={cn(
                            "font-bold text-sm",
                            type === 'overdue' ? "text-red-400" :
                            type === 'today' ? "text-brand" : "text-white"
                        )}>
                            {type === 'today' ? 'Today' : formatDate(lead.next_followup_date)}
                        </p>
                    </div>
                </div>

                {/* Reschedule Inline Panel */}
                {isRescheduleOpen && (
                    <div className="mt-4 bg-indigo-500/10 rounded-2xl p-4 border border-indigo-500/20 flex items-center gap-3 animate-in slide-in-from-top-2 duration-200">
                        <Calendar className="h-5 w-5 text-indigo-400 shrink-0" />
                        <input
                            type="date"
                            value={rescheduleDate}
                            onChange={(e) => setRescheduleDate(e.target.value)}
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/50 [color-scheme:dark]"
                            min={todayStr}
                            autoFocus
                        />
                        <button
                            onClick={handleRescheduleSubmit}
                            disabled={!rescheduleDate}
                            className="bg-indigo-500 text-white p-2 rounded-xl hover:bg-indigo-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <Check className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => { setRescheduleId(null); setRescheduleDate(''); }}
                            className="bg-white/5 text-gray-400 p-2 rounded-xl hover:bg-white/10 transition-all"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="mt-4 flex flex-wrap gap-2">
                    <button
                        onClick={() => handleQuickAction(lead.id, 'called')}
                        disabled={isCalledLoading}
                        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-green-500/10 text-green-400 px-3 py-2 rounded-xl hover:bg-green-500/20 transition-all border border-green-500/20 disabled:opacity-50"
                    >
                        {isCalledLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Phone className="h-3 w-3" />}
                        Called
                    </button>
                    <button
                        onClick={() => handleQuickAction(lead.id, 'whatsapp')}
                        disabled={isWhatsappLoading}
                        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 px-3 py-2 rounded-xl hover:bg-emerald-500/20 transition-all border border-emerald-500/20 disabled:opacity-50"
                    >
                        {isWhatsappLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <MessageSquare className="h-3 w-3" />}
                        WhatsApp&apos;d
                    </button>
                    <button
                        onClick={() => {
                            setRescheduleId(isRescheduleOpen ? null : lead.id);
                            setRescheduleDate('');
                        }}
                        className={cn(
                            "flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl transition-all border",
                            isRescheduleOpen
                                ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                                : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20"
                        )}
                    >
                        <RotateCcw className="h-3 w-3" />
                        Reschedule
                    </button>
                    <button
                        onClick={() => {
                            setLostConfirmId(lead.id);
                            setLostConfirmName(lead.full_name);
                        }}
                        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-red-500/10 text-red-400 px-3 py-2 rounded-xl hover:bg-red-500/20 transition-all border border-red-500/20"
                    >
                        <Ban className="h-3 w-3" />
                        Lost
                    </button>
                    <button
                        onClick={() => router.push(`/leads?open=${lead.id}`)}
                        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-white/5 text-white px-3 py-2 rounded-xl hover:bg-white/10 transition-all ml-auto"
                    >
                        Open Lead
                        <ArrowRight className="h-3 w-3" />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="p-10 max-w-7xl mx-auto space-y-12 animate-fade-in-up pb-20">
            {/* Toast Notification */}
            {toast && (
                <div className={cn(
                    "fixed top-6 right-6 z-[200] px-6 py-4 rounded-2xl font-bold text-sm shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300",
                    toast.type === 'success'
                        ? "bg-brand/90 text-white border border-brand/40"
                        : "bg-red-500/90 text-white border border-red-500/40"
                )}>
                    {toast.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                    {toast.message}
                </div>
            )}

            {/* Mark as Lost Confirmation Modal */}
            {lostConfirmId && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 backdrop-blur-sm bg-black/50 animate-in fade-in duration-200">
                    <div className="glass-morphism w-full max-w-md rounded-3xl p-8 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 rounded-2xl bg-red-500/10">
                                <Ban className="h-8 w-8 text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white">Mark as Lost</h3>
                                <p className="text-gray-400 text-sm">This will remove the lead from follow-ups</p>
                            </div>
                        </div>
                        <p className="text-gray-300 mb-8">
                            Are you sure you want to mark <span className="font-bold text-white">&quot;{lostConfirmName}&quot;</span> as lost?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setLostConfirmId(null); setLostConfirmName(''); }}
                                className="flex-1 bg-white/5 text-white py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleMarkLostConfirm}
                                disabled={actionLoading === `lost-${lostConfirmId}`}
                                className="flex-1 bg-red-500 text-white py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-red-600 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {actionLoading === `lost-${lostConfirmId}` ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Ban className="h-4 w-4" />
                                )}
                                Mark Lost
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-4">
                        <div className="p-2 rounded-xl bg-orange-500/10">
                            <CalendarClock className="h-8 w-8 text-orange-500" />
                        </div>
                        Follow-ups
                    </h1>
                    <p className="text-gray-400 mt-2 text-lg">Your daily follow-up dashboard. Stay on top of every lead.</p>
                </div>
                {/* Summary Stats */}
                <div className="flex gap-4">
                    {overdue.length > 0 && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-3 text-center">
                            <p className="text-2xl font-black text-red-400">{overdue.length}</p>
                            <p className="text-[10px] font-black text-red-500/60 uppercase tracking-widest">Overdue</p>
                        </div>
                    )}
                    <div className="bg-brand/10 border border-brand/20 rounded-2xl px-5 py-3 text-center">
                        <p className="text-2xl font-black text-brand">{today.length}</p>
                        <p className="text-[10px] font-black text-brand/60 uppercase tracking-widest">Today</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-center">
                        <p className="text-2xl font-black text-white">{upcoming.length}</p>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Upcoming</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse h-64 bg-white/5 rounded-3xl border border-white/10" />
                    ))}
                </div>
            ) : (
                <div className="space-y-16">
                    {/* Overdue Section */}
                    {overdue.length > 0 && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-xl font-black text-red-500 flex items-center gap-3">
                                <AlertTriangle className="h-6 w-6" />
                                Overdue
                                <span className="bg-red-500/20 text-red-500 px-3 py-1 rounded-full text-xs ml-2">{overdue.length}</span>
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {overdue.map(lead => renderLeadCard(lead, 'overdue'))}
                            </div>
                        </div>
                    )}

                    {/* Today Section */}
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 delay-100">
                        <h2 className="text-xl font-black text-brand flex items-center gap-3">
                            <CheckCircle2 className="h-6 w-6" />
                            Today
                            <span className="bg-brand/20 text-brand px-3 py-1 rounded-full text-xs ml-2">{today.length}</span>
                        </h2>
                        {today.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {today.map(lead => renderLeadCard(lead, 'today'))}
                            </div>
                        ) : (
                            <div className="glass-morphism rounded-3xl p-8 border border-white/5 text-center text-gray-500 flex flex-col items-center justify-center min-h-[200px]">
                                <CheckCircle2 className="h-10 w-10 text-brand/30 mb-4" />
                                <p className="font-bold text-lg text-white">All Clear</p>
                                <p className="text-sm text-gray-400 mt-1">No follow-ups scheduled for today.</p>
                            </div>
                        )}
                    </div>

                    {/* Upcoming Section */}
                    {upcoming.length > 0 && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 delay-200">
                            <h2 className="text-xl font-black text-gray-400 flex items-center gap-3">
                                <CalendarClock className="h-6 w-6" />
                                Upcoming
                                <span className="bg-white/10 text-gray-300 px-3 py-1 rounded-full text-xs ml-2">{upcoming.length}</span>
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {upcoming.map(lead => renderLeadCard(lead, 'upcoming'))}
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {overdue.length === 0 && today.length === 0 && upcoming.length === 0 && (
                        <div className="glass-morphism rounded-3xl p-16 border border-white/5 text-center flex flex-col items-center justify-center">
                            <CalendarClock className="h-16 w-16 text-gray-700 mb-6" />
                            <p className="font-bold text-2xl text-white">No Follow-ups</p>
                            <p className="text-gray-400 mt-2 max-w-md">Schedule follow-ups from the Leads page to see them here. Follow-ups help you stay on top of every prospect.</p>
                            <button
                                onClick={() => router.push('/leads')}
                                className="mt-8 bg-brand text-white px-8 py-3 rounded-2xl font-bold hover:opacity-90 transition-all brand-glow flex items-center gap-2"
                            >
                                Go to Leads
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
