import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact Us | The School Expert™",
  description: "Contact The School Expert™ for general enquiries and assistance.",
};

export default function ContactUsPage() {
  return (
    <main className="site-shell privacy-shell">
      <header className="topbar">
        <Link className="brand-lockup" href="/" aria-label="The School Expert home">
          <img className="brand-logo" src="/the-school-expert-logo.svg" alt="The School Expert" />
        </Link>
        <div className="header-meta">
          <Link className="header-faq-link" href="/faq">FAQs</Link>
          <span className="header-label">Registration Centre</span>
        </div>
      </header>

      <article className="privacy-page contact-page">
        <div className="privacy-home-action">
          <Link className="privacy-home-button" href="/">Back to All registration forms</Link>
        </div>
        <div className="privacy-heading">
          <h1>Contact Us</h1>
          <p className="faq-intro">The School Expert™</p>
        </div>

        <section className="contact-details" aria-label="Contact details">
          <h2>The School Expert™</h2>
          <p className="contact-organisation">Poornaphala Media and Infotech Services LLP</p>
          <dl>
            <div className="contact-detail-row">
              <dt>Website</dt>
              <dd><a href="https://www.schoolexpert.in" target="_blank" rel="noreferrer">www.schoolexpert.in</a></dd>
            </div>
            <div className="contact-detail-row">
              <dt>Email</dt>
              <dd><a href="mailto:info@schoolexpert.in">info@schoolexpert.in</a></dd>
            </div>
            <div className="contact-detail-row">
              <dt>Phone</dt>
              <dd><a href="tel:9972915700">9972915700</a></dd>
            </div>
          </dl>
        </section>
      </article>

      <footer className="site-footer">
        <span>THE SCHOOL EXPERT™</span>
        <nav className="footer-page-links" aria-label="Footer links">
          <Link className="footer-policy-link" href="/privacy-policy">Privacy Policy</Link>
          <Link className="footer-policy-link" href="/contact-us">Contact Us</Link>
          <Link className="footer-policy-link" href="/about-us">About Us</Link>
                  <Link className="footer-policy-link" href="/terms-and-conditions">Terms &amp; Conditions</Link>
        </nav>
      </footer>
    </main>
  );
}
