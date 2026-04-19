import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://xznwdmfjkiwtkegsdxoo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bndkbWZqa2l3dGtlZ3NkeG9vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI0ODI0NCwiZXhwIjoyMDg0ODI0MjQ0fQ.Zr9r43zEtbJN6TBhtr79JWRwCcsA0aIp_dtm7zSZ_I4'
);

async function testInsert() {
  console.log('Testing payload with a concrete date...');
  
  const payload = {
    name: 'TEST_LICENSE_PROVISION',
    owner_name: 'Provision Owner',
    phone: '0987654321',
    email: 'provision@example.com',
    subscription_status: 'active',
    subscription_end_date: '2025-12-31'
  };

  const { data, error } = await supabase.from('pharmacies').insert([payload]).select();
  
  if (error) {
    console.error('Insert failed:', error);
  } else {
    console.log('Insert succeeded successfully without violating constraints!');
    console.log(data);
    
    // Clean up our test pharmacy
    if (data && data[0] && data[0].id) {
      await supabase.from('pharmacies').delete().eq('id', data[0].id);
      console.log('Test record cleaned up successfully.');
    }
  }
}

testInsert();
