export type ZonedDateParts = {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
};

export function getZonedDateParts(
    date: Date,
    timezone: string
): ZonedDateParts {
    const formatter =
        new Intl.DateTimeFormat(
            "en-US",
            {
                timeZone: timezone,

                year: "numeric",
                month: "2-digit",
                day: "2-digit",

                hour: "2-digit",
                minute: "2-digit",

                hourCycle: "h23",
            }
        );

    const parts =
        formatter.formatToParts(
            date
        );

    function getPart(
        type:
            | "year"
            | "month"
            | "day"
            | "hour"
            | "minute"
    ) {
        const value =
            parts.find(
                (part) =>
                    part.type === type
            )?.value;

        if (!value) {
            throw new Error(
                `Missing date part: ${type}`
            );
        }

        return Number(value);
    }

    return {
        year: getPart("year"),
        month: getPart("month"),
        day: getPart("day"),
        hour: getPart("hour"),
        minute: getPart("minute"),
    };
}

export function createDateKey(
    parts: ZonedDateParts
) {
    return [
        parts.year,
        String(
            parts.month
        ).padStart(2, "0"),
        String(
            parts.day
        ).padStart(2, "0"),
    ].join("-");
}