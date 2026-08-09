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
            new ArrayBuffer(
                rawData.length
            )
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
    if (
        typeof window ===
        "undefined"
    ) {
        return false;
    }

    return (
        "serviceWorker" in
            navigator &&
        "PushManager" in
            window &&
        "Notification" in
            window
    );
}

export async function getPushSubscription() {
    if (!supportsPush()) {
        return null;
    }

    const registration =
        await navigator
            .serviceWorker
            .ready;

    return registration
        .pushManager
        .getSubscription();
}

export async function subscribeToPush() {
    if (!supportsPush()) {
        throw new Error(
            "Push notifications are not supported."
        );
    }

    const publicKey =
        process.env
            .NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    if (!publicKey) {
        throw new Error(
            "NEXT_PUBLIC_VAPID_PUBLIC_KEY is missing."
        );
    }

    console.log(
        "Requesting notification permission..."
    );

    const permission =
        await Notification
            .requestPermission();

    console.log(
        "Permission result:",
        permission
    );

    if (
        permission !==
        "granted"
    ) {
        throw new Error(
            `Notification permission is ${permission}.`
        );
    }

    console.log(
        "Waiting for service worker..."
    );

    const registration =
        await navigator
            .serviceWorker
            .ready;

    console.log(
        "Service worker ready:",
        registration
    );

    let subscription =
        await registration
            .pushManager
            .getSubscription();

    if (!subscription) {
        console.log(
            "Creating push subscription..."
        );

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

    console.log(
        "Subscription:",
        subscription.toJSON()
    );

    const response =
        await fetch(
            "/api/push/subscribe",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",
                },

                body:
                    JSON.stringify(
                        subscription
                    ),
            }
        );

    const responseText =
        await response.text();

    console.log(
        "Subscribe API:",
        response.status,
        responseText
    );

    if (!response.ok) {
        throw new Error(
            responseText ||
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

    await subscription
        .unsubscribe();

    await fetch(
        "/api/push/unsubscribe",
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json",
            },

            body:
                JSON.stringify({
                    endpoint,
                }),
        }
    );
}
