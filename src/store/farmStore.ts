import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FarmProfile, Crop, Sale, Equipment, Pass, Snapshot, ExpenseLineItem } from '../types';
import { DEFAULT_EXPENSE_CATEGORIES, CROP_COLORS } from '../types';
import { uid } from '../lib/utils';

// ── Helpers ──

function makeDefaultExpenses(): ExpenseLineItem[] {
    return DEFAULT_EXPENSE_CATEGORIES.map(category => ({
        id: uid(),
        category,
        amountPerAcre: 0,
    }));
}

function nextColor(crops: Crop[]): string {
    const used = new Set(crops.map(c => c.color));
    return CROP_COLORS.find(c => !used.has(c)) ?? CROP_COLORS[crops.length % CROP_COLORS.length]!;
}

// ── Store types ──

export type Page = 'setup' | 'production' | 'summary' | 'marketing' | 'equipment' | 'data';

interface FarmState {
    farm: FarmProfile;
    crops: Crop[];
    sales: Sale[];
    equipment: Equipment[];
    passes: Pass[];
    snapshots: Snapshot[];
    activePage: Page;
    activeCropId: string | null;
}

interface FarmActions {
    // Farm
    updateFarm: (updates: Partial<FarmProfile>) => void;

    // Crops
    addCrop: (name: string, acres: number, projectedYield: number, projectedPrice: number) => void;
    updateCrop: (id: string, updates: Partial<Omit<Crop, 'id' | 'expenses'>>) => void;
    removeCrop: (id: string) => void;
    updateExpense: (cropId: string, expenseId: string, amountPerAcre: number) => void;

    // Sales
    addSale: (sale: Omit<Sale, 'id'>) => void;
    updateSale: (id: string, updates: Partial<Sale>) => void;
    removeSale: (id: string) => void;

    // Equipment
    addEquipment: (equip: Omit<Equipment, 'id'>) => void;
    updateEquipment: (id: string, updates: Partial<Equipment>) => void;
    removeEquipment: (id: string) => void;

    // Passes
    addPass: (pass: Omit<Pass, 'id'>) => void;
    updatePass: (id: string, updates: Partial<Pass>) => void;
    removePass: (id: string) => void;

    // Navigation
    setActivePage: (page: Page) => void;
    setActiveCropId: (id: string | null) => void;

    // Snapshots & import/export
    saveSnapshot: (label: string) => void;
    loadSnapshot: (id: string) => void;
    deleteSnapshot: (id: string) => void;
    exportJSON: () => string;
    importJSON: (json: string) => boolean;
    loadExampleData: () => void;
    resetAll: () => void;
}

type FarmStore = FarmState & FarmActions;

const INITIAL_STATE: FarmState = {
    farm: { name: '', year: new Date().getFullYear(), notes: '' },
    crops: [],
    sales: [],
    equipment: [],
    passes: [],
    snapshots: [],
    activePage: 'setup',
    activeCropId: null,
};

