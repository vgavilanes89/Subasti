export const fetchNotifications = async () => {
    const res = await fetch('/api/notifications/list');
    if (!res.ok) throw new Error('Could not load notifications');
    return res.json();
};

export const markNotificationRead = async (id) => {
    const res = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
    });
    if (!res.ok) throw new Error('Could not mark notification read');
    return res.json();
};

export const markAllNotificationsRead = async () => {
    const res = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
    });
    if (!res.ok) throw new Error('Could not mark notifications read');
    return res.json();
};
