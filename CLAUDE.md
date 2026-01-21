# Sign App

Freelancer-focused e-signature SaaS with contract templates at $15/mo.

## Tech Stack
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Convex (database + serverless functions)
- **Auth**: Clerk
- **Email**: Resend
- **Payments**: Polar
- **PDF**: pdf-lib, react-pdf

## Key Files
- `convex/schema.ts` - Database schema (users, templates, documents, recipients, auditLog)
- `convex/signing.ts` - Magic link signing flow
- `convex/pdfGeneration.ts` - PDF generation with embedded signatures
- `convex/billing.ts` - Polar subscription management
- `frontend-spec.md` - Frontend specification for UI implementation

## Development

```bash
npm run dev          # Start Next.js dev server
npx convex dev       # Start Convex dev server
```

## Environment Variables
```
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_ISSUER_URL=
RESEND_API_KEY=
APP_URL=
POLAR_ACCESS_TOKEN=
POLAR_WEBHOOK_SECRET=
POLAR_PRODUCT_PRO_MONTHLY_USD=
POLAR_PRODUCT_PRO_MONTHLY_EUR=
POLAR_PRODUCT_PRO_YEARLY_USD=
POLAR_PRODUCT_PRO_YEARLY_EUR=
```

## Navigator Workflow

This project uses Navigator for documentation and task management.

- **Start session**: "Start my Navigator session"
- **Documentation**: `.agent/DEVELOPMENT-README.md`
- **Tasks**: `.agent/tasks/`
- **SOPs**: `.agent/sops/`

## Code Standards

- Zero comments policy - code must be self-documenting
- Use descriptive function/variable names
- No co-authoring in commits
