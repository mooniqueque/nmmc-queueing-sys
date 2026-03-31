import ResetServices from "@/features/admin/components/admin-settings/reset-services";

export const metadata = {
    title: "Reset Services | NMMC Queue",
    description: "Manual ticket sequence reset for administrative maintenance.",
};

export default function AdminResetServicesPage() {
    return (
        <div className="container mx-auto py-10 max-w-2xl">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold tracking-tight">System Reset</h1>
                <p className="text-sm text-muted-foreground">
                    Reset global ticket counters for the start of the day.
                </p>
            </div>
            
            <ResetServices />
        </div>
    );
}
