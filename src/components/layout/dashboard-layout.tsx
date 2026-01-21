"use client";

import { Sidebar } from "./sidebar";
import { UserButton } from "@clerk/nextjs";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col md:flex-row">
            <aside className="hidden w-64 border-r bg-gray-100/40 md:block dark:bg-gray-800/40">
                <Sidebar className="h-full" />
            </aside>
            <main className="flex-1">
                <header className="flex h-14 items-center gap-4 border-b bg-gray-100/40 px-6 dark:bg-gray-800/40">
                    <div className="flex flex-1 items-center justify-end">
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </header>
                <div className="p-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
