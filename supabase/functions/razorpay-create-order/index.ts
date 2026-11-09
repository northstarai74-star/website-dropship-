// Creates a Razorpay order for an existing pending Needverse order.
// The amount comes from OUR database, never from the browser.
import { admin, cors, getUser, isUuid, json } from '../_shared/common.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const keyId = Deno.env.get('RAZORPAY_KEY_ID');
  const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
  if (!keyId || !keySecret) return json({ error: 'Payments not configured' }, 500);

  const user = await getUser(req);
  if (!user) return json({ error: 'Sign in required' }, 401);

  const body = await req.json().catch(() => ({}));
  if (!isUuid(body.order_id)) return json({ error: 'Invalid order' }, 400);

  const db = admin();
  const { data: order, error } = await db.from('orders').select('*').eq('id', body.order_id).maybeSingle();
  if (error || !order || order.user_id !== user.id) return json({ error: 'Order not found' }, 404);
  if (order.payment_method !== 'online') return json({ error: 'Order is not an online payment' }, 400);
  if (order.status === 'paid') return json({ error: 'Order already paid' }, 409);

  // Reuse an existing Razorpay order if one was already created (e.g. shopper closed the popup and retried).
  let razorpayOrderId: string | null = order.razorpay_order_id;
  if (!razorpayOrderId) {
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Basic ' + btoa(`${keyId}:${keySecret}`) },
      body: JSON.stringify({
        amount: order.total_cents, // paise
        currency: order.currency,
        receipt: order.number,
        notes: { needverse_order: order.number }
      })
    });
    const rz = await res.json().catch(() => ({}));
    if (!res.ok || !rz.id) {
      console.error('razorpay order create failed', res.status, rz?.error?.description);
      return json({ error: 'Could not start payment' }, 502);
    }
    razorpayOrderId = rz.id as string;
    const { error: upErr } = await db.from('orders').update({ razorpay_order_id: razorpayOrderId }).eq('id', order.id);
    if (upErr) { console.error('save razorpay id failed', upErr.message); return json({ error: 'Could not start payment' }, 500); }
  }

  return json({
    key_id: keyId, // public identifier, safe to send to the browser
    razorpay_order_id: razorpayOrderId,
    amount: order.total_cents,
    currency: order.currency,
    number: order.number,
    name: order.name,
    email: order.email
  });
});
