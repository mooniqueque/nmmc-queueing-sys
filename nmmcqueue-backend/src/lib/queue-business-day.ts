const BUSINESS_TIME_ZONE = 'Asia/Manila';

export function getQueueBusinessDay(date = new Date()): string {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: BUSINESS_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });

    return formatter.format(date);
}

export function getBusinessTimeZone() {
    return BUSINESS_TIME_ZONE;
}
