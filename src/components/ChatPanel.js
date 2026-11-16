import React, { useState, useEffect, useRef } from 'react';
import { useMessages } from '../context/MessagesContext';
import { useEnsureUsers } from '../lib/useEnsureUsers';
import Avatar from './Avatar';

const displayName = (userId, users, loc, role) => {
    if (!userId) return role === 'seller' ? (loc === 'en' ? 'Seller' : 'Vendedor') : (loc === 'en' ? 'Buyer' : 'Comprador');
    if (userId.startsWith('guest')) return loc === 'en' ? 'Guest buyer' : 'Comprador invitado';
    return users[userId]?.profileName || (loc === 'en' ? 'User' : 'Usuario');
};

const ChatPanel = ({
    loc,
    user,
    users,
    threads,
    role,
    activeThreadId,
    onSelectThread,
    compact = false,
    // collapsible: show a toggle bar so the chat doesn't take over the page.
    // defaultOpen: start expanded (e.g. the page was opened from a message link).
    collapsible = false,
    defaultOpen = false,
}) => {
    const { sendMessage, markRead } = useMessages();
    const [open, setOpen] = useState(() => {
        return !collapsible || defaultOpen;
    });

    // Other parts of the page (e.g. "Message seller") can ask for the chat to open.
    useEffect(() => {
        const openIt = () => setOpen(true);
        window.addEventListener('subasti:open-chat', openIt);
        return () => window.removeEventListener('subasti:open-chat', openIt);
    }, []);
    const [messageDraft, setMessageDraft] = useState('');
    const [sending, setSending] = useState(false);
    const chatEndRef = useRef(null);

    // 'mixed' (the unified Messages tab) shows both buyer and seller threads
    // together, so the buyer/seller perspective is derived per-thread from
    // who's on which side, instead of a single role fixed for the whole list.
    const roleFor = (thread) => (role === 'mixed'
        ? (thread.sellerId === user.id ? 'seller' : 'buyer')
        : role);

    const L = loc === 'en' ? {
        you: 'You',
        typeMessage: 'Type a message…',
        send: 'Send',
        noThreads: role === 'buyer'
            ? 'No conversations yet. Message a seller from any item page.'
            : role === 'seller'
                ? 'No conversations yet. Buyers can message you from your listings.'
                : 'No conversations yet.',
        emailNotify: "You'll get an email whenever someone sends you a new message.",
        withSeller: 'with seller',
        about: 'About',
        show: 'Show conversations',
        hide: 'Hide conversations',
    } : {
        you: 'Tú',
        typeMessage: 'Escribe un mensaje…',
        send: 'Enviar',
        noThreads: role === 'buyer'
            ? 'Aún no hay conversaciones. Escríbele a un vendedor desde la página del artículo.'
            : role === 'seller'
                ? 'Aún no hay conversaciones. Los compradores pueden escribirte desde tus publicaciones.'
                : 'Aún no hay conversaciones.',
        emailNotify: 'Recibirás un correo cada vez que alguien te envíe un mensaje nuevo.',
        withSeller: 'con el vendedor',
        about: 'Sobre',
        show: 'Mostrar conversaciones',
        hide: 'Ocultar conversaciones',
    };

    const activeThread = threads.find(t => t.id === activeThreadId);

    const threadLabel = (thread) => {
        if (roleFor(thread) === 'seller') return displayName(thread.buyerId, users, loc, 'buyer');
        return displayName(thread.sellerId, users, loc, 'seller');
    };

    useEnsureUsers(threads.map(t => (roleFor(t) === 'seller' ? t.buyerId : t.sellerId)));

    const counterpartOf = (thread) =>
        users[roleFor(thread) === 'seller' ? thread.buyerId : thread.sellerId];

    const unreadCount = (thread) =>
        roleFor(thread) === 'seller' ? (thread.unreadForSeller || 0) : (thread.unreadForBuyer || 0);

    useEffect(() => {
        if (open && activeThreadId && activeThread) markRead(activeThreadId, roleFor(activeThread));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, activeThreadId, activeThread?.messages?.length, role, markRead]);

    useEffect(() => {
        if (open) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [open, activeThread?.messages?.length, activeThreadId]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!activeThreadId || !messageDraft.trim() || sending) return;
        setSending(true);
        try {
            await sendMessage(activeThreadId, messageDraft);
            setMessageDraft('');
        } catch {
            // ignore
        } finally {
            setSending(false);
        }
    };

    if (!threads.length) {
        return <p className="text-sm text-gray-500">{L.noThreads}</p>;
    }

    const totalUnread = threads.reduce((sum, t) => sum + unreadCount(t), 0);

    return (
        <div className={`seller-chat-wrap ${compact ? 'seller-chat-wrap--compact' : ''}`}>
        {collapsible && (
            <button
                type="button"
                className="chat-toggle"
                aria-expanded={open}
                onClick={() => setOpen(o => !o)}
            >
                <span className="chat-toggle-label">
                    {open ? L.hide : `${L.show} (${threads.length})`}
                </span>
                {!open && totalUnread > 0 && <span className="chat-toggle-unread">{totalUnread}</span>}
                <span className="chat-toggle-chevron" aria-hidden>{open ? '▲' : '▼'}</span>
            </button>
        )}
        {open && (
        <div className={`seller-chat ${compact ? 'seller-chat--compact' : ''}`}>
            {!compact && threads.length > 1 && (
                <div className="seller-chat-threads">
                    {threads.map(thread => (
                        <button
                            key={thread.id}
                            type="button"
                            className={`seller-chat-thread ${activeThreadId === thread.id ? 'seller-chat-thread--active' : ''}`}
                            onClick={() => onSelectThread(thread.id)}
                        >
                            <span className="seller-chat-thread-title">{threadLabel(thread)}</span>
                            <span className="seller-chat-thread-item">{thread.itemTitle}</span>
                            {unreadCount(thread) > 0 && (
                                <span className="seller-chat-unread">{unreadCount(thread)}</span>
                            )}
                        </button>
                    ))}
                </div>
            )}
            {activeThread && (
                <div className="seller-chat-panel">
                    <div className="seller-chat-header">
                        <strong className="inline-flex items-center gap-2">
                            <Avatar name={threadLabel(activeThread)} src={counterpartOf(activeThread)?.avatarUrl} size={28} />
                            <span>
                                {roleFor(activeThread) === 'buyer'
                                    ? `${L.withSeller} ${threadLabel(activeThread)}`
                                    : threadLabel(activeThread)}
                            </span>
                        </strong>
                        <span className="text-sm text-gray-500">{L.about}: {activeThread.itemTitle}</span>
                        <p className="chat-email-notice">
                            <span className="chat-email-notice-icon" aria-hidden>✉</span>
                            {L.emailNotify}
                        </p>
                    </div>
                    <div className="seller-chat-messages">
                        {activeThread.messages.map(msg => {
                            const isMe = msg.from === user.id;
                            return (
                                <div
                                    key={msg.id}
                                    className={`seller-chat-bubble ${isMe ? 'seller-chat-bubble--me' : 'seller-chat-bubble--them'}`}
                                >
                                    <p className="seller-chat-meta">
                                        {isMe ? L.you : displayName(msg.from, users, loc, roleFor(activeThread) === 'seller' ? 'buyer' : 'seller')}
                                    </p>
                                    <p>{msg.text}</p>
                                </div>
                            );
                        })}
                        <div ref={chatEndRef} />
                    </div>
                    <form onSubmit={handleSend} className="seller-chat-compose">
                        <input
                            type="text"
                            value={messageDraft}
                            onChange={e => setMessageDraft(e.target.value)}
                            placeholder={L.typeMessage}
                            className="seller-input seller-input--grow"
                        />
                        <button type="submit" className="seller-action-btn" disabled={!messageDraft.trim() || sending}>
                            {L.send}
                        </button>
                    </form>
                </div>
            )}
        </div>
        )}
        </div>
    );
};

export default ChatPanel;
