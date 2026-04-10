"use client";

import { useEffect, useMemo, useState } from "react";
import { MdAccessTime, MdApartment, MdLocalHospital, MdTimer } from "react-icons/md";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    XAxis,
    YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { AdminHeader } from "@/shared/layouts";
import { cn } from "@/shared/lib/utils";
import type { SessionUser } from "@/shared/types/auth";
import type { Department } from "@/shared/types/models";
import { StatsCard } from "./stats-card";

import type { ReportFilters } from "@/features/reports/report-analytics";
import type { ReportSnapshot } from "@/features/reports/report-data";

const departmentChartConfig = {
  patients: {
    label: "Patients",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const hourlyChartConfig = {
  patients: {
    label: "Queue Volume",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

const statusChartConfig = {
  count: {
    label: "Patients",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

const trendChartConfig = {
  patients: {
    label: "Patients",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig;

const PIE_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

type ReportsDashboardClientProps = {
  loggedInUser: SessionUser;
  departments: Department[];
  initialSnapshot: ReportSnapshot;
};

export default function ReportsDashboardClient({
  loggedInUser,
  departments,
  initialSnapshot,
}: ReportsDashboardClientProps) {
  const [snapshot, setSnapshot] = useState<ReportSnapshot>(initialSnapshot);
  const [isSyncing, setIsSyncing] = useState(false);

  const [filters, setFilters] = useState<ReportFilters>({
    fromDate: initialSnapshot.filters.fromDate,
    toDate: initialSnapshot.filters.toDate,
    departmentId: initialSnapshot.filters.departmentId,
    status: initialSnapshot.filters.status,
  });

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    const syncSnapshot = async () => {
      setIsSyncing(true);

      try {
        const params = new URLSearchParams({
          fromDate: filters.fromDate,
          toDate: filters.toDate,
          departmentId: filters.departmentId,
          status: filters.status,
        });

        const response = await fetch(`/api/reports?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const nextSnapshot = (await response.json()) as ReportSnapshot;
        if (!ignore) {
          setSnapshot(nextSnapshot);
        }
      } catch {
      } finally {
        if (!ignore) {
          setIsSyncing(false);
        }
      }
    };

    syncSnapshot();
    const intervalId = setInterval(syncSnapshot, 15000);

    return () => {
      ignore = true;
      controller.abort();
      clearInterval(intervalId);
    };
  }, [filters]);

  const availableStatuses = useMemo(() => snapshot.availableStatuses, [snapshot.availableStatuses]);

  const metrics = snapshot.metrics;
  const departmentData = snapshot.departmentData;
  const hourlyData = snapshot.hourlyData;
  const statusData = snapshot.statusData;
  const dailyTrendData = snapshot.dailyTrendData;

  return (
    <div className="flex flex-1 flex-col">
      <AdminHeader
        user={loggedInUser}
        title="Reports Dashboard"
      />

      <main className="flex-1 p-6 lg:p-10 space-y-8 overflow-y-auto">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">From</p>
                <Input
                  type="date"
                  value={filters.fromDate}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      fromDate: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">To</p>
                <Input
                  type="date"
                  value={filters.toDate}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      toDate: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Department</p>
                <Select
                  value={filters.departmentId}
                  onValueChange={(value) =>
                    setFilters((current) => ({
                      ...current,
                      departmentId: value,
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Departments</SelectItem>
                    {departments.map((department) => (
                      <SelectItem key={department.id} value={department.id}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</p>
                <Select
                  value={filters.status}
                  onValueChange={(value) =>
                    setFilters((current) => ({
                      ...current,
                      status: value,
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    {availableStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-muted/3 mb-4">
              <p className="text-[10px] text-muted-foreground">
                Last synchronized: {new Date(snapshot.generatedAt).toLocaleString()}
              </p>
              <div className="flex items-center pt-1 gap-2 mb-4">
                <div className={cn("size-2 rounded-full", isSyncing ? "bg-primary animate-pulse" : "bg-muted-foreground/30")} />
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
                  {isSyncing ? "Syncing..." : "Live sync active"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatsCard
            label="Total Served"
            value={metrics.totalServed.toString()}
            icon={<MdLocalHospital size={24} />}
            color="bg-primary text-primary-foreground"
          />

          <StatsCard
            label="Avg Wait Time"
            value={`${metrics.averageWaitingMinutes}m`}
            icon={<MdAccessTime size={24} />}
            color="bg-cyan-500/10 text-cyan-600"
          />

          <StatsCard
            label="Avg Service Time"
            value={`${metrics.averageServiceMinutes}m`}
            icon={<MdTimer size={24} />}
            color="bg-violet-500/10 text-violet-600"
          />

          <StatsCard
            label="Peak Hour"
            value={metrics.peakHourLabel}
            icon={<MdAccessTime size={24} />}
            color="bg-amber-500/10 text-amber-600"
          />

          <StatsCard
            label="Busiest Dept"
            value={metrics.busiestDepartment}
            icon={<MdApartment size={24} />}
            color="bg-primary/10 text-primary"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Patients per Department</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={departmentChartConfig} className="h-72 w-full">
                <BarChart accessibilityLayer data={departmentData} margin={{ left: 0, right: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis
                    dataKey="department"
                    tickLine={false}
                    axisLine={false}
                    className="text-[10px] uppercase font-bold text-muted-foreground"
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis hide />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="patients" fill="var(--color-patients)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Queue Volume by Hour</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={hourlyChartConfig} className="h-72 w-full">
                <AreaChart accessibilityLayer data={hourlyData} margin={{ left: 0, right: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis
                    dataKey="hour"
                    tickLine={false}
                    axisLine={false}
                    className="text-[10px] uppercase font-bold text-muted-foreground"
                  />
                  <YAxis hide />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="patients"
                    stroke="var(--color-patients)"
                    fill="var(--color-patients)"
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={statusChartConfig} className="h-72 w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie
                    data={statusData}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={60}
                    paddingAngle={2}
                  >
                    {statusData.map((row, index) => (
                      <Cell key={row.status} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Daily Queue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={trendChartConfig} className="h-72 w-full">
                <LineChart accessibilityLayer data={dailyTrendData} margin={{ left: 0, right: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    className="text-[10px] uppercase font-bold text-muted-foreground"
                  />
                  <YAxis hide />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="patients"
                    stroke="var(--color-patients)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--color-patients)', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <p className="text-xs text-slate-500">
          Waiting time uses {"updatedAt - createdAt"} for records that already progressed past kiosk.
          Service time uses {"updatedAt - queueDate"} for completed records.
        </p>
      </main>
    </div>
  );
}
