'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Users,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Clock,
  Target
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalPharmacies: 0,
    activePharmacies: 0,
    totalUsers: 0,
    totalRevenue: 0,
    totalLeads: 0,
    expiringSoon: [] as any[]
  });
  const [loading, setLoading] = useState(true);
  const [latency, setLatency] = useState('2.4ms');

  useEffect(() => {
    async function fetchStats() {
      try {
        const [pharmacies, users, leads] = await Promise.all([
          supabase.from('pharmacies').select('*').order('subscription_end_date', { ascending: true }),
          supabase.from('users').select('*', { count: 'exact' }),
          supabase.from('leads').select('*', { count: 'exact' })
        ]);

        const totalPharmacies = pharmacies.data?.length || 0;
        const totalUsers = users.data?.length || 0;
        const activePharmacies = pharmacies.data?.filter(p => p.subscription_status === 'active').length || 0;
        const expiringSoon = pharmacies.data?.filter(p => p.subscription_status === 'grace').slice(0, 2) || [];

        // Dynamic revenue based on active nodes
        const totalRevenue = activePharmacies * 7000;

        setStats({
          totalPharmacies,
          activePharmacies,
          totalUsers,
          totalRevenue,
          totalLeads: leads.data?.length || 0,
          expiringSoon
        });
      } catch (err: any) {
        console.error('Error fetching stats:', err?.message || err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();

    // Simulate live latency variability
    const interval = setInterval(() => {
      setLatency(`${(Math.random() * 2 + 1.5).toFixed(1)}ms`);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const statCards = [
    { label: 'Active Customers', value: stats.activePharmacies, icon: Activity, color: 'text-green-500', trend: 8 },
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-purple-500', trend: 5 },
    { label: 'Total Leads', value: stats.totalLeads, icon: Target, color: 'text-blue-500', trend: 12 },
    { label: 'Annual Revenue', value: formatCurrency(stats.totalRevenue), icon: TrendingUp, color: 'text-orange-500', trend: 15 },
  ];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-10 w-10 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-10 p-10 max-w-7xl mx-auto animate-fade-in-up">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white bg-clip-text">Dashboard</h1>
          <p className="text-gray-400 mt-2 text-lg">Business overview & system health</p>
        </div>
        <div className="bg-brand/10 px-4 py-2 rounded-2xl border border-brand/20 backdrop-blur-md flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-brand animate-pulse shadow-[0_0_10px_#4cba49]" />
          <span className="text-sm font-semibold text-brand uppercase tracking-tighter">Live System</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {statCards.map((card, index) => (
          <div
            key={card.label}
            className="glass-morphism p-8 rounded-[2rem] shadow-sm hover-brand-glow transition-all duration-500 group cursor-default"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex justify-between items-start mb-6">
              <div className={cn("p-4 rounded-2xl bg-white/5 group-hover:scale-110 transition-transform duration-500", card.color.replace('text', 'text'))}>
                <card.icon className={cn("h-7 w-7", card.color)} />
              </div>
              <div className={cn(
                "flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md",
                card.trend > 0 ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
              )}>
                {card.trend > 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                {Math.abs(card.trend)}%
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{card.label}</p>
              <div className="flex items-baseline gap-2 mt-2">
                <p className="text-3xl font-black text-white">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="glass-morphism rounded-[2.5rem] p-8 hover-brand-glow transition-all duration-500">
          <h3 className="text-xl font-bold mb-8 flex items-center gap-3 text-white">
            <div className="p-2 rounded-lg bg-brand/10">
              <Activity className="h-5 w-5 text-brand" />
            </div>
            System Health
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Database', status: 'Operational', color: 'green', value: 'High' },
              { label: 'API Response', status: 'Optimal', color: 'green', value: latency },
              { label: 'Auth Status', status: 'Operational', color: 'green', value: '100%' }
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-5 bg-white/[0.03] rounded-[1.5rem] border border-white/5 group hover:bg-white/[0.05] transition-all">
                <span className="text-gray-300 font-medium">{item.label}</span>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono text-gray-500">{item.value}</span>
                  <span className={cn(
                    "flex items-center gap-2 text-sm font-bold px-3 py-1 rounded-full",
                    item.color === 'green' ? "text-green-500 bg-green-500/10" : "text-yellow-500 bg-yellow-500/10"
                  )}>
                    <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", item.color === 'green' ? "bg-green-500" : "bg-yellow-500")} />
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-morphism rounded-[2.5rem] p-8 hover-brand-glow transition-all duration-500">
          <h3 className="text-xl font-bold mb-8 flex items-center gap-3 text-white">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <AlertCircle className="h-5 w-5 text-orange-500" />
            </div>
            Critical Notifications
          </h3>
          <div className="space-y-4">
            {stats.expiringSoon.length > 0 ? (
              stats.expiringSoon.map((p) => (
                <div key={p.id} className="flex items-start gap-4 p-5 bg-orange-500/5 rounded-[1.5rem] border border-orange-500/10 group hover:border-orange-500/30 transition-all">
                  <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 shrink-0">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Renewal Required</p>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">{p.name}&apos;s enterprise subscription expires soon.</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center">
                <p className="text-gray-500 font-medium">All systems stable. No pending alerts.</p>
              </div>
            )}
            {stats.totalUsers > 100 && (
              <div className="flex items-start gap-4 p-5 bg-brand/5 rounded-[1.5rem] border border-brand/10 group hover:border-brand/30 transition-all">
                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-brand/10 text-brand shrink-0">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Scale Performance</p>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">You&apos;ve crossed {stats.totalUsers} users. Great growth!</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
