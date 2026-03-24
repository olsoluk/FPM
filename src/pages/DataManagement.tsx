import { useState, useRef } from 'react';
import { Download, Upload, Save, Clock, Trash2, AlertTriangle } from 'lucide-react';
import { useFarmStore } from '../store/farmStore';
import { format } from 'date-fns';

export function DataManagement() {
    const exportJSON = useFarmStore(s => s.exportJSON);
    const importJSON = useFarmStore(s => s.importJSON);
    const saveSnapshot = useFarmStore(s => s.saveSnapshot);
    const loadSnapshot = useFarmStore(s => s.loadSnapshot);
    const deleteSnapshot = useFarmStore(s => s.deleteSnapshot);
    const snapshots = useFarmStore(s => s.snapshots);
    const resetAll = useFarmStore(s => s.resetAll);
    const farmName = useFarmStore(s => s.farm.name);

    const [snapshotLabel, setSnapshotLabel] = useState('');
    const [importError, setImportError] = useState('');
    const [importSuccess, setImportSuccess] = useState(false);
    const [confirmReset, setConfirmReset] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        const json = exportJSON();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const datePart = format(new Date(), 'yyyy-MM-dd');
        a.href = url;
        a.download = `FPM-${farmName || 'export'}-${datePart}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = (file: File) => {
        setImportError('');
        setImportSuccess(false);
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result;
            if (typeof text !== 'string') {
                setImportError('Could not read file.');
                return;
            }
            const ok = importJSON(text);
            if (ok) {
                setImportSuccess(true);
            } else {
                setImportError('Invalid file format. Expected a Farm Profit Manager JSON export.');
            }
        };
        reader.readAsText(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleImport(file);
        e.target.value = '';
    };

    const handleSaveSnapshot = () => {
        const label = snapshotLabel.trim() || format(new Date(), 'yyyy-MM-dd HH:mm');
        saveSnapshot(label);
        setSnapshotLabel('');
    };

    return (
        <div className="mx-auto max-w-3xl space-y-8">
            <h1 className="text-2xl font-bold text-gray-900">Data Management</h1>

            {/* Export / Import */}
            <div className="grid gap-6 sm:grid-cols-2">
                <div className="card space-y-3">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Download className="h-4 w-4" /> Export
                    </h3>
                    <p className="text-xs text-gray-500">
                        Download your entire farm data as a JSON file. Share with others or keep as a backup.
                    </p>
                    <button onClick={handleExport} className="btn-primary w-full justify-center">
                        <Download className="h-4 w-4" /> Export to File
                    </button>
                </div>

                <div className="card space-y-3">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Upload className="h-4 w-4" /> Import
                    </h3>
                    <p className="text-xs text-gray-500">
                        Load a previously exported JSON file. This replaces all current data.
                    </p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="btn-secondary w-full justify-center"
                    >
                        <Upload className="h-4 w-4" /> Import from File
                    </button>
                    {importError && (
                        <p className="text-xs text-red-600">{importError}</p>
                    )}
                    {importSuccess && (
                        <p className="text-xs text-green-600">Import successful!</p>
                    )}
                </div>
            </div>

            {/* Snapshots */}
            <div className="card space-y-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Clock className="h-4 w-4" /> Snapshots
                </h3>
                <p className="text-xs text-gray-500">
                    Save a dated snapshot of your current data. Use this to track changes over time —
                    like date-stamping your profit manager so you can look back at what you were thinking.
                </p>

                <div className="flex gap-2">
                    <input
                        type="text"
                        className="input-field flex-1"
                        placeholder="Snapshot label (optional)"
                        value={snapshotLabel}
                        onChange={e => setSnapshotLabel(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSaveSnapshot()}
                    />
                    <button onClick={handleSaveSnapshot} className="btn-primary">
                        <Save className="h-4 w-4" /> Save
                    </button>
                </div>

                {snapshots.length > 0 ? (
                    <div className="divide-y divide-gray-100 rounded-md border border-gray-200">
                        {[...snapshots].reverse().map(snap => (
                            <div key={snap.id} className="flex items-center justify-between gap-3 px-4 py-3">
                                <div>
                                    <div className="text-sm font-medium text-gray-800">{snap.label}</div>
                                    <div className="text-xs text-gray-400">
                                        {format(new Date(snap.date), 'MMM d, yyyy h:mm a')}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => loadSnapshot(snap.id)}
                                        className="btn-secondary text-xs py-1 px-3"
                                    >
                                        Load
                                    </button>
                                    <button
                                        onClick={() => deleteSnapshot(snap.id)}
                                        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-gray-400 italic">No snapshots saved yet.</p>
                )}
            </div>

            {/* Reset */}
            <div className="card border-red-200 space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-red-700">
                    <AlertTriangle className="h-4 w-4" /> Danger Zone
                </h3>
                {!confirmReset ? (
                    <button
                        onClick={() => setConfirmReset(true)}
                        className="btn-danger"
                    >
                        Reset All Data
                    </button>
                ) : (
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-red-600">Are you sure? This cannot be undone.</span>
                        <button
                            onClick={() => { resetAll(); setConfirmReset(false); }}
                            className="btn-danger"
                        >
                            Yes, Reset
                        </button>
                        <button
                            onClick={() => setConfirmReset(false)}
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
