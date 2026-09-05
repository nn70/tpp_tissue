const TAIPEI_TIME_ZONE = "Asia/Taipei";
const TAIPEI_OFFSET = "+08:00";

export function parseTaipeiDateTimeInput(value: string) {
    return new Date(value.includes("T") && !/[zZ]|[+-]\d{2}:\d{2}$/.test(value) ? `${value}${TAIPEI_OFFSET}` : value);
}

export function formatTaipeiDateTimeInputValue(value: string | Date | null | undefined) {
    if (!value) return "";

    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: TAIPEI_TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).formatToParts(new Date(value));
    const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";

    return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

export const taipeiDateTimeFormatOptions = {
    timeZone: TAIPEI_TIME_ZONE,
} as const;
