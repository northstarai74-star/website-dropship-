# Needverse storefront plan

## Goal

Create a calm, minimal storefront concept for Needverse: an everyday accessories shop spanning useful home and car products. The current build is a front-end preview only. Product names, artwork, and prices are illustrative placeholders.

## Experience and visual direction

- Use an editorial, product-led layout with generous whitespace, warm ivory surfaces, charcoal-brown text, and restrained material colors.
- Take structural cues from the reference retail site: a clear hero, curated product collection, category browsing, an about/story moment, and an email section.
- Keep Needverse's own brand, copy, and product illustrations; do not reproduce the reference's furniture assets or wording.
- Make the experience responsive across desktop, tablet, and mobile.
- Use custom vector product illustrations for the initial preview; replace them with approved product photography later.

## Page structure

1. Announcement bar and navigation
2. Hero statement and featured product illustration
3. Short brand-values ticker
4. Featured product grid
5. Home and auto category cards
6. Short brand introduction
7. Newsletter sign-up concept
8. Footer with basic navigation and preview label

## Front-end interactions in this preview

- Navigation links move to the relevant sections; mobile navigation opens and closes.
- Search filters the sample product cards by name or category.
- Category cards filter the featured items.
- Add buttons update the example bag count and display the sample line items and subtotal. The bag has quantity steppers and is remembered in `localStorage` between visits.
- Search and category filters work together; the view is reflected in the URL (`?cat=home&q=vacuum`) so it can be shared, and a live result count is announced to screen readers.
- Newsletter form submission displays a preview confirmation only.
- Drawers close with their close buttons, the page scrim, or Escape.

## Development

- Edit the root files (`index.html`, `app.js`, `styles.css`), then run `npm run build` to regenerate `dist/`. Do not edit `dist/` by hand.
- `npm start` serves the site locally on port 8080.

## Not connected yet

- Real catalog, inventory, or product images
- Product detail pages and variant selection
- Checkout, payments, tax, or shipping calculations
- Order processing, fulfillment, and customer notifications
- Newsletter storage or email marketing integration
- Customer accounts, analytics, and legal/policy pages

## Suggested next steps before launch

1. Confirm the product range, suppliers, costs, margins, and serviceable regions.
2. Replace sample names, copy, prices, and artwork with verified product information and licensed photography.
3. Choose an ecommerce platform and connect inventory, checkout, shipping, taxes, and order management.
4. Add customer support details, shipping/returns terms, privacy information, and other required store policies.
5. Connect and test email signup, analytics, and the final mobile shopping flow.
