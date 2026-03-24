import { useMemo, useCallback, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, CellValueChangedEvent } from 'ag-grid-community';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Plus, Trash2 } from 'lucide-react';
import { useFarmStore } from '../store/farmStore';
import { formatCurrency, formatNumber, cn } from '../lib/utils';
import {
    totalBushelsSold, averageSalePrice, totalSaleRevenue, percentOfProductionSold,
    generateBreakEvenData, totalExpensesPerAcre,
} from '../lib/calculations';
import type { Sale } from '../types';

export function Marketing() {
    const crops = useFarmStore(s => s.crops);
    const sales = useFarmStore(s => s.sales);
    const activeCropId = useFarmStore(s => s.activeCropId);
    const setActiveCropId = useFarmStore(s => s.setActiveCropId);
    const addSale = useFarmStore(s => s.addSale);
    const updateSale = useFarmStore(s => s.updateSale);
    const removeSale = useFarmStore(s => s.removeSale);
    const setActivePage = useFarmStore(s => s.setActivePage);

    const [targetROI, setTargetROI] = useState(0.10);

    const crop = crops.find(c => c.id === activeCropId);
    const cropSales = useMemo(
        () => sales.filter(s => crop && s.cropId === crop.id),
        [sales, crop],
    );

    const columnDefs = useMemo<ColDef[]>(() => [
        { headerName: 'Date', field: 'date', editable: true, flex: 1, minWidth: 110 },
        { headerName: 'Vendor', field: 'vendor', editable: true, flex: 1.5, minWidth: 120 },
        {
            headerName: 'Bushels', field: 'bushels', editable: true, flex: 1, minWidth: 100,
            type: 'numericColumn',
            valueFormatter: p => formatNumber(p.value as number),
            valueParser: p => Math.max(0, parseFloat(p.newValue as string) || 0),
        },
        {
            headerName: 'Price ($/bu)', field: 'price', editable: true, flex: 1, minWidth: 110,
            type: 'numericColumn',
            valueFormatter: p => `$${(p.value as number).toFixed(2)}`,
            valueParser: p => parseFloat(p.newValue as string) || 0,
        },
        {
            headerName: 'Hedge +/-', field: 'hedgeAdjustment', editable: true, flex: 0.8, minWidth: 100,
            type: 'numericColumn',
            valueFormatter: p => {
                const v = p.value as number;
                return v === 0 ? '$0.00' : `${v > 0 ? '+' : ''}$${v.toFixed(2)}`;
            },
            valueParser: p => parseFloat(p.newValue as string) || 0,
        },
        {
            headerName: 'Net Price', flex: 0.8, minWidth: 100, editable: false,
            type: 'numericColumn',
            valueGetter: p => {
                if (!p.data) return 0;
                const d = p.data as Sale;
                return d.price + d.hedgeAdjustment;
            },
            valueFormatter: p => `$${(p.value as number).toFixed(2)}`,
            cellClass: 'font-medium',
        },
        {
            headerName: 'Total $', flex: 1, minWidth: 120, editable: false,
            type: 'numericColumn',
            valueGetter: p => {
                if (!p.data) return 0;
                const d = p.data as Sale;
                return d.bushels * (d.price + d.hedgeAdjustment);
            },
            valueFormatter: p => formatCurrency(p.value as number),
        },
        { headerName: 'Comments', field: 'comments', editable: true, flex: 1.5, minWidth: 120 },
        {
            headerName: 'Done', field: 'isComplete', editable: true, width: 70,
            cellDataType: 'boolean',
        },
    ], []);

    const onCellValueChanged = useCallback(
        (event: CellValueChangedEvent) => {
            const data = event.data as Sale;
            updateSale(data.id, { [event.colDef.field as string]: event.newValue });
        },
        [updateSale],
    );

    const handleAddSale = () => {
        if (!crop) return;
        addSale({
            cropId: crop.id,
            date: new Date().toISOString().slice(0, 10),
            vendor: '',
            bushels: 0,
            price: crop.projectedPrice,
            hedgeAdjustment: 0,
            comments: '',
            isComplete: false,
        });
    };

    const breakEvenData = useMemo(() => {
        if (!crop) return [];
        return generateBreakEvenData(crop, targetROI);
    }, [crop, targetROI]);

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
            <h1 className="text-2xl font-bold text-gray-900">Marketing & Sales</h1>

            {/* Crop Tabs */}
            <div className="flex gap-2 overflow-x-auto border-b border-gray-200 -mx-4 px-4 md:mx-0 md:px-0">
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
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <SummaryCard
                            label="Bushels Sold"
                            value={formatNumber(totalBushelsSold(cropSales))}
                            sub={`of ${formatNumber(crop.acres * crop.projectedYield)} projected`}
                        />
                        <SummaryCard
                            label="% Sold"
                            value={`${(percentOfProductionSold(crop, cropSales) * 100).toFixed(1)}%`}
                        />
                        <SummaryCard
                            label="Avg Price"
                            value={`$${averageSalePrice(cropSales).toFixed(2)}`}
                            sub="net of hedge adj."
                        />
                        <SummaryCard
                            label="Revenue Booked"
                            value={formatCurrency(totalSaleRevenue(cropSales))}
                            sub={`of ${formatCurrency(crop.acres * crop.projectedYield * crop.projectedPrice)} projected`}
                        />
                    </div>

                    {/* Sales Grid */}
                    <div className="card space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-700">Sales Log</h3>
                            <div className="flex gap-2">
                                {cropSales.length > 0 && (
                                    <button
                                        onClick={() => {
                                            const last = cropSales[cropSales.length - 1];
                                            if (last) removeSale(last.id);
                                        }}
                                        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                                        title="Remove last sale"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                                <button onClick={handleAddSale} className="btn-primary text-xs py-1 px-3">
                                    <Plus className="h-3.5 w-3.5" /> Add Sale
                                </button>
                            </div>
                        </div>
                        <div className="ag-theme-quartz" style={{ height: Math.min(300, 52 + cropSales.length * 36) }}>
                            <AgGridReact
                                rowData={cropSales}
                                columnDefs={columnDefs}
                                onCellValueChanged={onCellValueChanged}
                                singleClickEdit
                                stopEditingWhenCellsLoseFocus
                                getRowId={(params) => (params.data as Sale).id}
                                headerHeight={36}
                                rowHeight={36}
                            />
                        </div>
                    </div>

                    {/* Break-Even Chart */}
                    <div className="card">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-700">Break-Even Analysis</h3>
                            <div className="flex items-center gap-2 text-xs">
                                <label className="text-gray-500">Target ROI %</label>
                                <input
                                    type="number"
                                    className="input-field w-20 text-right text-xs"
                                    value={Math.round(targetROI * 100)}
                                    onChange={e => setTargetROI((parseFloat(e.target.value) || 0) / 100)}
                                />
                            </div>
                        </div>
                        <div className="text-xs text-gray-500 mb-2">
                            Break-even: ${totalExpensesPerAcre(crop).toFixed(2)}/ac ÷ yield
                            &nbsp;|&nbsp; Current price: {formatCurrency(crop.projectedPrice)}/bu
                        </div>
                        <ResponsiveContainer width="100%" height={320}>
                            <LineChart data={breakEvenData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="yield"
                                    label={{ value: 'Yield (bu/ac)', position: 'insideBottomRight', offset: -5, fontSize: 11 }}
                                    tick={{ fontSize: 11 }}
                                />
                                <YAxis
                                    label={{ value: '$/bu', angle: -90, position: 'insideLeft', fontSize: 11 }}
                                    tick={{ fontSize: 11 }}
                                    tickFormatter={v => `$${(v as number).toFixed(2)}`}
                                />
                                <Tooltip
                                    formatter={(value: number, name: string) => [`$${value.toFixed(2)}`, name]}
                                    labelFormatter={l => `Yield: ${l} bu/ac`}
                                />
                                <Legend verticalAlign="top" height={30} />
                                <Line
                                    type="monotone" dataKey="breakEvenPrice" name="Break Even"
                                    stroke="#EF4444" strokeWidth={2} dot={false}
                                />
                                <Line
                                    type="monotone" dataKey="targetPrice" name={`Target (${Math.round(targetROI * 100)}% ROI)`}
                                    stroke="#F97316" strokeWidth={2} strokeDasharray="6 3" dot={false}
                                />
                                <Line
                                    type="monotone" dataKey="marketPrice" name="Market Price"
                                    stroke="#22C55E" strokeWidth={2} dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )}
        </div>
    );
}

function SummaryCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <div className="metric-card">
            <div className="text-xs font-medium text-gray-500">{label}</div>
            <div className="mt-1 text-lg font-bold text-gray-900">{value}</div>
            {sub && <div className="text-[10px] text-gray-400">{sub}</div>}
        </div>
    );
}
