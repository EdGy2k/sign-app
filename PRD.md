# Security Fixes PRD

**Project:** Sign App
**Date:** 2026-01-21
**Priority:** Critical security vulnerabilities identified during code review

---

## Overview

This document outlines 12 security vulnerabilities discovered during a security audit, with detailed requirements for remediation. Issues are prioritized by severity.

---

# CRITICAL ISSUES

## SEC-001: Email Subject Line XSS Vulnerability

### Problem
Email subject lines contain unescaped user-controlled content. Email clients may render subjects as HTML, enabling XSS attacks.

### Affected Files
- `convex/email.ts` (Lines 238, 278, 317)

### Current Code
```typescript
subject: `${recipient.senderName} sent you a document to sign`,
subject: `Document "${documentData.title}" has been signed by all parties`,
subject: `Reminder: Please sign "${recipient.documentTitle}"`,
```

### Requirements
1. Apply `escapeHtml()` function to all user-generated content in email subjects
2. Affected fields: `senderName`, `documentTitle`, `recipientName`
3. Use the existing `escapeHtml()` function already defined in the file

### Acceptance Criteria
- [x] All email subjects escape user content
- [x] Malicious input like `<script>alert('XSS')</script>` renders as plain text
- [x] Email subjects display correctly with escaped characters

### Implementation
```typescript
subject: `${escapeHtml(recipient.senderName)} sent you a document to sign`,
subject: `Document "${escapeHtml(documentData.title)}" has been signed by all parties`,
subject: `Reminder: Please sign "${escapeHtml(recipient.documentTitle)}"`,
```

---

## SEC-002: Storage Access Control Bypass

### Problem
The `getUrl` query allows ANY authenticated user to retrieve URLs for ANY storage ID, bypassing document ownership checks.

### Affected Files
- `convex/storage.ts` (Lines 16-23)

### Current Code
```typescript
export const getUrl = query({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, { storageId }) => {
    return await ctx.storage.getUrl(storageId);
  },
});
```

### Requirements
1. **Option A (Recommended):** Remove the `getUrl` query entirely
   - Storage URLs should be retrieved through document-specific queries that validate ownership
2. **Option B:** Add ownership validation
   - Check if the storage ID belongs to a document owned by the requesting user
   - Check if the storage ID belongs to a template owned by the requesting user

### Acceptance Criteria
- [x] Users cannot access files they don't own
- [x] Attempting to access another user's file returns an error
- [x] Legitimate file access still works through document queries

### Implementation (Option A - Remove)
```typescript
// Delete the getUrl query entirely
// Access storage URLs through document.get or template.get which validate ownership
```

### Implementation (Option B - Add Validation)
```typescript
export const getUrl = query({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, { storageId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Check document ownership
    const document = await ctx.db
      .query("documents")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .filter((q) =>
        q.or(
          q.eq(q.field("originalPdfStorageId"), storageId),
          q.eq(q.field("signedPdfStorageId"), storageId)
        )
      )
      .first();

    // Check template ownership
    const template = await ctx.db
      .query("templates")
      .filter((q) =>
        q.and(
          q.eq(q.field("pdfStorageId"), storageId),
          q.or(
            q.eq(q.field("isSystemTemplate"), true),
            q.eq(q.field("ownerId"), user._id)
          )
        )
      )
      .first();

    // Check logo ownership
    const isUserLogo = user.logoStorageId === storageId;

    if (!document && !template && !isUserLogo) {
      throw new Error("Not authorized to access this file");
    }

    return await ctx.storage.getUrl(storageId);
  },
});
```

---

## SEC-003: No File Upload Validation

### Problem
The `generateUploadUrl` mutation has no file type, size, or content validation. Users can upload malware, oversized files, or non-PDF content.

### Affected Files
- `convex/storage.ts` (Lines 4-13)

### Current Code
```typescript
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    return await ctx.storage.generateUploadUrl();
  },
});
```

### Requirements
1. Add rate limiting: Max 10 uploads per hour per user
2. Create a post-upload validation action that:
   - Validates file size (max 10MB)
   - Validates content type (application/pdf only)
   - Validates PDF magic bytes (%PDF signature)
   - Deletes invalid files immediately
3. Require validation before file can be used in documents

