import type { Metadata } from "next";
import Link from "next/link";
import { privacyPolicySections } from "@/data/privacy-policy-content";

export const metadata: Metadata = {
  title: "Privacy Policy | The School Expert™",
  description: "Privacy Policy for The School Expert™.",
};

function renderParagraph(text: string, key: string) {
  const lines = text.split("\n");
  return (
    <p key={key}>
      {lines.map((line, index) => (
        <span key={`${key}-${index}`}>
          {index > 0 && <br />}
          {line}
        </span>
      ))}
    </p>
  );
}

export default function PrivacyPolicyPage() {
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

      <article className="privacy-page">
        <div className="privacy-home-action">
          <Link className="privacy-home-button" href="/">Back to All registration forms</Link>
        </div>
        <div className="privacy-heading">
          <h1>Privacy Policy</h1>
        </div>

        <div className="privacy-document">
          {privacyPolicySections.map((section, sectionIndex) => (
            <section className="privacy-section" key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph, paragraphIndex) =>
                renderParagraph(paragraph, `section-${sectionIndex}-paragraph-${paragraphIndex}`)
              )}
              {section.bullets.length > 0 && (
                <ul>
                  {section.bullets.map((bullet, bulletIndex) => (
                    <li key={`section-${sectionIndex}-bullet-${bulletIndex}`}>{bullet}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
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
