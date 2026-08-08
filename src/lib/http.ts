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