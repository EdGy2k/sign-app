"use client";

import { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, GripVertical, Type, Calendar, PenTool } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Ensure worker is configured (duplicated for safety in prototype)
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Field {
    id: string;
    type: 'text' | 'signature' | 'date';
    x: number;
    y: number;
    label: string;
}

interface FieldEditorProps {
    pdfUrl: string;
}

export function FieldEditor({ pdfUrl }: FieldEditorProps) {
    const [fields, setFields] = useState<Field[]>([]);
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

    const pageRef = useRef<HTMLDivElement>(null);
    const dragItem = useRef<string | null>(null);
    const dragOffset = useRef({ x: 0, y: 0 });

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
    }

    const addField = (type: Field['type']) => {
        const newField: Field = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            x: 10 + fields.length * 5, // Stagger slightly
            y: 10 + fields.length * 5,
            label: type === 'signature' ? 'Signature' : type === 'date' ? 'Date' : 'Text Field',
        };
        setFields([...fields, newField]);
        setSelectedFieldId(newField.id);
    };

    const removeField = (id: string) => {
        setFields(fields.filter(f => f.id !== id));
        if (selectedFieldId === id) setSelectedFieldId(null);
    };

    // Dragging logic
    const handleMouseDown = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        dragItem.current = id;
        const field = fields.find(f => f.id === id);
        if (!field) return;

        // Calculate offset relative to the field's top-left
        // This is simplified; robust DnD needs more math vs the container
        // For now, we assume direct mapping if scaling matches or just use delta
        setSelectedFieldId(id);
        dragOffset.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!dragItem.current) return;

        const deltaX = e.clientX - dragOffset.current.x;
        const deltaY = e.clientY - dragOffset.current.y;

        dragOffset.current = { x: e.clientX, y: e.clientY };

        setFields(prev => prev.map(f => {
            if (f.id === dragItem.current) {
                // Convert screen delta to PDF % or pixel delta?
                // Let's use percentage for responsiveness, or pixels if simpler.
                // Pixels relative to the container.
                // We will store as % later, but for UI smooth drag, we update pixels (or %)
                // For this prototype, let's assume `x` and `y` are percentages (0-100).

                const container = pageRef.current?.querySelector('.react-pdf__Page__canvas');
                if (!container) return f;

                const rect = container.getBoundingClientRect();
                const deltaXPercent = (deltaX / rect.width) * 100;
                const deltaYPercent = (deltaY / rect.height) * 100;

                return {
                    ...f,
                    x: Math.max(0, Math.min(100, f.x + deltaXPercent)),
                    y: Math.max(0, Math.min(100, f.y + deltaYPercent)),
                };
            }
            return f;
        }));
    };

    const handleMouseUp = () => {
        dragItem.current = null;
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)]" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
            {/* Sidebar Controls */}
            <Card className="w-full lg:w-64 p-4 flex flex-col gap-4">
                <h3 className="font-semibold text-lg">Fields</h3>
                <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" onClick={() => addField('signature')}>
                        <PenTool className="mr-2 h-4 w-4" /> Signature
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => addField('date')}>
                        <Calendar className="mr-2 h-4 w-4" /> Date
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => addField('text')}>
                        <Type className="mr-2 h-4 w-4" /> Text
                    </Button>
                </div>

                <div className="mt-auto">
                    <h4 className="font-medium text-sm mb-2">Properties</h4>
                    {selectedFieldId ? (
                        <div className="p-3 bg-gray-100 rounded text-sm space-y-2">
                            <p>ID: <span className="font-mono text-xs">{selectedFieldId}</span></p>
                            <Button variant="destructive" size="sm" className="w-full" onClick={() => removeField(selectedFieldId)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Remove
                            </Button>
                        </div>
                    ) : (
                        <p className="text-gray-400 text-sm">Select a field to edit</p>
                    )}
                </div>
            </Card>

            {/* PDF View Area */}
            <div className="flex-1 bg-gray-100 rounded-lg overflow-auto flex justify-center p-8 relative">
                <div className="relative shadow-lg" ref={pageRef}>
                    <Document
                        file={pdfUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        loading={<div className="h-[500px] w-[400px] bg-white animate-pulse" />}
                    >
                        <Page
                            pageNumber={pageNumber}
                            scale={scale}
                            className="select-none"
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                        />
                    </Document>

                    {/* Overlays */}
                    <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
                        {fields.map(field => (
                            <div
                                key={field.id}
                                className={cn(
                                    "absolute flex items-center justify-center border-2 bg-blue-50/50 backdrop-blur-sm cursor-grab active:cursor-grabbing pointer-events-auto transition-colors",
                                    selectedFieldId === field.id ? "border-blue-500 bg-blue-100/50" : "border-blue-300 hover:border-blue-400"
                                )}
                                style={{
                                    left: `${field.x}%`,
                                    top: `${field.y}%`,
                                    width: '120px', // Fixed for prototype
                                    height: '40px',
                                    transform: 'translate(-50%, -50%)' // Center on coordinate
                                }}
                                onMouseDown={(e) => handleMouseDown(e, field.id)}
                                onClick={(e) => { e.stopPropagation(); setSelectedFieldId(field.id); }}
                            >
                                <div className="flex items-center gap-2 px-2 text-xs font-medium text-blue-900 select-none">
                                    {field.type === 'signature' && <PenTool className="h-3 w-3" />}
                                    {field.type === 'date' && <Calendar className="h-3 w-3" />}
                                    {field.type === 'text' && <Type className="h-3 w-3" />}
                                    {field.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
