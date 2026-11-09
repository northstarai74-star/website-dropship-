# Needverse launch checklist

## Business details

Replace the values in `business-details.js` so the shared footer and policy pages update together:

- [ ] `BUSINESS_NAME` — registered business / seller name.
- [ ] `SUPPORT_EMAIL` — monitored customer support email.
- [ ] `SUPPORT_PHONE` — customer support phone number.
- [ ] `BUSINESS_ADDRESS` — business address for notices and policy disclosures.
- [ ] `GSTIN_IF_ANY` — GSTIN, or `Not applicable` if the business does not have one.

## Store policies and operations

- [ ] Replace `[SHIPPING_TIMES]` with the confirmed dispatch and delivery estimates.
- [ ] Replace `[SHIPPING_CHARGES]` with the confirmed delivery charges and any conditions for free delivery.
- [ ] Confirm the draft return window: 7 days for damaged or defective items. Update `returns.html` with the final approved policy.
- [ ] Have `shipping.html`, `returns.html`, `privacy.html`, and `terms.html` reviewed by an India-qualified legal advisor and complete any required disclosures.
- [ ] Confirm final tax handling and how it should be shown in the order summary.
- [ ] Connect an approved supplier; verify live stock, product specifications, product claims, and licensed product photos.
- [ ] Replace Razorpay test credentials with production credentials and remove the `data-test-mode` notice before taking live payments.
- [ ] Configure production and local callback URLs in Supabase Auth redirect settings.
- [ ] Re-enable the hidden newsletter section only after a newsletter backend/provider is connected.

## Backend changes needed

- [ ] Before collecting a customer phone number or state, add and validate the fields in `public.orders` and update `public.place_order`; update the client payload only after that backend migration is deployed.
- [ ] No supplier, inventory, or fulfillment integration is connected yet.
