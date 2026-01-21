# Design Document: Freelancer Contract & E-Sign App

**Date:** 2026-01-19
**Status:** Approved for implementation

---

## Overview

A verticalized e-signature SaaS for freelancers. Offers contract templates and simple e-signing at $15/mo, undercutting Bonsai ($24) and HoneyBook ($19+).

**Target users:** Freelancers, contractors, creatives (photographers, designers, developers, writers, consultants)

**Core value prop:** "Free contract templates + e-signatures. No bloat, no BS."

---

## Technical Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14+ (App Router), TypeScript, Tailwind, shadcn/ui |
| Backend | Convex (database, functions, file storage) |
| Auth | Clerk |
| PDF | pdf-lib (open source) |
| Email | Resend |
| Payments | Stripe |
| Hosting | Vercel |

---

## Pricing

| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | 3 docs/month, branding on signature page |
| Pro | $15/mo USD / €14/mo EUR | Unlimited docs, no branding, custom templates, auto-reminders, logo upload |
| Pro Yearly | $144/yr USD / €134/yr EUR | Same as Pro, 20% savings |

---

## Data Model

### users
- id, email, name, clerkId
- plan (free | pro)
- subscriptionStatus (active | past_due | cancelled | none)
- planExpiresAt, stripeCustomerId
- logoStorageId (nullable)
- billingCycleStart, createdAt

### templates
- id, name, description, category
- isSystemTemplate, ownerId
- pdfStorageId
- fields[] (type, label, x, y, width, height, page, assignedTo, required)
- variables[] (name, label, type, defaultValue, required)

### documents
- id, ownerId, templateId, title
- status (draft | sent | viewed | signed | expired | voided)
- originalPdfStorageId, signedPdfStorageId
- variableValues {}, fields[]
- createdAt, sentAt, completedAt, expiresAt
- voidedReason (nullable)

### recipients
- id, documentId, email, name
- role (signer | cc), order
- status (pending | viewed | signed)
- signedAt, signatureData
- accessToken (for magic link)
- ipAddress, userAgent

### auditLog
- id, documentId
- event (created | sent | viewed | signed | voided | downloaded)
- actorEmail, ipAddress, userAgent, timestamp

---

## Core Flows

### Document Creation
1. User picks template or uploads PDF
2. Fills in variables via form
3. Positions fields (pre-placed for templates, drag-drop for custom)
4. Adds recipients
5. Reviews and sends

### Signing (Recipient)
1. Receives email with magic link
2. Views document (no login required)
3. Clicks signature fields, draws or types signature
4. Completes signing
5. Both parties receive final PDF

### Monetization
- Free tier: 3 docs/month, query-based counting
- Upgrade prompts on: limit hit, branding removal, custom templates
- Stripe Checkout for payment, Customer Portal for management
- Webhooks update user plan status

---

## MVP Scope

### Phase 1: Backend (This agent)
- Convex schema and all tables
- Clerk + Convex auth integration
- Template CRUD + system templates
- Document CRUD + status management
- PDF generation with pdf-lib (variables + signatures)
- Email sending via Resend
- Magic link system
- Audit trail logging
- Stripe integration

### Phase 2: Frontend (Other agent)
- All pages per frontend-spec.md
- PDF viewer
- Signature capture
- Field editor
- Responsive design

### Phase 3: Integration
- Connect frontend to Convex
- End-to-end testing
- Polish and edge cases

---

## Files

- `frontend-spec.md` - Complete frontend specification
- `frontend-agent-prompt.md` - Prompt for frontend agent
- `convex/` - Backend schema and functions (this agent)
- `src/` - Frontend code (frontend agent)

---

## Go-to-Market

1. **SEO pages** - "[Profession] contract template" landing pages
2. **Community** - r/freelance, r/graphic_design, photography forums
3. **Content** - "Build in public" on Twitter/X
4. **Template flywheel** - Each template = SEO page + lead magnet

---

## Success Metrics

- 667 paid users at $15/mo = $10K MRR target
- Free-to-paid conversion rate
- Documents signed per user
- Churn rate
