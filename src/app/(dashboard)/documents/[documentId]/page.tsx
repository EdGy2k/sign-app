"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { StatusBadge, DocumentStatus } from "@/components/documents/status-badge";
import dynamic from "next/dynamic";
import { LoadingState } from "@/components/common/loading-state";

// Dynamically import PdfViewer to avoid SSR issues with canvas/pdfjs
const PdfViewer = dynamic(() => import("@/components/pdf/pdf-viewer"), {
    loading: () => <LoadingState />,
    ssr: false
});

export default function DocumentDetailPage() {
    const params = useParams();
    const router = useRouter();
    // safely cast, assuming the route ensures this is present
    const documentId = params.documentId as Id<"documents">;

    const document = useQuery(api.documents.get, { id: documentId });

    if (document === undefined) {
        return <div className="p-8"><LoadingState /></div>;
    }

    if (document === null) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <h2 className="text-xl font-semibold">Document not found</h2>
                <p className="text-muted-foreground">The document you are looking for does not exist or you don't have permission to view it.</p>
                <Button variant="outline" asChild>
                    <Link href="/documents">Back to Documents</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/documents"><ArrowLeft className="h-4 w-4" /></Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-semibold">{document.title}</h1>
                            {/* @ts-ignore */}
                            <StatusBadge status={document.status as DocumentStatus} />
                        </div>
                        <p className="text-sm text-gray-500">
                            Created on {new Date(document.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <div>
                    {/* Future actions: Void, Download, etc. */}
                </div>
            </div>

            <div className="flex-1 bg-gray-50 rounded-lg p-4 overflow-hidden flex flex-col">
                {document.originalPdfUrl ? (
                    <PdfViewer url={document.originalPdfUrl} />
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        PDF not available
                    </div>
                )}
            </div>
        </div>
    );
}
