"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/common/loading-state";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
    url: string;
}

export default function PdfViewer({ url }: PdfViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [rotation, setRotation] = useState(0);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
    }

    return (
        <div className="flex flex-col items-center w-full">
            <div className="sticky top-0 z-10 flex items-center gap-2 p-2 bg-white/90 backdrop-blur border rounded-lg shadow-sm mb-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
                    disabled={pageNumber <= 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">
                    Page {pageNumber} of {numPages || "--"}
                </span>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPageNumber((prev) => Math.min(prev + 1, numPages))}
                    disabled={pageNumber >= numPages}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-gray-300 mx-2" />
                <Button variant="ghost" size="icon" onClick={() => setScale((s) => Math.max(s - 0.2, 0.5))}>
                    <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm w-12 text-center">{Math.round(scale * 100)}%</span>
                <Button variant="ghost" size="icon" onClick={() => setScale((s) => Math.min(s + 0.2, 2.0))}>
                    <ZoomIn className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-gray-300 mx-2" />
                <Button variant="ghost" size="icon" onClick={() => setRotation((r) => (r + 90) % 360)}>
                    <RotateCw className="h-4 w-4" />
                </Button>
            </div>

            <div className="border rounded-lg overflow-hidden bg-gray-100 min-h-[500px] flex items-center justify-center p-4 w-full">
                <Document
                    file={url}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={<LoadingState />}
                    error={<div className="text-red-500">Failed to load PDF.</div>}
                    className="max-w-full"
                >
                    <Page
                        pageNumber={pageNumber}
                        scale={scale}
                        rotate={rotation}
                        className="shadow-lg"
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                    />
                </Document>
            </div>
        </div>
    );
}
