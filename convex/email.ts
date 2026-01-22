import { v } from "convex/values";
import { internalAction, internalQuery } from "./_generated/server";
import { Resend } from "resend";
import { internal } from "./_generated/api";
import { escapeSubject } from "./emailUtils";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY environment variable is not set");
  }
  return new Resend(apiKey);
}

function getAppUrl() {
  if (process.env.APP_URL) return process.env.APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function createSigningRequestEmail(params: {
  recipientName: string;
  senderName: string;
  documentTitle: string;
  magicLink: string;
}) {
  const safeRecipientName = escapeHtml(params.recipientName);
  const safeSenderName = escapeHtml(params.senderName);
  const safeDocumentTitle = escapeHtml(params.documentTitle);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <tr>
                  <td style="padding: 40px;">
                    <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 600; color: #1a1a1a;">
                      You have a document to sign
                    </h1>
                    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #4a4a4a;">
                      Hi ${safeRecipientName},
                    </p>
                    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #4a4a4a;">
                      ${safeSenderName} has sent you a document titled <strong>"${safeDocumentTitle}"</strong> for your signature.
                    </p>
                    <table cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
                      <tr>
                        <td align="center" style="border-radius: 6px; background-color: #2563eb;">
                          <a href="${params.magicLink}" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none;">
                            Review and Sign Document
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 20px; color: #6b6b6b;">
                      Or copy and paste this link into your browser:
                    </p>
                    <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 20px; color: #2563eb; word-break: break-all;">
                      ${params.magicLink}
                    </p>
                    <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e5e5;">
                    <p style="margin: 0; font-size: 12px; line-height: 18px; color: #9b9b9b;">
                      This link is unique to you and should not be shared. If you did not expect this email, please ignore it.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function createSigningCompleteEmail(params: {
  recipientName: string;
  documentTitle: string;
  downloadLink: string;
}) {
  const safeRecipientName = escapeHtml(params.recipientName);
  const safeDocumentTitle = escapeHtml(params.documentTitle);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <tr>
                  <td style="padding: 40px;">
                    <div style="margin: 0 0 24px 0; text-align: center;">
                      <div style="display: inline-block; width: 64px; height: 64px; border-radius: 50%; background-color: #10b981; line-height: 64px; font-size: 32px;">
                        ✓
                      </div>
                    </div>
                    <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 600; color: #1a1a1a; text-align: center;">
                      Document Signed by All Parties
                    </h1>
                    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #4a4a4a;">
                      Hi ${safeRecipientName},
                    </p>
                    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #4a4a4a;">
                      Great news! The document <strong>"${safeDocumentTitle}"</strong> has been signed by all parties and is now complete.
                    </p>
                    <table cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
                      <tr>
                        <td align="center" style="border-radius: 6px; background-color: #2563eb;">
                          <a href="${params.downloadLink}" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none;">
                            Download Signed Document
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 20px; color: #6b6b6b;">
                      Or copy and paste this link into your browser:
                    </p>
                    <p style="margin: 0; font-size: 14px; line-height: 20px; color: #2563eb; word-break: break-all;">
                      ${params.downloadLink}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function createReminderEmail(params: {
  recipientName: string;
  documentTitle: string;
  magicLink: string;
  senderName: string;
}) {
  const safeRecipientName = escapeHtml(params.recipientName);
  const safeSenderName = escapeHtml(params.senderName);
  const safeDocumentTitle = escapeHtml(params.documentTitle);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <tr>
                  <td style="padding: 40px;">
                    <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 600; color: #1a1a1a;">
                      Reminder: Please Sign Document
                    </h1>
                    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #4a4a4a;">
                      Hi ${safeRecipientName},
                    </p>
                    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #4a4a4a;">
                      This is a friendly reminder that ${safeSenderName} is waiting for your signature on <strong>"${safeDocumentTitle}"</strong>.
                    </p>
                    <table cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
                      <tr>
                        <td align="center" style="border-radius: 6px; background-color: #2563eb;">
                          <a href="${params.magicLink}" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none;">
                            Sign Document Now
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 20px; color: #6b6b6b;">
                      Or copy and paste this link into your browser:
                    </p>
                    <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 20px; color: #2563eb; word-break: break-all;">
                      ${params.magicLink}
                    </p>
                    <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e5e5;">
                    <p style="margin: 0; font-size: 12px; line-height: 18px; color: #9b9b9b;">
                      This link is unique to you and should not be shared. If you did not expect this email, please ignore it.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export const sendSigningRequest = internalAction({
  args: {
    recipientId: v.id("recipients"),
  },
  handler: async (ctx, { recipientId }) => {
    const recipient = await ctx.runQuery(internal.email.getRecipientData, {
      recipientId,
    });

    const magicLink = `${getAppUrl()}/sign/${recipient.accessToken}`;

    const html = createSigningRequestEmail({
      recipientName: recipient.name,
      senderName: recipient.senderName,
      documentTitle: recipient.documentTitle,
      magicLink,
    });

    try {
      const resend = getResendClient();
      const result = await resend.emails.send({
        from: "Document Signing <onboarding@resend.dev>",
        to: recipient.email,
        subject: `${escapeSubject(recipient.senderName)} sent you a document to sign`,
        html,
      });

      return { success: true, emailId: result.data?.id };
    } catch (error) {
      console.error("Failed to send signing request email:", error);
      throw new Error(`Failed to send email: ${error}`);
    }
  },
});

export const sendSigningComplete = internalAction({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, { documentId }): Promise<any> => {
    const documentData = await ctx.runQuery(internal.email.getDocumentData, {
      documentId,
    });

    const downloadLink = `${getAppUrl()}/documents/${documentId}/download`;

    const allParties = [
      { email: documentData.ownerEmail, name: documentData.ownerName },
      ...documentData.recipients.map((r) => ({ email: r.email, name: r.name })),
    ];

    const resend = getResendClient();
    const emailPromises = allParties.map(async (party) => {
      const html = createSigningCompleteEmail({
        recipientName: party.name,
        documentTitle: documentData.title,
        downloadLink,
      });

      try {
        const result = await resend.emails.send({
          from: "Document Signing <onboarding@resend.dev>",
          to: party.email,
          subject: `Document "${escapeSubject(documentData.title)}" has been signed by all parties`,
          html,
        });

        return { success: true, emailId: result.data?.id, to: party.email };
      } catch (error) {
        console.error(`Failed to send completion email to ${party.email}:`, error);
        return { success: false, to: party.email, error: String(error) };
      }
    });

    const results = await Promise.all(emailPromises);
    return { results };
  },
});

export const sendReminder = internalAction({
  args: {
    recipientId: v.id("recipients"),
  },
  handler: async (ctx, { recipientId }) => {
    const recipient = await ctx.runQuery(internal.email.getRecipientData, {
      recipientId,
    });

    const magicLink = `${getAppUrl()}/sign/${recipient.accessToken}`;

    const html = createReminderEmail({
      recipientName: recipient.name,
      senderName: recipient.senderName,
      documentTitle: recipient.documentTitle,
      magicLink,
    });

    try {
      const resend = getResendClient();
      const result = await resend.emails.send({
        from: "Document Signing <onboarding@resend.dev>",
        to: recipient.email,
        subject: `Reminder: Please sign "${escapeSubject(recipient.documentTitle)}"`,
        html,
      });

      return { success: true, emailId: result.data?.id };
    } catch (error) {
      console.error("Failed to send reminder email:", error);
      throw new Error(`Failed to send email: ${error}`);
    }
  },
});

export const getRecipientData = internalQuery({
  args: {
    recipientId: v.id("recipients"),
  },
  handler: async (ctx, { recipientId }) => {
    const recipient = await ctx.db.get(recipientId);
    if (!recipient) {
      throw new Error("Recipient not found");
    }

    const document = await ctx.db.get(recipient.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    const owner = await ctx.db.get(document.ownerId);
    if (!owner) {
      throw new Error("Owner not found");
    }

    return {
      email: recipient.email,
      name: recipient.name,
      accessToken: recipient.accessToken,
      documentTitle: document.title,
      senderName: owner.name,
    };
  },
});

export const getDocumentData = internalQuery({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, { documentId }) => {
    const document = await ctx.db.get(documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    const owner = await ctx.db.get(document.ownerId);
    if (!owner) {
      throw new Error("Owner not found");
    }

    const recipients = await ctx.db
      .query("recipients")
      .withIndex("by_document", (q) => q.eq("documentId", documentId))
      .collect();

    return {
      title: document.title,
      ownerEmail: owner.email,
      ownerName: owner.name,
      recipients: recipients.map((r) => ({
        email: r.email,
        name: r.name,
      })),
    };
  },
});
