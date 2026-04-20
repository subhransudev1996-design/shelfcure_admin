import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xznwdmfjkiwtkegsdxoo.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bndkbWZqa2l3dGtlZ3NkeG9vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI0ODI0NCwiZXhwIjoyMDg0ODI0MjQ0fQ.Zr9r43zEtbJN6TBhtr79JWRwCcsA0aIp_dtm7zSZ_I4';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const EMAIL = 'admin@shelfcure.com';
const PASSWORD = 'ShelfCure@Admin2026';
const FULL_NAME = 'Super Admin';

async function createSuperAdmin() {
    console.log('Creating super admin user...');

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: EMAIL,
        password: PASSWORD,
        email_confirm: true,
    });

    if (authError) {
        // If user already exists, try to get the user
        if (authError.message.includes('already been registered')) {
            console.log('Auth user already exists, updating users table...');
            const { data: { users } } = await supabase.auth.admin.listUsers();
            const existingUser = users.find(u => u.email === EMAIL);
            if (existingUser) {
                await upsertUserRecord(existingUser.id);
                return;
            }
        }
        console.error('Auth error:', authError.message);
        return;
    }

    console.log('Auth user created:', authData.user.id);

    // 2. Insert into users table
    await upsertUserRecord(authData.user.id);
}

async function upsertUserRecord(authUserId) {
    // Check if record already exists
    const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', authUserId)
        .single();

    if (existing) {
        // Update role to super_admin
        const { error } = await supabase
            .from('users')
            .update({ role: 'super_admin', is_active: true })
            .eq('auth_user_id', authUserId);

        if (error) {
            console.error('Update error:', error.message);
        } else {
            console.log('User role updated to super_admin');
        }
    } else {
        // Insert new record
        const { error } = await supabase
            .from('users')
            .insert({
                auth_user_id: authUserId,
                full_name: FULL_NAME,
                email: EMAIL,
                role: 'super_admin',
                is_active: true,
            });

        if (error) {
            console.error('Insert error:', error.message);
        } else {
            console.log('User record created in users table');
        }
    }

    console.log('\n✅ Super Admin created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Email:    ${EMAIL}`);
    console.log(`  Password: ${PASSWORD}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

createSuperAdmin().catch(console.error);
