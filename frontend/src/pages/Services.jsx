import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext.jsx';
import { toast } from 'react-toastify';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import ConsultationModal from '../components/ConsultationModal.jsx';
import Chatbot from '../components/Chatbot.jsx';
import ExitIntentPopup from '../components/ExitIntentPopup.jsx';
import LeadCaptureBar from '../components/LeadCaptureBar.jsx';
import LeadPopup from '../components/LeadPopup.jsx';
import api from '../api/axios.js';

const SERVICES_POPUP_CONFIG = {
  delay: 9000,
  badge: 'GET EXPERT HELP',
  title: 'Not sure which plan fits your business?',
  subtitle: 'Tell us your goals — our expert will suggest the perfect package in 30 mins. Free, no commitment.',
  fields: [
    { name: 'name',  placeholder: 'Your name or brand name' },
    { name: 'phone', placeholder: 'WhatsApp number', type: 'tel' },
  ],
  ctaText: 'Get Expert Advice Free →',
  source: 'services_popup',
  storageKey: 'cruzen_svc_popup',
};

/* ═══════════════════════════════════════════════
   SERVICE DATA
═══════════════════════════════════════════════ */

const MARKETPLACE_SERVICES = [
  {
    id: 'amazon', icon: 'fa-brands fa-amazon', title: 'Amazon Management', tag: 'SPN Partner',
    image: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=900&q=80&auto=format&fit=crop',
    desc: 'End-to-end Amazon SPN account management — listings, campaigns, A+ content & growth calls.',
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
    plans: [
      { name: 'Basic',    price: 4999,  original: 6499,  popular: false, features: ['50 creative SKU listings','Etsy SEO keyword research','Competitor analysis','Tag & description optimization','Growth call + shop audit','Campaign & Etsy Ads management','Photography tips & image review'] },
      { name: 'Standard', price: 7999,  original: 10499, popular: true,  features: ['100 SKU listings','Advanced Etsy SEO','15 submissions','3 growth calls/week','200 Etsy Ad campaigns','Shop banner & branding','Performance management'] },
      { name: 'Premium',  price: 13999, original: 18999, popular: false, features: ['150 SKU full management','Unlimited growth calls','Full Etsy Ads strategy','Social promotions + Etsy SEO','Complete shop branding & performance management'] },
    ],
  },
];

const DIGITAL_SERVICES = [
  {
    id: 'smo', icon: 'fa-solid fa-share-nodes', title: 'Social Media Optimization', tag: 'Organic Growth',
    image: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=900&q=80&auto=format&fit=crop',
    desc: 'Grow your organic social presence with content strategy, posting calendars & engagement management.',
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
    plans: [
      { name: 'Basic',    price: 60000,  original: 80000,  popular: false, features: ['Channel setup & optimization','Content strategy development','Video production & editing × 2','Keyword research','YouTube Advertising','Analytics & reporting'] },
      { name: 'Standard', price: 80000,  original: 95000,  popular: true,  features: ['Channel setup & optimization','Content strategy development','Video production & editing × 4','Keyword research','Audience engagement','Video SEO','YouTube Advertising','Analytics & reporting','Competitor analysis'] },
      { name: 'Premium',  price: 120000, original: 200000, popular: false, features: ['Channel setup & optimization','Content strategy','Video production × 6','Keyword research','Audience engagement','Video SEO','Cross-promotion strategy','YouTube Advertising','Analytics & reporting','YouTube Live & Stories','Channel monetization'] },
    ],
  },
];

const INFLUENCER_SERVICES = [
  {
    id: 'influencer', icon: 'fa-solid fa-user-tie', title: 'Influencer Marketing', tag: '10,000+ Creators',
    image: 'https://images.unsplash.com/photo-1533227268428-f9ed0900fb3b?w=900&q=80&auto=format&fit=crop',
    desc: 'Connect your brand with verified nano, micro & macro influencers across every niche.',
    plans: [
      { name: 'Basic',      price: 9999,  original: 11999, popular: false, features: ['2–3 influencer collaborations (nano focus)','Basic content creation guidance','Brand talking points & brief','Monthly performance reports','Customizable influencer mix','Content formats: posts, stories, reviews, video','Digital marketing integration available'] },
      { name: 'Business',   price: 24999, original: 29999, popular: true,  features: ['4–6 influencer collaborations (nano + micro mix)','In-depth content creation guidance','Content calendar & post format planning','Bi-weekly performance reports','Dedicated account manager','Customizable influencer mix','Multiple content format options','Holistic digital marketing integration'] },
      { name: 'Enterprise', price: 44999, original: 59999, popular: false, features: ['7–10 influencer collaborations (micro, macro & nano mix)','Comprehensive content creation support','Concept development & scriptwriting','Weekly performance reports','Dedicated account manager + ongoing optimization','Customizable influencer strategy','Multiple content format support','Full digital marketing integration'] },
    ],
  },
];

