"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eraser } from "lucide-react";

interface SignatureModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (signatureData: string) => void;
}

export function SignatureModal({ open, onOpenChange, onConfirm }: SignatureModalProps) {
    const [activeTab, setActiveTab] = useState("draw");
    const [typedSignature, setTypedSignature] = useState("");
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);

    // Canvas drawing logic
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.strokeStyle = "#000000";

        const startDrawing = (e: MouseEvent | TouchEvent) => {
            setIsDrawing(true);
            const { offsetX, offsetY } = getCoordinates(e, canvas);
            ctx.beginPath();
            ctx.moveTo(offsetX, offsetY);
        };

        const draw = (e: MouseEvent | TouchEvent) => {
            if (!isDrawing) return;
            const { offsetX, offsetY } = getCoordinates(e, canvas);
            ctx.lineTo(offsetX, offsetY);
            ctx.stroke();
            setHasSignature(true);
        };

        const stopDrawing = () => {
            ctx.closePath();
            setIsDrawing(false);
        };

        const getCoordinates = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
            const rect = canvas.getBoundingClientRect();
            let clientX, clientY;

            if ('touches' in e) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = (e as MouseEvent).clientX;
                clientY = (e as MouseEvent).clientY;
            }

            return {
                offsetX: clientX - rect.left,
                offsetY: clientY - rect.top
            };
        };

        // Event listeners
        canvas.addEventListener("mousedown", startDrawing);
        canvas.addEventListener("mousemove", draw);
        canvas.addEventListener("mouseup", stopDrawing);
        canvas.addEventListener("mouseleave", stopDrawing);

        // Touch support
        canvas.addEventListener("touchstart", startDrawing);
        canvas.addEventListener("touchmove", draw);
        canvas.addEventListener("touchend", stopDrawing);

        return () => {
            canvas.removeEventListener("mousedown", startDrawing);
            canvas.removeEventListener("mousemove", draw);
            canvas.removeEventListener("mouseup", stopDrawing);
            canvas.removeEventListener("mouseleave", stopDrawing);
            canvas.removeEventListener("touchstart", startDrawing);
            canvas.removeEventListener("touchmove", draw);
            canvas.removeEventListener("touchend", stopDrawing);
        };
    }, [activeTab, isDrawing]);

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext("2d");
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
            setHasSignature(false);
        }
    };

    const handleConfirm = () => {
        if (activeTab === "draw") {
            const canvas = canvasRef.current;
            if (canvas) {
                onConfirm(canvas.toDataURL());
            }
        } else {
            // Convert text signature to image (basic implementation)
            const canvas = document.createElement("canvas");
            canvas.width = 500;
            canvas.height = 200;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.font = "italic 48px serif"; // Simulate signature font
                ctx.fillStyle = "black";
                ctx.fillText(typedSignature, 50, 100);
                onConfirm(canvas.toDataURL());
            }
        }
        onOpenChange(false);
    };

    const isValid = activeTab === "draw" ? hasSignature : typedSignature.length > 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Adopt Your Signature</DialogTitle>
                </DialogHeader>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="draw">Draw</TabsTrigger>
                        <TabsTrigger value="type">Type</TabsTrigger>
                    </TabsList>

                    <TabsContent value="draw" className="space-y-4 py-4">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex flex-col items-center justify-center relative touch-none">
                            <canvas
                                ref={canvasRef}
                                width={400}
                                height={200}
                                className="w-full h-[200px] cursor-crosshair rounded-lg"
                            />
                            {!hasSignature && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-400">
                                    Sign here
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end">
                            <Button variant="ghost" size="sm" onClick={clearCanvas}>
                                <Eraser className="mr-2 h-4 w-4" /> Clear
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="type" className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="signature-text">Full Name</Label>
                            <Input
                                id="signature-text"
                                value={typedSignature}
                                onChange={(e) => setTypedSignature(e.target.value)}
                                placeholder="John Doe"
                            />
                        </div>
                        <div className="h-[120px] bg-gray-50 rounded-lg flex items-center justify-center border">
                            {typedSignature ? (
                                <span className="text-4xl italic font-serif">{typedSignature}</span>
                            ) : (
                                <span className="text-gray-400">Preview</span>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleConfirm} disabled={!isValid}>Apply Signature</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
