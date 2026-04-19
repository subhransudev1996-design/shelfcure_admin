'use client';

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
    ClipboardList,
    Search,
    Filter,
    MoreVertical,
    MessageSquare,
    AlertCircle,
    HelpCircle,
    CheckCircle2,
    Clock,
    User,
    Building2,
    ChevronRight,
    X,
    Check,
    Send,
    Plus,
    ChevronDown
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

export default function SalesIntelligencePage() {
    const [visits, setVisits] = useState<any[]>([]);
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [modalMode, setModalMode] = useState<'create' | 'respond' | 'view' | null>(null);
    const [selectedVisit, setSelectedVisit] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [leadSearch, setLeadSearch] = useState('');
    const [showLeadDropdown, setShowLeadDropdown] = useState(false);
    const leadDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (leadDropdownRef.current && !leadDropdownRef.current.contains(event.target as Node)) {
                setShowLeadDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const [newVisit, setNewVisit] = useState({
        pharmacy_name: '',
        sales_person_name: '',
        visit_type: 'inquiry',
        discussion_points: '',
        lead_id: ''
    });

    const [adminResponse, setAdminResponse] = useState('');

    async function fetchData() {
        setLoading(true);
        setError(null);
        try {
            const [visitsRes, leadsRes] = await Promise.all([
                supabase.from('sales_visits').select('*').order('created_at', { ascending: false }),
                supabase.from('leads').select('id, pharmacy_name, full_name')
            ]);

            if (visitsRes.error) {
                if (visitsRes.error.code === '42P01') {
                    setError('The "sales_visits" table does not exist. Please run the SQL script in the Implementation Plan.');
                } else {
                    throw visitsRes.error;
                }
            } else {
                setVisits(visitsRes.data || []);
            }

            if (!leadsRes.error) {
                setLeads(leadsRes.data || []);
            }
        } catch (err: any) {
            console.error('Error fetching intelligence data:', err?.message || err);
            setError(err?.message || 'Failed to sync with sales intelligence network.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateVisit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase.from('sales_visits').insert([newVisit]);
            if (error) throw error;
            await fetchData();
            setModalMode(null);
            setNewVisit({
                pharmacy_name: '',
                sales_person_name: '',
                visit_type: 'inquiry',
                discussion_points: '',
                lead_id: ''
            });
        } catch (err: any) {
            alert('Error logging visit: ' + err.message);
        }
    };

    const handleSendResponse = async () => {
        if (!selectedVisit) return;
        try {
            const { error } = await supabase
                .from('sales_visits')
                .update({
                    admin_response: adminResponse,
                    status: 'responded'
                })
                .eq('id', selectedVisit.id);

            if (error) throw error;
            await fetchData();
            setModalMode(null);
            setAdminResponse('');
        } catch (err: any) {
            alert('Error sending response: ' + err.message);
        }
    };

    const filtered = visits.filter(v =>
        v.pharmacy_name?.toLowerCase().includes(search.toLowerCase()) ||
        v.sales_person_name?.toLowerCase().includes(search.toLowerCase()) ||
        v.discussion_points?.toLowerCase().includes(search.toLowerCase())
    );

    const stats = {
        total: visits.length,
        pending: visits.filter(v => v.status === 'pending').length,
        complaints: visits.filter(v => v.visit_type === 'complaint').length,
        inquiries: visits.filter(v => v.visit_type === 'inquiry').length
    };

    return (
        <div className="p-10 max-w-7xl mx-auto space-y-10 animate-fade-in-up">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-4">
                        <div className="p-2 rounded-xl bg-brand/10 brand-glow">
                            <ClipboardList className="h-8 w-8 text-brand" />
                        </div>
                        Sales Intelligence
                    </h1>
                    <p className="text-gray-400 mt-2 text-lg">Field visit logs, pharmacy inquiries, and strategic feedback</p>
                </div>
                <button
                    onClick={() => setModalMode('create')}
                    className="bg-brand text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest brand-glow hover:opacity-90 transition-all active:scale-95 flex items-center gap-3"
                >
                    <Plus className="h-5 w-5" />
                    Log Field Visit
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Visits', value: stats.total, color: 'brand', icon: ClipboardList },
                    { label: 'Pending Review', value: stats.pending, color: 'orange', icon: Clock },
                    { label: 'Store Complaints', value: stats.complaints, color: 'red', icon: AlertCircle },
                    { label: 'Market Inquiries', value: stats.inquiries, color: 'blue', icon: HelpCircle },
                ].map((stat, i) => (
                    <div key={i} className="glass-morphism p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
                        <div className={`absolute -right-4 -top-4 w-24 h-24 bg-${stat.color}-500/5 blur-3xl rounded-full group-hover:bg-${stat.color}-500/10 transition-all`} />
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
                        <p className="text-sm font-bold text-white uppercase tracking-wider">Intelligence Offline</p>
                        <p className="text-sm text-gray-400 mt-1">{error}</p>
                    </div>
                </div>
            )}

            <div className="flex gap-4 items-center">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-brand transition-colors" />
                    <input
                        type="text"
                        placeholder="Search visits by store name, personnel, or keywords..."
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
                                <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Store & Type</th>
                                <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Sales Personnel</th>
                                <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Discussion Snapshot</th>
                                <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Status</th>
                                <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-[0.2em] text-right">Review</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan={5} className="px-8 py-20 text-center text-gray-500 font-bold uppercase tracking-widest animate-pulse transition-all">Synchronizing Field Data...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={5} className="px-8 py-20 text-center text-gray-500 font-bold">No intelligence logs found matching your criteria.</td></tr>
                            ) : (
                                filtered.map((visit) => (
                                    <tr key={visit.id} className="hover:bg-white/[0.04] transition-all duration-300 group cursor-default">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-white font-bold">{visit.pharmacy_name}</span>
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase tracking-widest mt-1",
                                                    visit.visit_type === 'complaint' ? "text-red-400" :
                                                        visit.visit_type === 'inquiry' ? "text-blue-400" : "text-gray-400"
                                                )}>
                                                    {visit.visit_type}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-gray-300">{visit.sales_person_name}</td>
                                        <td className="px-8 py-6 max-w-sm">
                                            <p className="text-gray-400 text-sm line-clamp-2 italic">&quot;{visit.discussion_points}&quot;</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                                visit.status === 'responded' ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                                            )}>
                                                {visit.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button
                                                onClick={() => {
                                                    setSelectedVisit(visit);
                                                    setModalMode('view');
                                                }}
                                                className="p-2 hover:bg-brand/10 rounded-xl transition-all group/btn"
                                            >
                                                <ChevronRight className="h-5 w-5 text-gray-500 group-hover/btn:text-brand" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Visit Modal */}
            {modalMode === 'create' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-black/40 animate-in fade-in duration-300">
                    <form onSubmit={handleCreateVisit} className="glass-morphism w-full max-w-lg rounded-[2.5rem] p-10 border border-white/10 shadow-2xl relative animate-in zoom-in-95 duration-300">
                        <button type="button" onClick={() => setModalMode(null)} className="absolute right-8 top-8 p-2 rounded-xl hover:bg-white/5 text-gray-500 hover:text-white transition-all"><X className="h-6 w-6" /></button>
                        <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3"><Plus className="h-6 w-6 text-brand" /> Log Visit Intelligence</h2>

                        <div className="space-y-6">
                            <div className="relative" ref={leadDropdownRef}>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Target Pharmacy / Store</label>
                                <div className="relative group">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-brand transition-colors z-10" />
                                    <input
                                        type="text"
                                        value={newVisit.pharmacy_name}
                                        onChange={(e) => {
                                            setNewVisit({ ...newVisit, pharmacy_name: e.target.value, lead_id: '' });
                                            setLeadSearch(e.target.value);
                                            setShowLeadDropdown(true);
                                        }}
                                        onFocus={() => setShowLeadDropdown(true)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand/50"
                                        placeholder="Search leads or type store name..."
                                        required
                                    />
                                    {showLeadDropdown && (leadSearch.length > 0 || leads.length > 0) && (
                                        <div className="absolute left-0 right-0 mt-2 z-[110] bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl max-h-60 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2">
                                            {leads
                                                .filter(l =>
                                                    l.pharmacy_name?.toLowerCase().includes(leadSearch.toLowerCase()) ||
                                                    l.full_name?.toLowerCase().includes(leadSearch.toLowerCase())
                                                )
                                                .map(lead => (
                                                    <button
                                                        key={lead.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setNewVisit({
                                                                ...newVisit,
                                                                pharmacy_name: lead.pharmacy_name,
                                                                lead_id: lead.id
                                                            });
                                                            setLeadSearch(lead.pharmacy_name);
                                                            setShowLeadDropdown(false);
                                                        }}
                                                        className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/10 flex flex-col gap-0.5 transition-all"
                                                    >
                                                        <span className="text-white font-bold text-sm tracking-tight">{lead.pharmacy_name}</span>
                                                        <span className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">{lead.full_name} • Prospect</span>
                                                    </button>
                                                ))
                                            }
                                            <button
                                                type="button"
                                                onClick={() => setShowLeadDropdown(false)}
                                                className="w-full text-center py-2 text-[10px] font-black uppercase tracking-widest text-brand hover:text-white transition-all border-t border-white/5 mt-2 pt-2"
                                            >
                                                Manual Store Entry
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Personnel Identity</label>
                                    <input
                                        type="text"
                                        value={newVisit.sales_person_name}
                                        onChange={(e) => setNewVisit({ ...newVisit, sales_person_name: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand/50"
                                        placeholder="Name"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Intelligence Type</label>
                                    <div className="relative group">
                                        <select
                                            value={newVisit.visit_type}
                                            onChange={(e) => setNewVisit({ ...newVisit, visit_type: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand/50 appearance-none cursor-pointer"
                                        >
                                            <option value="inquiry" className="bg-zinc-900 border-none">Inquiry / Question</option>
                                            <option value="complaint" className="bg-zinc-900 border-none">Complaint / Issue</option>
                                            <option value="feedback" className="bg-zinc-900 border-none">General Feedback</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-brand transition-colors">
                                            <ChevronDown className="h-4 w-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Discussion Points</label>
                                <textarea
                                    value={newVisit.discussion_points}
                                    onChange={(e) => setNewVisit({ ...newVisit, discussion_points: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand/50 min-h-[120px] resize-none"
                                    placeholder="What was discussed with the medicine store owner?"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button type="button" onClick={() => setModalMode(null)} className="flex-1 bg-white/5 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all">Abort</button>
                            <button type="submit" className="flex-1 bg-brand text-white py-4 rounded-2xl font-black uppercase tracking-widest brand-glow transition-all flex items-center justify-center gap-2"><Check className="h-5 w-5" /> Log Intelligence</button>
                        </div>
                    </form>
                </div>
            )}

            {/* View/Respond Modal */}
            {modalMode === 'view' && selectedVisit && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-black/40 animate-in fade-in duration-300">
                    <div className="glass-morphism w-full max-w-2xl rounded-[2.5rem] p-10 border border-white/10 shadow-2xl relative animate-in zoom-in-95 duration-300">
                        <button onClick={() => setModalMode(null)} className="absolute right-8 top-8 p-2 rounded-xl hover:bg-white/5 text-gray-500 hover:text-white transition-all"><X className="h-6 w-6" /></button>

                        <div className="flex items-start gap-6 mb-10">
                            <div className="h-16 w-16 rounded-2xl bg-brand/10 flex items-center justify-center brand-glow shrink-0">
                                {selectedVisit.visit_type === 'complaint' ? <AlertCircle className="h-8 w-8 text-red-500" /> : <MessageSquare className="h-8 w-8 text-brand" />}
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-white">{selectedVisit.pharmacy_name}</h2>
                                <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-xs mt-1">Visit by {selectedVisit.sales_person_name} • {formatDate(selectedVisit.created_at)}</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Discussion Logs</label>
                                <div className="bg-white/5 border border-white/5 rounded-2xl p-6 text-white leading-relaxed italic border-l-4 border-l-brand">
                                    &quot;{selectedVisit.discussion_points}&quot;
                                </div>
                            </div>

                            {selectedVisit.admin_response ? (
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Admin Strategic Response</label>
                                    <div className="bg-brand/5 border border-brand/10 rounded-2xl p-6 text-brand leading-relaxed font-bold">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircle2 className="h-4 w-4" />
                                            <span className="text-[10px] uppercase tracking-widest">Feedback Provided</span>
                                        </div>
                                        {selectedVisit.admin_response}
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Submit Strategic Answer / Action</label>
                                    <textarea
                                        value={adminResponse}
                                        onChange={(e) => setAdminResponse(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-brand/50 min-h-[140px] resize-none"
                                        placeholder="Provide answers to the salesperson or documented improvements..."
                                    />
                                    <button
                                        onClick={handleSendResponse}
                                        disabled={!adminResponse}
                                        className="mt-4 w-full bg-brand text-white py-4 rounded-2xl font-black uppercase tracking-widest brand-glow disabled:opacity-50 disabled:brand-glow-none transition-all flex items-center justify-center gap-3"
                                    >
                                        <Send className="h-5 w-5" />
                                        Send Intelligence Response
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="mt-10 pt-8 border-t border-white/5">
                            <button onClick={() => setModalMode(null)} className="w-full bg-white/5 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all">Close Intelligence Report</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
