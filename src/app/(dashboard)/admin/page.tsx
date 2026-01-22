"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // Assuming we have Badge
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"; // Need to ensure these exist or use basic HTML
import { useState } from "react";
import { Id } from "../../../../convex/_generated/dataModel";

// Assuming we need to implement a basic Table if not present, but let's try assuming standard shadcn structure
// If error, I'll fix.

export default function AdminPage() {
    const stats = useQuery(api.admin.getStats);
    const users = useQuery(api.admin.listUsers);
    const documents = useQuery(api.admin.listDocuments);

    const updateUserPlan = useMutation(api.admin.updateUserPlan);
    const banUser = useMutation(api.admin.banUser);
    const updateUserRole = useMutation(api.admin.updateUserRole);

    const handleUpgrade = async (userId: Id<"users">) => {
        if (confirm("Upgrade this user to Pro?")) {
            await updateUserPlan({ userId, plan: "pro" });
        }
    };

    const handleDowngrade = async (userId: Id<"users">) => {
        if (confirm("Downgrade this user to Free?")) {
            await updateUserPlan({ userId, plan: "free" });
        }
    };

    const handleBan = async (userId: Id<"users">, currentStatus: boolean | undefined) => {
        if (confirm(currentStatus ? "Unban user?" : "Ban user?")) {
            await banUser({ userId, isBanned: !currentStatus });
        }
    };

    const handleMakeAdmin = async (userId: Id<"users">) => {
        if (confirm("Make this user an Admin?")) {
            await updateUserRole({ userId, role: "admin" });
        }
    };

    if (!stats || !users || !documents) return <div>Loading Admin Data...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Users</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{stats.totalUsers}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Pro Users</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-green-600">{stats.proUsers}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Documents</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{stats.totalDocuments}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Signed Docs</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-blue-600">{stats.signedDocuments}</div></CardContent>
                </Card>
            </div>

            <Tabs defaultValue="users">
                <TabsList>
                    <TabsTrigger value="users">Users Management</TabsTrigger>
                    <TabsTrigger value="documents">Global Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="users" className="space-y-4">
                    <Card>
                        <CardHeader><CardTitle>All Users</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Plan</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((u) => (
                                        <TableRow key={u._id}>
                                            <TableCell className="font-medium">{u.name}</TableCell>
                                            <TableCell>{u.email}</TableCell>
                                            <TableCell>
                                                <Badge variant={u.plan === 'pro' ? 'default' : 'secondary'}>{u.plan}</Badge>
                                            </TableCell>
                                            <TableCell>{u.role || 'user'}</TableCell>
                                            <TableCell>
                                                {u.isBanned && <Badge variant="destructive">Banned</Badge>}
                                            </TableCell>
                                            <TableCell className="flex gap-2">
                                                {u.plan === 'free' ? (
                                                    <Button size="sm" variant="outline" onClick={() => handleUpgrade(u._id)}>Give Pro</Button>
                                                ) : (
                                                    <Button size="sm" variant="outline" onClick={() => handleDowngrade(u._id)}>Remove Pro</Button>
                                                )}

                                                <Button size="sm" variant={u.isBanned ? "outline" : "destructive"} onClick={() => handleBan(u._id, u.isBanned)}>
                                                    {u.isBanned ? "Unban" : "Ban"}
                                                </Button>

                                                {u.role !== 'admin' && (
                                                    <Button size="sm" variant="ghost" onClick={() => handleMakeAdmin(u._id)}>Make Admin</Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="documents" className="space-y-4">
                    <Card>
                        <CardHeader><CardTitle>Recent Documents</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Owner</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Created</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {documents.map((d: any) => (
                                        <TableRow key={d._id}>
                                            <TableCell className="font-medium">{d.title}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span>{d.ownerName}</span>
                                                    <span className="text-xs text-muted-foreground">{d.ownerEmail}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{d.status}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                {new Date(d.createdAt).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
