import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.string(),
    clerkId: v.string(),
    plan: v.union(v.literal("free"), v.literal("pro")),
    subscriptionStatus: v.union(
      v.literal("active"),
      v.literal("past_due"),
      v.literal("cancelled"),
      v.literal("none")
    ),
    planExpiresAt: v.optional(v.number()),
    polarCustomerId: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
    billingCycleStart: v.number(),
    createdAt: v.number(),
  }).index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  templates: defineTable({
    name: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("contract"),
      v.literal("nda"),
      v.literal("proposal"),
      v.literal("invoice"),
      v.literal("other")
    ),
    isSystemTemplate: v.boolean(),
    ownerId: v.optional(v.id("users")),
    pdfStorageId: v.optional(v.id("_storage")),
    fields: v.array(
      v.object({
        id: v.string(),
        type: v.union(
          v.literal("signature"),
          v.literal("date"),
          v.literal("text"),
          v.literal("initials"),
          v.literal("checkbox")
        ),
        label: v.string(),
        x: v.number(),
        y: v.number(),
        width: v.number(),
        height: v.number(),
        page: v.number(),
        assignedTo: v.union(
          v.literal("sender"),
          v.literal("recipient"),
          v.literal("recipient_2"),
          v.literal("recipient_3")
        ),
        required: v.boolean(),
      })
    ),
    variables: v.array(
      v.object({
        name: v.string(),
        label: v.string(),
        type: v.union(
          v.literal("text"),
          v.literal("date"),
          v.literal("textarea")
        ),
        defaultValue: v.optional(v.string()),
        required: v.boolean(),
      })
    ),
  }).index("by_owner", ["ownerId"])
    .index("by_system_template", ["isSystemTemplate"])
    .index("by_category", ["category"]),

  documents: defineTable({
    ownerId: v.id("users"),
    templateId: v.optional(v.string()),
    title: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("viewed"),
      v.literal("signed"),
      v.literal("expired"),
      v.literal("voided")
    ),
    originalPdfStorageId: v.id("_storage"),
    signedPdfStorageId: v.optional(v.id("_storage")),
    variableValues: v.object({}),
    fields: v.array(
      v.object({
        id: v.string(),
        type: v.union(
          v.literal("signature"),
          v.literal("date"),
          v.literal("text"),
          v.literal("initials"),
          v.literal("checkbox")
        ),
        label: v.string(),
        x: v.number(),
        y: v.number(),
        width: v.number(),
        height: v.number(),
        page: v.number(),
        assignedTo: v.union(
          v.literal("sender"),
          v.literal("recipient"),
          v.literal("recipient_2"),
          v.literal("recipient_3")
        ),
        required: v.boolean(),
      })
    ),
    createdAt: v.number(),
    sentAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    voidedReason: v.optional(v.string()),
  }).index("by_owner", ["ownerId"])
    .index("by_template", ["templateId"])
    .index("by_status", ["status"])
    .index("by_created_at", ["createdAt"]),

  recipients: defineTable({
    documentId: v.id("documents"),
    email: v.string(),
    name: v.string(),
    role: v.union(v.literal("signer"), v.literal("cc")),
    order: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("viewed"),
      v.literal("signed")
    ),
    signedAt: v.optional(v.number()),
    signatureData: v.optional(v.string()),
    accessToken: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  }).index("by_document", ["documentId"])
    .index("by_access_token", ["accessToken"])
    .index("by_email", ["email"]),

  auditLog: defineTable({
    documentId: v.id("documents"),
    event: v.union(
      v.literal("created"),
      v.literal("sent"),
      v.literal("viewed"),
      v.literal("signed"),
      v.literal("voided"),
      v.literal("downloaded")
    ),
    actorEmail: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    timestamp: v.number(),
  }).index("by_document", ["documentId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_event", ["event"]),
});
