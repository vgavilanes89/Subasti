import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationsContext';
import { useMessages } from '../context/MessagesContext';

const timeAgo = (ms, loc) => {
    const diff = Date.now() - ms;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return loc === 'en' ? 'just now' : 'ahora mismo';
    if (minutes < 60) return loc === 'en' ? `${minutes}m ago` : `hace ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return loc === 'en' ? `${hours}h ago` : `hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return loc === 'en' ? `${days}d ago` : `hace ${days}d`;
};

const NotificationBell = ({ loc }) => {
    const [open, setOpen] = useState(false);
    const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
    const { unreadSellerCount, unreadBuyerCount } = useMessages();
    const navigate = useNavigate();

    const unreadMessages = unreadSellerCount + unreadBuyerCount;
    const totalBadge = unreadCount + unreadMessages;

    const L = loc === 'en' ? {
        label: 'Notifications',
        empty: 'No notifications yet.',
        markAll: 'Mark all read',
        viewMessages: 'View all in Messages',
        newMessages: (n) => `${n} new message${n === 1 ? '' : 's'}`,
    } : {
        label: 'Notificaciones',
        empty: 'Aún no hay notificaciones.',
        markAll: 'Marcar todas leídas',
        viewMessages: 'Ver todo en Mensajes',
        newMessages: (n) => `${n} mensaje${n === 1 ? '' : 's'} nuevo${n === 1 ? '' : 's'}`,
    };

    const handleItemClick = (notif) => {
        setOpen(false);
        if (!notif.read) markRead(notif.id);
        if (notif.link) navigate(notif.link);
    };

    const handleViewMessages = () => {
        setOpen(false);
        navigate('/profile?tab=messages');
    };

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="relative p-2 text-gray-600 hover:text-purple-600"
                aria-label={L.label}
                aria-expanded={open}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
                {totalBadge > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {totalBadge > 9 ? '9+' : totalBadge}
                    </span>
                )}
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50 max-h-96 overflow-y-auto">
                        <div className="flex items-center justify-between px-4 py-3 border-b">
                            <h3 className="font-bold text-gray-800">{L.label}</h3>
                            {unreadCount > 0 && (
                                <button type="button" onClick={markAllRead} className="text-xs font-semibold text-purple-600 hover:underline">
                                    {L.markAll}
                                </button>
                            )}
                        </div>
                        {unreadMessages > 0 && (
                            <button
                                type="button"
                                onClick={handleViewMessages}
                                className="w-full text-left px-4 py-3 border-b bg-purple-50 hover:bg-purple-100 transition-colors"
                            >
                                <p className="text-sm font-semibold text-purple-700">{L.newMessages(unreadMessages)}</p>
                            </button>
                        )}
                        {notifications.length === 0 ? (
                            <p className="text-sm text-gray-500 px-4 py-6 text-center">{L.empty}</p>
                        ) : (
                            notifications.slice(0, 10).map((notif) => (
                                <button
                                    key={notif.id}
                                    type="button"
                                    onClick={() => handleItemClick(notif)}
                                    className={`w-full text-left px-4 py-3 border-b hover:bg-gray-50 transition-colors ${notif.read ? '' : 'bg-blue-50'}`}
                                >
                                    <div className="flex items-start gap-2">
                                        {!notif.read && <span className="mt-1.5 w-2 h-2 rounded-full bg-purple-600 flex-shrink-0" />}
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-800">{notif.title}</p>
                                            {notif.body && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.body}</p>}
                                            <p className="text-xs text-gray-400 mt-1">{timeAgo(notif.createdAt, loc)}</p>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                        <button
                            type="button"
                            onClick={handleViewMessages}
                            className="w-full text-center px-4 py-3 text-sm font-semibold text-purple-600 hover:bg-gray-50"
                        >
                            {L.viewMessages}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationBell;
