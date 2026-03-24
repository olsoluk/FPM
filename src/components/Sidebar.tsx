import {
    Settings, Wheat, LayoutDashboard, TrendingUp, Truck, Database,
} from 'lucide-react';
import { useFarmStore, type Page } from '../store/farmStore';
import { cn } from '../lib/utils';

const NAV_ITEMS: { page: Page; label: string; icon: typeof Settings }[] = [
    { page: 'setup', label: 'Farm Setup', icon: Settings },
    { page: 'production', label: 'Crop Production', icon: Wheat },
    { page: 'summary', label: 'Summary', icon: LayoutDashboard },
    { page: 'marketing', label: 'Marketing', icon: TrendingUp },
    { page: 'equipment', label: 'Equipment', icon: Truck },
    { page: 'data', label: 'Data', icon: Database },
];

export function Sidebar() {
    const activePage = useFarmStore(s => s.activePage);
    const setActivePage = useFarmStore(s => s.setActivePage);
    const farmName = useFarmStore(s => s.farm.name);

    return (
        <aside className="no-print flex w-60 flex-col border-r border-gray-200 bg-white">
            {/* Brand */}
            <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-farm-600 text-white font-bold text-sm">
                    FPM
                </div>
                <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-gray-900">
                        Farm Profit Manager
                    </div>
                    {farmName && (
                        <div className="truncate text-xs text-gray-500">{farmName}</div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-4">
                {NAV_ITEMS.map(({ page, label, icon: Icon }) => (
                    <button
                        key={page}
                        onClick={() => setActivePage(page)}
                        className={cn(
                            'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                            activePage === page
                                ? 'bg-farm-50 text-farm-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                        )}
                    >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        {label}
                    </button>
                ))}
            </nav>

            {/* Footer */}
            <div className="border-t border-gray-200 px-4 py-3">
                <div className="text-xs text-gray-400">v1.0.0 — Local storage</div>
            </div>
        </aside>
    );
}
