// Verifies the signature Razorpay Checkout returns, then marks the order paid.
// signature = HMAC_SHA256(razorpay_order_id + "|" + razorpay_payment_id, key_secret)
import { admin, cors, getUser, hmacHex, isUuid, json, safeEqual } from '../_shared/common.ts';
import { notifyOrder } from '../_shared/email.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
  if (!keySecret) return json({ error: 'Payments not configured' }, 500);

  const user = await getUser(req);
  if (!user) return json({ error: 'Sign in required' }, 401);

  const b = await req.json().catch(() => ({}));
  const { order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = b;
  if (!isUuid(order_id) || [razorpay_order_id, razorpay_payment_id, razorpay_signature].some((v) => typeof v !== 'string' || !v)) {
    return json({ error: 'Invalid request' }, 400);
  }

  const db = admin();
  const { data: order } = await db.from('orders').select('id, status, razorpay_order_id, user_id').eq('id', order_id).maybeSingle();
  // The order must belong to this user, and the Razorpay order must be the one WE created for it.
  if (!order || order.user_id !== user.id || order.razorpay_order_id !== razorpay_order_id) return json({ error: 'Order mismatch' }, 400);

  const expected = await hmacHex(keySecret, `${razorpay_order_id}|${razorpay_payment_id}`);
  if (!safeEqual(expected, razorpay_signature)) return json({ error: 'Signature verification failed' }, 400);

  if (order.status !== 'paid') {
    const { error } = await db.from('orders')
      .update({ status: 'paid', razorpay_payment_id, paid_at: new Date().toISOString() })
      .eq('id', order_id);
    if (error) { console.error('mark paid failed', error.message); return json({ error: 'Could not update order' }, 500); }
  }
  // Idempotent: safe even if the webhook already notified. Never blocks the shopper's success.
  try { await notifyOrder(db, order_id); } catch (e) { console.error('notify failed', e); }
  return json({ ok: true });
});
