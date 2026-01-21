# Frontend Specification: Freelancer Contract & E-Sign App

## Overview

A web application for freelancers to send contracts, NDAs, and proposals for electronic signature. Clean, professional UI that works on desktop and mobile.

---

## Stack

| Technology | Purpose |
|------------|---------|
| Next.js 14+ | App Router, Server Components |
| TypeScript | Strict mode enabled |
| Tailwind CSS | Styling |
| shadcn/ui | Component library |
| Convex | Backend client (React hooks provided) |
| Clerk | Authentication (@clerk/nextjs) |
| react-pdf or pdf.js | PDF viewing |

---

## Design Direction

- Clean, modern, minimal
- Light mode only for MVP
- Mobile-responsive (signing flow MUST work on mobile)
- Professional feel - freelancers will show this to clients
- No emojis in UI

### Design Tokens (Tailwind)

Use shadcn/ui defaults. Key semantic colors:

```
Primary: Blue (trust, professional)
Success: Green (signed, complete)
Warning: Yellow (pending, expiring soon)
Danger: Red (expired, voided)
Neutral: Gray (borders, secondary text)
```

---

## Pages & Routes

### Public Routes

```
/
├── Landing/marketing page
├── Hero: "Contracts & E-Signatures for Freelancers"
├── Features section (3-4 key features)
├── Pricing section (USD/EUR based on geo-detection)
├── CTA buttons: "Start Free" → /sign-up
└── Footer with links

/pricing
├── Free vs Pro comparison table
├── Currency toggle (USD/EUR) or auto-detect via IP
├── "Start Free" and "Upgrade to Pro" buttons
└── FAQ section

/sign-up → Clerk sign-up component
/sign-in → Clerk sign-in component

/sign/[token] (PUBLIC - no auth required)
├── Document viewer with signature fields highlighted
├── Recipient sees fields assigned to them
├── Click field → signature modal (draw or type)
├── "Complete Signing" button
├── Success page after signing
└── Mobile-optimized
```

### Protected Routes (auth required)

```
/dashboard
├── Stats cards: Documents sent / signed / pending this month
├── Recent documents list (last 5-10)
├── Quick action buttons: "New Document", "Browse Templates"
└── Upgrade prompt if on free tier and approaching limit

/templates
├── Two tabs: "Template Library" | "My Templates"
├── Grid of template cards with preview thumbnail
├── Search/filter by category
├── Click card → /templates/[id]
└── "Upload Custom Template" button

/templates/[id]
├── Full template preview (PDF viewer)
├── Template details (name, description, fields, variables)
├── "Use This Template" button → /documents/new?template=[id]
├── For user's own templates: Edit and Delete buttons
└── "Clone to My Templates" for system templates

/documents/new
├── Multi-step form wizard:
│   ├── Step 1: Choose template OR upload PDF
│   ├── Step 2: Fill in variables (dynamic form from template.variables)
│   ├── Step 3: Add/adjust fields (drag-drop editor) - if custom upload or modifications needed
│   ├── Step 4: Add recipients (name, email, signing order)
│   └── Step 5: Review & Send
├── Progress indicator
├── Save as draft functionality
└── Preview before sending

/documents
├── List/table view of all documents
├── Filters: All | Draft | Pending | Completed | Expired | Voided
├── Search by title or recipient
├── Columns: Title, Recipients, Status, Created, Last Activity
├── Click row → /documents/[id]
└── Pagination if needed

/documents/[id]
├── Document viewer (PDF with signatures if signed)
├── Status timeline (created → sent → viewed → signed)
├── Recipient list with individual statuses
├── Actions: Resend Reminder, Void Document, Download PDF
├── Audit log (expandable)
└── Share link for recipients

/settings
├── Profile tab: Name, email (from Clerk)
├── Branding tab: Logo upload (Pro only, show upgrade prompt if free)
├── Billing tab: Current plan, usage stats, "Manage Subscription" → Stripe portal
└── Subscription status display
```

---

## Key Components

### Layout Components

```
DashboardLayout
├── Sidebar navigation (collapsible on mobile)
│   ├── Logo
│   ├── Nav items: Dashboard, Documents, Templates, Settings
│   └── User menu at bottom
├── Header with page title
└── Main content area

PublicLayout
├── Header with logo and nav (Pricing, Sign In, Sign Up)
├── Main content
└── Footer

AuthLayout
├── Centered card layout
├── Logo above
└── Clerk auth components inside
```

