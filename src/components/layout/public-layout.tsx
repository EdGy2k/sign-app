"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto flex h-14 items-center">
                    <Link href="/" className="mr-6 flex items-center space-x-2">
                        <span className="font-bold text-xl">Freelance Sign</span>
                    </Link>
                    <nav className="flex flex-1 items-center space-x-6 text-sm font-medium">
                        <Link href="/pricing" className="transition-colors hover:text-foreground/80 text-foreground/60">
                            Pricing
                        </Link>
                    </nav>
                    <div className="flex items-center space-x-4">
                        <SignedOut>
                            <Button variant="ghost" asChild>
                                <Link href="/sign-in">Log in</Link>
                            </Button>
                            <Button asChild>
                                <Link href="/sign-up">Sign up</Link>
                            </Button>
                        </SignedOut>
                        <SignedIn>
                            <Button variant="ghost" asChild className="mr-2">
                                <Link href="/dashboard">Dashboard</Link>
                            </Button>
                            <UserButton />
                        </SignedIn>
                    </div>
                </div>
            </header>
            <main className="flex-1">{children}</main>
            <footer className="border-t py-6 md:py-0">
                <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
                    <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
                        Built for freelancers. © 2024 Freelance Sign.
                    </p>
                </div>
            </footer>
        </div>
    );
}
