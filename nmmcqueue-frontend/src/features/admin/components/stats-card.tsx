"use client";

import { Card } from '@/components/ui/card';
import { cn } from '@/shared/lib/utils';
import React from 'react';

interface StatsCardProps {
    label: string;
    value: string;
    icon: React.ReactNode;
    color?: string; // Tailwind color class for icon container background
    className?: string; // Optional className for the card itself
}

/**
 * UI COMPONENT: StatsCard
 * A purely presentational component for displaying dashboard metrics.
 */
export function StatsCard({ label, value, icon, color = "bg-primary/10 text-primary", className }: StatsCardProps) {
    return (
        <Card className={cn("flex items-center p-6 gap-4", className)}>
            <div className={cn(
                "h-12 w-12 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                color
            )}>
                {icon}
            </div>
            <div className="flex flex-col gap-0.5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest leading-none">{label}</p>
                <h3 className="text-2xl font-bold tracking-tight text-foreground">{value}</h3>
            </div>
        </Card>
    );
}
