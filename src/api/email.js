let EMAIL_LOG = [];

export const getEmailLog = () => [...EMAIL_LOG];

export const sendMessageNotification = async ({
    toEmail,
    toName,
    fromName,
    itemTitle,
    messageText,
    threadId,
    direction,
}) => {
    await new Promise(r => setTimeout(r, 80));
    const entry = {
        id: `email_${Date.now()}`,
        at: Date.now(),
        toEmail,
        toName,
        fromName,
        itemTitle,
        messageText,
        threadId,
        direction,
        subject: direction === 'to_seller'
            ? `New message about "${itemTitle}" on Subasti`
            : `Reply from ${fromName} about "${itemTitle}"`,
    };
    EMAIL_LOG = [entry, ...EMAIL_LOG].slice(0, 50);
    return entry;
};

export const ingestEmailReply = async ({ threadId, fromEmail, text, users }) => {
    await new Promise(r => setTimeout(r, 100));
    const user = Object.values(users).find(u => u.email === fromEmail);
    if (!user) throw new Error('EMAIL_NOT_REGISTERED');
    return { fromUserId: user.id, text: text.trim() };
};