export const useFarmStore = create<FarmStore>()(
    persist(
        (set, get) => ({
            ...INITIAL_STATE,

            // ── Farm ──
            updateFarm: (updates) =>
                set(state => ({ farm: { ...state.farm, ...updates } })),

            // ── Crops ──
            addCrop: (name, acres, projectedYield, projectedPrice) => {
                const crop: Crop = {
                    id: uid(),
                    name,
                    acres,
                    projectedYield,
                    projectedPrice,
                    color: nextColor(get().crops),
                    expenses: makeDefaultExpenses(),
                    additionalIncome: 0,
                };
                set(state => ({
                    crops: [...state.crops, crop],
                    activeCropId: state.activeCropId ?? crop.id,
                }));
            },

            updateCrop: (id, updates) =>
                set(state => ({
                    crops: state.crops.map(c => (c.id === id ? { ...c, ...updates } : c)),
                })),

            removeCrop: (id) =>
                set(state => ({
                    crops: state.crops.filter(c => c.id !== id),
                    sales: state.sales.filter(s => s.cropId !== id),
                    activeCropId: state.activeCropId === id
                        ? (state.crops.find(c => c.id !== id)?.id ?? null)
                        : state.activeCropId,
                })),

            updateExpense: (cropId, expenseId, amountPerAcre) =>
                set(state => ({
                    crops: state.crops.map(c =>
                        c.id === cropId
                            ? {
                                ...c,
                                expenses: c.expenses.map(e =>
                                    e.id === expenseId ? { ...e, amountPerAcre } : e,
                                ),
                            }
                            : c,
                    ),
                })),

            // ── Sales ──
            addSale: (sale) =>
                set(state => ({ sales: [...state.sales, { ...sale, id: uid() }] })),

            updateSale: (id, updates) =>
                set(state => ({
                    sales: state.sales.map(s => (s.id === id ? { ...s, ...updates } : s)),
                })),

            removeSale: (id) =>
                set(state => ({ sales: state.sales.filter(s => s.id !== id) })),

            // ── Equipment ──
            addEquipment: (equip) =>
                set(state => ({ equipment: [...state.equipment, { ...equip, id: uid() }] })),

            updateEquipment: (id, updates) =>
                set(state => ({
                    equipment: state.equipment.map(e => (e.id === id ? { ...e, ...updates } : e)),
                })),

            removeEquipment: (id) =>
                set(state => ({
                    equipment: state.equipment.filter(e => e.id !== id),
                    passes: state.passes.map(p => ({
                        ...p,
                        equipmentIds: p.equipmentIds.filter(eid => eid !== id),
                    })),
                })),

            // ── Passes ──
            addPass: (pass) =>
                set(state => ({ passes: [...state.passes, { ...pass, id: uid() }] })),

            updatePass: (id, updates) =>
                set(state => ({
                    passes: state.passes.map(p => (p.id === id ? { ...p, ...updates } : p)),
                })),

            removePass: (id) =>
                set(state => ({ passes: state.passes.filter(p => p.id !== id) })),

            // ── Navigation ──
            setActivePage: (page) => set({ activePage: page }),
            setActiveCropId: (id) => set({ activeCropId: id }),

            // ── Snapshots ──
            saveSnapshot: (label) => {
                const state = get();
                const snapshot: Snapshot = {
                    id: uid(),
                    date: new Date().toISOString(),
                    label,
                    farm: state.farm,
                    crops: state.crops,
                    sales: state.sales,
                    equipment: state.equipment,
                    passes: state.passes,
                };
                set(state => ({ snapshots: [...state.snapshots, snapshot] }));
            },

            loadSnapshot: (id) => {
                const snapshot = get().snapshots.find(s => s.id === id);
                if (!snapshot) return;
                set({
                    farm: snapshot.farm,
                    crops: snapshot.crops,
                    sales: snapshot.sales,
                    equipment: snapshot.equipment,
                    passes: snapshot.passes,
                });
            },

            deleteSnapshot: (id) =>
                set(state => ({ snapshots: state.snapshots.filter(s => s.id !== id) })),

            // ── Import / Export ──
            exportJSON: () => {
                const state = get();
                return JSON.stringify({
                    version: 1,
                    exportedAt: new Date().toISOString(),
                    farm: state.farm,
                    crops: state.crops,
                    sales: state.sales,
                    equipment: state.equipment,
                    passes: state.passes,
                    snapshots: state.snapshots,
                }, null, 2);
            },

            importJSON: (json) => {
                try {
                    const data = JSON.parse(json) as Record<string, unknown>;
                    if (!data || typeof data !== 'object') return false;
                    const d = data as {
                        farm?: FarmProfile;
                        crops?: Crop[];
                        sales?: Sale[];
                        equipment?: Equipment[];
                        passes?: Pass[];
                        snapshots?: Snapshot[];
                    };
                    set({
                        farm: d.farm ?? INITIAL_STATE.farm,
                        crops: d.crops ?? [],
                        sales: d.sales ?? [],
                        equipment: d.equipment ?? [],
                        passes: d.passes ?? [],
                        snapshots: d.snapshots ?? [],
                    });
                    return true;
                } catch {
                    return false;
                }
            },

            // ── Example Data ──
            loadExampleData: () => {
                const cornId = uid();
                const beanId = uid();
                set({
                    farm: { name: 'Your Farms', year: 2023, notes: '2022-2023 System' },
                    crops: [
                        {
                            id: cornId,
                            name: 'Corn',
                            acres: 1000,
                            projectedYield: 200,
                            projectedPrice: 4.20,
                            color: '#EAB308',
                            additionalIncome: 0,
                            expenses: [
                                { id: uid(), category: 'Return to Management', amountPerAcre: 20 },
                                { id: uid(), category: 'Land Payment/Rent', amountPerAcre: 286 },
                                { id: uid(), category: 'Taxes', amountPerAcre: 12 },
                                { id: uid(), category: 'Interest', amountPerAcre: 5 },
                                { id: uid(), category: 'Insurance', amountPerAcre: 45 },
                                { id: uid(), category: 'Seed', amountPerAcre: 104 },
                                { id: uid(), category: 'Fertilizer', amountPerAcre: 45 },
                                { id: uid(), category: 'Nitrogen', amountPerAcre: 80 },
                                { id: uid(), category: 'Herbicide', amountPerAcre: 34 },
                                { id: uid(), category: 'Fungicide/Insecticide', amountPerAcre: 0 },
                                { id: uid(), category: 'Custom Application', amountPerAcre: 0 },
                                { id: uid(), category: 'Equipment/Fuel/Labor', amountPerAcre: 110.85 },
                                { id: uid(), category: 'Grain Hauling', amountPerAcre: 38.40 },
                                { id: uid(), category: 'Drying Expense', amountPerAcre: 19.20 },
                                { id: uid(), category: 'Storage', amountPerAcre: 4.80 },
                            ],
                        },
                        {
                            id: beanId,
                            name: 'Soybeans',
                            acres: 1000,
                            projectedYield: 55,
                            projectedPrice: 13.69,
                            color: '#22C55E',
                            additionalIncome: 0,
                            expenses: [
                                { id: uid(), category: 'Return to Management', amountPerAcre: 20 },
                                { id: uid(), category: 'Land Payment/Rent', amountPerAcre: 286 },
                                { id: uid(), category: 'Taxes', amountPerAcre: 12 },
                                { id: uid(), category: 'Interest', amountPerAcre: 5 },
                                { id: uid(), category: 'Insurance', amountPerAcre: 16 },
                                { id: uid(), category: 'Seed', amountPerAcre: 85 },
                                { id: uid(), category: 'Fertilizer', amountPerAcre: 45 },
                                { id: uid(), category: 'Nitrogen', amountPerAcre: 0 },
                                { id: uid(), category: 'Herbicide', amountPerAcre: 32 },
                                { id: uid(), category: 'Fungicide/Insecticide', amountPerAcre: 10 },
                                { id: uid(), category: 'Custom Application', amountPerAcre: 8 },
                                { id: uid(), category: 'Equipment/Fuel/Labor', amountPerAcre: 129.56 },
                                { id: uid(), category: 'Grain Hauling', amountPerAcre: 15.60 },
                                { id: uid(), category: 'Drying Expense', amountPerAcre: 0 },
                                { id: uid(), category: 'Storage', amountPerAcre: 2.60 },
                            ],
                        },
                    ],
                    sales: [
                        {
                            id: uid(), cropId: cornId, date: '2023-03-15', vendor: 'ADM',
                            bushels: 30000, price: 5.75, hedgeAdjustment: 0.25, comments: '', isComplete: true,
                        },
                        {
                            id: uid(), cropId: beanId, date: '2023-04-01', vendor: 'Cargill',
                            bushels: 10000, price: 14.20, hedgeAdjustment: 0, comments: '', isComplete: false,
                        },
                    ],
                    equipment: [],
                    passes: [],
                    activeCropId: cornId,
                });
            },

            resetAll: () => set({ ...INITIAL_STATE }),
        }),
        {
            name: 'farm-profit-manager-storage',
        },
    ),
);
