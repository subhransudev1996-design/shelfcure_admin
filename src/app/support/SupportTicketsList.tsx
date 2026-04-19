'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, Ticket, Check, X, Search, Loader2 } from 'lucide-react';

interface SupportTicket {
    id: number;
    pharmacy_id: number;
    subject: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    status: 'open' | 'resolved';
    created_at: string;
    pharmacies?: { name: string };
}

export default function SupportTicketsList() {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved'>('all');

    useEffect(() => {
        fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter]);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('support_tickets')
                .select(`
                    *,
                    pharmacies (
                        name
                    )
                `)
                .order('created_at', { ascending: false });

            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }

            const { data, error } = await query;
            if (error) throw error;
            setTickets(data as any);
        } catch (err) {
            console.error('Error fetching tickets:', err);
        } finally {
            setLoading(false);
        }
    };

    const resolveTicket = async (id: number) => {
        try {
            const { error } = await supabase
                .from('support_tickets')
                .update({ status: 'resolved' })
                .eq('id', id);

            if (error) throw error;
            // Update local state
            setTickets(tickets.map(t => t.id === id ? { ...t, status: 'resolved' } : t));
        } catch (err) {
            console.error('Error resolving ticket:', err);
            alert('Failed to resolve ticket');
        }
    };

    const filteredTickets = tickets.filter(t => 
        (t.pharmacies?.name?.toLowerCase().includes(search.toLowerCase()) || '') ||
        t.subject.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex gap-4 items-center">
                <div className="flex-1 max-w-md relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search tickets by pharmacy or subject..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:ring-2 ring-brand outline-none text-white transition-all"
                    />
                </div>
                
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-brand"
                >
                    <option value="all" className="bg-gray-900">All Statuses</option>
                    <option value="open" className="bg-gray-900">Open</option>
                    <option value="resolved" className="bg-gray-900">Resolved</option>
                </select>

                <button onClick={fetchTickets} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all">
                    Refresh
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-brand" />
                </div>
            ) : filteredTickets.length === 0 ? (
                <div className="text-center p-12 bg-white/5 rounded-2xl border border-white/10">
                    <Ticket className="w-12 h-12 text-gray-500 mx-auto mb-4 hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-medium text-white mb-2">No tickets found</h3>
                    <p className="text-gray-400">There are no {statusFilter !== 'all' ? statusFilter : ''} support tickets at the moment.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredTickets.map(ticket => (
                        <div key={ticket.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                        {ticket.subject}
                                        {ticket.status === 'resolved' && <CheckCircle2 className="w-4 h-4 text-brand" />}
                                    </h4>
                                    <div className="text-sm text-gray-400 mt-1 flex gap-3">
                                        <span className="text-white">#{ticket.id}</span>
                                        <span>•</span>
                                        <span className="text-brand">Pharmacy: {ticket.pharmacies?.name || `ID: ${ticket.pharmacy_id}`}</span>
                                        <span>•</span>
                                        <span>{new Date(ticket.created_at).toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                        ticket.priority === 'high' ? 'bg-red-500/20 text-red-500' :
                                        ticket.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                                        'bg-blue-500/20 text-blue-500'
                                    }`}>
                                        {ticket.priority}
                                    </span>
                                    {ticket.status === 'open' ? (
                                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-500/20 text-orange-500">
                                            Open
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand/20 text-brand">
                                            Resolved
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            <div className="bg-black/30 rounded-xl p-4 text-gray-300 text-sm whitespace-pre-wrap font-mono">
                                {ticket.description}
                            </div>
                            
                            {ticket.status === 'open' && (
                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={() => resolveTicket(ticket.id)}
                                        className="flex items-center gap-2 px-4 py-2 bg-brand/10 hover:bg-brand/20 text-brand rounded-lg transition-colors text-sm font-medium"
                                    >
                                        <Check className="w-4 h-4" />
                                        Mark as Resolved
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
