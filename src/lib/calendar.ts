type CalendarEvent = {
    title: string;
    description: string | null;
    location: string | null;
    startsAt: string;
    endsAt: string | null;
};

function toGoogleCalendarDate(value: string) {
    return new Date(value).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export function buildGoogleCalendarUrl(event: CalendarEvent) {
    const start = toGoogleCalendarDate(event.startsAt);
    const fallbackEnd = new Date(new Date(event.startsAt).getTime() + 2 * 60 * 60 * 1000);
    const end = event.endsAt ? toGoogleCalendarDate(event.endsAt) : toGoogleCalendarDate(fallbackEnd.toISOString());

    const params = new URLSearchParams({
        action: "TEMPLATE",
        text: event.title,
        dates: `${start}/${end}`,
        details: event.description ?? "",
        location: event.location ?? "",
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function askToAddGoogleCalendar(event: CalendarEvent) {
    const shouldOpen = window.confirm("報名成功！要加入 Google Calendar 嗎？");
    if (shouldOpen) {
        window.open(buildGoogleCalendarUrl(event), "_blank", "noopener,noreferrer");
    }
}
