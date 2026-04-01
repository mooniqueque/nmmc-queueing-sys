"use client";

import { useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { AlertCircle, RotateCcw } from "lucide-react";
import { notify } from "@/lib/notify";
import { resetDailySequences } from "../../settings-actions";

export default function ResetServices() {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [verificationText, setVerificationText] = useState("");
    const [isResetting, setIsResetting] = useState(false);

    const handleReset = async () => {
        if (verificationText !== "RESET") return;

        setIsResetting(true);
        try {
            const res = await resetDailySequences();
            if (res.success) {
                notify.success("All ticket sequences have been reset to 1.");
                setIsConfirmOpen(false);
                setVerificationText("");
            } else {
                notify.error(res.error || "Failed to reset sequences.");
            }
        } catch (error) {
            notify.error("An unexpected error occurred.");
            console.error(error);
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <RotateCcw className="h-5 w-5 text-muted-foreground" />
                    <CardTitle>Reset Services</CardTitle>
                </div>
                <CardDescription>
                    Reset all ticket counters to zero. New patients will start from ticket #1.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4 flex gap-3 text-sm text-destructive">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <div className="space-y-1">
                        <p className="font-semibold">Destructive Action</p>
                        <p className="opacity-90">
                            This will clear the current queue progress for all departments. This action cannot be reversed.
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-end">
                    <Dialog open={isConfirmOpen} onOpenChange={(val) => {
                        setIsConfirmOpen(val);
                        if (!val) setVerificationText("");
                    }}>
                        <DialogTrigger asChild>
                            <Button variant="destructive" className="mb-8">
                                Reset Daily Counter
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Are you absolutely sure?</DialogTitle>
                                <DialogDescription>
                                    All ticket sequences will be reset to 0. This is typically done before opening each day.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="py-4 space-y-3">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Please type <span className="font-bold text-foreground underline decoration-destructive">RESET</span> to confirm.
                                </p>
                                <Input
                                    placeholder="RESET"
                                    value={verificationText}
                                    onChange={(e) => setVerificationText(e.target.value.toUpperCase())}
                                    autoFocus
                                />
                            </div>

                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsConfirmOpen(false)}
                                    disabled={isResetting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    disabled={verificationText !== "RESET" || isResetting}
                                    onClick={handleReset}
                                >
                                    {isResetting ? "Resetting..." : "Confirm Reset"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardContent>
        </Card>
    );
}
