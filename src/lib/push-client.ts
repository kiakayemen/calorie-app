function urlBase64ToUint8Array(
    base64String: string
): Uint8Array<ArrayBuffer> {
    const padding =
        "=".repeat(
            (4 -
                (base64String.length %
                    4)) %
                4
        );

    const base64 = (
        base64String + padding
    )
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const rawData =
        window.atob(base64);

    const output =
        new Uint8Array(
            rawData.length
        );

    for (
        let i = 0;
        i < rawData.length;
        i++
    ) {
        output[i] =
            rawData.charCodeAt(i);
    }

    return output;
}

export function supportsPush() {
    return (
        "serviceWorker" in
            navigator &&
        "PushManager" in window &&
        "Notification" in window
    );
}

export async function getPushSubscription() {
    const registration =
        await navigator
            .serviceWorker
            .ready;

    return registration
        .pushManager
        .getSubscription();
}

export async function subscribeToPush() {
    const publicKey =
        process.env
            .NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    if (!publicKey) {
        throw new Error(
            "VAPID public key is missing."
        );
    }

    if (!supportsPush()) {
        throw new Error(
            "Push notifications aren't supported on this device."
        );
    }

    const permission =
        await Notification.requestPermission();

    if (
        permission !==
        "granted"
    ) {
        throw new Error(
            "Notification permission wasn't granted."
        );
    }

    const registration =
        await navigator
            .serviceWorker
            .ready;

    let subscription =
        await registration
            .pushManager
            .getSubscription();

    if (!subscription) {
        subscription =
            await registration
                .pushManager
                .subscribe({
                    userVisibleOnly:
                        true,

                    applicationServerKey:
                        urlBase64ToUint8Array(
                            publicKey
                        ),
                });
    }

    const response =
        await fetch(
            "/api/push/subscribe",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",
                },

                body: JSON.stringify(
                    subscription
                ),
            }
        );

    if (!response.ok) {
        throw new Error(
            "Couldn't save push subscription."
        );
    }

    return subscription;
}

export async function unsubscribeFromPush() {
    const subscription =
        await getPushSubscription();

    if (!subscription) {
        return;
    }

    const endpoint =
        subscription.endpoint;

    await subscription.unsubscribe();

    await fetch(
        "/api/push/unsubscribe",
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json",
            },

            body: JSON.stringify({
                endpoint,
            }),
        }
    );
}