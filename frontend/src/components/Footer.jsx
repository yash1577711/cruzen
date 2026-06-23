import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="ftr">
      <div className="container ftr-top">

        {/* Brand */}
        <div className="ftr-brand">
          <Link to="/">
            <img src="/assets/cruzen.png" alt="Cruzen Digital" className="ftr-logo" />
          </Link>
          <p className="ftr-tagline">
            Expand your online presence with comprehensive marketing, marketplace management, and website design solutions.
          </p>
          <div className="ftr-social">
            <a href="https://www.facebook.com/people/Cruzen-Digital-online/100084008750222/" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><i className="fab fa-facebook-f" /></a>
            <a href="https://www.instagram.com/cruzendigital/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><i className="fab fa-instagram" /></a>
            <a href="https://www.linkedin.com/company/81866978/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><i className="fab fa-linkedin-in" /></a>
            <a href="https://wa.me/919560310393" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><i className="fab fa-whatsapp" /></a>
          </div>
        </div>

        {/* Company */}
        <div className="ftr-col">
          <h4 className="ftr-heading">Company</h4>
          <Link to="/about" className="ftr-link">About Us</Link>
          <Link to="/contact" className="ftr-link">Contact Us</Link>
          <Link to="/services" className="ftr-link">Our Services</Link>
          <Link to="/blog" className="ftr-link">Blog</Link>
        </div>

        {/* Services */}
        <div className="ftr-col">
          <h4 className="ftr-heading">Services</h4>
          <Link to="/services?service=amazon" className="ftr-link">Marketplace Management</Link>
          <Link to="/services?service=smo" className="ftr-link">Social Media</Link>
          <Link to="/services?service=seo" className="ftr-link">SEO</Link>
          <Link to="/services?service=website-design" className="ftr-link">Website Design</Link>
          <Link to="/services?service=360" className="ftr-link">360° Marketing</Link>
        </div>

        {/* Contact */}
        <div className="ftr-col">
          <h4 className="ftr-heading">Contact Us</h4>
          <a href="tel:08062180749" className="ftr-contact-item">
            <span className="ftr-contact-icon"><i className="fas fa-phone-alt" /></span>
            <span>08062180749</span>
          </a>
          <a href="mailto:info@cruzendigital.com" className="ftr-contact-item">
            <span className="ftr-contact-icon"><i className="fas fa-envelope" /></span>
            <span>info@cruzendigital.com</span>
          </a>
          <div className="ftr-contact-item ftr-contact-addr">
            <span className="ftr-contact-icon"><i className="fas fa-map-marker-alt" /></span>
            <span>A-50 Dashrath Puri, Dabri Palam Road, Bharti Refrigeration Works, New Delhi — 110045</span>
          </div>
        </div>

      </div>

      <div className="ftr-bottom">
        <div className="container ftr-bottom-inner">
          <p>&copy; {new Date().getFullYear()} Cruzen Digital. All rights reserved.</p>
          <div className="ftr-legal">
            <a href="#">Privacy Policy</a>
            <span className="ftr-dot" />
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
