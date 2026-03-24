import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

export function Layout({ children }: { children: ReactNode }) {
    return (
        <div className="flex h-screen overflow-hidden">
            {/* Desktop sidebar */}
            <div className="hidden md:block">
                <Sidebar />
            </div>

            <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-6 md:pb-6">
                {children}
            </main>

            {/* Mobile bottom nav */}
            <BottomNav />
        </div>
    );
}
