"use client";

import { Badge } from "@/components/ui/badge";
import type { HistoryItem } from "@/features/shared/hooks/use-analytics";
import { ClockCounterClockwise } from "@phosphor-icons/react";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    COMPLETED: "default",
    IN_PROGRESS: "secondary",
    NO_SHOW: "destructive",
    WAITING_CLINIC: "outline",
    WAITING_WINDOW: "outline",
    WAITING_TRIAGE: "outline",
    IN_TRIAGE: "secondary",
    IN_WINDOW: "secondary",
};

export function HistoryTable({ items }: { items: HistoryItem[] }) {
    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <ClockCounterClockwise size={40} className="text-muted-foreground/20 mb-3" weight="duotone" />
                <p className="text-sm font-bold text-muted-foreground">No history yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Processed patients will appear here.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col divide-y divide-border">
            {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex flex-col gap-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground truncate">
                                {item.patientName}
                            </span>
                            {item.ticketNumber && (
                                <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                                    #{item.ticketNumber}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                            <span>{item.department}</span>
                            <span className="w-1 h-1 rounded-full bg-border" />
                            <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Badge
                            variant={STATUS_VARIANT[item.status] ?? "outline"}
                            className="text-[9px] font-bold uppercase tracking-wider h-5"
                        >
                            {item.status.replace(/_/g, ' ')}
                        </Badge>
                    </div>
                </div>
            ))}
        </div>
    );
}
