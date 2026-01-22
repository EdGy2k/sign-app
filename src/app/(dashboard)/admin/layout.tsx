"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sidebar } from "lucide-react"; // Fallback if regular dashboard sidebar isn't reused or we want full screen
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const user = useQuery(api.users.me);
    const router = useRouter();

    useEffect(() => {
        // Simple client-side protection. Proper auth check happens mostly via API failure if not authorized,
        // but we redirect for UX.
        if (user && user.role !== "admin") {
            router.push("/dashboard");
        }
    }, [user, router]);

    if (user === undefined) return <div className="p-8">Loading...</div>;
    // If user is null (not logged in), UserButton/Redirect in root layout handles it or we see nothing. 
    // But `api.users.me` returns null if not logged in.
    if (user === null) {
        // Should rely on middleware or auth wrapper, but safe to just show loading or redirect
        return <div className="p-8">Please log in.</div>;
    }

    if (user.role !== "admin") {
        return <div className="p-8">Access Denied</div>;
    }

    return (
        <div className="flex min-h-screen flex-col">
            <header className="border-b h-16 flex items-center px-6 bg-slate-900 text-white justify-between">
                <div className="font-bold text-xl flex items-center gap-2">
                    🛡️ Admin Console
                </div>
                <div className="flex gap-4">
                    <Link href="/dashboard" className="text-sm hover:underline">Back to App</Link>
                </div>
            </header>
            <main className="flex-1 bg-gray-50 p-6">
                {children}
            </main>
        </div>
    );
}
