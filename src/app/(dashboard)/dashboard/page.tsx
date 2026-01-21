"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle, Clock } from "lucide-react";
import { StatusBadge } from "@/components/documents/status-badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
    const user = useQuery(api.users.me);
    const documents = useQuery(api.documents.list, user ? {} : "skip");

    if (user === undefined) {
        return <div className="p-8">Loading dashboard...</div>;
    }

    if (user === null) {
        return <div className="p-8">Please sign in</div>;
    }

    const recentDocs = documents?.slice(0, 5) || [];

    const stats = {
        total: documents?.length || 0,
        signed: documents?.filter(d => d.status === 'signed').length || 0,
        pending: documents?.filter(d => d.status === 'sent' || d.status === 'viewed').length || 0
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Welcome, {user.name?.split(' ')[0] || 'Back'}</h2>
                <p className="text-muted-foreground">Here&apos;s an overview of your documents.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Signed</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.signed}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pending}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">Recent Documents</h3>
                    <Button variant="outline" asChild>
                        <Link href="/documents">View All</Link>
                    </Button>
                </div>

                {recentDocs.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                            No documents found. Start by creating one!
                            <Button className="mt-4" asChild>
                                <Link href="/documents/new">Create Document</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="border rounded-lg bg-card">
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm text-left">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Title</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Created</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {recentDocs.map((doc) => (
                                        <tr key={doc._id} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="p-4 align-middle font-medium">{doc.title}</td>
                                            <td className="p-4 align-middle">
                                                {/* @ts-ignore status type mismatch potential */}
                                                <StatusBadge status={doc.status} />
                                            </td>
                                            <td className="p-4 align-middle">
                                                {new Date(doc.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
