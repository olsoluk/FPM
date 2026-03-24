import { useRef } from 'react';
import { Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { useFarmStore } from '../store/farmStore';
import { formatCurrency, formatNumber } from '../lib/utils';
import { DEFAULT_EXPENSE_CATEGORIES } from '../types';
import {
    totalAcres, farmTotalIncome, farmTotalExpenses, farmTotalRevenue, farmROI,
    weightedExpensePerAcre, totalExpenseForCategory,
    totalExpensesPerAcre, grossIncomePerAcre, revenuePerAcre, marginPercent,
    grossIncome, totalExpenses,
} from '../lib/calculations';

export function Summary() {
    const farm = useFarmStore(s => s.farm);
    const crops = useFarmStore(s => s.crops);
    const setActivePage = useFarmStore(s => s.setActivePage);
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({ contentRef: printRef });

    if (crops.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <p className="text-gray-500">No crops defined. Set up your farm first.</p>
                <button onClick={() => setActivePage('setup')} className="btn-primary mt-4">
                    Go to Farm Setup
                </button>
            </div>
        );
    }

    const acres = totalAcres(crops);
    const income = farmTotalIncome(crops);
    const expenses = farmTotalExpenses(crops);
    const rev = farmTotalRevenue(crops);
    const roi = farmROI(crops);

    return (
        <div className="space-y-4">
            <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Income & Expense Summary</h1>
                <button onClick={() => handlePrint()} className="btn-secondary self-start">
                    <Printer className="h-4 w-4" />
                    Print / PDF
                </button>
            </div>

            <div ref={printRef} className="space-y-6 bg-white p-4">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between border-b border-gray-200 pb-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">INCOME & EXPENSE SUMMARY</h2>
                        <div className="text-sm text-gray-500">{farm.name} — {farm.year}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                        <span className="font-medium text-gray-600">Total Acres</span>
                        <span className="text-right font-semibold">{formatNumber(acres)}</span>
                        <span className="font-medium text-gray-600">Total Income</span>
                        <span className="text-right font-semibold text-green-700">{formatCurrency(income)}</span>
                        <span className="font-medium text-gray-600">Total Expense</span>
                        <span className="text-right font-semibold text-red-700">{formatCurrency(expenses)}</span>
                        <span className="font-medium text-gray-600">Total Revenue</span>
                        <span className="text-right font-semibold">{formatCurrency(rev)}</span>
                        <span className="font-medium text-gray-600">Revenue / Acre</span>
                        <span className="text-right font-semibold">
                            {acres > 0 ? formatCurrency(rev / acres) : '$0.00'}
                        </span>
                        <span className="font-medium text-gray-600">ROI</span>
                        <span className="text-right font-semibold">{(roi * 100).toFixed(2)}%</span>
                    </div>
                </div>

                {/* Expense Breakdown Grid */}
                <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                        <thead>
                            <tr className="border-b-2 border-gray-300">
                                <th className="py-2 pr-3 text-left font-semibold text-gray-600">ACRES</th>
                                {crops.map(c => (
                                    <th
                                        key={c.id}
                                        className="px-3 py-2 text-center font-semibold"
                                        colSpan={1}
                                    >
                                        <div className="flex items-center justify-center gap-1">
                                            <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: c.color }} />
                                            <span>{c.name}</span>
                                        </div>
                                        <div className="text-[10px] font-normal text-gray-400">
                                            {formatNumber(c.acres)} ac
                                        </div>
                                    </th>
                                ))}
                                <th className="px-3 py-2 text-center font-semibold text-gray-700">
                                    Wtd Avg
                                    <div className="text-[10px] font-normal text-gray-400">$/Acre</div>
                                </th>
                                <th className="px-3 py-2 text-right font-semibold text-gray-700">
                                    Total $
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {DEFAULT_EXPENSE_CATEGORIES.map(cat => (
                                <tr key={cat} className="hover:bg-gray-50">
                                    <td className="py-1.5 pr-3 font-medium text-gray-700">{cat}</td>
                                    {crops.map(c => {
                                        const exp = c.expenses.find(e => e.category === cat);
                                        return (
                                            <td key={c.id} className="px-3 py-1.5 text-right tabular-nums">
                                                {formatCurrency(exp?.amountPerAcre ?? 0)}
                                            </td>
                                        );
                                    })}
                                    <td className="px-3 py-1.5 text-right font-medium tabular-nums text-gray-700">
                                        {formatCurrency(weightedExpensePerAcre(crops, cat))}
                                    </td>
                                    <td className="px-3 py-1.5 text-right tabular-nums">
                                        {formatCurrency(totalExpenseForCategory(crops, cat))}
                                    </td>
                                </tr>
                            ))}

                            {/* Separator */}
                            <tr className="border-t-2 border-gray-300 font-semibold">
                                <td className="py-2 pr-3 text-gray-900">Total Expenses</td>
                                {crops.map(c => (
                                    <td key={c.id} className="px-3 py-2 text-right tabular-nums text-red-700">
                                        {formatCurrency(totalExpenses(c))}
                                    </td>
                                ))}
                                <td className="px-3 py-2 text-right tabular-nums text-red-700">
                                    {acres > 0 ? formatCurrency(expenses / acres) : '$0.00'}
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums text-red-700">
                                    {formatCurrency(expenses)}
                                </td>
                            </tr>
                            <tr className="font-semibold">
                                <td className="py-2 pr-3 text-gray-900">Total Income</td>
                                {crops.map(c => (
                                    <td key={c.id} className="px-3 py-2 text-right tabular-nums text-green-700">
                                        {formatCurrency(grossIncome(c))}
                                    </td>
                                ))}
                                <td className="px-3 py-2 text-right tabular-nums text-green-700">
                                    {acres > 0 ? formatCurrency(income / acres) : '$0.00'}
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums text-green-700">
                                    {formatCurrency(income)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Per-Crop Summary Cards */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {crops.map(c => (
                        <div
                            key={c.id}
                            className="rounded-lg border-2 p-3"
                            style={{ borderColor: c.color }}
                        >
                            <div className="mb-2 text-sm font-bold" style={{ color: c.color }}>
                                {c.name}
                            </div>
                            <div className="space-y-1 text-xs">
                                <Row label="Income/Acre" value={formatCurrency(grossIncomePerAcre(c))} />
                                <Row label="Expense/Acre" value={formatCurrency(totalExpensesPerAcre(c))} />
                                <Row label="Revenue/Acre" value={formatCurrency(revenuePerAcre(c))} />
                                <Row label="Margin" value={`${(marginPercent(c) * 100).toFixed(1)}%`} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Print footer */}
                <div className="print-only text-center text-[10px] text-gray-400">
                    Generated by Farm Profit Manager — {new Date().toLocaleDateString()}
                </div>
            </div>
        </div>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between">
            <span className="text-gray-500">{label}</span>
            <span className="font-semibold text-gray-800">{value}</span>
        </div>
    );
}
