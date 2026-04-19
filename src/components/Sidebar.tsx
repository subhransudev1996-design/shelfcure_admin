'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    BarChart3,
    Users,
    Settings,
    LogOut,
    ShieldCheck,
    LayoutDashboard,
    CreditCard,
    Target,
    ClipboardList,
    Receipt,
    UserCircle,
    Key,
    Pill,
    LifeBuoy,
    ChevronDown,
    ChevronRight,
    Briefcase,
    Monitor
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
    {
        icon: Target,
        label: 'Sales Pipeline',
        submenus: [
            { icon: Target, label: 'Leads', href: '/leads' },
            { icon: ClipboardList, label: 'Follow-ups', href: '/followups' },
            { icon: BarChart3, label: 'Customers', href: '/pharmacies' },
        ]
    },
    { icon: Users, label: 'User Directory', href: '/users' },
    {
        icon: CreditCard,
        label: 'Finance & Sales',
        submenus: [
            { icon: CreditCard, label: 'Subscriptions', href: '/subscriptions' },
            { icon: ClipboardList, label: 'Sales Intelligence', href: '/sales-intelligence' },
            { icon: Receipt, label: 'Expenses', href: '/expenses' },
        ]
    },
    {
        icon: Monitor,
        label: 'Desktop',
        submenus: [
            { icon: Key, label: 'Licenses', href: '/licenses' },
        ]
    },
    {
        icon: Briefcase,
        label: 'Operations',
        submenus: [
            { icon: Pill, label: 'Master Medicines', href: '/master-medicines' },
            { icon: UserCircle, label: 'Staff & Salary', href: '/staff' },
            { icon: LifeBuoy, label: 'Support Engine', href: '/support' },
        ]
    },
    { icon: Settings, label: 'Settings', href: '/settings' },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const toggleMenu = (label: string) => {
        setOpenMenus(prev => ({
            ...prev,
            [label]: !prev[label]
        }));
    };

    // Auto-open menus that contain the active path
    React.useEffect(() => {
        menuItems.forEach(item => {
            if (item.submenus) {
                if (item.submenus.some(sub => sub.href === pathname)) {
                    setOpenMenus(prev => ({ ...prev, [item.label]: true }));
                }
            }
        });
    }, [pathname]);

    return (
        <div className="w-64 h-[calc(100vh-2rem)] glass-morphism m-4 rounded-2xl flex flex-col fixed left-0 top-0 z-50 shadow-2xl">
            <div className="p-6 overflow-y-auto overflow-x-hidden flex-1 scrollbar-none">
                <div className="flex items-center gap-3 text-brand mb-10 group cursor-default">
                    <div className="p-2 rounded-xl bg-brand/10 brand-glow group-hover:scale-110 transition-transform duration-500">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-white group-hover:tracking-wider transition-all duration-500">Shelfcure</span>
                </div>

                <nav className="space-y-2">
                    {menuItems.map((item) => {
                        const hasSubmenus = !!item.submenus;
                        const isActive = item.href ? pathname === item.href : item.submenus?.some(sub => sub.href === pathname);
                        const isOpen = openMenus[item.label];

                        return (
                            <div key={item.label} className="space-y-1">
                                {hasSubmenus ? (
                                    <button
                                        onClick={() => toggleMenu(item.label)}
                                        className={cn(
                                            "flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                                            isActive && !isOpen
                                                ? "bg-brand/10 text-brand brand-glow"
                                                : "text-gray-400 hover:text-white hover:bg-white/5"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className={cn(
                                                "h-5 w-5 transition-transform duration-300 group-hover:scale-110",
                                                isActive && !isOpen ? "text-brand" : "group-hover:text-white"
                                            )} />
                                            <span className="font-medium">{item.label}</span>
                                        </div>
                                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    </button>
                                ) : (
                                    <Link
                                        href={item.href!}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                                            isActive
                                                ? "bg-brand/10 text-brand brand-glow"
                                                : "text-gray-400 hover:text-white hover:bg-white/5"
                                        )}
                                    >
                                        {isActive && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand rounded-full shadow-[0_0_10px_#4cba49]" />
                                        )}
                                        <item.icon className={cn(
                                            "h-5 w-5 transition-transform duration-300 group-hover:scale-110",
                                            isActive ? "text-brand" : "group-hover:text-white"
                                        )} />
                                        <span className="font-medium">{item.label}</span>
                                    </Link>
                                )}

                                {hasSubmenus && isOpen && (
                                    <div className="pl-4 space-y-1 mt-1">
                                        {item.submenus!.map((sub) => {
                                            const isSubActive = pathname === sub.href;
                                            return (
                                                <Link
                                                    key={sub.href}
                                                    href={sub.href}
                                                    className={cn(
                                                        "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group relative overflow-hidden",
                                                        isSubActive
                                                            ? "bg-brand/10 text-brand brand-glow"
                                                            : "text-gray-400 hover:text-white hover:bg-white/5"
                                                    )}
                                                >
                                                    {isSubActive && (
                                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand rounded-full shadow-[0_0_10px_#4cba49]" />
                                                    )}
                                                    <sub.icon className={cn(
                                                        "h-4 w-4 transition-transform duration-300 group-hover:scale-110",
                                                        isSubActive ? "text-brand" : "group-hover:text-white"
                                                    )} />
                                                    <span className="font-medium text-sm">{sub.label}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>
            </div>

            <div className="p-6 border-t border-white/10 shrink-0">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-400/5 transition-all group"
                >
                    <LogOut className="h-5 w-5 group-hover:text-red-400" />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
}
