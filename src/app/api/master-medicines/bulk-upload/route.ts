import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Use service role key if set and valid (starts with eyJ = real JWT)
// Falls back to anon key if service role is not configured yet
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const apiKey = (serviceKey && serviceKey.startsWith('eyJ'))
    ? serviceKey
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    apiKey
);

const BATCH_SIZE = 100; // Supabase handles 100 rows per request efficiently

export async function POST(req: NextRequest) {
    try {
        const { rows } = await req.json() as { rows: Record<string, any>[] };

        if (!rows || rows.length === 0) {
            return NextResponse.json({ error: 'No rows provided' }, { status: 400 });
        }

        // Sanitize rows
        const sanitized = rows
            .filter(r => r.name && typeof r.name === 'string' && r.name.trim().length > 0)
            .map(r => ({
                name: r.name.trim(),
                salt_composition: r.salt_composition?.trim() || null,
                strength: r.strength?.trim() || null,
                manufacturer: r.manufacturer?.trim() || null,
                dosage_form: r.dosage_form?.trim() || null,
                pack_size: r.pack_size ? Number(r.pack_size) || null : null,
                pack_unit: r.pack_unit?.trim() || null,
                units_per_pack: r.units_per_pack ? Number(r.units_per_pack) || null : null,
                hsn_code: r.hsn_code?.trim() || null,
                default_gst_rate: r.default_gst_rate ? Number(r.default_gst_rate) || null : null,
                barcode: r.barcode?.trim() || null,
            }));

        let totalInserted = 0;
        let totalSkipped = 0;
        const errors: string[] = [];

        // Process in batches of 100
        for (let i = 0; i < sanitized.length; i += BATCH_SIZE) {
            const batch = sanitized.slice(i, i + BATCH_SIZE);

            const { error, count } = await supabaseAdmin
                .from('master_medicines')
                .insert(batch, { count: 'exact' });

            if (error) {
                // If batch fails due to duplicate, try one-by-one to salvage valid rows
                if (error.code === '23505') { // unique_violation
                    for (const row of batch) {
                        const { error: rowErr } = await supabaseAdmin
                            .from('master_medicines')
                            .insert([row]);
                        if (rowErr) {
                            totalSkipped++;
                        } else {
                            totalInserted++;
                        }
                    }
                } else {
                    errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
                    totalSkipped += batch.length;
                }
            } else {
                totalInserted += count || batch.length;
            }
        }

        return NextResponse.json({
            success: true,
            inserted: totalInserted,
            skipped: totalSkipped,
            errors: errors.length > 0 ? errors : undefined,
        });

    } catch (e: any) {
        console.error('Bulk upload error:', e);
        return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
    }
}
