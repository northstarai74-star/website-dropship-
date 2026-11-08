/* Needverse catalogue and content. All products, prices, ratings, specs and reviews are illustrative placeholders. */
(() => {
  'use strict';

  const SITE = {
    name: 'Needverse',
    freeShippingOver: 75,
    shipping: { standard: 5.95, express: 14.95 },
    promo: { code: 'NEEDVERSE10', percent: 10 },
    categories: {
      home: { label: 'Home', title: 'Home comforts', blurb: 'Small things that make coming home feel good.' },
      auto: { label: 'Car care', title: 'Car care', blurb: 'For a cleaner car and easier weekends away.' }
    }
  };

  const PRODUCTS = [
    {
      id: 'relaxer', name: 'The little relaxer', short: 'Compact massage gun', cat: 'home', price: 48, compare: 64,
      badge: 'Bestseller', rating: 4.8, reviews: 214, art: { kind: 'gun' }, colors: ['ivory', 'graphite', 'sage'],
      desc: 'A quiet, pocket-sized percussion massager for tired shoulders, calves and lower backs. Five speeds, a soft-touch grip and a battery that lasts the week.',
      features: ['Five speed settings from gentle to deep', 'Whisper-quiet brushless motor', 'Up to 6 hours per charge via USB-C', 'Four interchangeable heads included'],
      specs: [['Battery', '2000 mAh (example)'], ['Charge time', '2.5 hours'], ['Weight', '640 g'], ['Noise', 'Under 45 dB']],
      box: ['Massage gun', '4 attachment heads', 'USB-C cable', 'Travel pouch']
    },
    {
      id: 'landing', name: 'The soft landing', short: 'Air compression foot massager', cat: 'home', price: 72,
      rating: 4.7, reviews: 128, art: { kind: 'pad' }, colors: ['sage', 'sand', 'slate'],
      desc: 'Gentle air compression and optional heat that wraps each foot after a long day. Three modes and an auto shut-off make it easy to unwind.',
      features: ['Three compression modes, three intensities', 'Optional soothing heat', 'Removable, washable liner', 'Auto shut-off after 15 minutes'],
      specs: [['Power', 'Mains, 60 W (example)'], ['Fits', 'Up to EU 47 / US 13'], ['Weight', '3.1 kg'], ['Cord length', '1.5 m']],
      box: ['Foot massager', 'Remote control', 'Power adapter', 'Quick-start guide']
    },
    {
      id: 'mist', name: 'The quiet hour', short: 'Ultrasonic humidifier', cat: 'home', price: 39,
      badge: 'New', rating: 4.6, reviews: 58, art: { kind: 'cylinder', opts: { mist: true } }, colors: ['ivory', 'sand', 'sage'],
      desc: 'A calm, cool-mist humidifier that keeps dry rooms comfortable. The large tank runs overnight and the night mode switches the light off.',
      features: ['2.5 L tank, up to 20 hours of mist', 'Near-silent ultrasonic operation', 'Night mode turns the light off', 'Easy-fill top opening'],
      specs: [['Tank', '2.5 L'], ['Coverage', 'Up to 25 m²'], ['Power', '25 W'], ['Weight', '1.1 kg']],
      box: ['Humidifier', 'Power adapter', 'Cleaning brush', 'Manual']
    },
    {
      id: 'lamp', name: 'The warm glow', short: 'Rechargeable table lamp', cat: 'home', price: 34,
      badge: 'Bestseller', rating: 4.9, reviews: 301, art: { kind: 'lamp' }, colors: ['ivory', 'sand', 'graphite'],
      desc: 'A cordless lamp with a warm, dimmable glow. Move it from the dinner table to the bedside and back without hunting for a socket.',
      features: ['Touch dimming, three colour temperatures', 'Up to 24 hours of light on a charge', 'Splash-resistant, indoor or patio', 'Weighted base for stability'],
      specs: [['Battery', '4000 mAh (example)'], ['Light', '2200–4000 K'], ['Height', '28 cm'], ['Charging', 'USB-C']],
      box: ['Lamp', 'USB-C cable', 'Manual']
    },
    {
      id: 'speaker', name: 'The pocket room', short: 'Compact Bluetooth speaker', cat: 'home', price: 42,
      rating: 4.6, reviews: 97, art: { kind: 'speaker' }, colors: ['graphite', 'sand', 'sage'],
      desc: 'Full, warm sound from a speaker that fits on a shelf or in a bag. Pair two for stereo and take it from the kitchen to the garden.',
      features: ['12 hours of playtime', 'Water-resistant body', 'Pair two for stereo sound', 'Built-in microphone for calls'],
      specs: [['Bluetooth', '5.3 (example)'], ['Playtime', '12 hours'], ['Water rating', 'IPX5'], ['Weight', '480 g']],
      box: ['Speaker', 'USB-C cable', 'Wrist strap']
    },
    {
      id: 'desk', name: 'The tidy desk', short: 'Wireless charging stand', cat: 'home', price: 29,
      badge: 'New', rating: 4.5, reviews: 41, art: { kind: 'dock' }, colors: ['ivory', 'graphite', 'sand'],
      desc: 'A slim stand that charges your phone wirelessly at a comfortable viewing angle. Works through most thin cases.',
      features: ['15 W fast wireless charging', 'Portrait and landscape charging', 'Non-slip base and front lip', 'Quiet indicator light'],
      specs: [['Output', '15 W max (example)'], ['Compatibility', 'Qi-enabled phones'], ['Cable', '1.2 m USB-C'], ['Weight', '210 g']],
      box: ['Charging stand', 'USB-C cable', 'Manual']
    },
    {
      id: 'slate', name: 'The clean slate', short: 'Cordless car vacuum', cat: 'auto', price: 64, compare: 79,
      badge: 'Bestseller', rating: 4.7, reviews: 356, art: { kind: 'handvac' }, colors: ['ivory', 'graphite'],
      desc: 'A compact cordless vacuum made for seats, mats and the awkward gaps between them. Strong suction, a washable filter and three nozzles.',
      features: ['Strong cyclonic suction', 'Washable HEPA-style filter', 'Crevice, brush and flexible nozzles', 'Charges via USB-C'],
      specs: [['Suction', '9 kPa (example)'], ['Run time', 'Up to 25 minutes'], ['Bin', '0.4 L'], ['Weight', '690 g']],
      box: ['Vacuum', '3 nozzles', 'Filter', 'USB-C cable', 'Storage bag']
    },
    {
      id: 'rinse', name: 'The rinse cycle', short: 'Portable pressure washer', cat: 'auto', price: 89,
      rating: 4.6, reviews: 84, art: { kind: 'washer' }, colors: ['ivory', 'sage'],
      desc: 'A rechargeable pressure washer for cars, bikes and patio furniture. Draws from a bucket, so no tap is needed.',
      features: ['Draws water from any bucket', 'Adjustable spray patterns', '5 m hose and compact gun', 'Rechargeable battery'],
      specs: [['Pressure', '30 bar (example)'], ['Run time', 'About 20 minutes'], ['Hose', '5 m'], ['Weight', '2.4 kg']],
      box: ['Washer', 'Gun and hose', 'Nozzles', 'Charger']
    },
    {
      id: 'jump', name: 'The head start', short: 'Portable jump starter', cat: 'auto', price: 79,
      rating: 4.8, reviews: 162, art: { kind: 'jump' }, colors: ['graphite', 'sand'],
      desc: 'Jump-start a flat battery without a second car. The compact unit also charges phones and doubles as a torch.',
      features: ['Starts most petrol engines up to 6 L', 'Spark-proof, reverse-polarity protection', 'USB output to charge devices', 'Built-in torch'],
      specs: [['Peak current', '1000 A (example)'], ['Capacity', '12,000 mAh'], ['Weight', '780 g'], ['Cable', '40 cm']],
      box: ['Jump starter', 'Clamps', 'USB-C cable', 'Carry case']
    },
    {
      id: 'inflate', name: 'The right pressure', short: 'Cordless tyre inflator', cat: 'auto', price: 45,
      rating: 4.7, reviews: 203, art: { kind: 'inflator' }, colors: ['ivory', 'graphite', 'sage'],
      desc: 'Top up tyres in minutes. Set the target pressure and it stops by itself. Fits in a glovebox.',
      features: ['Digital gauge with auto stop', 'Works on cars, bikes and balls', 'Built-in LED light', 'Rechargeable battery'],
      specs: [['Max pressure', '150 PSI (example)'], ['Battery', '2000 mAh'], ['Weight', '520 g'], ['Charging', 'USB-C']],
      box: ['Inflator', 'Nozzles', 'USB-C cable', 'Pouch']
    },
    {
      id: 'dash', name: 'The second look', short: 'Dash camera', cat: 'auto', price: 59,
      rating: 4.5, reviews: 75, art: { kind: 'dashcam' }, colors: ['graphite', 'slate'],
      desc: 'A discreet front-facing dash camera that records in sharp 2K and saves clips automatically when it senses an impact.',
      features: ['2K recording with night vision', 'Automatic impact detection', 'Loop recording', 'Compact, low-profile design'],
      specs: [['Resolution', '2560 × 1440 (example)'], ['Field of view', '140°'], ['Storage', 'microSD up to 256 GB'], ['Weight', '95 g']],
      box: ['Camera', 'Mount', 'Car charger', 'Cable clips']
    },
    {
      id: 'air', name: 'The fresh start', short: 'Car air purifier', cat: 'auto', price: 37,
      badge: 'New', rating: 4.4, reviews: 33, art: { kind: 'cylinder', opts: { mist: false } }, colors: ['ivory', 'sand'],
      desc: 'A cup-holder air purifier that freshens the cabin with a replaceable filter. Quiet enough to forget it is on.',
      features: ['Fits standard cup holders', 'Replaceable filter', 'Three fan speeds', 'Runs from the car USB port'],
      specs: [['Filter life', 'About 6 months (example)'], ['Power', '5 V USB'], ['Noise', 'Under 40 dB'], ['Weight', '320 g']],
      box: ['Purifier', 'Filter', 'USB cable']
    }
  ];

  const REVIEWS = [
    { name: 'Alex M.', title: 'Exactly what I wanted', body: 'Arrived quickly, looks great on the shelf and does the job. Setup took about a minute.' },
    { name: 'Priya S.', title: 'Quietly impressive', body: 'Much quieter than I expected and the finish feels more expensive than the price.' },
    { name: 'Jordan T.', title: 'Good everyday buy', body: 'Simple, well made and easy to use. Would happily buy another as a gift.' },
    { name: 'Sam K.', title: 'Worth it', body: 'Battery life is better than promised. The colour matches our living room perfectly.' },
    { name: 'Maya R.', title: 'Thoughtful design', body: 'Small details like the grip and the cable length make it feel considered.' },
    { name: 'Chris L.', title: 'Does what it says', body: 'No fuss. Packaging was tidy and instructions were clear.' }
  ];

  const notice = '<p class="notice">Template text for the concept preview. Replace with reviewed, store-specific policies before launch.</p>';

  const PAGES = {
    shipping: {
      title: 'Shipping & delivery',
      html: `${notice}
        <h2>Delivery options</h2>
        <p>Standard delivery takes 5–12 business days and is free on orders over $75, otherwise $5.95. Express delivery takes 2–5 business days for $14.95.</p>
        <h2>Order processing</h2>
        <p>Orders are processed within 1–3 business days. You will receive an email with tracking details once your order is on its way.</p>
        <h2>Where we ship</h2>
        <p>We currently plan to ship to the United States, Canada, the United Kingdom and the European Union. Duties and import taxes, where they apply, are shown at checkout.</p>
        <h2>Delays and lost parcels</h2>
        <p>If your tracking has not moved for 7 days, contact us and we will investigate with the carrier and, if needed, replace or refund your order.</p>`
    },
    returns: {
      title: 'Returns & refunds',
      html: `${notice}
        <h2>30-day returns</h2>
        <p>If something is not right, tell us within 30 days of delivery. Items should be unused and in their original packaging.</p>
        <h2>How to start a return</h2>
        <ol><li>Email us your order number and the reason for the return.</li><li>We will send you a return label or instructions.</li><li>Once the parcel arrives and is checked, we refund the original payment method within 5–7 business days.</li></ol>
        <h2>Damaged or faulty items</h2>
        <p>Send us a photo and we will replace the item or refund you in full, including shipping.</p>`
    },
    faq: {
      title: 'Frequently asked questions',
      html: `<div class="faq">
        <details><summary>How long does delivery take?</summary><p>Standard delivery is 5–12 business days and express is 2–5 business days. You will get tracking by email.</p></details>
        <details><summary>Is shipping free?</summary><p>Standard shipping is free on orders over $75. Below that it is $5.95.</p></details>
        <details><summary>Can I return an item?</summary><p>Yes. Unused items can be returned within 30 days of delivery. See the returns page for the steps.</p></details>
        <details><summary>Do the products come with a warranty?</summary><p>Electrical items include a 12-month warranty against defects (example policy for this preview).</p></details>
        <details><summary>Which payment methods do you accept?</summary><p>Payments are not connected in this preview. The live store will list the supported methods at checkout.</p></details>
        <details><summary>How do I contact you?</summary><p>Use the contact page or email hello@needverse.example. We aim to reply within one business day.</p></details>
      </div>`
    },
    contact: { title: 'Contact us', html: '' },
    about: {
      title: 'About Needverse',
      html: `<p class="lead">Useful things earn their place in our homes and our routines.</p>
        <p>Needverse brings home comforts, car care and everyday essentials together in one considered edit. We choose products that solve a small problem well, look good while doing it, and are priced fairly.</p>
        <h2>How we choose</h2>
        <p>Every product is tested for build quality, safety certification and honest performance before it joins the shop. If we would not use it ourselves, it does not make the edit.</p>
        <h2>Looking after you</h2>
        <p>Clear delivery times, easy returns and a human on the other end of every email. That is the whole idea.</p>`
    },
    privacy: {
      title: 'Privacy policy',
      html: `${notice}
        <h2>What we collect</h2>
        <p>When you place an order or sign up for emails we collect the details you give us, such as your name, email address and delivery address.</p>
        <h2>How we use it</h2>
        <p>To process and deliver orders, provide support, and, if you opt in, send occasional product news. We do not sell your personal information.</p>
        <h2>Your choices</h2>
        <p>You can ask to access, correct or delete your information, or unsubscribe from emails at any time by contacting us.</p>`
    },
    terms: {
      title: 'Terms of service',
      html: `${notice}
        <h2>Using this site</h2>
        <p>By using this site you agree to these terms. Product information, prices and availability may change without notice.</p>
        <h2>Orders</h2>
        <p>An order is accepted when we send a shipping confirmation. We may cancel an order, for example because of a pricing error, and will refund you in full.</p>
        <h2>Liability</h2>
        <p>To the extent permitted by law, our liability is limited to the price you paid for the product concerned.</p>`
    }
  };

  window.NV = Object.assign(window.NV || {}, { SITE, PRODUCTS, REVIEWS, PAGES });
})();
