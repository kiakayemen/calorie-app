"use client";

import {
    FormEvent,
    useEffect,
    useState,
} from "react";

import { PushSettings } from "@/components/settings/push-settings";

import {
    Check,
    Loader2,
} from "lucide-react";

import { AppNav } from "@/components/app-nav";

import { readJsonResponse } from "@/lib/http";

import type { AppSettings } from "@/lib/settings";

export default function SettingsPage() {
    const [settings, setSettings] =
        useState<AppSettings>({
            calorieGoal: 2200,
            notificationHour: 21,
            notificationMinute: 0,
            timezone:
                Intl.DateTimeFormat()
                    .resolvedOptions()
                    .timeZone,
        });

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [saved, setSaved] =
        useState(false);

    const [error, setError] =
        useState<string | null>(
            null
        );

    useEffect(() => {
        async function loadSettings() {
            try {
                const response =
                    await fetch(
                        "/api/settings",
                        {
                            cache:
                                "no-store",
                        }
                    );

                const data =
                    await readJsonResponse<
                        AppSettings | {
                            error: string;
                        }
                    >(response);

                if (!response.ok) {
                    throw new Error(
                        "error" in data
                            ? data.error
                            : "Couldn't load settings."
                    );
                }

                if (
                    "error" in data
                ) {
                    throw new Error(
                        data.error
                    );
                }

                setSettings(data);
            } catch (error) {
                setError(
                    error instanceof
                    Error
                        ? error.message
                        : "Something went wrong."
                );
            } finally {
                setLoading(false);
            }
        }

        void loadSettings();
    }, []);

    async function handleSubmit(
        event: FormEvent
    ) {
        event.preventDefault();

        setSaving(true);
        setSaved(false);
        setError(null);

        try {
            const response =
                await fetch(
                    "/api/settings",
                    {
                        method:
                            "PUT",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify(
                                settings
                            ),
                    }
                );

            const data =
                await readJsonResponse<
                    AppSettings | {
                        error: string;
                    }
                >(response);

            if (!response.ok) {
                throw new Error(
                    "error" in data
                        ? data.error
                        : "Couldn't save settings."
                );
            }

            if (
                "error" in data
            ) {
                throw new Error(
                    data.error
                );
            }

            setSettings(data);
            setSaved(true);

            window.setTimeout(
                () =>
                    setSaved(
                        false
                    ),
                2000
            );
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Something went wrong."
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className="min-h-dvh bg-neutral-950 text-neutral-100">
            <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col">
                <header className="px-5 pb-5 pt-8">
                    <p className="text-sm text-neutral-500">
                        Preferences
                    </p>

                    <h1 className="mt-1 text-xl font-semibold tracking-tight">
                        Settings
                    </h1>
                </header>

                <section className="flex-1 border-t border-neutral-800 px-5 pb-28 pt-7">
                    {loading ? (
                        <p className="text-sm text-neutral-500">
                            Loading...
                        </p>
                    ) : (
                        <form
                            onSubmit={
                                handleSubmit
                            }
                            className="space-y-8"
                        >
                            <Field>
                                <Label>
                                    Daily
                                    calorie
                                    goal
                                </Label>

                                <div className="flex items-center rounded-xl border border-neutral-800 bg-neutral-900">
                                    <input
                                        type="number"
                                        min={
                                            500
                                        }
                                        max={
                                            10000
                                        }
                                        value={
                                            settings.calorieGoal
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setSettings(
                                                (
                                                    current
                                                ) => ({
                                                    ...current,

                                                    calorieGoal:
                                                        Number(
                                                            event
                                                                .target
                                                                .value
                                                        ),
                                                })
                                            )
                                        }
                                        className="min-w-0 flex-1 bg-transparent px-4 py-3 text-neutral-100 outline-none"
                                    />

                                    <span className="pr-4 text-sm text-neutral-500">
                                        kcal
                                    </span>
                                </div>
                            </Field>

                            <Field>
                                <Label>
                                    Daily
                                    summary
                                </Label>

                                <input
                                    type="time"
                                    value={`${String(
                                        settings.notificationHour
                                    ).padStart(
                                        2,
                                        "0"
                                    )}:${String(
                                        settings.notificationMinute
                                    ).padStart(
                                        2,
                                        "0"
                                    )}`}
                                    onChange={(
                                        event
                                    ) => {
                                        const [
                                            hour,
                                            minute,
                                        ] =
                                            event.target.value
                                                .split(
                                                    ":"
                                                )
                                                .map(
                                                    Number
                                                );

                                        setSettings(
                                            (
                                                current
                                            ) => ({
                                                ...current,

                                                notificationHour:
                                                    hour,

                                                notificationMinute:
                                                    minute,
                                            })
                                        );
                                    }}
                                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-neutral-100 outline-none"
                                />

                                <p className="mt-2 text-xs leading-5 text-neutral-500">
                                    We&apos;ll use
                                    this when
                                    push
                                    notifications
                                    are enabled.
                                </p>
                            </Field>

                            <Field>
                                <Label>
                                    Timezone
                                </Label>

                                <input
                                    type="text"
                                    value={
                                        settings.timezone
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setSettings(
                                            (
                                                current
                                            ) => ({
                                                ...current,

                                                timezone:
                                                    event
                                                        .target
                                                        .value,
                                            })
                                        )
                                    }
                                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-neutral-100 outline-none"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setSettings(
                                            (
                                                current
                                            ) => ({
                                                ...current,

                                                timezone:
                                                    Intl.DateTimeFormat()
                                                        .resolvedOptions()
                                                        .timeZone,
                                            })
                                        )
                                    }
                                    className="mt-2 text-xs text-neutral-500 underline underline-offset-4 transition hover:text-neutral-300"
                                >
                                    Use this
                                    device&apos;s
                                    timezone
                                </button>
                            </Field>

                            {error && (
                                <p className="text-sm text-red-400">
                                    {
                                        error
                                    }
                                </p>
                            )}
                            <div className="border-t border-neutral-800 pt-7">
                                <PushSettings />
                            </div>
                            <button
                                type="submit"
                                disabled={
                                    saving
                                }
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-100 px-4 py-3 font-medium text-neutral-950 transition hover:bg-white disabled:bg-neutral-800 disabled:text-neutral-500"
                            >
                                {saving ? (
                                    <>
                                        <Loader2
                                            size={
                                                17
                                            }
                                            className="animate-spin"
                                        />

                                        Saving
                                    </>
                                ) : saved ? (
                                    <>
                                        <Check
                                            size={
                                                17
                                            }
                                        />

                                        Saved
                                    </>
                                ) : (
                                    "Save settings"
                                )}
                            </button>
                        </form>
                    )}
                </section>

                <div className="fixed inset-x-0 bottom-0 z-20">
                    <div className="mx-auto w-full max-w-xl border-t border-neutral-800 bg-neutral-950/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl">
                        <AppNav
                            active="settings"
                        />
                    </div>
                </div>
            </div>
        </main>
    );
}

function Field({
    children,
}: {
    children:
        React.ReactNode;
}) {
    return (
        <div>
            {children}
        </div>
    );
}

function Label({
    children,
}: {
    children:
        React.ReactNode;
}) {
    return (
        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
            {children}
        </label>
    );
}