const WEBSITE_SERVICES = [
  {
    id: 'website-design', icon: 'fa-solid fa-desktop', title: 'Website Design', tag: 'Custom Built',
    image: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=900&q=80&auto=format&fit=crop',
    desc: 'Professional static & dynamic websites — clean design, fast loading & conversion-optimized.',
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
    plans: [
      { name: 'Basic',    price: 14999, original: 19999, popular: false, features: ['WhatsApp Business API setup','Automated reply bot (up to 10 flows)','Lead capture form integration','Email drip sequence (3 emails)','Basic CRM integration','Monthly performance report'] },
      { name: 'Standard', price: 24999, original: 32999, popular: true,  features: ['WhatsApp Business API + catalog setup','Advanced chatbot (up to 25 flows)','Lead capture + CRM auto-sync','Email drip sequence (7 emails)','Full CRM integration (HubSpot / Zoho)','WhatsApp broadcast campaigns','Bi-weekly performance reports','Dedicated automation manager'] },
      { name: 'Premium',  price: 44999, original: 59999, popular: false, features: ['WhatsApp Business API + full catalog','Unlimited automation flows','Multi-platform chatbot (WA + Instagram + website)','Complete CRM integration & pipeline setup','Email + WhatsApp drip sequences','AI-powered lead scoring','Weekly performance reports','Custom API integrations','Priority support & quarterly strategy review'] },
    ],
  },
];

const MP_BRANDING_SERVICES = [
  {
    id: 'mp-branding', icon: 'fa-solid fa-certificate', title: 'Marketplace Branding', tag: 'Brand Content',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900&q=80&auto=format&fit=crop',
    desc: 'A+ content, EBC, brand stores & enhanced catalogues for Amazon, Flipkart & more.',
    plans: [
      { name: 'Basic',    price: 8999,  original: 11999, popular: false, features: ['5 A+ content pages','Competitor benchmark analysis','Infographic creation — 5 images','Enhanced product descriptions','Keyword-rich bullet points','Basic brand story module','Image optimization for listing'] },
      { name: 'Standard', price: 15999, original: 19999, popular: true,  features: ['10 A+ content pages','Competitor benchmark analysis','Infographic creation — 10 images','Enhanced product descriptions','Keyword-rich bullet points','Brand store setup (3 pages)','EBC (Enhanced Brand Content)','Performance tracking'] },
      { name: 'Premium',  price: 27999, original: 35999, popular: false, features: ['20+ A+ content pages','Competitor benchmark analysis','Infographic creation — 20 images','Premium enhanced descriptions','Keyword-rich bullet points','Full brand store (unlimited pages)','EBC + video module','Sponsored brand ads setup','Performance tracking & optimization'] },
    ],
  },
];

