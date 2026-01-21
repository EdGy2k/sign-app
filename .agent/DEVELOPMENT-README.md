# Sign App - Development Documentation

**Project**: Sign App
**Tech Stack**: Next.js, TypeScript, React, Convex, Clerk, Tailwind CSS, Radix UI, pdf-lib, Resend, Polar
**Initialized**: 2026-01-21

## Project Overview

Sign App is a freelancer-focused e-signature SaaS platform that provides contract templates and e-signing capabilities at an affordable price point. The platform targets freelancers who need professional contract management without the complexity and cost of enterprise solutions.

## Architecture

### Backend (Convex)
- **Schema**: `convex/schema.ts` - 5 tables (users, templates, documents, recipients, auditLog)
- **Authentication**: `convex/users.ts` - Clerk integration with user management
- **Templates**: `convex/templates.ts` - System and custom template management
- **Documents**: `convex/documents.ts` - Document lifecycle and status management
- **Signing**: `convex/signing.ts` - Magic link signing flow
- **PDF Generation**: `convex/pdfGeneration.ts` - Signature embedding and audit trail
- **Email**: `convex/email.ts` - Resend integration for notifications
- **Billing**: `convex/billing.ts` - Polar subscription management
- **Webhooks**: `convex/http.ts` - Polar webhook handler

### Frontend (Next.js)
- See `frontend-spec.md` for detailed frontend specification
- Uses shadcn/ui components with Radix primitives
- React-PDF for document viewing

## Key Workflows

### Document Signing Flow
1. User creates document from template
2. Document sent to recipients via email (magic link)
3. Recipients view and sign via magic link
4. PDF generated with embedded signatures
5. Completion email sent to all parties

### Subscription Flow
1. User initiates checkout via Polar
2. Webhook receives subscription confirmation
3. User upgraded to Pro plan
4. Subscription status tracked in users table

## Navigation

- **Tasks**: `.agent/tasks/` - Implementation plans
- **SOPs**: `.agent/sops/` - Standard procedures
- **System Docs**: `.agent/system/` - Architecture documentation

## Session Commands

- Start session: "Start my Navigator session"
- Create task: "Create a task for [feature]"
- Compact context: Use when approaching token limits
