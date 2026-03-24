import { useState } from 'react';
import { Plus, Trash2, Sparkles } from 'lucide-react';
import { useFarmStore } from '../store/farmStore';
import { CROP_PRESETS } from '../types';
import { formatNumber } from '../lib/utils';
import { totalAcres } from '../lib/calculations';

export function FarmSetup() {
    const farm = useFarmStore(s => s.farm);
    const crops = useFarmStore(s => s.crops);
    const updateFarm = useFarmStore(s => s.updateFarm);
    const addCrop = useFarmStore(s => s.addCrop);
    const updateCrop = useFarmStore(s => s.updateCrop);
    const removeCrop = useFarmStore(s => s.removeCrop);
    const loadExampleData = useFarmStore(s => s.loadExampleData);
    const setActivePage = useFarmStore(s => s.setActivePage);

    const [newCropName, setNewCropName] = useState('');

    const handleAddCrop = (name: string, preset?: { yield: number; price: number }) => {
        if (!name.trim()) return;
        addCrop(name.trim(), 0, preset?.yield ?? 0, preset?.price ?? 0);
        setNewCropName('');
    };

    const handlePresetClick = (name: string) => {
        const preset = CROP_PRESETS[name];
        if (preset) handleAddCrop(name, preset);
    };

    return (
        <div className="mx-auto max-w-4xl space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Farm Setup</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Define your farm profile and crop plan
                    </p>
                </div>
                {crops.length === 0 && (
                    <button onClick={loadExampleData} className="btn-secondary self-start">
                        <Sparkles className="h-4 w-4" />
                        Load Example Data
                    </button>
                )}
            </div>

            {/* Farm Profile */}
            <section className="card">
                <h2 className="mb-4 text-lg font-semibold">Farm Profile</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Farm Name</label>
                        <input
                            type="text"
                            className="input-field"
                            value={farm.name}
                            onChange={e => updateFarm({ name: e.target.value })}
                            placeholder="My Farm"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Crop Year</label>
                        <input
                            type="number"
                            className="input-field"
                            value={farm.year}
                            onChange={e => updateFarm({ year: parseInt(e.target.value) || new Date().getFullYear() })}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Total Acres</label>
                        <div className="input-field bg-gray-50 text-gray-700">
                            {formatNumber(totalAcres(crops))}
                        </div>
                    </div>
                </div>
                <div className="mt-4">
                    <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                        className="input-field"
                        rows={2}
                        value={farm.notes}
                        onChange={e => updateFarm({ notes: e.target.value })}
                        placeholder="Optional notes about this year's plan..."
                    />
                </div>
            </section>

            {/* Crop Definitions */}
            <section className="card">
                <h2 className="mb-4 text-lg font-semibold">Crop Definitions</h2>

                {crops.length > 0 && (
                    <>
                        {/* Desktop table */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                                        <th className="py-3 pr-4">Color</th>
                                        <th className="py-3 pr-4">Crop Name</th>
                                        <th className="py-3 pr-4 text-right">Acres</th>
                                        <th className="py-3 pr-4 text-right">Yield (bu/ac)</th>
                                        <th className="py-3 pr-4 text-right">Price ($/bu)</th>
                                        <th className="py-3 pr-4 text-right">Income/Acre</th>
                                        <th className="py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {crops.map(crop => (
                                        <tr key={crop.id}>
                                            <td className="py-3 pr-4">
                                                <div
                                                    className="h-5 w-5 rounded"
                                                    style={{ backgroundColor: crop.color }}
                                                />
                                            </td>
                                            <td className="py-3 pr-4">
                                                <input
                                                    type="text"
                                                    className="input-field w-32"
                                                    value={crop.name}
                                                    onChange={e => updateCrop(crop.id, { name: e.target.value })}
                                                />
                                            </td>
                                            <td className="py-3 pr-4 text-right">
                                                <input
                                                    type="number"
                                                    className="input-field w-24 text-right"
                                                    value={crop.acres || ''}
                                                    onChange={e => updateCrop(crop.id, { acres: parseFloat(e.target.value) || 0 })}
                                                />
                                            </td>
                                            <td className="py-3 pr-4 text-right">
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    className="input-field w-24 text-right"
                                                    value={crop.projectedYield || ''}
                                                    onChange={e => updateCrop(crop.id, { projectedYield: parseFloat(e.target.value) || 0 })}
                                                />
                                            </td>
                                            <td className="py-3 pr-4 text-right">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="input-field w-24 text-right"
                                                    value={crop.projectedPrice || ''}
                                                    onChange={e => updateCrop(crop.id, { projectedPrice: parseFloat(e.target.value) || 0 })}
                                                />
                                            </td>
                                            <td className="py-3 pr-4 text-right font-medium text-gray-700">
                                                ${formatNumber(crop.projectedYield * crop.projectedPrice, 2)}
                                            </td>
                                            <td className="py-3 text-right">
                                                <button
                                                    onClick={() => removeCrop(crop.id)}
                                                    className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                                                    title="Remove crop"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile card list */}
                        <div className="space-y-3 sm:hidden">
                            {crops.map(crop => (
                                <div key={crop.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div
                                            className="h-4 w-4 rounded flex-shrink-0"
                                            style={{ backgroundColor: crop.color }}
                                        />
                                        <input
                                            type="text"
                                            className="input-field flex-1 text-sm font-medium"
                                            value={crop.name}
                                            onChange={e => updateCrop(crop.id, { name: e.target.value })}
                                        />
                                        <button
                                            onClick={() => removeCrop(crop.id)}
                                            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                                            title="Remove crop"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Acres</label>
                                            <input
                                                type="number"
                                                className="input-field w-full text-sm text-right"
                                                value={crop.acres || ''}
                                                onChange={e => updateCrop(crop.id, { acres: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Yield (bu/ac)</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                className="input-field w-full text-sm text-right"
                                                value={crop.projectedYield || ''}
                                                onChange={e => updateCrop(crop.id, { projectedYield: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Price ($/bu)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="input-field w-full text-sm text-right"
                                                value={crop.projectedPrice || ''}
                                                onChange={e => updateCrop(crop.id, { projectedPrice: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-2 text-right text-xs font-medium text-gray-600">
                                        Income/Acre: <span className="text-gray-900">${formatNumber(crop.projectedYield * crop.projectedPrice, 2)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Add custom crop */}
                <div className="mt-4 flex items-center gap-2">
                    <input
                        type="text"
                        className="input-field w-48"
                        value={newCropName}
                        onChange={e => setNewCropName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddCrop(newCropName)}
                        placeholder="Crop name..."
                    />
                    <button
                        onClick={() => handleAddCrop(newCropName)}
                        disabled={!newCropName.trim()}
                        className="btn-primary disabled:opacity-50"
                    >
                        <Plus className="h-4 w-4" />
                        Add Crop
                    </button>
                </div>

                {/* Quick presets */}
                <div className="mt-4">
                    <span className="text-xs font-medium text-gray-500">Quick add:</span>
                    <div className="mt-1 flex flex-wrap gap-2">
                        {Object.entries(CROP_PRESETS)
                            .filter(([name]) => !crops.some(c => c.name === name))
                            .map(([name]) => (
                                <button
                                    key={name}
                                    onClick={() => handlePresetClick(name)}
                                    className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium
                             text-gray-600 hover:border-farm-300 hover:bg-farm-50 hover:text-farm-700 transition-colors"
                                >
                                    + {name}
                                </button>
                            ))}
                    </div>
                </div>
            </section>

            {/* Next step CTA */}
            {crops.length > 0 && (
                <div className="flex justify-end">
                    <button
                        onClick={() => setActivePage('production')}
                        className="btn-primary"
                    >
                        Continue to Crop Production →
                    </button>
                </div>
            )}
        </div>
    );
}
