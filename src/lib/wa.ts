// WhatsApp OTP sending via n8n webhook

export async function sendWhatsAppOTP(phone: string, code: string): Promise<boolean> {
  const webhookUrl = process.env.N8N_WA_WEBHOOK_URL;

  // If n8n webhook is configured, use it
  if (webhookUrl) {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });

      if (!response.ok) {
        console.error(`[WhatsApp OTP] n8n webhook failed: ${response.status}`);
        return false;
      }

      console.log(`[WhatsApp OTP] Sent via n8n to ${phone}`);
      return true;
    } catch (error) {
      console.error('[WhatsApp OTP] n8n webhook error:', error);
      return false;
    }
  }

  // Fallback: log to console (dev mode)
  console.log(`[WhatsApp OTP] DEV MODE - Code ${code} for ${phone}`);
  return true;
}
