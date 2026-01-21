import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

export const getByToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, { token }) => {
    const recipient = await ctx.db
      .query("recipients")
      .withIndex("by_access_token", (q) => q.eq("accessToken", token))
      .unique();

    if (!recipient) {
      throw new Error("Invalid access token");
    }

    const document = await ctx.db.get(recipient.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    if (document.status === "voided") {
      throw new Error("This document has been voided");
    }

    if (document.status === "expired") {
      throw new Error("This document has expired");
    }

    const owner = await ctx.db.get(document.ownerId);
    if (!owner) {
      throw new Error("Document owner not found");
    }

    const allRecipients = await ctx.db
      .query("recipients")
      .withIndex("by_document", (q) => q.eq("documentId", recipient.documentId))
      .collect();

    const fieldsForRecipient = document.fields.filter(
      (field) => {
        if (field.assignedTo === "sender") return false;
        if (field.assignedTo === "recipient" && recipient.order === 1) return true;
        if (field.assignedTo === "recipient_2" && recipient.order === 2) return true;
        if (field.assignedTo === "recipient_3" && recipient.order === 3) return true;
        return false;
      }
    );

    return {
      recipient,
      document: {
        id: document._id,
        title: document.title,
        status: document.status,
        originalPdfStorageId: document.originalPdfStorageId,
        fields: fieldsForRecipient,
        expiresAt: document.expiresAt,
      },
      owner: {
        name: owner.name,
        email: owner.email,
        logoStorageId: owner.logoStorageId,
      },
      allRecipients: allRecipients.sort((a, b) => a.order - b.order),
    };
  },
});

export const createRecipient = internalMutation({
  args: {
    documentId: v.id("documents"),
    email: v.string(),
    name: v.string(),
    role: v.union(v.literal("signer"), v.literal("cc")),
    order: v.number(),
    accessToken: v.string(),
  },
  handler: async (ctx, args) => {
    const recipientId = await ctx.db.insert("recipients", {
      documentId: args.documentId,
      email: args.email,
      name: args.name,
      role: args.role,
      order: args.order,
      status: "pending",
      accessToken: args.accessToken,
    });

    return recipientId;
  },
});

export const updateRecipientStatus = internalMutation({
  args: {
    recipientId: v.id("recipients"),
    status: v.union(
      v.literal("pending"),
      v.literal("viewed"),
      v.literal("signed")
    ),
    signatureData: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const recipient = await ctx.db.get(args.recipientId);
    if (!recipient) {
      throw new Error("Recipient not found");
    }

    const updateData: {
      status: "pending" | "viewed" | "signed";
      signedAt?: number;
      signatureData?: string;
      ipAddress?: string;
      userAgent?: string;
    } = {
      status: args.status,
    };

    if (args.status === "signed") {
      updateData.signedAt = Date.now();
      updateData.signatureData = args.signatureData;
    }

    if (args.ipAddress) {
      updateData.ipAddress = args.ipAddress;
    }

    if (args.userAgent) {
      updateData.userAgent = args.userAgent;
    }

    await ctx.db.patch(args.recipientId, updateData);

    if (args.status === "viewed") {
      await ctx.scheduler.runAfter(0, internal.auditLog.log, {
        documentId: recipient.documentId,
        event: "viewed",
        actorEmail: recipient.email,
        ipAddress: args.ipAddress,
        userAgent: args.userAgent,
      });
    }

    if (args.status === "signed") {
      await ctx.scheduler.runAfter(0, internal.auditLog.log, {
        documentId: recipient.documentId,
        event: "signed",
        actorEmail: recipient.email,
        ipAddress: args.ipAddress,
        userAgent: args.userAgent,
      });
    }

    return { success: true };
  },
});
