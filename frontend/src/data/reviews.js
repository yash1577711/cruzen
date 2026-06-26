/* Service-specific testimonial data. Plans: Basic / Standard / Premium */

const MARKETPLACE = [
  { name: 'Rahul Sharma',   role: 'Founder, KitchenCraft India',  plan: 'Standard', rating: 5, text: 'Our Amazon ROAS jumped from 2.1× to 7.4× in 3 months. The team knows exactly which keywords convert.' },
  { name: 'Priya Mehta',    role: 'E-commerce Director, StyleVibe', plan: 'Premium',  rating: 5, text: 'Flipkart visibility went from page 3 to top 5 in our category. Listing optimization is genuinely impressive.' },
  { name: 'Arjun Gupta',    role: 'CEO, NutriFirst',              plan: 'Standard', rating: 5, text: 'Monthly reports are clear and actionable. Scaled from ₹2L to ₹9L monthly revenue without changing our product.' },
  { name: 'Sneha Patel',    role: 'Co-Founder, HomeEssentials',   plan: 'Basic',    rating: 4, text: 'Even on Basic we got detailed audits. Sales up 60% in 6 months — very happy with the ROI.' },
  { name: 'Vikram Singh',   role: 'Marketplace Mgr, FreshBrand',  plan: 'Premium',  rating: 5, text: 'Managing 3 marketplaces was a headache. Cruzen handles ads, listings, returns — everything.' },
  { name: 'Anika Joshi',    role: 'Brand Head, PureCraft',        plan: 'Standard', rating: 5, text: 'The account manager actually understands our product. Not generic advice — they studied our category deeply.' },
  { name: 'Rohan Das',      role: 'Owner, TechGadgetsIndia',      plan: 'Basic',    rating: 4, text: 'Competitor analysis alone saved us thousands in wasted ad spend. Best decision for our small brand.' },
  { name: 'Kavya Nair',     role: 'Director, OrganicLiving',      plan: 'Premium',  rating: 5, text: '400% increase in organic rank for our hero SKU within 8 weeks. Fast, transparent, excellent.' },
  { name: 'Sanjay Rao',     role: 'CEO, BabyGear India',          plan: 'Standard', rating: 5, text: 'Meesho and Ajio accounts were dormant. In 60 days both were generating consistent daily orders.' },
  { name: 'Deepika Iyer',   role: 'Founder, HandmadeHub',         plan: 'Basic',    rating: 5, text: 'As a solo founder, Basic plan gave me enterprise-level support. Etsy store revenue tripled in 4 months.' },
];

const DIGITAL = [
  { name: 'Manish Oberoi',  role: 'Founder, GrowthLabs',         plan: 'Premium',  rating: 5, text: 'Meta Ads ROAS went from 1.8× to 6.2×. The creative strategy they brought was something our team was missing.' },
  { name: 'Divya Kapoor',   role: 'Marketing Head, FashionFwd',  plan: 'Standard', rating: 5, text: 'Google Ads CPA dropped 55% in 2 months. Their keyword structure is different from every other agency.' },
  { name: 'Suresh Nambiar', role: 'CEO, CloudSoft',              plan: 'Standard', rating: 5, text: 'SEO traffic up 280% in 6 months. They don\'t use shortcuts — every backlink is from a real domain.' },
  { name: 'Pooja Bhat',     role: 'E-com Manager, BeautyBliss',  plan: 'Premium',  rating: 5, text: 'Instagram grew from 2K to 28K organically. Engagement is the highest in our niche now.' },
  { name: 'Nikhil Verma',   role: 'Startup Founder, EdTech Hub', plan: 'Basic',    rating: 4, text: 'On a startup budget, Basic plan gave us Google visibility and lead quality improved fast.' },
  { name: 'Layla Seth',     role: 'CMO, Healthify Foods',        plan: 'Premium',  rating: 5, text: '360° strategy across Google, Meta, SEO. Results compound — month 4 we hit 10× what we started with.' },
  { name: 'Ajay Tiwari',    role: 'Brand Manager, AutoParts Pro', plan: 'Standard', rating: 5, text: 'Lead cost down from ₹480 to ₹110. Targeting is surgical — they test, learn, optimise every week.' },
  { name: 'Meera Krishnan', role: 'Founder, YogaStudio Online',  plan: 'Basic',    rating: 5, text: 'The monthly strategy call alone changed how we think about our online presence. Totally worth it.' },
  { name: 'Rajeev Menon',   role: 'Director, FinServe Ads',      plan: 'Premium',  rating: 5, text: 'Compliance-safe ads for a regulated industry — they handled it perfectly. Conversions up 3× in 90 days.' },
  { name: 'Shweta Gupta',   role: 'Co-Founder, LocalBizNetwork', plan: 'Standard', rating: 5, text: 'Google Business profile optimized, local SEO done right. Phone calls from Google up 180% in 6 weeks.' },
];

