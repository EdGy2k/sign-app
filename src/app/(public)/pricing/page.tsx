"use client";

import { useState, useEffect } from "react";
import { PricingCard } from "@/components/common/pricing-card";
import { getCurrency } from "@/lib/geo";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function PricingPage() {
    const [currency, setCurrency] = useState<'usd' | 'eur'>('usd');

    // Try to detect currency on mount
    useEffect(() => {
        // In a real app we might fetch IP location from an API or use headers passed down
        // For client-side only demo, we'll stick to default or allowing user toggle.
        // If we passed headers to a client component, we'd do that in page props.
    }, []);

    const handleCurrencyToggle = (checked: boolean) => {
        setCurrency(checked ? 'eur' : 'usd');
    };

    const plans = [
        {
            name: "Free",
            price: "0",
            description: "For individuals just getting started.",
            features: ["3 documents per month", "Basic templates", "Email support"],
            cta: "Get Started",
            highlighted: false
        },
        {
            name: "Pro",
            price: currency === 'eur' ? "12" : "15",
            description: "For freelancers with regular clients.",
            features: ["Unlimited documents", "Custom branding", "Priority support", "Audit trails"],
            cta: "Upgrade to Pro",
            highlighted: true
        }
    ];

    return (
        <div className="container mx-auto py-20">
            <div className="text-center space-y-4 mb-12">
                <h1 className="text-4xl font-bold tracking-tight">Simple, transparent pricing</h1>
                <p className="text-xl text-muted-foreground">Choose the plan that's right for you.</p>

                <div className="flex items-center justify-center space-x-2 pt-4">
                    <Label htmlFor="currency-mode">USD</Label>
                    <Switch id="currency-mode" checked={currency === 'eur'} onCheckedChange={handleCurrencyToggle} />
                    <Label htmlFor="currency-mode">EUR</Label>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {plans.map((plan) => (
                    <PricingCard
                        key={plan.name}
                        planName={plan.name}
                        price={plan.price}
                        currency={currency}
                        description={plan.description}
                        features={plan.features}
                        ctaText={plan.cta}
                        highlighted={plan.highlighted}
                    />
                ))}
            </div>
        </div>
    );
}
