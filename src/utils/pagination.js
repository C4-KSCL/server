export default function pagination(chatId, limit) {
    const chat = Number(chatId) || 0;
    const take = Number(limit) || 20;
    return { chat, take };
}
