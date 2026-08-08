import { MacroSkeleton } from "@/components/skeletons/macro-skeleton";
import { MealSkeleton } from "@/components/skeletons/meal-skeleton";

export function TodaySkeleton() {
    return (
        <main className="min-h-dvh bg-neutral-950 text-neutral-100">
            <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col">
                <header className="px-5 pb-4 pt-8">
                    <div className="h-4 w-36 animate-pulse rounded bg-neutral-800" />

                    <div className="mt-3 h-6 w-20 animate-pulse rounded bg-neutral-800" />
                </header>

                <section className="px-5 pb-8 pt-6">
                    <div className="flex items-end gap-3">
                        <div className="h-12 w-32 animate-pulse rounded bg-neutral-800" />

                        <div className="mb-1 h-4 w-24 animate-pulse rounded bg-neutral-800" />
                    </div>

                    <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-neutral-800">
                        <div className="h-full w-1/3 animate-pulse rounded-full bg-neutral-700" />
                    </div>

                    <div className="mt-7 grid grid-cols-3 gap-4">
                        <MacroSkeleton />
                        <MacroSkeleton />
                        <MacroSkeleton />
                    </div>
                </section>

                <section className="flex-1 border-t border-neutral-800 bg-neutral-950 px-5 pb-44 pt-6">
                    <div className="mb-5 flex items-center justify-between">
                        <div className="h-3 w-28 animate-pulse rounded bg-neutral-800" />

                        <div className="h-3 w-5 animate-pulse rounded bg-neutral-800" />
                    </div>

                    <MealSkeleton />
                    <MealSkeleton />
                    <MealSkeleton />
                </section>

                <div className="fixed inset-x-0 bottom-0 z-20">
                    <div className="mx-auto w-full max-w-xl border-t border-neutral-800 bg-neutral-950/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
                        <div className="h-14 animate-pulse rounded-2xl border border-neutral-800 bg-neutral-900" />

                        <div className="mt-3 grid grid-cols-3 gap-3">
                            <div className="mx-auto h-9 w-14 animate-pulse rounded bg-neutral-900" />
                            <div className="mx-auto h-9 w-14 animate-pulse rounded bg-neutral-900" />
                            <div className="mx-auto h-9 w-14 animate-pulse rounded bg-neutral-900" />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}