export function getUtcRangeForLocalDate(
    dateKey: string,
    timezone: string
) {
    const [
        year,
        month,
        day,
    ] =
        dateKey
            .split("-")
            .map(Number);

    const start =
        zonedDateTimeToUtc(
            year,
            month,
            day,
            0,
            0,
            timezone
        );

    const nextDate =
        new Date(
            Date.UTC(
                year,
                month - 1,
                day + 1
            )
        );

    const end =
        zonedDateTimeToUtc(
            nextDate.getUTCFullYear(),
            nextDate.getUTCMonth() +
                1,
            nextDate.getUTCDate(),
            0,
            0,
            timezone
        );

    return {
        start,
        end,
    };
}

function zonedDateTimeToUtc(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    timezone: string
) {
    let guess =
        Date.UTC(
            year,
            month - 1,
            day,
            hour,
            minute
        );

    for (
        let attempt = 0;
        attempt < 4;
        attempt++
    ) {
        const parts =
            getParts(
                new Date(guess),
                timezone
            );

        const desired =
            Date.UTC(
                year,
                month - 1,
                day,
                hour,
                minute
            );

        const actual =
            Date.UTC(
                parts.year,
                parts.month - 1,
                parts.day,
                parts.hour,
                parts.minute
            );

        const difference =
            desired - actual;

        guess += difference;

        if (difference === 0) {
            break;
        }
    }

    return new Date(guess);
}

function getParts(
    date: Date,
    timezone: string
) {
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

    function value(
        type:
            | "year"
            | "month"
            | "day"
            | "hour"
            | "minute"
    ) {
        return Number(
            parts.find(
                (part) =>
                    part.type === type
            )?.value
        );
    }

    return {
        year: value("year"),
        month: value("month"),
        day: value("day"),
        hour: value("hour"),
        minute: value("minute"),
    };
}