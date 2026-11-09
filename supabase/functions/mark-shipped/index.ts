// Admin-only: record tracking and email the customer.
// Protected by the ADMIN_TOKEN secret (NOT by a user login). Call it from your terminal, e.g.:
//   curl -X POST https://<project>.supabase.co/functions/v1/mark-shipped \
//     -H "x-admin-token: <ADMIN_TOKEN>" -H "Content-Type: application/json" \
//     -d '{"number":"NV-123456","tracking_number":"ABC123","tracking_url":"https://..."}'
// Deploy with --no-verify-jwt.
import { admin, json, safeEqual } from '../_shared/common.ts';
import { sendShippedEmail } from '../_shared/email.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const token = Deno.env.get('ADMIN_TOKEN');
  const given = req.headers.get('x-admin-token') ?? '';
  if (!token || token.length < 24 || !safeEqual(token, given)) return json({ error: 'Unauthorized' }, 401);

  const b = await req.json().catch(() => ({}));
  const number = typeof b.number === 'string' ? b.number : '';
  const tracking = typeof b.tracking_number === 'string' ? b.tracking_number.trim().slice(0, 100) : '';
  const url = typeof b.tracking_url === 'string' && /^https:\/\//.test(b.tracking_url) ? b.tracking_url.slice(0, 500) : null;
  if (!/^NV-\d{6}$/.test(number) || !tracking) return json({ error: 'number and tracking_number required' }, 400);

  const db = admin();
  const { data: order } = await db.from('orders').select('*').eq('number', number).maybeSingle();
  if (!order) return json({ error: 'Order not found' }, 404);

  await db.from('orders').update({
    tracking_number: tracking, tracking_url: url, fulfilment_status: 'shipped', shipped_at: new Date().toISOString(),
    supplier_order_id: typeof b.supplier_order_id === 'string' ? b.supplier_order_id.slice(0, 100) : order.supplier_order_id
  }).eq('id', order.id);

  const emailed = await sendShippedEmail(order, tracking, url);
  return json({ ok: true, emailed });
});
