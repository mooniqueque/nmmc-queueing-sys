"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { cn } from "@/shared/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-semibold",
        nav: "flex items-center gap-1",
        nav_button: "inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-foreground hover:bg-muted transition-colors",
        month_caption: "flex items-center justify-center gap-1",
        dropdowns: "flex items-center gap-1",
        dropdown: "rounded-md border border-border bg-background px-2 py-1 text-xs",
        table: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday: "text-muted-foreground rounded-md w-9 font-medium text-[0.8rem]",
        week: "flex w-full mt-2",
        day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
        day_button: "h-9 w-9 rounded-md hover:bg-muted transition-colors",
        selected: "bg-primary text-primary-foreground rounded-md hover:bg-primary hover:text-primary-foreground",
        today: "bg-muted text-foreground rounded-md",
        outside: "text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-40",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...iconProps }) =>
          orientation === "left" ? (
            <CaretLeft size={16} weight="bold" {...iconProps} />
          ) : (
            <CaretRight size={16} weight="bold" {...iconProps} />
          ),
      }}
      {...props}
    />
  );
}
