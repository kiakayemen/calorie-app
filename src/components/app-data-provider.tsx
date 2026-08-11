"use client";

import {
    createContext,
    useContext,
    useEffect,
    useEffectEvent,
    useRef,
    useState,
} from "react";

import { usePathname } from "next/navigation";

import { readJsonResponse } from "@/lib/http";

import type { LoggedMeal } from "@/lib/nutrition";
import type { AppSettings } from "@/lib/settings";

const CACHE_TTL_MS = 30_000;

const DEFAULT_SETTINGS: AppSettings = {
    calorieGoal: 2200,
    notificationHour: 21,
    notificationMinute: 0,
    timezone: "UTC",
};

type AppDataContextValue = {
    meals: LoggedMeal[];
    mealsLoaded: boolean;
    settings: AppSettings;
    settingsLoaded: boolean;
    settingsError: string | null;
    addMeal: (meal: LoggedMeal) => void;
    deleteMeal: (id: string) => Promise<void>;
    setSettings: React.Dispatch<
        React.SetStateAction<AppSettings>
    >;
};

const AppDataContext =
    createContext<AppDataContextValue | null>(
        null
    );

export function AppDataProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const [meals, setMeals] =
        useState<LoggedMeal[]>([]);
    const [mealsLoaded, setMealsLoaded] =
        useState(false);

    const [settings, setSettingsState] =
        useState(DEFAULT_SETTINGS);
    const [settingsLoaded, setSettingsLoaded] =
        useState(false);
    const [settingsError, setSettingsError] =
        useState<string | null>(null);

    const mealsRequest =
        useRef<Promise<void> | null>(null);
    const settingsRequest =
        useRef<Promise<void> | null>(null);
    const mealsLoadedAt = useRef(0);
    const settingsLoadedAt = useRef(0);
    const mealsVersion = useRef(0);
    const settingsVersion = useRef(0);

    const loadMeals = useEffectEvent(
        async () => {
            if (
                mealsRequest.current ||
                Date.now() - mealsLoadedAt.current <
                    CACHE_TTL_MS
            ) {
                return mealsRequest.current;
            }

            const version =
                mealsVersion.current;
            const request = (async () => {
                try {
                    const response = await fetch(
                        "/api/meals",
                        { cache: "no-store" }
                    );
                    const data =
                        await readJsonResponse<
                            | LoggedMeal[]
                            | { error: string }
                        >(response);

                    if (
                        !response.ok ||
                        !Array.isArray(data)
                    ) {
                        throw new Error(
                            !Array.isArray(data) &&
                                "error" in data
                                ? data.error
                                : "Couldn't load meals."
                        );
                    }

                    if (
                        version ===
                        mealsVersion.current
                    ) {
                        setMeals(data);
                        mealsLoadedAt.current =
                            Date.now();
                    }
                } catch (error) {
                    console.error(
                        "Failed to load meals:",
                        error
                    );
                } finally {
                    setMealsLoaded(true);
                    mealsRequest.current = null;
                }
            })();

            mealsRequest.current = request;
            return request;
        }
    );

    const loadSettings = useEffectEvent(
        async () => {
            if (
                settingsRequest.current ||
                Date.now() -
                    settingsLoadedAt.current <
                    CACHE_TTL_MS
            ) {
                return settingsRequest.current;
            }

            const version =
                settingsVersion.current;
            const request = (async () => {
                setSettingsError(null);

                try {
                    const response = await fetch(
                        "/api/settings",
                        { cache: "no-store" }
                    );
                    const data =
                        await readJsonResponse<
                            | AppSettings
                            | { error: string }
                        >(response);

                    if (
                        !response.ok ||
                        "error" in data
                    ) {
                        throw new Error(
                            "error" in data
                                ? data.error
                                : "Couldn't load settings."
                        );
                    }

                    if (
                        version ===
                        settingsVersion.current
                    ) {
                        setSettingsState(data);
                        settingsLoadedAt.current =
                            Date.now();
                    }
                } catch (error) {
                    const message =
                        error instanceof Error
                            ? error.message
                            : "Something went wrong.";

                    setSettingsError(message);
                    console.error(
                        "Failed to load settings:",
                        error
                    );
                } finally {
                    setSettingsLoaded(true);
                    settingsRequest.current = null;
                }
            })();

            settingsRequest.current = request;
            return request;
        }
    );

    useEffect(() => {
        if (
            pathname === "/" ||
            pathname === "/history"
        ) {
            void loadMeals();
        }

        if (
            pathname === "/" ||
            pathname === "/settings"
        ) {
            void loadSettings();
        }
    }, [pathname]);

    function addMeal(meal: LoggedMeal) {
        mealsVersion.current += 1;
        setMeals((current) => [
            meal,
            ...current.filter(
                (item) => item.id !== meal.id
            ),
        ]);
        mealsLoadedAt.current = Date.now();
        setMealsLoaded(true);
    }

    async function deleteMeal(id: string) {
        const removedIndex = meals.findIndex(
            (meal) => meal.id === id
        );
        const removedMeal = meals[removedIndex];

        mealsVersion.current += 1;
        setMeals((current) =>
            current.filter(
                (meal) => meal.id !== id
            )
        );

        try {
            const response = await fetch(
                `/api/meals/${id}`,
                { method: "DELETE" }
            );

            if (!response.ok) {
                throw new Error(
                    "Couldn't delete meal."
                );
            }
        } catch (error) {
            if (removedMeal) {
                setMeals((current) => {
                    if (
                        current.some(
                            (meal) =>
                                meal.id === id
                        )
                    ) {
                        return current;
                    }

                    const restored = [
                        ...current,
                    ];
                    restored.splice(
                        removedIndex,
                        0,
                        removedMeal
                    );
                    return restored;
                });
            }

            throw error;
        }
    }

    const setSettings: React.Dispatch<
        React.SetStateAction<AppSettings>
    > = (action) => {
        settingsVersion.current += 1;
        settingsLoadedAt.current = Date.now();
        setSettingsLoaded(true);
        setSettingsState(action);
    };

    return (
        <AppDataContext.Provider
            value={{
                meals,
                mealsLoaded,
                settings,
                settingsLoaded,
                settingsError,
                addMeal,
                deleteMeal,
                setSettings,
            }}
        >
            {children}
        </AppDataContext.Provider>
    );
}

export function useAppData() {
    const context =
        useContext(AppDataContext);

    if (!context) {
        throw new Error(
            "useAppData must be used inside AppDataProvider."
        );
    }

    return context;
}
