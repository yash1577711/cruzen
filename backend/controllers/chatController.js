const ChatMessage = require('../models/ChatMessage');
const Lead = require('../models/Lead');
const { v4: uuidv4 } = require('uuid');

// ─── LANGUAGE DETECTION ───────────────────────────────────────
function detectLang(text) {
  // Devanagari script → Hindi
  if (/[ऀ-ॿ]/.test(text)) return 'hi';
  // Common Hinglish trigger words
  if (/\b(kya|kaise|batao|bataiye|chahiye|kitna|kitne|kab|kyun|haan|nahi|nahin|mujhe|humko|aapka|hamare|karana|karega|karein|dijiye|milega|milegi|accha|theek|sahi|bohot|bahut|thoda|zyada|abhi|toh|aur|ya|hai|hain|tha|thi|ho|hoga|hogi|karo|karna|lena|dena|zaroorat|jarurat|samjhao|dikhao|batana|bolna|dekhna|sunna|paisa|rupaye|rupaya|account|seller|bikri|dukaan|website|banana)\b/i.test(text)) return 'hi';
  return 'en';
}

// ─── FULL SERVICE CATALOG ─────────────────────────────────────
const SERVICES = {
  amazon: {
    name: 'Amazon Management',
    tag: 'SPN Partner',
    desc: 'End-to-end Amazon seller account management — listings, PPC campaigns, A+ content, growth calls & competitor analysis.',
    plans: { Basic: '₹3,855/mo', Standard: '₹5,931/mo', Popular: 'Standard', Premium: '₹10,999/mo' },
    features: ['Product listing & optimization (50–150 SKUs)', 'Keyword research & title/description writing', 'PPC / Sponsored Ads campaign management', 'A+ content & EBC creation', 'Claim submissions & competitor analysis', 'Weekly growth calls', 'Performance reports'],
    link: '/services?service=amazon',
  },
  flipkart: {
    name: 'Flipkart Management',
    tag: 'Official Partner',
    desc: 'Complete Flipkart seller account management — catalogue, campaigns, claim handling & performance tracking.',
    plans: { Basic: '₹3,588/mo', Standard: '₹5,931/mo', Popular: 'Standard', Premium: '₹10,999/mo' },
    features: ['Catalogue creation & optimization', 'Campaign & promotion management', 'Claim submissions (10–25)', 'Title & image optimization', 'Performance management & reporting'],
    link: '/services?service=flipkart',
  },
  meesho: {
    name: 'Meesho Management',
    tag: 'Verified Seller',
    desc: 'Grow your Meesho reseller business with optimized catalogues, pricing strategy & promotions.',
    plans: { Basic: '₹2,999/mo', Standard: '₹4,999/mo', Popular: 'Standard', Premium: '₹8,999/mo' },
    features: ['Catalogue upload & keyword optimization', 'Pricing strategy & visibility boost', 'Campaign management', 'Growth calls & performance reports'],
    link: '/services?service=meesho',
  },
  ajio: {
    name: 'Ajio Management',
    tag: 'Fashion Expert',
    desc: 'Fashion-first account management for Ajio sellers — listings, brand store & campaign strategy.',
    plans: { Basic: '₹2,999/mo', Standard: '₹4,999/mo', Popular: 'Standard', Premium: '₹8,999/mo' },
    features: ['Fashion catalogue listing', 'Keyword & trend-based optimization', 'Campaign management', 'Brand store setup (Premium)'],
    link: '/services?service=ajio',
  },
  myntra: {
    name: 'Myntra Management',
    tag: 'Brand Partner',
    desc: 'Complete Myntra brand partner management — catalogue, inventory, campaigns & style content.',
    plans: { Basic: '₹3,499/mo', Standard: '₹5,499/mo', Popular: 'Standard', Premium: '₹9,999/mo' },
    features: ['SKU catalogue management', 'Style tag & keyword optimization', 'Campaign management', 'Performance reports & brand story (Premium)'],
    link: '/services?service=myntra',
  },
  nykaa: {
    name: 'Nykaa Management',
    tag: 'Beauty Expert',
    desc: 'Beauty & wellness specialist account management on Nykaa — listings, A+ content & ads.',
    plans: { Basic: '₹2,999/mo', Standard: '₹4,999/mo', Popular: 'Standard', Premium: '₹8,999/mo' },
    features: ['Beauty product listing & ingredient keywords', 'Competitor analysis', 'Campaign management', 'Performance management & brand story'],
    link: '/services?service=nykaa',
  },
  snapdeal: {
    name: 'Snapdeal Management',
    tag: 'Value Market',
    desc: 'Value-market focused Snapdeal account management with pricing strategy & catalogue growth.',
    plans: { Basic: '₹2,499/mo', Standard: '₹3,999/mo', Popular: 'Standard', Premium: '₹6,999/mo' },
    features: ['Catalogue & listing management', 'Pricing & visibility strategy', 'Campaign management'],
    link: '/services?service=snapdeal',
  },
  ebay: {
    name: 'eBay Management',
    tag: 'Global Export',
    desc: 'Global eBay marketplace management for Indian exporters — listings, SEO & cross-border trade.',
    plans: { Basic: '₹4,999/mo', Standard: '₹7,999/mo', Popular: 'Standard', Premium: '₹13,999/mo' },
    features: ['International SKU listings', 'Cross-border keyword research', 'eBay campaign management', 'Shipping strategy & eBay store setup'],
    link: '/services?service=ebay',
  },
  etsy: {
    name: 'Etsy Management',
    tag: 'Creative Market',
    desc: 'Handmade & creative product management on Etsy — listings, SEO & global audience growth.',
    plans: { Basic: '₹4,999/mo', Standard: '₹7,999/mo', Popular: 'Standard', Premium: '₹13,999/mo' },
    features: ['Etsy SEO & tag optimization', 'Shop banner & branding', 'Etsy Ads management', 'Photography tips & review'],
    link: '/services?service=etsy',
  },
  smo: {
    name: 'Social Media Optimization (SMO)',
    tag: 'Organic Growth',
    desc: 'Grow your organic social presence with content strategy, posting calendars & engagement management.',
    plans: { Basic: '₹8,999/mo', Standard: '₹13,999/mo', Popular: 'Standard', Premium: '₹18,999/mo' },
    features: ['15–26 image posts + story reshares', '2–4 reel edits per month', 'Highlight icon design', 'Negative comment removal', 'Post boosting & organic promotions', 'Profile optimization & content calendar', 'Monthly performance reports'],
    link: '/services?service=smo',
  },
  seo: {
    name: 'Search Engine Optimization (SEO)',
    tag: 'Rank Higher',
    desc: 'Rank higher on Google with technical SEO, content creation & high-authority backlink building.',
    plans: { Basic: '₹5,999/mo', Standard: '₹14,999/mo', Popular: 'Standard', Premium: '₹24,999/mo' },
    features: ['Full site audit & keyword research', 'On-page + off-page SEO', 'Content creation (5–20 images/articles)', 'Backlink promotions (10–50 pages)', 'Local SEO (Standard & Premium)', 'Monthly ranking & traffic reports'],
    link: '/services?service=seo',
  },
  smm: {
    name: 'Social Media Marketing (SMM)',
    tag: 'Paid Social',
    desc: 'Paid Meta campaigns — Facebook & Instagram ads built for conversions, ROAS & brand reach.',
    plans: { Basic: '₹7,999/mo', Standard: '₹13,999/mo', Popular: 'Standard', Premium: '₹18,999/mo' },
    features: ['Campaign creation (3–10 campaigns)', 'Facebook Business Manager + Pixel setup', 'Custom audience & remarketing', 'Carousel, Collection & Dynamic Ads', 'Instagram Ads management', 'Monthly performance report'],
    link: '/services?service=smm',
  },
  googleads: {
    name: 'Google Ads Management',
    tag: 'PPC Experts',
    desc: 'Search, Display & Performance Max campaigns managed to deliver maximum ROI on your ad spend.',
    plans: { Basic: '₹9,000/mo', Standard: '₹13,000/mo', Popular: 'Standard', Premium: '₹21,000/mo' },
    features: ['Account setup & keyword research', 'Ad creation (2–7 ads)', 'Bid management & conversion tracking', 'Competitor analysis', 'A/B testing (Premium)', 'Landing page optimization (Premium)'],
    link: '/services?service=google-ads',
  },
  youtube: {
    name: 'YouTube Management',
    tag: 'Video Growth',
    desc: 'Channel growth, video production, SEO & YouTube Ads managed end-to-end for brand visibility.',
    plans: { Basic: '₹60,000/mo', Standard: '₹80,000/mo', Popular: 'Standard', Premium: '₹1,20,000/mo' },
    features: ['Channel setup & optimization', 'Video production & editing (2–6 videos)', 'YouTube SEO & keyword research', 'YouTube Advertising', 'Analytics & competitor analysis', 'Channel monetization (Premium)'],
    link: '/services?service=youtube',
  },
  influencer: {
    name: 'Influencer Marketing',
    tag: '10,000+ Creators',
    desc: 'Connect your brand with verified nano, micro & macro influencers across every niche.',
    plans: { Basic: '₹9,999', Business: '₹24,999', Popular: 'Business', Enterprise: '₹44,999' },
    features: ['2–10 influencer collaborations', 'Nano, micro & macro influencer mix', 'Content calendar & brief', 'Posts, stories, reels & video formats', 'Performance reports', 'Dedicated account manager (Business+)'],
    link: '/services?service=influencer',
  },
  website: {
    name: 'Website Design',
    tag: 'Custom Built',
    desc: 'Professional static & dynamic websites — clean design, fast loading & conversion-optimized.',
    plans: { Basic: '₹25,000', Standard: '₹30,000', Popular: 'Standard', Premium: '₹35,000' },
    features: ['Competitor keyword analysis', 'Custom UI/UX design', 'Product listings & conversion copy', 'Mobile responsive design', 'Up to unlimited SKU optimization (Premium)'],
    link: '/services?service=website-design',
  },
  ecommerce: {
    name: 'E-Commerce Website',
    tag: 'Full Store',
    desc: 'High-converting e-commerce stores with product management, payment gateway & order tracking.',
    plans: { Basic: '₹21,999', Standard: '₹37,999', Popular: 'Standard', Premium: '₹58,999' },
    features: ['Custom e-commerce store design', 'Product listing (5–unlimited SKUs)', 'Payment gateway integration', 'Delivery partner integration (Premium)', 'UI/UX design', '1 year support (Premium)'],
    link: '/services?service=ecommerce',
  },
  shopify: {
    name: 'Shopify Development',
    tag: 'Shopify Expert',
    desc: 'Custom Shopify stores with theme design, app integrations, SEO & full migration support.',
    plans: { Basic: '₹35,999', Standard: '₹54,999', Popular: 'Standard', Premium: '₹89,999' },
    features: ['Shopify store setup & configuration', 'Theme design & customization', '50–150 product listings', 'Shopify SEO & app development', 'Migration support', 'Custom checkout flow (Standard+)', 'Maintenance & support'],
    link: '/services?service=shopify',
  },
  branding: {
    name: 'Marketplace Branding',
    tag: 'Brand Content',
    desc: 'A+ content, EBC, brand stores & enhanced catalogues for Amazon, Flipkart & more.',
    plans: { Basic: '₹8,999', Standard: '₹15,999', Popular: 'Standard', Premium: '₹27,999' },
    features: ['5–20+ A+ content pages', 'Infographic creation (5–20 images)', 'Enhanced product descriptions', 'Brand store setup (Standard+)', 'EBC + video module (Premium)', 'Sponsored brand ads setup (Premium)'],
    link: '/services?service=mp-branding',
  },
  brandingplan: {
    name: 'Branding Plans (All-in-One)',
    tag: 'All-in-One',
    desc: 'End-to-end brand identity — SMO + SMM + website development bundled into one powerful plan.',
    plans: { Basic: '₹29,000/mo', Standard: '₹48,999/mo', Popular: 'Standard', Premium: '₹92,999/mo' },
    features: ['Social media posting + reels', 'Paid ad campaigns', 'SEO & organic growth', 'WordPress/Shopify website', 'Domain & hosting included', 'Payment gateway (Premium)', 'Logo design + PR guidance (Premium)'],
    link: '/services?service=branding',
  },
  plan360: {
    name: '360° Marketing Plans',
    tag: 'Total Growth',
    desc: 'Complete digital growth engine — ads, SEO, social, marketplace & website all in one package.',
    plans: { Starter: '₹35,000/mo', Growth: '₹65,000/mo', Popular: 'Growth', Enterprise: '₹99,999/mo' },
    features: ['Google Ads management', 'Social media (15–26 posts/month)', 'SEO (10–50 pages backlinks)', '1–3 marketplace account management', 'E-commerce website', 'Influencer marketing (Growth+)', 'WhatsApp + email automation (Growth+)', 'Dedicated growth team (Enterprise)'],
    link: '/services?service=360',
  },
};

