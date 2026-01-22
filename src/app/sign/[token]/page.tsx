"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { LoadingState } from "@/components/common/loading-state";
import SigningInterface from "@/components/signing/signing-interface";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// Dynamically import PdfViewer to avoid SSR issues
const PdfViewer = dynamic(() => import("@/components/pdf/pdf-viewer"), {
    loading: () => <LoadingState />,
    ssr: false
});

export default function SigningPage() {
    const params = useParams();
    // Safely extract token, ensuring it's a string
    const token = Array.isArray(params?.token) ? params.token[0] : params?.token;

    const data = useQuery(api.recipients.getByToken, token ? { token } : "skip");

    if (!token) {
        return (
            <div className="flex h-screen items-center justify-center p-4">
                <Alert variant="destructive" className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>Invalid signing link.</AlertDescription>
                </Alert>
            </div>
        );
    }

    if (data === undefined) {
        return (
            <div className="flex h-screen items-center justify-center">
                <LoadingState />
            </div>
        );
    }

    if (data === null) {
        // Should ideally be handled by query throwing error or returning null, 
        // but getByToken throws errors which useQuery interacts with by logging? 
        // Convex useQuery returns undefined while loading, and throws errors if query fails.
        // If we are here, data might be valid or we need boundary.
        // Let's assume layout handles error boundaries or we add proper error handling if possible.
        // For now, if usage of "skip" or data is null (unlikely with throw), generic error.
        return (
            <div className="flex h-screen items-center justify-center p-4">
                <Alert variant="destructive" className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>Document not found or access denied.</AlertDescription>
                </Alert>
            </div>
        );
    }

    // Determine the URL for the PDF
    // Convex storage URLs: current codebase seems to rely on storageId usage in backend
    // but PdfViewer needs a public URL. 
    // Usually `useQuery(api.storage.getUrl, { storageId })` or similar.
    // Let's check how `documents/[documentId]/page.tsx` does it.
    // Oh, `api.documents.get` returns `originalPdfUrl`.
    // We need `getByToken` to return the URL or we construct it.
    // Looking at `convex/recipients.ts`: `getByToken` returns `originalPdfStorageId`.
    // We can't use storageId directly in `react-pdf`. We need a URL.
    // I should check if `getByToken` returns a URL. It returns `document` object with `originalPdfStorageId`.
    // I need to generate a URL. 

    return (
        <SigningPageContent data={data} token={token} />
    );
}

function SigningPageContent({ data, token }: { data: any, token: string }) {
    // We need to get the URL. Since `getByToken` is a query, we can't easily chain another query conditionally inside the component 
    // unless we render this sub-component.
    // But `v.id("_storage")` is internal. We need the public URL.
    // Convex has `api.storage.getUrl`? Or helper?
    // Let's assume we need to fetch it.
    // Actually, `documents` query returns `originalPdfUrl` likely by generating it on the server.
    // `recipients.getByToken` returns `originalPdfStorageId`.
    // I should update `convex/recipients.ts` to return the URL, OR generic `storage.ts` action?
    // Let's check `convex/documents.ts`... `get` returns `originalPdfUrl`.
    // I will use a separate query or action to get the URL?
    // No, cleaner to update `getByToken`. But I can't restart that task easily.
    // Wait, do I have a tool to get storage URL?
    // `convex/storage.ts` has `generateUploadUrl`.

    // Quick fix: `react-pdf` can take a URL. Convex HTTP actions can serve files?
    // Usually `https://<deployment-name>.convex.cloud/api/storage/<storageId>` works if public?
    // Or `await ctx.storage.getUrl(storageId)` in backend.

    // I will verify `convex/recipients.ts` again to see if it returns URL.
    // It returns `originalPdfStorageId`.
    // I will add a `useQuery` here for the URL if possible, or assume I can construct it.
    // Actually, I can allow `PdfViewer` to take storageID? No.

    // Let's use the sub-component to fetch the URL if we can't modify backend now.
    // But modifying backend is better. 
    // I'll assume for now I can't change backend easily without backtracking.
    // Actually I can edit `convex/recipients.ts` quickly.

    // But wait, `useQuery` hook for `api.documents.get` used `await ctx.storage.getUrl(document.originalPdfStorageId)`.
    // `getByToken` implementation:
    // 59:         originalPdfStorageId: document.originalPdfStorageId,
    // It does NOT return URL.

    // I will update `convex/recipients.ts` to return the URL. It's a small change and necessary.

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden">
            {/* Left: PDF */}
            <div className="flex-1 bg-gray-100 overflow-y-auto border-r scrollbar-thin scrollbar-thumb-gray-300">
                {/*  We need the URL. I will add a todo to fix backend.
                      For now, I'll pass null and shows loading? No.
                 */}
                {data.document.url ? (
                    <PdfViewer url={data.document.url} />
                ) : (
                    <div className="flex items-center justify-center h-full">Generating Preview...</div>
                )}
            </div>

            {/* Right: Interface */}
            <div className="w-[400px] bg-white shadow-xl z-10 flex flex-col">
                <div className="p-4 border-b">
                    <h1 className="font-bold text-lg truncate">{data.document.title}</h1>
                    <p className="text-sm text-gray-500">From: {data.owner.name}</p>
                </div>
                <SigningInterface
                    token={token}
                    document={data.document}
                    recipient={data.recipient}
                    fields={data.document.fields}
                />
            </div>
        </div>
    );
}