### Acceptance Criteria
- [x] Files larger than 10MB are rejected and deleted
- [x] Non-PDF files are rejected and deleted
- [x] Files without valid PDF signature are rejected
- [x] Rate limiting prevents upload spam
- [x] Valid PDF files upload successfully

### Implementation
```typescript
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Rate limiting: max 10 uploads per hour
    const oneHourAgo = Date.now() - 3600000;
    const recentDocs = await ctx.db
      .query("documents")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .filter((q) => q.gte(q.field("createdAt"), oneHourAgo))
      .collect();

    if (recentDocs.length >= 10) {
      throw new Error("Upload rate limit exceeded. Try again later.");
    }

    return await ctx.storage.generateUploadUrl();
  },
});

export const validateUploadedFile = action({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, { storageId }) => {
    const url = await ctx.storage.getUrl(storageId);
    if (!url) {
      throw new Error("File not found");
    }

    const response = await fetch(url);

    // Check size (max 10MB)
    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
      await ctx.storage.delete(storageId);
      throw new Error("File too large. Maximum size is 10MB.");
    }

    // Check content type
    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/pdf")) {
      await ctx.storage.delete(storageId);
      throw new Error("Only PDF files are allowed.");
    }

    // Check PDF magic bytes
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const isPDF =
      bytes[0] === 0x25 && // %
      bytes[1] === 0x50 && // P
      bytes[2] === 0x44 && // D
      bytes[3] === 0x46;   // F

    if (!isPDF) {
      await ctx.storage.delete(storageId);
      throw new Error("Invalid PDF file.");
    }

    return { valid: true, size: buffer.byteLength };
  },
});
```

---

# IMPORTANT ISSUES

## SEC-004: Webhook Signature Verification Bypass

### Problem
Webhook handler skips signature verification if `POLAR_WEBHOOK_SECRET` is not set, allowing attackers to forge subscription events.

### Affected Files
- `convex/http.ts` (Lines 55-67)

### Current Code
```typescript
if (webhookSecret) {
  const wh = new Webhook(webhookSecret);
  payload = wh.verify(body, webhookHeaders) as PolarWebhookPayload;
} else {
  console.warn("POLAR_WEBHOOK_SECRET not set, skipping signature verification");
  payload = JSON.parse(body) as PolarWebhookPayload;
}
```

### Requirements
1. Always require webhook secret to be configured
2. Return 503 Service Unavailable if secret is not set
3. Never process unverified webhooks in production

### Acceptance Criteria
- [x] Webhooks fail with 503 if secret not configured
- [x] Forged webhooks without valid signature are rejected with 401
- [x] Valid webhooks from Polar are processed correctly

### Implementation
```typescript
const webhookSecret = getWebhookSecret();
if (!webhookSecret) {
  console.error("POLAR_WEBHOOK_SECRET not configured - rejecting webhook");
  return new Response("Webhook endpoint not configured", { status: 503 });
}

try {
  const wh = new Webhook(webhookSecret);
  payload = wh.verify(body, webhookHeaders) as PolarWebhookPayload;
} catch (error) {
  console.error("Webhook verification failed:", error);
  return new Response("Webhook verification failed", { status: 401 });
}
```

---

## SEC-005: Magic Link Token Weak Randomness

### Problem
Access tokens use `crypto.randomUUID()` which is designed for uniqueness, not cryptographic security.

### Affected Files
- `convex/documents.ts` (Line 253)

### Current Code
```typescript
const accessToken = crypto.randomUUID();
```

### Requirements
1. Generate 256-bit cryptographically secure random tokens
2. Use hex encoding for URL-safe representation
3. Resulting token should be 64 characters

### Acceptance Criteria
- [x] Tokens are 64 hex characters (256 bits)
- [x] Tokens are generated using crypto.getRandomValues
- [x] Existing magic link functionality works with new tokens

### Implementation
```typescript
function generateSecureToken(): string {
  const array = new Uint8Array(32); // 256 bits
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

// Usage
const accessToken = generateSecureToken();
```

---

## SEC-006: Missing Access Token Expiration

### Problem
Magic link access tokens never expire independently. Even after a document expires, tokens remain valid in the database.

### Affected Files
- `convex/schema.ts` (recipients table)
- `convex/documents.ts` (send mutation)
- `convex/signing.ts` (token validation)

