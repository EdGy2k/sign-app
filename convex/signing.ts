import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

function isExpired(document: { expiresAt?: number }): boolean {
  return document.expiresAt !== undefined && document.expiresAt < Date.now();
}

export const getDocumentByToken = query({
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

    if (isExpired(document)) {
      throw new Error("This document has expired");
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

export const markViewed = mutation({
  args: {
    token: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, { token, ipAddress, userAgent }) => {
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

    if (isExpired(document)) {
      throw new Error("This document has expired");
    }

    if (recipient.status === "pending") {
      await ctx.runMutation(internal.recipients.updateRecipientStatus, {
        recipientId: recipient._id,
        status: "viewed",
        ipAddress,
        userAgent,
      });

      if (document.status === "sent") {
        await ctx.db.patch(document._id, { status: "viewed" });
      }
    }

    return { success: true };
  },
});

export const submitSignature = mutation({
  args: {
    token: v.string(),
    fieldId: v.string(),
    signatureValue: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, { token, fieldId, signatureValue, ipAddress, userAgent }) => {
    if (!signatureValue || signatureValue.trim().length === 0) {
      throw new Error("Signature value cannot be empty");
    }
    if (signatureValue.length > 100000) {
      throw new Error("Signature value too large");
    }

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

    if (isExpired(document)) {
      throw new Error("This document has expired");
    }

    const field = document.fields.find((f) => f.id === fieldId);
    if (!field) {
      throw new Error("Field not found");
    }

    const isFieldAssignedToRecipient =
      (field.assignedTo === "recipient" && recipient.order === 1) ||
      (field.assignedTo === "recipient_2" && recipient.order === 2) ||
      (field.assignedTo === "recipient_3" && recipient.order === 3);

    if (!isFieldAssignedToRecipient) {
      throw new Error("Field is not assigned to this recipient");
    }

    let signatureData: Record<string, string> = {};
    if (recipient.signatureData) {
      try {
        signatureData = JSON.parse(recipient.signatureData);
      } catch (e) {
        signatureData = {};
      }
    }

    signatureData[fieldId] = signatureValue;

    await ctx.db.patch(recipient._id, {
      signatureData: JSON.stringify(signatureData),
      ipAddress,
      userAgent,
    });

    return { success: true };
  },
});

export const complete = mutation({
  args: {
    token: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, { token, ipAddress, userAgent }) => {
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

    if (isExpired(document)) {
      throw new Error("This document has expired");
    }

    const fieldsForRecipient = document.fields.filter(
      (field) => {
        if (field.assignedTo === "sender") return false;
        if (field.assignedTo === "recipient" && recipient.order === 1) return true;
        if (field.assignedTo === "recipient_2" && recipient.order === 2) return true;
        if (field.assignedTo === "recipient_3" && recipient.order === 3) return true;
        return false;
      }
    );

    const requiredFields = fieldsForRecipient.filter((f) => f.required);

    let signatureData: Record<string, string> = {};
    if (recipient.signatureData) {
      try {
        signatureData = JSON.parse(recipient.signatureData);
      } catch (e) {
        signatureData = {};
      }
    }

    for (const field of requiredFields) {
      if (!signatureData[field.id] || signatureData[field.id].trim() === "") {
        throw new Error(`Required field "${field.label}" is not filled`);
      }
    }

    await ctx.runMutation(internal.recipients.updateRecipientStatus, {
      recipientId: recipient._id,
      status: "signed",
      signatureData: JSON.stringify(signatureData),
      ipAddress,
      userAgent,
    });

    const allRecipients = await ctx.db
      .query("recipients")
      .withIndex("by_document", (q) => q.eq("documentId", recipient.documentId))
      .collect();

    const signers = allRecipients.filter((r) => r.role === "signer");
    const allSignersSigned = signers.every((signer) => {
      if (signer._id === recipient._id) {
        return true;
      }
      return signer.status === "signed";
    });

    if (allSignersSigned) {
      await ctx.db.patch(document._id, {
        status: "signed",
        completedAt: Date.now(),
      });

      await ctx.scheduler.runAfter(0, internal.pdfGeneration.generateSignedPdf, {
        documentId: document._id,
      });

      await ctx.scheduler.runAfter(0, internal.email.sendSigningComplete, {
        documentId: document._id,
      });
    }

    return { success: true, allComplete: allSignersSigned };
  },
});
