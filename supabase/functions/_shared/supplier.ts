// ============================================================================
//  SUPPLIER INTEGRATION - PLACEHOLDER (intentionally not connected yet)
// ============================================================================
//  Called once per confirmed order from notifyOrder() in email.ts.
//  Right now it does NOTHING and returns null, so the store works without a
//  supplier: the admin email tells you to place the supplier order by hand.
//
//  To connect a supplier later, only THIS file changes:
//    1. Add the supplier's secrets:  supabase secrets set SUPPLIER_API_KEY=... SUPPLIER_API_URL=...
//    2. Set SUPPLIER_ENABLED=true
//    3. Implement sendToSupplier() below: map our order -> their API payload, POST it,
//       and return THEIR order id (it is saved to orders.supplier_order_id and the
//       order is marked fulfilment_status = 'sent_to_supplier').
//    4. Put each product's supplier SKU in products.supplier_sku (and supplier_name).
//    5. For tracking coming back from the supplier, add a webhook function that calls
//       the same logic as mark-shipped (see ../mark-shipped/index.ts).
//
//  Questions to settle with the supplier first: do they offer an order API and
//  tracking webhooks, ship to India, and support pay-on-delivery?
// ============================================================================

export interface SupplierOrder {
  number: string;            // our order number, e.g. NV-123456
  name: string;
  email: string;
  address: string;
  city: string;
  postal: string;
  payment_method: 'online' | 'delivery';
  total_cents: number;       // paise
}

export interface SupplierLine {
  product_id: string;        // our product id; look up products.supplier_sku for theirs
  name: string;
  qty: number;
  unit_cents: number;        // paise
}

/** Returns the supplier's order id, or null when no supplier is connected. */
export async function sendToSupplier(_order: SupplierOrder, _lines: SupplierLine[]): Promise<string | null> {
  if (Deno.env.get('SUPPLIER_ENABLED') !== 'true') return null; // not connected: do nothing

  // TODO(supplier): implement the real call here. Example shape:
  //   const res = await fetch(Deno.env.get('SUPPLIER_API_URL')!, {
  //     method: 'POST',
  //     headers: { Authorization: `Bearer ${Deno.env.get('SUPPLIER_API_KEY')}`, 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ reference: _order.number, ship_to: {...}, items: [...] })
  //   });
  //   if (!res.ok) throw new Error('supplier rejected order');
  //   return (await res.json()).order_id;
  throw new Error('SUPPLIER_ENABLED is true but sendToSupplier() is not implemented yet');
}
