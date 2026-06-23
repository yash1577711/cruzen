require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Service = require('./models/Service');
const Blog = require('./models/Blog');
const connectDB = require('./config/db');

const SERVICES = [
  // E-Commerce
  {
    title: 'Amazon Domestic Management', slug: 'amazon-domestic-management',
    description: 'End-to-end seller account management, item listing, A+ content designs, and keyword-bidded PPC advertisement campaigns for Amazon India.',
    shortDesc: 'Full Amazon seller account management with PPC & A+ content.',
    icon: 'fab fa-amazon', category: 'e-commerce', startingPrice: 3855, order: 1,
    searchKeywords: ['amazon', 'seller', 'marketplace', 'ppc', 'a+ content', 'listing'],
    plans: [
      { name: 'Starter', price: 3855, duration: '1 month', features: ['Account Setup', '25 Product Listings', 'Basic PPC'] },
      { name: 'Growth', price: 7999, duration: '1 month', isPopular: true, features: ['100 Product Listings', 'A+ Content (10)', 'PPC Management', 'Monthly Reports'] },
      { name: 'Premium', price: 14999, duration: '1 month', features: ['Unlimited Listings', 'A+ Content', 'Full PPC', 'Brand Store', 'Priority Support'] },
    ],
  },
  {
    title: 'Flipkart Seller Management', slug: 'flipkart-seller-management',
    description: 'Full seller catalog optimization, returns claims management, organic search indexing, and promotional advertising campaigns on Flipkart.',
    shortDesc: 'Complete Flipkart seller account management & growth.',
    icon: 'fas fa-shopping-bag', category: 'e-commerce', startingPrice: 3588, order: 2,
    searchKeywords: ['flipkart', 'seller', 'catalog', 'returns', 'ads'],
    plans: [
      { name: 'Starter', price: 3588, duration: '1 month', features: ['Account Setup', '20 Listings', 'Basic Ads'] },
      { name: 'Growth', price: 7499, duration: '1 month', isPopular: true, features: ['75 Listings', 'Returns Management', 'Promoted Listings'] },
      { name: 'Premium', price: 12999, duration: '1 month', features: ['Unlimited Listings', 'Full Catalog', 'Premium Ads', 'Analytics'] },
    ],
  },
  {
    title: 'Myntra Seller Management', slug: 'myntra-seller-management',
    description: 'Scale your fashion brand listing, cataloging, apparel category approvals, pricing calculations, and Myntra PPC campaign management.',
    shortDesc: 'Fashion-first Myntra seller growth management.',
    icon: 'fas fa-tshirt', category: 'e-commerce', startingPrice: 5931, order: 3,
    searchKeywords: ['myntra', 'fashion', 'apparel', 'seller', 'listings'],
    plans: [
      { name: 'Starter', price: 5931, duration: '1 month', features: ['Account Setup', '30 Listings', 'Category Approval'] },
      { name: 'Growth', price: 10999, duration: '1 month', isPopular: true, features: ['100 Listings', 'Photoshoot Guide', 'PPC Ads'] },
      { name: 'Premium', price: 18999, duration: '1 month', features: ['Unlimited Listings', 'Full Catalog', 'Priority Ads', 'Strategy Call'] },
    ],
  },
  {
    title: 'Meesho Seller Management', slug: 'meesho-seller-management',
    description: 'Complete Meesho seller account setup, product catalog management, bulk listing uploads, pricing strategy, and ad campaign management.',
    shortDesc: 'Meesho seller account growth & catalog management.',
    icon: 'fas fa-store', category: 'e-commerce', startingPrice: 2999, order: 4,
    searchKeywords: ['meesho', 'seller', 'reseller', 'catalog'],
    plans: [
      { name: 'Starter', price: 2999, duration: '1 month', features: ['Account Setup', '50 Listings', 'Basic Ads'] },
      { name: 'Growth', price: 5999, duration: '1 month', isPopular: true, features: ['200 Listings', 'Pricing Strategy', 'Promoted Ads'] },
    ],
  },
  {
    title: 'Nykaa Seller Management', slug: 'nykaa-seller-management',
    description: 'Beauty & personal care brand onboarding, product listing, A+ content creation, and Nykaa advertising campaigns for maximum visibility.',
    shortDesc: 'Beauty brand growth on Nykaa marketplace.',
    icon: 'fas fa-spa', category: 'e-commerce', startingPrice: 6999, order: 5,
    searchKeywords: ['nykaa', 'beauty', 'cosmetics', 'skincare', 'seller'],
    plans: [
      { name: 'Starter', price: 6999, duration: '1 month', features: ['Brand Onboarding', '20 SKUs', 'Basic Ads'] },
      { name: 'Growth', price: 12999, duration: '1 month', isPopular: true, features: ['50 SKUs', 'Rich Content', 'Nykaa Ads'] },
    ],
  },
  {
    title: 'Marketplace Branding', slug: 'marketplace-branding',
    description: 'Professional brand storefront setup on Amazon, Flipkart & Myntra. Brand registry assistance, brand A+ content, and brand story creation.',
    shortDesc: 'Multi-marketplace brand store setup & branding.',
    icon: 'fas fa-certificate', category: 'e-commerce', startingPrice: 8999, order: 6,
    searchKeywords: ['branding', 'brand store', 'brand registry', 'amazon brand'],
    plans: [
      { name: 'Basic', price: 8999, duration: 'One-time', features: ['Brand Store (1 Platform)', 'Logo & Banner', 'Brand Story'] },
      { name: 'Premium', price: 16999, duration: 'One-time', isPopular: true, features: ['Brand Store (3 Platforms)', 'A+ Content (5 pages)', 'Brand Registry', 'Social Kit'] },
    ],
  },
  // Marketing
  {
    title: 'Search Engine Optimization', slug: 'search-engine-optimization',
    description: 'On-page optimization, quality schema markup tags, keywords research, technical index audits, and backlink networks to rank #1 on Google.',
    shortDesc: 'Comprehensive SEO to rank #1 on Google.',
    icon: 'fas fa-search-dollar', category: 'marketing', startingPrice: 7999, order: 7,
    searchKeywords: ['seo', 'search engine', 'google ranking', 'keywords', 'backlinks', 'organic traffic'],
    plans: [
      { name: 'Starter', price: 7999, duration: '3 months', features: ['10 Keywords', 'On-Page SEO', 'Monthly Report'] },
      { name: 'Growth', price: 14999, duration: '3 months', isPopular: true, features: ['25 Keywords', 'Technical SEO', 'Link Building', 'Schema Markup'] },
      { name: 'Enterprise', price: 24999, duration: '3 months', features: ['50+ Keywords', 'Full Technical SEO', 'PR Backlinks', 'Competitor Analysis'] },
    ],
  },
  {
    title: 'Social Media Marketing', slug: 'social-media-marketing',
    description: 'Boost presence on Facebook, Instagram & LinkedIn. Graphic designs, copywriting content calendar, and pixel-tracked campaigns.',
    shortDesc: 'Strategic social media growth & engagement.',
    icon: 'fas fa-share-alt', category: 'marketing', startingPrice: 5999, order: 8,
    searchKeywords: ['social media', 'instagram', 'facebook', 'linkedin', 'smm', 'content'],
    plans: [
      { name: 'Starter', price: 5999, duration: '1 month', features: ['3 Platforms', '12 Posts/Month', 'Basic Ads'] },
      { name: 'Growth', price: 10999, duration: '1 month', isPopular: true, features: ['4 Platforms', '20 Posts/Month', 'Reels', 'Pixel Tracking'] },
      { name: 'Premium', price: 17999, duration: '1 month', features: ['All Platforms', '30 Posts', 'Influencer Collab', 'Strategy Call'] },
    ],
  },
  {
    title: 'Google Ads Management', slug: 'google-ads-management',
    description: 'Search, Display, and Performance Max campaign setups. Bid optimizations, custom ad copies, and pixel conversion tracking.',
    shortDesc: 'ROI-focused Google Ads campaign management.',
    icon: 'fab fa-google', category: 'marketing', startingPrice: 9000, order: 9,
    searchKeywords: ['google ads', 'ppc', 'search ads', 'display ads', 'performance max'],
    plans: [
      { name: 'Starter', price: 9000, duration: '1 month', features: ['Search Campaigns', 'Keyword Research', 'Monthly Report'] },
      { name: 'Growth', price: 16999, duration: '1 month', isPopular: true, features: ['Search + Display', 'A/B Testing', 'Conversion Tracking', 'Remarketing'] },
      { name: 'Enterprise', price: 27999, duration: '1 month', features: ['All Campaign Types', 'Performance Max', 'Full Funnel', 'Weekly Reports'] },
    ],
  },
  {
    title: 'Influencer Marketing', slug: 'influencer-marketing',
    description: 'Connect with nano to mega influencers in your niche. Campaign strategy, content briefs, performance tracking, and ROI measurement.',
    shortDesc: 'Influencer campaigns that drive real results.',
    icon: 'fas fa-users', category: 'marketing', startingPrice: 12999, order: 10,
    searchKeywords: ['influencer', 'instagram influencer', 'youtube', 'ugc', 'brand collaboration'],
    plans: [
      { name: 'Micro', price: 12999, duration: '1 campaign', features: ['5 Micro Influencers', 'Content Brief', 'Performance Report'] },
      { name: 'Growth', price: 24999, duration: '1 campaign', isPopular: true, features: ['10 Influencers', 'Dedicated Manager', 'UGC Content', 'Analytics'] },
    ],
  },
  {
    title: '360° Marketing Plans', slug: '360-marketing-plans',
    description: 'Complete 360-degree marketing covering SEO, social media, Google Ads, marketplace management, and content strategy under one roof.',
    shortDesc: 'All-in-one marketing strategy for maximum growth.',
    icon: 'fas fa-bullseye', category: 'marketing', startingPrice: 24999, order: 11,
    searchKeywords: ['360 marketing', 'full service', 'complete marketing', 'all-in-one'],
    plans: [
      { name: 'Starter 360', price: 24999, duration: '3 months', features: ['SEO + SMM + Google Ads', 'Monthly Strategy', 'Dedicated Account Manager'] },
      { name: 'Growth 360', price: 44999, duration: '3 months', isPopular: true, features: ['All Marketing Channels', 'Influencer Outreach', 'Performance Dashboard', 'Bi-weekly Calls'] },
    ],
  },
  {
    title: 'Email Marketing', slug: 'email-marketing',
    description: 'Targeted email campaigns, drip sequences, newsletter management, segmentation, and detailed campaign analytics for higher conversions.',
    shortDesc: 'High-converting email marketing campaigns.',
    icon: 'fas fa-envelope-open-text', category: 'marketing', startingPrice: 4999, order: 12,
    searchKeywords: ['email marketing', 'newsletter', 'drip campaign', 'email automation'],
    plans: [
      { name: 'Starter', price: 4999, duration: '1 month', features: ['4 Campaigns', 'Template Design', 'List Management'] },
      { name: 'Growth', price: 9999, duration: '1 month', isPopular: true, features: ['8 Campaigns', 'Automation Flows', 'Segmentation', 'A/B Testing'] },
    ],
  },
  // Design & Development
  {
    title: 'Shopify Setup & Development', slug: 'shopify-development',
    description: 'Custom Shopify e-commerce designs, theme setups, checkout APIs integration, tax setups, and sales-boosting app extensions.',
    shortDesc: 'Complete Shopify store setup & custom development.',
    icon: 'fab fa-shopify', category: 'design-development', startingPrice: 15000, order: 13,
    searchKeywords: ['shopify', 'ecommerce website', 'online store', 'shopify development'],
    plans: [
      { name: 'Starter', price: 15000, duration: 'One-time', features: ['Theme Customization', 'Up to 20 Products', 'Payment Setup', '1 Month Support'] },
      { name: 'Pro', price: 28000, duration: 'One-time', isPopular: true, features: ['Custom Theme', 'Unlimited Products', 'App Integration', 'SEO Setup', '3 Month Support'] },
      { name: 'Enterprise', price: 55000, duration: 'One-time', features: ['Bespoke Design', 'Custom Apps', 'Multi-currency', 'Performance Optimization'] },
    ],
  },
  {
    title: 'Android & iOS App Development', slug: 'mobile-app-development',
    description: 'Custom mobile applications built with Flutter or React Native. Responsive UI layouts, push notifications, and web admin panels.',
    shortDesc: 'Cross-platform mobile apps with Flutter/React Native.',
    icon: 'fas fa-mobile-alt', category: 'design-development', startingPrice: 45000, order: 14,
    searchKeywords: ['app development', 'mobile app', 'android', 'ios', 'flutter', 'react native'],
    plans: [
      { name: 'Basic App', price: 45000, duration: '2-3 months', features: ['5-7 Screens', 'Flutter/RN', 'API Integration', 'Play Store Publish'] },
      { name: 'Advanced App', price: 85000, duration: '3-4 months', isPopular: true, features: ['15+ Screens', 'Admin Panel', 'Push Notifications', 'Both Stores', '6 Month Support'] },
    ],
  },
  {
    title: 'Website UI/UX Design', slug: 'website-uiux-design',
    description: 'Custom modern mockups, Figma responsive layouts, landing page assets export, clickable interactive user-flow prototypes.',
    shortDesc: 'Premium UI/UX design with Figma & interactive prototypes.',
    icon: 'fas fa-palette', category: 'design-development', startingPrice: 6999, order: 15,
    searchKeywords: ['ui ux design', 'figma', 'web design', 'prototype', 'mockup', 'landing page'],
    plans: [
      { name: 'Landing Page', price: 6999, duration: 'One-time', features: ['1-page Figma Design', 'Mobile Responsive', 'HTML Export'] },
      { name: 'Website Design', price: 14999, duration: 'One-time', isPopular: true, features: ['Up to 8 Pages', 'Design System', 'Interactive Prototype', 'Developer Handoff'] },
      { name: 'Full App Design', price: 24999, duration: 'One-time', features: ['15+ Screens', 'Brand Identity', 'Component Library', 'User Flow Diagrams'] },
    ],
  },
  {
    title: 'Graphic Design Services', slug: 'graphic-design',
    description: 'Professional logo design, brand identity kits, social media creatives, product packaging, and marketing collateral design.',
    shortDesc: 'Complete graphic design for brand identity & marketing.',
    icon: 'fas fa-paint-brush', category: 'design-development', startingPrice: 3999, order: 16,
    searchKeywords: ['graphic design', 'logo design', 'brand identity', 'packaging', 'creatives'],
    plans: [
      { name: 'Logo Pack', price: 3999, duration: 'One-time', features: ['3 Logo Concepts', 'Brand Colors', 'All Formats'] },
      { name: 'Brand Kit', price: 9999, duration: 'One-time', isPopular: true, features: ['Logo + Brand Identity', '10 Social Templates', 'Business Card', 'Brand Guide'] },
    ],
  },
  {
    title: 'WordPress Development', slug: 'wordpress-development',
    description: 'Custom WordPress websites with premium themes, WooCommerce setup, plugin customization, SEO-ready structure and security hardening.',
    shortDesc: 'Custom WordPress sites with WooCommerce & SEO.',
    icon: 'fab fa-wordpress', category: 'design-development', startingPrice: 12000, order: 17,
    searchKeywords: ['wordpress', 'woocommerce', 'cms', 'blog', 'website'],
    plans: [
      { name: 'Business Site', price: 12000, duration: 'One-time', features: ['5 Pages', 'Contact Form', 'SEO Setup', '2 Month Support'] },
      { name: 'E-Commerce', price: 22000, duration: 'One-time', isPopular: true, features: ['WooCommerce', 'Payment Gateway', 'Product Catalog', 'Inventory Management'] },
    ],
  },
  {
    title: 'Amazon Global Selling', slug: 'amazon-global-selling',
    description: 'Expand to US, UK, UAE, and Canada Amazon markets. Cross-border listing, currency optimization, FBA setup, and international PPC.',
    shortDesc: 'International Amazon expansion & cross-border selling.',
    icon: 'fas fa-globe', category: 'e-commerce', startingPrice: 19999, order: 18,
    searchKeywords: ['amazon global', 'international selling', 'amazon us', 'fba', 'cross border'],
    plans: [
      { name: 'Single Market', price: 19999, duration: '3 months', features: ['1 Marketplace (US/UK/UAE)', 'FBA Setup', '30 Listings', 'International PPC'] },
      { name: 'Multi-Market', price: 34999, duration: '3 months', isPopular: true, features: ['3 Marketplaces', 'Full FBA', 'Currency Strategy', 'International PPC'] },
    ],
  },
  {
    title: 'Content Marketing', slug: 'content-marketing',
    description: 'Blog writing, video scripts, product descriptions, case studies, and content calendars to position your brand as an industry authority.',
    shortDesc: 'Strategic content creation for brand authority.',
    icon: 'fas fa-pen-fancy', category: 'marketing', startingPrice: 5499, order: 19,
    searchKeywords: ['content marketing', 'blog writing', 'content creation', 'copywriting'],
    plans: [
      { name: 'Blog Pack', price: 5499, duration: '1 month', features: ['4 Blog Articles', 'SEO Optimized', 'Meta Descriptions'] },
      { name: 'Full Content', price: 11999, duration: '1 month', isPopular: true, features: ['8 Blogs', '30 Social Captions', '2 Video Scripts', 'Email Newsletter'] },
    ],
  },
  {
    title: 'Video Production & Editing', slug: 'video-production',
    description: 'Product videos, brand films, Instagram reels, YouTube content, and ad creatives that drive conversions and brand recall.',
    shortDesc: 'Professional video production for brands & ads.',
    icon: 'fas fa-video', category: 'design-development', startingPrice: 8999, order: 20,
    searchKeywords: ['video production', 'reels', 'product video', 'youtube', 'ad creative'],
    plans: [
      { name: 'Basic', price: 8999, duration: 'Per Project', features: ['1 Product Video (60s)', 'Script', '2 Revisions'] },
      { name: 'Growth', price: 17999, duration: 'Per Month', isPopular: true, features: ['4 Videos', '8 Reels', 'Ad Creatives', 'Voice Over'] },
    ],
  },
];

