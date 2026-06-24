/* ═══════════════════════════════════════════════
   ALL SERVICE DATA — shared between Services.jsx & ServiceLanding.jsx
═══════════════════════════════════════════════ */

export const MARKETPLACE_SERVICES = [
  {
    id: 'amazon', icon: 'fa-brands fa-amazon', title: 'Amazon Management', tag: 'SPN Partner',
    image: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=900&q=80&auto=format&fit=crop',
    desc: 'End-to-end Amazon SPN account management — listings, campaigns, A+ content & growth calls.',
    category: 'marketplace',
    plans: [
      { name: 'Basic',    price: 3855,  original: 4305,  popular: false, features: ['50 SKU listings & optimization','Keyword updates on existing listings','10 claim submissions + competitor analysis','50 title & description optimizations','1 growth call + CTR enhancement','100 high-CTR listing campaigns','Image enhancement for 50 products'] },
      { name: 'Standard', price: 5931,  original: 7117,  popular: true,  features: ['100 SKU listings & optimization','Keyword updates on existing listings','15 claim submissions + competitor analysis','100 title & description optimizations','3 growth calls/week + CTR enhancement','200 high-CTR campaigns + 50 organic activities','Social media promotions + 100 image enhancements','5 A+ listings & performance management'] },
      { name: 'Premium',  price: 10999, original: 14999, popular: false, features: ['150 SKU listings & optimization','Keyword updates on existing listings','25 claim submissions + competitor analysis','300 title & description optimizations','Unlimited growth calls + CTR enhancement','300 high-CTR campaigns + 100 organic activities','Social media promotions + 150 image enhancements','10 A+ listings, performance management & POA'] },
    ],
  },
  {
    id: 'flipkart', icon: 'fa-solid fa-shopping-bag', title: 'Flipkart Management', tag: 'Official Partner',
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=900&q=80&auto=format&fit=crop',
    desc: 'Complete Flipkart seller account management with catalogue, campaigns & performance tracking.',
    category: 'marketplace',
    plans: [
      { name: 'Basic',    price: 3588,  original: 4305,  popular: false, features: ['50 SKU listings & optimization','Keyword updates on existing listings','10 claim submissions + competitor analysis','50 title & description optimizations','1 growth call + CTR enhancement','100 high-CTR listing campaigns','50 image enhancements'] },
      { name: 'Standard', price: 5931,  original: 7117,  popular: true,  features: ['100 SKU listings & optimization','Keyword updates on existing listings','15 claim submissions + competitor analysis','100 title & description optimizations','3 growth calls/week + CTR enhancement','200 high-CTR campaigns + 50 organic activities','100 social media + image enhancements','Performance management included'] },
      { name: 'Premium',  price: 10999, original: 11999, popular: false, features: ['150 SKU listings & optimization','Keyword updates on existing listings','25 claim submissions + competitor analysis','300 title & description optimizations','Unlimited growth calls + CTR enhancement','300 high-CTR campaigns + 100 organic activities','150 social media + image enhancements','Performance management & POA for suspension'] },
    ],
  },
  {
    id: 'meesho', icon: 'fa-solid fa-bag-shopping', title: 'Meesho Management', tag: 'Verified Seller',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900&q=80&auto=format&fit=crop',
    desc: 'Grow your Meesho reseller business with optimized catalogues, pricing strategy & promotions.',
    category: 'marketplace',
    plans: [
      { name: 'Basic',    price: 2999,  original: 3999,  popular: false, features: ['50 SKU listings & optimization','Keyword updates','10 claim submissions','50 title optimizations','1 growth call','100 high-CTR campaigns','Image enhancement for 50 products'] },
      { name: 'Standard', price: 4999,  original: 6499,  popular: true,  features: ['100 SKU listings & optimization','Keyword updates','15 claim submissions','100 title optimizations','3 growth calls/week','200 campaigns + 50 organic activities','Performance management'] },
      { name: 'Premium',  price: 8999,  original: 11999, popular: false, features: ['150 SKU listings & optimization','25 claim submissions','300 title optimizations','Unlimited growth calls','300 campaigns + 100 organic activities','Performance management & full account audit'] },
    ],
  },
  {
    id: 'ajio', icon: 'fa-solid fa-shirt', title: 'Ajio Management', tag: 'Fashion Expert',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&q=80&auto=format&fit=crop',
    desc: 'Fashion-first account management for Ajio sellers — listings, brand store & campaign strategy.',
    category: 'marketplace',
    plans: [
      { name: 'Basic',    price: 2999,  original: 3999,  popular: false, features: ['50 SKU listings','Keyword updates','Competitor analysis','Title & description optimization','Growth call + CTR enhancement','Campaign management','Image optimization'] },
      { name: 'Standard', price: 4999,  original: 6499,  popular: true,  features: ['100 SKU listings','Keyword updates','15 claim submissions','100 title optimizations','3 growth calls/week','200 campaigns + organic activities','Social media promotions + performance management'] },
      { name: 'Premium',  price: 8999,  original: 11999, popular: false, features: ['150 SKU listings','25 claim submissions','300 title optimizations','Unlimited growth calls','300 campaigns + organic activities','Full performance management & brand store setup'] },
    ],
  },
  {
    id: 'myntra', icon: 'fa-solid fa-tshirt', title: 'Myntra Management', tag: 'Brand Partner',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80&auto=format&fit=crop',
    desc: 'Complete Myntra brand partner management — catalogue, inventory, campaigns & style content.',
    category: 'marketplace',
    plans: [
      { name: 'Basic',    price: 3499,  original: 4499,  popular: false, features: ['50 SKU catalogue management','Keyword & style tag optimization','Competitor benchmarking','Title & image optimization','Growth call + CTR strategy','Campaign management','Basic reporting'] },
      { name: 'Standard', price: 5499,  original: 7199,  popular: true,  features: ['100 SKU catalogue management','Advanced keyword & style optimization','15 claim submissions','3 growth calls/week','200 high-CTR campaigns','Social promotions + performance management'] },
      { name: 'Premium',  price: 9999,  original: 13999, popular: false, features: ['150 SKU + unlimited catalogue updates','25 claim submissions','Unlimited growth calls','300 campaigns + organic activities','Full performance management & brand story'] },
    ],
  },
  {
    id: 'nyka', icon: 'fa-solid fa-spa', title: 'Nykaa Management', tag: 'Beauty Expert',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=900&q=80&auto=format&fit=crop',
    desc: 'Beauty & wellness specialist account management on Nykaa — listings, A+ content & ads.',
    category: 'marketplace',
    plans: [
      { name: 'Basic',    price: 2999,  original: 3999,  popular: false, features: ['50 SKU beauty listings','Ingredient keyword optimization','Competitor analysis','Title & image optimization','Growth call + CTR strategy','Campaign management','Basic reporting'] },
      { name: 'Standard', price: 4999,  original: 6499,  popular: true,  features: ['100 SKU listings & optimization','Keyword & beauty-trend updates','15 submissions','3 growth calls/week','Campaigns + organic promotions','Performance management'] },
      { name: 'Premium',  price: 8999,  original: 11999, popular: false, features: ['150 SKU full management','Unlimited growth calls','300 campaigns','Social + organic activities','Full performance management & brand story'] },
    ],
  },
  {
    id: 'snapdeal', icon: 'fa-solid fa-bolt', title: 'Snapdeal Management', tag: 'Value Market',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&q=80&auto=format&fit=crop',
    desc: 'Value-market focused Snapdeal account management with pricing strategy & catalogue growth.',
    category: 'marketplace',
    plans: [
      { name: 'Basic',    price: 2499,  original: 3299,  popular: false, features: ['50 SKU listings','Keyword updates','Competitor analysis','Title optimization','Growth call','Campaign management','Image optimization'] },
      { name: 'Standard', price: 3999,  original: 5499,  popular: true,  features: ['100 SKU listings','Keyword updates','15 submissions','3 growth calls/week','200 campaigns + organic activities','Performance management'] },
      { name: 'Premium',  price: 6999,  original: 9999,  popular: false, features: ['150 SKU full management','25 submissions','Unlimited growth calls','300 campaigns','Full performance management'] },
    ],
  },
  {
    id: 'ebay', icon: 'fa-brands fa-ebay', title: 'eBay Management', tag: 'Global Export',
    image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=900&q=80&auto=format&fit=crop',
    desc: 'Global eBay marketplace management for Indian exporters — listings, SEO & cross-border trade.',
    category: 'marketplace',
    plans: [
      { name: 'Basic',    price: 4999,  original: 6499,  popular: false, features: ['50 global SKU listings','International keyword research','Competitor analysis','Title & description optimization','Growth call + CTR strategy','eBay campaign management','Image optimization'] },
      { name: 'Standard', price: 7999,  original: 10499, popular: true,  features: ['100 global SKU listings','Advanced keyword research','15 submissions + analysis','3 growth calls/week','200 campaigns + organic activities','Performance management + eBay store setup'] },
      { name: 'Premium',  price: 13999, original: 18999, popular: false, features: ['150 global SKU full management','Unlimited growth calls','300 campaigns','Cross-border shipping strategy','Full performance management & global expansion'] },
    ],
  },
  {
    id: 'etsy', icon: 'fa-solid fa-star-of-life', title: 'Etsy Management', tag: 'Creative Market',
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=900&q=80&auto=format&fit=crop',
    desc: 'Handmade & creative product management on Etsy — listings, SEO & global audience growth.',
    category: 'marketplace',
    plans: [
      { name: 'Basic',    price: 4999,  original: 6499,  popular: false, features: ['50 creative SKU listings','Etsy SEO keyword research','Competitor analysis','Tag & description optimization','Growth call + shop audit','Campaign & Etsy Ads management','Photography tips & image review'] },
      { name: 'Standard', price: 7999,  original: 10499, popular: true,  features: ['100 SKU listings','Advanced Etsy SEO','15 submissions','3 growth calls/week','200 Etsy Ad campaigns','Shop banner & branding','Performance management'] },
      { name: 'Premium',  price: 13999, original: 18999, popular: false, features: ['150 SKU full management','Unlimited growth calls','Full Etsy Ads strategy','Social promotions + Etsy SEO','Complete shop branding & performance management'] },
    ],
  },
];

