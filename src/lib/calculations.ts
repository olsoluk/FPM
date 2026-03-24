import type { Crop, Sale, Equipment, Pass } from '../types';

// ── Crop-level calculations ──

export function totalExpensesPerAcre(crop: Crop): number {
    return crop.expenses.reduce((sum, e) => sum + e.amountPerAcre, 0);
}

export function totalExpenses(crop: Crop): number {
    return totalExpensesPerAcre(crop) * crop.acres;
}

export function grossIncomePerAcre(crop: Crop): number {
    return crop.projectedYield * crop.projectedPrice;
}

export function grossIncome(crop: Crop): number {
    return grossIncomePerAcre(crop) * crop.acres + crop.additionalIncome;
}

export function revenuePerAcre(crop: Crop): number {
    return grossIncomePerAcre(crop) - totalExpensesPerAcre(crop);
}

export function revenue(crop: Crop): number {
    return grossIncome(crop) - totalExpenses(crop);
}

export function marginPercent(crop: Crop): number {
    const income = grossIncomePerAcre(crop);
    if (income === 0) return 0;
    return revenuePerAcre(crop) / income;
}

export function costPerBushel(expensePerAcre: number, yieldPerAcre: number): number {
    if (yieldPerAcre === 0) return 0;
    return expensePerAcre / yieldPerAcre;
}

// ── Farm-wide calculations ──

export function totalAcres(crops: Crop[]): number {
    return crops.reduce((sum, c) => sum + c.acres, 0);
}

export function farmTotalIncome(crops: Crop[]): number {
    return crops.reduce((sum, c) => sum + grossIncome(c), 0);
}

export function farmTotalExpenses(crops: Crop[]): number {
    return crops.reduce((sum, c) => sum + totalExpenses(c), 0);
}

export function farmTotalRevenue(crops: Crop[]): number {
    return crops.reduce((sum, c) => sum + revenue(c), 0);
}

export function farmROI(crops: Crop[]): number {
    const income = farmTotalIncome(crops);
    if (income === 0) return 0;
    return farmTotalRevenue(crops) / income;
}

/** Weighted average expense per acre for a specific category across all crops */
export function weightedExpensePerAcre(crops: Crop[], category: string): number {
    const acres = totalAcres(crops);
    if (acres === 0) return 0;
    const totalForCategory = crops.reduce((sum, crop) => {
        const expense = crop.expenses.find(e => e.category === category);
        return sum + (expense ? expense.amountPerAcre * crop.acres : 0);
    }, 0);
    return totalForCategory / acres;
}

/** Total $ for a specific expense category across all crops */
export function totalExpenseForCategory(crops: Crop[], category: string): number {
    return crops.reduce((sum, crop) => {
        const expense = crop.expenses.find(e => e.category === category);
        return sum + (expense ? expense.amountPerAcre * crop.acres : 0);
    }, 0);
}

// ── Marketing calculations ──

export function totalBushelsSold(sales: Sale[]): number {
    return sales.reduce((sum, s) => sum + s.bushels, 0);
}

export function averageSalePrice(sales: Sale[]): number {
    const totalBu = totalBushelsSold(sales);
    if (totalBu === 0) return 0;
    const weightedTotal = sales.reduce((sum, s) => sum + s.bushels * (s.price + s.hedgeAdjustment), 0);
    return weightedTotal / totalBu;
}

export function totalSaleRevenue(sales: Sale[]): number {
    return sales.reduce((sum, s) => sum + s.bushels * (s.price + s.hedgeAdjustment), 0);
}

export function percentOfProductionSold(crop: Crop, sales: Sale[]): number {
    const projectedProduction = crop.acres * crop.projectedYield;
    if (projectedProduction === 0) return 0;
    return totalBushelsSold(sales) / projectedProduction;
}

// ── Break-even chart data ──

export interface BreakEvenPoint {
    yield: number;
    breakEvenPrice: number;
    targetPrice: number;
    marketPrice: number;
}

export function generateBreakEvenData(
    crop: Crop,
    targetROI: number = 0.10,
    marketPrice?: number,
): BreakEvenPoint[] {
    const expPerAcre = totalExpensesPerAcre(crop);
    const price = marketPrice ?? crop.projectedPrice;
    const minYield = Math.max(Math.round(crop.projectedYield * 0.4), 10);
    const maxYield = Math.round(crop.projectedYield * 1.6);
    const step = Math.max(1, Math.round((maxYield - minYield) / 60));

    const points: BreakEvenPoint[] = [];
    for (let y = minYield; y <= maxYield; y += step) {
        points.push({
            yield: y,
            breakEvenPrice: expPerAcre / y,
            targetPrice: (expPerAcre * (1 + targetROI)) / y,
            marketPrice: price,
        });
    }
    return points;
}

// ── Equipment calculations ──

export function annualCostOfOwnership(equip: Equipment): number {
    if (equip.annualCostOverride !== null) return equip.annualCostOverride;
    const yearsOwned = Math.max(1, equip.plannedTradeYear - equip.yearAcquired);
    const depreciation = (equip.purchasePrice - equip.currentValue) / yearsOwned;
    const returnOnAsset = equip.currentValue * 0.05; // 5% return on asset
    return depreciation + returnOnAsset;
}

export function totalEquipmentCostPerAcre(
    equipment: Equipment[],
    passes: Pass[],
    crops: Crop[],
): number {
    const acres = totalAcres(crops);
    if (acres === 0) return 0;

    let total = 0;
    for (const pass of passes) {
        const passAcres = crops
            .filter(c => pass.appliedCropIds.includes(c.id))
            .reduce((sum, c) => sum + c.acres, 0);

        // Equipment ownership cost allocated to this pass
        const equipCost = pass.equipmentIds.reduce((sum, eid) => {
            const eq = equipment.find(e => e.id === eid);
            return sum + (eq ? annualCostOfOwnership(eq) : 0);
        }, 0);

        // Variable costs
        const variableCostTotal = (pass.laborCostPerAcre + pass.fuelCostPerAcre +
            pass.repairsCostPerAcre + pass.otherCostPerAcre) * passAcres;

        total += equipCost + variableCostTotal;
    }

    return total / acres;
}
