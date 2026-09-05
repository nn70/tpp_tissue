export const VOLUNTEER_EVENT_CATEGORIES = [
    {
        label: "站路口",
        imageUrl: "/event-category-defaults/street-corner.jpg",
    },
    {
        label: "追垃圾車",
        imageUrl: "/event-category-defaults/garbage-truck.jpg",
    },
    {
        label: "掃菜市場",
        imageUrl: "/event-category-defaults/market.jpg",
    },
    {
        label: "里民活動",
        imageUrl: "/event-category-defaults/community.jpg",
    },
    {
        label: "輔選",
        imageUrl: "/event-category-defaults/campaign.jpg",
    },
] as const;

export type VolunteerEventCategory = typeof VOLUNTEER_EVENT_CATEGORIES[number]["label"];

export function normalizeVolunteerEventCategory(value: unknown): VolunteerEventCategory | null {
    if (typeof value !== "string") {
        return null;
    }

    const category = VOLUNTEER_EVENT_CATEGORIES.find((item) => item.label === value.trim());
    return category?.label ?? null;
}

export function getVolunteerEventCategoryImage(category: string | null | undefined) {
    const normalizedCategory = normalizeVolunteerEventCategory(category);
    return normalizedCategory
        ? VOLUNTEER_EVENT_CATEGORIES.find((item) => item.label === normalizedCategory)?.imageUrl ?? null
        : null;
}

export function getVolunteerEventCoverImage(event: { coverImageUrl?: string | null; category?: string | null }) {
    return event.coverImageUrl?.trim() || getVolunteerEventCategoryImage(event.category);
}
