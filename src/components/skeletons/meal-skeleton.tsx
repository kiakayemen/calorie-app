export function MealSkeleton() {
    return (
        <div className="border-b border-neutral-800 py-5">
            <div className="flex items-start justify-between gap-6">
                <div className="min-w-0 flex-1">
                    <div className="h-4 w-32 animate-pulse rounded bg-neutral-800" />

                    <div className="mt-3 h-3 w-48 animate-pulse rounded bg-neutral-900" />

                    <div className="mt-2 h-3 w-36 animate-pulse rounded bg-neutral-900" />

                    <div className="mt-4 flex gap-3">
                        <div className="h-3 w-10 animate-pulse rounded bg-neutral-900" />
                        <div className="h-3 w-10 animate-pulse rounded bg-neutral-900" />
                        <div className="h-3 w-10 animate-pulse rounded bg-neutral-900" />
                    </div>
                </div>

                <div className="h-4 w-16 animate-pulse rounded bg-neutral-800" />
            </div>
        </div>
    );
}