"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import ReactSignatureCanvas from "react-signature-canvas";
import { CheckCircle, Circle, PenTool } from "lucide-react";

interface SigningInterfaceProps {
    token: string;
    document: any;
    recipient: any;
    fields: any[];
}

export default function SigningInterface({ token, document, recipient, fields }: SigningInterfaceProps) {
    const submitSignature = useMutation(api.signing.submitSignature);
    const completeSigning = useMutation(api.signing.complete);
    const [loadingFieldId, setLoadingFieldId] = useState<string | null>(null);
    const [isCompleting, setIsCompleting] = useState(false);
    const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
    const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
    const sigCanvas = useRef<ReactSignatureCanvas>(null);

    // Parse existing signature data
    let signatureData: Record<string, string> = {};
    try {
        signatureData = recipient.signatureData ? JSON.parse(recipient.signatureData) : {};
    } catch (e) {
        signatureData = {};
    }

    const handleSignatureSubmit = async () => {
        if (!activeFieldId || !sigCanvas.current) return;

        if (sigCanvas.current.isEmpty()) {
            alert("Please sign before saving");
            return;
        }

        const signatureValue = sigCanvas.current.toDataURL();

        try {
            setLoadingFieldId(activeFieldId);
            await submitSignature({
                token,
                fieldId: activeFieldId,
                signatureValue,
            });
            setSignatureDialogOpen(false);
        } catch (error) {
            console.error(error);
            alert("Failed to save signature");
        } finally {
            setLoadingFieldId(null);
            setActiveFieldId(null);
        }
    };

    const handleTextSubmit = async (fieldId: string, value: string) => {
        try {
            setLoadingFieldId(fieldId);
            await submitSignature({
                token,
                fieldId,
                signatureValue: value,
            });
        } catch (error) {
            console.error(error);
            // Ideally toast here
        } finally {
            setLoadingFieldId(null);
        }
    };

    const handleComplete = async () => {
        try {
            setIsCompleting(true);
            const result = await completeSigning({ token });
            if (result.success) {
                alert("Document signing completed!");
                // Optionally redirect or show success state
                window.location.reload();
            }
        } catch (error) {
            console.error(error);
            alert("Failed to complete signing: " + (error as Error).message);
        } finally {
            setIsCompleting(false);
        }
    };

    const isFieldFilled = (fieldId: string) => {
        const val = signatureData[fieldId];
        return val && val.trim().length > 0;
    };

    const requiredFields = fields.filter(f => f.required);
    const allRequiredFilled = requiredFields.every(f => isFieldFilled(f.id));

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b bg-muted/20">
                <h2 className="font-semibold mb-1">Required Fields</h2>
                <p className="text-sm text-gray-500">
                    Please fill in all required fields to complete the document.
                </p>
                <div className="mt-2 text-sm">
                    Progress: {fields.filter(f => isFieldFilled(f.id)).length} / {fields.length}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {fields.map((field) => (
                    <div key={field.id} className={`p-4 border rounded-lg ${isFieldFilled(field.id) ? "bg-green-50 border-green-200" : "bg-white"}`}>
                        <div className="flex items-center justify-between mb-2">
                            <Label className="font-medium flex items-center gap-2">
                                {field.label}
                                {field.required && <span className="text-red-500">*</span>}
                            </Label>
                            {isFieldFilled(field.id) ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                                <Circle className="h-5 w-5 text-gray-300" />
                            )}
                        </div>

                        {field.type === "signature" || field.type === "initials" ? (
                            <Dialog open={signatureDialogOpen && activeFieldId === field.id} onOpenChange={(open) => {
                                setSignatureDialogOpen(open);
                                if (!open) setActiveFieldId(null);
                            }}>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start py-6"
                                        onClick={() => setActiveFieldId(field.id)}
                                    >
                                        <PenTool className="mr-2 h-4 w-4" />
                                        {isFieldFilled(field.id) ? "Signature Saved (Click to change)" : "Click to Sign"}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Sign Document</DialogTitle>
                                        <DialogDescription>
                                            Draw your signature below.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="border rounded-md bg-gray-50 h-64 w-full">
                                        <ReactSignatureCanvas
                                            ref={sigCanvas}
                                            canvasProps={{ className: "w-full h-full" }}
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => sigCanvas.current?.clear()}>Clear</Button>
                                        <Button onClick={handleSignatureSubmit} disabled={loadingFieldId === field.id}>
                                            {loadingFieldId === field.id ? "Saving..." : "Save Signature"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        ) : (
                            <Input
                                placeholder={`Enter ${field.label}`}
                                defaultValue={signatureData[field.id] || ""}
                                onBlur={(e) => handleTextSubmit(field.id, e.target.value)}
                            />
                        )}
                    </div>
                ))}
            </div>

            <div className="p-4 border-t bg-white">
                <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="lg"
                    disabled={!allRequiredFilled || isCompleting || recipient.status === "signed"}
                    onClick={handleComplete}
                >
                    {isCompleting ? "Finishing..." : recipient.status === "signed" ? "Document Signed" : "Complete Signing"}
                </Button>
            </div>
        </div>
    );
}
