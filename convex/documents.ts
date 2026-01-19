import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function isExpired(document: { expiresAt?: number }): boolean {
  return document.expiresAt !== undefined && document.expiresAt < Date.now();
}

const fieldValidator = v.object({
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
});

const recipientInputValidator = v.object({
  email: v.string(),
  name: v.string(),
  role: v.union(v.literal("signer"), v.literal("cc")),
  order: v.number(),
});

export const list = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("sent"),
        v.literal("viewed"),
        v.literal("signed"),
        v.literal("expired"),
        v.literal("voided")
      )
    ),
  },
  handler: async (ctx, { status }) => {
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

    let documentsQuery = ctx.db
      .query("documents")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id));

    if (status) {
      documentsQuery = ctx.db
        .query("documents")
        .withIndex("by_status", (q) => q.eq("status", status))
        .filter((q) => q.eq(q.field("ownerId"), user._id));
    }

    const documents = await documentsQuery.collect();

    return documents.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const get = query({
  args: {
    id: v.id("documents"),
  },
  handler: async (ctx, { id }) => {
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

    const document = await ctx.db.get(id);
    if (!document) {
      throw new Error("Document not found");
    }

    if (document.ownerId !== user._id) {
      throw new Error("Not authorized to view this document");
    }

    if (isExpired(document) && document.status !== "expired") {
      await ctx.db.patch(id, { status: "expired" });
      document.status = "expired";
    }

    const recipients = await ctx.db
      .query("recipients")
      .withIndex("by_document", (q) => q.eq("documentId", id))
      .collect();

    const auditLog = await ctx.db
      .query("auditLog")
      .withIndex("by_document", (q) => q.eq("documentId", id))
      .collect();

    return {
      ...document,
      recipients: recipients.sort((a, b) => a.order - b.order),
      auditLog: auditLog.sort((a, b) => a.timestamp - b.timestamp),
    };
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    templateId: v.optional(v.string()),
    originalPdfStorageId: v.id("_storage"),
    variableValues: v.object({}),
    fields: v.array(fieldValidator),
  },
  handler: async (ctx, args) => {
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

    const fileUrl = await ctx.storage.getUrl(args.originalPdfStorageId);
    if (!fileUrl) {
      throw new Error("PDF file does not exist in storage");
    }

    const now = Date.now();

    const billingCycleStart = user.billingCycleStart;
    const documentsThisMonth = await ctx.db
      .query("documents")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .filter((q) => q.gte(q.field("createdAt"), billingCycleStart))
      .collect();

    if (user.plan === "free" && documentsThisMonth.length >= 3) {
      throw new Error("Free plan limit reached. Upgrade to Pro to create more documents.");
    }

    const documentId = await ctx.db.insert("documents", {
      ownerId: user._id,
      templateId: args.templateId,
      title: args.title,
      status: "draft",
      originalPdfStorageId: args.originalPdfStorageId,
      variableValues: args.variableValues,
      fields: args.fields,
      createdAt: now,
    });

    await ctx.db.insert("auditLog", {
      documentId: documentId,
      event: "created",
      actorEmail: user.email,
      timestamp: now,
    });

    return documentId;
  },
});

export const send = mutation({
  args: {
    id: v.id("documents"),
    recipients: v.array(recipientInputValidator),
  },
  handler: async (ctx, { id, recipients }) => {
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

    const document = await ctx.db.get(id);
    if (!document) {
      throw new Error("Document not found");
    }

    if (document.ownerId !== user._id) {
      throw new Error("Not authorized to send this document");
    }

    if (document.status !== "draft") {
      throw new Error("Only draft documents can be sent");
    }

    if (isExpired(document)) {
      await ctx.db.patch(id, { status: "expired" });
      throw new Error("Document has expired");
    }

    if (recipients.length === 0) {
      throw new Error("At least one recipient is required");
    }

    const now = Date.now();
    const expiresAt = now + THIRTY_DAYS_MS;

    await ctx.db.patch(id, {
      status: "sent",
      sentAt: now,
      expiresAt,
    });

    for (const recipient of recipients) {
      const accessToken = crypto.randomUUID();

      await ctx.db.insert("recipients", {
        documentId: id,
        email: recipient.email,
        name: recipient.name,
        role: recipient.role,
        order: recipient.order,
        status: "pending",
        accessToken,
      });
    }

    await ctx.db.insert("auditLog", {
      documentId: id,
      event: "sent",
      actorEmail: user.email,
      timestamp: now,
    });

    return { success: true, accessTokensGenerated: recipients.length };
  },
});

export const void_ = mutation({
  args: {
    id: v.id("documents"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { id, reason }) => {
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

    const document = await ctx.db.get(id);
    if (!document) {
      throw new Error("Document not found");
    }

    if (document.ownerId !== user._id) {
      throw new Error("Not authorized to void this document");
    }

    if (document.status === "voided") {
      throw new Error("Document is already voided");
    }

    if (document.status === "signed") {
      throw new Error("Cannot void a signed document");
    }

    if (isExpired(document) && document.status !== "expired") {
      await ctx.db.patch(id, { status: "expired" });
      throw new Error("Document has expired");
    }

    const now = Date.now();

    await ctx.db.patch(id, {
      status: "voided",
      voidedReason: reason,
    });

    await ctx.db.insert("auditLog", {
      documentId: id,
      event: "voided",
      actorEmail: user.email,
      timestamp: now,
    });

    return { success: true };
  },
});

export const resendReminder = mutation({
  args: {
    documentId: v.id("documents"),
    recipientEmail: v.string(),
  },
  handler: async (ctx, { documentId, recipientEmail }) => {
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

    const document = await ctx.db.get(documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    if (document.ownerId !== user._id) {
      throw new Error("Not authorized to resend reminder for this document");
    }

    if (document.status !== "sent" && document.status !== "viewed") {
      throw new Error("Can only resend reminders for sent or viewed documents");
    }

    if (isExpired(document)) {
      await ctx.db.patch(documentId, { status: "expired" });
      throw new Error("Document has expired");
    }

    const recipient = await ctx.db
      .query("recipients")
      .withIndex("by_document", (q) => q.eq("documentId", documentId))
      .filter((q) => q.eq(q.field("email"), recipientEmail))
      .unique();

    if (!recipient) {
      throw new Error("Recipient not found");
    }

    if (recipient.status === "signed") {
      throw new Error("Recipient has already signed the document");
    }

    return { success: true, message: "Email reminder will be sent" };
  },
});
