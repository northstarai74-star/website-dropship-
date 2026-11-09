// Order emails via Resend + the fulfilment hook.
// Secrets: RESEND_API_KEY, EMAIL_FROM (e.g. "Needverse <orders@yourdomain.com>"), ADMIN_EMAIL.
// Until your domain is verified in Resend, use EMAIL_FROM="Needverse <onboarding@resend.dev>";
// Resend then only delivers to the email address of your own Resend account.

import { sendToSupplier } from './supplier.ts';

type Db = ReturnType<typeof import('./common.ts').admin>;

export const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export const rupees = (paise: number) =>
  '₹' + (paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 });

export async function sendEmail(to: string | string[], subject: string, html: string): Promise<boolean> {
  const key = Deno.env.get('RESEND_API_KEY');
  if (!key) { console.error('RESEND_API_KEY not set; email skipped'); return false; }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: Deno.env.get('EMAIL_FROM') ?? 'Needverse <onboarding@resend.dev>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html
    })
  });
  if (!res.ok) { console.error('resend failed', res.status, (await res.text()).slice(0, 300)); return false; }
  return true;
}

const shell = (body: string) =>
  `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#22231f">
  <h2 style="font-family:Georgia,serif;font-weight:400">needverse.</h2>${body}
  <p style="color:#777;font-size:12px;margin-top:28px">This is an automated message from Needverse.</p></div>`;

const itemsTable = (items: any[]) =>
  `<table style="width:100%;border-collapse:collapse;font-size:14px">${items.map((i) =>
    `<tr><td style="padding:6px 0;border-bottom:1px solid #eee">${esc(i.name)} × ${i.qty}</td>
     <td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right">${rupees(i.unit_cents * i.qty)}</td></tr>`).join('')}</table>`;

/** Idempotent: safe to call from verify, the webhook, and COD confirmation. */
export async function notifyOrder(db: Db, orderId: string) {
  // Atomically claim the right to notify, so retries/webhook+verify never double-send.
  const { data: claimed } = await db.from('orders')
    .update({ confirmation_sent_at: new Date().toISOString() })
    .eq('id', orderId).is('confirmation_sent_at', null).select('*').maybeSingle();
  if (!claimed) return;

  const { data: items } = await db.from('order_items').select('product_id, name, unit_cents, qty').eq('order_id', orderId);
  const lines = items ?? [];
  const paidText = claimed.payment_method === 'online' ? 'Payment received.' : 'Pay on delivery - please keep the amount ready.';

  const customerOk = await sendEmail(claimed.email, `Your Needverse order ${claimed.number}`, shell(
    `<p>Hi ${esc(claimed.name)}, thank you for your order <b>${esc(claimed.number)}</b>. ${paidText}</p>
     ${itemsTable(lines)}
     <p style="text-align:right"><b>Total ${rupees(claimed.total_cents)}</b></p>
     <p>Delivering to:<br>${esc(claimed.name)}, ${esc(claimed.address)}, ${esc(claimed.city)} ${esc(claimed.postal)}</p>
     <p>We'll email you again when it ships.</p>`));

  const supplierOrderId = await sendToSupplier(claimed, lines as any).catch((e) => { console.error('supplier failed', e); return null; });
  if (supplierOrderId) {
    await db.from('orders').update({ supplier_order_id: supplierOrderId, fulfilment_status: 'sent_to_supplier' }).eq('id', orderId);
  }

  const adminTo = Deno.env.get('ADMIN_EMAIL');
  const adminOk = adminTo ? await sendEmail(adminTo, `New order ${claimed.number} (${claimed.payment_method})`, shell(
    `<p><b>${esc(claimed.number)}</b> - ${esc(claimed.payment_method === 'online' ? 'PAID online' : 'COD')} - ${rupees(claimed.total_cents)}</p>
     ${itemsTable(lines)}
     <p>${esc(claimed.name)} &lt;${esc(claimed.email)}&gt;<br>${esc(claimed.address)}, ${esc(claimed.city)} ${esc(claimed.postal)}</p>
     <p>${supplierOrderId ? 'Sent to supplier: ' + esc(supplierOrderId) : 'Place this order with your supplier, then use mark-shipped to send tracking.'}</p>`)) : true;

  // If neither email went out, release the claim so a retry can try again.
  if (!customerOk && !adminOk) await db.from('orders').update({ confirmation_sent_at: null }).eq('id', orderId);
}

export async function sendShippedEmail(order: any, trackingNumber: string, trackingUrl: string | null) {
  const link = trackingUrl ? `<p><a href="${esc(trackingUrl)}">Track your parcel</a></p>` : '';
  return sendEmail(order.email, `Your Needverse order ${order.number} has shipped`, shell(
    `<p>Hi ${esc(order.name)}, your order <b>${esc(order.number)}</b> is on its way.</p>
     <p>Tracking number: <b>${esc(trackingNumber)}</b></p>${link}`));
}