const WEBSITE = [
  { name: 'Sameer Alvi',    role: 'Founder, LuxuryStays',        plan: 'Premium',  rating: 5, text: 'The site converts at 4.2%. Industry average is 1.8%. Design is stunning and load time is under 2 seconds.' },
  { name: 'Ritu Agarwal',   role: 'Co-Founder, BridalBoutique',  plan: 'Standard', rating: 5, text: 'Complete redesign in 3 weeks. Mobile conversions doubled immediately. UX research was thorough.' },
  { name: 'Pratap Reddy',   role: 'CEO, TechStartup IO',         plan: 'Premium',  rating: 5, text: 'Landing page to checkout — everything optimised for conversion. Bounce rate dropped from 74% to 31%.' },
  { name: 'Ananya Singh',   role: 'Marketing Mgr, RetailChain',  plan: 'Standard', rating: 4, text: 'On time, on budget, better than expected. Weekly updates and responsive to every feedback round.' },
  { name: 'Rohit Bajaj',    role: 'Founder, FoodDeliveryApp',    plan: 'Basic',    rating: 5, text: 'High-converting landing page on Basic plan. Leads 3× better quality than what social was giving us.' },
  { name: 'Simran Kaur',    role: 'Brand Director, SkinLux',     plan: 'Premium',  rating: 5, text: 'Speed, SEO, design, analytics — everything delivered at a high standard. Premium plan is worth every rupee.' },
  { name: 'Tarun Bose',     role: 'CTO, SaaSProduct India',      plan: 'Premium',  rating: 5, text: 'Built our entire product marketing site with conversion funnels. Pipeline from organic grew 5× in Q1.' },
  { name: 'Nalini Rao',     role: 'Founder, AyurvedaStore',      plan: 'Standard', rating: 5, text: 'Beautiful e-commerce site with fast checkout. Customer complaints about the old site went to zero instantly.' },
];

const MANAGEMENT = [
  { name: 'Deepak Malhotra', role: 'Founder, D2C Ventures',      plan: 'Premium',  rating: 5, text: 'Full 360 management means I focus on product. Revenue grew 3× in 8 months without touching a single ad account.' },
  { name: 'Roshni Sharma',   role: 'CEO, GourmetSnacks',         plan: 'Standard', rating: 5, text: 'They manage our Amazon, Flipkart, SEO and Google Ads. Single point of contact, no confusion.' },
  { name: 'Karthik Pillai',  role: 'Director, TechRetail',       plan: 'Premium',  rating: 5, text: 'Monthly performance review is incredibly detailed. Every channel, every KPI, clear next actions. 5 stars.' },
  { name: 'Anjali Mehrotra', role: 'Co-Founder, ModernKitchen',  plan: 'Standard', rating: 4, text: 'Managing in-house was burning us out. Cruzen took over and scaled results. Highly recommend.' },
  { name: 'Vivek Jain',      role: 'MD, RetailGroupIndia',       plan: 'Premium',  rating: 5, text: 'Multi-city retail brand scaled online. They managed 4 channels simultaneously, zero overlap or conflict.' },
  { name: 'Priya Sood',      role: 'Founder, WellnessByDesign',  plan: 'Standard', rating: 5, text: 'Finally a team that reports on real metrics, not vanity ones. Revenue per channel improved across the board.' },
];

const ALL = [...MARKETPLACE, ...DIGITAL, ...WEBSITE, ...MANAGEMENT];

export function getServiceReviews(cat) {
  if (!cat) return ALL;
  const l = (cat.label || '').toLowerCase();
  if (l.includes('marketplace')) return MARKETPLACE;
  if (l.includes('digital') || l.includes('social') || l.includes('marketing') || l.includes('seo') || l.includes('ads') || l.includes('email') || l.includes('whatsapp') || l.includes('influencer')) return DIGITAL;
  if (l.includes('website') || l.includes('web') || l.includes('design') || l.includes('development')) return WEBSITE;
  if (l.includes('360') || l.includes('management') || l.includes('automation') || l.includes('crm')) return MANAGEMENT;
  return ALL;
}
