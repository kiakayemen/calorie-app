export async function readJsonResponse<T>(
    response: Response
): Promise<T> {
    const text = await response.text();

    if (!text) {
        throw new Error(
            `Server returned an empty response (${response.status}).`
        );
    }

    try {
        return JSON.parse(text) as T;
    } catch {
        console.error(
            "Server returned non-JSON response:",
            {
                status: response.status,
                body: text,
            }
        );

        throw new Error(
            `Server returned an invalid response (${response.status}).`
        );
    }
}

export type TimedResponse = {
    response: Response;
    durationMs: number;
};

export async function fetchWithTiming(
    input: RequestInfo | URL,
    init?: RequestInit
): Promise<TimedResponse> {
    const startedAt =
        typeof performance !== "undefined"
            ? performance.now()
            : Date.now();

    const response = await fetch(
        input,
        init
    );

    const finishedAt =
        typeof performance !== "undefined"
            ? performance.now()
            : Date.now();

    return {
        response,
        durationMs:
            Math.round(
                finishedAt - startedAt
            ),
    };
}
