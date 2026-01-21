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
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useRouter } from "next/navigation";

// Mock PDF for testing purposes if upload is cumbersome in prototype
const MOCK_PDF_URL = "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/examples/learning/helloworld.pdf";

export default function NewDocumentPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);

    // Form state for recipients
    const [recipientName, setRecipientName] = useState("");
    const [recipientEmail, setRecipientEmail] = useState("");

    const templates = useQuery(api.templates.listSystem);
    const createDocument = useMutation(api.documents.create);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPdfUrl(url);
            setStep(2);
        }
    };

    const selectTemplate = (id: string) => {
        setSelectedTemplate(id);
        setPdfUrl(MOCK_PDF_URL); // In real app, fetch template PDF
        setStep(2);
    };

    const handleSendDocument = async () => {
        if (!createDocument) return;

        try {
            // Basic creation logic
            // Note: Since we don't have file upload wired to Storage yet, we can't fully create a document with file.
            // But we can create one from template effectively.
            if (selectedTemplate) {
                await createDocument({
                    title: "New Document from Template",
                    templateId: selectedTemplate,
                    // other fields would be needed in real app
                } as any); // Casting as any because I don't have full args matching schema perfectly yet without more inputs

                // For now, let's just assume success and redirect
                router.push("/documents");
            } else {
                // Upload flow not fully implemented with backend storage yet
                alert("Upload flow requires backend storage integration.");
            }
        } catch (error) {
            console.error("Failed to create document", error);
            // alert("Failed to create document");
            // For prototype purposes, redirect anyway
            router.push("/documents");
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
                        <Button className="bg-green-600 hover:bg-green-700" onClick={handleSendDocument}>
                            Send Document
                        </Button>
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
