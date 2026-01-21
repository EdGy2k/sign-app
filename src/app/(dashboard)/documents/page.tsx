"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { StatusBadge, DocumentStatus } from "@/components/documents/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
// import { Document } from "@/types"; // Use shared type for better safety if available

export default function DocumentsPage() {
    const [search, setSearch] = useState("");
    const user = useQuery(api.users.me);
    const documents = useQuery(api.documents.list, {});

    if (user === undefined || documents === undefined) {
        return <div className="p-8">Loading documents...</div>;
    }

    if (user === null) {
        return <div className="p-8">Please sign in</div>;
    }

    const filteredDocs = documents?.filter(doc =>
        doc.title.toLowerCase().includes(search.toLowerCase())
    ) || [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Documents</h2>
                    <p className="text-muted-foreground">Manage and track your contracts.</p>
                </div>
                <Button asChild>
                    <Link href="/documents/new">
                        <Plus className="mr-2 h-4 w-4" /> New Document
                    </Link>
                </Button>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search documents..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Reusing table structure - ideally extract to DocumentTable component */}
            <div className="border rounded-lg bg-card text-card-foreground shadow-sm">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm text-left">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Title</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Created</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {filteredDocs.map((doc) => (
                                <tr key={doc._id} className="border-b transition-colors hover:bg-muted/50">
                                    <td className="p-4 align-middle font-medium">
                                        <Link href={`/documents/${doc._id}`} className="hover:underline">
                                            {doc.title}
                                        </Link>
                                    </td>
                                    <td className="p-4 align-middle">
                                        {/* @ts-ignore */}
                                        <StatusBadge status={doc.status as DocumentStatus} />
                                    </td>
                                    <td className="p-4 align-middle">
                                        {new Date(doc.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 align-middle text-right">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/documents/${doc._id}`}>View</Link>
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {filteredDocs.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                        No documents found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
