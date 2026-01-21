# Backend Implementation Plan

## Context

Building the Convex backend for the Freelancer Contract & E-Sign App. Frontend is being built by a separate agent.

**Stack:** Convex, Clerk, pdf-lib, Resend, Polar

**Reference:** `docs/plans/2026-01-19-freelancer-esign-design.md`

---

## Tasks

### Task 1: Project Setup & Convex Schema

**Goal:** Initialize Convex project and define all database tables.

**Steps:**
1. Initialize npm project with TypeScript
2. Install Convex: `npm install convex`
3. Run `npx convex init`
4. Create `convex/schema.ts` with all tables:
   - users
   - templates
   - documents
   - recipients
   - auditLog
5. Deploy schema with `npx convex dev` (or `npx convex deploy`)

**Schema details (from design doc):**

```typescript
// users
{
  email: string,
  name: string,
  clerkId: string,
  plan: "free" | "pro",
  subscriptionStatus: "active" | "past_due" | "cancelled" | "none",
  planExpiresAt?: number,
  stripeCustomerId?: string,
  logoStorageId?: string,
  billingCycleStart: number,
  createdAt: number,
}

// templates
{
  name: string,
  description: string,
  category: "contract" | "nda" | "proposal" | "invoice" | "other",
  isSystemTemplate: boolean,
  ownerId?: string, // null for system templates
  pdfStorageId: string,
  fields: array of {
    id: string,
    type: "signature" | "date" | "text" | "initials" | "checkbox",
    label: string,
    x: number,
    y: number,
    width: number,
    height: number,
    page: number,
    assignedTo: "sender" | "recipient" | "recipient_2" | "recipient_3",
    required: boolean,
  },
  variables: array of {
    name: string,
    label: string,
    type: "text" | "date" | "textarea",
    defaultValue?: string,
    required: boolean,
  },
}

// documents
{
  ownerId: string,
  templateId?: string,
  title: string,
  status: "draft" | "sent" | "viewed" | "signed" | "expired" | "voided",
  originalPdfStorageId: string,
  signedPdfStorageId?: string,
  variableValues: object,
  fields: array (same structure as template fields),
  createdAt: number,
  sentAt?: number,
  completedAt?: number,
  expiresAt?: number,
  voidedReason?: string,
}

// recipients
{
  documentId: string,
  email: string,
  name: string,
  role: "signer" | "cc",
  order: number,
  status: "pending" | "viewed" | "signed",
  signedAt?: number,
  signatureData?: string,
  accessToken: string,
  ipAddress?: string,
  userAgent?: string,
}

// auditLog
{
  documentId: string,
  event: "created" | "sent" | "viewed" | "signed" | "voided" | "downloaded",
  actorEmail: string,
  ipAddress?: string,
  userAgent?: string,
  timestamp: number,
}
```

**Acceptance criteria:**
- [ ] Convex initialized and schema deployed
- [ ] All 5 tables defined with correct types
- [ ] Can run `npx convex dev` without errors

---

### Task 2: Clerk Authentication Integration

**Goal:** Set up Clerk auth with Convex.

**Steps:**
1. Install Clerk: `npm install @clerk/clerk-js`
2. Set up Clerk provider in Convex: `npm install @clerk/clerk-react` (for frontend reference)
3. Create `convex/auth.config.ts` for Clerk integration
4. Create `convex/users.ts` with:
   - `users.getOrCreate` - internal mutation to create user on first auth
   - `users.me` - query to get current user with usage stats
   - `users.updateProfile` - mutation to update name
   - `users.uploadLogo` - mutation to set logo (Pro only)
5. Create user automatically on first authenticated request

**Acceptance criteria:**
- [ ] Clerk configured in Convex
- [ ] `users.me` returns current user or creates if not exists
- [ ] `users.updateProfile` updates user name
- [ ] `users.uploadLogo` works for Pro users, rejects Free users

---

### Task 3: Template System

**Goal:** CRUD operations for templates + seed system templates.

**Steps:**
1. Create `convex/templates.ts` with:
   - `templates.listSystem` - query all system templates
   - `templates.listMine` - query user's custom templates
   - `templates.get` - get single template by ID
   - `templates.createCustom` - create user's custom template
   - `templates.update` - update user's template
   - `templates.delete` - delete user's template
2. Create `convex/seed.ts` or initial migration to seed system templates:
   - Freelance Contract
   - NDA
   - Project Proposal
   - Photography Contract
   - Web Design Contract
   (For MVP, just create the database entries with placeholder PDF storage IDs - actual PDFs added later)

**Acceptance criteria:**
- [ ] All template queries and mutations work
- [ ] System templates are seeded
- [ ] Users can only edit/delete their own templates
- [ ] Template listing respects ownership

---

### Task 4: Document CRUD & Status Management

**Goal:** Create, read, update documents and manage their lifecycle.

**Steps:**
1. Create `convex/documents.ts` with:
   - `documents.list` - list user's documents with optional status filter
   - `documents.get` - get document with recipients and audit log
   - `documents.create` - create new document (draft status)
   - `documents.send` - transition to sent, generate magic links, trigger email
   - `documents.void` - void a document with optional reason
   - `documents.resendReminder` - resend email to specific recipient
2. Create `convex/recipients.ts` with:
   - Internal mutations to create/update recipients
   - `recipients.getByToken` - get recipient by access token (for signing page)
3. Implement document expiration (30 days from sent)
4. Implement usage tracking (count docs this month for free tier)

**Acceptance criteria:**
- [ ] Documents can be created, listed, retrieved
- [ ] Status transitions work correctly
- [ ] Recipients created with documents
- [ ] Usage counting works for free tier limits
- [ ] Void functionality works with reason

---

### Task 5: Audit Trail System

