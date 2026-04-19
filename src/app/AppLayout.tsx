'use client';

import { Sidebar } from '@/components/Sidebar';
import { usePathname } from 'next/navigation';

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isLoginPage = pathname === '/login';

    if (isLoginPage) return <>{children}</>;

    return (
        <div className="flex min-h-screen bg-[#0a0a0a]">
            <Sidebar />
            <main className="flex-1 ml-64 min-h-screen">
                {children}
            </main>
        </div>
    );
}
