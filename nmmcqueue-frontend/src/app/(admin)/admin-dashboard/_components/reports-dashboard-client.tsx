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
import { SidebarTrigger } from "@/components/ui/sidebar";
import type { SessionUser } from "@/lib/types/user";
import type { Department } from "@/types/models";
import { StatsCard } from "./stats-card";

import type { ReportFilters } from "../../reports/lib/report-analytics";
import type { ReportSnapshot } from "../../reports/lib/report-data";

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
      <header className="bg-white sticky top-0 z-50 border-b px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <h1 className="text-xl font-bold text-emerald-900">Reports Dashboard</h1>
        </div>

        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-bold text-emerald-900">{loggedInUser.name}</span>
          <span className="text-xs text-slate-500 uppercase tracking-tighter">{loggedInUser.role}</span>
        </div>
      </header>

      <main className="p-6 space-y-6 bg-slate-50/50 px-10">
        <Card className="shadow-sm border-0 ring-1 ring-slate-100 px-5 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">From</p>
              <Input
                type="date"
                value={filters.fromDate}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    fromDate: event.target.value,
                  }))
                }
                className="bg-white"
              />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">To</p>
              <Input
                type="date"
                value={filters.toDate}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    toDate: event.target.value,
                  }))
                }
                className="bg-white"
              />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Department</p>
              <Select
                value={filters.departmentId}
                onValueChange={(value) =>
                  setFilters((current) => ({
                    ...current,
                    departmentId: value,
                  }))
                }
              >
                <SelectTrigger className="w-full bg-white">
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

            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</p>
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  setFilters((current) => ({
                    ...current,
                    status: value,
                  }))
                }
              >
                <SelectTrigger className="w-full bg-white">
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

          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Last synchronized: {new Date(snapshot.generatedAt).toLocaleString()}
            </p>
            <p className="text-xs font-semibold text-emerald-700">
              {isSyncing ? "Syncing..." : "Live sync every 15s"}
            </p>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <StatsCard
            label="Total Patients Served"
            value={metrics.totalServed.toString()}
            icon={<MdLocalHospital size={28} className="text-white" />}
            color="bg-emerald-600"
          />

          <StatsCard
            label="Average Waiting Time"
            value={`${metrics.averageWaitingMinutes}m`}
            icon={<MdAccessTime size={28} className="text-white" />}
            color="bg-cyan-600"
          />

          <StatsCard
            label="Average Service Time"
            value={`${metrics.averageServiceMinutes}m`}
            icon={<MdTimer size={28} className="text-white" />}
            color="bg-violet-600"
          />

          <StatsCard
            label="Peak Hour"
            value={metrics.peakHourLabel}
            icon={<MdAccessTime size={28} className="text-white" />}
            color="bg-amber-600"
          />

          <StatsCard
            label="Busiest Department"
            value={metrics.busiestDepartment}
            icon={<MdApartment size={28} className="text-white" />}
            color="bg-emerald-700"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="shadow-sm border-0 ring-1 ring-slate-100">
            <CardHeader>
              <CardTitle className="text-emerald-900">Patients per Department</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={departmentChartConfig} className="h-72 w-full">
                <BarChart accessibilityLayer data={departmentData} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="department"
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="patients" fill="var(--color-patients)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-0 ring-1 ring-slate-100">
            <CardHeader>
              <CardTitle className="text-emerald-900">Queue Volume by Hour</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={hourlyChartConfig} className="h-72 w-full">
                <AreaChart accessibilityLayer data={hourlyData} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="hour" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="patients"
                    stroke="var(--color-patients)"
                    fill="var(--color-patients)"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-0 ring-1 ring-slate-100">
            <CardHeader>
              <CardTitle className="text-emerald-900">Status Distribution</CardTitle>
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
                    outerRadius={110}
                    innerRadius={55}
                  >
                    {statusData.map((row, index) => (
                      <Cell key={row.status} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-0 ring-1 ring-slate-100">
            <CardHeader>
              <CardTitle className="text-emerald-900">Daily Queue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={trendChartConfig} className="h-72 w-full">
                <LineChart accessibilityLayer data={dailyTrendData} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="patients"
                    stroke="var(--color-patients)"
                    strokeWidth={3}
                    dot={false}
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