**Goal:** Log all document events for legal compliance.

**Steps:**
1. Create `convex/auditLog.ts` with:
   - `auditLog.log` - internal mutation to add log entry
   - `auditLog.getForDocument` - query logs for a document
2. Integrate logging into all document actions:
   - Document created
   - Document sent
   - Document viewed (by recipient)
   - Document signed
   - Document voided
   - Document downloaded
3. Capture IP and User-Agent where available

**Acceptance criteria:**
- [ ] All document events are logged
- [ ] Logs include timestamp, actor, IP, user-agent
- [ ] Logs can be retrieved for a document

---

### Task 6: Magic Link & Signing System

**Goal:** Allow recipients to sign documents without accounts.

**Steps:**
1. Create `convex/signing.ts` with:
   - `signing.getDocumentByToken` - query document for signing page (public)
   - `signing.markViewed` - mutation when recipient opens document
   - `signing.submitSignature` - mutation to save signature for a field
   - `signing.complete` - mutation when recipient finishes signing
2. Generate secure access tokens (UUID) for each recipient
3. Validate token on all signing operations
4. Update document status when all recipients complete:
   - All signers signed → status = "signed"
5. Check expiration on token validation

**Acceptance criteria:**
- [ ] Recipients can access documents via token
- [ ] Viewing is logged
- [ ] Signatures can be submitted per field
- [ ] Completion updates document status
- [ ] Expired documents are rejected

---

### Task 7: PDF Generation with pdf-lib

**Goal:** Generate final signed PDFs with embedded signatures and audit trail.

**Steps:**
1. Install pdf-lib: `npm install pdf-lib`
2. Create `convex/pdfGeneration.ts` (internal action) with:
   - `generateFilledPdf` - fill variables into template PDF
   - `embedSignatures` - overlay signature images onto PDF
   - `appendAuditTrail` - add final page with audit certificate
   - `generateSignedPdf` - orchestrate full generation
3. Audit trail page should include:
   - Document title
   - SHA-256 hash of original document
   - Chronological event list
   - Signer details (name, email, IP, timestamp)
4. Store generated PDFs in Convex file storage

**Acceptance criteria:**
- [ ] Variables are filled into PDF
- [ ] Signatures are embedded at correct positions
- [ ] Audit trail page is appended
- [ ] Final PDF is stored and accessible

---

### Task 8: Email System with Resend

**Goal:** Send transactional emails for document workflow.

**Steps:**
1. Install Resend: `npm install resend`
2. Create `convex/email.ts` (action, not mutation - external API call) with:
   - `sendSigningRequest` - email to recipient with magic link
   - `sendSigningComplete` - email to all parties with signed PDF
   - `sendReminder` - reminder email to recipient
3. Email templates (simple HTML):
   - Signing request: "You have a document to sign from {sender}"
   - Complete: "Document signed by all parties"
   - Reminder: "Reminder: Please sign {document title}"
4. Include document title, sender name, clear CTA button

**Acceptance criteria:**
- [ ] Signing request emails sent on document.send
- [ ] Completion emails sent to all parties
- [ ] Reminder emails work
- [ ] Emails include magic links that work

---

### Task 9: Polar Integration

**Goal:** Handle payments and subscriptions via Polar.

**Steps:**
1. Install Polar SDK: `npm install @polar-sh/sdk`
2. Create Polar products/prices (via Polar dashboard):
   - Pro Monthly USD ($15)
   - Pro Monthly EUR (€14)
   - Pro Yearly USD ($144)
   - Pro Yearly EUR (€134)
3. Create `convex/billing.ts` with:
   - `billing.createCheckoutUrl` - action to generate Polar checkout URL
   - `billing.getSubscription` - query to get current subscription status
4. Create `convex/http.ts` for Polar webhooks:
   - `subscription.created` → update user to Pro
   - `subscription.updated` → update subscription status
   - `subscription.canceled` → downgrade to Free
5. Handle currency selection (USD vs EUR)

**Acceptance criteria:**
- [ ] Checkout URLs generated correctly
- [ ] Webhooks update user subscription status
- [ ] Subscription status queryable
- [ ] Both currencies work

---

### Task 10: File Storage

**Goal:** Handle PDF uploads and storage.

**Steps:**
1. Create `convex/storage.ts` with:
   - `storage.generateUploadUrl` - get presigned URL for upload
   - `storage.getUrl` - get download URL for stored file
2. Configure storage for:
   - Template PDFs
   - Uploaded custom PDFs
   - Generated signed PDFs
   - User logos

**Acceptance criteria:**
- [ ] Upload URLs are generated
- [ ] Files can be uploaded and retrieved
- [ ] URLs work for PDF viewing

---

## Task Dependencies

```
Task 1 (Schema) ─────────────────────────────────────────────┐
    │                                                        │
    v                                                        │
Task 2 (Auth) ──────────────────────────────────────┐        │
    │                                               │        │
    v                                               v        v
Task 3 (Templates)                              Task 10 (Storage)
    │                                               │
    v                                               │
Task 4 (Documents) <────────────────────────────────┘
    │
    ├──────────────────┬───────────────────┐
    v                  v                   v
Task 5 (Audit)    Task 6 (Signing)    Task 9 (Billing)
                       │
                       v
                  Task 7 (PDF Gen)
                       │
                       v
                  Task 8 (Email)
```

**Execution order:** 1 → 2 → 10 → 3 → 4 → 5, 6, 9 (parallel) → 7 → 8

---

## Notes

- All Convex functions use their auth context to get current user
- File storage IDs are Convex's `Id<"_storage">` type
- Actions (not mutations) for external API calls (Polar, Resend)
- Environment variables needed: CLERK_*, POLAR_*, RESEND_API_KEY
