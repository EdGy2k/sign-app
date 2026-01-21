import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, FileSignature, Shield } from "lucide-react";

export default function LandingPage() {
    return (
        <div className="flex flex-col min-h-[calc(100vh-140px)]">
            {/* Hero Section */}
            <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
                <div className="container mx-auto flex max-w-[64rem] flex-col items-center gap-4 text-center">
                    <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter">
                        Contracts & E-Signatures <br className="hidden sm:inline" />
                        <span className="text-primary">Built for Freelancers</span>
                    </h1>
                    <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
                        Send professional contracts, NDAs, and proposals in seconds.
                        Secure, legally binding, and designed to help you close deals faster.
                    </p>
                    <div className="space-x-4">
                        <Button size="lg" asChild>
                            <Link href="/sign-up">Start for Free <ArrowRight className="ml-2 h-4 w-4" /></Link>
                        </Button>
                        <Button size="lg" variant="outline" asChild>
                            <Link href="/pricing">View Pricing</Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="container mx-auto space-y-6 py-8 md:py-12 lg:py-24 bg-slate-50 dark:bg-slate-900 rounded-3xl my-8">
                <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
                    <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl font-bold">
                        Everything you need
                    </h2>
                    <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                        Stop messing with PDFs and printers. Switch to a modern workflow.
                    </p>
                </div>
                <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
                    <div className="relative overflow-hidden rounded-lg border bg-background p-2">
                        <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                            <FileSignature className="h-12 w-12 text-primary" />
                            <div className="space-y-2">
                                <h3 className="font-bold">E-Signatures</h3>
                                <p className="text-sm text-muted-foreground">
                                    Legally binding digital signatures for you and your clients.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="relative overflow-hidden rounded-lg border bg-background p-2">
                        <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                            <Shield className="h-12 w-12 text-primary" />
                            <div className="space-y-2">
                                <h3 className="font-bold">Secure Storage</h3>
                                <p className="text-sm text-muted-foreground">
                                    All your documents are encrypted and stored securely.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="relative overflow-hidden rounded-lg border bg-background p-2">
                        <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                            <CheckCircle2 className="h-12 w-12 text-primary" />
                            <div className="space-y-2">
                                <h3 className="font-bold">Audit Trails</h3>
                                <p className="text-sm text-muted-foreground">
                                    Track every view, click, and signature with detailed logs.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