const BLOGS = [
  {
    title: 'How to Rank #1 on Amazon Search: The Ultimate 2026 Playbook',
    slug: 'rank-1-amazon-search-2026',
    excerpt: 'Discover advanced keyword indexation tactics, CTR enhancement calculations, and PPC campaign optimization structures to rank your catalog ahead of competitors.',
    content: '<h2>Introduction</h2><p>Amazon search ranking is the single most important factor determining product visibility and sales on the platform...</p>',
    category: 'marketplace', icon: 'fas fa-store', readTime: '6 min read',
    tags: ['Amazon', 'SEO', 'PPC', 'Marketplace'],
    publishedAt: new Date('2026-06-18'),
  },
  {
    title: '5 Crucial E-Commerce Conversion Strategies That Double Sales',
    slug: 'ecommerce-conversion-strategies-2026',
    excerpt: 'We break down layout grid formulas, cart friction indicators, and checkout micro-interactions that boosted client conversion rates from 1.8% to over 3.8%.',
    content: '<h2>Why Conversion Rate Matters</h2><p>A 1% improvement in conversion rate can mean doubling your revenue without adding more traffic...</p>',
    category: 'design', icon: 'fas fa-laptop-code', readTime: '8 min read',
    tags: ['Conversion', 'UX', 'E-Commerce', 'Design'],
    publishedAt: new Date('2026-06-12'),
  },
  {
    title: 'Why Schema Markup is the Secret to E-Commerce SEO Success',
    slug: 'schema-markup-ecommerce-seo',
    excerpt: 'Learn how rich product snippets, aggregate rating review tags, and price indicators in search results natively boost organic CTR and click volumes.',
    content: '<h2>What is Schema Markup?</h2><p>Schema markup is a code that you put on your website to help search engines return more informative results for users...</p>',
    category: 'marketing', icon: 'fas fa-bullhorn', readTime: '5 min read',
    tags: ['SEO', 'Schema', 'Organic Traffic'],
    publishedAt: new Date('2026-06-05'),
  },
  {
    title: 'Flipkart vs Amazon: Which Platform is Better for Indian Sellers in 2026?',
    slug: 'flipkart-vs-amazon-indian-sellers-2026',
    excerpt: 'A comprehensive comparison of fees, traffic, seller support, and category performance to help you decide which marketplace suits your brand.',
    category: 'marketplace', icon: 'fas fa-balance-scale', readTime: '7 min read',
    excerpt: 'Deep dive into fees, audience demographics, and category-wise performance to pick the right marketplace for your brand in 2026.',
    content: '<h2>The Indian Marketplace Duopoly</h2><p>Amazon and Flipkart collectively control over 80% of India\'s e-commerce market...</p>',
    tags: ['Flipkart', 'Amazon', 'India', 'Marketplace'],
    publishedAt: new Date('2026-05-28'),
  },
  {
    title: 'Instagram Marketing in 2026: Reels, Stories & Paid Ads That Convert',
    slug: 'instagram-marketing-2026-guide',
    excerpt: 'Master the Instagram algorithm with Reels strategy, Story engagement tactics, and Meta Ads targeting that drive real sales for e-commerce brands.',
    content: '<h2>Instagram in 2026</h2><p>With over 500 million daily active users in India alone, Instagram remains the most powerful social commerce platform...</p>',
    category: 'marketing', icon: 'fab fa-instagram', readTime: '6 min read',
    tags: ['Instagram', 'Social Media', 'Reels', 'Meta Ads'],
    publishedAt: new Date('2026-05-20'),
  },
  {
    title: 'Shopify vs WooCommerce: Best Platform for Indian D2C Brands in 2026',
    slug: 'shopify-vs-woocommerce-india-2026',
    excerpt: 'We compare costs, features, payment gateways, and scalability to help Indian direct-to-consumer brands choose the right e-commerce platform.',
    content: '<h2>The D2C Platform Decision</h2><p>Choosing the right e-commerce platform is foundational to your brand\'s digital success...</p>',
    category: 'design', icon: 'fab fa-shopify', readTime: '9 min read',
    tags: ['Shopify', 'WooCommerce', 'D2C', 'E-Commerce Platform'],
    publishedAt: new Date('2026-05-10'),
  },
];

async function seed() {
  await connectDB();
  console.log('Connected to MongoDB. Starting seed...');

  // Admin user
  const existingAdmin = await User.findOne({ email: process.env.ADMIN_EMAIL });
  if (!existingAdmin) {
    await User.create({
      name: 'Cruzen Admin',
      email: process.env.ADMIN_EMAIL || 'admin@cruzendigital.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@Cruzen2026!',
      role: 'admin',
      isActive: true,
      isEmailVerified: true,
    });
    console.log('Admin user created.');
  }

  // Services
  await Service.deleteMany({});
  await Service.insertMany(SERVICES);
  console.log(`${SERVICES.length} services seeded.`);

  // Blogs
  await Blog.deleteMany({});
  await Blog.insertMany(BLOGS);
  console.log(`${BLOGS.length} blogs seeded.`);

  console.log('Seed complete!');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
