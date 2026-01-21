"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, File } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function TemplatesPage() {
    const systemTemplates = useQuery(api.templates.listSystem);
    const myTemplates = useQuery(api.templates.listMine);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Templates</h2>
                    <p className="text-muted-foreground">Start from a template to save time.</p>
                </div>
                <Button disabled>
                    <Plus className="mr-2 h-4 w-4" /> Create Template (Coming Soon)
                </Button>
            </div>

            <Tabs defaultValue="system" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="system">System Templates</TabsTrigger>
                    <TabsTrigger value="mine">My Templates</TabsTrigger>
                </TabsList>

                <TabsContent value="system" className="space-y-4">
                    {!systemTemplates ? (
                        <div className="grid gap-4 md:grid-cols-3">
                            <Skeleton className="h-[200px]" />
                            <Skeleton className="h-[200px]" />
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-3">
                            {systemTemplates.length === 0 && <p className="text-muted-foreground">No system templates available.</p>}
                            {systemTemplates.map(template => (
                                <TemplateCard key={template._id} template={template} isSystem />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="mine" className="space-y-4">
                    {!myTemplates ? (
                        <div className="grid gap-4 md:grid-cols-3">
                            <Skeleton className="h-[200px]" />
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-3">
                            {myTemplates.length === 0 && <p className="text-muted-foreground">You haven't created any templates yet.</p>}
                            {myTemplates.map(template => (
                                <TemplateCard key={template._id} template={template} />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

function TemplateCard({ template, isSystem }: { template: any, isSystem?: boolean }) {
    return (
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <File className="h-5 w-5 text-blue-500" />
                    {template.name}
                </CardTitle>
                <CardDescription className="line-clamp-2">{template.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                <div className="flex gap-2 text-xs text-muted-foreground">
                    <span className="capitalize bg-secondary px-2 py-1 rounded">{template.category}</span>
                    <span>{template.fields?.length || 0} fields</span>
                </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full" asChild>
                    <Link href={`/documents/new?templateId=${template._id}`}>Use Template</Link>
                </Button>
            </CardFooter>
        </Card>
    )
}
