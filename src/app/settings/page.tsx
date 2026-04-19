'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Settings,
    User,
    Shield,
    Bell,
    Database,
    Save,
    CheckCircle2,
    Lock,
    Globe,
    Palette
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');

    useEffect(() => {
        async function fetchUser() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await supabase
                        .from('users')
                        .select('*')
                        .eq('auth_user_id', user.id)
                        .single();
                    setUser({ ...user, profile });
                }
            } catch (err) {
                console.error('Error fetching user settings:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchUser();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating(true);
        // Simulate save
        await new Promise(resolve => setTimeout(resolve, 1000));
        setUpdating(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="h-10 w-10 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
            </div>
        );
    }

    const tabs = [
        { id: 'profile', label: 'My Profile', icon: User },
        { id: 'security', label: 'Security', icon: Lock },
        { id: 'system', label: 'Network Config', icon: Globe },
        { id: 'appearance', label: 'Interface', icon: Palette },
        { id: 'notifications', label: 'Alerting', icon: Bell },
    ];

    return (
        <div className="p-10 max-w-7xl mx-auto space-y-10 animate-fade-in-up">
            <div>
                <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-4">
                    <div className="p-2 rounded-xl bg-brand/10 brand-glow">
                        <Settings className="h-8 w-8 text-brand" />
                    </div>
                    System Settings
                </h1>
                <p className="text-gray-400 mt-2 text-lg">Configure your admin identity and network parameters</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                {/* Navigation Sidebar (local to Settings) */}
                <div className="glass-morphism rounded-[2.5rem] p-6 space-y-2 h-fit">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-300 group",
                                activeTab === tab.id
                                    ? "bg-brand/10 text-brand brand-glow"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <tab.icon className={cn(
                                "h-5 w-5 transition-transform group-hover:scale-110",
                                activeTab === tab.id ? "text-brand" : "text-gray-500"
                            )} />
                            <span className="font-bold text-sm tracking-tight">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-3 space-y-10">
                    <div className="glass-morphism rounded-[3rem] p-10 hover-brand-glow transition-all duration-500 shadow-2xl overflow-hidden relative">
                        {/* Decorative Background Glows */}
                        <div className="absolute -top-24 -right-24 h-64 w-64 bg-brand/5 rounded-full blur-3xl" />

                        <form onSubmit={handleSave} className="relative z-10 space-y-8">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-black text-white capitalize">{activeTab} Settings</h2>
                                {saved && (
                                    <div className="flex items-center gap-2 text-brand animate-fade-in-up">
                                        <CheckCircle2 className="h-5 w-5" />
                                        <span className="text-sm font-bold">Preferences Saved</span>
                                    </div>
                                )}
                            </div>

                            {activeTab === 'profile' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="group">
                                            <label className="block text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-3 ml-1">Full Identity</label>
                                            <input
                                                type="text"
                                                defaultValue={user?.profile?.full_name}
                                                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-5 focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all text-white shadow-inner font-medium"
                                                placeholder="Enter full name"
                                            />
                                        </div>
                                        <div className="group opacity-50">
                                            <label className="block text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-3 ml-1">Primary Email</label>
                                            <input
                                                type="email"
                                                disabled
                                                defaultValue={user?.email}
                                                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-5 focus:outline-none text-gray-400 cursor-not-allowed shadow-inner font-medium"
                                            />
                                        </div>
                                    </div>
                                    <div className="group">
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-3 ml-1">Account Role</label>
                                        <div className="flex items-center gap-3 bg-brand/5 border border-brand/20 rounded-2xl px-6 py-5 text-brand shadow-sm">
                                            <Shield className="h-6 w-6" />
                                            <span className="font-black uppercase tracking-tighter">Super Administrator</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'security' && (
                                <div className="space-y-6 animate-fade-in-up">
                                    <div className="p-6 bg-orange-500/5 border border-orange-500/20 rounded-3xl flex items-start gap-4">
                                        <Database className="h-6 w-6 text-orange-500 mt-1" />
                                        <div>
                                            <p className="text-white font-bold">Encrypted Session Data</p>
                                            <p className="text-sm text-gray-400 mt-1 leading-relaxed">Your account uses enterprise-grade encryption. Changes to security keys will require re-authentication of all active sessions.</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <button className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-5 rounded-2xl border border-white/5 transition-all text-left px-6 flex justify-between items-center group">
                                            <span>Update Master Access Key</span>
                                            <Lock className="h-5 w-5 text-gray-600 group-hover:text-white transition-colors" />
                                        </button>
                                        <button className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-5 rounded-2xl border border-white/5 transition-all text-left px-6 flex justify-between items-center group">
                                            <span>Manage Multi-Factor Authentication</span>
                                            <Globe className="h-5 w-5 text-gray-600 group-hover:text-white transition-colors" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Fallback for other tabs */}
                            {['system', 'appearance', 'notifications'].includes(activeTab) && (
                                <div className="py-20 text-center animate-fade-in-up">
                                    <div className="h-20 w-20 bg-brand/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Settings className="h-10 w-10 text-brand/30" />
                                    </div>
                                    <p className="text-white font-bold text-xl uppercase tracking-tighter">Advanced Control Panel</p>
                                    <p className="text-gray-500 mt-2 max-w-sm mx-auto font-medium">This module is currently initializing in your region. Contact Shelfcure Enterprise for activation.</p>
                                </div>
                            )}

                            <div className="pt-6">
                                <button
                                    type="submit"
                                    disabled={updating || !['profile', 'appearance'].includes(activeTab)}
                                    className={cn(
                                        "px-10 py-5 rounded-2xl font-black text-white transition-all flex items-center gap-3 transform active:scale-95 shadow-2xl",
                                        updating
                                            ? "bg-brand/50 cursor-not-allowed"
                                            : "bg-brand hover:opacity-90 brand-glow",
                                        !['profile', 'appearance'].includes(activeTab) && "opacity-30 cursor-not-allowed grayscale"
                                    )}
                                >
                                    {updating ? (
                                        <div className="h-5 w-5 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Save className="h-5 w-5" />
                                    )}
                                    Update Configuration
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
