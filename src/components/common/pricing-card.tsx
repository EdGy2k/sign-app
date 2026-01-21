"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PricingCardProps {
    planName: string;
    price: string;
    currency: string;
    description: string;
    features: string[];
    ctaText: string;
    highlighted?: boolean;
    onCtaClick?: () => void;
}

export function PricingCard({
    planName,
    price,
    currency,
    description,
    features,
    ctaText,
    highlighted = false,
    onCtaClick,
}: PricingCardProps) {
    return (
        <Card className={cn("flex flex-col", highlighted && "border-primary shadow-lg")}>
            <CardHeader>
                <CardTitle>{planName}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 flex-1">
                <div className="text-3xl font-bold">
                    {currency === 'eur' ? '€' : '$'}{price}
                    <span className="text-sm font-normal text-muted-foreground">/month</span>
                </div>
                <div className="space-y-2">
                    {features.map((feature, i) => (
                        <div key={i} className="flex items-center text-sm">
                            <Check className="mr-2 h-4 w-4 text-primary" />
                            {feature}
                        </div>
                    ))}
                </div>
            </CardContent>
            <CardFooter>
                <Button
                    className="w-full"
                    variant={highlighted ? "default" : "outline"}
                    onClick={onCtaClick}
                >
                    {ctaText}
                </Button>
            </CardFooter>
        </Card>
    );
}
