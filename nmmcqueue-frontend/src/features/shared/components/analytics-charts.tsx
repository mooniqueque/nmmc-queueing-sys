"use client";

import {
    Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from "@/components/ui/chart";

// ─── Chart Configs ──────────────────────────────────────────

const volumeConfig = {
    patients: { label: "Patients", color: "var(--chart-1)" },
} satisfies ChartConfig;

const classConfig = {
    count: { label: "Patients", color: "var(--chart-2)" },
} satisfies ChartConfig;

const deptConfig = {
    patients: { label: "Patients", color: "var(--chart-3)" },
} satisfies ChartConfig;

const statusConfig = {
    count: { label: "Patients", color: "var(--chart-4)" },
} satisfies ChartConfig;

const PIE_COLORS = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
];

// ─── Hourly Volume Bar Chart ──────────────────────────────────

export function HourlyVolumeChart({ data }: { data: { hour: string; patients: number }[] }) {
    // Only show hours with some activity context (6am-10pm or hours with data)
    const filtered = data.filter(d => {
        const h = parseInt(d.hour);
        return h >= 6 && h <= 22;
    });

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Hourly Patient Volume
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={volumeConfig} className="h-64 w-full">
                    <BarChart accessibilityLayer data={filtered} margin={{ left: 0, right: 0 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/30" />
                        <XAxis
                            dataKey="hour"
                            tickLine={false}
                            axisLine={false}
                            className="text-[10px] font-bold text-muted-foreground"
                        />
                        <YAxis hide />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="patients" fill="var(--color-patients)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

// ─── Classification Donut Chart ──────────────────────────────

export function ClassificationPieChart({ data }: { data: { name: string; count: number }[] }) {
    if (data.length === 0) {
        return (
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Classification Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
                        No data available
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Classification Breakdown
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={classConfig} className="h-64 w-full">
                    <PieChart>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Pie
                            data={data}
                            dataKey="count"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={90}
                            innerRadius={55}
                            paddingAngle={2}
                        >
                            {data.map((_, i) => (
                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                        </Pie>
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

// ─── Department Bar Chart ────────────────────────────────────

export function DepartmentBarChart({ data }: { data: { department: string; patients: number }[] }) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Patients per Department
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={deptConfig} className="h-64 w-full">
                    <BarChart accessibilityLayer data={data} margin={{ left: 0, right: 0 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/30" />
                        <XAxis
                            dataKey="department"
                            tickLine={false}
                            axisLine={false}
                            className="text-[10px] font-bold text-muted-foreground"
                            interval={0}
                            angle={-15}
                            textAnchor="end"
                            height={50}
                        />
                        <YAxis hide />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="patients" fill="var(--color-patients)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

// ─── Status Distribution Donut Chart ─────────────────────────

export function StatusDistributionChart({ data }: { data: { status: string; count: number }[] }) {
    if (data.length === 0) {
        return (
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Status Distribution
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
                        No data available
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Status Distribution
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={statusConfig} className="h-64 w-full">
                    <PieChart>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Pie
                            data={data}
                            dataKey="count"
                            nameKey="status"
                            cx="50%"
                            cy="50%"
                            outerRadius={90}
                            innerRadius={55}
                            paddingAngle={2}
                        >
                            {data.map((_, i) => (
                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                        </Pie>
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