export const DIGITAL_SERVICES = [
  {
    id: 'smo', icon: 'fa-solid fa-share-nodes', title: 'Social Media Optimization', tag: 'Organic Growth',
    image: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=900&q=80&auto=format&fit=crop',
    desc: 'Grow your organic social presence with content strategy, posting calendars & engagement management.',
    category: 'digital',
    plans: [
      { name: 'Basic',    price: 8999,  original: 9999,  popular: false, features: ['Image Posting & Stories Reshare — 15','Caption & hashtag provided','Organic post boosting','Profile optimization','Negative comment removal — up to 15','Posting calendar','Reply on business queries — up to 10'] },
      { name: 'Standard', price: 13999, original: 16799, popular: true,  features: ['Image Posting & Stories Reshare — 24','2 reel edits (raw video by client)','Highlight icon design — 5','Negative comment removal — up to 30','Post boost — 2 + 3 additional sessions','Monthly performance reports','Customized content strategy'] },
      { name: 'Premium',  price: 18999, original: 22799, popular: false, features: ['Image Posting & Stories Reshare — 26','4 reel edits (incl. 1 infographic reel)','Post boost — 4','Negative comment removal — up to 50','2 full ad campaigns','Logo design included','PR guidance','Personalized strategy & calendar','Reply on business — up to 25'] },
    ],
  },
  {
    id: 'seo', icon: 'fa-solid fa-magnifying-glass-chart', title: 'Search Engine Optimization', tag: 'Rank Higher',
    image: 'https://images.unsplash.com/photo-1562577309-4932fdd64cd1?w=900&q=80&auto=format&fit=crop',
    desc: 'Rank higher on Google with technical SEO, content creation & high-authority backlink building.',
    category: 'digital',
    plans: [
      { name: 'Basic',    price: 5999,  original: 7198,  popular: false, features: ['Audit & Keyword Research','Content Creation — 5 images','Backlink promotions — 10 pages','On-Page & Off-Page SEO','Reporting & Refinement','Traffic & ranking monitoring'] },
      { name: 'Standard', price: 14999, original: 21999, popular: true,  features: ['Audit & Keyword Research','Content Creation — 10 images','Backlink promotions — 30 pages','Article Creation — 5 articles','Custom SEO planning','On/Off-Page & Local SEO','Reporting & Refinement'] },
      { name: 'Premium',  price: 24999, original: 29999, popular: false, features: ['Audit & Keyword Research','Content Creation — 20 images','Backlink promotions — 50 pages','Article Creation — 10 articles','Custom SEO planning','On/Off-Page & Local SEO','Reporting & Refinement'] },
    ],
  },
  {
    id: 'smm', icon: 'fa-solid fa-rectangle-ad', title: 'Social Media Marketing', tag: 'Paid Social',
    image: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=900&q=80&auto=format&fit=crop',
    desc: 'Paid Meta campaigns — Facebook & Instagram ads built for conversions, ROAS & brand reach.',
    category: 'digital',
    plans: [
      { name: 'Basic',    price: 7999,  original: 9599,  popular: false, features: ['Campaign creation — 3','Facebook Business Manager setup','Custom audience creation','Ad placement customization','Graphic & copy creation — 3'] },
      { name: 'Standard', price: 13999, original: 16799, popular: true,  features: ['Campaign creation — 6','FB Business Manager + Pixel installation','Custom audience & placement customization','Graphic & copy creation — 6','Custom conversion & remarketing','Carousel & Collection Ads','Traffic monitoring & monthly report'] },
      { name: 'Premium',  price: 18999, original: 22799, popular: false, features: ['Campaign creation — 10','FB Business Manager + Pixel installation','Custom conversion & remarketing','Facebook Analytics Report','Ad campaign monitoring & catalogue creation','Dynamic Ads & Instant Experience Ads','Carousel & Collection Ads','Instagram Ads monitoring & management','Graphic & copy creation — 10'] },
    ],
  },
  {
    id: 'google-ads', icon: 'fa-brands fa-google', title: 'Google Ads Management', tag: 'PPC Experts',
    image: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=900&q=80&auto=format&fit=crop',
    desc: 'Search, Display & Performance Max campaigns managed to deliver maximum ROI on your ad spend.',
    category: 'digital',
    plans: [
      { name: 'Basic',    price: 9000,  original: 15000, popular: false, features: ['Account setup','Keyword research','Ad creation × 2','Conversion tracking','Competitor analysis','Budget management'] },
      { name: 'Standard', price: 13000, original: 16500, popular: true,  features: ['Account setup','Keyword research','Ad creation × 4','Bid management','Conversion tracking','Performance analysis','Competitor analysis','Budget management'] },
      { name: 'Premium',  price: 21000, original: 25000, popular: false, features: ['Account setup','Keyword research','Ad creation × 7','Landing page optimization','Ad extensions','Bid management','A/B testing','Conversion tracking','Performance analysis','Competitor analysis','Budget management','Continuous optimization'] },
    ],
  },
  {
    id: 'youtube', icon: 'fa-brands fa-youtube', title: 'YouTube Management', tag: 'Video Growth',
    image: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=900&q=80&auto=format&fit=crop',
    desc: 'Channel growth, video production, SEO & YouTube Ads managed end-to-end for brand visibility.',
    category: 'digital',
    plans: [
      { name: 'Basic',    price: 60000,  original: 80000,  popular: false, features: ['Channel setup & optimization','Content strategy development','Video production & editing × 2','Keyword research','YouTube Advertising','Analytics & reporting'] },
      { name: 'Standard', price: 80000,  original: 95000,  popular: true,  features: ['Channel setup & optimization','Content strategy development','Video production & editing × 4','Keyword research','Audience engagement','Video SEO','YouTube Advertising','Analytics & reporting','Competitor analysis'] },
      { name: 'Premium',  price: 120000, original: 200000, popular: false, features: ['Channel setup & optimization','Content strategy','Video production × 6','Keyword research','Audience engagement','Video SEO','Cross-promotion strategy','YouTube Advertising','Analytics & reporting','YouTube Live & Stories','Channel monetization'] },
    ],
  },
];

