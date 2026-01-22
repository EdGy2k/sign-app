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

import { RefreshCw, Send, Trash2, Plus } from "lucide-react"; // Added Trash2, Plus
import { useMutation } from "convex/react";
import { useState } from "react";

// Dynamically import PdfViewer to avoid SSR issues with canvas/pdfjs
const PdfViewer = dynamic(() => import("@/components/pdf/pdf-viewer"), {
    loading: () => <LoadingState />,
    ssr: false
});

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function FieldsSidebar({ documentId, fields }: { documentId: Id<"documents">, fields: any[] }) {
    const addField = useMutation(api.documents.addField);
    const removeField = useMutation(api.documents.removeField);
    const [isAdding, setIsAdding] = useState(false);

    const handleAddField = async (type: "signature" | "text" | "date", label: string) => {
        try {
            setIsAdding(true);
            await addField({ documentId, type, label });
        } catch (error) {
            console.error(error);
            alert("Failed to add field");
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemoveField = async (fieldId: string) => {
        if (!confirm("Remove this field?")) return;
        try {
            await removeField({ documentId, fieldId });
        } catch (error) {
            console.error(error);
            alert("Failed to remove field");
        }
    };

    return (
        <div className="w-80 bg-white border-l p-4 flex flex-col gap-6 overflow-y-auto">
            <div>
                <h3 className="font-semibold mb-4">Add Fields</h3>
                <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" onClick={() => handleAddField("signature", "Signature")} disabled={isAdding}>
                        <Plus className="mr-2 h-4 w-4" /> Signature
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => handleAddField("date", "Date")} disabled={isAdding}>
                        <Plus className="mr-2 h-4 w-4" /> Date
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => handleAddField("text", "Text Input")} disabled={isAdding}>
                        <Plus className="mr-2 h-4 w-4" /> Text Input
                    </Button>
                </div>
            </div>

            <div>
                <h3 className="font-semibold mb-4">Current Fields ({fields.length})</h3>
                <div className="space-y-2">
                    {fields.length === 0 && (
                        <div className="text-sm text-muted-foreground italic text-center py-4 border border-dashed rounded-lg">
                            No fields added yet.<br />Add a field to enable signing.
                        </div>
                    )}
                    {fields.map((field) => (
                        <div key={field.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                            <div className="flex flex-col">
                                <span className="font-medium text-sm">{field.label}</span>
                                <span className="text-xs text-muted-foreground capitalize">{field.type}</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleRemoveField(field.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function SendDocumentDialog({ documentId }: { documentId: Id<"documents"> }) {
    const sendDocument = useMutation(api.documents.send);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const handleSend = async () => {
        if (!name || !email) {
            alert("Please fill in all fields");
            return;
        }

        try {
            setIsLoading(true);
            await sendDocument({
                id: documentId,
                recipients: [{
                    email,
                    name,
                    role: "signer",
                    order: 1
                }]
            });
            alert("Document sent!");
            setOpen(false);
        } catch (error) {
            console.error(error);
            alert("Failed to send document: " + (error as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                    <Send className="mr-2 h-4 w-4" /> Send Document
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Send Document</DialogTitle>
                    <DialogDescription>
                        Enter the recipient details to send this document for signing.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">Email</Label>
                        <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSend} disabled={isLoading}>
                        {isLoading ? "Sending..." : "Send"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ResendButton({ documentId, recipients }: { documentId: Id<"documents">, recipients: any[] }) {
    const resendReminder = useMutation(api.documents.resendReminder);
    const [isLoading, setIsLoading] = useState(false);

    const handleResend = async () => {
        // Find first signer (simplified for now as per plan/req)
        const recipient = recipients.find(r => r.role === "signer");
        if (!recipient) return alert("No signer found to resend to.");

        try {
            setIsLoading(true);
            await resendReminder({ documentId, recipientEmail: recipient.email });
            alert("Reminder sent!");
        } catch (error) {
            console.error(error);
            alert("Failed to send reminder: " + (error as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button variant="outline" size="sm" onClick={handleResend} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Resend Email
        </Button>
    );
}

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
                    {(document.status === "sent" || document.status === "viewed") && (
                        <ResendButton documentId={document._id} recipients={document.recipients} />
                    )}
                    {document.status === "draft" && (
                        <SendDocumentDialog documentId={document._id} />
                    )}
                </div>
            </div>


            <div className="flex-1 overflow-hidden flex">
                <div className="flex-1 bg-gray-50 p-4 overflow-hidden flex flex-col">
                    {document.originalPdfUrl ? (
                        <PdfViewer url={document.originalPdfUrl} />
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            PDF not available
                        </div>
                    )}
                </div>
                {(document.status === "draft" || document.status === "sent" || document.status === "viewed") && (
                    <FieldsSidebar documentId={document._id} fields={document.fields || []} />
                )}
            </div>
        </div>
    );
}
