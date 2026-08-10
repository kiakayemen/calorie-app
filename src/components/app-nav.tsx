"use client";

import Link from "next/link";

import {
    History,
    Settings,
    Utensils,
} from "lucide-react";

import {
    UserButton,
} from "@clerk/nextjs";

type Props = {
    active:
        | "today"
        | "history"
        | "settings";
};

export function AppNav({
    active,
}: Props) {
    return (
        <nav className="grid grid-cols-4">
            <NavItem
                href="/"
                label="Today"
                active={
                    active === "today"
                }
                icon={
                    <Utensils
                        size={17}
                    />
                }
            />

            <NavItem
                href="/history"
                label="History"
                active={
                    active === "history"
                }
                icon={
                    <History
                        size={17}
                    />
                }
            />

            <NavItem
                href="/settings"
                label="Settings"
                active={
                    active === "settings"
                }
                icon={
                    <Settings
                        size={17}
                    />
                }
            />

            <AccountItem />
        </nav>
    );
}

function NavItem({
    href,
    label,
    icon,
    active,
}: {
    href: string;
    label: string;
    icon: React.ReactNode;
    active: boolean;
}) {
    return (
        <Link
            href={href}
            className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] transition-colors ${
                active
                    ? "text-white"
                    : "text-neutral-500 hover:text-neutral-300"
            }`}
        >
            {icon}

            {label}
        </Link>
    );
}

function AccountItem() {
    return (
        <div className="flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] text-neutral-500">
            <UserButton
                appearance={{
                    elements: {
                        avatarBox:
                            "size-[17px]",
                    },
                }}
            />

            <span>
                Account
            </span>
        </div>
    );
}