const BRANDING_SERVICES = [
  {
    id: 'branding', icon: 'fa-solid fa-palette', title: 'Branding Plans', tag: 'All-in-One',
    image: 'https://images.unsplash.com/photo-1434626881859-194d67b2b86f?w=900&q=80&auto=format&fit=crop',
    desc: 'End-to-end brand identity — SMO + SMM + website development bundled into one powerful plan.',
    plans: [
      { name: 'Basic',    price: 29000, original: 35000,  popular: false, features: ['Image Posting & Stories Reshare — 15','Caption & hashtag provided','Organic boosting + best graphics','Profile optimization','Negative comment removal — up to 15','Posting calendar + business replies — up to 10','Campaign creation — 3','Facebook Business Manager setup','Custom audience & ad placement customization','Graphic & copy creation — 3','WordPress/Shopify development','4-page E-commerce website','Product listing — 10 with creative images','1 year support','Domain & hosting provided'] },
      { name: 'Standard', price: 48999, original: 55000,  popular: true,  features: ['Image Posting & Stories Reshare — 24','2 reel edits (raw video by client)','Highlight icon design — 5','Business replies — up to 15','Negative comment removal — up to 30','Post boost — 2','Posting calendar + organic boosting','Profile optimization + customized strategy','Campaign creation — 6','Facebook Business Manager + Pixel','Custom audience & placement customization','Carousel graphic & copy — 6','WordPress/Shopify/PHP development','6-page E-commerce website','Product listing — 50 with creative images','UI/UX','1 year support','Domain & hosting provided'] },
      { name: 'Premium',  price: 92999, original: 128000, popular: false, features: ['Image Posting & Stories Reshare — 26','4 reel edits (incl. 1 infographic)','Post boost — 4','Negative comment removal — up to 50','Logo design + PR guidance','Organic boosting + premium graphics','Profile optimization + personalized strategy','Highlight icon design — 7','Business replies — up to 25','Campaign creation — 10','FB Business Manager + Pixel + Custom Conversion','Remarketing + Facebook Analytics Report','Dynamic Ads + Instant Experience Ads','Instagram Ads monitoring & management','Shopify/PHP development','Fully customized E-commerce website','Product listing — 100 with creative images','UI/UX','1 year support','Domain & hosting','Payment method integration','Delivery partner support'] },
    ],
  },
];

const PLAN_360_SERVICES = [
  {
    id: '360', icon: 'fa-solid fa-chart-pie', title: '360° Marketing Plans', tag: 'Total Growth',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&q=80&auto=format&fit=crop',
    desc: 'Complete digital growth engine — ads, SEO, social, marketplace & website all in one package.',
    plans: [
      { name: 'Starter',    price: 35000, original: 45000,  popular: false, features: ['Google Ads management (Basic)','Social Media Optimization — 15 posts','SEO (Basic) — 10 pages backlinks','1 marketplace account management','Website design (Basic)','Monthly performance reports','Dedicated account manager','WhatsApp business setup'] },
      { name: 'Growth',     price: 65000, original: 85000,  popular: true,  features: ['Google Ads management (Standard)','Social Media Optimization — 24 posts','SEO (Standard) — 30 pages backlinks','2 marketplace account management','E-commerce website (Standard)','Influencer marketing — 2 collaborations','Bi-weekly performance reports','Dedicated senior account manager','WhatsApp + email marketing flows'] },
      { name: 'Enterprise', price: 99999, original: 145000, popular: false, features: ['Google Ads management (Premium)','Social Media Optimization — 26 posts','SEO (Premium) — 50 pages backlinks','3 marketplace account management','Full custom e-commerce website','Influencer marketing — 5 collaborations','Shopify store setup','Weekly performance reports','Dedicated growth team','WhatsApp + email + SMS automation','YouTube channel management','Brand identity package'] },
    ],
  },
];

/* ═══════════════════════════════════════════════
   CATEGORIES — sidebar structure
═══════════════════════════════════════════════ */
const CATEGORIES = [
  { key: 'marketplace',  label: 'Marketplace Management', icon: 'fa-store',           color: '#f59e0b', services: MARKETPLACE_SERVICES },
  { key: 'digital',      label: 'Digital Marketing',      icon: 'fa-bullhorn',        color: '#6366f1', services: DIGITAL_SERVICES },
  { key: 'influencer',   label: 'Influencer Marketing',   icon: 'fa-user-friends',    color: '#ec4899', services: INFLUENCER_SERVICES },
  { key: 'website',      label: 'Website & Development',  icon: 'fa-laptop-code',     color: '#10b981', services: WEBSITE_SERVICES },
  { key: 'mp-branding',  label: 'Marketplace Branding',   icon: 'fa-certificate',     color: '#8b5cf6', services: MP_BRANDING_SERVICES },
  { key: 'branding',     label: 'Branding Plans',         icon: 'fa-paint-brush',     color: '#ef4444', services: BRANDING_SERVICES },
  { key: '360',          label: '360° Marketing',         icon: 'fa-chart-line',      color: '#00b4cc', services: PLAN_360_SERVICES },
];

const ALL_FLAT = CATEGORIES.flatMap(c => c.services);