// ─── RESPONSE BUILDER ─────────────────────────────────────────
function formatService(svc, lang) {
  const plans = Object.entries(svc.plans)
    .filter(([k]) => k !== 'Popular')
    .map(([name, price]) => `  • ${name}: ${price}${name === svc.plans.Popular ? ' ⭐ Most Popular' : ''}`)
    .join('\n');
  const features = svc.features.slice(0, 5).map(f => `  ✅ ${f}`).join('\n');

  if (lang === 'hi') {
    return `*${svc.name}* (${svc.tag})\n\n${svc.desc}\n\n💰 *Plans & Pricing:*\n${plans}\n\n🎯 *Kya milega:*\n${features}\n\n📞 Free consultation ke liye "consultation" type karein ya 08062180749 pe call karein!`;
  }
  return `*${svc.name}* (${svc.tag})\n\n${svc.desc}\n\n💰 *Plans & Pricing:*\n${plans}\n\n🎯 *What's included:*\n${features}\n\n📞 Type "consultation" for a free call, or visit: ${svc.link}`;
}

// ─── BRAIN ────────────────────────────────────────────────────
function getBotResponse(message, history = []) {
  const raw = message.trim();
  const msg = raw.toLowerCase();
  const lang = detectLang(raw);
  const hi = lang === 'hi';

  // ── Greetings ──
  if (/^(hi|hello|hey|hii|helo|namaste|namaskar|hy|hlo|good morning|good evening|good afternoon|shuru|start|नमस्ते|हेलो)\b/.test(msg)) {
    return {
      text: hi
        ? `नमस्ते! 🙏 Cruzen Digital में आपका स्वागत है!\n\nHum aapki business online grow karne mein help karte hain — Amazon/Flipkart seller management, SEO, Social Media, Website development aur bahut kuch!\n\n*Aap kya jaanna chahte hain?*\n• Services & Pricing\n• Amazon / Marketplace\n• Website / E-Commerce\n• SEO / Google Ads\n• Free Consultation book karna\n\nBas type karein! 😊`
        : `Hello! Welcome to Cruzen Digital 👋\n\nWe help businesses grow online through marketplace management, digital marketing, SEO, social media & website development.\n\n*What can I help you with today?*\n• Our Services & Pricing\n• Amazon / Flipkart Management\n• Website & E-Commerce\n• SEO & Google Ads\n• Book a Free Consultation\n\nJust type your question! 😊`,
      askLead: false,
    };
  }

  // ── All services overview ──
  if (/\b(services?|kya karte|kya offer|solutions?|sab kuch|sabhi|all service|kya hai aapka|what do you|what you offer|provide|offerings?)\b/.test(msg)) {
    return {
      text: hi
        ? `Cruzen Digital mein 25+ premium services hain: 🚀\n\n🛒 *Marketplace Management*\n  Amazon, Flipkart, Meesho, Ajio, Myntra, Nykaa, Snapdeal, eBay, Etsy\n\n📣 *Digital Marketing*\n  SEO, Social Media (SMO/SMM), Google Ads, YouTube Management\n\n🤝 *Influencer Marketing*\n  Nano, Micro & Macro creators — 10,000+ network\n\n💻 *Website & Development*\n  WordPress, Shopify, Custom E-Commerce\n\n🎨 *Branding*\n  A+ Content, Marketplace Branding, Complete Branding Plans\n\n🔄 *360° Marketing*\n  Sab kuch ek hi package mein!\n\nKis service ke baare mein jaanna chahte hain? 😊`
        : `Cruzen Digital offers 25+ premium services: 🚀\n\n🛒 *Marketplace Management*\n  Amazon, Flipkart, Meesho, Ajio, Myntra, Nykaa, Snapdeal, eBay, Etsy\n\n📣 *Digital Marketing*\n  SEO, Social Media (SMO/SMM), Google Ads, YouTube Management\n\n🤝 *Influencer Marketing*\n  10,000+ verified creator network\n\n💻 *Website & Development*\n  WordPress, Shopify, Custom E-Commerce\n\n🎨 *Branding*\n  A+ Content, Marketplace Branding, Full Branding Packages\n\n🔄 *360° Marketing*\n  Everything bundled in one growth plan!\n\nWhich service interests you most?`,
      askLead: false,
    };
  }

  // ── Pricing overview ──
  if (/\b(price|pricing|cost|rate|fee|charge|kitna|kitne|rupaye|rupaya|paisa|how much|rate kya|charges|monthly|package)\b/.test(msg) && !/amazon|flipkart|meesho|seo|social|google|shopify|website|influencer|youtube/.test(msg)) {
    return {
      text: hi
        ? `Hamare services ke prices yahan hain: 💰\n\n🛒 *Marketplace Management*\n  • Amazon: ₹3,855 – ₹10,999/mo\n  • Flipkart: ₹3,588 – ₹10,999/mo\n  • Meesho / Ajio / Nykaa: ₹2,999 – ₹8,999/mo\n  • eBay / Etsy: ₹4,999 – ₹13,999/mo\n\n📣 *Digital Marketing*\n  • SEO: ₹5,999 – ₹24,999/mo\n  • SMO (Social): ₹8,999 – ₹18,999/mo\n  • SMM (Ads): ₹7,999 – ₹18,999/mo\n  • Google Ads: ₹9,000 – ₹21,000/mo\n\n💻 *Website Development*\n  • Website Design: ₹25,000 – ₹35,000\n  • E-Commerce: ₹21,999 – ₹58,999\n  • Shopify: ₹35,999 – ₹89,999\n\n🔄 *360° Plans: ₹35,000 – ₹99,999/mo*\n\nKisi bhi service ka detailed price jaanne ke liye name type karein!`
        : `Here's our pricing overview: 💰\n\n🛒 *Marketplace Management*\n  • Amazon: ₹3,855 – ₹10,999/mo\n  • Flipkart: ₹3,588 – ₹10,999/mo\n  • Meesho / Ajio / Nykaa: ₹2,999 – ₹8,999/mo\n  • eBay / Etsy: ₹4,999 – ₹13,999/mo\n\n📣 *Digital Marketing*\n  • SEO: ₹5,999 – ₹24,999/mo\n  • SMO (Organic Social): ₹8,999 – ₹18,999/mo\n  • SMM (Paid Ads): ₹7,999 – ₹18,999/mo\n  • Google Ads: ₹9,000 – ₹21,000/mo\n\n💻 *Website Development*\n  • Website Design: ₹25,000 – ₹35,000\n  • E-Commerce: ₹21,999 – ₹58,999\n  • Shopify: ₹35,999 – ₹89,999\n\n🔄 *360° All-in-One: ₹35,000 – ₹99,999/mo*\n\nType any service name for detailed pricing!`,
      askLead: false,
    };
  }

  // ── Amazon ──
  if (/\b(amazon|amzon|amazn)\b/.test(msg)) return { text: formatService(SERVICES.amazon, lang), askLead: true };

  // ── Flipkart ──
  if (/\b(flipkart|flipcart|fk)\b/.test(msg)) return { text: formatService(SERVICES.flipkart, lang), askLead: true };

  // ── Meesho ──
  if (/\b(meesho|misho|meeshho)\b/.test(msg)) return { text: formatService(SERVICES.meesho, lang), askLead: true };

  // ── Ajio ──
  if (/\b(ajio|agio)\b/.test(msg)) return { text: formatService(SERVICES.ajio, lang), askLead: true };

  // ── Myntra ──
  if (/\b(myntra|mintra)\b/.test(msg)) return { text: formatService(SERVICES.myntra, lang), askLead: true };

  // ── Nykaa ──
  if (/\b(nykaa|nika|nyka)\b/.test(msg)) return { text: formatService(SERVICES.nykaa, lang), askLead: true };

  // ── Snapdeal ──
  if (/\b(snapdeal|snap deal)\b/.test(msg)) return { text: formatService(SERVICES.snapdeal, lang), askLead: true };

  // ── eBay ──
  if (/\b(ebay|e-bay|e bay)\b/.test(msg)) return { text: formatService(SERVICES.ebay, lang), askLead: true };

  // ── Etsy ──
  if (/\b(etsy)\b/.test(msg)) return { text: formatService(SERVICES.etsy, lang), askLead: true };

  // ── Marketplace (generic) ──
  if (/\b(marketplace|seller|account management|e-commerce selling|online selling|bechna|seller account|bikri|dukaan online)\b/.test(msg)) {
    return {
      text: hi
        ? `Hum sab major marketplaces manage karte hain: 🛒\n\n  • *Amazon* — SPN Partner, ₹3,855/mo se\n  • *Flipkart* — Official Partner, ₹3,588/mo se\n  • *Meesho* — ₹2,999/mo se\n  • *Ajio* — ₹2,999/mo se\n  • *Myntra* — ₹3,499/mo se\n  • *Nykaa* — ₹2,999/mo se\n  • *Snapdeal* — ₹2,499/mo se\n  • *eBay* — ₹4,999/mo se (export)\n  • *Etsy* — ₹4,999/mo se (handmade/export)\n\nKis platform pe sell karte hain ya karna chahte hain?`
        : `We manage all major marketplaces: 🛒\n\n  • *Amazon* — SPN Partner, from ₹3,855/mo\n  • *Flipkart* — Official Partner, from ₹3,588/mo\n  • *Meesho* — from ₹2,999/mo\n  • *Ajio* — from ₹2,999/mo\n  • *Myntra* — from ₹3,499/mo\n  • *Nykaa* — from ₹2,999/mo\n  • *Snapdeal* — from ₹2,499/mo\n  • *eBay* — from ₹4,999/mo (exports)\n  • *Etsy* — from ₹4,999/mo (handmade/global)\n\nWhich platform are you selling on?`,
      askLead: false,
    };
  }

  // ── SEO ──
  if (/\b(seo|search engine|google ranking|organic traffic|rank|ranking|google pe|google mein|backlink|keywords?)\b/.test(msg)) return { text: formatService(SERVICES.seo, lang), askLead: true };

  // ── SMO ──
  if (/\b(smo|social media optimization|organic social|instagram organic|facebook organic|social media grow|social media badhana)\b/.test(msg)) return { text: formatService(SERVICES.smo, lang), askLead: true };

  // ── SMM ──
  if (/\b(smm|social media marketing|facebook ads?|instagram ads?|meta ads?|paid social|facebook campaign|instagram campaign)\b/.test(msg)) return { text: formatService(SERVICES.smm, lang), askLead: true };

  // ── Social media (generic) ──
  if (/\b(social media|instagram|facebook|twitter|linkedin|social)\b/.test(msg)) {
    return {
      text: hi
        ? `Social media ke liye 2 options hain:\n\n📊 *SMO — Organic Growth* (₹8,999 – ₹18,999/mo)\nPosting, reels, stories, engagement, profile optimization — bina ad spend ke grow karo.\n\n💰 *SMM — Paid Campaigns* (₹7,999 – ₹18,999/mo)\nFacebook & Instagram ads — targeted campaigns, conversions, ROAS.\n\nAapko kaunsa chahiye — organic ya paid?`
        : `We offer two social media solutions:\n\n📊 *SMO — Organic Growth* (₹8,999 – ₹18,999/mo)\nPosting, reels, stories, engagement & profile optimization — grow without ad spend.\n\n💰 *SMM — Paid Ads* (₹7,999 – ₹18,999/mo)\nFacebook & Instagram ad campaigns — targeted, conversion-focused.\n\nAre you looking for organic growth or paid advertising?`,
      askLead: false,
    };
  }

  // ── Google Ads ──
  if (/\b(google ads?|ppc|pay per click|search ads?|display ads?|google advertising|google pe ad|performance max)\b/.test(msg)) return { text: formatService(SERVICES.googleads, lang), askLead: true };

  // ── YouTube ──
  if (/\b(youtube|you ?tube|yt|video marketing|channel)\b/.test(msg)) return { text: formatService(SERVICES.youtube, lang), askLead: true };

  // ── Influencer ──
  if (/\b(influencer|creator|nano|micro|macro|ugc|brand collaboration|influencer marketing)\b/.test(msg)) return { text: formatService(SERVICES.influencer, lang), askLead: true };

  // ── Website ──
  if (/\b(website design|web design|static website|landing page|wordpress|web site)\b/.test(msg)) return { text: formatService(SERVICES.website, lang), askLead: true };

  // ── E-Commerce website ──
  if (/\b(e.?commerce website|ecommerce site|online store|shopping website|store banao|store banana)\b/.test(msg)) return { text: formatService(SERVICES.ecommerce, lang), askLead: true };

  // ── Shopify ──
  if (/\b(shopify|shopify store|shopify develop)\b/.test(msg)) return { text: formatService(SERVICES.shopify, lang), askLead: true };

  // ── Website generic ──
  if (/\b(website|web|app|mobile app|develop|banana|banao)\b/.test(msg)) {
    return {
      text: hi
        ? `Website & development ke liye hamare 3 options hain: 💻\n\n  🌐 *Website Design* — ₹25,000 – ₹35,000\n  Static/dynamic, clean UI, SEO-ready\n\n  🛒 *E-Commerce Website* — ₹21,999 – ₹58,999\n  Full online store with payment gateway\n\n  🟢 *Shopify Development* — ₹35,999 – ₹89,999\n  Custom Shopify store with apps & migration\n\nAapko kaunsa chahiye?`
        : `We offer 3 website solutions: 💻\n\n  🌐 *Website Design* — ₹25,000 – ₹35,000\n  Clean, fast, SEO-ready website\n\n  🛒 *E-Commerce Website* — ₹21,999 – ₹58,999\n  Full online store with payment gateway\n\n  🟢 *Shopify Development* — ₹35,999 – ₹89,999\n  Custom Shopify store with app integrations\n\nWhich solution fits your needs?`,
      askLead: false,
    };
  }

  // ── Marketplace Branding / A+ Content ──
  if (/\b(a\+ content|ebc|enhanced brand|brand store|marketplace brand|infographic|catalogue design|listing design)\b/.test(msg)) return { text: formatService(SERVICES.branding, lang), askLead: true };

  // ── Branding Plans ──
  if (/\b(branding plan|brand plan|full package|combo|bundle|smo.?smm|smm.?seo)\b/.test(msg)) return { text: formatService(SERVICES.brandingplan, lang), askLead: true };

  // ── 360 Plans ──
  if (/\b(360|full service|sab kuch|complete marketing|total growth|all in one|sabka package)\b/.test(msg)) return { text: formatService(SERVICES.plan360, lang), askLead: true };

  // ── Requirements / What do I need ──
  if (/\b(requirement|jarurat|zaroorat|kya chahiye|kya lagega|kya documents?|kya dena hoga|kya information|what do i need|what you need from me|what information|what details|process|kaise shuru|how to start|how do i start|kaisa kaam karta|how does it work)\b/.test(msg)) {
    return {
      text: hi
        ? `Hamare sath shuru karna bahut aasaan hai! ✅\n\n*Hum kya chahte hain aapse:*\n\n🛒 *Marketplace Management ke liye:*\n  • Seller account login / access\n  • Brand / product details\n  • Product images & descriptions\n  • Target keywords (optional)\n\n📣 *Digital Marketing ke liye:*\n  • Social media page access (admin)\n  • Website URL (agar hai)\n  • Brand logo & guidelines\n  • Target audience & goals\n\n💻 *Website Development ke liye:*\n  • Domain (agar hai, nahi toh hum lenge)\n  • Brand name & logo\n  • Product/service details\n  • Reference websites (optional)\n\n📞 *Process:*\n  1️⃣ Free consultation call\n  2️⃣ Requirements discuss\n  3️⃣ Proposal & agreement\n  4️⃣ Onboarding & kickoff (48 hrs mein)\n\nConsultation book karne ke liye "consultation" type karein!`
        : `Getting started with us is super easy! ✅\n\n*What we need from you:*\n\n🛒 *For Marketplace Management:*\n  • Seller account login / access\n  • Brand & product details\n  • Product images & descriptions\n  • Target keywords (optional)\n\n📣 *For Digital Marketing:*\n  • Social media page access (admin role)\n  • Website URL (if applicable)\n  • Brand logo & guidelines\n  • Target audience & campaign goals\n\n💻 *For Website Development:*\n  • Domain (or we'll register one)\n  • Brand name & logo\n  • Product/service details\n  • Reference websites (optional)\n\n📞 *Our Process:*\n  1️⃣ Free consultation call\n  2️⃣ Discuss your requirements\n  3️⃣ Proposal & agreement\n  4️⃣ Onboarding & kickoff within 48 hrs\n\nType "consultation" to book your free call!`,
      askLead: false,
    };
  }

  // ── Contact ──
  if (/\b(contact|address|location|phone|email|reach|call|number|kahaan|kahan|office|headquarter|delhi)\b/.test(msg)) {
    return {
      text: hi
        ? `Hamare contact details: 📍\n\n📞 *Call / WhatsApp:* 08062180749\n📧 *Email:* info@cruzendigital.com\n📍 *Address:* A-50 Dashrath Puri, Dabri Palam Road, Bharti Refrigeration Works, New Delhi — 110045\n\n🕐 *Working Hours:* Mon–Sat, 10 AM – 7 PM\n\nYa humse WhatsApp pe baat karein: https://wa.me/919560310393`
        : `You can reach us at: 📍\n\n📞 *Call / WhatsApp:* 08062180749\n📧 *Email:* info@cruzendigital.com\n📍 *Address:* A-50 Dashrath Puri, Dabri Palam Road, Bharti Refrigeration Works, New Delhi — 110045\n\n🕐 *Working Hours:* Mon–Sat, 10 AM – 7 PM\n\nOr WhatsApp us: https://wa.me/919560310393`,
      askLead: false,
    };
  }

  // ── Compare plans ──
  if (/\b(compare|difference|basic vs|standard vs|which plan|konsa plan|konsa better|best plan|recommend|suggest|kaun sa|kaisa plan)\b/.test(msg)) {
    return {
      text: hi
        ? `Sahi plan choose karna easy hai! 🎯\n\n*Basic Plan* — Naye sellers ke liye\n  Choti inventory, limited budget, starting out\n\n*Standard Plan* ⭐ — Sabse popular!\n  Growing business, 3–6 months experience, scaling up\n\n*Premium Plan* — Established brands\n  Large catalogue, aggressive growth, full management\n\n*Meri recommendation:*\nAgar aap abhi shuru kar rahe hain → Basic se start karein\nAgar thoda experience hai → Standard best value hai\nAgar serious scale karna hai → Premium mein invest karein\n\nKisi specific service ka comparison chahiye?`
        : `Choosing the right plan is simple! 🎯\n\n*Basic Plan* — Best for new sellers\n  Small inventory, limited budget, just starting out\n\n*Standard Plan* ⭐ — Most Popular!\n  Growing business, some experience, ready to scale\n\n*Premium Plan* — For established brands\n  Large catalogue, aggressive targets, full management\n\n*My recommendation:*\nJust starting out → Go with Basic\nHave some traction → Standard gives best value\nSerious about scaling → Premium is worth the investment\n\nWant a comparison for a specific service?`,
      askLead: false,
    };
  }

  // ── Why Cruzen ──
  if (/\b(why cruzen|kyun aapko|kyun aap|why you|why choose|best agency|trusted|experience|kitne saal|how many years|track record|results|clients)\b/.test(msg)) {
    return {
      text: hi
        ? `Cruzen Digital kyun? 🏆\n\n  ✅ *Amazon SPN Partner* — Official seller network member\n  ✅ *Flipkart Official Partner*\n  ✅ *5+ years* marketplace & digital marketing experience\n  ✅ *500+ clients* served across India & globally\n  ✅ *Dedicated account manager* — direct point of contact\n  ✅ *Monthly transparent reports* — koi bhi hidden charges nahi\n  ✅ *48-hour onboarding* — jaldi start ho jata hai\n  ✅ *Hindi + English support* — aapki language mein\n\nHumara HQ New Delhi mein hai — A-50 Dashrath Puri.\n\nFree consultation lete hain aur khud decide karein! 😊`
        : `Why choose Cruzen Digital? 🏆\n\n  ✅ *Amazon SPN Partner* — Official seller network\n  ✅ *Flipkart Official Partner*\n  ✅ *5+ years* of marketplace & digital marketing\n  ✅ *500+ clients* served across India & globally\n  ✅ *Dedicated account manager* per client\n  ✅ *Transparent monthly reports* — no hidden charges\n  ✅ *48-hour onboarding* — quick kickoff\n  ✅ *Hindi + English support*\n\nHeadquartered in New Delhi — A-50 Dashrath Puri.\n\nBook a free consultation and see for yourself! 😊`,
      askLead: false,
    };
  }

  // ── Consultation ──
  if (/\b(consultation|consult|book|call back|callback|free call|talk|speak|meeting|audit|demo|free audit|baat karna|milna|phone karo|call karo|sampark)\b/.test(msg)) {
    return {
      text: hi
        ? `Bilkul! Free consultation book karte hain! 🎉\n\nBas yeh details share karein:\n\n1️⃣ *Aapka naam kya hai?*\n2️⃣ *WhatsApp / Phone number?*\n3️⃣ *Email address?*\n4️⃣ *Kis service mein interest hai?*\n\nHamari team 2 ghante mein call karegi! 📞`
        : `Absolutely! Let's book your free consultation! 🎉\n\nPlease share your details:\n\n1️⃣ *Your name?*\n2️⃣ *WhatsApp / Phone number?*\n3️⃣ *Email address?*\n4️⃣ *Which service interests you?*\n\nOur team will call you within 2 hours! 📞`,
      askLead: true,
    };
  }

  // ── Thank you ──
  if (/\b(thank|thanks|shukriya|dhanyawad|tysm|thnx|thx)\b/.test(msg)) {
    return {
      text: hi
        ? `Aapka shukriya! 🙏 Koi bhi sawaal ho toh zaroor poochhen.\n\nConsultation ke liye 08062180749 pe call karein ya WhatsApp karein! 😊`
        : `Thank you! 😊 Feel free to ask anything anytime.\n\nFor a free consultation, call or WhatsApp us at 08062180749!`,
      askLead: false,
    };
  }

  // ── Default ──
  return {
    text: hi
      ? `Samajh gaya! 😊 Main aapki madad karna chahta hoon.\n\nAap yeh puch sakte hain:\n  • "Amazon management kya hai?"\n  • "SEO ka price kya hai?"\n  • "Website banana hai"\n  • "Social media marketing"\n  • "Sab services batao"\n  • "Consultation book karna hai"\n\nYa seedha call karein: 📞 08062180749`
      : `I'm here to help! 😊 You can ask me:\n\n  • "Tell me about Amazon management"\n  • "What's the price for SEO?"\n  • "I need a website"\n  • "Social media marketing options"\n  • "Show me all services"\n  • "Book a consultation"\n\nOr call us directly: 📞 08062180749`,
    askLead: false,
  };
}

