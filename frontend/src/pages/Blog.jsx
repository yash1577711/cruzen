import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import ConsultationModal from '../components/ConsultationModal.jsx';
import Chatbot from '../components/Chatbot.jsx';
import LeadPopup from '../components/LeadPopup.jsx';
import ExitIntentPopup from '../components/ExitIntentPopup.jsx';
import api from '../api/axios.js';

const BLOG_POPUP_CONFIG = {
  delay: 15000,
  badge: 'FREE INSIGHTS',
  title: 'Get weekly digital marketing tips that actually work',
  subtitle: 'Join 500+ business owners getting actionable strategies to grow their brand online.',
  fields: [
    { name: 'name',  placeholder: 'Your name' },
    { name: 'email', placeholder: 'Your email address', type: 'email' },
  ],
  ctaText: 'Subscribe for Free →',
  source: 'blog_newsletter',
  storageKey: 'cruzen_blog_popup',
};

const FILTER_CHIPS = [
  { key: 'all', label: 'All Posts' },
  { key: 'marketplace', label: 'Marketplace' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'design', label: 'Design' },
  { key: 'branding', label: 'Branding' },
  { key: 'technology', label: 'Technology' },
];

export default function Blog() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [consultOpen, setConsultOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: 9 };
    if (filter !== 'all') params.category = filter;
    if (search) params.search = search;
    api.get('/blog', { params })
      .then(r => { setBlogs(r.data.blogs || []); setTotal(r.data.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter, search, page]);

  return (
    <>
      <Header openConsultation={() => setConsultOpen(true)} />

      {/* Hero */}
      <section className="blg-hero">
        <div className="container">
          <span className="section-subtitle">Our Blog</span>
          <h1 className="blg-hero-title">Insights, Strategies<br /><em className="text-cyan">&amp; Growth</em></h1>
          <p className="blg-hero-sub">Expert articles on e-commerce trends, digital marketing, and growth strategies for ambitious brands.</p>
          <div className="blg-search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              placeholder="Search articles..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
            {search && (
              <button onClick={() => setSearch('')} aria-label="Clear search">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Listing */}
      <section className="blg-listing">
        <div className="container">
          <div className="blg-filters">
            {FILTER_CHIPS.map(f => (
              <button
                key={f.key}
                className={`blg-chip${filter === f.key ? ' active' : ''}`}
                onClick={() => { setFilter(f.key); setPage(1); }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="blg-loading">
              <div className="blg-spinner" />
            </div>
          ) : blogs.length === 0 ? (
            <div className="blg-empty">
              <div className="blg-empty-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
              </div>
              <h3>No Articles Yet</h3>
              <p>{search || filter !== 'all' ? 'Try a different search or filter.' : "We're working on great content — check back soon!"}</p>
              {(search || filter !== 'all') && (
                <button className="btn btn-primary" onClick={() => { setSearch(''); setFilter('all'); }}>
                  View All Posts
                </button>
              )}
            </div>
          ) : (
            <div className="blg-grid">
              {blogs.map((blog) => (
                <article key={blog._id} className="blg-card">
                  <div className="blg-card-accent" />
                  <div className="blg-card-inner">
                    <span className="blg-tag">{blog.category}</span>
                    <h3 className="blg-card-title">{blog.title}</h3>
                    <p className="blg-card-excerpt">{blog.excerpt}</p>
                    <div className="blg-card-footer">
                      <div className="blg-meta">
                        <span>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          {new Date(blog.publishedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                        {blog.readTime && (
                          <span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            {blog.readTime}
                          </span>
                        )}
                      </div>
                      <Link to={`/blog/${blog.slug}`} className="blg-read-more">
                        Read
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {total > 9 && (
            <div className="blg-pagination">
              {Array.from({ length: Math.ceil(total / 9) }, (_, i) => (
                <button
                  key={i}
                  className={`blg-page-btn${page === i + 1 ? ' active' : ''}`}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="blg-cta">
        <div className="container blg-cta-inner">
          <span className="blg-cta-label">Ready to Grow?</span>
          <h2>Scale Your Brand With Cruzen Digital</h2>
          <p>Get a free strategy call with our experts and discover your growth path.</p>
          <button className="btn btn-primary blg-cta-btn" onClick={() => setConsultOpen(true)}>
            Book Free Consultation
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </section>

      <Footer />
      <ConsultationModal isOpen={consultOpen} onClose={() => setConsultOpen(false)} />
      <LeadPopup config={BLOG_POPUP_CONFIG} />
      <ExitIntentPopup />
      <Chatbot />
    </>
  );
}