### Requirements
1. Add `tokenExpiresAt` field to recipients table
2. Set token expiration when creating recipient (same as document expiration)
3. Validate token expiration in signing queries/mutations
4. Return clear error when token is expired

### Acceptance Criteria
- [x] Schema includes tokenExpiresAt field
- [x] Recipients created with expiration timestamp
- [x] Expired tokens are rejected with clear message
- [x] Non-expired tokens work normally

### Implementation

**Schema change:**
```typescript
recipients: defineTable({
  // ... existing fields
  tokenExpiresAt: v.number(),
})
```

**Documents.ts - send mutation:**
```typescript
const recipientId = await ctx.db.insert("recipients", {
  documentId: id,
  email: recipient.email,
  name: recipient.name,
  role: recipient.role,
  order: recipient.order,
  status: "pending",
  accessToken,
  tokenExpiresAt: expiresAt, // Same as document expiration
});
```

**Signing.ts - validation:**
```typescript
if (recipient.tokenExpiresAt && recipient.tokenExpiresAt < Date.now()) {
  throw new Error("This signing link has expired");
}
```

---

## SEC-007: User Name Input Not Validated

### Problem
The `updateProfile` mutation accepts any string for name without length or content validation.

### Affected Files
- `convex/users.ts` (Lines 100-123)

### Requirements
1. Trim whitespace from name
2. Validate name is not empty
3. Validate name is max 100 characters
4. Validate name contains only allowed characters (letters, numbers, spaces, hyphens, apostrophes, periods)

### Acceptance Criteria
- [x] Empty names are rejected
- [x] Names over 100 characters are rejected
- [x] Names with invalid characters are rejected
- [x] Valid names are saved correctly (trimmed)

### Implementation
```typescript
export const updateProfile = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, { name }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const trimmedName = name.trim();

    if (trimmedName.length === 0) {
      throw new Error("Name cannot be empty");
    }

    if (trimmedName.length > 100) {
      throw new Error("Name too long (max 100 characters)");
    }

    if (!/^[\p{L}\p{N}\s\-'.]+$/u.test(trimmedName)) {
      throw new Error("Name contains invalid characters");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, { name: trimmedName });
    return { success: true };
  },
});
```

---

## SEC-008: Signature Data Size Unbounded

### Problem
While individual signatures have a 100KB limit, there's no limit on total signature data per recipient.

### Affected Files
- `convex/signing.ts` (submitSignature mutation)

### Requirements
1. Keep existing 100KB per-signature limit
2. Add 500KB total limit for all signatures per recipient
3. Calculate total size after adding new signature
4. Reject if total exceeds limit

### Acceptance Criteria
- [x] Individual signatures over 100KB are rejected
- [x] Total signature data over 500KB per recipient is rejected
- [x] Normal signing flow works within limits

### Implementation
```typescript
// After parsing existing signature data
signatureData[fieldId] = signatureValue;

const totalSize = JSON.stringify(signatureData).length;
if (totalSize > 500000) {
  throw new Error("Total signature data exceeds limit (500KB)");
}
```

---

# MINOR ISSUES

## SEC-009: PDF Audit Trail Injection

### Problem
User-controlled data is directly embedded into PDF audit trails without sanitization.

### Affected Files
- `convex/pdfGeneration.ts` (Lines 197-282)

### Requirements
1. Create sanitization function for PDF text
2. Remove control characters (newlines, tabs)
3. Remove non-printable characters
4. Limit text length to 200 characters
5. Apply to all user-controlled fields in audit trail

### Acceptance Criteria
- [x] Control characters are stripped from PDF text
- [x] Long inputs are truncated
- [x] Audit trail renders correctly with sanitized content

### Implementation
```typescript
function sanitizePdfText(text: string, maxLength: number = 200): string {
  return text
    .replace(/[\r\n\t]/g, " ")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "")
    .substring(0, maxLength)
    .trim();
}

// Usage
currentPage.drawText(`Document: ${sanitizePdfText(document.title)}`, { ... });
currentPage.drawText(`Actor: ${sanitizePdfText(entry.actorEmail)}`, { ... });
```

---

## SEC-010: No Rate Limiting on Reminders

### Problem
Users can spam recipients with unlimited reminder emails.

### Affected Files
- `convex/documents.ts` (resendReminder mutation)

