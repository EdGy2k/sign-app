# Frontend Agent Prompt

Copy and paste everything below this line to your frontend agent:

---

## Your Task

You are building the frontend for a freelancer contract and e-signature SaaS application. Another agent is building the backend (Convex) in parallel.

**Read the full specification here:** `frontend-spec.md` in this directory.

## Stack

- Next.js 14+ (App Router)
- TypeScript (strict)
- Tailwind CSS
- shadcn/ui components
- Convex React client
- Clerk for authentication

## Directory Boundaries (IMPORTANT)

To avoid conflicts with the backend agent:

**You own these directories:**
```
src/app/          (all pages and routes)
src/components/   (all React components)
src/lib/          (frontend utilities)
src/types/        (shared TypeScript types)
public/           (static assets)
```

**Do NOT modify these directories** (backend agent owns them):
```
convex/           (backend agent creates schema and functions here)
```

**Shared files** (coordinate before modifying):
```
package.json      (you can add frontend deps, backend agent adds convex deps)
tailwind.config.js
tsconfig.json
```

## What You Can Build Now

Start with these - they don't need the backend:

1. **Project setup**
   - Initialize Next.js with TypeScript, Tailwind, App Router
   - Install and configure shadcn/ui
   - Set up Clerk (you can use placeholder env vars for now)
   - Create folder structure per the spec

2. **Layout components**
   - `DashboardLayout` with sidebar navigation
   - `PublicLayout` for marketing pages
   - Responsive mobile menu

3. **Landing page** (`/`)
   - Hero section
   - Features section
   - Pricing section (with USD/EUR display)
   - Footer

4. **Pricing page** (`/pricing`)
   - Plan comparison
   - Currency toggle

5. **Static UI shells** (use mock data)
   - Dashboard with placeholder stats
   - Documents list page
   - Templates grid page
   - Settings page structure

6. **Core components**
   - `PdfViewer` - use react-pdf to display PDFs
   - `SignatureModal` - canvas for drawing + text input for typing signatures
   - `StatusBadge` - colored pills for document status
   - `EmptyState`, `LoadingState` components

7. **Field editor prototype**
   - Drag-drop interface to position fields on a PDF
   - Can test with any sample PDF
   - This is complex - start early

## What Must Wait for Backend

Do NOT implement actual data fetching until backend agent confirms Convex is ready:

- Document creation/sending (needs `api.documents.create`)
- Template listing from database (needs `api.templates.list`)
- Signing flow with real tokens (needs `api.signing.*`)
- Stripe checkout (needs `api.billing.createCheckoutSession`)
- User profile/usage data (needs `api.users.me`)

For now, use mock data that matches the types defined in `frontend-spec.md`.

## Mock Data Example

Create a `src/lib/mock-data.ts` file:

```typescript
import { Document, Template, User } from '@/types'

export const mockUser: User = {
  id: '1',
  email: 'freelancer@example.com',
  name: 'Jane Freelancer',
  plan: 'free',
  subscriptionStatus: 'none',
}

export const mockTemplates: Template[] = [
  {
    id: '1',
    name: 'Freelance Contract',
    description: 'Standard freelance service agreement',
    category: 'contract',
    isSystemTemplate: true,
    pdfStorageId: 'mock-pdf-1',
    fields: [],
    variables: [
      { name: 'clientName', label: 'Client Name', type: 'text', required: true },
      { name: 'projectScope', label: 'Project Scope', type: 'textarea', required: true },
      { name: 'paymentAmount', label: 'Payment Amount', type: 'text', required: true },
    ],
  },
  // Add more...
]

export const mockDocuments: Document[] = [
  {
    id: '1',
    ownerId: '1',
    templateId: '1',
    title: 'Contract - Acme Corp Website Redesign',
    status: 'signed',
    originalPdfStorageId: 'mock-pdf-1',
    signedPdfStorageId: 'mock-pdf-signed-1',
    variableValues: { clientName: 'Acme Corp' },
    fields: [],
    createdAt: Date.now() - 86400000 * 7,
    sentAt: Date.now() - 86400000 * 6,
    completedAt: Date.now() - 86400000 * 5,
  },
  // Add more with different statuses...
]
```

## Integration Points

When backend is ready, you'll replace mock data with Convex hooks:

```typescript
// Before (mock)
const documents = mockDocuments

// After (real)
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'

const documents = useQuery(api.documents.list)
```

The backend agent will let you know when:
1. Convex schema is deployed (you can then run `npx convex dev` to generate types)
2. Each API function is ready to use

## Code Style

- No comments in code (self-documenting)
- No emojis in UI
- Use shadcn/ui components where possible
- Mobile-first responsive design
- Strict TypeScript (no `any`)

## Getting Started

1. Read `frontend-spec.md` thoroughly
2. Initialize the Next.js project
3. Set up the folder structure
4. Build the landing page first (good for morale + can deploy immediately)
5. Then build dashboard layout and static shells
6. Then tackle the complex components (PdfViewer, SignatureModal, FieldEditor)

## Communication

If you need something from the backend agent:
- Check if a Convex function exists in `convex/` directory
- If not, note what you need and continue with mock data

Good luck!
