"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mergePatient, searchPatients } from "@/features/triage/actions";
import { notify } from "@/shared/lib/notify";
import { calculateAge } from "@/shared/lib/utils";
import { Link as LinkIcon, MagnifyingGlass, UserPlus } from "@phosphor-icons/react";
import { useState, useTransition } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface PatientLinkDialogProps {
    visitId: string;
    currentPatientName: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onMergeSuccess: (mergedData: any) => void;
}

export function PatientLinkDialog({ visitId, currentPatientName, onMergeSuccess }: PatientLinkDialogProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [results, setResults] = useState<any[]>([]);
    const [isSearching, startSearch] = useTransition();
    const [isMerging, startMerge] = useTransition();

    const handleSearch = () => {
        if (!query.trim()) return;
        startSearch(async () => {
            const res = await searchPatients(query);
            if (res.success && res.data) {
                setResults(res.data);
            }
        });
    };

    const handleMerge = (targetPatientId: string) => {
        startMerge(async () => {
            const res = await mergePatient(visitId, targetPatientId);
            if (res.success) {
                notify.success("Patient Record Linked", {
                    description: "The Kiosk visit has been safely merged into the existing HIS profile."
                });
                onMergeSuccess(res.data);
                setOpen(false);
            } else {
                notify.error("Failed to merge patient record", {
                    description: res.error || "Unknown error occurred"
                });
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-7 text-[10px] uppercase font-bold tracking-widest border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 bg-emerald-50/50">
                    <MagnifyingGlass size={14} weight="bold" className="mr-1.5" />
                    VERIFY TO CHECK IF NEW/OLD
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] border-border bg-card">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-foreground font-bold">
                        <LinkIcon size={20} className="text-primary" /> Verify & Link Patient
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground font-medium">
                        Search the Hospital Information System for <strong className="text-foreground">{currentPatientName}</strong>. If they visited before, link this kiosk visit to their old Hospital ID to prevent duplicate records.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2 relative">
                    <div className="flex items-end gap-3">
                        <div className="flex-1 space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Search by Name or ID</Label>
                            <Input
                                placeholder="Enter First Name, Last Name, or NMMC-XXXX..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="font-medium bg-background border-border"
                            />
                        </div>
                        <Button
                            onClick={handleSearch}
                            disabled={isSearching || isMerging}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                        >
                            {isSearching ? "Searching..." : "Search"}
                        </Button>
                    </div>

                    <div className="min-h-[200px] max-h-[300px] overflow-y-auto border border-border rounded-xl bg-muted/20 p-2 space-y-2 custom-scrollbar">
                        {results.length === 0 && !isSearching && (
                            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-3 opacity-60">
                                <UserPlus size={48} weight="duotone" />
                                <div className="space-y-1">
                                    <p className="text-sm font-bold">No Existing Records Found</p>
                                    <p className="text-xs">If you are certain they are new, you may just continue assessing them in the form underneath.</p>
                                </div>
                            </div>
                        )}

                        {results.map((p) => {
                            const age = calculateAge(p.dateOfBirth);
                            return (
                                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:border-primary/40 transition-colors shadow-sm">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-sm text-foreground">{p.lastName}, {p.firstName} {p.middleName || ''}</h4>
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">{p.hospitalId || 'NO ID'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                            <span>{new Date(p.dateOfBirth).toISOString().split('T')[0]} ({age} yrs)</span>
                                            <span>•</span>
                                            <span className="truncate max-w-[200px]">{p.address}</span>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={isMerging}
                                        onClick={() => handleMerge(p.id)}
                                        className="h-8 text-[11px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border-emerald-200"
                                    >
                                        Link Record
                                    </Button>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
