"use client";

import { CalendarBlank, Buildings, Clock, Timer, TrendUp } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/shared/lib/utils";

function formatDisplayDate(value: string) {
  if (!value) return "Select date";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Manila",
  });
}

function toBusinessDay(value?: Date) {
  if (!value) return "";
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTodayBusinessDay() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function ReportDatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const selectedDate = value ? new Date(`${value}T00:00:00`) : undefined;
  const today = new Date(`${getTodayBusinessDay()}T00:00:00`);

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Report Date</p>
        <p className="text-sm font-semibold text-foreground">{formatDisplayDate(value)}</p>
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2 font-bold">
            <CalendarBlank size={16} weight="bold" />
            Pick Date
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (date) onChange(toBusinessDay(date));
            }}
            disabled={(date) => date > today}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function ReportMetricCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "warning" | "success";
}) {
  const toneClassName =
    tone === "warning"
      ? "bg-amber-500/10 text-amber-700"
      : tone === "success"
        ? "bg-emerald-500/10 text-emerald-700"
        : "bg-primary/10 text-primary";

  return (
    <Card className="border-border/80">
      <CardContent className="flex items-start gap-3 p-4">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", toneClassName)}>
          {tone === "warning" ? <TrendUp size={18} weight="bold" /> : tone === "success" ? <Timer size={18} weight="bold" /> : <Clock size={18} weight="bold" />}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
          <p className="text-2xl font-black tracking-tight text-foreground">{value}</p>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function ReportBreakdownCard({
  title,
  items,
  emptyLabel,
  formatter,
}: {
  title: string;
  items: { id: string; label: string; value: number | string }[];
  emptyLabel: string;
  formatter?: (value: number | string) => string;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <Buildings size={14} weight="bold" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pb-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2">
              <span className="text-sm font-semibold text-foreground">{item.label}</span>
              <span className="text-sm font-black text-primary">
                {formatter ? formatter(item.value) : item.value}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
