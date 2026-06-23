// Maps "Service Title|Plan Name" → features array
// Used by tracker views across client, pos_head, and team_member dashboards

const FEATURES_MAP = {
  // ── Marketplace ──────────────────────────────────────────────────────────
  'Amazon Management|Basic':    ['50 SKU listings & optimization','Keyword updates on existing listings','10 claim submissions + competitor analysis','50 title & description optimizations','1 growth call + CTR enhancement','100 high-CTR listing campaigns','Image enhancement for 50 products'],
  'Amazon Management|Standard': ['100 SKU listings & optimization','Keyword updates on existing listings','15 claim submissions + competitor analysis','100 title & description optimizations','3 growth calls/week + CTR enhancement','200 high-CTR campaigns + 50 organic activities','Social media promotions + 100 image enhancements','5 A+ listings & performance management'],
  'Amazon Management|Premium':  ['150 SKU listings & optimization','Keyword updates on existing listings','25 claim submissions + competitor analysis','300 title & description optimizations','Unlimited growth calls + CTR enhancement','300 high-CTR campaigns + 100 organic activities','Social media promotions + 150 image enhancements','10 A+ listings, performance management & POA'],

  'Flipkart Management|Basic':    ['50 SKU listings & optimization','Keyword updates on existing listings','10 claim submissions + competitor analysis','50 title & description optimizations','1 growth call + CTR enhancement','100 high-CTR listing campaigns','50 image enhancements'],
  'Flipkart Management|Standard': ['100 SKU listings & optimization','Keyword updates on existing listings','15 claim submissions + competitor analysis','100 title & description optimizations','3 growth calls/week + CTR enhancement','200 high-CTR campaigns + 50 organic activities','100 social media + image enhancements','Performance management included'],
  'Flipkart Management|Premium':  ['150 SKU listings & optimization','Keyword updates on existing listings','25 claim submissions + competitor analysis','300 title & description optimizations','Unlimited growth calls + CTR enhancement','300 high-CTR campaigns + 100 organic activities','150 social media + image enhancements','Performance management & POA for suspension'],

  'Meesho Management|Basic':    ['50 SKU listings & optimization','Keyword updates','10 claim submissions','50 title optimizations','1 growth call','100 high-CTR campaigns','Image enhancement for 50 products'],
  'Meesho Management|Standard': ['100 SKU listings & optimization','Keyword updates','15 claim submissions','100 title optimizations','3 growth calls/week','200 campaigns + 50 organic activities','Performance management'],
  'Meesho Management|Premium':  ['150 SKU listings & optimization','25 claim submissions','300 title optimizations','Unlimited growth calls','300 campaigns + 100 organic activities','Performance management & full account audit'],

  'Ajio Management|Basic':    ['50 SKU listings','Keyword updates','Competitor analysis','Title & description optimization','Growth call + CTR enhancement','Campaign management','Image optimization'],
  'Ajio Management|Standard': ['100 SKU listings','Keyword updates','15 claim submissions','100 title optimizations','3 growth calls/week','200 campaigns + organic activities','Social media promotions + performance management'],
  'Ajio Management|Premium':  ['150 SKU listings','25 claim submissions','300 title optimizations','Unlimited growth calls','300 campaigns + organic activities','Full performance management & brand store setup'],

  'Myntra Management|Basic':    ['50 SKU catalogue management','Keyword & style tag optimization','Competitor benchmarking','Title & image optimization','Growth call + CTR strategy','Campaign management','Basic reporting'],
  'Myntra Management|Standard': ['100 SKU catalogue management','Advanced keyword & style optimization','15 claim submissions','3 growth calls/week','200 high-CTR campaigns','Social promotions + performance management'],
  'Myntra Management|Premium':  ['150 SKU + unlimited catalogue updates','25 claim submissions','Unlimited growth calls','300 campaigns + organic activities','Full performance management & brand story'],

  'Nykaa Management|Basic':    ['50 SKU beauty listings','Ingredient keyword optimization','Competitor analysis','Title & image optimization','Growth call + CTR strategy','Campaign management','Basic reporting'],
  'Nykaa Management|Standard': ['100 SKU listings & optimization','Keyword & beauty-trend updates','15 submissions','3 growth calls/week','Campaigns + organic promotions','Performance management'],
  'Nykaa Management|Premium':  ['150 SKU full management','Unlimited growth calls','300 campaigns','Social + organic activities','Full performance management & brand story'],

  'Snapdeal Management|Basic':    ['50 SKU listings','Keyword updates','Competitor analysis','Title optimization','Growth call','Campaign management','Image optimization'],
  'Snapdeal Management|Standard': ['100 SKU listings','Keyword updates','15 submissions','3 growth calls/week','200 campaigns + organic activities','Performance management'],
  'Snapdeal Management|Premium':  ['150 SKU full management','25 submissions','Unlimited growth calls','300 campaigns','Full performance management'],

  'eBay Management|Basic':    ['50 global SKU listings','International keyword research','Competitor analysis','Title & description optimization','Growth call + CTR strategy','eBay campaign management','Image optimization'],
  'eBay Management|Standard': ['100 global SKU listings','Advanced keyword research','15 submissions + analysis','3 growth calls/week','200 campaigns + organic activities','Performance management + eBay store setup'],
  'eBay Management|Premium':  ['150 global SKU full management','Unlimited growth calls','300 campaigns','Cross-border shipping strategy','Full performance management & global expansion'],

  'Etsy Management|Basic':    ['50 creative SKU listings','Etsy SEO keyword research','Competitor analysis','Tag & description optimization','Growth call + shop audit','Campaign & Etsy Ads management','Photography tips & image review'],
  'Etsy Management|Standard': ['100 SKU listings','Advanced Etsy SEO','15 submissions','3 growth calls/week','200 Etsy Ad campaigns','Shop banner & branding','Performance management'],
  'Etsy Management|Premium':  ['150 SKU full management','Unlimited growth calls','Full Etsy Ads strategy','Social promotions + Etsy SEO','Complete shop branding & performance management'],

  // ── Digital Marketing ─────────────────────────────────────────────────────
  'Social Media Optimization|Basic':    ['Image Posting & Stories Reshare — 15','Caption & hashtag provided','Organic post boosting','Profile optimization','Negative comment removal — up to 15','Posting calendar','Reply on business queries — up to 10'],
  'Social Media Optimization|Standard': ['Image Posting & Stories Reshare — 24','2 reel edits (raw video by client)','Highlight icon design — 5','Negative comment removal — up to 30','Post boost — 2 + 3 additional sessions','Monthly performance reports','Customized content strategy'],
  'Social Media Optimization|Premium':  ['Image Posting & Stories Reshare — 26','4 reel edits (incl. 1 infographic reel)','Post boost — 4','Negative comment removal — up to 50','2 full ad campaigns','Logo design included','PR guidance','Personalized strategy & calendar','Reply on business — up to 25'],

  'Search Engine Optimization|Basic':    ['Audit & Keyword Research','Content Creation — 5 images','Backlink promotions — 10 pages','On-Page & Off-Page SEO','Reporting & Refinement','Traffic & ranking monitoring'],
  'Search Engine Optimization|Standard': ['Audit & Keyword Research','Content Creation — 10 images','Backlink promotions — 30 pages','Article Creation — 5 articles','Custom SEO planning','On/Off-Page & Local SEO','Reporting & Refinement'],
  'Search Engine Optimization|Premium':  ['Audit & Keyword Research','Content Creation — 20 images','Backlink promotions — 50 pages','Article Creation — 10 articles','Custom SEO planning','On/Off-Page & Local SEO','Reporting & Refinement'],

  'Social Media Marketing|Basic':    ['Campaign creation — 3','Facebook Business Manager setup','Custom audience creation','Ad placement customization','Graphic & copy creation — 3'],
  'Social Media Marketing|Standard': ['Campaign creation — 6','FB Business Manager + Pixel installation','Custom audience & placement customization','Graphic & copy creation — 6','Custom conversion & remarketing','Carousel & Collection Ads','Traffic monitoring & monthly report'],
  'Social Media Marketing|Premium':  ['Campaign creation — 10','FB Business Manager + Pixel installation','Custom conversion & remarketing','Facebook Analytics Report','Ad campaign monitoring & catalogue creation','Dynamic Ads & Instant Experience Ads','Carousel & Collection Ads','Instagram Ads monitoring & management','Graphic & copy creation — 10'],

  'Google Ads Management|Basic':    ['Account setup','Keyword research','Ad creation × 2','Conversion tracking','Competitor analysis','Budget management'],
  'Google Ads Management|Standard': ['Account setup','Keyword research','Ad creation × 4','Bid management','Conversion tracking','Performance analysis','Competitor analysis','Budget management'],
  'Google Ads Management|Premium':  ['Account setup','Keyword research','Ad creation × 7','Landing page optimization','Ad extensions','Bid management','A/B testing','Conversion tracking','Performance analysis','Competitor analysis','Budget management','Continuous optimization'],

  'YouTube Management|Basic':    ['Channel setup & optimization','Content strategy development','Video production & editing × 2','Keyword research','YouTube Advertising','Analytics & reporting'],
  'YouTube Management|Standard': ['Channel setup & optimization','Content strategy development','Video production & editing × 4','Keyword research','Audience engagement','Video SEO','YouTube Advertising','Analytics & reporting','Competitor analysis'],
  'YouTube Management|Premium':  ['Channel setup & optimization','Content strategy','Video production × 6','Keyword research','Audience engagement','Video SEO','Cross-promotion strategy','YouTube Advertising','Analytics & reporting','YouTube Live & Stories','Channel monetization'],

  // ── Influencer ────────────────────────────────────────────────────────────
  'Influencer Marketing|Basic':      ['2–3 influencer collaborations (nano focus)','Basic content creation guidance','Brand talking points & brief','Monthly performance reports','Customizable influencer mix','Content formats: posts, stories, reviews, video','Digital marketing integration available'],
  'Influencer Marketing|Business':   ['4–6 influencer collaborations (nano + micro mix)','In-depth content creation guidance','Content calendar & post format planning','Bi-weekly performance reports','Dedicated account manager','Customizable influencer mix','Multiple content format options','Holistic digital marketing integration'],
  'Influencer Marketing|Enterprise': ['7–10 influencer collaborations (micro, macro & nano mix)','Comprehensive content creation support','Concept development & scriptwriting','Weekly performance reports','Dedicated account manager + ongoing optimization','Customizable influencer strategy','Multiple content format support','Full digital marketing integration'],

  // ── Website & Dev ─────────────────────────────────────────────────────────
  'Website Design|Basic':    ['Competitor keyword analysis','Website design + product listings','Compelling copy to increase conversions','Keyword-optimized product listings','Professionally-crafted sales copies','Up to 5 SKU optimization'],
  'Website Design|Standard': ['Competitor keyword analysis','Advanced website design + listings','Compelling conversion copy','High-value keyword optimization','Professionally-crafted sales copies','Up to 10 SKU optimization','UI/UX improvements'],
  'Website Design|Premium':  ['Competitor keyword analysis','Premium website design + listings','Full conversion copy suite','Keyword-optimized product listings','Professionally-crafted sales copies','Unlimited SKU optimization','Full UI/UX & responsive design'],

  'E-Commerce Website|Basic':    ['E-commerce product listings — 5 SKU','Competitor keyword analysis','Product listing services','Compelling conversion copy','High-value keyword optimization','Professional sales copies'],
  'E-Commerce Website|Standard': ['E-commerce product listings — up to 20 SKU','Competitor keyword analysis','Advanced listing optimization','Compelling conversion copy','High-value keyword optimization','Professional sales copies','UI/UX design','Payment gateway integration'],
  'E-Commerce Website|Premium':  ['E-commerce listings — unlimited SKU','Competitor keyword analysis','Full listing optimization suite','Full conversion copy','High-value keyword optimization','Professional sales copies','Advanced UI/UX','Payment gateway + delivery partner integration','1 year support'],

  'Shopify Development|Basic':    ['50 SKU product listings','Shopify store setup & configuration','Theme design & customization','Shopify integration & SEO','Shopify migration','App development','Maintenance & support'],
  'Shopify Development|Standard': ['100 SKU product listings','Shopify store setup & configuration','Advanced theme design & customization','Full Shopify integration suite','Shopify SEO','Migration + app development','Shopify Plus development','Maintenance & support','Custom checkout flow'],
  'Shopify Development|Premium':  ['150 SKU product listings','Complete Shopify store setup','Premium theme design & customization','Full integration suite','Advanced Shopify SEO','Migration + app development','Shopify Plus development','Priority maintenance & support','Custom checkout & payment flows'],

  // ── Marketplace Branding ──────────────────────────────────────────────────
  'Marketplace Branding|Basic':    ['5 A+ content pages','Competitor benchmark analysis','Infographic creation — 5 images','Enhanced product descriptions','Keyword-rich bullet points','Basic brand story module','Image optimization for listing'],
  'Marketplace Branding|Standard': ['10 A+ content pages','Competitor benchmark analysis','Infographic creation — 10 images','Enhanced product descriptions','Keyword-rich bullet points','Brand store setup (3 pages)','EBC (Enhanced Brand Content)','Performance tracking'],
  'Marketplace Branding|Premium':  ['20+ A+ content pages','Competitor benchmark analysis','Infographic creation — 20 images','Premium enhanced descriptions','Keyword-rich bullet points','Full brand store (unlimited pages)','EBC + video module','Sponsored brand ads setup','Performance tracking & optimization'],

  // ── Branding Plans ────────────────────────────────────────────────────────
  'Branding Plans|Basic':    ['Image Posting & Stories Reshare — 15','Caption & hashtag provided','Organic boosting + best graphics','Profile optimization','Negative comment removal — up to 15','Posting calendar + business replies — up to 10','Campaign creation — 3','Facebook Business Manager setup','Custom audience & ad placement customization','Graphic & copy creation — 3','WordPress/Shopify development','4-page E-commerce website','Product listing — 10 with creative images','1 year support','Domain & hosting provided'],
  'Branding Plans|Standard': ['Image Posting & Stories Reshare — 24','2 reel edits (raw video by client)','Highlight icon design — 5','Business replies — up to 15','Negative comment removal — up to 30','Post boost — 2','Posting calendar + organic boosting','Profile optimization + customized strategy','Campaign creation — 6','Facebook Business Manager + Pixel','Custom audience & placement customization','Carousel graphic & copy — 6','WordPress/Shopify/PHP development','6-page E-commerce website','Product listing — 50 with creative images','UI/UX','1 year support','Domain & hosting provided'],
  'Branding Plans|Premium':  ['Image Posting & Stories Reshare — 26','4 reel edits (incl. 1 infographic)','Post boost — 4','Negative comment removal — up to 50','Logo design + PR guidance','Organic boosting + premium graphics','Profile optimization + personalized strategy','Highlight icon design — 7','Business replies — up to 25','Campaign creation — 10','FB Business Manager + Pixel + Custom Conversion','Remarketing + Facebook Analytics Report','Dynamic Ads + Instant Experience Ads','Instagram Ads monitoring & management','Shopify/PHP development','Fully customized E-commerce website','Product listing — 100 with creative images','UI/UX','1 year support','Domain & hosting','Payment method integration','Delivery partner support'],

  // ── 360° Marketing ────────────────────────────────────────────────────────
  '360° Marketing Plans|Starter':    ['Google Ads management (Basic)','Social Media Optimization — 15 posts','SEO (Basic) — 10 pages backlinks','1 marketplace account management','Website design (Basic)','Monthly performance reports','Dedicated account manager','WhatsApp business setup'],
  '360° Marketing Plans|Growth':     ['Google Ads management (Standard)','Social Media Optimization — 24 posts','SEO (Standard) — 30 pages backlinks','2 marketplace account management','E-commerce website (Standard)','Influencer marketing — 2 collaborations','Bi-weekly performance reports','Dedicated senior account manager','WhatsApp + email marketing flows'],
  '360° Marketing Plans|Enterprise': ['Google Ads management (Premium)','Social Media Optimization — 26 posts','SEO (Premium) — 50 pages backlinks','3 marketplace account management','Full custom e-commerce website','Influencer marketing — 5 collaborations','Shopify store setup','Weekly performance reports','Dedicated growth team','WhatsApp + email + SMS automation','YouTube channel management','Brand identity package'],
};

export function getPlanFeatures(serviceName, planName) {
  if (!serviceName || !planName) return [];
  const key = `${serviceName}|${planName}`;
  return FEATURES_MAP[key] || [];
}

export default FEATURES_MAP;
