import { useFarmStore } from '../store/farmStore';
import { NAV_ITEMS } from './Sidebar';
import { cn } from '../lib/utils';

export function BottomNav() {
    const activePage = useFarmStore(s => s.activePage);
    const setActivePage = useFarmStore(s => s.setActivePage);

    return (
        <nav className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white md:hidden">
            <div className="flex justify-around">
                {NAV_ITEMS.map(({ page, label, icon: Icon }) => (
                    <button
                        key={page}
                        onClick={() => setActivePage(page)}
                        className={cn(
                            'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
                            activePage === page
                                ? 'text-farm-700'
                                : 'text-gray-400',
                        )}
                    >
                        <Icon className="h-5 w-5" />
                        {label}
                    </button>
                ))}
            </div>
            {/* Safe-area spacer for notched phones */}
            <div className="h-[env(safe-area-inset-bottom)]" />
        </nav>
    );
}
