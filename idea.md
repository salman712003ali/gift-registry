# 🎁 Gift Registry Platform (India-Focused)

## 🚩 Problem
- People often don't know what gifts to give at weddings, birthdays, housewarmings, etc.
- Most end up giving random gifts or cash, which may be unwanted or duplicated.
- Gift registries are not commonly known or available in India.

## 🎯 Solution
Build a mobile-friendly **Gift Registry App or Website** that allows gift receivers to:
- Create a registry of desired items.
- Share the registry with friends and family via a **QR code or link**.
- Accept **group gifting**, **cash contributions**, or **direct purchases**.

## 🧩 Core Features – Phase 1
1. **Gift Registry Creation:**
   - User enters occasion, date, and description.
   - Adds items manually or by importing from platforms like Amazon, Flipkart, etc.

2. **Registry Sharing:**
   - Generate a shareable link and QR code.
   - Allow sharing via WhatsApp, SMS, email, etc.

3. **Guest Features:**
   - Guests can mark items as “reserved” or “purchased”.
   - Group gifting: guests can contribute partial cash amounts for expensive gifts (e.g., car, phone).
   - Optional: allow guests to give direct cash.

4. **Privacy Options:**
   - Registry visibility can be public, password-protected, or contact-based.
   - Gift receiver can decide whether to reveal who contributed.

## 🌱 Phase 2 Enhancements
- Track who contributed what (optional).
- Registry suggestions based on trends or location.
- Smart reminders and event countdowns.
- Integration with invitation cards or wedding websites.
- AI recommendations for registry items.
- RSVP integration.

## ⚙️ Tech Stack Plan
- **Frontend:** React (Next.js) or simple React app
- **Styling:** Tailwind CSS
- **Backend:** Supabase or Firebase (Free tier)
- **Hosting:** Vercel or Netlify (Free)
- **Authentication:** Supabase Auth / Firebase Auth
- **Database:** PostgreSQL (Supabase) or Firestore
- **QR Code Generator:** Free API
- **E-commerce APIs:** Amazon Affiliate API, Flipkart Affiliate API
- **Payments:** Razorpay (for UPI, group gifting), Cashfree, or Stripe
- **Optional AI tools:** GoCursor AI to boost productivity

## 🧑‍💻 Roles & Capabilities
- The team has coding knowledge and access to **GoCursor AI**.
- AI will assist with code scaffolding, UI components, API integration, and deployment.
- Design can be done using Figma or GoCursor.

## 💰 Budget & Infrastructure
- Initial MVP can be built under ₹1000 or even **completely free**:
  - Free hosting (Netlify/Vercel)
  - Free database (Supabase/Firebase)
  - Free tiers for tools and APIs
  - Only potential cost is domain name (₹800–₹1200/year)

## ✅ MVP Feature Checklist
- [ ] Landing Page (info + CTA to create registry)
- [ ] Create Registry Page
- [ ] Add Gift Items (manual + URL)
- [ ] Shareable Public Registry View
- [ ] Group Gifting and Contributions
- [ ] QR Code Generator
- [ ] Registry Management for user
- [ ] Optional privacy settings

## 🧠 Future Thoughts
- Enable registry suggestions using AI.
- Partner with local Indian e-commerce sites.
- Add local language support.
- Build native mobile apps (after validating web app).
- Partner with event organizers/invitation platforms.

---

> **Use this file in Cursor AI to guide code generation and project planning.**