/* ═══════════════════════════════════════════════
   PLAN CARD
═══════════════════════════════════════════════ */
function PlanCard({ plan, svcTitle, onConsult, onBuy, canBuy }) {
  return (
    <div className={`sv2-plan-card${plan.popular ? ' sv2-plan-popular' : ''}`}>
      {plan.popular && <div className="sv2-plan-badge">Most Popular</div>}
      <div className="sv2-plan-name">{plan.name}</div>
      <div className="sv2-plan-pricing">
        <span className="sv2-plan-price">₹{plan.price.toLocaleString('en-IN')}</span>
        <span className="sv2-plan-original">₹{plan.original.toLocaleString('en-IN')}</span>
        <span className="sv2-plan-save">Save {Math.round((1 - plan.price / plan.original) * 100)}%</span>
      </div>
      <ul className="sv2-plan-features">
        {plan.features.map((f, i) => (
          <li key={i}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            {f}
          </li>
        ))}
      </ul>
      <div className="sv2-plan-btns">
        {canBuy && (
          <button className="sv2-btn-buy" onClick={() => onBuy({ label: `${svcTitle} — ${plan.name} Plan`, price: plan.price, service: svcTitle, planName: plan.name })}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            Buy Now
          </button>
        )}
        <button className={`sv2-btn-consult${plan.popular ? ' sv2-btn-primary' : ''}`} onClick={() => onConsult(`${svcTitle} — ${plan.name} Plan`)}>
          Get Consult
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */
export default function Services() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [consultOpen, setConsultOpen] = useState(false);
  const [preSelectedService, setPreSelectedService] = useState(null);
  const [openCats, setOpenCats] = useState({});
  const [mobileOpen, setMobileOpen] = useState(false);
  const [customImages, setCustomImages] = useState({});
  const [payModal, setPayModal] = useState(null);
  const [paying, setPaying] = useState(false);

  // resolve selectedService from URL — null if no URL param
  const svId = searchParams.get('service') || searchParams.get('tab');
  const defaultSvc = ALL_FLAT.find(s => s.id === svId) || null;
  const [selectedSvc, setSelectedSvc] = useState(defaultSvc);

  // helper: get effective image for a service
  const svcImage = (svc, type = 'panel') => customImages[svc.id]?.[type] || svc.image;

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    api.get('/site-config/service_images')
      .then(r => { if (r.data.data) setCustomImages(r.data.data); })
      .catch(() => {});
  }, []);

  // Handle return from login with pending buy intent
  useEffect(() => {
    if (!user) return;
    const intent = localStorage.getItem('cruzen_buy_intent');
    if (!intent) return;
    let plan;
    try { plan = JSON.parse(intent); } catch { plan = null; }
    localStorage.removeItem('cruzen_buy_intent');
    if (!plan) return;
    setPayModal(plan);
  }, [user]);

  const selectService = (svc) => {
    setSelectedSvc(svc);
    setSearchParams({ service: svc.id });
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleCat = (key) => setOpenCats(o => ({ ...o, [key]: !o[key] }));

  const openConsult = (service = null) => { setPreSelectedService(service); setConsultOpen(true); };

  const canBuy = !user || user.role === 'user';

  const handleBuyNow = (plan) => {
    navigate(`/services/${selectedSvc.id}?plan=${encodeURIComponent(plan.planName)}`);
  };

  const submitPayUForm = (payuUrl, params) => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = payuUrl;
    Object.entries(params).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = String(value ?? '');
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
  };

  const handleProceedToPayment = async () => {
    if (!payModal || paying) return;
    setPaying(true);
    try {
      // Step 1: Create order in DB
      const createRes = await api.post('/orders/create', {
        serviceName: payModal.service,
        planName: payModal.planName,
        amount: payModal.price,
      });
      const { order, razorpayOrderId, testMode: rzpTestMode } = createRes.data;

      // Step 2: Try PayU first
      try {
        const payuRes = await api.post('/orders/payu/init', { orderId: order._id });
        const { payuUrl, params, testMode: payuTestMode } = payuRes.data;

        if (!payuTestMode) {
          // Real PayU: redirect to payment page
          setPayModal(null);
          submitPayUForm(payuUrl, params);
          return;
        }
      } catch (payuErr) {
        console.warn('PayU init failed, falling back to Razorpay demo:', payuErr.message);
      }

      // Step 3: Fallback — Razorpay demo mode
      await api.post('/orders/verify', {
        razorpayOrderId,
        razorpayPaymentId: `demo_pay_${Date.now()}`,
        razorpaySignature: `demo_sig_${Date.now()}`,
        orderId: order._id,
        testMode: rzpTestMode !== false,
      });

      setPayModal(null);
      toast.success('Payment confirmed! Your order is now active.', { toastId: 'pay-success' });
      navigate('/dashboard?tab=tracker');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed. Please try again.', { toastId: 'pay-error' });
    } finally {
      setPaying(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Digital Marketing Services — SEO, Meta Ads, Amazon & More | Cruzen Digital</title>
        <meta name="description" content="Browse all Cruzen Digital services: SEO, Meta Ads, Google Ads, Amazon & marketplace management, web design, and 360° brand growth. Plans from ₹4,999/mo." />
        <link rel="canonical" href="https://cruzendigital.us.cc/services" />
        <meta property="og:title" content="Our Services | Cruzen Digital" />
        <meta property="og:url" content="https://cruzendigital.us.cc/services" />
      </Helmet>

      <h1 className="sr-only">Digital Marketing Services — SEO, Meta Ads, Amazon Management & More | Cruzen Digital</h1>

      <Header openConsultation={() => openConsult()} />

      {/* ── Mobile: service selector button ── */}
      <div className="sv2-mobile-trigger">
        <button onClick={() => setMobileOpen(o => !o)} className="sv2-mobile-btn">
          <i className={`fa-solid fa-${selectedSvc?.icon?.match(/fa-(\S+)$/)?.[1] || 'list'}`} style={{ marginRight: 8 }} />
          {selectedSvc?.title || 'Browse Services'}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
        </button>
      </div>

      {/* ── Main layout ── */}
      <div className="sv2-layout">

        {/* ── LEFT SIDEBAR ── */}
        <aside className={`sv2-sidebar${mobileOpen ? ' sv2-sidebar--open' : ''}`}>
          <div className="sv2-sidebar-inner">
            <div className="sv2-sidebar-header">
              <span className="sv2-sidebar-title">Browse Services</span>
              <span className="sv2-sidebar-count">{ALL_FLAT.length} services</span>
            </div>
            {CATEGORIES.map(cat => (
              <div key={cat.key} className="sv2-cat">
                <button className="sv2-cat-header" onClick={() => toggleCat(cat.key)}>
                  <span className="sv2-cat-icon" style={{ background: `${cat.color}1a` }}>
                    <i className={`fa-solid ${cat.icon}`} style={{ color: cat.color }} />
                  </span>
                  <span className="sv2-cat-label">{cat.label}</span>
                  <svg className={`sv2-cat-arrow${openCats[cat.key] ? ' open' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
                </button>
                {openCats[cat.key] && (
                  <div className="sv2-cat-items">
                    {cat.services.map(svc => (
                      <button
                        key={svc.id}
                        className={`sv2-svc-item${selectedSvc?.id === svc.id ? ' active' : ''}`}
                        onClick={() => selectService(svc)}
                      >
                        <div className="sv2-svc-thumb" style={{ background: `${cat.color}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className={svc.icon} style={{ color: cat.color, fontSize: '1rem' }} />
                        </div>
                        <div className="sv2-svc-meta">
                          <span className="sv2-svc-name">{svc.title}</span>
                          <span className="sv2-svc-tag" style={{ color: cat.color }}>{svc.tag}</span>
                        </div>
                        {selectedSvc?.id === svc.id && (
                          <div className="sv2-svc-active-dot" style={{ background: cat.color, boxShadow: `0 0 6px ${cat.color}80` }} />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* ── RIGHT PANEL ── */}
        <main className="sv2-panel">
          {!selectedSvc ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 420, textAlign: 'center', padding: '60px 32px' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#15D8E115,#6366f115)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                <i className="fa-solid fa-grid-2" style={{ fontSize: 32, color: '#15D8E1' }} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0a0f2e', margin: '0 0 12px' }}>Browse our services</h2>
              <p style={{ color: '#64748b', fontSize: 15, maxWidth: 340, lineHeight: 1.65, margin: 0 }}>Select a category from the left panel and pick a service to view plans, pricing, and details.</p>
            </div>
          ) : (<>
          {/* Plans — shown FIRST so user sees pricing immediately */}
          <div className="sv2-plans-header">
            <h3>Choose Your Plan</h3>
            <span className="sv2-plans-note">All plans include onboarding support & monthly reporting</span>
          </div>

          <div className="sv2-plans-grid">
            {selectedSvc.plans.map((plan, i) => (
              <PlanCard
                key={i}
                plan={plan}
                svcTitle={selectedSvc.title}
                onConsult={openConsult}
                onBuy={handleBuyNow}
                canBuy={canBuy}
              />
            ))}
          </div>

          {/* Service hero image — below plans */}
          <div className="sv2-panel-img-wrap" style={{ marginTop: 32 }}>
            <img key={selectedSvc.id} src={svcImage(selectedSvc, 'panel')} alt={selectedSvc.title} className="sv2-panel-img" />
            <div className="sv2-panel-img-overlay">
              <span className="sv2-panel-tag">{selectedSvc.tag}</span>
              <h2 className="sv2-panel-title">{selectedSvc.title}</h2>
              <p className="sv2-panel-desc">{selectedSvc.desc}</p>
            </div>
          </div>

          {/* CTA */}
          <div className="sv2-panel-cta">
            <div className="sv2-panel-cta-text">
              <h4>Not sure which plan fits?</h4>
              <p>Book a free 30-min strategy call — we'll recommend the right plan for your goals.</p>
            </div>
            <button className="btn btn-primary" onClick={() => openConsult()}>
              Book Free Consultation →
            </button>
          </div>
          </>)}
        </main>
      </div>

      <Footer />
      <ConsultationModal isOpen={consultOpen} onClose={() => setConsultOpen(false)} preSelectedService={preSelectedService} />
      <LeadPopup config={SERVICES_POPUP_CONFIG} />
      <ExitIntentPopup />
      <LeadCaptureBar />
      <Chatbot />

      {/* ── Demo Payment Modal ── */}
      {payModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }} onClick={() => !paying && setPayModal(null)} />
          <div style={{ position: 'relative', background: '#fff', borderRadius: 20, padding: '36px 32px', maxWidth: 440, width: '100%', boxShadow: '0 24px 80px rgba(0,0,0,0.18)', textAlign: 'center' }}>
            {/* Close */}
            {!paying && (
              <button onClick={() => setPayModal(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 20, lineHeight: 1 }}>✕</button>
            )}

            {/* Icon */}
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #00B4CC22, #00CC8822)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00B4CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            </div>

            <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: '#111' }}>Confirm Your Order</h2>
            <p style={{ margin: '0 0 24px', color: '#666', fontSize: 14 }}>You're about to activate the following plan</p>

            {/* Order summary */}
            <div style={{ background: '#f8fffe', border: '1.5px solid #00B4CC33', borderRadius: 12, padding: '16px 20px', marginBottom: 24, textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 700, color: '#111', fontSize: 15 }}>{payModal.service}</span>
                <span style={{ background: '#00B4CC', color: '#fff', borderRadius: 6, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>{payModal.planName} Plan</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#555', fontSize: 13 }}>Monthly amount</span>
                <span style={{ fontWeight: 800, fontSize: 20, color: '#00B4CC' }}>₹{payModal.price.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Info */}
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '8px 14px', marginBottom: 24, fontSize: 12, color: '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Secure payment via PayU · 256-bit SSL encryption
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setPayModal(null)}
                disabled={paying}
                style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: '1.5px solid #ddd', background: '#fff', color: '#555', fontWeight: 600, cursor: paying ? 'not-allowed' : 'pointer', fontSize: 14 }}
              >
                Cancel
              </button>
              <button
                onClick={handleProceedToPayment}
                disabled={paying}
                style={{ flex: 2, padding: '12px 0', borderRadius: 10, border: 'none', background: paying ? '#99d9e5' : 'linear-gradient(135deg, #00B4CC, #00CC88)', color: '#fff', fontWeight: 700, cursor: paying ? 'not-allowed' : 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {paying ? (
                  <>
                    <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                    Processing…
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                    Pay ₹{payModal.price.toLocaleString('en-IN')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
