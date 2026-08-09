self.addEventListener(
    "install",
    () => {
        self.skipWaiting();
    }
);

self.addEventListener(
    "activate",
    (event) => {
        event.waitUntil(
            self.clients.claim()
        );
    }
);

self.addEventListener(
    "push",
    (event) => {
        if (!event.data) {
            return;
        }

        let payload;

        try {
            payload =
                event.data.json();
        } catch {
            payload = {
                title: "Calorie",
                body:
                    event.data.text(),
            };
        }

        const title =
            payload.title ||
            "Calorie";

        const options = {
            body:
                payload.body ||
                "You have a new update.",

            icon:
                "/icons/icon-192.png",

            badge:
                "/icons/icon-192.png",

            tag:
                payload.tag ||
                "calorie-notification",

            data: {
                url:
                    payload.url ||
                    "/",
            },
        };

        event.waitUntil(
            self.registration.showNotification(
                title,
                options
            )
        );
    }
);

self.addEventListener(
    "notificationclick",
    (event) => {
        event.notification.close();

        const targetUrl =
            event.notification
                .data?.url ||
            "/";

        event.waitUntil(
            self.clients
                .matchAll({
                    type: "window",
                    includeUncontrolled:
                        true,
                })
                .then(
                    async (
                        clients
                    ) => {
                        for (
                            const client of
                            clients
                        ) {
                            if (
                                "focus" in
                                client
                            ) {
                                await client.navigate(
                                    targetUrl
                                );

                                return client.focus();
                            }
                        }

                        return self.clients.openWindow(
                            targetUrl
                        );
                    }
                )
        );
    }
);