import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions | The School Expert™",
  description: "Terms of Use for The School Expert™ and its related services.",
};

const terms = [
  { heading: "1. Eligibility and accounts", paragraphs: ["Accounts are for individuals aged 18 or above and for organisations acting through authorised adults. You are responsible for the accuracy of information you submit and for keeping your login secure. Student Ambassador participation (ages 14–18) requires verifiable consent from a parent or lawful guardian."] },
  { heading: "2. Registrations, verification and listings", paragraphs: ["Registration and verification are separate. Verification is limited to the information available to us and is not an endorsement, certification, accreditation or guarantee of quality, conduct or outcomes. We may review, decline, suspend or remove any registration, listing or content where appropriate. Registration does not guarantee leads, admissions, employment or revenue."] },
  { heading: "3. Paid plans and services", paragraphs: ["Prices are shown in Indian Rupees and, unless stated otherwise, are exclusive of GST, which is added at checkout. Plans renew only when you choose to renew. Founding Partner benefits apply as per the agreed terms of association. See the Refund & Cancellation Policy."] },
  { heading: "4. Parents' detailed views and verified reviews", paragraphs: ["Unlock packs give access to detailed profiles of participating schools within the purchased locality and validity period. Reviews must reflect genuine first-hand experience; we may moderate reviews that are abusive, unlawful or not genuine."] },
  { heading: "5. Personal Assistance", paragraphs: ["Personal Assistance is provided by The School Expert™'s own staff in selected cities. We coordinate but never pay fees on your behalf — all fees are paid by you directly to the school. Turnaround depends on the school's processes."] },
  { heading: "6. Communities and user content", paragraphs: ["Follow the Community Guidelines. Never post children's personal information, contact details, abusive or promotional content. You grant us the rights reasonably necessary to host and display content you submit for the purpose you submitted it."] },
  { heading: "7. Marketplace", paragraphs: ["Products sold by third-party sellers are their responsibility; The School Expert™ products are sold by us. Delivery, returns and replacements follow the Shipping & Delivery Policy and the Refund & Cancellation Policy."] },
  { heading: "8. Intellectual property", paragraphs: ["The School Expert™ name, logo, content, databases and software are protected. You may not scrape, copy or resell directory data."] },
  { heading: "9. Liability", paragraphs: ["The Platform is provided on an \"as is\" basis. To the extent permitted by law, we are not liable for indirect or consequential losses or for the acts of listed schools, professionals or vendors."] },
  { heading: "10. Governing law and grievances", paragraphs: ["These Terms are governed by the laws of India, with courts at Bengaluru having jurisdiction. Grievances: see the Privacy Centre or write to info@schoolexpert.in."] },
];

export default function TermsAndConditionsPage() {
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

      <article className="privacy-page terms-page">
        <div className="privacy-home-action">
          <Link className="privacy-home-button" href="/">Back to all registration form</Link>
        </div>
        <div className="privacy-heading">
          <h1>Terms &amp; Conditions</h1>
          <p className="faq-intro">Terms of Use for www.schoolexpert.in and related services</p>
        </div>
        <div className="privacy-document">
          <section className="privacy-section">
            <p>These Terms of Use govern your use of www.schoolexpert.in and related services (the &quot;Platform&quot;) operated by Poornaphala Media and Infotech Services LLP (&quot;The School Expert™&quot;, &quot;we&quot;, &quot;us&quot;).</p>
          </section>
          {terms.map((section) => (
            <section className="privacy-section" key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
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
