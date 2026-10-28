import type { Metadata } from "next";
import Link from "next/link";
import { faqImportantNote, faqSections } from "@/data/faq-content";

export const metadata: Metadata = {
  title: "FAQs | The School Expert™",
  description: "Frequently asked questions about The School Expert™, registration, verification and the Founding Partner Programme.",
};

function renderAnswerText(text: string, key: string) {
  if (text === "Exclusive Founding Partners Application" || text === "Founding Partner Application") {
    return <p key={key} className="faq-subject-line">{text}</p>;
  }
  const emailMatch = text.match(/^(.*?)(shalini@schoolexpert\.in|info@schoolexpert\.in)(\.?)$/);
  if (emailMatch) {
    const [, before, email, punctuation] = emailMatch;
    return <p key={key}>{before}<a href={`mailto:${email}`}>{email}</a>{punctuation}</p>;
  }
  if (text.includes("Privacy Policy")) {
    const parts = text.split("Privacy Policy");
    return <p key={key}>{parts[0]}<Link href="/privacy-policy">Privacy Policy</Link>{parts.slice(1).join("Privacy Policy")}</p>;
  }
  return <p key={key}>{text}</p>;
}

export default function FaqPage() {
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

      <article className="privacy-page faq-page">
        <div className="privacy-home-action">
          <Link className="privacy-home-button" href="/">Back to All registration forms</Link>
        </div>
        <div className="privacy-heading">
          <h1>Frequently Asked Questions</h1>
          <p className="faq-intro">The School Expert™</p>
        </div>

        <div className="privacy-document faq-document">
          {faqSections.map((section) => (
            <section className="privacy-section faq-section" key={section.heading}>
              <h2>{section.heading}</h2>
              {section.items.map((item) => (
                <div className="faq-item" key={item.question}>
                  <h3>{item.question}</h3>
                  {item.paragraphs.map((paragraph, index) => renderAnswerText(paragraph, `${item.question}-${index}`))}
                  {item.bullets && (
                    <ul>
                      {item.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                    </ul>
                  )}
                  {item.question.startsWith("16.") && <p>All benefits are subject to the agreed terms and conditions of our association. Invitations, participation, promotional opportunities and other benefits may depend on relevance, availability and the specific terms agreed.</p>}
                </div>
              ))}
            </section>
          ))}
          <section className="privacy-section faq-section faq-important-note">
            <h2>Important Note</h2>
            {faqImportantNote.map((paragraph, index) => <p key={`important-${index}`}>{paragraph}</p>)}
          </section>
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
