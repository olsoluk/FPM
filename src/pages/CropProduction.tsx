import { useMemo, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, CellValueChangedEvent } from 'ag-grid-community';
import { useFarmStore } from '../store/farmStore';
import { formatCurrency, formatNumber, cn } from '../lib/utils';
import {
    totalExpensesPerAcre, totalExpenses, grossIncomePerAcre, grossIncome,
    revenuePerAcre, revenue, marginPercent, costPerBushel,
} from '../lib/calculations';

export function CropProduction() {
    const crops = useFarmStore(s => s.crops);
    const activeCropId = useFarmStore(s => s.activeCropId);
    const setActiveCropId = useFarmStore(s => s.setActiveCropId);
    const updateExpense = useFarmStore(s => s.updateExpense);
    const updateCrop = useFarmStore(s => s.updateCrop);
    const setActivePage = useFarmStore(s => s.setActivePage);

    const crop = crops.find(c => c.id === activeCropId);

    const columnDefs = useMemo<ColDef[]>(() => {
        if (!crop) return [];
        return [
            {
                headerName: 'Category',
                field: 'category',
                editable: false,
                flex: 2,
                minWidth: 180,
                cellClass: 'font-medium',
            },
            {
                headerName: '$/Acre',
                field: 'amountPerAcre',
                editable: true,
                flex: 1,
                minWidth: 120,
                type: 'numericColumn',
                valueFormatter: (p) => formatCurrency(p.value as number),
                valueParser: (p) => {
                    const v = parseFloat(p.newValue as string);
                    return isNaN(v) ? 0 : Math.max(0, v);
                },
                cellClass: 'text-right',
            },
            {
                headerName: '$/Bushel',
                flex: 1,
                minWidth: 120,
                editable: false,
                type: 'numericColumn',
                valueGetter: (p) => {
                    if (!p.data) return 0;
                    return costPerBushel(
                        (p.data as { amountPerAcre: number }).amountPerAcre,
                        crop.projectedYield,
                    );
                },
                valueFormatter: (p) => `$${(p.value as number).toFixed(2)}`,
                cellClass: 'text-right text-gray-500',
            },
            {
                headerName: 'Total $',
                flex: 1,
                minWidth: 140,
                editable: false,
                type: 'numericColumn',
                valueGetter: (p) => {
                    if (!p.data) return 0;
                    return (p.data as { amountPerAcre: number }).amountPerAcre * crop.acres;
                },
                valueFormatter: (p) => formatCurrency(p.value as number),
                cellClass: 'text-right text-gray-500',
            },
        ];
    }, [crop]);

    const onCellValueChanged = useCallback(
        (event: CellValueChangedEvent) => {
            if (!crop) return;
            const data = event.data as { id: string; amountPerAcre: number };
            if (event.colDef.field === 'amountPerAcre') {
                updateExpense(crop.id, data.id, data.amountPerAcre);
            }
        },
        [crop, updateExpense],
    );

    if (crops.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <p className="text-gray-500">No crops defined yet.</p>
                <button onClick={() => setActivePage('setup')} className="btn-primary mt-4">
                    Go to Farm Setup
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Crop Production</h1>

            {/* Crop Tabs */}
            <div className="flex gap-2 overflow-x-auto border-b border-gray-200 pb-0 -mx-4 px-4 md:mx-0 md:px-0">
                {crops.map(c => (
                    <button
                        key={c.id}
                        onClick={() => setActiveCropId(c.id)}
                        className={cn(
                            'flex items-center gap-2 rounded-t-md border border-b-0 px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap',
                            c.id === activeCropId
                                ? 'border-gray-200 bg-white text-gray-900 -mb-px'
                                : 'border-transparent bg-gray-100 text-gray-500 hover:text-gray-700',
                        )}
                    >
                        <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: c.color }} />
                        {c.name}
                    </button>
                ))}
            </div>

            {crop && (
                <>
                    {/* Crop Info Bar */}
                    <div className="card flex flex-wrap items-center gap-4 md:gap-6">
                        <InfoItem label="Acres" value={formatNumber(crop.acres)} />
                        <InfoItem label="Projected Yield" value={`${formatNumber(crop.projectedYield)} bu/ac`} />
                        <InfoItem label="Projected Price" value={formatCurrency(crop.projectedPrice)} suffix="/bu" />
                        <InfoItem
                            label="Projected Production"
                            value={`${formatNumber(crop.acres * crop.projectedYield)} bu`}
                        />
                        <InfoItem
                            label="Projected Income"
                            value={formatCurrency(grossIncome(crop))}
                            highlight
                        />
                        <div className="w-full sm:w-auto sm:ml-auto flex items-center gap-2">
                            <label className="text-xs text-gray-500">Addl Income</label>
                            <input
                                type="number"
                                step="100"
                                className="input-field w-28 text-right text-sm"
                                value={crop.additionalIncome || ''}
                                onChange={e => updateCrop(crop.id, {
                                    additionalIncome: parseFloat(e.target.value) || 0,
                                })}
                                placeholder="$0"
                            />
                        </div>
                    </div>

                    {/* AG Grid Expense Table */}
                    <div className="ag-theme-quartz" style={{ height: 520 }}>
                        <AgGridReact
                            rowData={crop.expenses}
                            columnDefs={columnDefs}
                            onCellValueChanged={onCellValueChanged}
                            singleClickEdit
                            stopEditingWhenCellsLoseFocus
                            getRowId={(params) => (params.data as { id: string }).id}
                            domLayout="normal"
                            headerHeight={36}
                            rowHeight={36}
                        />
                    </div>

                    {/* Totals & Summary */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                        <MetricCard
                            label="Total Expenses"
                            value={formatCurrency(totalExpenses(crop))}
                            sub={`${formatCurrency(totalExpensesPerAcre(crop))}/ac`}
                            color="red"
                        />
                        <MetricCard
                            label="Total Income"
                            value={formatCurrency(grossIncome(crop))}
                            sub={`${formatCurrency(grossIncomePerAcre(crop))}/ac`}
                            color="green"
                        />
                        <MetricCard
                            label="Revenue"
                            value={formatCurrency(revenue(crop))}
                            sub={`${formatCurrency(revenuePerAcre(crop))}/ac`}
                            color={revenue(crop) >= 0 ? 'green' : 'red'}
                        />
                        <MetricCard
                            label="Cost / Bushel"
                            value={`$${costPerBushel(totalExpensesPerAcre(crop), crop.projectedYield).toFixed(2)}`}
                            sub="total expenses"
                        />
                        <MetricCard
                            label="Income / Acre"
                            value={formatCurrency(grossIncomePerAcre(crop))}
                        />
                        <MetricCard
                            label="Margin"
                            value={`${(marginPercent(crop) * 100).toFixed(1)}%`}
                            color={marginPercent(crop) >= 0 ? 'green' : 'red'}
                        />
                    </div>
                </>
            )}
        </div>
    );
}

function InfoItem({
    label,
    value,
    suffix,
    highlight,
}: {
    label: string;
    value: string;
    suffix?: string;
    highlight?: boolean;
}) {
    return (
        <div>
            <div className="text-xs text-gray-500">{label}</div>
            <div className={cn('text-sm font-semibold', highlight ? 'text-farm-700' : 'text-gray-900')}>
                {value}
                {suffix && <span className="font-normal text-gray-400">{suffix}</span>}
            </div>
        </div>
    );
}

function MetricCard({
    label,
    value,
    sub,
    color,
}: {
    label: string;
    value: string;
    sub?: string;
    color?: 'green' | 'red';
}) {
    return (
        <div className="metric-card">
            <div className="text-xs font-medium text-gray-500">{label}</div>
            <div
                className={cn(
                    'mt-1 text-lg font-bold',
                    color === 'green' && 'text-green-600',
                    color === 'red' && 'text-red-600',
                    !color && 'text-gray-900',
                )}
            >
                {value}
            </div>
            {sub && <div className="text-xs text-gray-400">{sub}</div>}
        </div>
    );
}
