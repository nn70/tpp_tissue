export function normalizePhone(phone: string) {
    return phone.replace(/[^\d+]/g, "").replace(/^\+886/, "0");
}

export function isValidPhone(phone: string) {
    return normalizePhone(phone).replace(/\D/g, "").length >= 8;
}
