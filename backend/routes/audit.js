const router = require('express').Router();
const AuditReport = require('../models/AuditReport');
const { protect } = require('../middleware/auth');
const crypto = require('crypto');

// Check free audit availability
router.get('/check', protect, async (req, res) => {
  try {
    const usedFree = await AuditReport.findOne({ user: req.user._id, isFreeAudit: true });
    res.json({ success: true, freeAuditUsed: !!usedFree });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Generate audit report
router.post('/generate', protect, async (req, res) => {
  try {
    const { platform, inputUrl } = req.body;
    if (!platform || !inputUrl) return res.status(400).json({ success: false, message: 'Platform and URL required.' });

    const usedFree = await AuditReport.findOne({ user: req.user._id, isFreeAudit: true });
    const isFreeAudit = !usedFree;

    const viewToken = crypto.randomBytes(20).toString('hex');
    const report = generateMockReport(platform, inputUrl);

    const audit = await AuditReport.create({
      user: req.user._id,
      platform,
      inputUrl,
      isFreeAudit,
      isPaid: false,
      status: 'completed',
      email: req.user.email,
      viewToken,
      report: { ...report, generatedAt: new Date() },
    });

    // Return free audit with locked sections
    const responseReport = {
      ...audit.toObject(),
      report: {
        ...audit.report,
        sections: audit.report.sections.map((s, i) => ({
          ...s,
          issues: isFreeAudit && i > 1 ? [] : s.issues,
          locked: isFreeAudit && i > 1,
        })),
      },
    };

    res.status(201).json({ success: true, audit: responseReport, isFreeAudit, viewToken });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Get audit by token (for sharing / download)
router.get('/view/:token', async (req, res) => {
  try {
    const audit = await AuditReport.findOne({ viewToken: req.params.token });
    if (!audit) return res.status(404).json({ success: false, message: 'Report not found.' });
    if (!audit.isPaid && audit.isFreeAudit) {
      // Return partial
      const partial = { ...audit.toObject(), report: { ...audit.report, sections: audit.report.sections.map((s, i) => ({ ...s, issues: i > 1 ? [] : s.issues, locked: i > 1 })) } };
      return res.json({ success: true, audit: partial });
    }
    res.json({ success: true, audit });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// My audit history
router.get('/my', protect, async (req, res) => {
  try {
    const audits = await AuditReport.find({ user: req.user._id }).sort('-createdAt').select('-report.sections');
    res.json({ success: true, audits });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Verify payment and unlock full report
router.post('/unlock', protect, async (req, res) => {
  try {
    const { auditId, paymentId } = req.body;
    const audit = await AuditReport.findOne({ _id: auditId, user: req.user._id });
    if (!audit) return res.status(404).json({ success: false, message: 'Audit not found.' });
    audit.isPaid = true;
    audit.paymentId = paymentId;
    await audit.save();
    res.json({ success: true, audit });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Admin: all audits
router.get('/admin/all', protect, async (req, res) => {
  try {
    if (!['admin', 'sub-admin'].includes(req.user.role)) return res.status(403).json({ success: false, message: 'Forbidden.' });
    const audits = await AuditReport.find().populate('user', 'name email').sort('-createdAt').select('-report.sections');
    const total = audits.length;
    const paid = audits.filter(a => a.isPaid).length;
    const revenue = paid * 99;
    res.json({ success: true, audits, stats: { total, paid, revenue } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

function generateMockReport(platform, url) {
  const platformIssues = {
    instagram: [
      { title: 'Bio Optimization', sections: [
        { title: 'Profile & Bio', score: 62, issues: [
          { severity: 'high', title: 'Missing call-to-action in bio', description: 'Your bio does not contain a clear CTA directing visitors to your product or website.', recommendation: 'Add a direct CTA with a link (e.g. "Shop now 👇" with a linktree or direct link).' },
          { severity: 'medium', title: 'Incomplete business category', description: 'Profile is not correctly categorized as a Business account with the right industry.', recommendation: 'Switch to Professional Account > Creator/Business and set correct category.' },
          { severity: 'low', title: 'No highlights strategy', description: 'Story highlights are either missing or not strategically organized.', recommendation: 'Create at least 6 highlight categories: Products, Reviews, FAQs, About, Offers, and Process.' },
        ]},
        { title: 'Content Strategy', score: 55, issues: [
          { severity: 'high', title: 'Inconsistent posting frequency', description: 'Posts are irregular — this signals low algorithmic priority to Instagram.', recommendation: 'Post at least 4-5 times per week. Use a content calendar with a mix of Reels, carousels, and static posts.' },
          { severity: 'high', title: 'Low Reel engagement ratio', description: 'Reels are getting significantly fewer views vs followers, indicating poor hook strategy.', recommendation: 'First 3 seconds of every Reel must have a strong visual hook and text overlay.' },
          { severity: 'medium', title: 'No trending audio usage', description: 'Recent Reels use original audio only — missing out on discovery via trending tracks.', recommendation: 'Use Instagram\'s trending audio library for at least 50% of your Reels.' },
        ]},
        { title: 'Hashtag & SEO', score: 48, issues: [
          { severity: 'high', title: 'Overly broad hashtags', description: 'Using hashtags with 10M+ posts reduces your content visibility significantly.', recommendation: 'Use a mix: 30% niche hashtags (<50K posts), 50% mid-tier (50K-500K), 20% broad.' },
          { severity: 'medium', title: 'Instagram SEO keyword missing from username/name', description: 'Your account name and username don\'t contain searchable keywords.', recommendation: 'Add a keyword to your display name field (e.g. "Brand | Product Category").' },
        ]},
        { title: 'Engagement & Growth', score: 41, issues: [
          { severity: 'high', title: 'No story poll/question engagement', description: 'Stories rarely use interactive stickers (polls, questions, quizzes).', recommendation: 'Add at minimum 1 interactive element per story series to boost engagement signals.' },
          { severity: 'medium', title: 'Late comment responses', description: 'Comments from the first hour of posting are not being replied to — critical for reach.', recommendation: 'Set up notifications and respond to all comments within 60 minutes of posting.' },
        ]},
      ]},
    ],
    amazon: [
      { title: 'Amazon Listing Audit', sections: [
        { title: 'Title & Keywords', score: 58, issues: [
          { severity: 'high', title: 'Title missing primary keywords', description: 'The product title does not include the top-searched keywords for this category.', recommendation: 'Restructure title: Brand + Model + Primary Keyword + Key Feature + Size/Color/Pack.' },
          { severity: 'high', title: 'Backend keywords not optimized', description: 'Backend search terms contain duplicate keywords wasting character limit.', recommendation: 'Use all 250 bytes of backend keywords with unique, relevant search terms only.' },
          { severity: 'medium', title: 'Title character count below optimal', description: 'Title is under 150 characters — missing opportunity to include long-tail keywords.', recommendation: 'Expand to 150-200 characters with additional search-relevant modifiers.' },
        ]},
        { title: 'Images & A+ Content', score: 45, issues: [
          { severity: 'high', title: 'Main image compliance issues', description: 'Main image may contain text or props that violate Amazon\'s main image guidelines.', recommendation: 'Use pure white background (RGB 255,255,255) with product occupying 85%+ of frame.' },
          { severity: 'high', title: 'Missing lifestyle images', description: 'No contextual/lifestyle images showing the product in use.', recommendation: 'Add 2-3 lifestyle images showing real-life usage scenarios and target customer.' },
          { severity: 'medium', title: 'No A+ Content / EBC', description: 'Listing lacks A+ Content which typically increases conversion by 3-10%.', recommendation: 'Create Brand Story module + Comparison chart + Feature highlight modules.' },
        ]},
        { title: 'Bullet Points & Description', score: 52, issues: [
          { severity: 'high', title: 'Bullet points not benefit-focused', description: 'Bullets list features but don\'t translate to customer benefits or address objections.', recommendation: 'Restructure: Start each bullet with a BENEFIT in caps, then explain the feature.' },
          { severity: 'medium', title: 'Description missing emotional triggers', description: 'Product description is dry and technical — not persuasive for conversion.', recommendation: 'Add social proof cues, use-case scenarios, and a subtle urgency element.' },
        ]},
        { title: 'Pricing & Reviews', score: 39, issues: [
          { severity: 'high', title: 'Pricing above category average', description: 'Current pricing is 18% above category median without clear value differentiation.', recommendation: 'Either reduce price to be competitive or add visible value (bundle, extended warranty).' },
          { severity: 'high', title: 'Review count below category threshold', description: 'Less than 25 reviews — Amazon\'s algorithm deprioritizes listings below this threshold.', recommendation: 'Launch an Vine program and use follow-up email campaigns to generate early reviews.' },
        ]},
      ]},
    ],
    facebook: [
      { title: 'Facebook Page Audit', sections: [
        { title: 'Page Setup & Completeness', score: 56, issues: [
          { severity: 'high', title: 'Page category not optimized', description: 'Your Facebook page is not categorized correctly, reducing discoverability in local and interest-based searches.', recommendation: 'Go to Page Settings > Page Info and select the most specific category for your business (e.g. "Digital Marketing Agency").' },
          { severity: 'high', title: 'Missing page description and services', description: 'The About section and Services tab are either empty or lack key information.', recommendation: 'Write a 200-character keyword-rich description, list all services, add business hours, website, and location.' },
          { severity: 'medium', title: 'CTA button not configured', description: 'The page CTA button (under the cover photo) is set to the default or points to no destination.', recommendation: 'Set the CTA button to "Send Message", "Book Now", or "Contact Us" matching your primary conversion goal.' },
          { severity: 'low', title: 'Cover photo not updated', description: 'Cover photo appears outdated or is missing promotional/seasonal content.', recommendation: 'Update cover photo seasonally with an offer or brand visual — ideal size: 820×312px.' },
        ]},
        { title: 'Content & Posting Strategy', score: 49, issues: [
          { severity: 'high', title: 'Low organic reach due to posting frequency', description: 'Pages posting less than 3 times per week see a 40-60% reduction in average organic reach.', recommendation: 'Maintain 5-7 posts per week: mix of video, image, link, and text posts to signal activity to the algorithm.' },
          { severity: 'high', title: 'No Facebook Reels / short video content', description: 'Reels receive 3× the organic reach of regular video posts on Facebook in 2024-25.', recommendation: 'Publish at least 2 Reels per week — repurpose Instagram Reels or create native vertical videos.' },
          { severity: 'medium', title: 'Posts lack engagement prompts', description: 'Content does not ask questions, use polls, or encourage tagging — leading to low comment rates.', recommendation: 'End every post with a question or reaction prompt (e.g. "Which do you prefer? React with ❤️ or 😮").' },
          { severity: 'medium', title: 'Inconsistent brand visuals', description: 'Post graphics use varying fonts, colors, and styles — reducing brand recognition.', recommendation: 'Create 3-4 branded post templates in Canva or Adobe Express and stick to them across all content.' },
        ]},
        { title: 'Ads & Pixel Setup', score: 38, issues: [
          { severity: 'high', title: 'Facebook Pixel not installed or misconfigured', description: 'Without the Pixel, you cannot retarget website visitors or build lookalike audiences — losing 60-70% of ad efficiency.', recommendation: 'Install the Meta Pixel on all website pages via Meta Business Manager > Events Manager.' },
          { severity: 'high', title: 'No custom audiences created', description: 'Ad account has no saved audiences built from past visitors, video viewers, or page engagers.', recommendation: 'Create audiences: Website Visitors (30/60/90 days), Video Viewers (75%+), and Page Engagers.' },
          { severity: 'medium', title: 'Ad creative not A/B tested', description: 'Running single ad creatives without testing variants wastes budget on underperforming formats.', recommendation: 'Run A/B tests with at least 3 headline variants and 2 visual variants per campaign.' },
        ]},
        { title: 'Community & Reviews', score: 61, issues: [
          { severity: 'high', title: 'Low page review count', description: 'Fewer than 20 Facebook reviews significantly reduces trust for new visitors — 84% check reviews before contacting a business.', recommendation: 'Send existing customers a direct review link and add a "Leave us a review" CTA in email signatures and invoices.' },
          { severity: 'medium', title: 'Slow response to messages', description: 'Page response time is above 1 hour — Facebook removes the "Very responsive" badge for pages over 15-minute average.', recommendation: 'Set up instant auto-replies with FAQ answers and aim to respond within 15 minutes.' },
        ]},
      ]},
    ],
    flipkart: [
      { title: 'Flipkart Seller Audit', sections: [
        { title: 'Listing Quality & Title', score: 52, issues: [
          { severity: 'high', title: 'Product title not following Flipkart\'s title formula', description: 'Flipkart\'s algorithm ranks titles using: Brand + Product Name + Key Feature + Model + Size/Color. Your title deviates from this structure.', recommendation: 'Restructure title: "[Brand] [Product] – [Key Feature], [Variant], [Pack Size]" — keep under 100 characters.' },
          { severity: 'high', title: 'Missing keywords in title and description', description: 'High-search keywords for this category are absent from your listing, reducing search visibility.', recommendation: 'Use Flipkart\'s search bar autocomplete to find top keywords — include top 5 in title and description.' },
          { severity: 'medium', title: 'Description lacks specification table', description: 'Buyers on Flipkart rely heavily on the specification table for purchase decisions.', recommendation: 'Fill in all specification fields in the seller dashboard — empty specs trigger lower visibility.' },
        ]},
        { title: 'Images & Product Presentation', score: 44, issues: [
          { severity: 'high', title: 'Fewer than 5 product images uploaded', description: 'Flipkart listings with 5+ images convert 35% better than those with 1-2 images.', recommendation: 'Upload: 1 main white background image + 2 angle shots + 1 feature callout image + 1 lifestyle image.' },
          { severity: 'high', title: 'Main image below 500×500px resolution', description: 'Low-resolution images make your listing look unprofessional and reduce click-through rates.', recommendation: 'Upload images with minimum 1000×1000px (2000×2000px preferred) for zoom feature activation.' },
          { severity: 'medium', title: 'No branded packaging shown', description: 'Customers can\'t see what the product packaging looks like — raises return rates.', recommendation: 'Add one image showing the product in its packaging so customers know what to expect on delivery.' },
        ]},
        { title: 'Pricing & Promotions', score: 47, issues: [
          { severity: 'high', title: 'MRP not set strategically for discounting', description: 'Products without a visible discount (strike-through MRP) have 25% lower click rates on Flipkart.', recommendation: 'Set MRP at least 10-15% above selling price to always show a discount — this increases CTR significantly.' },
          { severity: 'high', title: 'Not enrolled in Flipkart Assured or F-Assured program', description: 'F-Assured products appear higher in search results and see 2-3× better conversion.', recommendation: 'Meet quality, packaging, and SLA requirements to apply for Flipkart Assured status via your seller dashboard.' },
          { severity: 'medium', title: 'No Flash Sale or promotional participation', description: 'Sellers not participating in Big Billion Days or Brand Days miss peak traffic windows.', recommendation: 'Enroll in upcoming promotional events via Seller Hub > Promotions section well in advance.' },
        ]},
        { title: 'Seller Metrics & Reviews', score: 41, issues: [
          { severity: 'high', title: 'Low seller rating impacting buy-box share', description: 'A seller rating below 4.0 removes you from the buy-box on competitive listings.', recommendation: 'Focus on on-time dispatch, accurate descriptions, and proactive return management to improve rating.' },
          { severity: 'high', title: 'High return rate on one or more products', description: 'Products with >5% return rate get algorithmically suppressed by Flipkart.', recommendation: 'Audit return reasons from Seller Hub > Returns — fix sizing charts, image accuracy, and description issues.' },
          { severity: 'medium', title: 'Few product reviews', description: 'Products with fewer than 15 reviews rank significantly lower in category searches.', recommendation: 'Use Flipkart\'s "Request Review" feature after each confirmed delivery and improve packaging with a thank-you card.' },
        ]},
      ]},
    ],
    other: [
      { title: 'Digital Presence Audit', sections: [
        { title: 'Online Visibility & Brand Discoverability', score: 51, issues: [
          { severity: 'high', title: 'Google Business Profile not set up or incomplete', description: 'Without a claimed and optimized Google Business Profile, you\'re invisible to 87% of local searches.', recommendation: 'Claim your GBP at business.google.com — add photos, hours, category, website, and get 5+ reviews.' },
          { severity: 'high', title: 'No consistent NAP (Name, Address, Phone) across directories', description: 'Inconsistent business info across Justdial, Sulekha, IndiaMART, etc. hurts local SEO and trust.', recommendation: 'Audit all directory listings with a tool like BrightLocal and standardize your NAP details everywhere.' },
          { severity: 'medium', title: 'No YouTube or video presence', description: 'Businesses with video content see 2× higher engagement and 80% more leads than text-only brands.', recommendation: 'Create a YouTube channel and upload 1-2 explainer or testimonial videos to start.' },
          { severity: 'low', title: 'No LinkedIn company page', description: 'LinkedIn is critical for B2B trust — missing page reduces professional credibility.', recommendation: 'Create a LinkedIn Company Page, complete all sections, and post weekly industry content.' },
        ]},
        { title: 'Social Media Presence', score: 45, issues: [
          { severity: 'high', title: 'Inactive or missing social media profiles', description: 'Brands with dormant or absent social profiles lose credibility — customers check social before purchasing.', recommendation: 'Identify the 2-3 platforms where your target audience is most active and post consistently (5x/week min).' },
          { severity: 'high', title: 'No engagement with audience comments or DMs', description: 'Zero or delayed response to comments and messages signals neglect and reduces trust.', recommendation: 'Set up daily 15-minute community management sessions — respond to all comments and DMs within 24 hours.' },
          { severity: 'medium', title: 'No user-generated content strategy', description: 'Not encouraging customers to share content featuring your product/service wastes free marketing.', recommendation: 'Create a branded hashtag and incentivize UGC with reposts, shoutouts, or small discounts.' },
        ]},
        { title: 'Lead Generation & Conversion', score: 43, issues: [
          { severity: 'high', title: 'No lead capture mechanism on website', description: 'Website has no lead magnet, contact form, or free consultation offer — visitors leave without converting.', recommendation: 'Add a sticky CTA bar, a pop-up after 30 seconds, and a dedicated "Free Consultation" landing page.' },
          { severity: 'high', title: 'WhatsApp Business not configured', description: 'In India, 95% of SMB leads prefer WhatsApp — not having a click-to-WhatsApp CTA loses leads.', recommendation: 'Set up WhatsApp Business with a catalog, auto-reply, and add a click-to-chat button to your website and social bios.' },
          { severity: 'medium', title: 'No email marketing list or newsletter', description: 'Without an email list, you lose repeat contact ability and rely solely on paid/organic reach.', recommendation: 'Offer a free resource (checklist, guide, discount) in exchange for email signups and use tools like Mailchimp or Brevo.' },
        ]},
        { title: 'Paid Advertising Readiness', score: 37, issues: [
          { severity: 'high', title: 'No tracking pixels or conversion tags installed', description: 'Running ads without Meta Pixel and Google Tag will waste 50-70% of ad spend on untrackable traffic.', recommendation: 'Install Meta Pixel (for Facebook/Instagram ads) and Google Analytics 4 + Google Ads tag on all pages before spending.' },
          { severity: 'medium', title: 'No dedicated landing pages for campaigns', description: 'Sending ad traffic to a homepage increases bounce rate and reduces conversion by up to 60%.', recommendation: 'Create separate landing pages for each campaign with a single CTA, matching the ad\'s message.' },
        ]},
      ]},
    ],
    website: [
      { title: 'Website Audit', sections: [
        { title: 'Performance & Speed', score: 54, issues: [
          { severity: 'high', title: 'Page load time exceeds 3 seconds', description: 'Slow load speed directly impacts bounce rate and SEO ranking.', recommendation: 'Compress images (WebP format), enable browser caching, and use a CDN.' },
          { severity: 'high', title: 'Unoptimized images above the fold', description: 'Hero images are not using modern format or lazy loading.', recommendation: 'Convert all images to WebP and implement lazy loading below the fold.' },
          { severity: 'medium', title: 'No page caching enabled', description: 'Each visit regenerates the page from scratch.', recommendation: 'Enable server-side caching (Redis) or use static site generation for key pages.' },
        ]},
        { title: 'SEO & Visibility', score: 47, issues: [
          { severity: 'high', title: 'Missing meta descriptions on key pages', description: 'Product and category pages lack optimized meta descriptions.', recommendation: 'Write unique 150-160 character meta descriptions with primary keyword + CTA.' },
          { severity: 'high', title: 'No structured data / schema markup', description: 'Missing Product, Review, and BreadcrumbList schema — reducing rich snippet eligibility.', recommendation: 'Implement JSON-LD schema for Product, Organization, and FAQ pages.' },
          { severity: 'medium', title: 'H1 tag misuse', description: 'Multiple pages either have no H1 or multiple H1 tags.', recommendation: 'Ensure exactly one H1 per page that includes the primary keyword naturally.' },
        ]},
        { title: 'Conversion Optimization', score: 43, issues: [
          { severity: 'high', title: 'CTA buttons lack urgency or clarity', description: 'Primary CTAs say "Submit" or "Click Here" — weak conversion signals.', recommendation: 'Use action-oriented CTAs: "Get My Free Quote", "Start Growing Today", "Claim Offer".' },
          { severity: 'high', title: 'No social proof above the fold', description: 'Trust signals (reviews, logos, testimonials) are buried below the fold.', recommendation: 'Move at least one trust element (review count, client logo, or rating) to hero section.' },
          { severity: 'medium', title: 'Missing exit-intent strategy', description: 'No exit-intent popup or cart abandonment mechanism.', recommendation: 'Implement exit-intent popup with a compelling offer (discount or free resource).' },
        ]},
        { title: 'Mobile & UX', score: 60, issues: [
          { severity: 'medium', title: 'Tap targets too small on mobile', description: 'Several buttons and links are below the 44px minimum recommended tap target size.', recommendation: 'Ensure all interactive elements have minimum 44×44px touch area on mobile.' },
          { severity: 'low', title: 'Inconsistent typography scale on mobile', description: 'Some headings are too large on small screens causing horizontal scroll.', recommendation: 'Use CSS clamp() for responsive typography without media query bloat.' },
        ]},
      ]},
    ],
  };

  const platformData = platformIssues[platform] || platformIssues.other;
  const sections = platformData[0].sections;
  const overallScore = Math.round(sections.reduce((s, sec) => s + sec.score, 0) / sections.length);

  return {
    overallScore,
    summary: `Your ${platform} presence scored ${overallScore}/100. We found ${sections.reduce((s, sec) => s + sec.issues.length, 0)} issues that are likely impacting your visibility and conversions. ${overallScore < 50 ? 'Immediate action is recommended.' : overallScore < 70 ? 'Several improvements can significantly boost performance.' : 'You\'re doing well but there\'s room to improve.'}`,
    sections,
  };
}

module.exports = router;
