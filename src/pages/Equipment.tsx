import { useMemo, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, CellValueChangedEvent } from 'ag-grid-community';
import { Plus, Trash2 } from 'lucide-react';
import { useFarmStore } from '../store/farmStore';
import { formatCurrency, formatNumber } from '../lib/utils';
import { annualCostOfOwnership, totalAcres } from '../lib/calculations';
import type { Equipment as EquipmentType } from '../types';
import { EQUIPMENT_TYPES } from '../types';

export function Equipment() {
    const equipment = useFarmStore(s => s.equipment);
    const crops = useFarmStore(s => s.crops);
    const addEquipment = useFarmStore(s => s.addEquipment);
    const updateEquipment = useFarmStore(s => s.updateEquipment);
    const removeEquipment = useFarmStore(s => s.removeEquipment);

    const acres = totalAcres(crops);

    const totalAnnualCost = useMemo(
        () => equipment.reduce((sum, e) => sum + annualCostOfOwnership(e), 0),
        [equipment],
    );

    const columnDefs = useMemo<ColDef[]>(() => [
        { headerName: 'Name', field: 'name', editable: true, flex: 2, minWidth: 160 },
        {
            headerName: 'Type', field: 'type', editable: true, flex: 1, minWidth: 120,
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: { values: EQUIPMENT_TYPES.map(t => t.value) },
            valueFormatter: p => EQUIPMENT_TYPES.find(t => t.value === p.value)?.label ?? (p.value as string),
        },
        {
            headerName: 'Purchase Price', field: 'purchasePrice', editable: true, flex: 1, minWidth: 130,
            type: 'numericColumn',
            valueFormatter: p => formatCurrency(p.value as number),
            valueParser: p => Math.max(0, parseFloat(p.newValue as string) || 0),
        },
        {
            headerName: 'Current Value', field: 'currentValue', editable: true, flex: 1, minWidth: 130,
            type: 'numericColumn',
            valueFormatter: p => formatCurrency(p.value as number),
            valueParser: p => Math.max(0, parseFloat(p.newValue as string) || 0),
        },
        {
            headerName: 'Year Acquired', field: 'yearAcquired', editable: true, width: 120,
            type: 'numericColumn',
            valueParser: p => parseInt(p.newValue as string) || new Date().getFullYear(),
        },
        {
            headerName: 'Trade Year', field: 'plannedTradeYear', editable: true, width: 110,
            type: 'numericColumn',
            valueParser: p => parseInt(p.newValue as string) || new Date().getFullYear() + 5,
        },
        {
            headerName: 'Annual Cost', flex: 1, minWidth: 120, editable: false,
            type: 'numericColumn',
            valueGetter: p => p.data ? annualCostOfOwnership(p.data as EquipmentType) : 0,
            valueFormatter: p => formatCurrency(p.value as number),
            cellClass: 'font-medium',
        },
    ], []);

    const onCellValueChanged = useCallback(
        (event: CellValueChangedEvent) => {
            const data = event.data as EquipmentType;
            updateEquipment(data.id, { [event.colDef.field as string]: event.newValue });
        },
        [updateEquipment],
    );

    const handleAdd = () => {
        addEquipment({
            name: '',
            type: 'tractor',
            purchasePrice: 0,
            currentValue: 0,
            yearAcquired: new Date().getFullYear(),
            plannedTradeYear: new Date().getFullYear() + 5,
            annualCostOverride: null,
        });
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Machinery & Equipment</h1>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="metric-card">
                    <div className="text-xs font-medium text-gray-500">Total Pieces</div>
                    <div className="mt-1 text-lg font-bold text-gray-900">{equipment.length}</div>
                </div>
                <div className="metric-card">
                    <div className="text-xs font-medium text-gray-500">Total Current Value</div>
                    <div className="mt-1 text-lg font-bold text-gray-900">
                        {formatCurrency(equipment.reduce((s, e) => s + e.currentValue, 0))}
                    </div>
                </div>
                <div className="metric-card">
                    <div className="text-xs font-medium text-gray-500">Annual Ownership Cost</div>
                    <div className="mt-1 text-lg font-bold text-red-600">
                        {formatCurrency(totalAnnualCost)}
                    </div>
                </div>
                <div className="metric-card">
                    <div className="text-xs font-medium text-gray-500">Cost / Acre</div>
                    <div className="mt-1 text-lg font-bold text-gray-900">
                        {acres > 0 ? formatCurrency(totalAnnualCost / acres) : '—'}
                    </div>
                    <div className="text-[10px] text-gray-400">{formatNumber(acres)} total acres</div>
                </div>
            </div>

            {/* Equipment Grid */}
            <div className="card space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700">Equipment Inventory</h3>
                    <div className="flex gap-2">
                        {equipment.length > 0 && (
                            <button
                                onClick={() => {
                                    const last = equipment[equipment.length - 1];
                                    if (last) removeEquipment(last.id);
                                }}
                                className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                                title="Remove last item"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        )}
                        <button onClick={handleAdd} className="btn-primary text-xs py-1 px-3">
                            <Plus className="h-3.5 w-3.5" /> Add Equipment
                        </button>
                    </div>
                </div>
                <div className="ag-theme-quartz" style={{ height: Math.max(200, 52 + equipment.length * 36) }}>
                    <AgGridReact
                        rowData={equipment}
                        columnDefs={columnDefs}
                        onCellValueChanged={onCellValueChanged}
                        singleClickEdit
                        stopEditingWhenCellsLoseFocus
                        getRowId={(params) => (params.data as EquipmentType).id}
                        headerHeight={36}
                        rowHeight={36}
                    />
                </div>
            </div>

            {/* Explanation */}
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-xs text-blue-800">
                <strong>How annual cost is calculated:</strong> (Purchase Price − Current Value) ÷ Years of
                Ownership + 5% Return on Current Value. Enter your equipment, and the total cost/acre will
                feed into your Crop Production "Equipment/Fuel/Labor" line item. The per-pass cost builder
                for detailed allocation (planting, harvest, spraying, etc.) is coming in a future update.
            </div>
        </div>
    );
}