export const INFLUENCER_SERVICES = [
  {
    id: 'influencer', icon: 'fa-solid fa-user-tie', title: 'Influencer Marketing', tag: '10,000+ Creators',
    image: 'https://images.unsplash.com/photo-1533227268428-f9ed0900fb3b?w=900&q=80&auto=format&fit=crop',
    desc: 'Connect your brand with verified nano, micro & macro influencers across every niche.',
    category: 'influencer',
    plans: [
      { name: 'Basic',      price: 9999,  original: 11999, popular: false, features: ['2–3 influencer collaborations (nano focus)','Basic content creation guidance','Brand talking points & brief','Monthly performance reports','Customizable influencer mix','Content formats: posts, stories, reviews, video','Digital marketing integration available'] },
      { name: 'Business',   price: 24999, original: 29999, popular: true,  features: ['4–6 influencer collaborations (nano + micro mix)','In-depth content creation guidance','Content calendar & post format planning','Bi-weekly performance reports','Dedicated account manager','Customizable influencer mix','Multiple content format options','Holistic digital marketing integration'] },
      { name: 'Enterprise', price: 44999, original: 59999, popular: false, features: ['7–10 influencer collaborations (micro, macro & nano mix)','Comprehensive content creation support','Concept development & scriptwriting','Weekly performance reports','Dedicated account manager + ongoing optimization','Customizable influencer strategy','Multiple content format support','Full digital marketing integration'] },
    ],
  },
];

