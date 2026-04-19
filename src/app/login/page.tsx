'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn, ShieldCheck, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (searchParams.get('error') === 'unauthorized') {
            setError('Access Denied. You do not have Super Admin privileges.');
        }
    }, [searchParams]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            router.refresh();
            router.push('/');
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'Failed to login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md space-y-10 glass-morphism p-10 rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-fade-in-up brand-glow">
            <div className="text-center">
                <div className="mx-auto h-16 w-16 bg-brand/10 rounded-2xl flex items-center justify-center mb-6 brand-glow group cursor-default">
                    <ShieldCheck className="h-10 w-10 text-brand group-hover:scale-110 transition-transform duration-500" />
                </div>
                <h2 className="text-4xl font-black tracking-tighter text-white">Shelfcure</h2>
                <p className="mt-3 text-sm font-medium text-gray-500 uppercase tracking-widest">Master Admin Portal</p>
            </div>

            <form className="mt-10 space-y-8" onSubmit={handleLogin}>
                {error && (
                    <div className="bg-red-500/5 border border-red-500/20 p-5 rounded-2xl flex items-center gap-4 text-red-400 text-sm backdrop-blur-md animate-glow-pulse">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <p className="font-medium">{error}</p>
                    </div>
                )}

                <div className="space-y-5">
                    <div className="group">
                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Identity Gateway</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all text-white placeholder:text-gray-700 shadow-inner group-focus-within:border-brand/30"
                            placeholder="admin@shelfcure.com"
                        />
                    </div>
                    <div className="group">
                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Security Key</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all text-white placeholder:text-gray-700 shadow-inner group-focus-within:border-brand/30"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={cn(
                        "w-full bg-brand hover:opacity-90 text-white font-black text-lg py-5 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all transform active:scale-[0.97] brand-glow shadow-lg",
                        loading && "opacity-50 cursor-not-allowed"
                    )}
                >
                    {loading ? (
                        <div className="h-6 w-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <LogIn className="h-6 w-6" />
                            Initialize Access
                        </>
                    )}
                </button>

                <p className="text-center text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em] mt-8">
                    Protected by Shelfcure Cryptography
                </p>
            </form>
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white p-4">
            <Suspense fallback={
                <div className="animate-pulse bg-[#111] w-full max-w-md h-[500px] rounded-2xl border border-white/10" />
            }>
                <LoginForm />
            </Suspense>
        </div>
    );
}
