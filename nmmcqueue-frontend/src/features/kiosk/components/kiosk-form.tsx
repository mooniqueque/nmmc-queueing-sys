"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCurrentTime } from "@/shared/hooks/use-current-time";
import Link from "next/link";
import { useKioskLogic } from "../hooks/use-kiosk-logic";
import { DemographicsStep } from "./demographics-step";
import { PriorityStep } from "./priority-step";
import { SuccessScreen } from "./success-screen";
import { VitalsStep } from "./vitals-step";

const RELIGION_OPTIONS = [
    "Roman Catholic",
    "Islam",
    "Protestantism",
    "Iglesia ni Cristo (INC)",
    "Philippine Independent Church (Aglipayan)",
    "Seventh-day Adventist Church",
    "Members Church of God International (Ang Dating Daan)",
    "Jesus Miracle Crusade",
    "Church of Jesus Christ of Latter-day Saints (Mormons)",
    "Jehovah's Witnesses",
    "Others"
];

export function KioskForm() {
    const currentTime = useCurrentTime();
    const {
        availableCategories,
        calculateAge,
        confirmClearForm,
        countdown,
        errors,
        formData,
        handleCategoryToggle,
        handleChange,
        handleClearForm,
        handleSubmitAnother,
        isClearConfirmOpen,
        isHydrated,
        isLoading,
        message,
        onSubmit,
        setIsClearConfirmOpen,
        showSuccessModal,
    } = useKioskLogic();

    if (!isHydrated) return null;

    return (
        <Card className="w-full max-w-4xl shadow-sm border-slate-300">
            <CardHeader className="border-b flex flex-col items-center py-5">
                <CardTitle className="text-2xl font-extrabold uppercase tracking-wider text-emerald-800">
                    Patient Intake Form
                </CardTitle>
                <div className="text-sm font-mono text-slate-500">
                    {currentTime ? (
                        `${currentTime.toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })} | ${currentTime.toLocaleTimeString()}`
                    ) : (
                        '\u00A0'
                    )}
                </div>
            </CardHeader>

            <CardContent className="pt-3">
                {message && (
                    <Alert variant={message.type === "success" ? "success" : "error"} className="mb-6">
                        <AlertTitle>{message.type === "success" ? "Submission Complete" : "Submission Error"}</AlertTitle>
                        <AlertDescription>{message.text}</AlertDescription>
                    </Alert>
                )}

                <form onSubmit={onSubmit} className="space-y-6">
                    <PriorityStep
                        formData={formData}
                        availableCategories={availableCategories}
                        onChange={handleChange}
                        onCategoryToggle={handleCategoryToggle}
                    />

                    <DemographicsStep
                        formData={formData}
                        errors={errors}
                        onChange={handleChange}
                    />

                    <VitalsStep
                        formData={formData}
                        errors={errors}
                        onChange={handleChange}
                        calculateAge={calculateAge}
                        religionOptions={RELIGION_OPTIONS}
                    />

                    <div className="pt-6 border-t mt-8 mb-5 flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <Link href="/kiosk" className="w-full sm:w-1/3">
                            <Button type="button" variant="outline" className="w-full h-12 text-base font-semibold border-slate-300 text-slate-700">
                                Back
                            </Button>
                        </Link>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClearForm}
                            className="h-12 w-full text-base font-semibold text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 sm:min-w-35 sm:w-auto"
                        >
                            Clear Form
                        </Button>
                        <Button type="submit" className="w-full sm:flex-1 h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-700" disabled={isLoading}>
                            {isLoading ? "Submitting Form..." : "Submit Registration"}
                        </Button>
                    </div>
                </form>
            </CardContent>

            <SuccessScreen
                isOpen={showSuccessModal}
                countdown={countdown}
                onSubmitAnother={handleSubmitAnother}
            />

            <Dialog open={isClearConfirmOpen} onOpenChange={setIsClearConfirmOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Clear form data?</DialogTitle>
                        <DialogDescription>
                            This will erase all current input in the intake form.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsClearConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmClearForm}>
                            Clear Form
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}