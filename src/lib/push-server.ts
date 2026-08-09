import webpush from "web-push";

const publicKey =
    process.env
        .NEXT_PUBLIC_VAPID_PUBLIC_KEY;

const privateKey =
    process.env
        .VAPID_PRIVATE_KEY;

const subject =
    process.env.VAPID_SUBJECT;

if (
    !publicKey ||
    !privateKey ||
    !subject
) {
    throw new Error(
        "VAPID environment variables are missing."
    );
}

webpush.setVapidDetails(
    subject,
    publicKey,
    privateKey
);

export type PushPayload = {
    title: string;
    body: string;
    url?: string;
    tag?: string;
};

export async function sendPush(
    subscription: {
        endpoint: string;

        keys: {
            p256dh: string;
            auth: string;
        };
    },

    payload: PushPayload
) {
    return webpush.sendNotification(
        subscription,
        JSON.stringify(payload)
    );
}