// ── Core data types ──

export interface FarmProfile {
    name: string;
    year: number;
    notes: string;
}

export interface ExpenseLineItem {
    id: string;
    category: string;
    amountPerAcre: number;
}

export interface Crop {
    id: string;
    name: string;
    acres: number;
    projectedYield: number;   // bushels per acre
    projectedPrice: number;   // $ per bushel
    color: string;
    expenses: ExpenseLineItem[];
    additionalIncome: number; // government payments, off-farm income, etc.
}

export interface Sale {
    id: string;
    cropId: string;
    date: string;
    vendor: string;
    bushels: number;
    price: number;
    hedgeAdjustment: number;
    comments: string;
    isComplete: boolean;
}

export interface Equipment {
    id: string;
    name: string;
    type: EquipmentType;
    purchasePrice: number;
    currentValue: number;
    yearAcquired: number;
    plannedTradeYear: number;
    annualCostOverride: number | null; // if user wants to set manually
}

export type EquipmentType =
    | 'tractor'
    | 'combine'
    | 'planter'
    | 'sprayer'
    | 'head'
    | 'grain_cart'
    | 'tillage'
    | 'semi'
    | 'other';

export interface Pass {
    id: string;
    name: string;
    appliedCropIds: string[];
    equipmentIds: string[];
    laborCostPerAcre: number;
    fuelCostPerAcre: number;
    repairsCostPerAcre: number;
    otherCostPerAcre: number;
}

export interface Snapshot {
    id: string;
    date: string;
    label: string;
    farm: FarmProfile;
    crops: Crop[];
    sales: Sale[];
    equipment: Equipment[];
    passes: Pass[];
}

// ── Constants ──

export const DEFAULT_EXPENSE_CATEGORIES = [
    'Return to Management',
    'Land Payment/Rent',
    'Taxes',
    'Interest',
    'Insurance',
    'Seed',
    'Fertilizer',
    'Nitrogen',
    'Herbicide',
    'Fungicide/Insecticide',
    'Custom Application',
    'Equipment/Fuel/Labor',
    'Grain Hauling',
    'Drying Expense',
    'Storage',
] as const;

export const CROP_PRESETS: Record<string, { color: string; yield: number; price: number }> = {
    Corn: { color: '#EAB308', yield: 200, price: 4.20 },
    Soybeans: { color: '#22C55E', yield: 55, price: 13.69 },
    Wheat: { color: '#D97706', yield: 60, price: 7.50 },
    Cotton: { color: '#F9FAFB', yield: 900, price: 0.80 },
    Canola: { color: '#FBBF24', yield: 40, price: 14.00 },
    Sorghum: { color: '#DC2626', yield: 100, price: 5.50 },
    Rice: { color: '#A3E635', yield: 170, price: 7.00 },
    Oats: { color: '#D4D4D8', yield: 80, price: 4.00 },
    Barley: { color: '#FCD34D', yield: 70, price: 5.25 },
    Sunflowers: { color: '#F59E0B', yield: 1600, price: 0.25 },
};

export const CROP_COLORS = [
    '#EAB308', '#22C55E', '#06B6D4', '#EF4444',
    '#8B5CF6', '#F97316', '#EC4899', '#14B8A6',
    '#6366F1', '#84CC16', '#F43F5E', '#0EA5E9',
];

export const EQUIPMENT_TYPES: { value: EquipmentType; label: string }[] = [
    { value: 'tractor', label: 'Tractor' },
    { value: 'combine', label: 'Combine' },
    { value: 'planter', label: 'Planter' },
    { value: 'sprayer', label: 'Sprayer' },
    { value: 'head', label: 'Head' },
    { value: 'grain_cart', label: 'Grain Cart' },
    { value: 'tillage', label: 'Tillage' },
    { value: 'semi', label: 'Semi / Truck' },
    { value: 'other', label: 'Other' },
];