export const WEBSITE_SERVICES = [
  {
    id: 'website-design', icon: 'fa-solid fa-desktop', title: 'Website Design', tag: 'Custom Built',
    image: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=900&q=80&auto=format&fit=crop',
    desc: 'Professional static & dynamic websites — clean design, fast loading & conversion-optimized.',
    category: 'website',
    plans: [
      { name: 'Basic',    price: 25000, original: 28000, popular: false, features: ['Competitor keyword analysis','Website design + product listings','Compelling copy to increase conversions','Keyword-optimized product listings','Professionally-crafted sales copies','Up to 5 SKU optimization'] },
      { name: 'Standard', price: 30000, original: 35000, popular: true,  features: ['Competitor keyword analysis','Advanced website design + listings','Compelling conversion copy','High-value keyword optimization','Professionally-crafted sales copies','Up to 10 SKU optimization','UI/UX improvements'] },
      { name: 'Premium',  price: 35000, original: 40000, popular: false, features: ['Competitor keyword analysis','Premium website design + listings','Full conversion copy suite','Keyword-optimized product listings','Professionally-crafted sales copies','Unlimited SKU optimization','Full UI/UX & responsive design'] },
    ],
  },
  {
    id: 'ecommerce', icon: 'fa-solid fa-cart-shopping', title: 'E-Commerce Website', tag: 'Full Store',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900&q=80&auto=format&fit=crop',
    desc: 'High-converting e-commerce stores with product management, payment gateway & order tracking.',
    category: 'website',
    plans: [
      { name: 'Basic',    price: 21999, original: 26399, popular: false, features: ['E-commerce product listings — 5 SKU','Competitor keyword analysis','Product listing services','Compelling conversion copy','High-value keyword optimization','Professional sales copies'] },
      { name: 'Standard', price: 37999, original: 45599, popular: true,  features: ['E-commerce product listings — up to 20 SKU','Competitor keyword analysis','Advanced listing optimization','Compelling conversion copy','High-value keyword optimization','Professional sales copies','UI/UX design','Payment gateway integration'] },
      { name: 'Premium',  price: 58999, original: 70799, popular: false, features: ['E-commerce listings — unlimited SKU','Competitor keyword analysis','Full listing optimization suite','Full conversion copy','High-value keyword optimization','Professional sales copies','Advanced UI/UX','Payment gateway + delivery partner integration','1 year support'] },
    ],
  },
  {
    id: 'shopify', icon: 'fa-brands fa-shopify', title: 'Shopify Development', tag: 'Shopify Expert',
    image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=900&q=80&auto=format&fit=crop',
    desc: 'Custom Shopify stores with theme design, app integrations, SEO & full migration support.',
    category: 'website',
    plans: [
      { name: 'Basic',    price: 35999,  original: 40999,  popular: false, features: ['50 SKU product listings','Shopify store setup & configuration','Theme design & customization','Shopify integration & SEO','Shopify migration','App development','Maintenance & support'] },
      { name: 'Standard', price: 54999,  original: 78999,  popular: true,  features: ['100 SKU product listings','Shopify store setup & configuration','Advanced theme design & customization','Full Shopify integration suite','Shopify SEO','Migration + app development','Shopify Plus development','Maintenance & support','Custom checkout flow'] },
      { name: 'Premium',  price: 89999,  original: 145999, popular: false, features: ['150 SKU product listings','Complete Shopify store setup','Premium theme design & customization','Full integration suite','Advanced Shopify SEO','Migration + app development','Shopify Plus development','Priority maintenance & support','Custom checkout & payment flows'] },
    ],
  },
  {
    id: 'automation', icon: 'fa-solid fa-robot', title: 'Business Automation', tag: 'AI-Powered',
    image: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=900&q=80&auto=format&fit=crop',
    desc: 'Automate repetitive business workflows — WhatsApp bots, CRM integration, email sequences & lead funnels.',
    category: 'website',
    plans: [
      { name: 'Basic',    price: 14999, original: 19999, popular: false, features: ['WhatsApp Business API setup','Automated reply bot (up to 10 flows)','Lead capture form integration','Email drip sequence (3 emails)','Basic CRM integration','Monthly performance report'] },
      { name: 'Standard', price: 24999, original: 32999, popular: true,  features: ['WhatsApp Business API + catalog setup','Advanced chatbot (up to 25 flows)','Lead capture + CRM auto-sync','Email drip sequence (7 emails)','Full CRM integration (HubSpot / Zoho)','WhatsApp broadcast campaigns','Bi-weekly performance reports','Dedicated automation manager'] },
      { name: 'Premium',  price: 44999, original: 59999, popular: false, features: ['WhatsApp Business API + full catalog','Unlimited automation flows','Multi-platform chatbot (WA + Instagram + website)','Complete CRM integration & pipeline setup','Email + WhatsApp drip sequences','AI-powered lead scoring','Weekly performance reports','Custom API integrations','Priority support & quarterly strategy review'] },
    ],
  },
];

