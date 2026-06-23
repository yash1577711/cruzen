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

  const platformData = platformIssues[platform] || platformIssues.website;
  const sections = platformData[0].sections;
  const overallScore = Math.round(sections.reduce((s, sec) => s + sec.score, 0) / sections.length);

  return {
    overallScore,
    summary: `Your ${platform} presence scored ${overallScore}/100. We found ${sections.reduce((s, sec) => s + sec.issues.length, 0)} issues that are likely impacting your visibility and conversions. ${overallScore < 50 ? 'Immediate action is recommended.' : overallScore < 70 ? 'Several improvements can significantly boost performance.' : 'You\'re doing well but there\'s room to improve.'}`,
    sections,
  };
}

module.exports = router;
