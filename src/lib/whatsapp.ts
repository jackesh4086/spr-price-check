// 方式1：走 n8n webhook（推荐，你最容易接现有系统）
// N8N_WA_WEBHOOK_URL 接收 { phone, message }
export async function sendWhatsAppOTP(phone: string, code: string) {
  const msg = `SPR TAC: ${code}\nValid for 5 minutes.\nDo not share this code.`;

  const webhook = process.env.N8N_WA_WEBHOOK_URL;
  if (webhook) {
    const r = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, message: msg }),
      cache: "no-store"
    });
    if (!r.ok) throw new Error(`Failed to send via n8n webhook: ${r.status}`);
    return;
  }

  // 方式2（临时测试）：不真正发送，只打印到 server log
  console.log(`[DEV ONLY] WhatsApp OTP to ${phone}: ${msg}`);
}