export const MP_BRANDING_SERVICES = [
  {
    id: 'mp-branding', icon: 'fa-solid fa-certificate', title: 'Marketplace Branding', tag: 'Brand Content',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900&q=80&auto=format&fit=crop',
    desc: 'A+ content, EBC, brand stores & enhanced catalogues for Amazon, Flipkart & more.',
    category: 'mp-branding',
    plans: [
      { name: 'Basic',    price: 8999,  original: 11999, popular: false, features: ['5 A+ content pages','Competitor benchmark analysis','Infographic creation — 5 images','Enhanced product descriptions','Keyword-rich bullet points','Basic brand story module','Image optimization for listing'] },
      { name: 'Standard', price: 15999, original: 19999, popular: true,  features: ['10 A+ content pages','Competitor benchmark analysis','Infographic creation — 10 images','Enhanced product descriptions','Keyword-rich bullet points','Brand store setup (3 pages)','EBC (Enhanced Brand Content)','Performance tracking'] },
      { name: 'Premium',  price: 27999, original: 35999, popular: false, features: ['20+ A+ content pages','Competitor benchmark analysis','Infographic creation — 20 images','Premium enhanced descriptions','Keyword-rich bullet points','Full brand store (unlimited pages)','EBC + video module','Sponsored brand ads setup','Performance tracking & optimization'] },
    ],
  },
];

