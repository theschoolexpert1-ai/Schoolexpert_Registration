export type FaqItem = {
  question: string;
  paragraphs: string[];
  bullets?: string[];
};

export type FaqSection = {
  heading: string;
  items: FaqItem[];
};

export const faqSections: FaqSection[] = [
  {
    heading: "About The School Expert™",
    items: [
      {
        question: "1. What is The School Expert™?",
        paragraphs: ["The School Expert™ is a platform that connects the education ecosystem across India, bringing together schools, educators, parents, education service providers, institutions, organisations and other stakeholders. Our aim is to improve visibility, discoverability, collaboration and access to relevant opportunities across the education sector."],
      },
      {
        question: "2. Why should I join The School Expert™?",
        paragraphs: ["The School Expert™ aims to help individuals and organisations within the education ecosystem improve their visibility, connect with relevant stakeholders and explore opportunities for professional growth, collaboration, business development and employment.", "Schools and parents can discover relevant educational services, while educators, consultants, institutions and service providers can showcase their expertise and offerings."],
      },
      {
        question: "3. Who can register with The School Expert™?",
        paragraphs: ["Registration may be open to a range of education stakeholders, including:", "Registrations are subject to applicable eligibility and verification requirements."],
        bullets: ["Schools and educational institutions", "Teachers, tutors and special educators", "School counsellors and career counsellors", "Curriculum development experts", "Educational consultants", "Teacher training institutes", "Online tutoring and academic support providers", "Education-related vendors and service providers", "Other relevant individuals, businesses and organisations serving the education sector"],
      },
    ],
  },
  {
    heading: "Registration and Verification",
    items: [
      { question: "4. Is The School Expert™ only for businesses and vendors?", paragraphs: ["No. The School Expert™ is intended to serve the wider education ecosystem. Depending on the category, educators, professionals, institutions, schools and relevant service providers may be eligible to register."] },
      { question: "5. If I am already part of a The School Expert™ WhatsApp group, am I automatically registered?", paragraphs: ["No. Joining a WhatsApp group does not mean you are registered, verified or officially onboarded onto The School Expert™.", "Registration and verification are separate processes. You may be required to submit information, supporting documents and applicable fees before your registration is approved."] },
      { question: "6. Why is a verification process required?", paragraphs: ["Verification helps The School Expert™ review the information and credentials submitted by applicants and maintain appropriate onboarding standards. Verification does not constitute an absolute guarantee of an individual’s or organisation’s quality, performance, conduct or services."] },
      { question: "7. Does registration guarantee customers, business leads, employment or revenue?", paragraphs: ["No. Registration provides an opportunity for visibility and potential connections. The School Expert™ does not guarantee a specific number of leads, customers, collaborations, employment opportunities or revenue."] },
      { question: "8. Is registration free?", paragraphs: ["Registration fees, where applicable, depend on the relevant category and registration terms. Applicants will be informed of applicable fees and requirements during the registration process."] },
    ],
  },
  {
    heading: "WhatsApp Groups and Professional Categories",
    items: [
      { question: "9. What is the purpose of The School Expert™ WhatsApp groups?", paragraphs: ["The WhatsApp groups are intended primarily for official communication, announcements, information dissemination, registration updates and relevant opportunities.", "They are not intended to operate as general discussion groups or channels for unsolicited promotion and solicitation."] },
      { question: "10. Why are the WhatsApp groups not open for unrestricted conversations?", paragraphs: ["The groups are structured to keep communications relevant, professional and focused on official information. This helps reduce spam, unsolicited approaches, irrelevant messages and potentially misleading claims."] },
      { question: "11. How should I choose the appropriate WhatsApp group?", paragraphs: ["Please join the group that matches the professional category, expertise or services you genuinely offer.", "For example, a curriculum development expert should join the relevant curriculum development category rather than a career counselling group simply to seek a career counsellor for their own child.", "Group selection should reflect your professional category and intended registration."] },
      { question: "12. Can I join a professional category group just to find a service for personal use?", paragraphs: ["The category groups are intended for professionals and organisations relevant to the respective category, not as general consumer enquiry groups. Please use the appropriate official channel to make service enquiries."] },
      { question: "13. Can I contact or solicit services from other members through the WhatsApp groups?", paragraphs: ["The groups should not be used for unsolicited approaches, promotions or service solicitation. Being present in a group does not, by itself, establish that a member has been verified or officially onboarded by The School Expert™.", "Please exercise appropriate due diligence before engaging any individual or organisation. The School Expert™ is not responsible for claims or representations made by unverified group members."] },
      { question: "14. What if I offer services in multiple categories?", paragraphs: ["If you offer services across multiple categories, you may need to register separately under each relevant category to ensure that your profile and offerings are appropriately represented.", "Please follow the registration requirements applicable to each category."] },
    ],
  },
  {
    heading: "Founding Partner Programme",
    items: [
      { question: "15. What is The School Expert™ Founding Partner Programme?", paragraphs: ["The Founding Partner Programme is designed for eligible registered vendors, institutions, businesses and organisations that wish to build a stronger presence within India’s education ecosystem and contribute to its growth."] },
      { question: "16. What are the benefits of becoming a Founding Partner?", paragraphs: ["Subject to the agreed terms and conditions of the association, Founding Partners may receive the following benefits:"] , bullets: ["One-Time Registration Fee: A one-time registration fee applies at the time of registration.", "Three-Year Waiver of Annual Renewal Fees: Founding Partners are exempt from annual renewal fees for the first three years from their date of registration with The School Expert™.", "Lifetime Founding Partner Badge: Recognition of their status as a Founding Partner of The School Expert™.", "Invitation to Participate in Committees and Councils: Opportunities to be invited to participate in The School Expert™ committees and councils that contribute towards shaping and strengthening the education ecosystem.", "Priority Access to Events: Priority access to events hosted by The School Expert™.", "Enhanced Visibility: Enhanced visibility through relevant platform initiatives and promotional activities.", "Partner References and Introductions: We take our references to our Founding Partners wherever we go, helping create relevant opportunities for visibility, introductions and collaboration.", "Selected Marketing Opportunities: Potential inclusion in relevant events, communications, newsletters and other promotional initiatives, where applicable."], },
      { question: "17. Can The School Expert™ have more than one Founding Partner in the same category?", paragraphs: ["Yes. The School Expert™ may have multiple Founding Partners within the same category. Founding Partner status does not automatically grant category exclusivity."] },
      { question: "18. Can I apply to become an Exclusive Founding Partner in my category?", paragraphs: ["Yes. If you are interested in exploring category exclusivity, please email shalini@schoolexpert.in with the subject line:", "Exclusive Founding Partners Application", "Exclusive Founding Partner applications will be reviewed separately. Exclusivity is not automatic and will apply only if expressly agreed in writing by The School Expert™."] },
      { question: "19. How do I apply for the Founding Partner Programme?", paragraphs: ["Please email your organisation’s profile, details of your services and a brief proposal to shalini@schoolexpert.in with the subject line:", "Founding Partner Application", "Applications are subject to review, suitability and mutually agreed terms."] },
    ],
  },
  {
    heading: "Collaboration and Contact",
    items: [
      { question: "20. How can I collaborate with The School Expert™?", paragraphs: ["We welcome relevant collaboration proposals from individuals, professionals, institutions, organisations and businesses that share our interest in strengthening the education ecosystem.", "Please email your profile and proposal to shalini@schoolexpert.in."] },
      { question: "21. Whom should I contact for general enquiries?", paragraphs: ["For general enquiries, registration-related questions or assistance, please email info@schoolexpert.in."] },
      { question: "22. What happens after I submit my registration?", paragraphs: ["Your registration may be reviewed for completeness, eligibility and verification. We may request additional information or supporting documents and confirm any applicable fees. Registration is complete only when the required process has been completed and you receive the relevant confirmation."] },
      { question: "23. How can I update my registration details?", paragraphs: ["Please contact The School Expert™ through its official communication channels to request an update to your registration details. Any changes may be subject to verification."] },
    ],
  },
  {
    heading: "Privacy and Important Information",
    items: [
      { question: "24. How does The School Expert™ handle my personal or business information?", paragraphs: ["Information is handled in accordance with The School Expert™’s Privacy Policy and the purposes explained during registration or when you use a service. Please refer to the Privacy Policy for details about information collection, use, sharing, retention and applicable rights."] },
      { question: "25. Does The School Expert™ endorse or guarantee every person or organisation listed or featured on the platform, in WhatsApp groups, or in other marketing and promotional materials?", paragraphs: ["No. Being registered with, listed on, featured by, or participating in any initiative of The School Expert™ does not automatically constitute an endorsement or guarantee of an individual’s or organisation’s credentials, services, performance, or conduct.", "The School Expert™ makes reasonable efforts to verify the information and supporting details provided during the registration process. However, such verification is limited to the information available to us and should not be treated as a guarantee of service quality, outcomes, or future conduct.", "We encourage users to exercise independent judgement and conduct their own due diligence before engaging with any individual/organisation/vendor or entering into any transaction, arrangement, or agreement."] },
    ],
  },
];

export const faqImportantNote = [
  "All applicants and users are expected to provide accurate information and follow the applicable registration requirements, category guidelines and terms of association. The School Expert™ reserves the right to review, decline, suspend or remove registrations or participation where appropriate.",
  "Membership in a WhatsApp group does not constitute registration, verification or approval.",
  "Founding Partner benefits, including the three-year waiver of annual renewal fees, are subject to the agreed terms of association. Neither registration nor Founding Partner status guarantees business, leads, revenue or any particular outcome.",
];