// ─── CONTROLLER ───────────────────────────────────────────────
exports.sendMessage = async (req, res) => {
  try {
    const { message, sessionId: clientSessionId } = req.body;
    if (!message?.trim()) return res.status(400).json({ success: false, message: 'Message is required.' });

    const sessionId = clientSessionId || uuidv4();
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;

    let chatSession = await ChatMessage.findOne({ sessionId });
    if (!chatSession) {
      chatSession = await ChatMessage.create({ sessionId, userId: req.user?._id, ipAddress, messages: [] });
    }

    chatSession.messages.push({ role: 'user', text: message });

    const history = chatSession.messages.slice(-10);
    const { text: botText, askLead } = getBotResponse(message, history);

    chatSession.messages.push({ role: 'bot', text: botText });

    const emailMatch = message.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = message.match(/[6-9]\d{9}/);
    const nameMatch = message.match(/(?:my name is|i am|naam hai|main hoon)\s+([A-Za-z\s]{2,30})/i);
    if (emailMatch) chatSession.capturedEmail = emailMatch[0];
    if (phoneMatch) chatSession.capturedPhone = phoneMatch[0];
    if (nameMatch) chatSession.capturedName = nameMatch[1].trim();

    await chatSession.save();

    if ((emailMatch || phoneMatch) && !chatSession.leadCaptured) {
      chatSession.leadCaptured = true;
      await chatSession.save();
      await Lead.create({
        name: chatSession.capturedName || 'Chat Lead',
        email: chatSession.capturedEmail,
        phone: chatSession.capturedPhone,
        source: 'chatbot',
        sessionId,
        ipAddress,
        userId: req.user?._id,
      });
    }

    res.json({ success: true, sessionId, response: botText, askLead });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getChatHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const chat = await ChatMessage.findOne({ sessionId });
    res.json({ success: true, messages: chat?.messages || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllChats = async (req, res) => {
  try {
    const chats = await ChatMessage.find().sort('-createdAt').limit(100).populate('userId', 'name email');
    res.json({ success: true, chats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