export const BRANDING_SERVICES = [
  {
    id: 'branding', icon: 'fa-solid fa-palette', title: 'Branding Plans', tag: 'All-in-One',
    image: 'https://images.unsplash.com/photo-1434626881859-194d67b2b86f?w=900&q=80&auto=format&fit=crop',
    desc: 'End-to-end brand identity — SMO + SMM + website development bundled into one powerful plan.',
    category: 'branding',
    plans: [
      { name: 'Basic',    price: 29000, original: 35000,  popular: false, features: ['Image Posting & Stories Reshare — 15','Caption & hashtag provided','Organic boosting + best graphics','Profile optimization','Negative comment removal — up to 15','Posting calendar + business replies — up to 10','Campaign creation — 3','Facebook Business Manager setup','Custom audience & ad placement customization','Graphic & copy creation — 3','WordPress/Shopify development','4-page E-commerce website','Product listing — 10 with creative images','1 year support','Domain & hosting provided'] },
      { name: 'Standard', price: 48999, original: 55000,  popular: true,  features: ['Image Posting & Stories Reshare — 24','2 reel edits (raw video by client)','Highlight icon design — 5','Business replies — up to 15','Negative comment removal — up to 30','Post boost — 2','Posting calendar + organic boosting','Profile optimization + customized strategy','Campaign creation — 6','Facebook Business Manager + Pixel','Custom audience & placement customization','Carousel graphic & copy — 6','WordPress/Shopify/PHP development','6-page E-commerce website','Product listing — 50 with creative images','UI/UX','1 year support','Domain & hosting provided'] },
      { name: 'Premium',  price: 92999, original: 128000, popular: false, features: ['Image Posting & Stories Reshare — 26','4 reel edits (incl. 1 infographic)','Post boost — 4','Negative comment removal — up to 50','Logo design + PR guidance','Organic boosting + premium graphics','Profile optimization + personalized strategy','Highlight icon design — 7','Business replies — up to 25','Campaign creation — 10','FB Business Manager + Pixel + Custom Conversion','Remarketing + Facebook Analytics Report','Dynamic Ads + Instant Experience Ads','Instagram Ads monitoring & management','Shopify/PHP development','Fully customized E-commerce website','Product listing — 100 with creative images','UI/UX','1 year support','Domain & hosting','Payment method integration','Delivery partner support'] },
    ],
  },
];

export const PLAN_360_SERVICES = [
  {
    id: '360', icon: 'fa-solid fa-chart-pie', title: '360° Marketing Plans', tag: 'Total Growth',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&q=80&auto=format&fit=crop',
    desc: 'Complete digital growth engine — ads, SEO, social, marketplace & website all in one package.',
    category: '360',
    plans: [
      { name: 'Starter',    price: 35000, original: 45000,  popular: false, features: ['Google Ads management (Basic)','Social Media Optimization — 15 posts','SEO (Basic) — 10 pages backlinks','1 marketplace account management','Website design (Basic)','Monthly performance reports','Dedicated account manager','WhatsApp business setup'] },
      { name: 'Growth',     price: 65000, original: 85000,  popular: true,  features: ['Google Ads management (Standard)','Social Media Optimization — 24 posts','SEO (Standard) — 30 pages backlinks','2 marketplace account management','E-commerce website (Standard)','Influencer marketing — 2 collaborations','Bi-weekly performance reports','Dedicated senior account manager','WhatsApp + email marketing flows'] },
      { name: 'Enterprise', price: 99999, original: 145000, popular: false, features: ['Google Ads management (Premium)','Social Media Optimization — 26 posts','SEO (Premium) — 50 pages backlinks','3 marketplace account management','Full custom e-commerce website','Influencer marketing — 5 collaborations','Shopify store setup','Weekly performance reports','Dedicated growth team','WhatsApp + email + SMS automation','YouTube channel management','Brand identity package'] },
    ],
  },
];

export const CATEGORIES = [
  { key: 'marketplace',  label: 'Marketplace Management', icon: 'fa-store',        color: '#f59e0b', services: MARKETPLACE_SERVICES },
  { key: 'digital',      label: 'Digital Marketing',      icon: 'fa-bullhorn',     color: '#6366f1', services: DIGITAL_SERVICES },
  { key: 'influencer',   label: 'Influencer Marketing',   icon: 'fa-user-friends', color: '#ec4899', services: INFLUENCER_SERVICES },
  { key: 'website',      label: 'Website & Development',  icon: 'fa-laptop-code',  color: '#10b981', services: WEBSITE_SERVICES },
  { key: 'mp-branding',  label: 'Marketplace Branding',   icon: 'fa-certificate',  color: '#8b5cf6', services: MP_BRANDING_SERVICES },
  { key: 'branding',     label: 'Branding Plans',         icon: 'fa-paint-brush',  color: '#ef4444', services: BRANDING_SERVICES },
  { key: '360',          label: '360° Marketing',         icon: 'fa-chart-line',   color: '#00b4cc', services: PLAN_360_SERVICES },
];

export const ALL_FLAT = CATEGORIES.flatMap(c => c.services);

export function findService(id) {
  return ALL_FLAT.find(s => s.id === id) || null;
}

export function categoryOf(svc) {
  return CATEGORIES.find(c => c.key === svc.category) || CATEGORIES[0];
}

