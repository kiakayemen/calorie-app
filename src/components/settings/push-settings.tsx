"use client";

import {
    Bell,
    BellOff,
    Loader2,
} from "lucide-react";

import {
    useEffect,
    useState,
} from "react";

import {
    getPushSubscription,
    subscribeToPush,
    supportsPush,
    unsubscribeFromPush,
} from "@/lib/push-client";

export function PushSettings() {
    const [supported, setSupported] =
        useState<boolean | null>(
            null
        );

    const [subscribed, setSubscribed] =
        useState(false);

    const [permission, setPermission] =
        useState<
            NotificationPermission | "unsupported"
        >("unsupported");

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(
            null
        );

    useEffect(() => {
        async function check() {
            if (
                typeof window ===
                "undefined"
            ) {
                return;
            }

            const isSupported =
                supportsPush();

            setSupported(
                isSupported
            );

            if (!isSupported) {
                setLoading(false);

                return;
            }

            setPermission(
                Notification.permission
            );

            try {
                const subscription =
                    await getPushSubscription();

                setSubscribed(
                    Boolean(
                        subscription
                    )
                );
            } catch (error) {
                console.error(
                    "Push state check failed:",
                    error
                );
            } finally {
                setLoading(false);
            }
        }

        void check();
    }, []);

    async function enable() {
        setLoading(true);
        setError(null);

        console.log(
            "Enable notifications clicked"
        );

        try {
            console.log(
                "Current permission:",
                Notification.permission
            );

            console.log(
                "Push supported:",
                supportsPush()
            );

            const subscription =
                await subscribeToPush();

            console.log(
                "Push subscription created:",
                subscription.toJSON()
            );

            setPermission(
                Notification.permission
            );

            setSubscribed(true);
        } catch (error) {
            console.error(
                "Enable push failed:",
                error
            );

            setPermission(
                Notification.permission
            );

            setError(
                error instanceof Error
                    ? error.message
                    : "Couldn't enable notifications."
            );
        } finally {
            setLoading(false);
        }
    }

    async function disable() {
        setLoading(true);
        setError(null);

        try {
            await unsubscribeFromPush();

            setSubscribed(false);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Couldn't disable notifications."
            );
        } finally {
            setLoading(false);
        }
    }

    if (
        supported === null
    ) {
        return null;
    }

    if (!supported) {
        return (
            <div>
                <p className="text-sm font-medium text-neutral-200">
                    Push notifications
                </p>

                <p className="mt-2 text-sm leading-6 text-neutral-500">
                    Push notifications
                    aren&apos;t supported in
                    this browser or mode.
                </p>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-start justify-between gap-6">
                <div>
                    <p className="text-sm font-medium text-neutral-200">
                        Push notifications
                    </p>

                    <p className="mt-1 text-sm leading-6 text-neutral-500">
                        Permission:{" "}
                        <span className="text-neutral-300">
                            {permission}
                        </span>
                    </p>

                    <p className="mt-1 text-sm leading-6 text-neutral-500">
                        Get your daily
                        calorie summary at
                        the time you set.
                    </p>
                </div>

                <button
                    type="button"
                    disabled={loading}
                    onClick={
                        subscribed
                            ? disable
                            : enable
                    }
                    className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                        subscribed
                            ? "bg-neutral-800 text-neutral-200 hover:bg-neutral-700"
                            : "bg-neutral-100 text-neutral-950 hover:bg-white"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                    {loading ? (
                        <Loader2
                            size={16}
                            className="animate-spin"
                        />
                    ) : subscribed ? (
                        <BellOff
                            size={16}
                        />
                    ) : (
                        <Bell
                            size={16}
                        />
                    )}

                    {subscribed
                        ? "Disable"
                        : "Enable"}
                </button>
            </div>

            {subscribed && (
                <p className="mt-3 text-xs text-emerald-400">
                    Notifications enabled
                </p>
            )}

            {error && (
                <p className="mt-3 text-xs leading-5 text-red-400">
                    {error}
                </p>
            )}
        </div>
    );
}