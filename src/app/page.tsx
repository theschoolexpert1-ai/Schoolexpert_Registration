import Link from "next/link";
import { forms } from "@/lib/forms/catalog";

function displayFormName(title: string) {
  return title.replace(/^The School Expert\s*[-–—:]\s*/i, "");
}

function formDescription(title: string) {
  const name = displayFormName(title).replace(/\s*Registration Form.*$/i, "").trim();
  return name
    ? `Complete the ${name.toLowerCase()} registration and submit your details securely for review.`
    : "Complete this registration form and submit your details securely for review.";
}

function FormIcon({ index }: { index: number }) {
  const icons = [
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 20.5h17M5.5 20.5V9.5L12 5l6.5 4.5v11M8.5 20.5v-6h7v6M9 10.5h.01M12 10.5h.01M15 10.5h.01" /></svg>,
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3" /><circle cx="16.5" cy="9.5" r="2.25" /><path d="M3.5 19c.6-3 2.5-4.5 5.5-4.5s4.9 1.5 5.5 4.5M14 14.5c3.1-.2 5.2 1.2 5.8 4.5" /></svg>,
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5.5h10v13H7zM9.5 9h5M9.5 12h5M9.5 15h3" /></svg>,
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18.5h16M6 18.5v-9l6-4 6 4v9M9 18.5v-4h6v4" /></svg>,
  ];
  return <span className="form-icon">{icons[index % icons.length]}</span>;
}

export default function HomePage() {
  return (
    <main className="site-shell">
      <header className="topbar">
        <Link className="brand-lockup" href="/" aria-label="The School Expert home">
          <img className="brand-logo" src="/the-school-expert-logo.svg" alt="The School Expert" />
        </Link>
        <div className="header-meta">
          <Link className="header-faq-link" href="/faq">FAQs</Link>
          <span className="header-label">Registration Centre</span>
        </div>
      </header>
      <section className="hero">
        <div className="hero-copy">
          <h1>Thank you for Collaborating <span>With Us.</span></h1>
          <p className="hero-lead">Choose a registration form below. Your information is submitted securely for review.</p>
          <div className="trust-row" aria-label="Registration benefits">
            <span><i>✓</i> Secure Submission</span>
            <span><i>✓</i> Verified by Experts</span>
            <span><i>✓</i> Dedicated Support</span>
          </div>
        </div>

        <div className="hero-art" aria-hidden="true">
          <div className="art-halo" />
          <div className="art-dots" />
          <svg viewBox="0 0 520 360" className="school-illustration">
            <path d="M112 292h300M142 292V158l118-70 118 70v134M181 292v-72h158v72M205 171h34M281 171h34M205 199h34M281 199h34" />
            <path d="M260 88V43M246 52h28M260 43l20 9-20 9" />
            <circle cx="260" cy="142" r="22" /><path d="M260 128v14l9 6" />
            <path d="M95 292c5-28 21-43 46-43 25 0 40 15 45 43M355 292c5-28 21-43 46-43 25 0 40 15 45 43" />
            <path d="M60 292h55M405 292h55M77 273l-11-20M77 273l11-20M430 273l-11-20M430 273l11-20" />
            <path d="M78 102c15-14 34-14 49 0M389 82c13-12 29-12 42 0" />
          </svg>
        </div>
      </section>

      <section className="forms-heading">
        <div>
          <p className="eyebrow">Registration forms</p>
          <h2>Choose a form to get started.</h2>
        </div>
        <span className="form-count">{forms.length} forms available</span>
      </section>

      <section className="form-grid" aria-label="Registration forms">
        {forms.map((form, index) => (
          <Link className="form-card" href={`/forms/${form.slug}`} key={form.slug}>
            <div className="card-top">
              <FormIcon index={index} />
              <span>Registration form</span>
            </div>
            <h3>{displayFormName(form.title)}</h3>
            <p>{formDescription(form.title)}</p>
            <div className="card-action">Open form <span aria-hidden>→</span></div>
          </Link>
        ))}
      </section>

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