/* ═══════════════════════════════════════════════
   JOURNEY STEPS — per category
═══════════════════════════════════════════════ */
const JOURNEY = {
  marketplace: [
    { icon: 'fa-solid fa-phone', title: 'Discovery Call', desc: 'We audit your current account, sales history & competitor landscape.' },
    { icon: 'fa-solid fa-map', title: 'Growth Roadmap', desc: 'Custom 90-day plan with SKU targets, keyword strategy & campaign budget.' },
    { icon: 'fa-solid fa-rocket', title: 'Account Onboarding', desc: 'Your dedicated team gets access and begins listing setup within 7 days.' },
    { icon: 'fa-solid fa-gears', title: 'Active Management', desc: 'Daily listing updates, campaign optimization & competitor monitoring.' },
    { icon: 'fa-solid fa-chart-line', title: 'Monthly Reviews', desc: 'Performance report, revenue analysis & next-month scaling decisions.' },
  ],
  digital: [
    { icon: 'fa-solid fa-magnifying-glass', title: 'Full Audit', desc: 'Deep-dive into your current digital presence, audience & competitors.' },
    { icon: 'fa-solid fa-lightbulb', title: 'Strategy Session', desc: 'We map a content + ad strategy aligned to your business goals.' },
    { icon: 'fa-solid fa-pen-nib', title: 'Creative Production', desc: 'Our team designs creatives, writes copy & builds campaigns.' },
    { icon: 'fa-solid fa-rocket', title: 'Campaign Launch', desc: 'Go live with precision targeting, tracking & budget management.' },
    { icon: 'fa-solid fa-chart-bar', title: 'Optimize & Scale', desc: 'Monthly reports + continuous A/B testing to improve ROAS.' },
  ],
  influencer: [
    { icon: 'fa-solid fa-file-lines', title: 'Brand Brief', desc: 'We capture your brand voice, goals & target audience.' },
    { icon: 'fa-solid fa-users', title: 'Creator Matching', desc: 'Hand-picked influencers from our verified 10,000+ creator network.' },
    { icon: 'fa-solid fa-clapperboard', title: 'Content Creation', desc: 'Influencers create authentic content with your talking points & brief.' },
    { icon: 'fa-solid fa-paper-plane', title: 'Campaign Goes Live', desc: 'Posts, stories & reels go live across platforms simultaneously.' },
    { icon: 'fa-solid fa-chart-pie', title: 'Analytics Report', desc: 'Reach, impressions, engagement & ROI measured and reported.' },
  ],
  website: [
    { icon: 'fa-solid fa-comments', title: 'Requirements Call', desc: 'We understand your goals, brand identity & technical needs.' },
    { icon: 'fa-solid fa-pencil-ruler', title: 'Design Mockup', desc: 'UI/UX wireframes presented for your approval before we build.' },
    { icon: 'fa-solid fa-code', title: 'Development', desc: 'Full-stack development with mobile-first, SEO-ready architecture.' },
    { icon: 'fa-solid fa-vials', title: 'Testing & QA', desc: 'Cross-browser, cross-device testing before we hand it over.' },
    { icon: 'fa-solid fa-flag-checkered', title: 'Launch & Support', desc: 'Live deployment + 1-year support for bugs & minor updates.' },
  ],
  'mp-branding': [
    { icon: 'fa-solid fa-file-lines', title: 'Content Brief', desc: 'We align on brand tone, product USPs & visual direction.' },
    { icon: 'fa-solid fa-pen-nib', title: 'Creative Design', desc: 'Infographics, A+ modules & enhanced descriptions crafted.' },
    { icon: 'fa-solid fa-upload', title: 'Listing Upload', desc: 'Content uploaded directly to Amazon / Flipkart backend.' },
    { icon: 'fa-solid fa-eye', title: 'Review & Approve', desc: 'You review live pages — we tweak until you\'re satisfied.' },
    { icon: 'fa-solid fa-chart-line', title: 'Performance Track', desc: 'Monitor CTR, conversion & ranking impact post-launch.' },
  ],
  branding: [
    { icon: 'fa-solid fa-magnifying-glass', title: 'Brand Audit', desc: 'We analyze your current identity, competitors & market position.' },
    { icon: 'fa-solid fa-palette', title: 'Strategy & Design', desc: 'Visual identity, messaging framework & channel strategy defined.' },
    { icon: 'fa-solid fa-layer-group', title: 'Creative Production', desc: 'Graphics, reels, website & ad creatives produced by our team.' },
    { icon: 'fa-solid fa-rocket', title: 'Multi-Channel Launch', desc: 'Social, ads & website go live simultaneously for maximum impact.' },
    { icon: 'fa-solid fa-chart-bar', title: 'Optimize & Grow', desc: 'Monthly reviews + ongoing creative refreshes to sustain growth.' },
  ],
  '360': [
    { icon: 'fa-solid fa-magnifying-glass', title: 'Full Digital Audit', desc: 'Every channel reviewed — ads, SEO, social, marketplace & website.' },
    { icon: 'fa-solid fa-map', title: 'Custom Growth Plan', desc: '90-day multi-channel roadmap with KPIs for every department.' },
    { icon: 'fa-solid fa-layer-group', title: 'Multi-Channel Setup', desc: 'All platforms onboarded: ads, SEO, social, marketplace & store.' },
    { icon: 'fa-solid fa-rocket', title: 'Unified Launch', desc: 'Everything goes live together for compound growth effect.' },
    { icon: 'fa-solid fa-chart-pie', title: 'Weekly Growth Reviews', desc: 'One unified dashboard — all channels, one report, one team.' },
  ],
};

