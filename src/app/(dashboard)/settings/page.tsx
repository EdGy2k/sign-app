"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserButton } from "@clerk/nextjs";

export default function SettingsPage() {
    const user = useQuery(api.users.me);
    const subscription = useQuery(api.billing.getSubscription);
    const updateProfile = useMutation(api.users.updateProfile);

    if (user === undefined) return <div className="p-8">Loading settings...</div>;
    if (user === null) return <div className="p-8">Please sign in</div>;

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold tracking-tight">Settings</h2>

            <Tabs defaultValue="profile" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="billing">Billing & Plan</TabsTrigger>
                    <TabsTrigger value="branding">Branding</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>Managed via Clerk</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="p-1 border rounded-full">
                                    <UserButton />
                                </div>
                                <div>
                                    <p className="font-medium">Manage Account</p>
                                    <p className="text-sm text-muted-foreground">Change password, email preferences</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="billing" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Current Plan</CardTitle>
                            <CardDescription>You are currently on the {user.plan.toUpperCase()} plan.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {user.plan === 'free' ? (
                                <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md border border-yellow-200">
                                    Please upgrade to Pro to unlock unlimited documents.
                                </div>
                            ) : (
                                <div className="p-4 bg-green-50 text-green-800 rounded-md border border-green-200">
                                    Active Pro Subscription
                                </div>
                            )}
                        </CardContent>
                        <CardFooter>
                            <Button variant={user.plan === 'free' ? "default" : "outline"}>
                                {user.plan === 'free' ? "Upgrade to Pro" : "Manage Subscription"}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="branding" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Custom Branding</CardTitle>
                            <CardDescription>Upload your logo (Pro only)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="logo">Logo</Label>
                                <Input id="logo" type="file" disabled={user.plan === 'free'} />
                            </div>
                            {user.plan === 'free' && (
                                <p className="text-sm text-red-500 mt-2">Upgrade to Pro to enable this feature.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