### Document Editor Components

```
TemplateSelector
├── Grid of template cards
├── Category filters
├── Search input
├── "Upload Custom" option
└── Returns selected templateId

VariableForm
├── Dynamically generated from template.variables[]
├── Each variable renders appropriate input (text, date, textarea)
├── Validation based on variable.required
├── Auto-save draft as user types
└── Props: variables[], values, onChange

FieldEditor
├── PDF preview as background
├── Draggable field overlays (signature, date, text, initials, checkbox)
├── Field properties panel (type, assignee, required)
├── Add new field button
├── Delete field on selection
├── Zoom controls
└── Props: pdfUrl, fields[], onChange

RecipientInput
├── Add multiple recipients
├── Fields: Name, Email, Role (signer/cc)
├── Drag to reorder (for signing sequence)
├── Assign fields to recipients
├── Remove recipient button
└── Props: recipients[], onChange

DocumentPreview
├── Full PDF preview
├── Shows filled variables
├── Shows field placements with assignee indicators
├── "Send" or "Back to Edit" actions
└── Props: document draft data
```

### Signing Flow Components

```
SigningView
├── Full-page document viewer
├── Highlights fields assigned to current signer
├── Click field → opens SignatureModal
├── Progress indicator (X of Y fields completed)
├── "Complete Signing" button (enabled when all required fields done)
├── Mobile-optimized scrolling and zooming
└── Props: document, recipient, fields[]

SignatureModal
├── Two tabs: "Draw" | "Type"
├── Draw: Canvas for finger/mouse drawing
├── Type: Text input with signature-style fonts (3-4 options)
├── Clear button
├── Preview of signature
├── "Apply" and "Cancel" buttons
└── Returns signature data (base64 image)

SignatureField (on PDF overlay)
├── Clickable hotspot positioned on PDF
├── Shows placeholder when empty: "Click to sign"
├── Shows signature preview when filled
├── Highlighted border for current signer's fields
├── Different styling for required vs optional
└── Props: field, value, onClick, isCurrentSigner

SigningComplete
├── Success message with checkmark
├── "Your signed document will be emailed to you"
├── Download signed PDF button
├── "Are you a freelancer?" CTA to sign up
└── Props: document title
```

### Common Components

```
PdfViewer
├── Renders PDF pages
├── Page navigation
├── Zoom controls
├── Loading state
├── Error handling
└── Props: url or storageId, onLoad

StatusBadge
├── Pill-shaped badge
├── Colors: gray (draft), blue (sent), yellow (pending), green (signed), red (expired/voided)
└── Props: status

PricingCard
├── Plan name and price
├── Feature list with checkmarks
├── CTA button
├── "Popular" badge option
└── Props: plan, price, currency, features[], cta, highlighted

UpgradePrompt
├── Modal or inline banner
├── Message about limit reached or Pro feature
├── Feature comparison snippet
├── "Upgrade Now" button
└── Props: reason, onUpgrade, onDismiss

EmptyState
├── Illustration or icon
├── Message
├── CTA button
└── Props: icon, title, description, action

LoadingState
├── Skeleton loaders matching content shape
└── Spinner for actions
```

---

## Convex API Contract

The backend exposes these functions. Use Convex React hooks to call them.

### Templates

```typescript
// Queries
api.templates.listSystem()
// Returns: Template[]

api.templates.listMine()
// Returns: Template[]

api.templates.get({ id })
// Returns: Template | null

// Mutations
api.templates.createCustom({
  name: string,
  pdfStorageId: string,
  fields: Field[],
  variables: Variable[]
})
// Returns: templateId

api.templates.update({
  id: string,
  name?: string,
  fields?: Field[],
  variables?: Variable[]
})
// Returns: void

api.templates.delete({ id: string })
// Returns: void
```

### Documents

