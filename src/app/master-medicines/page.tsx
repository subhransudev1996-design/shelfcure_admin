'use client';

import { useState, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
    Upload, Search, Plus, Pencil, Trash2, X, Check,
    Database, RefreshCw, Download, ChevronLeft,
    ChevronRight, FileText, Pill, CheckCircle2, AlertCircle
} from 'lucide-react';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface MasterMedicine {
    id: number;
    name: string;
    salt_composition: string | null;
    strength: string | null;
    manufacturer: string | null;
    dosage_form: string | null;
    pack_size: number | null;
    pack_unit: string | null;
    units_per_pack: number | null;
    hsn_code: string | null;
    default_gst_rate: number | null;
    barcode: string | null;
    created_at: string;
}

const PAGE_SIZE = 25;

// ── Robust CSV Parser (handles quoted fields with commas inside) ──────────
function parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
            else { inQuotes = !inQuotes; }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

function parseCsv(text: string): Record<string, string>[] {
    // Handle both \r\n and \n line endings
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];
    const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''));
    return lines.slice(1).map(line => {
        const cols = parseCsvLine(line);
        const row: Record<string, string> = {};
        headers.forEach((h, i) => { row[h] = cols[i] || ''; });
        return row;
    }).filter(r => {
        // Accept rows where any of common name columns are non-empty
        return (r['name'] || r['medicine_name'] || r['drug_name'] || '').trim().length > 0;
    });
}

function mapRowToMedicine(row: Record<string, string>) {
    const name = (row['name'] || row['medicine_name'] || row['drug_name'] || '').trim();
    if (!name) return null;
    return {
        name,
        salt_composition: row['salt_composition'] || row['salt'] || row['generic_name'] || null,
        strength: row['strength'] || row['dose'] || null,
        manufacturer: row['manufacturer'] || row['company'] || row['brand'] || null,
        dosage_form: row['dosage_form'] || row['form'] || row['type'] || null,
        pack_size: row['pack_size'] ? String(row['pack_size']) : null,
        pack_unit: row['pack_unit'] || row['unit'] || null,
        units_per_pack: row['units_per_pack'] || row['units'] || null,
        hsn_code: row['hsn_code'] || row['hsn'] || null,
        default_gst_rate: row['default_gst_rate'] || row['gst'] || row['gst_rate'] || null,
        barcode: row['barcode'] || row['ean'] || null,
    };
}

// ─────────────────────────────────────────────────────────────────────────────

