export function PageSkeleton({ lines = 5, header }: { lines?: number; header?: string }) {
    return (
        <div className="p-6 max-w-7xl mx-auto mt-4 animate-pulse">
            {header && (
                <div className="h-8 w-64 bg-emerald-100 rounded-md mb-6" />
            )}
            <div className="space-y-4">
                {/* Card skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-28 bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                            <div className="h-4 w-24 bg-slate-100 rounded mb-3" />
                            <div className="h-8 w-16 bg-slate-100 rounded" />
                        </div>
                    ))}
                </div>
                {/* Table rows skeleton */}
                {Array.from({ length: lines }).map((_, i) => (
                    <div key={i} className="flex gap-4 items-center">
                        <div className="h-4 w-full bg-slate-100 rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function DashboardSkeleton({ lines = 5 }: { lines?: number }) {
    return (
        <div className="flex flex-1 flex-col animate-pulse w-full bg-slate-50/50 min-h-screen">
            {/* Header Section */}
            <header className='bg-white sticky top-0 z-50 border-b px-6 py-4 flex items-center justify-between shadow-sm'>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-slate-200" />
                    <div className="h-7 w-48 bg-emerald-100 rounded-md" />
                </div>
                <div className='flex items-center gap-3'>
                    <div className="hidden sm:flex flex-col items-end mr-1 space-y-2 py-1">
                        <div className="h-4 w-24 bg-slate-200 rounded" />
                        <div className="h-3 w-16 bg-slate-200 rounded" />
                    </div>
                    <div className='size-10 rounded-full bg-slate-200 ring-2 ring-slate-100' />
                </div>
            </header>

            <main className='flex-1 p-6 space-y-6 px-10'>
                {/* 4 Cards Skeleton */}
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3'>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-28 bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col justify-between">
                            <div className="flex justify-between items-center">
                                <div className="h-4 w-24 bg-slate-200 rounded" />
                            </div>
                            <div className="h-8 w-16 bg-slate-200 rounded mt-4" />
                        </div>
                    ))}
                </div>

                {/* Controls Skeleton */}
                <div className="h-16 bg-white rounded-xl border border-slate-100 shadow-sm w-full" />

                {/* Table Skeleton */}
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-4">
                    <div className="h-8 w-full bg-slate-50 rounded mb-4" />
                    {Array.from({ length: lines }).map((_, i) => (
                        <div key={i} className="h-10 w-full bg-slate-50 rounded" />
                    ))}
                </div>
            </main>
        </div>
    );
}

export function FullPageSkeleton() {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                <span className="text-sm text-slate-400 font-medium">Loading...</span>
            </div>
        </div>
    );
}
