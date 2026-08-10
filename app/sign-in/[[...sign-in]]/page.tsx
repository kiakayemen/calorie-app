import {
    SignIn,
} from "@clerk/nextjs";

export default function SignInPage() {
    return (
        <main className="flex min-h-dvh items-center justify-center bg-neutral-950 px-5">
            <SignIn
                appearance={{
                    variables: {
                        colorBackground:
                            "#171717",

                        colorForeground:
                            "#f5f5f5",

                        colorMutedForeground:
                            "#a3a3a3",

                        colorPrimary:
                            "#f5f5f5",

                        colorInput:
                            "#262626",

                        colorInputForeground:
                            "#f5f5f5",

                        colorPrimaryForeground:
                            "#171717",
                    },
                }}
            />
        </main>
    );
}
