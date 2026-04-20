import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const DOWNLOAD_URL = process.env.SHELFCURE_DOWNLOAD_URL || 'https://shelfcure.com/downloads/ShelfCure_Setup.exe';

export async function POST(request: Request) {
    try {
        const payload = await request.json();
        const { email, pharmacyName, licenseKey, plan, expiryDays } = payload;

        if (!email) {
            return NextResponse.json({ error: 'No email address provided' }, { status: 400 });
        }

        let planText = 'Standard License';
        if (expiryDays === '7') planText = '7-Day Trial';
        else if (expiryDays === '30') planText = '30-Day Demo';
        else if (expiryDays === '365') planText = '1-Year Subscription';
        else if (expiryDays === '730') planText = '2-Year Subscription';
        else if (expiryDays === 'lifetime') planText = 'Lifetime Access';

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                            <!-- Header -->
                            <tr>
                                <td style="background: linear-gradient(135deg, #4f46e5 0%, #312e81 100%); padding: 40px 30px; text-align: center;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;">Shelfcure</h1>
                                    <p style="color: #a5b4fc; margin: 15px 0 0 0; font-size: 16px;">Next-Generation Pharmacy Intelligence</p>
                                </td>
                            </tr>
                            
                            <!-- Body -->
                            <tr>
                                <td style="padding: 40px 30px;">
                                    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 22px;">Welcome aboard, ${pharmacyName}!</h2>
                                    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                        Your Shelfcure ${planText} has been successfully provisioned. You are just one step away from revolutionizing your pharmacy's operations with state-of-the-art AI analytics and robust inventory management.
                                    </p>
                                    
                                    <!-- License Box -->
                                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; text-align: center; margin-bottom: 30px;">
                                        <div style="margin-bottom: 25px; padding-bottom: 25px; border-bottom: 1px dashed #cbd5e1;">
                                            <p style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0; font-weight: 700;">Purchase Type</p>
                                            <div style="display: inline-block; background-color: #e0e7ff; color: #4338ca; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; border: 1px solid #c7d2fe;">
                                                ${planText}
                                            </div>
                                        </div>
                                        
                                        <p style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0; font-weight: 700;">Your Activation Key</p>
                                        <div style="background-color: #1e1b4b; color: #a5b4fc; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 20px; font-weight: bold; letter-spacing: 2px;">
                                            ${licenseKey}
                                        </div>
                                    </div>
                                    
                                    <h3 style="color: #1f2937; font-size: 18px; margin: 0 0 15px 0;">Next Steps</h3>
                                    <ul style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0; padding-left: 20px;">
                                        <li style="margin-bottom: 10px;"><strong>Download the Client:</strong> Head to the Shelfcure Portal and download the latest Windows/Mac Desktop Client.</li>
                                        <li style="margin-bottom: 10px;"><strong>Activate:</strong> Open the application and paste your Activation Key when prompted.</li>
                                        <li><strong>Sync Data:</strong> Allow 5-10 minutes for your initial inventory and Master Medicines sync to complete.</li>
                                    </ul>
                                    
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td align="center">
                                                <a href="${DOWNLOAD_URL}" style="display: inline-block; padding: 14px 30px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Download Shelfcure</a>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                                    <p style="color: #94a3b8; font-size: 14px; margin: 0;">
                                        Need help? Reply to this email or visit our <a href="https://shelfcure.com/support" style="color: #4f46e5; text-decoration: none;">Support Center</a>.
                                    </p>
                                    <p style="color: #94a3b8; font-size: 12px; margin: 15px 0 0 0;">
                                        &copy; ${new Date().getFullYear()} Shelfcure Inc. All rights reserved.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        `;

        if (!resend) {
            return NextResponse.json({ success: true, message: 'Email skipped — RESEND_API_KEY not configured' });
        }

        // Note: Unless a custom domain is verified, Resend requires testing with their onboarding domain.
        const data = await resend.emails.send({
            from: 'Shelfcure <info@shelfcure.com>',
            to: email,
            subject: 'Your Shelfcure License Key is Ready',
            html: htmlContent,
        });

        if (data.error) {
            console.error('Resend Error:', data.error);
            return NextResponse.json({ error: data.error }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Error sending license email:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