export default function MasterMedicinePage() {
    const [medicines, setMedicines] = useState<MasterMedicine[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);

    // Upload states
    const [uploadMode, setUploadMode] = useState(false);
    const [csvRows, setCsvRows] = useState<ReturnType<typeof mapRowToMedicine>[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0); // 0-100
    const [uploadResult, setUploadResult] = useState<{ inserted: number; skipped: number; errors?: string[] } | null>(null);
    const [parseError, setParseError] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);

    // Edit / Add states
    const [editRow, setEditRow] = useState<MasterMedicine | null>(null);
    const [addMode, setAddMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editForm, setEditForm] = useState<Partial<MasterMedicine>>({});

    // Stats
    const [stats, setStats] = useState({ total: 0, withSalt: 0, withManufacturer: 0 });

    const fetchStats = async () => {
        const [{ count: total }, { count: withSalt }, { count: withMfr }] = await Promise.all([
            supabase.from('master_medicines').select('*', { count: 'exact', head: true }),
            supabase.from('master_medicines').select('*', { count: 'exact', head: true }).not('salt_composition', 'is', null),
            supabase.from('master_medicines').select('*', { count: 'exact', head: true }).not('manufacturer', 'is', null),
        ]);
        setStats({ total: total || 0, withSalt: withSalt || 0, withManufacturer: withMfr || 0 });
    };

    const fetchMedicines = useCallback(async (pageNum = 0, query = '') => {
        setLoading(true);
        try {
            let q = supabase.from('master_medicines').select('*', { count: 'exact' });
            if (query.trim()) q = q.ilike('name', `%${query.trim()}%`);
            const from = pageNum * PAGE_SIZE;
            q = q.range(from, from + PAGE_SIZE - 1).order('name');
            const { data, count, error } = await q;
            if (error) throw error;
            setMedicines(data || []);
            setTotalCount(count || 0);
            setLoaded(true);
            fetchStats();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSearch = (val: string) => {
        setSearch(val);
        setPage(0);
        fetchMedicines(0, val);
    };

    // ── CSV File Handling ────────────────────────────────────────────────────
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setParseError('');
        setCsvRows([]);

        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const text = ev.target?.result as string;
                const raw = parseCsv(text);
                if (raw.length === 0) {
                    setParseError('No valid rows found. Make sure CSV has a "name" column header.');
                    return;
                }
                const mapped = raw.map(mapRowToMedicine).filter(Boolean);
                setCsvRows(mapped);
            } catch (err: any) {
                setParseError('Failed to parse CSV: ' + err.message);
            }
        };
        reader.readAsText(file, 'utf-8');
        // Reset input so same file can be re-selected
        e.target.value = '';
    };

    // ── Bulk Upload (via server API route) ────────────────────────────────────
    const handleBulkUpload = async () => {
        if (csvRows.length === 0) return;
        setUploading(true);
        setUploadProgress(0);
        setUploadResult(null);

        // Split into chunks of 500 and send to our API route
        const CHUNK = 500;
        let totalInserted = 0;
        let totalSkipped = 0;
        const allErrors: string[] = [];

        for (let i = 0; i < csvRows.length; i += CHUNK) {
            const chunk = csvRows.slice(i, i + CHUNK);
            try {
                const res = await fetch('/admin/api/master-medicines/bulk-upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ rows: chunk }),
                });
                const result = await res.json();
                if (result.success) {
                    totalInserted += result.inserted || 0;
                    totalSkipped += result.skipped || 0;
                    if (result.errors) allErrors.push(...result.errors);
                } else {
                    totalSkipped += chunk.length;
                    allErrors.push(result.error || 'Unknown error');
                }
            } catch (err: any) {
                totalSkipped += chunk.length;
                allErrors.push(err.message);
            }
            setUploadProgress(Math.round(((i + CHUNK) / csvRows.length) * 100));
        }

        setUploadProgress(100);
        setUploadResult({ inserted: totalInserted, skipped: totalSkipped, errors: allErrors.length > 0 ? allErrors : undefined });
        setUploading(false);
        setCsvRows([]);
        setUploadMode(false);
        fetchMedicines(0, search);
    };

    // ── Download template ──────────────────────────────────────────────────
    const downloadTemplate = () => {
        const csv = [
            'name,salt_composition,strength,manufacturer,dosage_form,pack_size,pack_unit,units_per_pack,hsn_code,default_gst_rate,barcode',
            '"Paracetamol 500mg Tablet",Paracetamol,500mg,Cipla,Tablet,10,Strip,10,30049099,12,',
            '"Amoxicillin 500mg Capsule",Amoxicillin,500mg,Sun Pharma,Capsule,10,Strip,10,30049099,12,',
            '"Azithromycin 250mg Tablet","Azithromycin Dihydrate",250mg,Mankind,Tablet,6,Strip,6,30049099,12,',
        ].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'master_medicines_template.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    // ── Edit / Delete ──────────────────────────────────────────────────────
    const startEdit = (med: MasterMedicine) => { setEditRow(med); setEditForm({ ...med }); setAddMode(false); };
    const startAdd = () => { setEditRow(null); setEditForm({}); setAddMode(true); };
    const cancelEdit = () => { setEditRow(null); setAddMode(false); setEditForm({}); };

    const saveEdit = async () => {
        setSaving(true);
        try {
            if (addMode) {
                const { error } = await supabase.from('master_medicines').insert([editForm]);
                if (error) throw error;
            } else if (editRow) {
                const { error } = await supabase.from('master_medicines').update(editForm).eq('id', editRow.id);
                if (error) throw error;
            }
            cancelEdit();
            fetchMedicines(page, search);
        } catch (e: any) {
            alert('Error saving: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    const deleteMed = async (id: number, name: string) => {
        if (!confirm(`Delete "${name}" from master database? This cannot be undone.`)) return;
        await supabase.from('master_medicines').delete().eq('id', id);
        fetchMedicines(page, search);
    };

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    return (
        <div className="p-6 space-y-6 max-w-[1400px]">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-green-500/10">
                            <Pill className="h-6 w-6 text-green-400" />
                        </div>
                        Master Medicine Database
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Global medicine catalog shared across all ShelfCure pharmacies</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { setUploadMode(true); setUploadResult(null); setCsvRows([]); setParseError(''); }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/20 text-sm font-medium transition-all"
                    >
                        <Upload className="h-4 w-4" /> Bulk Upload CSV
                    </button>
                    <button
                        onClick={startAdd}
                        className="flex items-center gap-2 px-4 py-2.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-xl border border-green-500/20 text-sm font-medium transition-all"
                    >
                        <Plus className="h-4 w-4" /> Add Medicine
                    </button>
                </div>
            </div>

            {/* Upload Result Banner */}
            {uploadResult && (
                <div className={`flex items-start gap-3 p-4 rounded-xl border ${uploadResult.errors ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
                    {uploadResult.errors ? <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" /> : <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />}
                    <div className="flex-1">
                        <p className="text-sm font-medium">
                            Upload complete! <strong>{uploadResult.inserted.toLocaleString()} medicines inserted</strong>
                            {uploadResult.skipped > 0 && `, ${uploadResult.skipped.toLocaleString()} skipped (duplicates)`}.
                        </p>
                        {uploadResult.errors && (
                            <p className="text-xs mt-1 opacity-80">{uploadResult.errors.slice(0, 3).join(' · ')}</p>
                        )}
                    </div>
                    <button onClick={() => setUploadResult(null)} className="opacity-60 hover:opacity-100"><X className="h-4 w-4" /></button>
                </div>
            )}

            {/* Stats */}
            {loaded && (
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Total Medicines', value: stats.total.toLocaleString(), color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                        { label: 'With Salt Data', value: `${stats.withSalt.toLocaleString()} (${stats.total ? Math.round(stats.withSalt / stats.total * 100) : 0}%)`, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
                        { label: 'With Manufacturer', value: `${stats.withManufacturer.toLocaleString()} (${stats.total ? Math.round(stats.withManufacturer / stats.total * 100) : 0}%)`, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
                    ].map(s => (
                        <div key={s.label} className={`p-4 rounded-xl border ${s.bg}`}>
                            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{s.label}</p>
                            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* ── CSV Upload Modal ── */}
            {uploadMode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-5">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Upload className="h-5 w-5 text-blue-400" /> Bulk Upload CSV
                            </h2>
                            <button onClick={() => { setUploadMode(false); setCsvRows([]); }} className="text-gray-500 hover:text-white">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-2">
                            <p className="text-gray-400 text-sm">Upload any CSV with a <code className="text-blue-300 bg-blue-500/10 px-1 rounded">name</code> column. All other columns are optional.</p>
                            <button onClick={downloadTemplate} className="flex items-center gap-2 text-sm text-blue-400 hover:underline">
                                <Download className="h-4 w-4" /> Download CSV Template
                            </button>
                        </div>

                        {/* Drop zone */}
                        <div
                            onClick={() => fileRef.current?.click()}
                            className="border-2 border-dashed border-white/10 hover:border-blue-500/40 rounded-xl p-8 text-center cursor-pointer transition-all group"
                        >
                            <FileText className="h-10 w-10 text-gray-600 group-hover:text-blue-400 mx-auto mb-3 transition-colors" />
                            {csvRows.length > 0
                                ? <p className="text-green-400 font-semibold">{csvRows.length.toLocaleString()} medicines ready to upload</p>
                                : <p className="text-gray-400 text-sm">Click to select CSV file (supports up to 50,000 rows)</p>
                            }
                            <p className="text-gray-600 text-xs mt-1">Duplicate names will be skipped automatically</p>
                            <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileChange} />
                        </div>

                        {parseError && (
                            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" /> {parseError}
                            </div>
                        )}

                        {csvRows.length > 0 && (
                            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-green-400 text-sm flex items-center gap-2">
                                <Check className="h-4 w-4" />
                                <span><strong>{csvRows.length.toLocaleString()} medicines</strong> parsed successfully</span>
                            </div>
                        )}

                        {/* Progress bar */}
                        {uploading && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs text-gray-400">
                                    <span>Uploading...</span>
                                    <span>{uploadProgress}%</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => { setUploadMode(false); setCsvRows([]); }}
                                disabled={uploading}
                                className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white text-sm transition-all disabled:opacity-40"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkUpload}
                                disabled={csvRows.length === 0 || uploading}
                                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
                            >
                                {uploading
                                    ? <><RefreshCw className="h-4 w-4 animate-spin" /> Uploading {uploadProgress}%</>
                                    : <><Upload className="h-4 w-4" /> Upload {csvRows.length > 0 ? `${csvRows.length.toLocaleString()} medicines` : ''}</>
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Edit / Add Modal ── */}
            {(editRow || addMode) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-white">{addMode ? 'Add New Medicine' : 'Edit Medicine'}</h2>
                            <button onClick={cancelEdit} className="text-gray-500 hover:text-white"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {([
                                { key: 'name', label: 'Medicine Name *', type: 'text', full: true },
                                { key: 'salt_composition', label: 'Salt Composition', type: 'text' },
                                { key: 'strength', label: 'Strength', type: 'text' },
                                { key: 'manufacturer', label: 'Manufacturer', type: 'text' },
                                { key: 'dosage_form', label: 'Dosage Form', type: 'text' },
                                { key: 'pack_size', label: 'Pack Size', type: 'number' },
                                { key: 'pack_unit', label: 'Pack Unit (Strip/Bottle)', type: 'text' },
                                { key: 'units_per_pack', label: 'Units Per Pack', type: 'number' },
                                { key: 'hsn_code', label: 'HSN Code', type: 'text' },
                                { key: 'default_gst_rate', label: 'GST Rate (%)', type: 'number' },
                                { key: 'barcode', label: 'Barcode', type: 'text' },
                            ] as { key: keyof MasterMedicine; label: string; type: string; full?: boolean }[]).map(f => (
                                <div key={f.key} className={f.full ? 'col-span-2' : ''}>
                                    <label className="block text-xs text-gray-400 font-medium mb-1">{f.label}</label>
                                    <input
                                        type={f.type}
                                        value={(editForm as any)[f.key] ?? ''}
                                        onChange={e => setEditForm(prev => ({ ...prev, [f.key]: e.target.value || null }))}
                                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/40"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={cancelEdit} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white text-sm">Cancel</button>
                            <button
                                onClick={saveEdit}
                                disabled={saving || !(editForm as any).name}
                                className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-sm font-semibold flex items-center justify-center gap-2"
                            >
                                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                {saving ? 'Saving...' : 'Save Medicine'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Search + Load ── */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => handleSearch(e.target.value)}
                        placeholder="Search medicines by name..."
                        className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 placeholder:text-gray-600"
                    />
                </div>
                {!loaded ? (
                    <button
                        onClick={() => fetchMedicines(0, '')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold"
                    >
                        <Database className="h-4 w-4" /> Load Database
                    </button>
                ) : (
                    <button onClick={() => fetchMedicines(page, search)} className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                )}
                {loaded && <span className="text-gray-500 text-sm">{totalCount.toLocaleString()} medicines total</span>}
            </div>

            {/* ── Table ── */}
            {loaded && (
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02]">
                                    {['Name', 'Salt Composition', 'Manufacturer', 'Form', 'Pack', 'GST', 'Actions'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr><td colSpan={7} className="text-center py-12 text-gray-500">
                                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />Loading...
                                    </td></tr>
                                ) : medicines.length === 0 ? (
                                    <tr><td colSpan={7} className="text-center py-12 text-gray-500">
                                        <Database className="h-8 w-8 mx-auto mb-2 opacity-30" />No medicines found
                                    </td></tr>
                                ) : medicines.map(med => (
                                    <tr key={med.id} className="hover:bg-white/[0.02] group transition-colors">
                                        <td className="px-4 py-3 text-white font-medium max-w-[200px]">
                                            <div className="truncate" title={med.name}>{med.name}</div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-400 max-w-[200px]">
                                            {med.salt_composition
                                                ? <span className="truncate block" title={med.salt_composition}>{med.salt_composition}</span>
                                                : <span className="text-gray-700 text-xs italic">—</span>}
                                        </td>
                                        <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                                            {med.manufacturer || <span className="text-gray-700 text-xs italic">—</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            {med.dosage_form
                                                ? <span className="px-2 py-0.5 bg-white/5 rounded-md text-xs text-gray-400">{med.dosage_form}</span>
                                                : <span className="text-gray-700 text-xs italic">—</span>}
                                        </td>
                                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                                            {med.pack_size ? `${med.pack_size} ${med.pack_unit || ''}` : <span className="text-gray-700 italic">—</span>}
                                        </td>
                                        <td className="px-4 py-3 text-xs whitespace-nowrap">
                                            {med.default_gst_rate != null
                                                ? <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded-md">{med.default_gst_rate}%</span>
                                                : <span className="text-gray-700 italic">—</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => startEdit(med)} className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all">
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </button>
                                                <button onClick={() => deleteMed(med.id, med.name)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
                            <span className="text-xs text-gray-500">
                                Showing {(page * PAGE_SIZE + 1).toLocaleString()}–{Math.min((page + 1) * PAGE_SIZE, totalCount).toLocaleString()} of {totalCount.toLocaleString()}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => { const p = page - 1; setPage(p); fetchMedicines(p, search); }}
                                    disabled={page === 0}
                                    className="p-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <span className="text-xs text-gray-400 px-2">Page {page + 1} of {totalPages}</span>
                                <button
                                    onClick={() => { const p = page + 1; setPage(p); fetchMedicines(p, search); }}
                                    disabled={page >= totalPages - 1}
                                    className="p-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {!loaded && !loading && (
                <div className="text-center py-24 text-gray-600">
                    <Database className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium text-gray-500">Click &quot;Load Database&quot; to browse medicines</p>
                    <p className="text-sm mt-1">Or use &quot;Bulk Upload CSV&quot; to import large datasets</p>
                </div>
            )}
        </div>
    );
}