export function journeySteps(svc) {
  return JOURNEY[svc.category] || JOURNEY.digital;
}

/* ═══════════════════════════════════════════════
   KEY BENEFITS — shown as "What you get" cards
═══════════════════════════════════════════════ */
const BENEFITS = {
  marketplace: [
    { icon: 'fa-solid fa-list-check', title: 'Listing Excellence', desc: 'Every SKU optimized with high-conversion titles, bullets & keywords.' },
    { icon: 'fa-solid fa-bullseye', title: 'Campaign Mastery', desc: 'Data-driven ad campaigns that lower ACoS and maximize ROAS.' },
    { icon: 'fa-solid fa-shield-halved', title: 'Account Protection', desc: 'Claim management, suspension prevention & policy compliance.' },
    { icon: 'fa-solid fa-chart-line', title: 'Growth Reporting', desc: 'Monthly analytics reports with actionable next steps.' },
  ],
  digital: [
    { icon: 'fa-solid fa-crosshairs', title: 'Precision Targeting', desc: 'Reach the exact audience ready to buy your product or service.' },
    { icon: 'fa-solid fa-pen-nib', title: 'Creative Excellence', desc: 'High-quality graphics, copy and video produced by our team.' },
    { icon: 'fa-solid fa-rotate', title: 'Continuous Optimization', desc: 'A/B testing and data-driven tweaks every week to improve results.' },
    { icon: 'fa-solid fa-chart-bar', title: 'Clear ROI Reports', desc: 'Monthly reports that show exactly what your money is doing.' },
  ],
  influencer: [
    { icon: 'fa-solid fa-certificate', title: 'Verified Creators', desc: 'Every influencer vetted for authentic engagement and audience fit.' },
    { icon: 'fa-solid fa-handshake', title: 'Managed Collab', desc: 'We handle briefs, approvals, timelines and payments end-to-end.' },
    { icon: 'fa-solid fa-fire', title: 'Authentic Content', desc: 'Real creators telling real stories — not scripted ads.' },
    { icon: 'fa-solid fa-chart-pie', title: 'ROI Analytics', desc: 'Reach, engagement & conversion tracked per influencer per post.' },
  ],
  website: [
    { icon: 'fa-solid fa-mobile', title: 'Mobile-First Design', desc: 'Pixel-perfect on every device — phone, tablet and desktop.' },
    { icon: 'fa-solid fa-bolt', title: 'Fast Load Speed', desc: 'Optimized performance scores for better UX and SEO ranking.' },
    { icon: 'fa-solid fa-magnifying-glass-chart', title: 'SEO Ready', desc: 'Built with proper schema, meta tags and technical SEO from day one.' },
    { icon: 'fa-solid fa-headset', title: '1-Year Support', desc: 'Bug fixes and minor updates included for a full year post-launch.' },
  ],
  'mp-branding': [
    { icon: 'fa-solid fa-star', title: 'A+ Content', desc: 'Rich media modules that increase conversion by up to 10%.' },
    { icon: 'fa-solid fa-image', title: 'Infographic Design', desc: 'High-quality product infographics that answer buyer questions.' },
    { icon: 'fa-solid fa-store', title: 'Brand Store Setup', desc: 'Your own storefront on Amazon or Flipkart — built and branded.' },
    { icon: 'fa-solid fa-chart-line', title: 'Impact Tracking', desc: 'CTR and conversion monitored after every content update.' },
  ],
  branding: [
    { icon: 'fa-solid fa-palette', title: 'Full Brand Identity', desc: 'Logo, color palette, fonts and visual language defined for you.' },
    { icon: 'fa-solid fa-layer-group', title: 'Multi-Channel', desc: 'Social, ads and website — all designed to look and feel cohesive.' },
    { icon: 'fa-solid fa-film', title: 'Creative Assets', desc: 'Posts, reels, ad creatives and web content produced monthly.' },
    { icon: 'fa-solid fa-chart-bar', title: 'Unified Reporting', desc: 'One report covering every channel so nothing is missed.' },
  ],
  '360': [
    { icon: 'fa-solid fa-layer-group', title: 'Every Channel Covered', desc: 'Ads, SEO, social, marketplace and website — all in one team.' },
    { icon: 'fa-solid fa-users', title: 'Dedicated Growth Team', desc: 'Senior strategist + specialists assigned to your account.' },
    { icon: 'fa-solid fa-chart-line', title: 'Compound Growth', desc: 'Channels amplify each other — social boosts SEO, ads boost sales.' },
    { icon: 'fa-solid fa-file-lines', title: 'Weekly Reports', desc: 'One unified dashboard. Every channel. Every metric. Weekly.' },
  ],
};

export function keyBenefits(svc) {
  return BENEFITS[svc.category] || BENEFITS.digital;
}
