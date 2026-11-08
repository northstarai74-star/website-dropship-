# Needverse storefront plan

## Goal

A calm, minimal, full-featured storefront concept for Needverse: an everyday accessories shop spanning useful home and car products. The current build is a complete **front-end preview** (no backend). Product names, artwork, prices, ratings, reviews and policy text are illustrative placeholders.

## What is built

Hash-routed single-page store (works on any static host, no server rewrites needed):

| Route | Page |
| --- | --- |
| `#/` | Home: hero, trust strip, bestsellers, categories, new in, about, sample reviews |
| `#/shop`, `#/shop/home`, `#/shop/auto` | Catalogue with category filter, sort, search results (`?sort=`, `?q=`) |
| `#/product/<id>` | Product page: colour variants, quantity, add to bag, buy now, features, specs, box contents, sample reviews, related products |
| `#/checkout` | Contact + delivery form, shipping method, order summary (no payment taken) |
| `#/order` | Demo order confirmation |
| `#/page/<slug>` | Shipping, returns, FAQ, contact, about, privacy, terms (template text) |

Cross-site features: bag drawer with quantity steppers, free-shipping progress bar and promo code (`NEEDVERSE10`), bag persisted in `localStorage`, live search suggestions, accessible focus management, responsive layout, studio-lit product art generated from code in every colourway.

## Files

- `index.html`: shell (header, footer, drawers)
- `data.js`: catalogue, reviews, policy copy, shipping rules. **Edit products here.**
- `art.js`: generates product images from shape + colour palette
- `app.js`: router, views, bag, checkout
- `styles.css`: all styles
- `tests/smoke.mjs`: browser test (`npm test`)

## Development

- Edit the root files, then run `npm run build` to regenerate `dist/`. Do not edit `dist/` by hand.
- `npm start` serves the site locally on port 8080. `npm test` runs the Playwright smoke test.

## Not connected yet

- Real catalogue, inventory and product photography (art is placeholder)
- Payments, tax and shipping rate calculation (checkout collects details only; nothing is charged)
- Order processing, fulfilment and customer notifications
- Newsletter and contact form delivery
- Customer accounts, real reviews, analytics
- Legally reviewed policies

## Suggested next steps before launch

1. Confirm product range, suppliers, costs, margins and serviceable regions.
2. Replace sample names, copy, prices, ratings and artwork with verified information and licensed photography.
3. Choose an ecommerce platform (for example Shopify, or Stripe plus a backend) and connect inventory, checkout, shipping, taxes and order management. A platform also gives crawlable product URLs, which this hash-routed preview does not.
4. Replace the template policies with reviewed ones and add real support details.
5. Connect email signup and analytics, then test the full mobile shopping flow.