### Requirements
1. Limit to 3 reminders per recipient per hour
2. Track reminders in audit log with "reminder_sent" event
3. Check recent reminders before sending
4. Return clear error when rate limited

### Acceptance Criteria
- [x] 4th reminder within an hour is rejected
- [x] Reminders are logged in audit trail
- [x] Rate limit resets after 1 hour

### Implementation
```typescript
// Check rate limit
const oneHourAgo = Date.now() - 3600000;
const recentReminders = await ctx.db
  .query("auditLog")
  .withIndex("by_document", (q) => q.eq("documentId", documentId))
  .filter((q) =>
    q.and(
      q.eq(q.field("event"), "reminder_sent"),
      q.eq(q.field("actorEmail"), recipientEmail),
      q.gte(q.field("timestamp"), oneHourAgo)
    )
  )
  .collect();

if (recentReminders.length >= 3) {
  throw new Error("Reminder limit reached. Maximum 3 reminders per hour.");
}
```

**Note:** Requires adding "reminder_sent" to the event union in schema.

---

## SEC-011: System Templates Publicly Accessible

### Problem
The `listSystem` query requires no authentication, exposing template metadata.

### Affected Files
- `convex/templates.ts` (Lines 4-12)

### Requirements
1. Decide: Should templates be public for marketing/browsing?
2. If no: Add authentication requirement
3. If yes: Document this as intentional behavior

### Acceptance Criteria
- [x] Decision documented
- [x] If private: Unauthenticated requests rejected
- [x] If public: No change needed (document decision)

### Implementation (if making private)
```typescript
export const listSystem = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    return await ctx.db
      .query("templates")
      .withIndex("by_system_template", (q) => q.eq("isSystemTemplate", true))
      .collect();
  },
});
```

---

## SEC-012: Document Title and Recipient Inputs Not Validated

### Problem
Document creation and sending accept arbitrary strings without validation.

### Affected Files
- `convex/documents.ts` (create and send mutations)

### Requirements

**Document title:**
1. Trim whitespace
2. Validate not empty
3. Max 200 characters

**Recipient email:**
1. Validate email format with regex
2. Max 254 characters (RFC 5321)

**Recipient name:**
1. Trim whitespace
2. Validate not empty
3. Max 100 characters

### Acceptance Criteria
- [x] Empty titles rejected
- [x] Titles over 200 chars rejected
- [x] Invalid emails rejected
- [x] Empty recipient names rejected
- [x] Recipient names over 100 chars rejected

### Implementation
```typescript
// Title validation
const trimmedTitle = args.title.trim();
if (trimmedTitle.length === 0) {
  throw new Error("Document title cannot be empty");
}
if (trimmedTitle.length > 200) {
  throw new Error("Document title too long (max 200 characters)");
}

// Recipient validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
for (const recipient of recipients) {
  if (!emailRegex.test(recipient.email)) {
    throw new Error(`Invalid email address: ${recipient.email}`);
  }
  if (recipient.email.length > 254) {
    throw new Error("Email address too long");
  }

  const trimmedName = recipient.name.trim();
  if (trimmedName.length === 0) {
    throw new Error("Recipient name cannot be empty");
  }
  if (trimmedName.length > 100) {
    throw new Error("Recipient name too long (max 100 characters)");
  }
}
```

---

# Implementation Priority

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| 1 | SEC-001: Email XSS | Low | Critical |
| 2 | SEC-002: Storage bypass | Medium | Critical |
| 3 | SEC-003: Upload validation | Medium | Critical |
| 4 | SEC-004: Webhook bypass | Low | High |
| 5 | SEC-005: Weak tokens | Low | Medium |
| 6 | SEC-006: Token expiration | Medium | High |
| 7 | SEC-007: Name validation | Low | Medium |
| 8 | SEC-008: Signature size | Low | Medium |
| 9 | SEC-009: PDF injection | Low | Low |
| 10 | SEC-010: Reminder rate limit | Low | Low |
| 11 | SEC-011: Template auth | Low | Low |
| 12 | SEC-012: Input validation | Low | Low |

---

# Testing Requirements

For each fix, verify:
1. **Positive test:** Valid input works correctly
2. **Negative test:** Invalid input is rejected with clear error
3. **Boundary test:** Edge cases at limits work correctly
4. **Regression test:** Existing functionality unaffected
