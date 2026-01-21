"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { FieldEditor } from "@/components/documents/document-wizard/field-editor";
import dynamic from "next/dynamic";
const FieldEditor = dynamic(
    () => import("@/components/documents/document-wizard/field-editor").then((mod) => mod.FieldEditor),
    { ssr: false }
);
import { ArrowLeft, ArrowRight, Upload, Plus } from "lucide-react";
import Link from "next/link";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useRouter } from "next/navigation";

// Mock PDF for testing purposes if upload is cumbersome in prototype
const MOCK_PDF_URL = "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/examples/learning/helloworld.pdf";

export default function NewDocumentPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Form state for recipients
    const [recipientName, setRecipientName] = useState("");
    const [recipientEmail, setRecipientEmail] = useState("");

    const user = useQuery(api.users.me);
    const templates = useQuery(api.templates.listSystem, user ? undefined : "skip");
    const createDocument = useMutation(api.documents.create);
    const sendDocument = useMutation(api.documents.send);
    const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
    const validateUploadedFile = useAction(api.storage.validateUploadedFile);

    if (user === undefined) {
        return <div className="p-8">Loading...</div>;
    }

    if (user === null) {
        return <div className="p-8">Please sign in</div>;
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPdfUrl(url);
            setFile(file);
            setSelectedTemplate(null);
            setStep(2);
        }
    };

    const selectTemplate = (id: string) => {
        setSelectedTemplate(id);
        setPdfUrl(MOCK_PDF_URL); // In real app, fetch template PDF
        setFile(null);
        setStep(2);
    };

    const handleSendDocument = async (asDraft: boolean = false) => {
        if (!createDocument) return;

        try {
            setIsUploading(true);
            let storageId: Id<"_storage">;
            let documentId: Id<"documents">;

            if (selectedTemplate) {
                // Fetch matches logic from below
                // Refactoring to be unified would be better but keeping it robust for now
                const template = templates?.find((t: any) => t._id === selectedTemplate);
                if (!template?.pdfStorageId) {
                    throw new Error("Template does not have a PDF file.");
                }

                documentId = await createDocument({
                    title: "New Document from Template",
                    templateId: selectedTemplate,
                    originalPdfStorageId: template.pdfStorageId,
                    fields: [],
                    variableValues: {},
                });

            } else {
                if (file) {
                    const postUrl = await generateUploadUrl();
                    const result = await fetch(postUrl, {
                        method: "POST",
                        headers: { "Content-Type": file.type },
                        body: file,
                    });
                    if (!result.ok) throw new Error(`Upload failed: ${result.statusText}`);
                    const json = await result.json();
                    storageId = json.storageId;

                    await validateUploadedFile({ storageId });

                    documentId = await createDocument({
                        title: file.name.replace(/\.pdf$/i, ""),
                        originalPdfStorageId: storageId,
                        fields: [],
                        variableValues: {},
                    });
                } else if (selectedTemplate) {
                    // Should trigger top block, but just in case
                    const template = templates?.find((t: any) => t._id === selectedTemplate);
                    if (!template?.pdfStorageId) throw new Error("Template invalid");

                    documentId = await createDocument({
                        title: "New Document from Template",
                        templateId: selectedTemplate,
                        originalPdfStorageId: template.pdfStorageId,
                        fields: [],
                        variableValues: {},
                    });
                } else {
                    throw new Error("No file or template selected");
                }
            }

            if (!asDraft) {
                // Send the document
                // We assume 1 recipient for now based on the UI state variables
                if (!recipientEmail || !recipientName) {
                    // Technically UI enforces this? No, it doesn't currently enabled check
                    throw new Error("Recipient name and email are required.");
                }

                await sendDocument({
                    id: documentId,
                    recipients: [{
                        email: recipientEmail,
                        name: recipientName,
                        role: "signer",
                        order: 1 // Default order
                    }]
                });
            }


            router.push("/documents");

        } catch (error) {
            console.error("Failed to create document", error);
            alert("Failed to create document: " + (error as Error).message);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/documents"><ArrowLeft className="h-4 w-4" /></Link>
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold">New Document</h1>
                        <p className="text-sm text-gray-500">Step {step} of 3</p>
                    </div>
                </div>
                <div>
                    {step === 2 && (
                        <Button onClick={() => setStep(3)}>
                            Next: Recipients <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                    {step === 3 && (
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => handleSendDocument(true)} disabled={isUploading}>
                                Save as Draft
                            </Button>
                            <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleSendDocument(false)} disabled={isUploading}>
                                {isUploading ? "Sending..." : "Send Document"}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {step === 1 && (
                <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto w-full mt-8">
                    <Card className="p-8 flex flex-col items-center justify-center text-center space-y-4 hover:border-blue-500 transition-colors cursor-pointer border-dashed border-2">
                        <div className="p-4 bg-blue-50 rounded-full">
                            <Upload className="h-8 w-8 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-semibold">Upload PDF</h3>
                        <p className="text-gray-500">Upload a contract or agreement from your computer.</p>
                        <Input type="file" accept=".pdf" className="hidden" id="pdf-upload" onChange={handleFileUpload} />
                        <Button variant="outline" asChild>
                            <Label htmlFor="pdf-upload" className="cursor-pointer">Select File</Label>
                        </Button>
                    </Card>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Or choose a template</h3>
                        {!templates ? (
                            <div>Loading templates...</div>
                        ) : (
                            <div className="grid gap-4">
                                {templates.map((t: any) => (
                                    <Card key={t._id} className="p-4 cursor-pointer hover:border-blue-500 transition-colors" onClick={() => selectTemplate(t._id)}>
                                        <h4 className="font-medium">{t.name}</h4>
                                        <p className="text-sm text-gray-500">{t.description}</p>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {step === 2 && pdfUrl && (
                <div className="flex-1 overflow-hidden">
                    <FieldEditor pdfUrl={pdfUrl} />
                </div>
            )}

            {step === 3 && (
                <div className="max-w-2xl mx-auto w-full mt-8">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Add Recipients</h3>
                        <div className="space-y-4">
                            <div className="grid gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Name</Label>
                                        <Input placeholder="Client Name" value={recipientName} onChange={e => setRecipientName(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email</Label>
                                        <Input placeholder="client@example.com" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" className="w-full">
                                <Plus className="mr-2 h-4 w-4" /> Add Another Recipient
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
