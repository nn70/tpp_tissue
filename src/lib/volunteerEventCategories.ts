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

export const DEFAULT_VOLUNTEER_EVENT_CATEGORY = VOLUNTEER_EVENT_CATEGORIES[0].label;

export type VolunteerEventCategory = typeof VOLUNTEER_EVENT_CATEGORIES[number]["label"];

export function normalizeVolunteerEventCategory(value: unknown): VolunteerEventCategory {
    if (typeof value !== "string") {
        return DEFAULT_VOLUNTEER_EVENT_CATEGORY;
    }

    const category = VOLUNTEER_EVENT_CATEGORIES.find((item) => item.label === value.trim());
    return category?.label ?? DEFAULT_VOLUNTEER_EVENT_CATEGORY;
}

export function getVolunteerEventCategoryImage(category: string | null | undefined) {
    const normalizedCategory = normalizeVolunteerEventCategory(category);
    return VOLUNTEER_EVENT_CATEGORIES.find((item) => item.label === normalizedCategory)?.imageUrl
        ?? VOLUNTEER_EVENT_CATEGORIES[0].imageUrl;
}

export function getVolunteerEventCoverImage(event: { coverImageUrl?: string | null; category?: string | null }) {
    return event.coverImageUrl?.trim() || getVolunteerEventCategoryImage(event.category);
}
