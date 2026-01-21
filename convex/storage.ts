import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";

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

    // Note: This is an imperfect rate limit as it counts documents created, not upload attempts.
    // However, since we don't track raw uploads in a table, this serves as a reasonable proxy
    // to prevent mass document creation spam which is the end goal.
    // A stricter implementation would require a dedicated 'uploads' table.
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

// getUrl query removed to prevent unauthorized access to storage files.
// Access URLs through document-specific queries that validate ownership.
