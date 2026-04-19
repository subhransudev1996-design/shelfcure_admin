import { Resend } from 'resend';
import { config } from 'dotenv';

// Load env vars from .env.local
config({ path: '.env.local' });

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.error('❌ RESEND_API_KEY not found in .env.local');
  process.exit(1);
}

const resend = new Resend(apiKey);

async function testResend() {
  console.log('Testing Resend API Key...');
  
  const { data, error } = await resend.emails.send({
    from: 'Shelfcure <info@shelfcure.com>',
    to: 'delivered@resend.dev',
    subject: 'Test Email from Shelfcure',
    html: '<p>If you see this, the API key is working perfectly!</p>',
  });

  if (error) {
    console.error('❌ Resend Error Details:', error);
  } else {
    console.log('✅ Resend test succeeded! Details:', data);
  }
}

testResend();
