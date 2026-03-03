"use client";

import { Card } from '@/components/ui/card';
import React from 'react';

interface StatsCardProps {
    label: string;
    value: string;
    icon: React.ReactNode;
    color: string;
}

/**
 * UI COMPONENT: StatsCard
 * A purely presentational component for displaying dashboard metrics.
 */
export function StatsCard({ label, value, icon, color }: StatsCardProps) {
    return (
        <Card className='shadow-sm border-0 ring-1 ring-slate-100 px-4'>
            <div className="flex items-center p-3 gap-3">
                <div className={`h-12 w-12 rounded-xl ${color} flex items-center justify-center shrink-0 shadow-md shadow-emerald-100/50`}>
                    {icon}
                </div>
                <div className="flex flex-col gap-1">
                    <p className="text-[11px] font-bold text-gray-600 uppercase tracking-wider leading-none">{label}</p>
                    <h3 className="text-3xl font-extrabold text-black leading-none">{value}</h3>
                </div>
            </div>
        </Card>
    );
}