```typescript
// Queries
api.documents.list({ status?: string })
// Returns: Document[]

api.documents.get({ id: string })
// Returns: { document: Document, recipients: Recipient[], auditLog: AuditEntry[] }

api.documents.getByToken({ token: string })
// Returns: { document: Document, recipient: Recipient, fields: Field[] }
// Used for public signing page

// Mutations
api.documents.create({
  templateId?: string,
  title: string,
  variableValues: Record<string, string>,
  fields: Field[],
  recipients: { name: string, email: string, role: 'signer' | 'cc', order: number }[]
})
// Returns: documentId

api.documents.send({ id: string })
// Returns: void

api.documents.void({ id: string, reason?: string })
// Returns: void

api.documents.resendReminder({ id: string, recipientId: string })
// Returns: void
```

### Signing (Public)

```typescript
// Mutations - no auth required, validated by token
api.signing.markViewed({ token: string })
// Returns: void

api.signing.submitSignature({
  token: string,
  fieldId: string,
  signatureData: string // base64 image
})
// Returns: void

api.signing.complete({ token: string })
// Returns: { downloadUrl: string }
```

### Users

```typescript
// Queries
api.users.me()
// Returns: { user: User, usage: { docsThisMonth: number, limit: number } }

// Mutations
api.users.updateProfile({ name: string })
// Returns: void

api.users.uploadLogo({ storageId: string })
// Returns: void
```

### Billing

```typescript
// Mutations
api.billing.createCheckoutSession({
  priceId: string,
  currency: 'usd' | 'eur'
})
// Returns: { url: string }

api.billing.createPortalSession()
// Returns: { url: string }
```

### Storage

```typescript
// Mutations
api.storage.generateUploadUrl()
// Returns: string (presigned upload URL)
```

---

## Type Definitions

```typescript
interface User {
  id: string
  email: string
  name: string
  plan: 'free' | 'pro'
  logoStorageId?: string
  subscriptionStatus: 'active' | 'past_due' | 'cancelled' | 'none'
  planExpiresAt?: number
}

interface Template {
  id: string
  name: string
  description: string
  category: 'contract' | 'nda' | 'proposal' | 'invoice' | 'other'
  isSystemTemplate: boolean
  ownerId?: string
  pdfStorageId: string
  fields: Field[]
  variables: Variable[]
}

interface Field {
  id: string
  type: 'signature' | 'date' | 'text' | 'initials' | 'checkbox'
  label: string
  x: number
  y: number
  width: number
  height: number
  page: number
  assignedTo: 'sender' | 'recipient' | 'recipient_2' | 'recipient_3'
  required: boolean
}

interface Variable {
  name: string
  label: string
  type: 'text' | 'date' | 'textarea'
  defaultValue?: string
  required: boolean
}

interface Document {
  id: string
  ownerId: string
  templateId?: string
  title: string
  status: 'draft' | 'sent' | 'viewed' | 'signed' | 'expired' | 'voided'
  originalPdfStorageId: string
  signedPdfStorageId?: string
  variableValues: Record<string, string>
  fields: Field[]
  createdAt: number
  sentAt?: number
  completedAt?: number
  expiresAt?: number
  voidedReason?: string
}

interface Recipient {
  id: string
  documentId: string
  email: string
  name: string
  role: 'signer' | 'cc'
  order: number
  status: 'pending' | 'viewed' | 'signed'
  signedAt?: number
  accessToken: string
}

interface AuditEntry {
  id: string
  documentId: string
  event: 'created' | 'sent' | 'viewed' | 'signed' | 'voided' | 'downloaded'
  actorEmail: string
  ipAddress: string
  userAgent: string
  timestamp: number
}
```

---

## State Management

**Convex handles server state:**
```typescript
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'

// Auto-updates when data changes
const documents = useQuery(api.documents.list)

// For mutations
const createDoc = useMutation(api.documents.create)
await createDoc({ title: 'My Contract', ... })
```

**Local UI state (React):**
- Form wizard step: `useState`
- Modal open/close: `useState`
- Draft form data: `useState` or `useReducer`
- Field editor selection: `useState`

No Redux/Zustand needed.

---

## Authentication

Clerk handles everything:

```typescript
// Middleware (middleware.ts)
import { clerkMiddleware } from '@clerk/nextjs/server'
export default clerkMiddleware()

// Protect server components
import { auth } from '@clerk/nextjs/server'

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  // ...
}

// Client components
import { useUser, SignedIn, SignedOut } from '@clerk/nextjs'

function Header() {
  return (
    <>
      <SignedIn>
        <UserButton />
      </SignedIn>
      <SignedOut>
        <Link href="/sign-in">Sign In</Link>
      </SignedOut>
    </>
  )
}
```

