import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us | The School Expert™",
  description: "Meet Shalini Santhosh, Founder of The School Expert™.",
};

export default function AboutUsPage() {
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

      <article className="privacy-page about-page">
        <div className="privacy-home-action">
          <Link className="privacy-home-button" href="/">Back to all registration form</Link>
        </div>
        <div className="privacy-heading">
          <h1>Meet Our Founder</h1>
          <p className="faq-intro">Shalini Santhosh | Founder, The School Expert™</p>
        </div>
        <div className="privacy-document">
          <section className="privacy-section">
            <p>A Montessori-trained professional with experience in educational instruction, student counselling, and IT sales and marketing, Shalini Santhosh brings a multidisciplinary perspective to the education ecosystem. Her passion for books and meaningful learning inspired her to establish The Ever-hungry Bookworms, a reading and storytelling initiative for children.</p>
            <p>Her experiences as a parent, along with her interest in homeschooling and diverse approaches to learning, shaped her vision of creating a platform that connects parents, schools, educators, and education professionals.</p>
            <p>Through The School Expert™, she aims to bridge information gaps, bring valuable expertise into the spotlight, and foster meaningful connections that contribute to better educational experiences for every child.</p>
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
