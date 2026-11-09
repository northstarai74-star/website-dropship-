// Safety net: Razorpay calls this server-to-server, so an order is still marked
// paid if the shopper closes the tab right after paying.
// Deploy with --no-verify-jwt (Razorpay does not send a Supabase JWT).
import { admin, hmacHex, safeEqual } from '../_shared/common.ts';
import { notifyOrder } from '../_shared/email.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const secret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');
  if (!secret) return new Response('Not configured', { status: 500 });

  const raw = await req.text(); // signature is over the exact raw body
  const signature = req.headers.get('x-razorpay-signature') ?? '';
  if (!safeEqual(await hmacHex(secret, raw), signature)) return new Response('Bad signature', { status: 400 });

  let event: any;
  try { event = JSON.parse(raw); } catch { return new Response('Bad JSON', { status: 400 }); }

  if (event.event === 'payment.captured' || event.event === 'order.paid') {
    const payment = event.payload?.payment?.entity;
    const razorpayOrderId = payment?.order_id ?? event.payload?.order?.entity?.id;
    if (razorpayOrderId) {
      const db = admin();
      const { data: order } = await db.from('orders')
        .select('id, total_cents, status').eq('razorpay_order_id', razorpayOrderId).maybeSingle();
      // Only mark paid if the captured amount matches what we expected.
      if (order && order.status !== 'paid' && (!payment || payment.amount === order.total_cents)) {
        await db.from('orders')
          .update({ status: 'paid', razorpay_payment_id: payment?.id ?? null, paid_at: new Date().toISOString() })
          .eq('id', order.id);
      }
      if (order && (!payment || payment.amount === order.total_cents)) {
        try { await notifyOrder(db, order.id); } catch (e) { console.error('notify failed', e); }
      }
    }
  }
  return new Response('ok', { status: 200 });
});
