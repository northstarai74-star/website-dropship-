// Confirmation for PAY-ON-DELIVERY orders (online orders are confirmed by razorpay-verify / webhook).
import { admin, cors, getUser, isUuid, json } from '../_shared/common.ts';
import { notifyOrder } from '../_shared/email.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const user = await getUser(req);
  if (!user) return json({ error: 'Sign in required' }, 401);
  const body = await req.json().catch(() => ({}));
  if (!isUuid(body.order_id)) return json({ error: 'Invalid order' }, 400);

  const db = admin();
  const { data: order } = await db.from('orders').select('id, user_id, payment_method').eq('id', body.order_id).maybeSingle();
  if (!order || order.user_id !== user.id || order.payment_method !== 'delivery') return json({ error: 'Order not found' }, 404);

  await notifyOrder(db, order.id);
  return json({ ok: true });
});
