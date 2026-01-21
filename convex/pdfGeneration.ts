import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { internal } from "./_generated/api";

export const getDocumentData = internalQuery({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, { documentId }) => {
    const document = await ctx.db.get(documentId);
    if (!document) {
      return null;
    }

    const recipients = await ctx.db
      .query("recipients")
      .withIndex("by_document", (q) => q.eq("documentId", documentId))
      .collect();

    const auditLog = await ctx.db
      .query("auditLog")
      .withIndex("by_document", (q) => q.eq("documentId", documentId))
      .collect();

    return {
      ...document,
      recipients: recipients.sort((a, b) => a.order - b.order),
      auditLog: auditLog.sort((a, b) => a.timestamp - b.timestamp),
    };
  },
});

export const updateDocumentWithSignedPdf = internalMutation({
  args: {
    documentId: v.id("documents"),
    signedPdfStorageId: v.id("_storage"),
  },
  handler: async (ctx, { documentId, signedPdfStorageId }) => {
    await ctx.db.patch(documentId, {
      signedPdfStorageId,
    });

    return { success: true };
  },
});

export const generateSignedPdf = internalAction({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, { documentId }) => {
    const document = await ctx.runQuery(internal.pdfGeneration.getDocumentData, {
      documentId,
    });

    if (!document) {
      throw new Error("Document not found");
    }

    if (!document.originalPdfStorageId) {
      throw new Error("Original PDF not found");
    }

    const originalPdfUrl = await ctx.storage.getUrl(document.originalPdfStorageId);
    if (!originalPdfUrl) {
      throw new Error("Failed to get original PDF URL");
    }

    const originalPdfResponse = await fetch(originalPdfUrl);
    if (!originalPdfResponse.ok) {
      throw new Error(`Failed to fetch PDF: ${originalPdfResponse.status}`);
    }

    const originalPdfBytes = await originalPdfResponse.arrayBuffer();

    const originalPdfHash = await generateSHA256Hash(originalPdfBytes);

    let pdfDoc;
    try {
      pdfDoc = await PDFDocument.load(originalPdfBytes);
    } catch (e) {
      throw new Error(`Failed to load PDF: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }

    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    for (const recipient of document.recipients) {
      if (!recipient.signatureData) {
        continue;
      }

      let signatureDataMap: Record<string, string> = {};
      try {
        signatureDataMap = JSON.parse(recipient.signatureData);
      } catch (e) {
        continue;
      }

      for (const field of document.fields) {
        const signatureValue = signatureDataMap[field.id];
        if (!signatureValue) {
          continue;
        }

        const isFieldAssignedToRecipient =
          (field.assignedTo === "recipient" && recipient.order === 1) ||
          (field.assignedTo === "recipient_2" && recipient.order === 2) ||
          (field.assignedTo === "recipient_3" && recipient.order === 3);

        if (!isFieldAssignedToRecipient) {
          continue;
        }

        const pageCount = pdfDoc.getPageCount();
        if (field.page < 0 || field.page >= pageCount) {
          continue;
        }

        const page = pdfDoc.getPage(field.page);
        const { height: pageHeight } = page.getSize();

        const yCoordinate = pageHeight - field.y - field.height;

        if (field.type === "signature" || field.type === "initials") {
          if (signatureValue.startsWith("data:image")) {
            const base64Data = signatureValue.split(",")[1];

            let imageBytes;
            try {
              imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
            } catch (e) {
              continue;
            }

            let image;
            try {
              if (signatureValue.includes("image/png")) {
                image = await pdfDoc.embedPng(imageBytes);
              } else if (signatureValue.includes("image/jpeg") || signatureValue.includes("image/jpg")) {
                image = await pdfDoc.embedJpg(imageBytes);
              } else {
                continue;
              }
            } catch (e) {
              continue;
            }

            page.drawImage(image, {
              x: field.x,
              y: yCoordinate,
              width: field.width,
              height: field.height,
            });
          }
        } else if (field.type === "text" || field.type === "date") {
          const fontSize = 12;

          page.drawText(signatureValue, {
            x: field.x,
            y: yCoordinate + field.height / 2 - fontSize / 2,
            size: fontSize,
            font: helveticaFont,
            color: rgb(0, 0, 0),
          });
        } else if (field.type === "checkbox") {
          if (signatureValue === "true" || signatureValue === "checked") {
            page.drawText("✓", {
              x: field.x,
              y: yCoordinate,
              size: field.height * 0.8,
              font: helveticaFont,
              color: rgb(0, 0, 0),
            });
          }
        }
      }
    }

    let currentPage = pdfDoc.addPage();
    const { width: pageWidth, height: pageHeight } = currentPage.getSize();

    let yPosition = pageHeight - 50;

    currentPage.drawText("AUDIT TRAIL", {
      x: 50,
      y: yPosition,
      size: 20,
      font: helveticaBoldFont,
      color: rgb(0, 0, 0),
    });

    yPosition -= 40;

    function sanitizePdfText(text: string, maxLength: number = 200): string {
      return text
        .replace(/[\r\n\t]/g, " ")
        .replace(/[^\x20-\x7E\xA0-\xFF]/g, "")
        .substring(0, maxLength)
        .trim();
    }

    currentPage.drawText(`Document: ${sanitizePdfText(document.title)}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });

    yPosition -= 20;

    currentPage.drawText(`SHA-256 Hash: ${originalPdfHash}`, {
      x: 50,
      y: yPosition,
      size: 10,
      font: helveticaFont,
      color: rgb(0.3, 0.3, 0.3),
    });

    yPosition -= 40;

    currentPage.drawText("Timeline:", {
      x: 50,
      y: yPosition,
      size: 14,
      font: helveticaBoldFont,
      color: rgb(0, 0, 0),
    });

    yPosition -= 25;

    for (const log of document.auditLog) {
      if (yPosition < 100) {
        currentPage = pdfDoc.addPage();
        yPosition = pageHeight - 50;
        currentPage.drawText("AUDIT TRAIL (continued)", {
          x: 50,
          y: yPosition,
          size: 16,
          font: helveticaBoldFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= 30;
      }

      const timestamp = new Date(log.timestamp).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short",
      });

      currentPage.drawText(`• ${log.event.toUpperCase()} - ${timestamp}`, {
        x: 60,
        y: yPosition,
        size: 10,
        font: helveticaBoldFont,
        color: rgb(0, 0, 0),
      });

      yPosition -= 15;

      currentPage.drawText(`  Actor: ${sanitizePdfText(log.actorEmail)}`, {
        x: 70,
        y: yPosition,
        size: 9,
        font: helveticaFont,
        color: rgb(0.2, 0.2, 0.2),
      });

      yPosition -= 12;

      if (log.ipAddress) {
        currentPage.drawText(`  IP Address: ${sanitizePdfText(log.ipAddress)}`, {
          x: 70,
          y: yPosition,
          size: 9,
          font: helveticaFont,
          color: rgb(0.2, 0.2, 0.2),
        });
        yPosition -= 12;
      }


      yPosition -= 10;
    }

    yPosition -= 30;

    if (yPosition < 200) {
      currentPage = pdfDoc.addPage();
      yPosition = pageHeight - 50;
    }

    currentPage.drawText("Signers:", {
      x: 50,
      y: yPosition,
      size: 14,
      font: helveticaBoldFont,
      color: rgb(0, 0, 0),
    });

    yPosition -= 25;

    for (const recipient of document.recipients.filter((r) => r.role === "signer")) {
      if (yPosition < 100) {
        currentPage = pdfDoc.addPage();
        yPosition = pageHeight - 50;
      }

      currentPage.drawText(`• ${recipient.name} (${recipient.email})`, {
        x: 60,
        y: yPosition,
        size: 10,
        font: helveticaBoldFont,
        color: rgb(0, 0, 0),
      });

      yPosition -= 15;

      currentPage.drawText(`  Status: ${recipient.status}`, {
        x: 70,
        y: yPosition,
        size: 9,
        font: helveticaFont,
        color: rgb(0.2, 0.2, 0.2),
      });

      yPosition -= 12;

      if (recipient.signedAt) {
        const signedTime = new Date(recipient.signedAt).toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZoneName: "short",
        });

        currentPage.drawText(`  Signed At: ${signedTime}`, {
          x: 70,
          y: yPosition,
          size: 9,
          font: helveticaFont,
          color: rgb(0.2, 0.2, 0.2),
        });

        yPosition -= 12;
      }

      if (recipient.ipAddress) {
        currentPage.drawText(`  IP Address: ${recipient.ipAddress}`, {
          x: 70,
          y: yPosition,
          size: 9,
          font: helveticaFont,
          color: rgb(0.2, 0.2, 0.2),
        });

        yPosition -= 12;
      }

      yPosition -= 10;
    }

    const signedPdfBytes = await pdfDoc.save();

    const signedPdfBlob = new Blob([signedPdfBytes as any], { type: "application/pdf" });
    const signedPdfStorageId = await ctx.storage.store(signedPdfBlob);

    await ctx.runMutation(internal.pdfGeneration.updateDocumentWithSignedPdf, {
      documentId,
      signedPdfStorageId,
    });

    return { success: true, signedPdfStorageId };
  },
});

async function generateSHA256Hash(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}