---

## Mobile Requirements

The signing flow (`/sign/[token]`) MUST be mobile-friendly:

- [ ] PDF viewer scrollable and zoomable (pinch-to-zoom)
- [ ] Signature fields clearly visible and tappable (min 44x44px touch target)
- [ ] Signature modal works with finger drawing on touch screens
- [ ] Buttons large enough for touch (min 44px height)
- [ ] No horizontal scroll on any screen size
- [ ] Test on iOS Safari and Android Chrome

---

## Geo-Detection for Pricing

Detect user region for currency display:

```typescript
// In Next.js API route or middleware
function getCurrency(request: Request): 'usd' | 'eur' {
  // Vercel provides geo headers
  const country = request.headers.get('x-vercel-ip-country') || ''

  const EU_COUNTRIES = [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
    'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
    'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
  ]

  return EU_COUNTRIES.includes(country) ? 'eur' : 'usd'
}
```

Display on pricing page:
- Auto-detect and show appropriate currency
- Allow manual toggle for users who prefer the other currency

---

## What You Can Build Immediately

These don't depend on backend being complete:

1. **Project setup** - Next.js, Tailwind, shadcn/ui, folder structure
2. **Layout components** - DashboardLayout, PublicLayout, AuthLayout
3. **Landing page** - Full marketing page with pricing
4. **Clerk integration** - Sign in, sign up, user button
5. **Static UI shells** - Dashboard, documents list, templates grid (with mock data)
6. **PdfViewer component** - Using react-pdf
7. **SignatureModal component** - Draw/type signature capture
8. **FieldEditor component** - Drag-drop field positioning (can test with static PDF)

## Must Wait for Backend

- Actual Convex queries/mutations (schema must be deployed first)
- Document creation flow (needs backend validation)
- Signing flow (needs magic link generation and validation)
- Stripe checkout (needs backend checkout session creation)

---

## File Structure Suggestion

```
src/
├── app/
│   ├── (public)/
│   │   ├── page.tsx (landing)
│   │   ├── pricing/page.tsx
│   │   └── sign/[token]/page.tsx
│   ├── (auth)/
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   └── sign-up/[[...sign-up]]/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx (DashboardLayout)
│   │   ├── dashboard/page.tsx
│   │   ├── documents/
│   │   │   ├── page.tsx (list)
│   │   │   ├── new/page.tsx (wizard)
│   │   │   └── [id]/page.tsx (detail)
│   │   ├── templates/
│   │   │   ├── page.tsx (list)
│   │   │   └── [id]/page.tsx (detail)
│   │   └── settings/page.tsx
│   ├── layout.tsx (root)
│   └── globals.css
├── components/
│   ├── ui/ (shadcn components)
│   ├── layout/
│   │   ├── dashboard-layout.tsx
│   │   ├── public-layout.tsx
│   │   └── sidebar.tsx
│   ├── documents/
│   │   ├── document-list.tsx
│   │   ├── document-card.tsx
│   │   ├── status-badge.tsx
│   │   └── document-wizard/
│   │       ├── template-selector.tsx
│   │       ├── variable-form.tsx
│   │       ├── field-editor.tsx
│   │       ├── recipient-input.tsx
│   │       └── document-preview.tsx
│   ├── templates/
│   │   ├── template-grid.tsx
│   │   └── template-card.tsx
│   ├── signing/
│   │   ├── signing-view.tsx
│   │   ├── signature-modal.tsx
│   │   ├── signature-field.tsx
│   │   └── signing-complete.tsx
│   ├── pdf/
│   │   └── pdf-viewer.tsx
│   └── common/
│       ├── empty-state.tsx
│       ├── loading-state.tsx
│       ├── upgrade-prompt.tsx
│       └── pricing-card.tsx
├── lib/
│   ├── utils.ts
│   └── geo.ts (currency detection)
├── convex/
│   └── _generated/ (auto-generated by Convex)
└── types/
    └── index.ts (shared types)
```

---

## Questions?

If anything is unclear, check with the backend agent or ask before assuming.
