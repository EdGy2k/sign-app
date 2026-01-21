import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const log = internalMutation({
  args: {
    documentId: v.id("documents"),
    event: v.union(
      v.literal("created"),
      v.literal("sent"),
      v.literal("viewed"),
      v.literal("signed"),
      v.literal("voided"),
      v.literal("downloaded"),
      v.literal("reminder_sent")
    ),
    actorEmail: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("auditLog", {
      documentId: args.documentId,
      event: args.event,
      actorEmail: args.actorEmail,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

export const getForDocument = query({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, { documentId }) => {
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
      throw new Error("Not authorized to view audit logs for this document");
    }

    const logs = await ctx.db
      .query("auditLog")
      .withIndex("by_document", (q) => q.eq("documentId", documentId))
      .collect();

    return logs.sort((a, b) => a.timestamp - b.timestamp);
  },
});
