# Needverse storefront

## Current implementation

Needverse is a static HTML, CSS, and JavaScript storefront with no build step. The site presents home wellness, comfort, and car-care products with a responsive catalog, search and category filters, product detail dialogs, a shopping bag, and checkout.

- Supabase Auth provides customer sign-in and account creation.
- Supabase stores the catalog and orders. Checkout creates orders through the `place_order` function.
- Razorpay handles online payment in test mode. Pay on delivery is also available.
- A Supabase Edge Function sends order notifications through Resend.
- INR product prices are configured in `app.js` and seeded in `supabase/schema.sql`.
- `dist/` is the deployable copy of the static site.

## Frontend and operations still to complete

- Connect an approved supplier and verify inventory, product specifications, and product imagery.
- Fill in business identity, customer support, GSTIN status, shipping charges and timelines, and the final returns window in `business-details.js` and the policy drafts.
- Have the privacy, terms, shipping, and returns drafts reviewed and finalized before launch.
- Replace Razorpay test configuration and remove the test-mode checkout notice before accepting live payments.
- Decide tax presentation and validate the final tax and delivery calculations.
- Add a newsletter provider before re-enabling the hidden newsletter section.
- Add phone number and state collection only after the `orders` schema and `place_order` function accept and validate those fields.
- Configure the deployed domain and local preview URL in Supabase Auth redirect settings.
