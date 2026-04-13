"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createWorkstation } from "@/features/admin/workstation-actions";
import { notify } from "@/shared/lib/notify";
import { Department, WorkStation, WorkstationType } from "@/shared/types/models";
import { zodResolver } from "@hookform/resolvers/zod";
import { WarningCircle } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type WorkstationFormProps = {
    workstations: WorkStation[];
    departments: Department[];
    onCreated?: (stations: WorkStation[]) => void;
};

const ALLOWED_COUNTS = [1, 2, 3, 4, 5, 10] as const;

const workstationFormSchema = z.object({
    type: z.nativeEnum(WorkstationType),
    customName: z.string().max(80, "Custom name must be at most 80 characters.").optional(),
    departmentId: z.string().optional(),
    count: z
        .coerce
        .number({ invalid_type_error: "Bulk quantity is required." })
        .int()
        .refine((value) => ALLOWED_COUNTS.includes(value as (typeof ALLOWED_COUNTS)[number]), {
            message: "Please choose a valid bulk quantity.",
        }),
});

type WorkstationFormValues = z.infer<typeof workstationFormSchema>;

export function WorkstationForm({ workstations, departments, onCreated }: WorkstationFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const form = useForm<WorkstationFormValues>({
        resolver: zodResolver(workstationFormSchema),
        defaultValues: {
            type: WorkstationType.WINDOW,
            customName: "",
            departmentId: "none",
            count: 1,
        },
    });

    const selectedType = form.watch("type");
    const selectedCount = form.watch("count");

    const existingCount = useMemo(
        () => workstations.filter((ws) => ws.type === selectedType).length,
        [selectedType, workstations]
    );

    const nextNumber = existingCount > 0
        ? Math.max(...workstations.filter((ws) => ws.type === selectedType).map((ws) => ws.stationNo)) + 1
        : 1;

    const handleCreate = async (values: WorkstationFormValues) => {
        setLoading(true);
        setError("");

        const result = await createWorkstation({
            type: values.type,
            customName: values.customName?.trim() ? values.customName.trim() : undefined,
            departmentId: values.type === WorkstationType.CALLER && values.departmentId && values.departmentId !== "none"
                ? values.departmentId
                : undefined,
            count: values.count,
        });

        if (result.success) {
            const createdStations = Array.isArray(result.data)
                ? (result.data as WorkStation[])
                : result.data
                    ? [result.data as WorkStation]
                    : [];

            onCreated?.(createdStations);
            form.reset({
                type: values.type,
                customName: "",
                departmentId: values.type === WorkstationType.CALLER ? values.departmentId ?? "none" : "none",
                count: 1,
            });
            notify.success(
                createdStations.length > 1 ? `${createdStations.length} workstations created successfully.` : "Workstation created successfully.",
                { duration: 2000 }
            );
        } else {
            setError(result.error || "Failed to create workstation");
        }

        setLoading(false);
    };

    const typeLabel = selectedType === WorkstationType.WINDOW ? "Window" : selectedType === WorkstationType.TRIAGE ? "Triage" : "Caller";

    return (
        <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold text-foreground">Add Workstation</CardTitle>
                <CardDescription className="text-xs">Create new workstations with clear type, name, and optional department binding.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-6 max-w-md">
                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-start">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="text-xs font-medium text-muted-foreground">Workstation Type</FormLabel>
                                        <Select
                                            value={field.value}
                                            onValueChange={(val) => {
                                                field.onChange(val as WorkstationType);
                                                form.setValue("customName", "");
                                                form.setValue("count", 1);
                                                if (val !== WorkstationType.CALLER) {
                                                    form.setValue("departmentId", "none");
                                                }
                                            }}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="h-10 bg-background">
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value={WorkstationType.WINDOW}>Window (Registration)</SelectItem>
                                                <SelectItem value={WorkstationType.TRIAGE}>Triage Desk</SelectItem>
                                                <SelectItem value={WorkstationType.CALLER}>Clinic Caller</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="space-y-2">
                                <p className="text-xs font-medium opacity-0 select-none hidden sm:block">&nbsp;</p>
                                <div className="bg-muted/30 border border-border rounded-lg px-4 h-10 flex flex-col justify-center min-w-35">
                                    <div className="flex justify-start gap-2 items-center text-[10px] sm:text-xs">
                                        <span className="text-muted-foreground font-medium">Existing:</span>
                                        <span className="font-bold text-foreground">{existingCount}</span>
                                    </div>
                                    <div className="flex justify-start gap-2 items-center text-[10px] sm:text-xs mt-0.5">
                                        <span className="text-muted-foreground font-medium">Next:</span>
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{typeLabel} {nextNumber}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {selectedType === WorkstationType.CALLER && (
                            <div className="space-y-2 p-4 bg-muted/20 border border-border rounded-lg">
                                <FormField
                                    control={form.control}
                                    name="departmentId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-medium text-muted-foreground">Linked Department (Optional)</FormLabel>
                                            <Select value={field.value ?? "none"} onValueChange={field.onChange}>
                                                <FormControl>
                                                    <SelectTrigger className="h-10 bg-background">
                                                        <SelectValue placeholder="Generic Caller (All Departments)" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="none">Generic Caller (All Departments)</SelectItem>
                                                    {departments.map((dept) => (
                                                        <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                                    Tip: Use clear station names users can recognize quickly.
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_80px] gap-4">
                            <FormField
                                control={form.control}
                                name="customName"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="text-xs font-medium text-muted-foreground">Custom Name <span className="font-normal opacity-70">(optional)</span></FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={`Leave blank for "${typeLabel} ${nextNumber}"`}
                                                value={field.value ?? ""}
                                                onChange={field.onChange}
                                                className="h-10 bg-background"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="count"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="text-xs font-medium text-muted-foreground">Bulk Qty</FormLabel>
                                        <Select value={String(field.value)} onValueChange={(val) => field.onChange(Number(val))}>
                                            <FormControl>
                                                <SelectTrigger className="h-10 bg-background text-center">
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="min-w-20">
                                                {ALLOWED_COUNTS.map((n) => (
                                                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <WarningCircle size={16} weight="fill" />
                                <AlertTitle>Create failed</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <Button type="submit" className="w-full h-10 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors mb-6" disabled={loading}>
                            {loading ? "Creating..." : selectedCount > 1 ? `+ Add ${selectedCount} ${typeLabel}s` : `+ Add ${typeLabel}`}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
